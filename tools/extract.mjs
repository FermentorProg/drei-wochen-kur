// tools/extract.mjs — usage: node tools/extract.mjs <plan.md> [filter]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const [plan, filter = ''] = process.argv.slice(2);
const md = readFileSync(plan, 'utf8').replace(/\r\n/g, '\n');
const re = /```(?:js|json)\n([\s\S]*?)```/g;
let m, n = 0;
while ((m = re.exec(md))) {
  const lines = m[1].split('\n');
  const js = lines[0].match(/^\/\/ file: (\S+)/);
  const json = lines[1]?.match(/^\s*"\/\/file": "([^"]+)",?/);
  const path = js?.[1] ?? json?.[1];
  if (!path || !path.includes(filter)) continue;
  const body = js ? lines.slice(1).join('\n') : [lines[0], ...lines.slice(2)].join('\n');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  console.log('wrote', path); n++;
}
console.log(n, 'files');
