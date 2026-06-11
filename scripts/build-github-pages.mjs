import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DOCS_DIR = path.join(ROOT, 'docs');

async function main() {
  await fs.rm(DOCS_DIR, { recursive: true, force: true });
  await fs.mkdir(DOCS_DIR, { recursive: true });
  await fs.cp(PUBLIC_DIR, DOCS_DIR, { recursive: true });
  await fs.writeFile(path.join(DOCS_DIR, '.nojekyll'), '', 'utf8');
  console.log(`GitHub Pages bundle generated in ${path.relative(ROOT, DOCS_DIR)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
