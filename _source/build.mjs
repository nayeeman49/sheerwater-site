// Builds the static site. Run from the project root:  node _source/build.mjs
// No dependencies. Reads _source/, writes the finished pages next to index.html.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (p) => readFileSync(join(here, p), 'utf8');

const site = JSON.parse(read('site.json'));
const packages = JSON.parse(read('packages.json'));
const roles = JSON.parse(read('roles.json'));
const audiences = JSON.parse(read('audiences.json'));
const layout = read('layout.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const gbp = (n) => '£' + n.toLocaleString('en-GB');
const audienceLabel = { research: 'research groups', startup: 'startups', regulated: 'regulated businesses', msp: 'IT providers' };

// Reusable blocks injected into pages through {{tokens}}.
const blocks = {
  packages_list: () =>
    '<ul class="pkg-list">\n' +
    packages.map((p) => `  <li><a class="pkg-row" href="services.html#${p.slug}">
    <div><h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p></div>
    <div class="pkg-facts"><span class="pkg-price">${gbp(p.low)} to ${gbp(p.high)}</span><span class="pkg-time">${esc(p.timeline)}</span></div>
  </a></li>`).join('\n') +
    '\n</ul>',

  packages_detail: () =>
    packages.map((p) => {
      const missing = p.audiences.filter((a) => !(p.views && p.views[a]));
      if (missing.length) throw new Error(`${p.slug}: missing audience views for ${missing.join(', ')}`);

      const view = (key, v, extra = '') => `  <div class="pkg-view" data-view="${key}"${key === 'all' ? '' : ' hidden'}>
    <p class="lede">${esc(v.headline)}</p>
${v.scenario ? `    <h4>A typical project</h4>\n    <p class="scenario">${esc(v.scenario)}</p>\n` : ''}    <div class="pkg-detail-grid">
      <div>
        <h4>What you get</h4>
        <ul>
${v.deliverables.map((d) => `          <li>${esc(d)}</li>`).join('\n')}
        </ul>
      </div>
      <dl>
        <dt><h4>Good fit for</h4></dt>
        <dd>${esc(v.fit)}</dd>
        <dt><h4>What we need from you</h4></dt>
        <dd>${esc(v.needs)}</dd>
${v.priceNote ? `        <dt><h4>What moves the price</h4></dt>\n        <dd>${esc(v.priceNote)}</dd>\n` : ''}${extra}      </dl>
    </div>
  </div>`;

      const general = view(
        'all',
        { headline: p.summary, deliverables: p.deliverables, fit: p.fit, needs: p.needs },
        `        <dt><h4>Often chosen by</h4></dt>\n        <dd>${p.audiences.map((a) => audienceLabel[a]).join(', ')}</dd>\n`
      );
      const tailored = p.audiences.map((a) => view(a, p.views[a])).join('\n');

      return `<article class="pkg-detail" id="${p.slug}" data-audiences="${p.audiences.join(' ')}">
  <div class="pkg-detail-head">
    <h3>${esc(p.name)}</h3>
    <p class="pkg-facts"><span class="pkg-price">${gbp(p.low)} to ${gbp(p.high)} plus VAT</span><span class="pkg-time">${esc(p.timeline)}</span></p>
  </div>
${general}
${tailored}
  <p><a class="btn btn-primary btn-small" href="contact.html?package=${p.slug}">Request this package</a></p>
</article>`;
    }).join('\n'),

  audience_intros: () =>
    Object.entries(audiences).map(([key, a]) => `<div class="audience-intro" data-audience="${key}" hidden>
  <h2>${esc(a.title)}</h2>
  <p>${esc(a.intro)}</p>
</div>`).join('\n'),

  package_options: () =>
    '<option value="">Not sure yet</option>\n' +
    packages.map((p) => `<option value="${p.slug}">${esc(p.name)}</option>`).join('\n'),

  estimator_options: () =>
    packages.map((p) => `<option value="${p.slug}">${esc(p.name)}</option>`).join('\n'),

  roles_list: () =>
    roles.map((r) => `<details class="role" id="${r.slug}" data-group="${r.group}">
  <summary>
    <span><span class="role-title">${esc(r.title)}</span><br><span class="role-meta">${esc(r.summary)}</span></span>
    <span class="role-toggle"></span>
  </summary>
  <div class="role-body">
    <div>
      <h4>What you would work on</h4>
      <ul>
${r.work.map((w) => `        <li>${esc(w)}</li>`).join('\n')}
      </ul>
    </div>
    <div>
      <h4>What you bring</h4>
      <ul>
${r.bring.map((b) => `        <li>${esc(b)}</li>`).join('\n')}
      </ul>
    </div>
    <a class="btn btn-primary btn-small" href="apply.html?role=${r.slug}">Apply for this role</a>
  </div>
</details>`).join('\n'),

  role_options: () =>
    '<option value="">Choose a role</option>\n' +
    roles.map((r) => `<option value="${r.slug}">${esc(r.title)}</option>`).join('\n') +
    '\n<option value="general">General interest, no specific role</option>',
};

function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in values ? values[key] : m));
}

const base = site.siteUrl.replace(/\/$/, '');
const year = String(new Date().getFullYear());
const pageFiles = readdirSync(join(here, 'pages')).filter((f) => f.endsWith('.html')).sort();
const urls = [];

for (const file of pageFiles) {
  let raw = read(join('pages', file));
  const m = raw.match(/^<!--meta\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> first line`);
  const meta = JSON.parse(m[1]);
  raw = raw.slice(m[0].length);

  const tokens = {};
  for (const key of Object.keys(blocks)) tokens[key] = blocks[key]();
  const content = fill(raw, tokens);

  const nav = site.nav
    .map((n) => `<a href="${n.href}"${n.key === meta.key ? ' aria-current="page"' : ''}>${n.label}</a>`)
    .join('\n      ');

  const title = meta.home ? meta.title : `${meta.title} | ${site.name}`;
  const canonical = file === 'index.html' ? `${base}/` : `${base}/${file}`;

  const html = fill(layout, {
    title: esc(title),
    description: esc(meta.description),
    canonical,
    nav,
    year,
    content,
  });

  writeFileSync(join(root, file), html);
  if (!meta.noindex) urls.push(canonical);
  console.log('built', file);
}

// Package data for the finder and the estimator, from the same source as the page text.
writeFileSync(
  join(root, 'assets', 'packages.js'),
  '// Generated by _source/build.mjs from _source/packages.json. Edit that file, then rebuild.\n' +
    'window.SW_PACKAGES = ' + JSON.stringify(packages.map(({ slug, name, summary, timeline, low, high }) => ({ slug, name, summary, timeline, low, high })), null, 2) + ';\n'
);

writeFileSync(
  join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
    '\n</urlset>\n'
);
writeFileSync(join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

console.log(`done: ${pageFiles.length} pages`);
