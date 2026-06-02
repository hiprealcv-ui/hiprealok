import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Shield, ToggleLeft, ToggleRight, Sparkles, AlertCircle } from 'lucide-react';
import { FacebookPage } from '../types';

interface PageManagerProps {
  pages: FacebookPage[];
  onAddPage: (page: FacebookPage) => void;
  onDeletePage: (id: string) => void;
}

export default function PageManager({ pages, onAddPage, onDeletePage }: PageManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPage, setNewPage] = useState({
    id: '',
    name: '',
    token: '',
    isSimulated: true
  });
  const [showHelp, setShowHelp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPage.id.trim()) {
      setErrorMsg('Vui lòng nhập Page ID');
      return;
    }
    if (!newPage.name.trim()) {
      setErrorMsg('Vui lòng nhập tên nhận diện Page');
      return;
    }
    if (!newPage.isSimulated && !newPage.token.trim()) {
      setErrorMsg('Với trang thật (Real), bạn bắt buộc phải nhập Page Access Token.');
      return;
    }

    onAddPage({
      id: newPage.id.trim(),
      name: newPage.name.trim(),
      token: newPage.isSimulated ? 'mock_token' : newPage.token.trim(),
      isSimulated: newPage.isSimulated
    });

    setNewPage({ id: '', name: '', token: '', isSimulated: true });
    setShowAddForm(false);
  };

  return (
    <div id="page-manager" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500 shrink-0" />
            Cấu hình Fanpage liên kết ({pages.length})
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Thiết lập danh sách các trang Facebook đích để tự động phát nội dung đăng tải đồng thời.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="toggle-help-btn"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white transition text-xs font-mono"
          >
            <HelpCircle className="w-4 h-4 text-neutral-500" />
            {showHelp ? 'Ẩn trợ giúp' : 'Lấy Token?'}
          </button>
          <button
            id="add-page-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition text-xs shadow-md shadow-blue-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm Fanpage mới
          </button>
        </div>
      </div>

      {showHelp && (
        <div id="help-box" className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl mb-6 text-xs text-neutral-400 leading-relaxed space-y-2.5">
          <h4 className="font-semibold text-white flex items-center gap-1.5 text-blue-400 text-sm">
            Hướng dẫn thiết lập liên kết thật với Facebook Page:
          </h4>
          <ol className="list-decimal pl-5 space-y-1.5 mt-2">
            <li>
              Truy cập trang <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline hover:text-blue-300">Facebook Developers</a> để tạo Ứng dụng Facebook.
            </li>
            <li>
              Vào mục <strong>Graph API Explorer</strong> để cấp quyền quản trị trang của bạn (<code className="text-neutral-300 font-mono">pages_manage_posts</code>, <code className="text-neutral-300 font-mono">pages_read_engagement</code>, <code className="text-neutral-300 font-mono">publish_to_groups</code>).
            </li>
            <li>
              ID Trang: Xem ở phần Giới thiệu thông tin của Trang Facebook.
            </li>
            <li>
              Chọn trang mong muốn trong trình Explorer và sao chép <strong>Page Access Token</strong> dán vào form bên dưới.
            </li>
          </ol>
          <div className="mt-4 p-3 bg-blue-500/5 rounded-xl border border-blue-950 text-[11px] flex gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-blue-300">Tính năng Sandbox demo:</span> Ứng dụng đã sẵn sàng các trang Fanpage Sandbox (mầm giả lập). Bạn hoàn toàn có thể bắt đầu đăng thử hàng loạt mà không cần tích hợp mã Token thật trước!
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <form id="add-page-form" onSubmit={handleSubmit} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 font-mono">Tên Gợi Nhớ (Ví dụ: Page Khuyến Mãi)</label>
              <input
                id="form-page-name"
                type="text"
                value={newPage.name}
                onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                placeholder="Ví dụ: My Shop Fashion"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 font-mono">Facebook Page ID</label>
              <input
                id="form-page-id"
                type="text"
                value={newPage.id}
                onChange={(e) => setNewPage({ ...newPage, id: e.target.value })}
                placeholder="Ví dụ: 1048293758291"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <span className="text-xs font-semibold text-neutral-400">Chế độ hoạt động:</span>
            <button
              id="toggle-sim-btn"
              type="button"
              onClick={() => setNewPage({ ...newPage, isSimulated: !newPage.isSimulated })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 rounded-full transition text-[11px] text-neutral-200 cursor-pointer"
            >
              {newPage.isSimulated ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold font-mono">Sandbox (Demo hữu ích)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-500 font-bold font-mono font-semibold">Real API (Đăng thật lên Facebook)</span>
                </>
              )}
            </button>
          </div>

          {!newPage.isSimulated && (
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 font-mono">Page Access Token</label>
              <input
                id="form-page-token"
                type="password"
                value={newPage.token}
                onChange={(e) => setNewPage({ ...newPage, token: e.target.value })}
                placeholder="Nhập Token Facebook..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs transition"
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-900/10 border border-red-950 text-red-400 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              id="cancel-add-btn"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white rounded-xl transition text-xs font-semibold"
            >
              Hủy bỏ
            </button>
            <button
              id="submit-add-btn"
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition text-xs shadow-md shadow-blue-900/30"
            >
              Xác nhận Thêm
            </button>
          </div>
        </form>
      )}

      {pages.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
          <p className="text-neutral-500 text-xs font-medium mb-1">Chưa cấu hình tài khoản Fanpage nào.</p>
          <p className="text-[11px] text-neutral-650">Bấm thêm Fanpage mới để bắt đầu thiết kế luồng.</p>
        </div>
      ) : (
        <div id="pages-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((page) => (
            <div
              key={page.id}
              id={`page-card-${page.id}`}
              className="flex items-center justify-between p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 transition duration-150 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-blue-400 font-display shrink-0 group-hover:border-neutral-700">
                  {page.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-neutral-100 text-sm truncate">{page.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-neutral-500 select-all truncate max-w-[125px]">
                      ID: {page.id}
                    </span>
                    {page.isSimulated ? (
                      <span className="px-1.5 py-0.5 bg-emerald-500/5 text-emerald-400 rounded border border-emerald-500/10 text-[9px] font-bold font-mono">
                        SANDBOX
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-500/5 text-amber-400 rounded border border-amber-500/10 text-[9px] font-bold font-mono">
                        REAL-API
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                id={`delete-page-${page.id}`}
                onClick={() => onDeletePage(page.id)}
                className="p-2 text-neutral-600 hover:text-red-400 rounded-xl hover:bg-neutral-900 transition shrink-0 cursor-pointer"
                title="Xóa trang này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
