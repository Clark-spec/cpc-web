/**
 * Image processing utilities for student avatar uploads.
 */

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg"] as const;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("We couldn't read that image. Try another file."));
    };
    image.src = objectUrl;
  });
}

/** Center-crops the photo to a square and downsizes it to 256px. */
async function cropToSquareDataUrl(file: File, size = 256): Promise<string> {
  const image = await loadImage(file);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - side) / 2;
  const sourceY = (image.naturalHeight - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser can't process images right now.");

  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Validates, crops and returns the avatar as a base64 data URL. */
export async function uploadAvatar(file: File): Promise<string> {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    throw new Error("Choose a PNG or JPG image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Your photo must be 2 MB or smaller.");
  }
  return cropToSquareDataUrl(file);
}

