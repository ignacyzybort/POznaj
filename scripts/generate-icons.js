const sharp = require("sharp");
const fs = require("fs");

const SIZE = 512;
const SVG = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" rx="64" fill="#18181b"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="800" font-size="200" fill="#d97706">
    P
  </text>
  <text x="57%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="300" font-size="200" fill="white">
    z
  </text>
</svg>`;

async function main() {
  const buf = Buffer.from(SVG);
  await sharp(buf).resize(512, 512).png().toFile("public/icons/icon-512.png");
  await sharp(buf).resize(192, 192).png().toFile("public/icons/icon-192.png");
  console.log("Icons generated");
}

main().catch(console.error);
