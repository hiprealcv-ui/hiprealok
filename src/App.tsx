import React, { useState, useEffect } from 'react';
import { 
  Compass, Shield, Calendar, Sparkles, Facebook, Code, 
  Settings, HelpCircle, HardDriveDownload, RefreshCw, Send, CheckCircle2
} from 'lucide-react';
import PageManager from './components/PageManager';
import PostCreator from './components/PostCreator';
import HistoryLogs from './components/HistoryLogs';
import { FacebookPage, PostHistoryItem, PostType, PagePostResult } from './types';

const DEFAULT_PAGES: FacebookPage[] = [
  { id: "100293817342", name: "Fanpage Demo 1: Thời Trang & Phong Cách", token: "mock_token_fashion", isSimulated: true },
  { id: "100293817345", name: "Fanpage Demo 2: Ăn Sập Hà Nội", token: "mock_token_food", isSimulated: true },
  { id: "100293817348", name: "Fanpage Demo 3: Tin Tức Công Nghệ", token: "mock_token_tech", isSimulated: true },
  { id: "error-trigger", name: "Fanpage Test Lỗi (Để xem cách xử lý lỗi API)", token: "mock_token_error", isSimulated: true }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'pages' | 'history'>('create');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [history, setHistory] = useState<PostHistoryItem[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    const storedPages = localStorage.getItem('fb_pages_v1');
    if (storedPages) {
      try {
        setPages(JSON.parse(storedPages));
      } catch {
        setPages(DEFAULT_PAGES);
      }
    } else {
      setPages(DEFAULT_PAGES);
    }

    const storedHistory = localStorage.getItem('fb_history_v1');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (err) {
        setHistory([]);
      }
    }

    // Ping health server check for AI capability
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAiEnabled(data.aiEnabled);
        setLoadingHealth(false);
      })
      .catch(() => {
        setAiEnabled(false);
        setLoadingHealth(false);
      });
  }, []);

  // Save changes to pages lists
  const handleUpdatePages = (newPages: FacebookPage[]) => {
    setPages(newPages);
    localStorage.setItem('fb_pages_v1', JSON.stringify(newPages));
  };

  const handleAddPage = (page: FacebookPage) => {
    const updated = [...pages, page];
    handleUpdatePages(updated);
  };

  const handleDeletePage = (id: string) => {
    const updated = pages.filter(p => p.id !== id);
    handleUpdatePages(updated);
  };

  // Handle publishing loops
  const handlePublishStart = () => {
    console.log("Bulk publishing initiated...");
  };

  const handlePublishProgress = (pageId: string, status: 'success' | 'failed', fbId?: string, error?: string) => {
    console.log(`Publish update: Page ${pageId} finished with status ${status}`);
  };

  const handlePublishEnd = (message: string, type: PostType, mediaUrl: string, results: PagePostResult[]) => {
    const newLog: PostHistoryItem = {
      id: `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      mediaUrl: mediaUrl || undefined,
      results
    };

    const updatedHistory = [newLog, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('fb_history_v1', JSON.stringify(updatedHistory));
  };

  const handleClearHistory = () => {
    if (confirm("Bạn có tin chắc muốn toàn bộ lịch sử đăng tải không?")) {
      setHistory([]);
      localStorage.removeItem('fb_history_v1');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased">
      
      {/* Dynamic Glow Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative flex flex-col gap-6">
        
        {/* Top Header & Connection states */}
        <header id="main-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md shadow-blue-900/40">FB</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display tracking-tight text-white">AutoPost Pro</h1>
                <span className="text-xs bg-neutral-850 border border-neutral-850 px-2 py-0.5 rounded-md text-neutral-500 font-mono">v4.2.0</span>
              </div>
              <p className="text-xs text-neutral-500 italic mt-0.5">Hệ thống đăng bài tự động đồng loạt tối ưu hoá bằng AI</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Server status metric (Bento style) */}
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-400 font-mono">Máy chủ: Hoạt động</span>
            </div>

            {/* AI Capability state badge */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-1.5 rounded-xl text-xs">
              <Sparkles className={`w-4 h-4 ${aiEnabled ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="text-neutral-500 block text-[9px] font-bold uppercase tracking-wider font-mono">Trí tuệ nhân ảnh AI</span>
                <span className="font-semibold text-neutral-300">
                  {loadingHealth ? "Đang kết nối..." : aiEnabled ? "Sẵn sàng (Flash)" : "Không khả dụng"}
                </span>
              </div>
            </div>

            {/* Total Account metrics */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-1.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <span className="text-neutral-500 block text-[9px] font-bold uppercase tracking-wider font-mono">Trang vệ tinh</span>
                <span className="font-bold text-white">{pages.length} Fanpages</span>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Navigation Tabs */}
        <div id="tabs-navigation-panel" className="flex border-b border-neutral-800 mb-2 overflow-x-auto gap-2">
          <button
            id="tab-create-btn"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition shrink-0 ${activeTab === 'create' ? 'border-blue-500 text-white bg-neutral-900/30' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
          >
            <Compass className="w-4 h-4 text-blue-400" />
            Vận hành đăng bài
          </button>
          <button
            id="tab-pages-btn"
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition shrink-0 ${activeTab === 'pages' ? 'border-blue-500 text-white bg-neutral-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Settings className="w-4 h-4 text-purple-400" />
            Cấu hình Fanpage Facebook
          </button>
          <button
            id="tab-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition shrink-0 ${activeTab === 'history' ? 'border-blue-500 text-white bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            Nhật ký lưu trữ ({history.length})
          </button>
        </div>

        {/* Active Tab Panel Displays */}
        <main className="space-y-8 animate-in fade-in duration-300">
          {activeTab === 'create' && (
            <div id="tab-create-content" className="space-y-8">
              <PostCreator 
                pages={pages}
                onPublishStart={handlePublishStart}
                onPublishProgress={handlePublishProgress}
                onPublishEnd={handlePublishEnd}
              />
            </div>
          )}

          {activeTab === 'pages' && (
            <div id="tab-pages-content">
              <PageManager 
                pages={pages}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div id="tab-history-content">
              <HistoryLogs 
                history={history}
                onClearHistory={handleClearHistory}
              />
            </div>
          )}
        </main>

        {/* Sleek human-centric Footer section */}
        <footer className="mt-16 border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
          <p>© 2026 Facebook Bulk Publisher. Thiết lập bảo mật kết nối nội bộ thông qua môi trường sandboxed sạch.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-slate-500">
              <Code className="w-3.5 h-3.5" />
              NodeJS Express v4
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Powered by Gemini Gen AI
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
