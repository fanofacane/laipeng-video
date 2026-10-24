// 无头 Chromium 逐帧渲染 src/index.html（1080×1920）
//   node tools/render.mjs stills <dir> t1 t2 ...
//   node tools/render.mjs video <out.mp4> f0 f1        (30fps，可分段并行)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FPS = 30;
const [mode, out, ...rest] = process.argv.slice(2);
const browser = await pw.chromium.launch({ args: ['--disable-gpu', '--allow-file-access-from-files', '--font-render-hinting=none', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto('file://' + path.join(ROOT, 'src/index.html'));
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
const grab = async (t) => {
  const url = await page.evaluate(t => { ENGINE.seek(t); return document.getElementById('out').toDataURL('image/jpeg', .95); }, t);
  return Buffer.from(url.split(',')[1], 'base64');
};
if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true });
  for (const t of rest.map(Number)) fs.writeFileSync(path.join(out, `t${t.toFixed(2).padStart(6, '0')}.jpg`), await grab(t));
} else {
  const [f0, f1] = rest.map(Number);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const buf = await grab(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 150 === 0) console.log(`${path.basename(out)} frame ${f}/${f1} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
