// Rendert alle Storyboards zu MP4 (1080x1920, 30 fps, H.264 + AAC) inkl. Thumbnail, SRT-Untertitel.
// Aufruf: NODE_PATH=$(npm root -g) node render.js [video-id ...]   (ohne Argument: alle)
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const STORY = require('./storyboards.js');

const FPS = 30;
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'videos');
const AUDIO = path.join(ROOT, 'audio');
const THUMBS = path.join(ROOT, 'thumbnails');
const CAPS = path.join(ROOT, 'captions');
[OUT, AUDIO, THUMBS, CAPS].forEach((d) => fs.mkdirSync(d, { recursive: true }));

function srtTime(s) {
  const ms = Math.round(s * 1000);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
}

async function renderOne(browser, id) {
  const sb = STORY[id];
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'player.html') + '?v=' + id);
  await page.evaluate(() => window.__ready);
  const duration = await page.evaluate(() => window.__duration);
  const scenes = await page.evaluate(() => window.__scenes);
  const frames = Math.round(duration * FPS);

  const wav = path.join(AUDIO, `${id}.wav`);
  const cuts = scenes.slice(1).map((s) => s.start.toFixed(3)).join(',');
  execFileSync('python3', [path.join(__dirname, 'music.py'), String(sb.music.bpm), String(sb.music.root), String(duration), cuts, wav, sb.music.mood]);

  const mp4 = path.join(OUT, `${id}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
    '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

  const thumbAt = scenes[0].end - 0.4;
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    await page.evaluate((x) => window.__render(x), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (Math.abs(t - thumbAt) < 0.5 / FPS) fs.writeFileSync(path.join(THUMBS, `${id}.jpg`), buf);
  }
  ff.stdin.end();
  await done;
  await page.close();

  const srt = sb.scenes.map((s, i) => s.vo ? `${i + 1}\n${srtTime(scenes[i].start + 0.15)} --> ${srtTime(scenes[i].end - 0.1)}\n${s.vo}\n` : '')
    .filter(Boolean).join('\n');
  fs.writeFileSync(path.join(CAPS, `${id}.srt`), srt);
  return { id, duration, frames };
}

(async () => {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(STORY);
  const browser = await chromium.launch();
  const queue = [...ids];
  const workers = Array.from({ length: Math.min(3, ids.length) }, async () => {
    while (queue.length) {
      const id = queue.shift();
      const t0 = Date.now();
      const r = await renderOne(browser, id);
      console.log(`fertig ${r.id}: ${r.duration.toFixed(1)} s, ${r.frames} Frames, ${((Date.now() - t0) / 1000).toFixed(0)} s Renderzeit`);
    }
  });
  await Promise.all(workers);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
