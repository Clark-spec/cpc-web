/**
 * Placeholder signature generator for the demo staff panel.
 *
 * In production the staff app uploads the real signature (base64, SVG or URL)
 * and the student side only displays it. The demo needs *some* image, so we
 * rasterise the signer's name with the handwriting font loaded in index.html.
 */

const WIDTH = 600;
const HEIGHT = 180;
const INK = "#1b2f9e";

/** Draws `name` in a handwriting face and returns a PNG data URL. */
export async function createDemoSignature(name: string): Promise<string> {
  try {
    await document.fonts.load('76px "Dancing Script"');
  } catch {
    // Font loading is best-effort; the canvas falls back to cursive.
  }

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Shrink the type until the name fits inside the signature box.
  let size = 76;
  do {
    ctx.font = `${size}px "Dancing Script", cursive`;
    if (ctx.measureText(name).width <= WIDTH - 48) break;
    size -= 4;
  } while (size > 28);

  ctx.fillText(name, WIDTH / 2, HEIGHT / 2 - 8);

  // Small underline flourish so it reads as a signature rather than plain text.
  const textWidth = Math.min(ctx.measureText(name).width, WIDTH - 48);
  const startX = WIDTH / 2 - textWidth / 2;
  ctx.beginPath();
  ctx.moveTo(startX, HEIGHT / 2 + 34);
  ctx.bezierCurveTo(
    startX + textWidth * 0.3,
    HEIGHT / 2 + 46,
    startX + textWidth * 0.7,
    HEIGHT / 2 + 22,
    startX + textWidth,
    HEIGHT / 2 + 34,
  );
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();

  return canvas.toDataURL("image/png");
}
