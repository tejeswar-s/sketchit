import React, { useState } from 'react';
import Avatar from 'avataaars';

// Utility to generate a random avatar config
export function randomAvatarConfig() {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  return {
    topType: pick([
      'NoHair', 'ShortHairShortFlat', 'ShortHairShortRound', 'ShortHairDreads01', 'ShortHairDreads02',
      'LongHairStraight', 'LongHairCurly', 'LongHairStraight2', 'LongHairBun', 'LongHairBigHair',
      'Hat', 'Hijab', 'Turban', 'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4',
    ]),
    accessoriesType: pick(['Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers']),
    hairColor: pick(['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Platinum', 'Red', 'SilverGray']),
    facialHairType: pick(['Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum']),
    facialHairColor: pick(['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'Platinum', 'Red']),
    clotheType: pick(['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck']),
    clotheColor: pick(['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White']),
    eyeType: pick(['Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised', 'Wink', 'WinkWacky']),
    eyebrowType: pick(['Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcited', 'SadConcerned', 'SadConcernedNatural', 'UnibrowNatural', 'UpDown', 'UpDownNatural']),
    mouthType: pick(['Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit']),
    skinColor: pick(['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black']),
    hatColor: pick(['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White']),
    accessoriesColor: pick(['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White']),
    graphicType: pick(['Bat', 'Cumbia', 'Deer', 'Diamond', 'Hola', 'Pizza', 'Resist', 'Selena', 'Bear', 'SkullOutline', 'Skull'] ),
  };
}

export default function AvatarPicker({ selected, onSelect }) {
  const [config, setConfig] = useState(randomAvatarConfig());

  React.useEffect(() => {
    onSelect(config);
    // eslint-disable-next-line
  }, [config]);

  const handleRandom = () => {
    const newConfig = randomAvatarConfig();
    setConfig(newConfig);
    onSelect(newConfig);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', borderRadius: 24, border: '3px solid #007bff', marginBottom: 8, boxShadow: '0 2px 12px #0006' }}>
        <Avatar style={{ width: 110, height: 110 }} {...config} />
      </div>
      <button className="btn btn-info" style={{ fontWeight: 600, fontSize: 18, padding: '10px 28px', borderRadius: 12 }} onClick={handleRandom}>Randomize Avatar</button>
    </div>
  );
} 