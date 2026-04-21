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
  design: '/assets/3D-Items/brush-dynamic-premium.png'
};

export const findBestTransitionItem = (caption: string): string | null => {
  const lower = caption.toLowerCase();
  
  if (lower.includes('data') || lower.includes('growth') || lower.includes('result') || lower.includes('business')) return TRANSITION_ITEM_LIB.data;
  if (lower.includes('chat') || lower.includes('talk') || lower.includes('social') || lower.includes('community')) return TRANSITION_ITEM_LIB.community;
  if (lower.includes('idea') || lower.includes('light') || lower.includes('creative') || lower.includes('think')) return TRANSITION_ITEM_LIB.idea;
  if (lower.includes('alert') || lower.includes('notify') || lower.includes('bell') || lower.includes('attention')) return TRANSITION_ITEM_LIB.alert;
  if (lower.includes('time') || lower.includes('date') || lower.includes('schedule') || lower.includes('event')) return TRANSITION_ITEM_LIB.time;
  if (lower.includes('photo') || lower.includes('video') || lower.includes('camera') || lower.includes('record')) return TRANSITION_ITEM_LIB.capture;
  if (lower.includes('money') || lower.includes('cost') || lower.includes('finance') || lower.includes('budget')) return TRANSITION_ITEM_LIB.finance;
  if (lower.includes('email') || lower.includes('contact') || lower.includes('reach')) return TRANSITION_ITEM_LIB.contact;
  if (lower.includes('shop') || lower.includes('buy') || lower.includes('store') || lower.includes('cart')) return TRANSITION_ITEM_LIB.shopping;
  if (lower.includes('battery') || lower.includes('power') || lower.includes('energy')) return TRANSITION_ITEM_LIB.power;
  if (lower.includes('design') || lower.includes('draw') || lower.includes('art')) return TRANSITION_ITEM_LIB.design;

  return null;
};
