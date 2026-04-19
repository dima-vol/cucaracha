// Generates PWA icons from public/icon.svg at build time.
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const svg = readFileSync(join(publicDir, "icon.svg"));

// Maskable icon: the inner content should live inside an 80% safe area, so we
// render the base SVG slightly smaller on a solid background.
const maskableSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <rect width="640" height="640" fill="#ffffff"/>
    <g transform="translate(64,64)">${svg.toString().match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1]}</g>
  </svg>`
);

async function out(name, size, source = svg) {
  await sharp(source, { density: 512 })
    .resize(size, size, { fit: "contain", background: "#ffffff" })
    .png()
    .toFile(join(publicDir, name));
  console.log(`wrote ${name} (${size}x${size})`);
}

mkdirSync(publicDir, { recursive: true });

await out("icon-192.png", 192);
await out("icon-512.png", 512);
await out("icon-maskable-512.png", 512, maskableSvg);
await out("apple-touch-icon.png", 180);
await out("favicon-32.png", 32);
