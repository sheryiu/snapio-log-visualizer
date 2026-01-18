export const ACTORS = [
  'anonymous',
  'camera-manager',
  'printer-manager',
  'ad-screen-manager',
  'viewfinder-manager',
  'qr-code-manager',
  'relay-manager',
  'image-combine',
  'live-photo',
  'loading',
  'root',
  'session',
  'member-login',
  'process-payment',
  'paid-for-capturing',
  'capture',
  'paid-for-reprint',
  'complete-session',
  'dev',
]

export type Actors = typeof ACTORS[number];