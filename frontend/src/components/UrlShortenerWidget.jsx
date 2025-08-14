import React, { useState } from 'react';
import { Link2, Check, X } from 'lucide-react';
import { useUrlShortenerStore } from '../store/useUrlShortenerStore';

const UrlShortenerWidget = ({ text, onUrlReplaced }) => {
  const { shortenUrl, isShortening } = useUrlShortenerStore();
  const [showWidget, setShowWidget] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState('');

  // Detect URLs in text
  React.useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    
    if (urls && urls.length > 0) {
      const firstUrl = urls[0];
      // Only show widget for long URLs (> 50 characters)
      if (firstUrl.length > 50) {
        setDetectedUrl(firstUrl);
        setShowWidget(true);
      } else {
        setShowWidget(false);
      }
    } else {
      setShowWidget(false);
    }
  }, [text]);

  const handleShortenUrl = async () => {
    if (!detectedUrl) return;

    const result = await shortenUrl(detectedUrl);
    if (result) {
      // Replace the original URL with shortened URL in the text
      const newText = text.replace(detectedUrl, result.shortUrl);
      onUrlReplaced(newText);
      setShowWidget(false);
    }
  };

  if (!showWidget) return null;

  return (
    <div className="bg-base-200 border border-base-300 rounded-lg p-3 mb-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">URL dài được phát hiện</p>
            <p className="text-xs text-base-content/70 truncate">
              {detectedUrl}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleShortenUrl}
            disabled={isShortening}
            className="btn btn-xs btn-primary"
            title="Rút gọn URL"
          >
            {isShortening ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Check className="w-3 h-3" />
            )}
          </button>
          
          <button
            onClick={() => setShowWidget(false)}
            className="btn btn-xs btn-ghost"
            title="Bỏ qua"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrlShortenerWidget;
