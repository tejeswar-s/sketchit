function generateRoomCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function maskWord(word, guessedLetters = []) {
  return word
    .split('')
    .map((char) => (guessedLetters.includes(char.toLowerCase()) || char === ' ' ? char : '_'))
    .join(' ');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getHint(word, revealedCount) {
  // Reveal 'revealedCount' random letters in the word (excluding spaces)
  const chars = word.split('');
  const indices = chars.map((c, i) => (c !== ' ' ? i : null)).filter(i => i !== null);
  const revealIndices = shuffleArray(indices).slice(0, revealedCount);
  return chars.map((c, i) => (c === ' ' || revealIndices.includes(i) ? c : '_')).join(' ');
}

function calculateScore(timeLeft, totalTime) {
  // New: 20 base + up to 80 bonus for speed (max 100)
  return Math.max(20, Math.floor(20 + 80 * (timeLeft / totalTime)));
}

function getNextDrawer(players, currentDrawerId) {
  // Rotate to next eligible player
  if (!players.length) return null;
  const idx = players.findIndex(p => p.userId === currentDrawerId);
  for (let i = 1; i <= players.length; i++) {
    const next = players[(idx + i) % players.length];
    if (!next.isKicked && !next.isMuted) return next.userId;
  }
  return null;
}

module.exports = { generateRoomCode, maskWord, shuffleArray, getHint, calculateScore, getNextDrawer }; 