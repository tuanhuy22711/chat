import React, { useState } from 'react';
import { getAvatarOptions, getRandomAvatar } from '../lib/avatarService';
import { Shuffle } from 'lucide-react';

const AvatarPicker = ({ userName, onSelect, currentAvatar }) => {
  const [avatarOptions] = useState(() => getAvatarOptions(userName));
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    onSelect(avatarUrl);
  };

  const handleRandomAvatar = () => {
    const randomAvatar = getRandomAvatar();
    handleAvatarSelect(randomAvatar);
  };

  return (
    <div className="p-4 bg-base-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Choose an Avatar</h3>
        <button
          onClick={handleRandomAvatar}
          className="btn btn-sm btn-primary"
          type="button"
        >
          <Shuffle size={16} />
          Random
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {avatarOptions.map((avatarUrl, index) => (
          <button
            key={index}
            onClick={() => handleAvatarSelect(avatarUrl)}
            className={`
              relative aspect-square rounded-full overflow-hidden border-2 hover:scale-105 transition-all
              ${selectedAvatar === avatarUrl ? 'border-primary ring-2 ring-primary/50' : 'border-base-300'}
            `}
            type="button"
          >
            <img
              src={avatarUrl}
              alt={`Avatar option ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold"
              style={{ display: 'none' }}
            >
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm text-base-content/70 text-center">
        Click on an avatar to select it, or generate a random one
      </div>
    </div>
  );
};

export default AvatarPicker;
