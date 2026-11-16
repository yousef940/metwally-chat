/**
 * Client-side image compression utility.
 * Compresses images before upload to ensure lightning-fast transfers,
 * minimal memory usage, and low data bandwidth consumption on mobile.
 */
export async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If SVG or GIF, don't compress through canvas to preserve animation/vector
    if (file.type === "image/gif" || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image smoothly on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export to JPEG with quality compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}
