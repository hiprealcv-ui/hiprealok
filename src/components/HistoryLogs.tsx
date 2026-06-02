import React, { useState } from 'react';
import { Calendar, Eye, FileText, Image, Video, CheckCircle, XCircle, ChevronDown, ChevronUp, Link2, BarChart2 } from 'lucide-react';
import { PostHistoryItem } from '../types';

interface HistoryLogsProps {
  history: PostHistoryItem[];
  onClearHistory: () => void;
}

export default function HistoryLogs({ history, onClearHistory }: HistoryLogsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const getFacebookUrl = (pageId: string, postId?: string) => {
    if (!postId) return `https://facebook.com/${pageId}`;
    if (postId.includes('_')) {
      const parts = postId.split('_');
      return `https://facebook.com/${parts[0]}/posts/${parts[1]}`;
    }
    return `https://facebook.com/${pageId}/posts/${postId}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  // Compute stat metrics
  const totalPosts = history.length;
  const pageAttempts = history.reduce((acc, h) => acc + h.results.length, 0);
  const successAttempts = history.reduce((acc, h) => 
    acc + h.results.filter(r => r.status === 'success').length, 0
  );
  const successRate = pageAttempts > 0 ? Math.round((successAttempts / pageAttempts) * 100) : 100;

  return (
    <div id="history-logs-box" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-neutral-800">
        <div className="bg-neutral-950/40 border border-neutral-800 p-5 rounded-2xl flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Tổng lượt tạo</span>
            <span className="text-xl font-bold font-display text-white">{totalPosts} lượt viết</span>
          </div>
        </div>
        <div className="bg-neutral-950/40 border border-neutral-800 p-5 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Đăng thành công</span>
            <span className="text-xl font-bold font-display text-emerald-450">{successAttempts} / {pageAttempts} Page</span>
          </div>
        </div>
        <div className="bg-neutral-950/40 border border-neutral-800 p-5 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center font-bold text-blue-400 shrink-0 font-display text-sm">
            %
          </div>
          <div>
            <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Tỉ lệ mục tiêu</span>
            <span className="text-xl font-bold font-display text-blue-550">{successRate}% hoàn thành</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Nhật ký xuất bản chiến dịch
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Báo cáo chi tiết trạng thái đăng bài đồng loạt tới các kênh đích
          </p>
        </div>
        {history.length > 0 && (
          <button
            id="clear-logs-btn"
            onClick={onClearHistory}
            className="text-xs font-bold font-mono text-neutral-500 hover:text-red-400 transition cursor-pointer"
          >
            [Xóa nhật ký lưu trữ]
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/10">
          <p className="text-neutral-400 text-sm font-medium">Chưa phát hiện hoạt động đăng bài nào.</p>
          <p className="text-xs text-neutral-600 mt-1.5 font-mono">Hãy soạn nội dung và phát hành chiến dịch đầu tiên để hiển thị chỉ dẫn.</p>
        </div>
      ) : (
        <div id="history-items-list" className="space-y-4">
          {history.map((item) => {
            const successes = item.results.filter(r => r.status === 'success').length;
            const total = item.results.length;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="bg-neutral-950/40 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition duration-150"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                      {item.type === 'text' && <FileText className="w-5 h-5 text-neutral-300" />}
                      {item.type === 'image' && <Image className="w-5 h-5 text-blue-400" />}
                      {item.type === 'video' && <Video className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-100 truncate max-w-sm sm:max-w-md">
                        {item.message || "Chiến dịch hình ảnh/video không có mô tả"}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
                        <span className="bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 text-neutral-305 font-semibold font-mono">
                          {formatDate(item.timestamp)}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-neutral-400 font-mono">
                          LOẠI: {item.type === 'text' ? 'TEXT' : item.type === 'image' ? 'IMAGE' : 'VIDEO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0 ml-auto sm:ml-0 font-mono">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold leading-none ${successes === total ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : successes > 0 ? 'bg-amber-500/5 text-amber-400 border border-amber-500/10' : 'bg-red-500/5 text-red-550 border border-red-500/10'}`}>
                      Succeed {successes}/{total} PAGE
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                  </div>
                </div>

                {/* Collapsible detail panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1.5 border-t border-neutral-850 bg-neutral-950/60 text-sm text-neutral-300 space-y-4">
                    {/* Caption content */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest block font-mono">Nội dung bài viết (Caption):</span>
                      <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-805 text-neutral-100 whitespace-pre-line text-xs font-medium leading-relaxed select-text">
                        {item.message || <span className="text-neutral-550 italic font-mono">[Bài đăng thuần tệp đính kèm, không có mô tả caption]</span>}
                      </div>
                    </div>

                    {item.mediaUrl && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest block font-mono">ĐƯỜNG DẪN LINK ĐÍNH KÈM MEDIA:</span>
                        <span className="text-xs font-mono text-blue-400 break-all select-all font-semibold">{item.mediaUrl}</span>
                      </div>
                    )}

                    {/* Channel metrics */}
                    <div className="space-y-2">
                       <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest block font-mono">Chi tiết tiến vị đăng tải từng trang</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {item.results.map((res, idx) => (
                          <div
                            key={idx}
                            className="bg-neutral-900 border border-neutral-805 p-3.5 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-neutral-250 block truncate">{res.pageName}</span>
                              <span className="text-[9px] text-neutral-500 font-mono">ID: {res.pageId}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {res.status === 'success' ? (
                                <div className="flex items-center gap-1 bg-emerald-505/5 px-2 py-0.5 border border-emerald-500/10 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-450"></span>
                                  <span className="text-[9px] font-bold text-emerald-400 font-mono">OK</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-red-500/5 px-2 py-0.5 border border-red-500/10 rounded-md font-mono">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  <span className="text-[9px] font-bold text-red-400 font-mono">LỖI API</span>
                                </div>
                              )}

                              {res.status === 'success' ? (
                                <a
                                  href={getFacebookUrl(res.pageId, res.facebookPostId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 px-2.5 bg-neutral-950 hover:bg-neutral-850 hover:text-white text-neutral-400 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition font-mono border border-neutral-800"
                                  title="Xem bài đăng trực tiếp trên Facebook"
                                >
                                  <Link2 className="w-3 h-3" />
                                  Link
                                </a>
                              ) : (
                                res.error && (
                                  <span className="text-[9px] text-red-500 break-words line-clamp-2 max-w-[140px] text-right font-mono" title={res.error}>
                                    {res.error}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
