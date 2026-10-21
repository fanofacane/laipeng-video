// node tools/render.mjs stills <dir> t1 t2 ...        (single sample, for checking)
// node tools/render.mjs video <out.mp4> f0 f1          (16 sub-frames per frame, 180° shutter)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FPS = 30, SUB = 16;
const [mode, out, ...rest] = process.argv.slice(2);
const browser = await pw.chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 720, height: 720 }, deviceScaleFactor: 1.5 });
page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
await page.goto('file://' + path.join(ROOT, 'src/index.html'));
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const shot = (opt) => page.screenshot({ type: 'jpeg', quality: 95, ...opt });
if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true });
  for (const t of rest.map(Number)) {
    const f = Math.min(362, Math.floor(t * FPS + 1e-6));
    await page.evaluate(async ([f, t]) => { await setFrame(f); setTime(t); }, [f, t]);
    await shot({ path: path.join(out, `t${t.toFixed(3).padStart(7, '0')}.jpg`) });
  }
} else {
  const [f0, f1] = rest.map(Number);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(f => setFrame(f), f);
    for (let k = 0; k < SUB; k++) {
      const t = Math.max(0, (f - 0.25 + 0.5 * (k + 0.5) / SUB) / FPS);
      await page.evaluate(t => setTime(t), t);
      const buf = await shot();
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    if ((f - f0) % 20 === 0) console.log(`${path.basename(out)} frame ${f} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
