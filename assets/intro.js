/* Scroll-driven intro: an exploded server that comes apart as you scroll. No libraries. */
(function () {
  'use strict';
  var sec = document.getElementById('intro');
  if (!sec || !document.documentElement.classList.contains('intro-on')) { return; }

  var rig = sec.querySelector('.rig');
  var caps = Array.prototype.slice.call(sec.querySelectorAll('.cap'));
  var phaseNames = [null, 'onprem', 'ai', 'cloud', null];
  var phase = -1;
  var ticking = false;

  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function smooth(x) { x = clamp(x); return x * x * (3 - 2 * x); }

  function update() {
    ticking = false;
    var r = sec.getBoundingClientRect();
    var total = sec.offsetHeight - window.innerHeight;
    var p = total > 0 ? clamp(-r.top / total) : 0;

    // Pull apart over the first 18%, hold, then settle back together for the close.
    var e = smooth(p / 0.18) * (1 - 0.8 * smooth((p - 0.86) / 0.12));
    sec.style.setProperty('--e', e.toFixed(4));

    var next = p < 0.14 ? 0 : p < 0.38 ? 1 : p < 0.6 ? 2 : p < 0.82 ? 3 : 4;
    if (next !== phase) {
      phase = next;
      sec.setAttribute('data-phase', String(phase));
      caps.forEach(function (c, i) { c.classList.toggle('on', i === phase); });
      var name = phaseNames[phase];
      if (name) { rig.setAttribute('data-active', name); } else { rig.removeAttribute('data-active'); }
    }
  }

  function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();
