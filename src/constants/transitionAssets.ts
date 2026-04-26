export const TRANSITION_ITEM_LIB = {
  data: '/assets/3D-Items/chart-dynamic-premium.png',
  growth: '/assets/3D-Items/chart-dynamic-premium.png',
  social: '/assets/3D-Items/chat-bubble-dynamic-premium.png',
  community: '/assets/3D-Items/chat-dynamic-premium.png',
  idea: '/assets/3D-Items/bulb-dynamic-premium.png',
  creative: '/assets/3D-Items/bulb-dynamic-premium.png',
  alert: '/assets/3D-Items/bell-dynamic-premium.png',
  time: '/assets/3D-Items/calender-dynamic-premium.png',
  capture: '/assets/3D-Items/camera-dynamic-premium.png',
  finance: '/assets/3D-Items/calculator-dynamic-premium.png',
  contact: '/assets/3D-Items/at-dynamic-premium.png',
  shopping: '/assets/3D-Items/bag-dynamic-premium.png',
  power: '/assets/3D-Items/battery-dynamic-premium.png',
  design: '/assets/3D-Items/brush-dynamic-premium.png',
  launch: '/assets/3D-Items/rocket/rocket-dynamic-premium.png',
  victory: '/assets/3D-Items/trophy/trophy-dynamic-premium.png',
  target: '/assets/3D-Items/target/target-dynamic-premium.png',
  security: '/assets/3D-Items/shield/shield-dynamic-premium.png',
  settings: '/assets/3D-Items/setting/setting-dynamic-premium.png',
  money: '/assets/3D-Items/wallet/wallet-dynamic-premium.png',
  communication: '/assets/3D-Items/mail/mail-dynamic-premium.png',
  location: '/assets/3D-Items/map-pin/map-pin-dynamic-premium.png'
};

export const SECONDARY_3D_ITEMS = [
  '/assets/3D-Items/bulb-dynamic-color.png',
  '/assets/3D-Items/camera-dynamic-color.png',
  '/assets/3D-Items/chat-dynamic-color.png',
  '/assets/3D-Items/bell-dynamic-color.png',
  '/assets/3D-Items/bag-dynamic-color.png',
  '/assets/3D-Items/calculator-dynamic-color.png',
  '/assets/3D-Items/at-dynamic-color.png',
  '/assets/3D-Items/chart-dynamic-color.png',
  '/assets/3D-Items/axe-dynamic-color.png',
  '/assets/3D-Items/battery-dynamic-color.png',
  '/assets/3D-Items/rocket/rocket-dynamic-premium.png',
  '/assets/3D-Items/trophy/trophy-dynamic-premium.png',
  '/assets/3D-Items/target/target-dynamic-premium.png',
  '/assets/3D-Items/shield/shield-dynamic-premium.png',
  '/assets/3D-Items/setting/setting-dynamic-premium.png',
  '/assets/3D-Items/wallet/wallet-dynamic-premium.png'
];

export const HYPER_SHAPES = [
  'star', 'diamond', 'triangle', 'pentagon', 'hexagon', 'shield', 'banner', 'cloud', 'heart', 'lightning'
];

export const findBestTransitionItem = (caption: string): string | null => {
  const lower = caption.toLowerCase();
  
  if (lower.includes('data') || lower.includes('growth') || lower.includes('result') || lower.includes('business')) return TRANSITION_ITEM_LIB.data;
  if (lower.includes('chat') || lower.includes('talk') || lower.includes('social') || lower.includes('community')) return TRANSITION_ITEM_LIB.community;
  if (lower.includes('idea') || lower.includes('light') || lower.includes('creative') || lower.includes('think')) return TRANSITION_ITEM_LIB.idea;
  if (lower.includes('alert') || lower.includes('notify') || lower.includes('bell') || lower.includes('attention')) return TRANSITION_ITEM_LIB.alert;
  if (lower.includes('time') || lower.includes('date') || lower.includes('schedule') || lower.includes('event')) return TRANSITION_ITEM_LIB.time;
  if (lower.includes('photo') || lower.includes('video') || lower.includes('camera') || lower.includes('record')) return TRANSITION_ITEM_LIB.capture;
  if (lower.includes('money') || lower.includes('cost') || lower.includes('finance') || lower.includes('budget') || lower.includes('payment') || lower.includes('price')) return TRANSITION_ITEM_LIB.finance;
  if (lower.includes('email') || lower.includes('contact') || lower.includes('reach') || lower.includes('mail')) return TRANSITION_ITEM_LIB.contact;
  if (lower.includes('shop') || lower.includes('buy') || lower.includes('store') || lower.includes('cart')) return TRANSITION_ITEM_LIB.shopping;
  if (lower.includes('battery') || lower.includes('power') || lower.includes('energy')) return TRANSITION_ITEM_LIB.power;
  if (lower.includes('design') || lower.includes('draw') || lower.includes('art')) return TRANSITION_ITEM_LIB.design;
  if (lower.includes('launch') || lower.includes('start') || lower.includes('deploy') || lower.includes('rocket')) return TRANSITION_ITEM_LIB.launch;
  if (lower.includes('win') || lower.includes('victory') || lower.includes('success') || lower.includes('medal') || lower.includes('trophy')) return TRANSITION_ITEM_LIB.victory;
  if (lower.includes('target') || lower.includes('goal') || lower.includes('focus') || lower.includes('mission')) return TRANSITION_ITEM_LIB.target;
  if (lower.includes('safe') || lower.includes('secure') || lower.includes('protect') || lower.includes('shield')) return TRANSITION_ITEM_LIB.security;
  if (lower.includes('setting') || lower.includes('gear') || lower.includes('config') || lower.includes('tool')) return TRANSITION_ITEM_LIB.settings;
  if (lower.includes('wallet') || lower.includes('crypto' ) || lower.includes('btc')) return TRANSITION_ITEM_LIB.money;
  if (lower.includes('map') || lower.includes('location') || lower.includes('place') || lower.includes('pin')) return TRANSITION_ITEM_LIB.location;

  return null;
};
