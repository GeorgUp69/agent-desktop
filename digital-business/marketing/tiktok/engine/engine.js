/* Deterministische Motion-Graphics-Engine: Jeder Frame ist eine reine Funktion der Zeit t. */
(function () {
  'use strict';
  var MARK = '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#14213D"/><path d="M20 46V18h24" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 32h16" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M30 46h14" fill="none" stroke="#C8A24A" stroke-width="6" stroke-linecap="round"/></svg>';
  var MARK_INV = MARK.replace('fill="#14213D"', 'fill="#1F6F5C"');
  var params = new URLSearchParams(location.search);
  var video = window.STORYBOARDS[params.get('v')];
  var stage = document.getElementById('stage');
  var scenes = [];
  var total = 0;

  function esc(s) { return String(s).replace(/(\d) (%|€)/g, '$1\u00A0$2').replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function el(tag, cls, html, anim, delay) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (anim) { e.classList.add('el'); e.dataset.a = anim; e.dataset.d = delay || 0; }
    return e;
  }
  function accent(text, words, cls) {
    var out = esc(text);
    (words || []).forEach(function (w) { out = out.split(esc(w)).join('<span class="' + (cls || 'accent-brass') + '">' + esc(w) + '</span>'); });
    return out;
  }
  function fmt(v, dec, suffix) {
    return v.toLocaleString('de-DE', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }) + (suffix || '');
  }

  var builders = {
    hook: function (s, root) {
      var h = el('div', 'hook');
      var d = 0.05;
      s.lines.forEach(function (line, li) {
        var row = el('div');
        line.replace(/(\d) (%|€)/g, '$1\u00A0$2').split(' ').forEach(function (word) {
          var w = el('span', 'w ' + ((s.accent || []).map(function (a) { return a.replace(/(\d) (%|€)/g, '$1\u00A0$2'); }).indexOf(word) >= 0 ? (s.accentCls || 'accent-brass') : ''), esc(word), 'pop', d);
          d += s.wordGap || 0.11;
          row.appendChild(w);
        });
        h.appendChild(row);
        if (li < s.lines.length - 1) d += 0.05;
      });
      root.appendChild(h);
      if (s.sub) root.appendChild(el('div', 'sub', accent(s.sub, s.subAccent), 'up', d + 0.15));
    },
    text: function (s, root) {
      if (s.kicker) root.appendChild(el('div', 'kicker', esc(s.kicker), 'up', 0));
      root.appendChild(el('div', 'title' + (s.size === 'm' ? ' m' : ''), accent(s.title, s.accent, s.accentCls), 'up', 0.12));
      if (s.body) root.appendChild(el('div', 'body', accent(s.body, s.bodyAccent), 'up', 0.45));
    },
    number: function (s, root) {
      root.appendChild(el('div', 'label', esc(s.label), 'up', 0));
      var n = el('div', 'big ' + (s.color || 'accent-green'), fmt(s.from || 0, s.decimals, s.suffix), 'pop', 0.15);
      n.dataset.count = JSON.stringify({ from: s.from || 0, to: s.to, dec: s.decimals || 0, suffix: s.suffix || '', start: 0.2, dur: s.countDur || 1.4 });
      root.appendChild(n);
      if (s.body) root.appendChild(el('div', 'body', accent(s.body, s.bodyAccent), 'up', 0.9));
    },
    shot: function (s, root) {
      if (s.kicker) root.appendChild(el('div', 'kicker', esc(s.kicker), 'up', 0));
      if (s.title) root.appendChild(el('div', 'title m', accent(s.title, s.accent, s.accentCls), 'up', 0.1));
      var box = el('div', 'shotbox', '', 'rise', 0.25);
      box.style.height = (s.h || 760) + 'px';
      var img = el('img');
      img.src = '../images/' + s.img;
      img.dataset.kb = JSON.stringify(s.kb || [1, 1.08, 0, 0, 0, 0]);
      box.appendChild(img);
      if (s.hl) {
        var hl = el('div', 'hl', '', 'fade', s.hl.at || 1.2);
        hl.dataset.hl = JSON.stringify(s.hl);
        box.appendChild(hl);
      }
      root.appendChild(box);
    },
    list: function (s, root) {
      if (s.kicker) root.appendChild(el('div', 'kicker', esc(s.kicker), 'up', 0));
      if (s.title) root.appendChild(el('div', 'title m', accent(s.title, s.accent), 'up', 0.08));
      var list = el('div', 'list');
      s.items.forEach(function (it, i) {
        var icon = s.icon === 'num' ? String(i + 1) : s.icon === 'x' ? '✕' : '✓';
        var row = el('div', 'item', '<span class="ico ' + (s.icon === 'x' ? 'x' : '') + '">' + icon + '</span><span>' + accent(it, s.itemAccent) + '</span>', 'left', 0.35 + i * (s.gap || 0.42));
        list.appendChild(row);
      });
      root.appendChild(list);
    },
    compare: function (s, root) {
      if (s.title) root.appendChild(el('div', 'title m', accent(s.title, s.accent), 'up', 0));
      var g = el('div', 'cmp');
      [['l', s.left, 0.3], ['r', s.right, 1.0]].forEach(function (c) {
        var col = el('div', 'col ' + c[0], '<div class="lab">' + esc(c[1].label) + '</div><div class="val">' + esc(c[1].value) + '</div><div class="s">' + esc(c[1].sub) + '</div>', c[0] === 'l' ? 'left' : 'right', c[2]);
        g.appendChild(col);
      });
      root.appendChild(g);
    },
    bar: function (s, root) {
      if (s.kicker) root.appendChild(el('div', 'kicker', esc(s.kicker), 'up', 0));
      root.appendChild(el('div', 'title m', accent(s.title, s.accent), 'up', 0.08));
      var bar = el('div', 'bar ' + (s.warn ? 'warn' : ''), '<i></i>', 'fade', 0.3);
      bar.firstChild.dataset.bar = JSON.stringify({ to: Math.min(1, s.value / s.max), start: 0.5, dur: 1.6 });
      root.appendChild(bar);
      root.appendChild(el('div', 'barlab', '<span>' + fmt(s.value, 0, ' €') + '</span><span>' + fmt(s.max, 0, ' €') + '</span>', 'up', 0.6));
      if (s.body) root.appendChild(el('div', 'body', accent(s.body, s.bodyAccent), 'up', 1.2));
    },
    qa: function (s, root) {
      root.appendChild(el('div', 'qtag', esc(s.tag || 'Häufige Frage'), 'up', 0));
      root.appendChild(el('div', 'q', esc(s.q), 'pop', 0.1));
      root.appendChild(el('div', 'a', accent(s.a, s.accent), 'up', s.aAt || 1.3));
    },
    logo: function (s, root) {
      root.classList.add('cta');
      root.appendChild(el('div', 'mark', MARK_INV, 'pop', 0.1));
      if (s.title) root.appendChild(el('div', 't', esc(s.title), 'up', 0.6));
      if (s.sub) root.appendChild(el('div', 'p', esc(s.sub), 'up', 1.0));
    },
    cta: function (s, root) {
      root.classList.add('cta');
      root.appendChild(el('div', 'mark', MARK_INV, 'pop', 0));
      root.appendChild(el('div', 't', accent(s.title || 'Finanzcockpit 2026', s.accent), 'up', 0.2));
      root.appendChild(el('div', 'p', esc(s.price || 'ab 29 € · einmalig · kein Abo'), 'up', 0.45));
      root.appendChild(el('div', 'btn', esc(s.button || 'Link in Bio'), 'pulse', 0.75));
      root.appendChild(el('div', 'small', esc(s.small || 'Werkzeug zur Organisation und Schätzung · keine Steuerberatung'), 'fade', 1.0));
    },
  };

  video.scenes.forEach(function (s) {
    var bgName = s.bg || video.bg || 'ink';
    var root = el('section', 'scene ' + (bgName === 'paper' ? 'light' : 'dark'));
    var bg = el('div', 'bg ' + bgName);
    var b1 = el('div', 'blob'); b1.style.background = bgName === 'paper' ? '#E4F1EC' : '#2A8A73';
    var b2 = el('div', 'blob'); b2.style.background = bgName === 'paper' ? '#F3E6C4' : '#C8A24A';
    bg.appendChild(b1); bg.appendChild(b2);
    stage.appendChild(bg);
    builders[s.type](s, root);
    if (s.num) root.insertBefore(el('div', 'num', esc(s.num)), root.firstChild);
    if (s.cap) { var c = el('div', 'cap', '<span>' + esc(s.cap) + '</span>', 'up', s.capAt || 0.5); root.appendChild(c); }
    if (s.note) root.appendChild(el('div', 'note', esc(s.note), 'fade', 0.6));
    if (s.type !== 'cta' && s.type !== 'logo' && !video.noWatermark) {
      root.appendChild(el('div', 'wm', (bgName === 'paper' ? MARK : MARK_INV) + '<span>Freikontor</span>'));
    }
    stage.appendChild(root);
    scenes.push({ s: s, root: root, bg: bg, b1: b1, b2: b2, start: total, end: total + s.dur });
    total += s.dur;
  });
  var progress = el('div', 'progress');
  stage.appendChild(progress);

  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function outExpo(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
  function outBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function inOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  function applyAnim(e, lt) {
    var d = parseFloat(e.dataset.d || 0);
    var a = e.dataset.a;
    var p = clamp((lt - d) / 0.5);
    var o = clamp((lt - d) / 0.3);
    var tr = '';
    if (a === 'pop') { var q = outBack(clamp((lt - d) / 0.42)); tr = 'translateY(' + (1 - q) * 40 + 'px) scale(' + (0.6 + 0.4 * q) + ')'; }
    else if (a === 'up') tr = 'translateY(' + (1 - outExpo(p)) * 60 + 'px)';
    else if (a === 'rise') tr = 'translateY(' + (1 - outExpo(p)) * 160 + 'px) scale(' + (0.94 + 0.06 * outExpo(p)) + ')';
    else if (a === 'left') tr = 'translateX(' + (1 - outExpo(p)) * -120 + 'px)';
    else if (a === 'right') tr = 'translateX(' + (1 - outExpo(p)) * 120 + 'px)';
    else if (a === 'pulse') { var k = lt > d + 0.5 ? 1 + 0.04 * Math.sin((lt - d) * 6) : 0.7 + 0.3 * outBack(clamp((lt - d) / 0.45)); tr = 'scale(' + k + ')'; }
    e.style.opacity = o;
    e.style.transform = tr;
  }

  window.__duration = total;
  window.__scenes = scenes.map(function (x) { return { start: x.start, end: x.end, type: x.s.type, cap: x.s.cap || '' }; });
  window.__render = function (t) {
    progress.style.width = (clamp(t / total) * 1080) + 'px';
    scenes.forEach(function (sc) {
      var on = t >= sc.start && t < sc.end || (t >= total && sc === scenes[scenes.length - 1]);
      sc.root.classList.toggle('on', on);
      sc.bg.style.display = on ? 'block' : 'none';
      if (!on) return;
      var lt = t - sc.start;
      var left = sc.end - t;
      sc.b1.style.transform = 'translate(' + (-200 + 120 * Math.sin(t * 0.35)) + 'px,' + (100 + 80 * Math.cos(t * 0.27)) + 'px)';
      sc.b2.style.transform = 'translate(' + (500 + 100 * Math.cos(t * 0.3)) + 'px,' + (1200 + 120 * Math.sin(t * 0.22)) + 'px)';
      var exit = sc === scenes[scenes.length - 1] ? 1 : clamp(left / 0.22);
      var enter = clamp(lt / 0.18);
      sc.root.style.opacity = Math.min(exit, 1);
      sc.root.style.transform = 'scale(' + (1 + (1 - exit) * 0.04) + ')';
      sc.bg.style.opacity = sc.start === 0 ? 1 : enter;
      sc.root.querySelectorAll('.el').forEach(function (e) { applyAnim(e, lt); });
      sc.root.querySelectorAll('[data-count]').forEach(function (e) {
        var c = JSON.parse(e.dataset.count);
        var p = outExpo(clamp((lt - c.start) / c.dur));
        e.textContent = fmt(c.from + (c.to - c.from) * p, c.dec, c.suffix);
      });
      sc.root.querySelectorAll('[data-bar]').forEach(function (e) {
        var c = JSON.parse(e.dataset.bar);
        e.style.width = (inOut(clamp((lt - c.start) / c.dur)) * c.to * 100) + '%';
      });
      sc.root.querySelectorAll('img[data-kb]').forEach(function (img) {
        if (!img.naturalWidth) return;
        var k = JSON.parse(img.dataset.kb);
        var box = img.parentNode;
        var bw = box.clientWidth, bh = box.clientHeight;
        var base = bw / img.naturalWidth;
        var p = inOut(clamp(lt / sc.s.dur));
        var sc2 = base * (k[0] + (k[1] - k[0]) * p);
        var w = img.naturalWidth * sc2, h = img.naturalHeight * sc2;
        var fx = k[2] + (k[3] - k[2]) * p, fy = k[4] + (k[5] - k[4]) * p;
        var x = -(w - bw) * fx, y = h < bh ? (bh - h) / 2 : -(h - bh) * fy;
        img.style.width = img.naturalWidth + 'px';
        img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + sc2 + ')';
        var hl = box.querySelector('[data-hl]');
        if (hl) {
          var r = JSON.parse(hl.dataset.hl);
          hl.style.left = (x + r.x * w) + 'px'; hl.style.top = (y + r.y * h) + 'px';
          hl.style.width = (r.w * w) + 'px'; hl.style.height = (r.h * h) + 'px';
        }
      });
    });
  };
  window.__ready = Promise.all([document.fonts.ready].concat(Array.prototype.map.call(document.images, function (i) {
    return i.complete ? Promise.resolve() : new Promise(function (r) { i.onload = r; i.onerror = r; });
  })));
  window.__render(0);
})();
