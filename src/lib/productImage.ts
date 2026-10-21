export const MAX_PRODUCT_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ProductImageCanvasMimeType = 'image/png' | 'image/jpeg';

export function isProductImageUploadTooLarge(fileSizeBytes: number): boolean {
  return fileSizeBytes > MAX_PRODUCT_IMAGE_UPLOAD_BYTES;
}

export function hasTransparentPixels(rgba: ArrayLike<number>): boolean {
  if (rgba.length % 4 !== 0) {
    throw new Error('Pixel data must contain complete RGBA pixels.');
  }

  for (let alphaIndex = 3; alphaIndex < rgba.length; alphaIndex += 4) {
    if (rgba[alphaIndex] < 255) return true;
  }

  return false;
}

export function selectProductImageCanvasMimeType(rgba: ArrayLike<number>): ProductImageCanvasMimeType {
  return hasTransparentPixels(rgba) ? 'image/png' : 'image/jpeg';
}

export function getImageDataUrlMimeType(dataUrl: string): string {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(dataUrl);
  if (!match) {
    throw new Error('Le format de l’image encodée est invalide.');
  }
  return match[1].toLowerCase();
}

export function validateProductImageDataUrl(dataUrl: string, expectedMimeType?: string): string {
  const actualMimeType = getImageDataUrlMimeType(dataUrl);
  if (expectedMimeType && actualMimeType !== expectedMimeType.toLowerCase()) {
    throw new Error('Le format encodé de l’image ne correspond pas au format attendu.');
  }
  return actualMimeType;
}
