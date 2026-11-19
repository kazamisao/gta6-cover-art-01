// Gate tests for the gta6-cover-art-01 entry (run: node tests/test-gates.mjs).
// Checks the new cover-maker features + the make.fun output gates.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
let failures = 0;
function check(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
}
const src = (p) => readFileSync(join(root, p), 'utf8');

check('vendored OFL font exists', existsSync(join(root, 'app/fonts/Anton-Regular.ttf')));
check('OFL licence vendored', existsSync(join(root, 'app/fonts/OFL.txt')));
const cover = src('app/src/cover.js');
check('4 layouts defined', ['hero', 'diagonal2', 'triptych', 'grid4'].every((l) => cover.includes(`'${l}'`)));
check('3 grade presets defined', ['sunset', 'neon', 'dusk'].every((p) => cover.includes(p + ':')));
const main = src('app/src/main.js');
check('export sizes 1080x1080, 1080x1350, 1920x1080', ['w: 1080, h: 1080', 'w: 1080, h: 1350', 'w: 1920, h: 1080'].every((s) => main.includes(s) || cover.includes(s)));
check('per-panel zoom/offset controls', main.includes('zoom') && main.includes("'ox'") && main.includes("'oy'"));
check('no external network request in app', !/https?:\/\/(?!www\.w3\.org)/.test(src('app/index.html') + src('app/style.css') + cover + main));

// Run main.ts into out/ and check the output gates.
execSync('mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts', { cwd: root, stdio: 'pipe' });
const dossier = JSON.parse(readFileSync(join(root, 'out/dossier.json'), 'utf8'));
check('dossier.json valid', !!dossier);
const shots = readdirSync(join(root, 'screenshots')).filter((f) => /\.(jpe?g|png)$/i.test(f));
check('3-4 screenshots', shots.length >= 3 && shots.length <= 4);
check('all screenshots <= 256 KiB', shots.every((f) => statSync(join(root, 'screenshots', f)).size <= 262144));
const appFiles = readdirSync(join(root, 'app'), { recursive: true });
check('app files <= 993', appFiles.length <= 993);
console.log(failures === 0 ? 'ALL GATES PASS' : `${failures} GATE(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
