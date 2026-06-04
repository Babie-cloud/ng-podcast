import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiUrl = process.env.API_URL?.trim().replace(/\/$/, '');
if (!apiUrl) {
  console.warn(
    '[inject-api-url] API_URL is not set — keeping placeholder in environment.prod.ts.',
  );
  console.warn(
    '[inject-api-url] Set API_URL in Vercel/Render before deploy (e.g. https://ngpodcast-api.onrender.com).',
  );
  process.exit(0);
}

const envPath = join(dirname(fileURLToPath(import.meta.url)), '../src/environments/environment.prod.ts');
const content = readFileSync(envPath, 'utf8');
const updated = content.replace(/apiUrl:\s*'[^']*'/, `apiUrl: '${apiUrl}'`);

if (updated === content) {
  console.warn('[inject-api-url] Could not patch apiUrl in environment.prod.ts.');
  process.exit(1);
}

writeFileSync(envPath, updated);
console.log(`[inject-api-url] apiUrl set to ${apiUrl}`);
