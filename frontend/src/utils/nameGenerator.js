const adjectives = [
  'Brave', 'Clever', 'Swift', 'Lucky', 'Happy', 'Mighty', 'Witty', 'Jolly', 'Fuzzy', 'Chill',
  'Sunny', 'Zany', 'Nimble', 'Daring', 'Silly', 'Cosmic', 'Funky', 'Snazzy', 'Peppy', 'Breezy',
];
const animals = [
  'Tiger', 'Panda', 'Otter', 'Eagle', 'Fox', 'Wolf', 'Bear', 'Lion', 'Koala', 'Penguin',
  'Dolphin', 'Hawk', 'Moose', 'Bison', 'Rabbit', 'Frog', 'Lynx', 'Seal', 'Whale', 'Falcon',
];

export function generateRandomName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj}${animal}`;
} 