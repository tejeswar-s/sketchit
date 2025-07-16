import React, { useState, useImperativeHandle, forwardRef } from 'react';

// Expanded avatar set (~100 diverse emojis)
const AVATAR_OPTIONS = [
  // Animals
  { id: 'cat', emoji: '🐱', name: 'Cat' },
  { id: 'dog', emoji: '🐶', name: 'Dog' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger' },
  { id: 'lion', emoji: '🦁', name: 'Lion' },
  { id: 'fox', emoji: '🦊', name: 'Fox' },
  { id: 'bear', emoji: '🐻', name: 'Bear' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit' },
  { id: 'frog', emoji: '🐸', name: 'Frog' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin' },
  { id: 'owl', emoji: '🦉', name: 'Owl' },
  { id: 'dragon', emoji: '🐲', name: 'Dragon' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
  { id: 'dinosaur', emoji: '🦕', name: 'Dinosaur' },
  { id: 'monkey', emoji: '🐵', name: 'Monkey' },
  { id: 'elephant', emoji: '🐘', name: 'Elephant' },
  { id: 'horse', emoji: '🐴', name: 'Horse' },
  { id: 'cow', emoji: '🐮', name: 'Cow' },
  { id: 'pig', emoji: '🐷', name: 'Pig' },
  { id: 'sheep', emoji: '🐑', name: 'Sheep' },
  { id: 'goat', emoji: '🐐', name: 'Goat' },
  { id: 'chicken', emoji: '🐔', name: 'Chicken' },
  { id: 'duck', emoji: '🦆', name: 'Duck' },
  { id: 'eagle', emoji: '🦅', name: 'Eagle' },
  { id: 'parrot', emoji: '🦜', name: 'Parrot' },
  { id: 'peacock', emoji: '🦚', name: 'Peacock' },
  { id: 'flamingo', emoji: '🦩', name: 'Flamingo' },
  { id: 'whale', emoji: '🐋', name: 'Whale' },
  { id: 'dolphin', emoji: '🐬', name: 'Dolphin' },
  { id: 'shark', emoji: '🦈', name: 'Shark' },
  { id: 'octopus', emoji: '🐙', name: 'Octopus' },
  { id: 'crab', emoji: '🦀', name: 'Crab' },
  { id: 'lobster', emoji: '🦞', name: 'Lobster' },
  { id: 'snail', emoji: '🐌', name: 'Snail' },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly' },
  { id: 'bee', emoji: '🐝', name: 'Bee' },
  { id: 'ant', emoji: '🐜', name: 'Ant' },
  { id: 'ladybug', emoji: '🐞', name: 'Ladybug' },
  { id: 'spider', emoji: '🕷️', name: 'Spider' },
  { id: 'crocodile', emoji: '🐊', name: 'Crocodile' },
  { id: 'kangaroo', emoji: '🦘', name: 'Kangaroo' },
  { id: 'koala', emoji: '🐨', name: 'Koala' },
  { id: 'camel', emoji: '🐫', name: 'Camel' },
  { id: 'giraffe', emoji: '🦒', name: 'Giraffe' },
  { id: 'hippo', emoji: '🦛', name: 'Hippo' },
  { id: 'rhino', emoji: '🦏', name: 'Rhino' },
  { id: 'bat', emoji: '🦇', name: 'Bat' },
  { id: 'turkey', emoji: '🦃', name: 'Turkey' },
  { id: 'llama', emoji: '🦙', name: 'Llama' },
  { id: 'sloth', emoji: '🦥', name: 'Sloth' },
  { id: 'otter', emoji: '🦦', name: 'Otter' },
  { id: 'skunk', emoji: '🦨', name: 'Skunk' },
  { id: 'orangutan', emoji: '🦧', name: 'Orangutan' },
  // Humans (diverse)
  { id: 'boy', emoji: '👦', name: 'Boy' },
  { id: 'girl', emoji: '👧', name: 'Girl' },
  { id: 'man', emoji: '👨', name: 'Man' },
  { id: 'woman', emoji: '👩', name: 'Woman' },
  { id: 'older_man', emoji: '👴', name: 'Older Man' },
  { id: 'older_woman', emoji: '👵', name: 'Older Woman' },
  { id: 'baby', emoji: '👶', name: 'Baby' },
  { id: 'bearded_man', emoji: '🧔', name: 'Bearded Man' },
  { id: 'redhead_woman', emoji: '👩‍🦰', name: 'Redhead Woman' },
  { id: 'bald_man', emoji: '👨‍🦲', name: 'Bald Man' },
  { id: 'curly_hair_woman', emoji: '👩‍🦱', name: 'Curly Hair Woman' },
  { id: 'blond_man', emoji: '👱‍♂️', name: 'Blond Man' },
  { id: 'blond_woman', emoji: '👱‍♀️', name: 'Blond Woman' },
  { id: 'person_turban', emoji: '👳‍♂️', name: 'Person with Turban' },
  { id: 'person_headscarf', emoji: '🧕', name: 'Person with Headscarf' },
  { id: 'person_veil', emoji: '👰', name: 'Person with Veil' },
  { id: 'person_crown', emoji: '🤴', name: 'Person with Crown' },
  { id: 'person_angel', emoji: '👼', name: 'Angel' },
  { id: 'person_superhero', emoji: '🦸‍♂️', name: 'Superhero' },
  { id: 'person_supervillain', emoji: '🦹‍♂️', name: 'Supervillain' },
  { id: 'person_pilot', emoji: '🧑‍✈️', name: 'Pilot' },
  { id: 'person_astronaut', emoji: '🧑‍🚀', name: 'Astronaut' },
  { id: 'person_scientist', emoji: '🧑‍🔬', name: 'Scientist' },
  { id: 'person_artist', emoji: '🧑‍🎨', name: 'Artist' },
  { id: 'person_teacher', emoji: '🧑‍🏫', name: 'Teacher' },
  { id: 'person_farmer', emoji: '🧑‍🌾', name: 'Farmer' },
  { id: 'person_cook', emoji: '🧑‍🍳', name: 'Cook' },
  { id: 'person_factory', emoji: '🧑‍🏭', name: 'Factory Worker' },
  { id: 'person_office', emoji: '🧑‍💼', name: 'Office Worker' },
  { id: 'person_health', emoji: '🧑‍⚕️', name: 'Health Worker' },
  { id: 'person_mechanic', emoji: '🧑‍🔧', name: 'Mechanic' },
  { id: 'person_guard', emoji: '🧑‍✈️', name: 'Guard' },
  { id: 'person_firefighter', emoji: '🧑‍🚒', name: 'Firefighter' },
  { id: 'person_police', emoji: '🧑‍✈️', name: 'Police' },
  // More animals, birds, and fun
  { id: 'parrot2', emoji: '🦜', name: 'Parrot' },
  { id: 'owl2', emoji: '🦉', name: 'Owl' },
  { id: 'penguin2', emoji: '🐧', name: 'Penguin' },
  { id: 'rabbit2', emoji: '🐰', name: 'Rabbit' },
  { id: 'dog2', emoji: '🐶', name: 'Dog' },
  { id: 'cat2', emoji: '🐱', name: 'Cat' },
  { id: 'lion2', emoji: '🦁', name: 'Lion' },
  { id: 'tiger2', emoji: '🐯', name: 'Tiger' },
  { id: 'fox2', emoji: '🦊', name: 'Fox' },
  { id: 'bear2', emoji: '🐻', name: 'Bear' },
  { id: 'frog2', emoji: '🐸', name: 'Frog' },
  { id: 'unicorn2', emoji: '🦄', name: 'Unicorn' },
  { id: 'dinosaur2', emoji: '🦕', name: 'Dinosaur' },
  { id: 'dragon2', emoji: '🐲', name: 'Dragon' },
  { id: 'alien2', emoji: '👽', name: 'Alien' },
  { id: 'ghost2', emoji: '👻', name: 'Ghost' },
  { id: 'ninja2', emoji: '🥷', name: 'Ninja' },
  { id: 'pirate2', emoji: '🏴‍☠️', name: 'Pirate' },
  { id: 'robot2', emoji: '🤖', name: 'Robot' },
  { id: 'clown2', emoji: '🤡', name: 'Clown' },
  { id: 'vampire2', emoji: '🧛‍♂️', name: 'Vampire' },
  { id: 'zombie2', emoji: '🧟‍♂️', name: 'Zombie' },
  { id: 'mermaid2', emoji: '🧜‍♀️', name: 'Mermaid' },
  { id: 'fairy2', emoji: '🧚‍♀️', name: 'Fairy' },
  { id: 'angel2', emoji: '👼', name: 'Angel' },
  { id: 'devil2', emoji: '😈', name: 'Devil' },
  { id: 'cowboy2', emoji: '🤠', name: 'Cowboy' },
  { id: 'astronaut2', emoji: '👨‍🚀', name: 'Astronaut' },
  { id: 'detective2', emoji: '🕵️‍♂️', name: 'Detective' },
  { id: 'chef2', emoji: '👨‍🍳', name: 'Chef' },
  { id: 'artist2', emoji: '👨‍🎨', name: 'Artist' },
  { id: 'musician2', emoji: '👨‍🎤', name: 'Musician' },
  { id: 'scientist2', emoji: '👨‍🔬', name: 'Scientist' },
  { id: 'doctor2', emoji: '👨‍⚕️', name: 'Doctor' },
  { id: 'teacher2', emoji: '👨‍🏫', name: 'Teacher' },
  { id: 'firefighter2', emoji: '👨‍🚒', name: 'Firefighter' },
  { id: 'police2', emoji: '👮‍♂️', name: 'Police' },
];

export function randomAvatarConfig() {
  const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  return {
    id: randomAvatar.id,
    emoji: randomAvatar.emoji,
    name: randomAvatar.name
  };
}

const AvatarPicker = forwardRef(function AvatarPicker({ selected, onSelect }, ref) {
  // Find the index of the selected avatar or default to 0
  const initialIndex = selected ? AVATAR_OPTIONS.findIndex(a => a.id === selected.id) : 0;
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  React.useEffect(() => {
    onSelect(AVATAR_OPTIONS[index]);
    // eslint-disable-next-line
  }, [index]);

  const handleRandom = () => {
    const randomIdx = Math.floor(Math.random() * AVATAR_OPTIONS.length);
    setIndex(randomIdx);
    onSelect(AVATAR_OPTIONS[randomIdx]);
  };

  const handleLeft = () => {
    setIndex((prev) => (prev - 1 + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length);
  };

  const handleRight = () => {
    setIndex((prev) => (prev + 1) % AVATAR_OPTIONS.length);
  };

  useImperativeHandle(ref, () => ({
    handleRandom,
    handleLeft,
    handleRight,
  }));

  const avatar = AVATAR_OPTIONS[index];

  return (
    <div data-avatar-picker style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: 'auto',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <button 
        aria-label="Previous avatar"
        onClick={handleLeft}
        style={{ 
          background: 'none',
          border: 'none',
          fontSize: 28,
          color: '#6e44ff',
          cursor: 'pointer',
          transition: 'color 0.2s',
          outline: 'none',
          padding: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px #6e44ff22',
        }}
        onMouseEnter={e => (e.target.style.color = '#a777e3')}
        onMouseLeave={e => (e.target.style.color = '#6e44ff')}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M13.5 7L9.5 11L13.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div
        style={{
          width: 88,
          height: 88,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          border: '3px solid #6e44ff',
          fontSize: 56,
          boxShadow: '0 2px 12px #6e44ff22',
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
        }}
      >
        {avatar.emoji}
      </div>
      <button 
        aria-label="Next avatar"
        onClick={handleRight}
        style={{ 
          background: 'none',
          border: 'none',
          fontSize: 28,
          color: '#6e44ff',
          cursor: 'pointer',
          transition: 'color 0.2s',
          outline: 'none',
          padding: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px #6e44ff22',
        }}
        onMouseEnter={e => (e.target.style.color = '#a777e3')}
        onMouseLeave={e => (e.target.style.color = '#6e44ff')}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M8.5 7L12.5 11L8.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <style>{`
        @media (max-width: 600px) {
          [data-avatar-picker] {
            gap: 4px !important;
          }
          [data-avatar-picker] > button {
            width: 28px !important;
            height: 28px !important;
            font-size: 20px !important;
          }
          [data-avatar-picker] > div {
            width: 56px !important;
            height: 56px !important;
            font-size: 32px !important;
          }
        }
      `}</style>
    </div>
  );
});

export default AvatarPicker; 