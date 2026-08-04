const fs = require("fs");
const path = require("path");

const platform = process.argv[2];

if (!platform) {
  console.error("Usage: node copy-env.js <platform>");
  process.exit(1);
}

const source = path.join(process.cwd(), `.env.${platform}`);
const target = path.join(process.cwd(), ".env.local");

if (!fs.existsSync(source)) {
  console.error(`Environment file not found: .env.${platform}`);
  process.exit(1);
}

fs.copyFileSync(source, target);
console.log(`Copied .env.${platform} to .env.local`);
