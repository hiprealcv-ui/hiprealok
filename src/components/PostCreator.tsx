import React, { useState, useRef } from 'react';
import { 
  FileText, Image as ImageIcon, Video, Sparkles, Send, RefreshCw, 
  Check, AlertTriangle, CloudLightning, Compass, Eye, Upload, Link2, Key
} from 'lucide-react';
import { FacebookPage, DraftPost, PostType, PagePostResult } from '../types';

interface PostCreatorProps {
  pages: FacebookPage[];
  onPublishStart: () => void;
  onPublishProgress: (pageId: string, status: 'success' | 'failed', fbId?: string, error?: string) => void;
  onPublishEnd: (message: string, type: PostType, mediaUrl: string, results: PagePostResult[]) => void;
}

export default function PostCreator({ pages, onPublishStart, onPublishProgress, onPublishEnd }: PostCreatorProps) {
  // Post states
  const [postType, setPostType] = useState<PostType>('text');
  const [message, setMessage] = useState('');
  
  // Media files states
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFileBase64, setMediaFileBase64] = useState<string>('');
  const [mediaFileName, setMediaFileName] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string>('');
  
  // Selection
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  
  // AI Caption states
  const [showAiCaption, setShowAiCaption] = useState(false);
  const [captionTopic, setCaptionTopic] = useState('');
  const [captionTone, setCaptionTone] = useState('vui vẻ, bắt trend');
  const [withEmojis, setWithEmojis] = useState(true);
  const [withHashtags, setWithHashtags] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiGeneratingCaption, setAiGeneratingCaption] = useState(false);
  const [generatedCaptionResult, setGeneratedCaptionResult] = useState('');
  const [aiCaptionError, setAiCaptionError] = useState('');

  // AI Image generation states
  const [showAiImage, setShowAiImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspect, setImageAspect] = useState('1:1');
  const [aiGeneratingImage, setAiGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [aiImageError, setAiImageError] = useState('');

  // Local file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status logs while posting
  const [isPosting, setIsPosting] = useState(false);
  const [postingStatusList, setPostingStatusList] = useState<Array<{
    pageId: string;
    pageName: string;
    status: 'pending' | 'posting' | 'success' | 'failed';
    error?: string;
    postId?: string;
  }>>([]);

  // Auto-select pages on mount or change
  React.useEffect(() => {
    if (pages.length > 0 && selectedPageIds.length === 0) {
      setSelectedPageIds(pages.map(p => p.id));
    }
  }, [pages]);

  // Handle local image/video attachments upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFileName(file.name);
    
    // File validation
    if (postType === 'image' && !file.type.startsWith('image/')) {
      alert("Vui lòng đính kèm tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP)");
      return;
    }
    if (postType === 'video' && !file.type.startsWith('video/')) {
      alert("Vui lòng đính kèm tệp video hợp lệ (MP4, MOV)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaFileBase64(reader.result);
        setMediaPreview(reader.result);
        setMediaUrl(''); // Reset url mode
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePageToggle = (pageId: string) => {
    if (selectedPageIds.includes(pageId)) {
      setSelectedPageIds(selectedPageIds.filter(id => id !== pageId));
    } else {
      setSelectedPageIds([...selectedPageIds, pageId]);
    }
  };

  const handleSelectAllPages = () => {
    if (selectedPageIds.length === pages.length) {
      setSelectedPageIds([]);
    } else {
      setSelectedPageIds(pages.map(p => p.id));
    }
  };

  // call server-side caption generator
  const handleGenerateCaption = async () => {
    setAiGeneratingCaption(true);
    setAiCaptionError('');
    try {
      const response = await fetch('/api/gemini/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: captionTopic,
          tone: captionTone,
          withEmojis,
          withHashtags,
          customPrompt: customPrompt.trim() !== '' ? customPrompt : undefined
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setGeneratedCaptionResult(data.caption);
      } else {
        setAiCaptionError(data.error || "Gặp sự cố khi sinh caption.");
      }
    } catch (err: any) {
      setAiCaptionError(err?.message || "Lỗi mạng hoặc không thể kết nối server AI.");
    } finally {
      setAiGeneratingCaption(false);
    }
  };

  // call server-side image generator inside Gemini 2.5
  const handleGenerateImage = async () => {
    setAiGeneratingImage(true);
    setAiImageError('');
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspect
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        setAiImageError(data.error || "Mô hình AI không phản hồi ảnh chụp.");
      }
    } catch (err: any) {
      setAiImageError(err?.message || "Lỗi mạng trong quá trình tải ảnh.");
    } finally {
      setAiGeneratingImage(false);
    }
  };

  const applyAiCaption = () => {
    setMessage(generatedCaptionResult);
    setShowAiCaption(false);
  };

  const applyAiImage = () => {
    setMediaFileBase64(generatedImageUrl);
    setMediaPreview(generatedImageUrl);
    setMediaFileName('ai-generated-design.png');
    setMediaUrl('');
    setShowAiImage(false);
  };

  // Bulk Publisher Trigger Loop
  const handleBulkPublish = async () => {
    if (selectedPageIds.length === 0) {
      alert("Vui lòng tích chọn ít nhất 1 Fanpage đích để thực hiện.");
      return;
    }
    if (!message.trim() && postType === 'text') {
      alert("Hãy nhập nội dung thông điệp bạn muốn đăng tải.");
      return;
    }
    if (postType === 'image' && !mediaPreview && !mediaUrl) {
      alert("Bạn chọn đăng ảnh, vui lòng tải ảnh lên hoặc điền URL ảnh công khai.");
      return;
    }
    if (postType === 'video' && !mediaFileBase64 && !mediaUrl) {
      alert("Bạn chọn video, vui lòng đính kèm tệp video hoặc có URL video công khai.");
      return;
    }

    onPublishStart();
    setIsPosting(true);

    // Build initial status array
    const targetPages = pages.filter(p => selectedPageIds.includes(p.id));
    const list = targetPages.map(page => ({
      pageId: page.id,
      pageName: page.name,
      status: 'pending' as const,
    }));
    setPostingStatusList(list);

    const uploadedMediaUrl = mediaUrl.trim() ? mediaUrl : '';

    // Loop through target channels
    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      
      // Update this page status as "posting"
      setPostingStatusList(prev => prev.map(item => 
        item.pageId === page.id ? { ...item, status: 'posting' } : item
      ));

      try {
        const response = await fetch('/api/facebook/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: page.id,
            pageName: page.name,
            token: page.token,
            isSimulated: page.isSimulated !== false,
            type: postType,
            message: message,
            mediaUrl: uploadedMediaUrl || undefined,
            mediaFileBase64: mediaFileBase64 || undefined,
            mediaFileName: mediaFileName || undefined
          }),
        });

        const data = await response.json();

        // Register progression results back to list
        setPostingStatusList(prev => prev.map(item => {
          if (item.pageId === page.id) {
            return {
              ...item,
              status: data.status === 'success' ? 'success' : 'failed',
              postId: data.facebookPostId,
              error: data.error
            };
          }
          return item;
        }));

        onPublishProgress(
          page.id, 
          data.status === 'success' ? 'success' : 'failed',
          data.facebookPostId,
          data.error
        );

      } catch (err: any) {
        setPostingStatusList(prev => prev.map(item => 
          item.pageId === page.id ? { ...item, status: 'failed', error: err?.message || "Lỗi truyền tải mạng." } : item
        ));
        onPublishProgress(page.id, 'failed', undefined, err?.message || "Lỗi kết nối.");
      }
    }

    setIsPosting(false);
    
    const finalResults: PagePostResult[] = postingStatusList.map(item => ({
      pageId: item.pageId,
      pageName: item.pageName,
      isSimulated: pages.find(p => p.id === item.pageId)?.isSimulated !== false,
      status: item.status === 'success' ? 'success' : 'failed',
      facebookPostId: item.postId,
      error: item.error
    }));

    onPublishEnd(
      message, 
      postType, 
      uploadedMediaUrl || mediaFileName || '', 
      finalResults
    );
  };

  return (
    <div id="post-creator-box" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Content Drafting Form */}
      <div id="post-creator-form" className="lg:col-span-2 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-500 shrink-0" />
              Soạn thảo nội dung bài đăng
            </h2>
            <div className="bg-neutral-950 p-1.5 rounded-2xl flex border border-neutral-800 items-center">
              <button
                id="type-text-btn"
                type="button"
                onClick={() => { setPostType('text'); setMediaPreview(''); setMediaFileBase64(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition ${postType === 'text' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Text Post
              </button>
              <button
                id="type-image-btn"
                type="button"
                onClick={() => { setPostType('image'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition ${postType === 'image' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Đăng Ảnh
              </button>
              <button
                id="type-video-btn"
                type="button"
                onClick={() => { setPostType('video'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition ${postType === 'video' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
              >
                <Video className="w-3.5 h-3.5" />
                Nội dung Video
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Input Message Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Nội dung bài viết (Caption)</label>
                <button
                  id="trigger-ai-caption-btn"
                  type="button"
                  onClick={() => setShowAiCaption(!showAiCaption)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 hover:bg-blue-900/60 rounded-full border border-blue-800 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  Sử dụng trợ lý AI tạo Content
                </button>
              </div>

              {/* Caption Assistant Panel Inline */}
              {showAiCaption && (
                <div id="ai-caption-advisor" className="bg-slate-950 border border-blue-900/60 rounded-xl p-4 mb-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      Trợ lý Sáng tạo Caption Tiếng Việt
                    </span>
                    <button onClick={() => setShowAiCaption(false)} className="text-slate-500 hover:text-white text-xs">Đóng</button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Chủ đề viết bài hoặc ý tưởng ban đầu</label>
                      <input
                        id="ai-topic-input"
                        type="text"
                        value={captionTopic}
                        onChange={(e) => setCaptionTopic(e.target.value)}
                        placeholder="Ví dụ: Giảm giá sâu 50% thời trang hè trẻ trung năng động"
                        className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Tông giọng bài đăng</label>
                        <select
                          id="ai-tone-select"
                          value={captionTone}
                          onChange={(e) => setCaptionTone(e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                        >
                          <option value="vui vẻ, bắt trend">Hài hước, bắt trend hot</option>
                          <option value="chuyên nghiệp, trang trọng">Chuyên nghiệp, sâu sắc</option>
                          <option value="kích thích mua hàng, cấp bách">Kêu gọi giảm giá, cấp bách</option>
                          <option value="gây tò mò, kịch tính">Gây tò mò, đặt câu hỏi</option>
                          <option value="kể chuyện (storytelling) chạm cảm xúc">Tâm sự kể chuyện (Storytelling)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4 pt-4 shrink-0">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                          <input type="checkbox" checked={withEmojis} onChange={(e) => setWithEmojis(e.target.checked)} className="rounded text-blue-600 focus:ring-0 bg-slate-900" />
                          Chèn Emoji
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                          <input type="checkbox" checked={withHashtags} onChange={(e) => setWithHashtags(e.target.checked)} className="rounded text-blue-600 focus:ring-0 bg-slate-900" />
                          Thêm Hashtags
                        </label>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Hoặc đưa mệnh lệnh tùy chọn đầy đủ</label>
                      <textarea
                        id="ai-custom-prompt"
                        rows={2}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Nhập yêu cầu riêng cho AI (Ví dụ: Viết một lời chúc sáng thứ Hai tuyệt vời đầy ý nghĩa cho bạn hàng thiết kế...)"
                        className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {aiCaptionError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {aiCaptionError}
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      id="draft-content-ai-btn"
                      type="button"
                      onClick={handleGenerateCaption}
                      disabled={aiGeneratingCaption || (!captionTopic && !customPrompt)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {aiGeneratingCaption ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {aiGeneratingCaption ? "AI đang lập luận..." : "Sinh Caption đỉnh cao"}
                    </button>
                    {generatedCaptionResult && (
                      <span className="text-[10px] text-slate-500 italic">Đã tạo caption mẫu bên dưới</span>
                    )}
                  </div>

                  {generatedCaptionResult && (
                    <div id="ai-caption-preview-box" className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                      <p className="text-xs text-slate-400 font-medium">Bản thảo gợi ý từ Gemini:</p>
                      <div className="text-xs text-slate-200 whitespace-pre-line max-h-36 overflow-y-auto bg-slate-950 p-2.5 rounded border border-slate-800">
                        {generatedCaptionResult}
                      </div>
                      <div className="flex justify-end">
                        <button
                          id="apply-caption-btn"
                          type="button"
                          onClick={applyAiCaption}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[11px] font-bold text-white transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Áp dụng bản thảo này
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <textarea
                id="post-message-textarea"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nội dung truyền tải viết ở đây... Bạn có thể tự viết hoặc tận dụng trợ lực Trình soạn thảo AI bên trên để bài viết đạt điểm thu hút tuyệt đối!"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
              />
            </div>

            {/* Media Upload and Management */}
            {postType !== 'text' && (
              <div id="media-attachment-section" className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    {postType === 'image' ? <ImageIcon className="w-4 h-4 text-blue-400" /> : <Video className="w-4 h-4 text-amber-400" />}
                    Cấu hình tệp đính kèm ({postType === 'image' ? "HÌNH ẢNH" : "VIDEO"})
                  </h3>
                  {postType === 'image' && (
                    <button
                      id="trigger-ai-image-btn"
                      type="button"
                      onClick={() => setShowAiImage(!showAiImage)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-900/30 hover:bg-amber-900/50 rounded-full border border-amber-800 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                      Thiết kế ảnh bằng AI
                    </button>
                  )}
                </div>

                {/* AI Image Designer Modal Drawer */}
                {showAiImage && postType === 'image' && (
                  <div id="ai-image-designer" className="bg-slate-900 border border-amber-900/40 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        AI Designer Suite (Gemini 2.5 Image)
                      </span>
                      <button onClick={() => setShowAiImage(false)} className="text-slate-500 hover:text-white text-xs">Đóng</button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Nhập mô tả tấm ảnh bạn khát khao thiết kế</label>
                        <input
                          id="ai-image-prompt"
                          type="text"
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          placeholder="Ví dụ: A vibrant summer sale banner showcasing footwear on dynamic neon background"
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between gap-10">
                        <span className="text-[10px] text-slate-400">Tỷ lệ khung hình:</span>
                        <div className="grid grid-cols-4 gap-1">
                          {["1:1", "4:3", "16:9", "9:16"].map((ratio) => (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setImageAspect(ratio)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${imageAspect === ratio ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {aiImageError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {aiImageError}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <button
                        id="generate-image-ai-btn"
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={aiGeneratingImage || !imagePrompt}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                      >
                        {aiGeneratingImage ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {aiGeneratingImage ? "Đang phác thảo..." : "Khởi tạo tác phẩm nghệ thuật"}
                      </button>
                    </div>

                    {generatedImageUrl && (
                      <div id="ai-image-render" className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="relative rounded overflow-hidden border border-slate-800 max-w-xs mx-auto bg-slate-950">
                          <img
                            src={generatedImageUrl}
                            alt="Gemini Design Preview"
                            className="w-full h-auto object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            id="apply-ai-image-btn"
                            type="button"
                            onClick={applyAiImage}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[11px] font-bold text-white transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Đính kèm ảnh nghệ thuật này
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload option */}
                  <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl p-4 flex flex-col items-center justify-center p-6 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={postType === 'image' ? "image/*" : "video/*"}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-300 font-semibold">Tải lên từ thiết bị của bạn</span>
                    <p className="text-[10px] text-slate-500 mt-1 mb-3">Hỗ trợ định dạng chuẩn chất lượng cao</p>
                    <button
                      id="select-file-man-btn"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Chọn tệp đính kèm
                    </button>
                  </div>

                  {/* URL path option */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5 text-blue-400" />
                        Hoặc điền URL File Công Khai
                      </span>
                      <p className="text-[10px] text-slate-500">Facebook cần tải được ảnh từ đường dẫn CDN này</p>
                    </div>
                    <input
                      id="media-url-path-input"
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => {
                        setMediaUrl(e.target.value);
                        setMediaFileBase64('');
                        setMediaPreview(e.target.value);
                      }}
                      placeholder="https://example.com/asset-social.jpg"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Live attachment review */}
                {mediaPreview && (
                  <div id="media-live-attachment" className="pt-3 border-t border-neutral-850 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 font-sans">
                      <div className="w-12 h-12 rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden shrink-0 flex items-center justify-center font-sans">
                        {postType === 'image' ? (
                          <img src={mediaPreview} alt="Review" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Video className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                          <Check className="w-2.5 h-2.5 shrink-0" />
                          ĐÃ ĐÍNH KÈM TÀI NGUYÊN
                        </span>
                        <p className="text-[10px] text-neutral-550 truncate max-w-[200px] sm:max-w-xs">{mediaFileName || mediaUrl || "Dữ liệu dạng base64"}</p>
                      </div>
                    </div>
                    <button
                      id="remove-media-btn"
                      type="button"
                      onClick={() => { setMediaPreview(''); setMediaFileBase64(''); setMediaUrl(''); setMediaFileName(''); }}
                      className="text-xs text-neutral-500 hover:text-red-400 cursor-pointer font-mono"
                    >
                      Gỡ bỏ [x]
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Channels checklist and Bulk Posting triggers */}
      <div id="target-channel-box" className="space-y-6 font-sans">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500 shrink-0" />
                Kênh xuất bản ({selectedPageIds.length}/{pages.length})
              </h3>
              {pages.length > 0 && (
                <button
                  id="select-all-pages-toggle"
                  type="button"
                  onClick={handleSelectAllPages}
                  className="text-xs text-blue-400 hover:text-blue-350 font-semibold font-mono cursor-pointer"
                >
                  {selectedPageIds.length === pages.length ? "Hủy chọn" : "Chọn hết"}
                </button>
              )}
            </div>

            {pages.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs font-medium leading-relaxed">
                Vui lòng cấu hình ít nhất 1 Fanpage Facebook tại tab Cấu hình để lên danh sách kênh đích đăng tải nội dung.
              </div>
            ) : (
              <div id="target-page-checklist" className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {pages.map((page) => (
                  <label
                    key={page.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition duration-150 cursor-pointer select-none group ${selectedPageIds.includes(page.id) ? 'border-blue-500/20 bg-blue-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/20'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedPageIds.includes(page.id)}
                        onChange={() => handlePageToggle(page.id)}
                        className="rounded text-blue-600 focus:ring-0 w-4 h-4 bg-neutral-950 border-neutral-800 cursor-pointer"
                      />
                      <span className="text-xs text-neutral-250 font-medium truncate group-hover:text-white transition duration-100">{page.name}</span>
                    </div>
                    {page.isSimulated !== false ? (
                      <span className="px-1.5 py-0.5 bg-emerald-500/5 text-emerald-400 rounded border border-emerald-500/10 text-[9px] font-bold font-mono">
                        DEMO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-500/5 text-amber-400 rounded border border-amber-500/10 text-[9px] font-bold font-mono">
                        REAL
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-neutral-800 mt-6 space-y-4">
            <button
              id="bulk-publish-btn"
              type="button"
              onClick={handleBulkPublish}
              disabled={isPosting || pages.length === 0 || selectedPageIds.length === 0}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isPosting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang khởi phát tiến trình...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Bắt đầu đăng đồng loạt ({selectedPageIds.length})
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-neutral-500 leading-relaxed font-mono">
              * Tần suất đăng được phân luồng tối ưu bảo mật tuyệt đối, giảm thiểu bộ lọc spam vượt trội.
            </p>
          </div>
        </div>
      </div>
      {/* Bulk Progress Overlay Log Modal */}
      {postingStatusList.length > 0 && (
        <div id="bulk-progress-modal" className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <CloudLightning className="w-5 h-5 text-blue-500 animate-bounce" />
                <h3 className="text-base font-bold font-display text-white">Xuất bản tuyến bài đồng loạt</h3>
              </div>
              {!isPosting && (
                <button
                  id="close-progress-modal"
                  onClick={() => setPostingStatusList([])}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Xong
                </button>
              )}
            </div>

            <div className="space-y-2 py-1 max-h-[300px] overflow-y-auto pr-1">
              {postingStatusList.map((item) => (
                <div
                  key={item.pageId}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800"
                >
                  <div className="min-w-0 pr-3">
                    <span className="text-xs font-semibold text-neutral-200 block truncate leading-tight">{item.pageName}</span>
                    <span className="text-[9px] text-neutral-500 font-mono">ID: {item.pageId}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'pending' && (
                      <span className="text-xs text-neutral-500 italic flex items-center gap-1.5 font-mono"><span className="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>Đang đợi...</span>
                    )}
                    {item.status === 'posting' && (
                      <span className="text-xs text-blue-400 font-semibold flex items-center gap-1.5 font-mono"><RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />Đang đăng...</span>
                    )}
                    {item.status === 'success' && (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono"><Check className="w-4 h-4 text-emerald-400" />OK</span>
                        {item.postId && (
                          <span className="text-[8px] font-mono text-neutral-500">UID: {item.postId.slice(0, 18)}...</span>
                        )}
                      </div>
                    )}
                    {item.status === 'failed' && (
                      <div className="flex flex-col items-end max-w-[180px]">
                        <span className="text-xs text-red-400 font-bold flex items-center gap-1 font-mono"><AlertTriangle className="w-4 h-4 text-red-400" />Lỗi</span>
                        {item.error && (
                          <span className="text-[8px] text-red-500 text-right truncate w-full font-mono" title={item.error}>{item.error}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-2 border-t border-neutral-850">
              {isPosting ? (
                <span className="text-xs text-neutral-400 animate-pulse font-mono">Vui lòng chờ, hệ thống đang làm việc trực tiếp với API Facebook...</span>
              ) : (
                <div className="space-y-1">
                  <span className="text-xs text-emerald-400 font-bold">Hoàn tất quá trình xuất bản đồng loạt!</span>
                  <p className="text-[10px] text-neutral-500">Xem lại dữ liệu chi tiết của chiến dịch trong Panel lịch sử lưu trữ.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
