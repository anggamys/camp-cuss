export function isImageMime(mime: string): boolean {
  const supported = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'image/bmp',
  ];
  return supported.includes(mime.toLowerCase());
}
