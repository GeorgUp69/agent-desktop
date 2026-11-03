// Erzeugt aus den Storyboards: Skripte (Markdown), Captions (TXT) und eine Übersicht.
'use strict';
const fs = require('fs');
const path = require('path');
const STORY = require('./storyboards.js');

const ROOT = path.resolve(__dirname, '..');
const visual = (s) => {
  switch (s.type) {
    case 'hook': return `Großer Text, Wort für Wort eingeblendet: „${s.lines.join(' ')}“${s.accent ? ` (Akzent: ${s.accent.join(', ')})` : ''}`;
    case 'text': return `${s.kicker ? `Kicker „${s.kicker}“, ` : ''}Titel „${s.title}“${s.body ? `, darunter „${s.body}“` : ''}`;
    case 'number': return `Zähler animiert bis ${s.to.toLocaleString('de-DE')}${s.suffix || ''} · Label „${s.label}“${s.body ? ` · „${s.body}“` : ''}`;
    case 'shot': return `Echte Produktansicht (${s.img}) im Rahmen, langsamer Zoom${s.hl ? ', Markierung einer Zeile' : ''}${s.title ? ` · Titel „${s.title}“` : ''}`;
    case 'list': return `${s.title ? `Titel „${s.title}“, ` : ''}Liste: ${s.items.map((i) => `„${i}“`).join(', ')}`;
    case 'compare': return `Zwei Spalten: ${s.left.label} „${s.left.value}“ vs. ${s.right.label} „${s.right.value}“`;
    case 'bar': return `Fortschrittsbalken ${s.value.toLocaleString('de-DE')} € von ${s.max.toLocaleString('de-DE')} € · „${s.title}“`;
    case 'qa': return `Fragekarte „${s.q}“, Antwort „${s.a}“`;
    case 'logo': return 'Logo-Animation Freikontor';
    case 'cta': return `Logo, „${s.title || 'Finanzcockpit 2026'}“, „${s.price || 'ab 29 € · einmalig · kein Abo'}“, Button „Link in Bio“, Hinweis „keine Steuerberatung“`;
    default: return s.type;
  }
};

const index = [];
for (const [id, v] of Object.entries(STORY)) {
  let t = 0;
  const rows = v.scenes.map((s, i) => {
    const r = `| ${i + 1} | ${t.toFixed(1)}–${(t + s.dur).toFixed(1)} s | ${visual(s).replace(/\|/g, '/')} | ${(s.vo || '–').replace(/\|/g, '/')} | ${[s.cap, s.note].filter(Boolean).join(' · ') || '–'} |`;
    t += s.dur;
    return r;
  });
  const md = `# ${id}: ${v.title}

**Konzept:** ${v.concept} · **Länge:** ${t.toFixed(1)} s · **Format:** 9:16, 1080 × 1920, 30 fps · **Datei:** \`videos/${id}.mp4\`

## Szenenplan, Bildschirmtext und Voice-over

| # | Zeit | Bild / Bildschirmtext | Voice-over (optional, selbst einsprechen) | Untertitel-Chip / Hinweis |
|---|---|---|---|---|
${rows.join('\n')}

## Hook (erste 2 Sekunden)
${visual(v.scenes[0])}

## Musik und Sound
- In der MP4 enthalten: eigens synthetisierter Track (${v.music.bpm} BPM, Stimmung: ${v.music.mood}) mit Übergangs-Whooshes. Keine Fremdsamples, deshalb lizenzfrei nutzbar.
- Alternative für TikTok Ads: einen Track aus der **TikTok Commercial Music Library** mit passender Stimmung („${v.music.mood}“, ca. ${v.music.bpm} BPM) wählen. Musik aus der allgemeinen Bibliothek ist für Unternehmen nicht erlaubt.

## Call-to-Action
„Link in der Bio“ bzw. im Anzeigen-Button: **„Mehr erfahren“** → Zielseite \`/finanzcockpit\` (Kaufabsicht) oder \`/steuerruecklage-rechner\` (Kaltakquise).

## Caption
${v.caption}

## Hashtags
${v.hashtags.map((h) => '#' + h).join(' ')}

## Rechtliche Prüfung dieses Spots
- Zahlen stammen aus der fiktiven Beispieldatei und sind als Beispiel gekennzeichnet. Sie lassen sich mit dem Tarif 2026 nachrechnen.
- Kein Versprechen von Steuerersparnis, keine erfundenen Kundenstimmen.
- Untertitel als SRT: \`captions/${id}.srt\` (Voice-over-Text, falls eingesprochen).
`;
  fs.writeFileSync(path.join(ROOT, 'scripts', `${id}.md`), md);
  fs.writeFileSync(path.join(ROOT, 'captions', `${id}.txt`), `${v.caption}\n\n${v.hashtags.map((h) => '#' + h).join(' ')}\n`);
  index.push(`| [${id}](scripts/${id}.md) | ${v.concept} | ${v.title} | ${t.toFixed(1)} s | \`videos/${id}.mp4\` | \`thumbnails/${id}.jpg\` |`);
}
fs.writeFileSync(path.join(ROOT, 'README.md'), `# TikTok-Werbung: Übersicht

10 fertig exportierte Werbevideos (MP4, H.264/AAC, 1080 × 1920, 30 fps, Lautheit auf ca. −14 LUFS normalisiert).

| Skript | Konzept | Titel | Länge | Video | Thumbnail |
|---|---|---|---|---|---|
${index.join('\n')}

- **Ordner:** \`videos/\` MP4 · \`scripts/\` Skripte mit Szenenplan · \`captions/\` Caption-Texte und SRT-Untertitel · \`thumbnails/\` Titelbilder · \`images/\` verwendete Produktansichten · \`audio/\` synthetisierte Tonspuren · \`werbetexte/\` Anzeigentexte und Zielgruppe · \`engine/\` Quellcode zum Neu-Rendern.
- **Neu rendern:** \`cd engine && NODE_PATH=$(npm root -g) node render.js\` (benötigt Playwright/Chromium, FFmpeg, Python mit NumPy). Einzelnes Video: \`node render.js v02-demo\`.
- **Voice-over:** Die Videos funktionieren ohne Sprecher, als Text-Ads mit Musik. Für Creator-Versionen den VO-Text aus dem Skript selbst einsprechen und in CapCut oder im TikTok-Editor über das Video legen. Authentische Stimmen performen auf TikTok meist besser als synthetische.
`);
console.log('Skripte geschrieben:', index.length);
