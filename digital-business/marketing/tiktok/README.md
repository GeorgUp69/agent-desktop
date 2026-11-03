# TikTok-Werbung: Übersicht

10 fertig exportierte Werbevideos (MP4, H.264/AAC, 1080 × 1920, 30 fps, Lautheit auf ca. −14 LUFS normalisiert).

| Skript | Konzept | Titel | Länge | Video | Thumbnail |
|---|---|---|---|---|---|
| [v01-doppelschlag](scripts/v01-doppelschlag.md) | Problem-Lösung | Der Doppelschlag | 26.4 s | `videos/v01-doppelschlag.mp4` | `thumbnails/v01-doppelschlag.jpg` |
| [v02-demo](scripts/v02-demo.md) | Produktdemonstration | In 3 Schritten zur Rücklage | 24.8 s | `videos/v02-demo.mp4` | `thumbnails/v02-demo.jpg` |
| [v03-vorher-nachher](scripts/v03-vorher-nachher.md) | Vorher-Nachher (Rechenbeispiel) | Bauchgefühl vs. Berechnung | 21.2 s | `videos/v03-vorher-nachher.mp4` | `thumbnails/v03-vorher-nachher.jpg` |
| [v04-brief](scripts/v04-brief.md) | Emotional | Der Brief vom Finanzamt | 22.8 s | `videos/v04-brief.mp4` | `thumbnails/v04-brief.jpg` |
| [v05-direkt](scripts/v05-direkt.md) | Direktes Verkaufsvideo | 29 € statt Abo | 21.8 s | `videos/v05-direkt.mp4` | `thumbnails/v05-direkt.jpg` |
| [v06-lena](scripts/v06-lena.md) | Storytelling | Lenas Nebenjob | 26.8 s | `videos/v06-lena.mp4` | `thumbnails/v06-lena.jpg` |
| [v07-reverse-charge](scripts/v07-reverse-charge.md) | Überraschungseffekt | Meta-Ads und Kleinunternehmer | 23.2 s | `videos/v07-reverse-charge.mp4` | `thumbnails/v07-reverse-charge.jpg` |
| [v08-vorteile](scripts/v08-vorteile.md) | Produktvorteile | 5 Gründe | 20.6 s | `videos/v08-vorteile.mp4` | `thumbnails/v08-vorteile.jpg` |
| [v09-fragen](scripts/v09-fragen.md) | Häufige Kundenprobleme | 3 Fragen, die alle stellen | 25.6 s | `videos/v09-fragen.mp4` | `thumbnails/v09-fragen.jpg` |
| [v10-brand](scripts/v10-brand.md) | Premium-Brand-Werbung | Klarheit ist eine Zahl | 20.6 s | `videos/v10-brand.mp4` | `thumbnails/v10-brand.jpg` |

- **Ordner:** `videos/` MP4 · `scripts/` Skripte mit Szenenplan · `captions/` Caption-Texte und SRT-Untertitel · `thumbnails/` Titelbilder · `images/` verwendete Produktansichten · `audio/` synthetisierte Tonspuren · `werbetexte/` Anzeigentexte und Zielgruppe · `engine/` Quellcode zum Neu-Rendern.
- **Neu rendern:** `cd engine && NODE_PATH=$(npm root -g) node render.js` (benötigt Playwright/Chromium, FFmpeg, Python mit NumPy). Einzelnes Video: `node render.js v02-demo`.
- **Voice-over:** Die Videos funktionieren ohne Sprecher, als Text-Ads mit Musik. Für Creator-Versionen den VO-Text aus dem Skript selbst einsprechen und in CapCut oder im TikTok-Editor über das Video legen. Authentische Stimmen performen auf TikTok meist besser als synthetische.
