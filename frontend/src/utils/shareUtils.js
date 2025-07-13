// Utility functions for sharing rooms

export const generateShareUrl = (roomCode) => {
  return `${window.location.origin}/join/${roomCode}`;
};

export const shareRoom = async (roomCode) => {
  const shareUrl = generateShareUrl(roomCode);
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join my SketchIt game!',
        text: `Join my drawing game! Room code: ${roomCode}`,
        url: shareUrl
      });
      return { success: true, method: 'native' };
    } catch (err) {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl);
      return { success: true, method: 'clipboard' };
    }
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(shareUrl);
    return { success: true, method: 'clipboard' };
  }
};

export const copyToClipboard = (text) => {
  return navigator.clipboard.writeText(text);
}; 