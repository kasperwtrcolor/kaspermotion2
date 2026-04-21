// Full registry of all 3D transition items available in /public/assets/3D-Items/
// Each item has 4 style variants: clay, color, gradient, premium
// The AI Director picks the best item based on scraped content keywords

const STYLES = ['premium', 'color', 'gradient', 'clay'] as const;
const pickStyle = () => STYLES[Math.floor(Math.random() * STYLES.length)];

export const ALL_3D_ITEMS = [
  'at', 'axe', 'back', 'bag', 'battery', 'bell', 'boy', 'brush',
  'bucket', 'bulb', 'calculator', 'calender', 'camera', 'can',
  'chart', 'chat', 'chat-bubble', 'chat-text'
] as const;

// Get path for a given item with random style variant
const itemPath = (name: string) => `/assets/3D-Items/${name}-dynamic-${pickStyle()}.png`;

// Keyword → item mapping (expanded to cover all items)
export const TRANSITION_ITEM_LIB: Record<string, () => string> = {
  // Data / Business
  data: () => itemPath('chart'),
  growth: () => itemPath('chart'),
  stats: () => itemPath('chart'),
  analytics: () => itemPath('chart'),
  revenue: () => itemPath('chart'),
  business: () => itemPath('chart'),
  
  // Social / Communication
  social: () => itemPath('chat-bubble'),
  community: () => itemPath('chat'),
  message: () => itemPath('chat-text'),
  talk: () => itemPath('chat-bubble'),
  discuss: () => itemPath('chat-text'),
  connect: () => itemPath('chat'),
  
  // Ideas / Creative
  idea: () => itemPath('bulb'),
  creative: () => itemPath('brush'),
  think: () => itemPath('bulb'),
  innovate: () => itemPath('bulb'),
  light: () => itemPath('bulb'),
  design: () => itemPath('brush'),
  art: () => itemPath('brush'),
  paint: () => itemPath('bucket'),
  color: () => itemPath('bucket'),
  
  // Alerts / Notifications
  alert: () => itemPath('bell'),
  notify: () => itemPath('bell'),
  attention: () => itemPath('bell'),
  update: () => itemPath('bell'),
  
  // Time / Schedule
  time: () => itemPath('calender'),
  date: () => itemPath('calender'),
  schedule: () => itemPath('calender'),
  event: () => itemPath('calender'),
  plan: () => itemPath('calender'),
  
  // Media / Visual
  photo: () => itemPath('camera'),
  video: () => itemPath('camera'),
  camera: () => itemPath('camera'),
  record: () => itemPath('camera'),
  capture: () => itemPath('camera'),
  
  // Finance / Math
  money: () => itemPath('calculator'),
  cost: () => itemPath('calculator'),
  finance: () => itemPath('calculator'),
  budget: () => itemPath('calculator'),
  calculate: () => itemPath('calculator'),
  price: () => itemPath('calculator'),
  
  // Contact / Email
  email: () => itemPath('at'),
  contact: () => itemPath('at'),
  reach: () => itemPath('at'),
  address: () => itemPath('at'),
  
  // Shopping / Commerce
  shop: () => itemPath('bag'),
  buy: () => itemPath('bag'),
  store: () => itemPath('bag'),
  cart: () => itemPath('bag'),
  product: () => itemPath('bag'),
  order: () => itemPath('bag'),
  
  // Power / Energy
  battery: () => itemPath('battery'),
  power: () => itemPath('battery'),
  energy: () => itemPath('battery'),
  charge: () => itemPath('battery'),
  
  // People / Team
  team: () => itemPath('boy'),
  people: () => itemPath('boy'),
  person: () => itemPath('boy'),
  user: () => itemPath('boy'),
  
  // Action / Back
  back: () => itemPath('back'),
  return: () => itemPath('back'),
  undo: () => itemPath('back'),
  
  // Tools / Build
  build: () => itemPath('axe'),
  tool: () => itemPath('axe'),
  construct: () => itemPath('axe'),
  craft: () => itemPath('axe'),
  
  // Container / Storage
  storage: () => itemPath('can'),
  container: () => itemPath('can'),
  collect: () => itemPath('bucket'),
};

/** 
 * Finds the best 3D transition item for a given caption.
 * Always returns an item — uses keyword matching first, then falls back to random.
 */
export const findBestTransitionItem = (caption: string): string | null => {
  if (!caption) return itemPath(ALL_3D_ITEMS[Math.floor(Math.random() * ALL_3D_ITEMS.length)]);
  
  const lower = caption.toLowerCase();
  
  // Check each keyword in priority order
  for (const [keyword, getPath] of Object.entries(TRANSITION_ITEM_LIB)) {
    if (lower.includes(keyword)) {
      return getPath();
    }
  }
  
  // Fallback: always return a random 3D item so transitions always have an asset
  return itemPath(ALL_3D_ITEMS[Math.floor(Math.random() * ALL_3D_ITEMS.length)]);
};
