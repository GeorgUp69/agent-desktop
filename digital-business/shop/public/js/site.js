(function () {
  'use strict';
  var btn = document.querySelector('[data-menu]');
  var nav = document.getElementById('mobile-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var script = document.currentScript || document.querySelector('script[data-pixel]');
  var pixelId = script && script.getAttribute('data-pixel');
  if (!pixelId) return;
  var KEY = 'fk-consent-tiktok';
  var banner = document.getElementById('consent');

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* privater Modus */ } }

  function loadPixel() {
    if (window.ttq) return;
    var ttq = window.ttq = [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq._i = {}; ttq._i[pixelId] = []; ttq._t = {}; ttq._t[pixelId] = +new Date(); ttq._o = {}; ttq._o[pixelId] = {};
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + encodeURIComponent(pixelId) + '&lib=ttq';
    document.head.appendChild(s);
    ttq.page();
    var p = document.querySelector('[data-purchase]');
    if (p) {
      ttq.track('CompletePayment', { value: Number(p.getAttribute('data-purchase')), currency: 'EUR',
        contents: [{ content_id: p.getAttribute('data-edition'), content_type: 'product', quantity: 1 }] });
    }
  }

  function decide(v) {
    write(v);
    if (banner) banner.hidden = true;
    if (v === 'allow') loadPixel();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-consent]');
    if (t) decide(t.getAttribute('data-consent'));
    var o = e.target.closest('[data-consent-open]');
    if (o) {
      e.preventDefault();
      if (read() === 'allow') { write('deny'); location.reload(); return; }
      if (banner) banner.hidden = false;
    }
  });

  var state = read();
  if (state === 'allow') loadPixel();
  else if (state !== 'deny' && banner) banner.hidden = false;
})();
