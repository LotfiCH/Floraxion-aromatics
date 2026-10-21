import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getImageDataUrlMimeType,
  hasTransparentPixels,
  isProductImageUploadTooLarge,
  MAX_PRODUCT_IMAGE_UPLOAD_BYTES,
  selectProductImageCanvasMimeType,
  validateProductImageDataUrl,
} from './productImage.ts';

test('transparent PNG pixels select a lossless PNG canvas output', () => {
  const transparentPngPixels = new Uint8ClampedArray([
    30, 80, 55, 255,
    30, 80, 55, 0,
  ]);

  assert.equal(hasTransparentPixels(transparentPngPixels), true);
  assert.equal(selectProductImageCanvasMimeType(transparentPngPixels), 'image/png');
});
test('ordinary JPEG pixels select compressed JPEG output', () => {
  const decodedJpegPixels = new Uint8ClampedArray([120, 80, 40, 255, 40, 90, 50, 255]);

  assert.equal(hasTransparentPixels(decodedJpegPixels), false);
  assert.equal(selectProductImageCanvasMimeType(decodedJpegPixels), 'image/jpeg');
});

test('opaque white-background images remain eligible for JPEG compression', () => {
  const whiteBackgroundPixels = new Uint8ClampedArray([255, 255, 255, 255, 24, 76, 50, 255]);

  assert.equal(hasTransparentPixels(whiteBackgroundPixels), false);
  assert.equal(selectProductImageCanvasMimeType(whiteBackgroundPixels), 'image/jpeg');
});

test('image data URL MIME is validated against the actual encoded format', () => {
  const pngDataUrl = 'data:image/png;base64,iVBORw0KGgo=';
  const jpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

  assert.equal(getImageDataUrlMimeType(pngDataUrl), 'image/png');
  assert.equal(validateProductImageDataUrl(pngDataUrl, 'image/png'), 'image/png');
  assert.equal(validateProductImageDataUrl(jpegDataUrl, 'image/jpeg'), 'image/jpeg');
  assert.throws(() => validateProductImageDataUrl(pngDataUrl, 'image/jpeg'), /ne correspond pas/);
  assert.throws(() => getImageDataUrlMimeType('data:text/plain;base64,SGVsbG8='), /invalide/);
});

test('image upload size guard accepts 5 MiB and rejects larger files', () => {
  assert.equal(isProductImageUploadTooLarge(MAX_PRODUCT_IMAGE_UPLOAD_BYTES), false);
  assert.equal(isProductImageUploadTooLarge(MAX_PRODUCT_IMAGE_UPLOAD_BYTES + 1), true);
});
