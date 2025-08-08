// Avatar service for generating beautiful default avatars
export const generateAvatarUrl = (name, style = 'identicon') => {
  if (!name) return '/default-avatar.svg';
  
  // Clean the name for URL
  const cleanName = encodeURIComponent(name.trim().toLowerCase());
  
  // Different avatar generators
  const generators = {
    // DiceBear - Free API for generating avatars
    identicon: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanName}`,
    avataaars: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanName}`,
    bottts: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanName}`,
    personas: `https://api.dicebear.com/7.x/personas/svg?seed=${cleanName}`,
    initials: `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}`,
    
    // UI Avatars - Simple initials based avatars
    uiAvatars: `https://ui-avatars.com/api/?name=${cleanName}&background=random&color=fff&size=200`,
    
    // Robohash - Robot avatars
    robohash: `https://robohash.org/${cleanName}?set=set1&size=200x200`,
    
    // Local fallback
    local: '/default-avatar.svg'
  };
  
  return generators[style] || generators.initials;
};

// Get multiple avatar options for a user
export const getAvatarOptions = (name) => {
  if (!name) return ['/default-avatar.svg'];
  
  return [
    generateAvatarUrl(name, 'avataaars'),
    generateAvatarUrl(name, 'personas'),
    generateAvatarUrl(name, 'bottts'),
    generateAvatarUrl(name, 'initials'),
    generateAvatarUrl(name, 'uiAvatars'),
    '/default-avatar.svg',
    '/avatar-green.svg',
    '/avatar-red.svg'
  ];
};

// Generate a random avatar URL
export const getRandomAvatar = () => {
  const styles = ['avataaars', 'personas', 'bottts', 'identicon'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = Math.random().toString(36).substring(7);
  
  return generateAvatarUrl(randomSeed, randomStyle);
};
