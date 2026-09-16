/**
 * Image processing and optimization utility for Pico's Dashboard
 * Safely compresses and resizes user-uploaded images in the browser
 * so they fit smoothly into localStorage and Firestore without hitting size limits.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

/**
 * Validates if the uploaded file is a supported image
 */
export function isValidImageFile(file: File): boolean {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  // Fallback for file extensions if MIME type is missing
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp|gif|bmp|avif|svg)$/i.test(name);
}

/**
 * Reads and optimizes an image file into a compact, high-quality DataURL.
 * - Scales down oversized camera/phone photos (e.g. 4000x3000 -> 1600x600)
 * - Compresses to ~60KB-180KB WebP/JPEG
 * - Preserves GIFs if under 2MB, otherwise optimizes first frame
 */
export async function optimizeImageFile(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const {
    maxWidth = 1600,
    maxHeight = 600,
    quality = 0.85,
    format = 'image/webp',
  } = options;

  if (!isValidImageFile(file)) {
    throw new Error('Please select a valid image file (JPG, PNG, WebP, or GIF).');
  }

  // If it's a GIF and under 2.5MB, preserve animation as DataURL directly
  if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
    if (file.size <= 2.5 * 1024 * 1024) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read GIF file.'));
        reader.readAsDataURL(file);
      });
    }
  }

  // Load the image into an Image object
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          throw new Error('Image dimensions could not be read.');
        }

        // Calculate proportional scale down
        let targetWidth = width;
        let targetHeight = height;

        if (targetWidth > maxWidth) {
          targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
          targetWidth = maxWidth;
        }

        if (targetHeight > maxHeight) {
          targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
          targetHeight = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D context unavailable.');
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and compress
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Try WebP first, fallback to JPEG if browser doesn't support WebP export
        let dataUrl = canvas.toDataURL(format, quality);
        if (!dataUrl.startsWith(`data:${format}`)) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Image processing failed.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: Try reading raw DataURL if canvas decoding fails
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => resolve(fallbackReader.result as string);
      fallbackReader.onerror = () => reject(new Error('Failed to load image file.'));
      fallbackReader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}
