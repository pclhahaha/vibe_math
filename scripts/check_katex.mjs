// scripts/check_katex.mjs — render every data-tex formula in content/*.html to catch errors
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import katex from 'katex';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(join(root, 'content')).filter((f) => f.endsWith('.html'));

let total = 0;
let failures = 0;
const samples = [];
for (const f of files) {
  const c = readFileSync(join(root, 'content', f), 'utf-8');
  // naive attr extraction (corpus guaranteed no inner double quotes)
  const re = /data-tex="([^"]*)"/g;
  let m;
  while ((m = re.exec(c))) {
    total++;
    let tex = m[1];
    tex = tex.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ');
    try {
      katex.renderToString(tex, { throwOnError: true, displayMode: true, strict: false });
    } catch (e) {
      failures++;
      if (samples.length < 120) {
        const err = e && e.message ? e.message.split('\n')[0] : String(e);
        samples.push({ file: f, tex: tex.slice(0, 90), err: err.slice(0, 110) });
      }
    }
  }
}
console.log(`formulas: ${total}, failures: ${failures}`);
for (const s of samples) {
  console.log(`\n[${s.file}] ERR: ${s.err}\n   tex: ${s.tex}`);
}
