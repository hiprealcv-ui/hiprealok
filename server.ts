import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load local environment files next to the runner / executable
dotenv.config();

// Initialize Gemini API client if key is provided
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set. AI features might be disabled.");
  }
} catch (err) {
  console.error("❌ Failed to initialize Google Gen AI SDK:", err);
}

const app = express();
const PORT = 3000;

// High limits to accommodate base64 images and video media uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API ROUTES ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// Draft clean Facebook post captions using Gemini API
app.post("/api/gemini/generate-caption", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Dịch vụ AI chưa cấu hình. Hãy thêm GEMINI_API_KEY trong cài đặt Secrets." });
  }

  const { topic, tone, withEmojis, withHashtags, customPrompt } = req.body;

  if (!topic && !customPrompt) {
    return res.status(400).json({ error: "Thiếu thông tin chủ đề hoặc yêu cầu tùy chỉnh." });
  }

  try {
    let promptText = "";
    if (customPrompt) {
      promptText = `Viết một bài đăng (post) Facebook theo yêu cầu sau: "${customPrompt}".\n`;
    } else {
      promptText = `Viết một bài đăng (post) Facebook cực kỳ hấp dẫn về chủ đề: "${topic}".\n`;
    }

    promptText += `- Tông giọng truyền tải: ${tone || 'vui vẻ, bắt trend'}.\n`;
    promptText += `- Có sử dụng Emoji (biểu tượng cảm xúc) phù hợp không: ${withEmojis !== false ? 'Có cấu trúc đa dạng emoji' : 'Không dùng emoji'}.\n`;
    promptText += `- Có bao gồm Hashtags ở cuối bài không: ${withHashtags !== false ? 'Có, tối ưu hóa các hashtag phổ biến liên quan' : 'Không cần viết hashtag'}.\n`;
    promptText += `- Ngôn ngữ: Tiếng Việt tự nhiên, phù hợp với mạng xã hội, thu hút tương tác tốt, không viết các đoạn rườm rà.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });

    res.json({ caption: response.text });
  } catch (error: any) {
    console.error("Error generating caption:", error);
    res.status(500).json({ error: error?.message || "Lỗi tạo nội dung từ AI." });
  }
});

// Generate creative images using Gemini 2.5 Image model
app.post("/api/gemini/generate-image", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Dịch vụ AI chưa cấu hình. Hãy thêm GEMINI_API_KEY trong cài đặt Secrets." });
  }

  const { prompt, aspectRatio } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Vui lòng nhập mô tả ảnh mong muốn." });
  }

  try {
    const formattedPrompt = `${prompt}, high quality professional social media post creative graphic card design, sleek illustration or photography, clear composition, vibrant lighting.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: formattedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
        }
      }
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("Không thể trích xuất dữ liệu ảnh từ mô hình AI.");
    }

    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: error?.message || "Lỗi tạo hình ảnh từ AI." });
  }
});

// Facebook Page Auto Poster route
app.post("/api/facebook/post", async (req, res) => {
  const { pageId, pageName, token, isSimulated, type, message, mediaUrl, mediaFileBase64, mediaFileName } = req.body;

  if (!pageId || (!isSimulated && !token)) {
    return res.status(400).json({ error: "Thiếu Page ID hoặc Access Token để thực hiện đăng bài." });
  }

  // Handle Simulation Mode
  if (isSimulated) {
    // Artificial delay of 1.2s to simulate real-world API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Check if error is deliberately simulated or succeed naturally
    if (pageId === "error-trigger") {
      return res.json({
        pageId,
        pageName,
        isSimulated: true,
        status: "failed",
        error: "Mã lỗi OAuth (100): Page Access Token has expired or is invalid.",
      });
    }

    const randomPostId = `${pageId}_${Math.floor(Math.random() * 100000000000000)}`;
    return res.json({
      pageId,
      pageName,
      isSimulated: true,
      status: "success",
      facebookPostId: randomPostId,
    });
  }

  // Handle REAL posting
  try {
    let responseData: any = {};
    
    if (type === 'text') {
      const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      const queryParams = new URLSearchParams({
        message: message || '',
        access_token: token,
      });

      const response = await fetch(`${fbUrl}?${queryParams.toString()}`, {
        method: 'POST',
      });
      responseData = await response.json();
    } 
    else if (type === 'image') {
      const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      
      if (mediaFileBase64) {
        // Multipart upload for actual uploaded or ai-generated base64 image content
        // Extract raw base64 data and mime type
        const matches = mediaFileBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        let base64Data = mediaFileBase64;
        let mimeType = 'image/png';
        
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        
        formData.append('source', blob, mediaFileName || 'image_post.png');
        formData.append('caption', message || '');
        formData.append('access_token', token);

        const response = await fetch(fbUrl, {
          method: 'POST',
          body: formData,
        });
        responseData = await response.json();
      } else if (mediaUrl) {
        // Post photo using dynamic public web URL
        const queryParams = new URLSearchParams({
          url: mediaUrl,
          caption: message || '',
          access_token: token,
        });

        const response = await fetch(`${fbUrl}?${queryParams.toString()}`, {
          method: 'POST',
        });
        responseData = await response.json();
      } else {
        throw new Error("Không có tệp ảnh hoặc liên kết ảnh cho bài viết hình ảnh.");
      }
    } 
    else if (type === 'video') {
      const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/videos`;

      if (mediaFileBase64) {
        // Multipart upload for video
        const matches = mediaFileBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        let base64Data = mediaFileBase64;
        let mimeType = 'video/mp4';
        
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        
        formData.append('source', blob, mediaFileName || 'video_post.mp4');
        formData.append('description', message || '');
        formData.append('access_token', token);

        const response = await fetch(fbUrl, {
          method: 'POST',
          body: formData,
        });
        responseData = await response.json();
      } else if (mediaUrl) {
        const queryParams = new URLSearchParams({
          file_url: mediaUrl,
          description: message || '',
          access_token: token,
        });

        const response = await fetch(`${fbUrl}?${queryParams.toString()}`, {
          method: 'POST',
        });
        responseData = await response.json();
      } else {
        throw new Error("Không có tệp video hoặc liên kết video cho bài viết video.");
      }
    }

    if (responseData.error) {
      return res.json({
        pageId,
        pageName,
        isSimulated: false,
        status: "failed",
        error: responseData.error.message || `Lỗi Facebook Graph API (${responseData.error.code}): ${responseData.error.type}`,
      });
    }

    return res.json({
      pageId,
      pageName,
      isSimulated: false,
      status: "success",
      facebookPostId: responseData.id || responseData.post_id,
    });

  } catch (error: any) {
    console.error("Facebook post direct API failure:", error);
    return res.json({
      pageId,
      pageName,
      isSimulated: false,
      status: "failed",
      error: error?.message || "Không thể kết nối hoặc tải tệp lên Facebook Graph API.",
    });
  }
});

// --- FRAMEWORK MIDDLEWARE ENVIRONMENT HANDLERS ---

async function bootServer() {
  const isPackaged = !!(process as any).pkg;

  if (process.env.NODE_ENV !== "production" && !isPackaged) {
    // Dev: Vite middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production / Packaged: Serve ready static assets
    const distPath = isPackaged 
      ? __dirname 
      : path.join(process.cwd(), 'dist');
      
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n==================================================================`);
    console.log(`🚀 FB-Auto Poster Server is running perfectly on ${url}`);
    console.log(`==================================================================\n`);

    // Automatically open browser on startup in production / packaged mode
    if (process.env.NODE_ENV === "production" || isPackaged) {
      setTimeout(async () => {
        try {
          const { exec } = await import("child_process");
          if (process.platform === "win32") {
            exec(`start ${url}`);
          } else if (process.platform === "darwin") {
            exec(`open ${url}`);
          } else {
            exec(`xdg-open ${url}`);
          }
        } catch (err) {
          console.warn("Failed to automatically open browser:", err);
        }
      }, 1000);
    }
  });
}

bootServer();
