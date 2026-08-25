/**
 * @file scripts/generate-icons.ts
 * @description 从 assets/icon.svg 生成 PWA / Capacitor 图标与启动屏
 * @author English Agent Team
 * @date 2026-08-25
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const root = process.cwd();
const iconSvg = fs.readFileSync(path.join(root, "assets", "icon.svg"), "utf-8");
const svgBuffer = Buffer.from(iconSvg);

const OUTPUT = {
  pwa: path.join(root, "public", "icons"),
  splash: path.join(root, "public"),
  assets: path.join(root, "assets"),
};

async function ensureDirs() {
  for (const dir of Object.values(OUTPUT)) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

async function resize(width: number, height = width) {
  return sharp(svgBuffer, { density: 72 * (width / 512) }).resize(width, height).png();
}

async function generateIcon(size: number, outputPath: string, padding = 0) {
  const paddedSize = size - padding * 2;
  const img = await sharp(svgBuffer, { density: 72 * (paddedSize / 512) })
    .resize(paddedSize, paddedSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: img, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

async function generateSplash(width: number, height: number, outputPath: string) {
  const iconSize = Math.min(width, height) * 0.25;
  const img = await sharp(svgBuffer, { density: 72 * (iconSize / 512) })
    .resize(Math.round(iconSize), Math.round(iconSize), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 }, // #2563eb
    },
  })
    .composite([{ input: img, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

async function main() {
  await ensureDirs();

  // PWA icons
  const icon192 = await resize(192);
  await icon192.toFile(path.join(OUTPUT.pwa, "icon-192x192.png"));
  const icon512 = await resize(512);
  await icon512.toFile(path.join(OUTPUT.pwa, "icon-512x512.png"));
  // maskable
  await generateIcon(512, path.join(OUTPUT.pwa, "maskable-icon-512x512.png"), 48);
  // Apple touch icon
  const icon180 = await resize(180);
  await icon180.toFile(path.join(OUTPUT.splash, "apple-touch-icon.png"));

  // Splash screens
  await generateSplash(2732, 2732, path.join(OUTPUT.splash, "splash-2732x2732.png"));
  await generateSplash(1280, 720, path.join(OUTPUT.splash, "splash-1280x720.png"));

  // Capacitor source assets (for manual copy to native projects)
  const iconOnly = await resize(512);
  await iconOnly.toFile(path.join(OUTPUT.assets, "icon.png"));
  await generateSplash(2732, 2732, path.join(OUTPUT.assets, "splash.png"));

  console.log("Generated PWA/Capacitor icons and splash screens.");
}

main().catch((error) => {
  console.error("Icon generation failed:", error);
  process.exit(1);
});
