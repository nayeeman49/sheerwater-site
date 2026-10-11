/* Sheerwater Consulting: small, dependency-free enhancements. The site works without this file. */
(function () {
  'use strict';

  var cfg = window.SW_CONFIG || {};
  var packages = window.SW_PACKAGES || [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pkg(slug) {
    for (var i = 0; i < packages.length; i++) { if (packages[i].slug === slug) { return packages[i]; } }
    return null;
  }
  function params() { try { return new URLSearchParams(window.location.search); } catch (e) { return { get: function () { return null; } }; } }

  /* Settings from config.js */
  $$('[data-config]').forEach(function (el) {
    var key = el.getAttribute('data-config');
    var value = cfg[key];
    if (!value) { return; }
    if (key === 'phone') {
      el.href = 'tel:' + value.replace(/[^+\d]/g, '');
      if (el.hasAttribute('data-show')) { el.textContent = value; }
    } else {
      el.href = value;
    }
  });

  /* Mobile menu */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Home page: package finder */
  var finder = $('#finder');
  if (finder) {
    var needSel = $('#finder-need');
    var whoSel = $('#finder-who');
    var out = $('#finder-result');
    var needMap = {
      cloud: 'cloud-landing-zone',
      containers: 'kubernetes-baseline',
      linux: 'linux-automation',
      compute: 'hpc-gpu-cluster',
      ai: 'private-ai-pilot',
      ship: 'cicd-pipeline',
      app: 'application-development',
      onprem: 'on-prem-infrastructure'
    };
    var whoNote = {
      research: 'Research groups usually start with scheduling and storage. We can size GPUs as part of the work.',
      startup: 'Startups usually need a repeatable cloud base before anything else is built on top.',
      regulated: 'For regulated work we keep data inside your environment and log who touches it.',
      msp: 'We can act as extra capacity for your team on client projects.'
    };

    var renderFinder = function () {
      var p = pkg(needMap[needSel.value]);
      if (!p) {
        out.innerHTML = '<p class="muted">Choose what you need most and the best-fit package appears here.</p>';
        return;
      }
      var note = whoNote[whoSel.value] || '';
      out.innerHTML =
        '<p class="result-name"></p>' +
        '<p class="result-meta"></p>' +
        '<p class="result-summary"></p>' +
        (note ? '<p class="result-note"></p>' : '') +
        '<div class="btn-row"><a class="btn btn-primary btn-small result-quote">Request this package</a>' +
        '<a class="btn btn-quiet btn-small result-detail">See what is included</a></div>';
      $('.result-name', out).textContent = p.name;
      $('.result-meta', out).textContent = 'Fixed price, ' + p.timeline;
      $('.result-summary', out).textContent = p.summary;
      if (note) { $('.result-note', out).textContent = note; }
      $('.result-quote', out).href = 'contact.html?package=' + encodeURIComponent(p.slug);
      $('.result-detail', out).href = 'services.html#' + p.slug;
    };
    finder.addEventListener('change', renderFinder);
    finder.addEventListener('submit', function (e) { e.preventDefault(); renderFinder(); });
    renderFinder();
  }

  /* Services page: audience filter */
  var audienceBar = $('#audience-filter');
  if (audienceBar) {
    var details = $$('.pkg-detail');
    var chips = $$('.chip', audienceBar);
    var countEl = $('#audience-count');
    var applyFilter = function (value) {
      var shown = 0;
      details.forEach(function (el) {
        var list = (el.getAttribute('data-audiences') || '').split(' ');
        var show = value === 'all' || list.indexOf(value) !== -1;
        el.hidden = !show;
        if (show) { shown += 1; }
        $$('.pkg-view', el).forEach(function (v) { v.hidden = v.getAttribute('data-view') !== value; });
      });
      $$('.audience-intro').forEach(function (box) { box.hidden = box.getAttribute('data-audience') !== value; });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === value ? 'true' : 'false'); });
      if (countEl) { countEl.textContent = 'Showing ' + shown + ' of ' + details.length + ' packages'; }
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); });
    });
    var wantedAudience = params().get('audience');
    var known = chips.some(function (c) { return c.getAttribute('data-filter') === wantedAudience; });
    applyFilter(known ? wantedAudience : 'all');
  }

  /* Careers page: group filter */
  var roleBar = $('#role-filter');
  if (roleBar) {
    var roles = $$('.job');
    var roleChips = $$('.chip', roleBar);
    var roleCount = $('#role-count');
    var applyRoleFilter = function (value) {
      var shown = 0;
      roles.forEach(function (el) {
        var show = value === 'all' || el.getAttribute('data-group') === value;
        el.hidden = !show;
        if (show) { shown += 1; }
      });
      roleChips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === value ? 'true' : 'false'); });
      if (roleCount) { roleCount.textContent = 'Showing ' + shown + ' of ' + roles.length + ' roles'; }
    };
    roleChips.forEach(function (c) {
      c.addEventListener('click', function () { applyRoleFilter(c.getAttribute('data-filter')); });
    });
    applyRoleFilter('all');
  }

  /* Prefill forms from the address (?package=, ?size=, ?retainer=, ?role=) */
  var q = params();
  var pkgField = $('#f-package');
  if (pkgField && q.get('package')) { pkgField.value = q.get('package'); }
  var sizeField = $('#f-size');
  if (sizeField && q.get('size')) { sizeField.value = q.get('size'); }
  var retainField = $('#f-retainer');
  if (retainField && q.get('retainer')) { retainField.checked = true; }
  var roleField = $('#f-role');
  if (roleField && q.get('role')) { roleField.value = q.get('role'); }

  /* Forms: send to a form service if configured, otherwise open the visitor's email app */
  $$('form[data-form]').forEach(function (form) {
    var status = $('.form-status', form);
    var kind = form.getAttribute('data-form');

    function say(text, cls) {
      if (!status) { return; }
      status.textContent = text;
      status.className = 'form-status' + (cls ? ' ' + cls : '');
    }

    function labelFor(field) {
      if (field.getAttribute('data-label')) { return field.getAttribute('data-label'); }
      var label = form.querySelector('label[for="' + field.id + '"]');
      return label ? label.childNodes[0].textContent.trim() : field.name;
    }

    function summary() {
      var lines = [];
      $$('input, select, textarea', form).forEach(function (f) {
        if (!f.name || f.name === '_gotcha' || f.type === 'submit') { return; }
        if (f.type === 'checkbox') {
          lines.push(labelFor(f) + ': ' + (f.checked ? 'yes' : 'no'));
          return;
        }
        var v = (f.value || '').trim();
        if (v) {
          var shown = f.tagName === 'SELECT' ? f.options[f.selectedIndex].text : v;
          lines.push(labelFor(f) + ': ' + shown);
        }
      });
      return lines.join('\n');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        say('Please complete the highlighted fields.', 'error');
        return;
      }
      var honey = form.querySelector('[name="_gotcha"]');
      if (honey && honey.value) { say('Thanks, your message is sent.', 'ok'); form.reset(); return; }

      var subject = (kind === 'apply' ? 'Application: ' : 'Project enquiry: ') + (form.querySelector('[name="name"]').value || '').trim();

      if (cfg.formEndpoint) {
        var data = new FormData(form);
        data.append('_subject', subject);
        var roleSel = form.querySelector('[name="role"]');
        if (roleSel && roleSel.selectedIndex > 0) { data.append('role_title', roleSel.options[roleSel.selectedIndex].text); }
        data.append('from_name', 'Sheerwater Consulting website');
        if (cfg.formAccessKey) { data.append('access_key', cfg.formAccessKey); data.append('subject', subject); }
        say('Sending...', '');
        fetch(cfg.formEndpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
          .then(function (res) {
            if (!res.ok) { throw new Error('bad status'); }
            say(kind === 'apply'
              ? 'Thanks, your details are in. We contact people when a project matches their skills.'
              : 'Thanks, your enquiry is sent. We aim to reply within two working days.', 'ok');
            form.reset();
          })
          .catch(function () {
            say('That did not send. Please try again in a moment, or call us.', 'error');
          });
        return;
      }

      if (!cfg.email) { say('This form is not connected yet. Add an email address in assets/config.js.', 'error'); return; }
      var href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary());
      say('Your email app should open with the details filled in. If it does not, please call us.', 'ok');
      window.location.href = href;
    });
  });
})();

/* Motion: scroll reveals, pointer spotlight, header shadow, page-leave fallback */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* Header shadow once scrolled */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Soft spotlight that follows the pointer over cards */
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.pkg-row, .panel, .role summary');
    if (!el) { return; }
    var r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  if (reduce) { return; }

  /* Reveal sections as they scroll into view */
  if ('IntersectionObserver' in window) {
    var targets = Array.prototype.slice.call(document.querySelectorAll(
      'main .section-head, main .steps li, main .pkg-list li, main .split > *, main .notice, main .job, main .pkg-detail, main .audience-intro, main form.panel'
    )).filter(function (el) { return !el.closest('.hero, .page-hero, [hidden]'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(sibs, 6) * 70 + 'ms');
      io.observe(el);
    });
    /* Safety net: never leave content hidden */
    setTimeout(function () { targets.forEach(function (el) { el.classList.add('in'); }); }, 4000);
  }

  /* Page transitions: use the browser's own when available, otherwise fade */
  if (!('onpageswap' in window)) {
    root.classList.add('vt-fallback');
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) { return; }
      if (a.target && a.target !== '_self') { return; }
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin || url.pathname === location.pathname) { return; }
      e.preventDefault();
      root.classList.add('leaving');
      setTimeout(function () { location.href = a.href; }, 220);
    });
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) { root.classList.remove('leaving'); } });
  }
})();
