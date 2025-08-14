import { useState, useEffect } from "react";
import { useUrlShortenerStore } from "../store/useUrlShortenerStore";
import { Link2, Copy, Trash2, BarChart3, ExternalLink, Calendar, Clock } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";

const UrlShortenerPage = () => {
  const {
    urls,
    isLoading,
    isShortening,
    shortenUrl,
    getUserUrls,
    deleteUrl,
    copyToClipboard,
    getUrlAnalytics,
  } = useUrlShortenerStore();

  const [formData, setFormData] = useState({
    originalUrl: "",
    customCode: "",
    expiresIn: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    getUserUrls();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await shortenUrl(
      formData.originalUrl,
      formData.customCode || null,
      formData.expiresIn || null
    );

    if (result) {
      setFormData({ originalUrl: "", customCode: "", expiresIn: "" });
      setShowAdvanced(false);
    }
  };

  const handleShowAnalytics = async (shortCode) => {
    const data = await getUrlAnalytics(shortCode);
    if (data) {
      setAnalytics(data);
      setSelectedUrl(shortCode);
    }
  };

  const handleCopy = (text) => {
    copyToClipboard(text);
  };

  const handleDelete = async (shortCode) => {
    if (window.confirm("Bạn có chắc muốn xóa link này?")) {
      await deleteUrl(shortCode);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Link2 className="w-8 h-8 text-primary" />
            Rút Gọn Link
          </h1>
          <p className="text-base-content/70">
            Tạo những link ngắn gọn, dễ chia sẻ với thống kê chi tiết
          </p>
        </div>

        {/* Shortener Form */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">URL cần rút gọn</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/very-long-url"
                  className="input input-bordered w-full"
                  value={formData.originalUrl}
                  onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                  required
                />
              </div>

              {/* Advanced Options */}
              <div className="collapse collapse-arrow">
                <input 
                  type="checkbox" 
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                />
                <div className="collapse-title text-sm font-medium">
                  Tùy chọn nâng cao
                </div>
                <div className="collapse-content space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Mã tùy chỉnh (không bắt buộc)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="my-custom-code"
                        className="input input-bordered"
                        value={formData.customCode}
                        onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
                        pattern="[a-zA-Z0-9-_]+"
                        title="Chỉ chấp nhận chữ cái, số, dấu gạch ngang và gạch dưới"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Thời hạn (không bắt buộc)</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={formData.expiresIn}
                        onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                      >
                        <option value="">Không giới hạn</option>
                        <option value="1h">1 giờ</option>
                        <option value="1d">1 ngày</option>
                        <option value="7d">7 ngày</option>
                        <option value="30d">30 ngày</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isShortening || !formData.originalUrl.trim()}
              >
                {isShortening ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Đang rút gọn...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Rút Gọn Link
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* URLs List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Link đã rút gọn của bạn</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : urls.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có link nào được rút gọn</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urls.map((url) => (
                  <div
                    key={url.shortCode}
                    className="border border-base-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">
                            {url.metadata?.title || url.originalUrl}
                          </h3>
                          {url.expiresAt && (
                            <div className="badge badge-warning badge-sm">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(url.expiresAt) < new Date() ? "Hết hạn" : "Có thời hạn"}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary">{url.shortUrl}</span>
                            <button
                              onClick={() => handleCopy(url.shortUrl)}
                              className="btn btn-ghost btn-xs"
                              title="Sao chép"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-base-content/70">
                            <ExternalLink className="w-3 h-3" />
                            <a
                              href={url.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary truncate"
                            >
                              {url.originalUrl}
                            </a>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-base-content/50">
                            <span>{url.clicks} lượt click</span>
                            <span>{formatRelativeTime(url.createdAt)}</span>
                            {url.metadata?.domain && (
                              <span>{url.metadata.domain}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShowAnalytics(url.shortCode)}
                          className="btn btn-ghost btn-sm"
                          title="Xem thống kê"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(url.shortCode)}
                          className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Modal */}
        {selectedUrl && analytics && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">Thống kê chi tiết</h3>
              
              <div className="space-y-4">
                <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                  <div className="stat">
                    <div className="stat-title">Tổng lượt click</div>
                    <div className="stat-value text-primary">{analytics.clicks}</div>
                  </div>
                  
                  <div className="stat">
                    <div className="stat-title">Ngày tạo</div>
                    <div className="stat-value text-sm">
                      {new Date(analytics.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  
                  {analytics.expiresAt && (
                    <div className="stat">
                      <div className="stat-title">Hết hạn</div>
                      <div className={`stat-value text-sm ${analytics.isExpired ? 'text-error' : 'text-success'}`}>
                        {new Date(analytics.expiresAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Link rút gọn:</span>
                    <span className="text-primary">{analytics.shortUrl}</span>
                    <button
                      onClick={() => handleCopy(analytics.shortUrl)}
                      className="btn btn-ghost btn-xs"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Link gốc:</span>
                    <a
                      href={analytics.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {analytics.originalUrl}
                    </a>
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    setSelectedUrl(null);
                    setAnalytics(null);
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => {
              setSelectedUrl(null);
              setAnalytics(null);
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UrlShortenerPage;
