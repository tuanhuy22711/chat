import React from 'react';
import { generateAvatarUrl } from '../lib/avatarService';

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'w-10 h-10', 
  className = '',
  fallbackColor = 'bg-blue-500' 
}) => {
  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Function to generate color and avatar URL based on name
  const getAvatarFromName = (name) => {
    if (!name) return { bgColor: fallbackColor, avatarUrl: '/default-avatar.svg' };
    
    const avatarUrls = [
      '/default-avatar.svg',
      '/avatar-green.svg',
      '/avatar-red.svg'
    ];
    
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return {
      bgColor: colors[Math.abs(hash) % colors.length],
      avatarUrl: avatarUrls[Math.abs(hash) % avatarUrls.length]
    };
  };

  const [imageError, setImageError] = React.useState(false);
  const [fallbackImageError, setFallbackImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFallbackImageError = () => {
    setFallbackImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // If original image src exists and hasn't errored, show it
  if (src && !imageError) {
    return (
      <div className={`avatar ${className}`}>
        <div className={`${size} rounded-full`}>
          <img 
            src={src} 
            alt={alt || name || 'Avatar'} 
            onError={handleImageError}
            onLoad={handleImageLoad}
            className="rounded-full object-cover w-full h-full"
          />
        </div>
      </div>
    );
  }

  // Fallback to generated avatar
  const fallbackAvatarUrl = generateAvatarUrl(name, 'avataaars');
  const initials = getInitials(name);
  const { bgColor } = getAvatarFromName(name);

  // If generated avatar hasn't errored, show it
  if (!fallbackImageError) {
    return (
      <div className={`avatar ${className}`}>
        <div className={`${size} rounded-full bg-gray-100`}>
          <img 
            src={fallbackAvatarUrl}
            alt={alt || name || 'Avatar'} 
            onError={handleFallbackImageError}
            className="rounded-full object-cover w-full h-full"
          />
        </div>
      </div>
    );
  }

  // Final fallback to initials
  return (
    <div className={`avatar placeholder ${className}`}>
      <div className={`${bgColor} text-neutral-content ${size} rounded-full flex items-center justify-center`}>
        <span className="text-sm font-medium text-white">
          {initials}
        </span>
      </div>
    </div>
  );
};

export default Avatar;
