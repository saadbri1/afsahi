// One-off: generate responsive WebP variants for the Nationwide cinematic
// section from the high-res source photos. Run: node scripts/optimize-nationwide.mjs
// sharp is a build-only devDependency; these outputs are committed to public/.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "site-assets/source-images";
const OUT = "public/images/optimized/nationwide";
const WIDTHS = [768, 1280, 1920];

// 3:2 landscape sources → cinematic crops. focal (0..1) biases the crop centre
// so faces / the car door stay in frame across aspect ratios.
const IMAGES = [
  { src: `${SRC}/arrival-door.jpg.jpg`, base: "arrival-door", focalX: 0.52, focalY: 0.42 },
  { src: `${SRC}/service-umbrella.jpg`, base: "service-umbrella", focalX: 0.5, focalY: 0.38 },
  { src: `${SRC}/executive-exit.jpg`, base: "executive-exit", focalX: 0.5, focalY: 0.44 },
];

await mkdir(OUT, { recursive: true });

for (const img of IMAGES) {
  const meta = await sharp(img.src).metadata();
  for (const width of WIDTHS) {
    const out = `${OUT}/${img.base}-${width}.webp`;
    const info = await sharp(img.src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(out);
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)}KB`);
  }
  console.log(`  (source ${img.base}: ${meta.width}x${meta.height})\n`);
}
console.log("done.");
