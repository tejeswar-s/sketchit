// Themed word categories for SketchIt
const wordCategories = {
  general: [
    'apple', 'banana', 'cat', 'dog', 'elephant', 'flower', 'guitar', 'house', 'island', 'jungle',
    'kangaroo', 'lion', 'mountain', 'notebook', 'ocean', 'pizza', 'queen', 'rainbow', 'sun', 'tree',
    'umbrella', 'violin', 'whale', 'xylophone', 'yacht', 'zebra', 'airplane', 'book', 'car', 'diamond',
    'eagle', 'fire', 'garden', 'hat', 'ice', 'jacket', 'key', 'lamp', 'moon', 'night', 'orange',
    'pencil', 'quilt', 'river', 'star', 'table', 'umbrella', 'vase', 'window', 'yellow', 'zoo'
  ],
  
  countries: [
    'africa', 'albania', 'argentina', 'australia', 'austria', 'belgium', 'brazil', 'bulgaria', 'canada',
    'chile', 'china', 'colombia', 'croatia', 'cuba', 'denmark', 'egypt', 'england', 'estonia', 'finland',
    'france', 'germany', 'greece', 'hungary', 'iceland', 'india', 'indonesia', 'iran', 'iraq', 'ireland',
    'israel', 'italy', 'japan', 'jordan', 'kenya', 'latvia', 'lebanon', 'lithuania', 'luxembourg', 'malaysia',
    'mexico', 'monaco', 'morocco', 'netherlands', 'new zealand', 'nigeria', 'norway', 'pakistan', 'peru',
    'poland', 'portugal', 'romania', 'russia', 'saudi arabia', 'serbia', 'singapore', 'slovakia', 'slovenia',
    'south africa', 'spain', 'sweden', 'switzerland', 'syria', 'thailand', 'tunisia', 'turkey', 'ukraine',
    'united kingdom', 'united states', 'uruguay', 'venezuela', 'vietnam', 'yemen', 'zimbabwe'
  ],
  
  animals: [
    'alligator', 'antelope', 'armadillo', 'badger', 'bat', 'bear', 'beaver', 'bison', 'boar', 'buffalo',
    'camel', 'cat', 'cheetah', 'chimpanzee', 'cobra', 'coyote', 'crocodile', 'deer', 'dolphin', 'donkey',
    'eagle', 'elephant', 'elk', 'ferret', 'fox', 'frog', 'gazelle', 'giraffe', 'goat', 'gorilla',
    'hamster', 'hare', 'hedgehog', 'hippopotamus', 'horse', 'hyena', 'iguana', 'jackal', 'jaguar', 'kangaroo',
    'koala', 'leopard', 'lion', 'llama', 'lynx', 'mole', 'monkey', 'moose', 'mouse', 'mule',
    'otter', 'owl', 'panda', 'panther', 'penguin', 'pig', 'platypus', 'porcupine', 'rabbit', 'raccoon',
    'rat', 'rhinoceros', 'seal', 'shark', 'sheep', 'skunk', 'sloth', 'snake', 'squirrel', 'tiger',
    'toad', 'turtle', 'walrus', 'weasel', 'whale', 'wolf', 'wombat', 'zebra'
  ],
  
  trees: [
    'acacia', 'alder', 'almond', 'apple', 'ash', 'aspen', 'bamboo', 'beech', 'birch', 'cedar',
    'cherry', 'chestnut', 'coconut', 'cypress', 'elm', 'eucalyptus', 'fir', 'hazel', 'hemlock', 'hickory',
    'holly', 'juniper', 'larch', 'linden', 'magnolia', 'maple', 'oak', 'olive', 'orange', 'palm',
    'peach', 'pear', 'pecan', 'pine', 'plum', 'poplar', 'redwood', 'spruce', 'sycamore', 'walnut',
    'willow', 'yew'
  ],
  
  fruits: [
    'apple', 'apricot', 'avocado', 'banana', 'blackberry', 'blueberry', 'cherry', 'coconut', 'cranberry',
    'date', 'dragon fruit', 'fig', 'grape', 'grapefruit', 'guava', 'kiwi', 'lemon', 'lime', 'lychee',
    'mango', 'melon', 'nectarine', 'orange', 'papaya', 'passion fruit', 'peach', 'pear', 'persimmon',
    'pineapple', 'plum', 'pomegranate', 'raspberry', 'strawberry', 'tangerine', 'watermelon'
  ],
  
  food: [
    'bacon', 'bagel', 'bread', 'burger', 'cake', 'candy', 'carrot', 'celery', 'cheese', 'chicken',
    'chocolate', 'cookie', 'corn', 'croissant', 'donut', 'egg', 'fish', 'fries', 'garlic', 'ham',
    'hamburger', 'hot dog', 'ice cream', 'lettuce', 'meat', 'milk', 'mushroom', 'noodles', 'onion',
    'orange', 'pasta', 'peanut', 'pepper', 'pickle', 'pie', 'pizza', 'potato', 'rice', 'salad',
    'sandwich', 'sausage', 'soup', 'steak', 'sushi', 'taco', 'toast', 'tomato', 'turkey', 'vegetable'
  ],
  
  sports: [
    'archery', 'badminton', 'baseball', 'basketball', 'bowling', 'boxing', 'cricket', 'cycling', 'diving',
    'fencing', 'football', 'golf', 'gymnastics', 'hockey', 'judo', 'karate', 'lacrosse', 'marathon',
    'martial arts', 'ping pong', 'polo', 'rowing', 'rugby', 'sailing', 'skiing', 'soccer', 'softball',
    'surfing', 'swimming', 'table tennis', 'tennis', 'track', 'volleyball', 'wrestling'
  ],
  
  vehicles: [
    'airplane', 'ambulance', 'bicycle', 'boat', 'bus', 'car', 'fire truck', 'helicopter', 'jeep',
    'limousine', 'motorcycle', 'police car', 'rocket', 'ship', 'submarine', 'taxi', 'train', 'truck',
    'van', 'yacht'
  ],
  
  jobs: [
    'accountant', 'actor', 'architect', 'artist', 'astronaut', 'baker', 'barber', 'carpenter', 'chef',
    'clerk', 'coach', 'cook', 'dentist', 'doctor', 'driver', 'engineer', 'farmer', 'firefighter',
    'fisherman', 'gardener', 'hairdresser', 'judge', 'lawyer', 'librarian', 'mechanic', 'musician',
    'nurse', 'painter', 'photographer', 'pilot', 'plumber', 'police', 'professor', 'sailor', 'scientist',
    'secretary', 'singer', 'soldier', 'teacher', 'veterinarian', 'waiter', 'writer'
  ],
  
  colors: [
    'black', 'blue', 'brown', 'gold', 'green', 'grey', 'orange', 'pink', 'purple', 'red',
    'silver', 'white', 'yellow'
  ]
};

// Default to general category
const defaultCategory = 'general';

module.exports = {
  wordCategories,
  defaultCategory,
  // For backward compatibility, export the general category as the default array
  ...wordCategories.general
}; 