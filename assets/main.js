/* Sheerwater Studios: small, dependency-free enhancements. The site works without this file. */
(function () {
  'use strict';

  var cfg = window.SW_CONFIG || {};
  var packages = window.SW_PACKAGES || [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function gbp(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }
  function round100(n) { return Math.round(n / 100) * 100; }
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
    if (key === 'email') {
      el.href = 'mailto:' + value;
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
      ship: 'cicd-pipeline'
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
      $('.result-meta', out).textContent = gbp(p.low) + ' to ' + gbp(p.high) + ' plus VAT, ' + p.timeline;
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
      });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === value ? 'true' : 'false'); });
      if (countEl) { countEl.textContent = 'Showing ' + shown + ' of ' + details.length + ' packages'; }
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); });
    });
    applyFilter('all');
  }

  /* Services page: estimator */
  var est = $('#estimator');
  if (est) {
    var estPkg = $('#est-package');
    var estTotal = $('#est-total');
    var estTime = $('#est-time');
    var estRetain = $('#est-retainer');
    var estRetainOut = $('#est-retainer-out');
    var estLink = $('#est-link');

    var sizeBand = {
      small: [0, 0.34],
      medium: [0.33, 0.67],
      large: [0.66, 1]
    };
    var retainerBand = { small: [750, 1250], medium: [1250, 1750], large: [1750, 2500] };

    var selectedSize = function () {
      var r = $('input[name="est-size"]:checked', est);
      return r ? r.value : 'medium';
    };

    var renderEstimate = function () {
      var p = pkg(estPkg.value);
      if (!p) { return; }
      var size = selectedSize();
      var band = sizeBand[size];
      var span = p.high - p.low;
      var low = round100(p.low + span * band[0]);
      var high = round100(p.low + span * band[1]);
      estTotal.textContent = gbp(low) + ' to ' + gbp(high);
      estTime.textContent = p.timeline + ' once the scope is agreed';
      if (estRetain.checked) {
        var rb = retainerBand[size];
        estRetainOut.textContent = 'Monthly support afterwards: about ' + gbp(rb[0]) + ' to ' + gbp(rb[1]) + ' a month.';
        estRetainOut.hidden = false;
      } else {
        estRetainOut.hidden = true;
      }
      estLink.href = 'contact.html?package=' + encodeURIComponent(p.slug) + '&size=' + size + (estRetain.checked ? '&retainer=1' : '');
    };

    est.addEventListener('change', renderEstimate);
    var wanted = params().get('package');
    if (wanted && pkg(wanted)) { estPkg.value = wanted; }
    renderEstimate();
  }

  /* Careers page: group filter */
  var roleBar = $('#role-filter');
  if (roleBar) {
    var roles = $$('.role');
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
    if (window.location.hash) {
      var target = $(window.location.hash);
      if (target && target.tagName === 'DETAILS') { target.open = true; }
    }
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
            say('That did not send. Try again, or email ' + (cfg.email || 'us') + ' directly.', 'error');
          });
        return;
      }

      if (!cfg.email) { say('This form is not connected yet. Add an email address in assets/config.js.', 'error'); return; }
      var href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary());
      say('Your email app should open with the details filled in. If it does not, email ' + cfg.email + ' directly.', 'ok');
      window.location.href = href;
    });
  });
})();
