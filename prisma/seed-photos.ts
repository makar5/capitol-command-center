import fs from "fs";
import path from "path";

export type SeedPhotoMeta = {
  filename: string;
  woNumber: string;
  kind: string;
  dateLabel: string;
};

export function ensureSeedUploadDir(): string {
  const dir = path.join(process.cwd(), "public", "uploads", "seed");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writePlaceholderSvg(meta: SeedPhotoMeta, dir: string): string {
  const { filename, woNumber, kind, dateLabel } = meta;
  const filePath = path.join(dir, filename);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#0A1628"/>
  <rect x="24" y="24" width="752" height="552" fill="none" stroke="#0EA5E9" stroke-width="2" opacity="0.5"/>
  <text x="400" y="250" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="36" fill="#FFFFFF" font-weight="600">${escapeXml(woNumber)}</text>
  <text x="400" y="310" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#0EA5E9">${escapeXml(kind)}</text>
  <text x="400" y="360" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="#94A3B8">${escapeXml(dateLabel)}</text>
  <text x="400" y="520" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" fill="#64748B">Franklin Court Federal Building — seed photo</text>
</svg>`;

  fs.writeFileSync(filePath, svg, "utf8");
  return `/uploads/seed/${filename}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
