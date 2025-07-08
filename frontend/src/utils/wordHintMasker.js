export function maskWord(word, revealIndices = []) {
  return word
    .split('')
    .map((char, i) => (char === ' ' ? ' ' : revealIndices.includes(i) ? char : '_'))
    .join(' ');
} 