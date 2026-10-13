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
    <div class="pkg-facts"><span class="pkg-price">Fixed price</span><span class="pkg-time">${esc(p.timeline)}</span></div>
  </a></li>`).join('\n') +
    '\n</ul>',

  lead_package: () => {
    const p = packages.find((x) => x.slug === 'on-prem-infrastructure');
    return `<h2>${esc(p.name)}</h2>
      <p class="muted">${esc(p.timeline)} · Fixed price</p>
      <ul>
${p.deliverables.map((d) => `        <li>${esc(d)}</li>`).join('\n')}
      </ul>
      <p><a class="btn btn-primary btn-small" href="contact.html?package=${p.slug}">Request this package</a></p>`;
  },

  other_packages_list: () =>
    '<ul class="pkg-list">\n' +
    packages.filter((p) => p.slug !== 'on-prem-infrastructure').map((p) => `  <li><a class="pkg-row" href="services.html#${p.slug}">
    <div><h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p></div>
    <div class="pkg-facts"><span class="pkg-price">Fixed price</span><span class="pkg-time">${esc(p.timeline)}</span></div>
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
${v.priceNote ? `        <dt><h4>What shapes the scope</h4></dt>\n        <dd>${esc(v.priceNote)}</dd>\n` : ''}${extra}      </dl>
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
    <p class="pkg-facts"><span class="pkg-price">Fixed price</span><span class="pkg-time">${esc(p.timeline)}</span></p>
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
    '<ul class="pkg-list">\n' +
    roles.map((r) => `  <li class="job" data-group="${r.group}"><a class="pkg-row" href="job-${r.slug}.html">
    <div><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p></div>
    <div class="pkg-facts"><span class="pkg-price">${r.closed ? 'Closed' : esc(r.type)}</span><span class="pkg-time">${r.closed ? 'Not accepting applications' : `Remote from Dhaka, fixed salary${r.openings > 1 ? `, ${r.openings} positions` : ''}`}</span></div>
  </a></li>`).join('\n') +
    '\n</ul>',

  role_options: () =>
    '<option value="">Choose a role</option>\n' +
    roles.filter((r) => !r.closed).map((r) => `<option value="${r.slug}">${esc(r.title)}</option>`).join('\n') +
    '\n<option value="general">General interest, no specific role</option>',
};

function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in values ? values[key] : m));
}

const base = site.siteUrl.replace(/\/$/, '');
const year = String(new Date().getFullYear());
const pageFiles = readdirSync(join(here, 'pages')).filter((f) => f.endsWith('.html')).sort();
const urls = [];

function writePage(file, meta, content) {
  const nav = site.nav
    .map((n) => `<a href="${n.href}"${n.key === meta.key ? ' aria-current="page"' : ''}>${n.label}</a>`)
    .join('\n      ');
  const title = meta.home ? meta.title : `${meta.title} | ${site.name}`;
  const canonical = file === 'index.html' ? `${base}/` : `${base}/${file}`;
  const html = fill(layout, {
    title: esc(title),
    description: esc(meta.description),
    canonical,
    ogimage: `${base}/assets/og.png`,
    nav,
    year,
    content,
  });
  writeFileSync(join(root, file), html);
  if (!meta.noindex) urls.push(canonical);
  console.log('built', file);
}

for (const file of pageFiles) {
  let raw = read(join('pages', file));
  const m = raw.match(/^<!--meta\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> first line`);
  const meta = JSON.parse(m[1]);
  raw = raw.slice(m[0].length);
  const tokens = {};
  for (const key of Object.keys(blocks)) tokens[key] = blocks[key]();
  writePage(file, meta, fill(raw, tokens));
}

// One page per job advert: job-<slug>.html
const ul = (a) => a.map((x) => `          <li>${esc(x)}</li>`).join('\n');
for (const r of roles) {
  const content = `<section class="page-hero">
  <div class="wrap">
    <p class="crumb"><a href="careers.html#roles">&larr; All roles</a></p>
    <h1>${esc(r.title)}</h1>
    <p class="lede">${esc(r.summary)}</p>
    <ul class="role-facts" aria-label="Role details">
      <li><span>Type</span>${esc(r.type)}</li>
      <li><span>Location</span>Remote, based in Dhaka, Bangladesh</li>
      <li><span>Salary</span>Fixed</li>
      <li><span>${r.closed ? 'Status' : 'Positions'}</span>${r.closed ? 'Closed' : r.openings}</li>
    </ul>
${r.closed ? `    <div class="notice"><p><strong>This role is closed and we are not accepting new applications.</strong> Thank you to everyone who applied. You can <a href="apply.html?role=general">register general interest</a> for future roles.</p></div>
    <div class="btn-row"><a class="btn btn-primary" href="careers.html#roles">See open roles</a></div>` : `    <div class="btn-row"><a class="btn btn-primary" href="apply.html?role=${r.slug}">Apply for this role</a></div>`}
  </div>
</section>

<section class="section" style="padding-top:1rem">
  <div class="wrap">
    <div class="role-body">
      <div class="role-wide">
        <h2>About the role</h2>
        <p>${esc(r.about)}</p>
      </div>
      <div>
        <h3>What you would work on</h3>
        <ul>
${ul(r.work)}
        </ul>
      </div>
      <div>
        <h3>Requirements</h3>
        <ul>
${ul(r.requirements)}
        </ul>
        <h3 class="role-sub">Nice to have</h3>
        <ul>
${ul(r.nice)}
        </ul>
      </div>
      <div class="role-wide">
        <h3>How we assess</h3>
        <p>${esc(r.trial)} Every trial task is paid.</p>
      </div>
    </div>
  </div>
</section>

${r.closed ? '' : `<section class="section tint">
  <div class="wrap">
    <div class="section-head">
      <h2>How to apply</h2>
    </div>
    <ol class="steps">
      <li><h3>Send the form</h3><p>About five minutes. Include links to your work, such as GitHub, a portfolio or an online CV.</p></li>
      <li><h3>Intro call</h3><p>Thirty minutes about your experience and availability.</p></li>
      <li><h3>Paid trial task</h3><p>A small, real task with a written brief. You are paid for it.</p></li>
      <li><h3>Offer</h3><p>A written agreement covering the work, salary, confidentiality and ownership of what you build.</p></li>
    </ol>
    <div class="btn-row"><a class="btn btn-primary" href="apply.html?role=${r.slug}">Apply for this role</a><a class="btn btn-quiet" href="careers.html#roles">See other roles</a></div>
  </div>
</section>`}
`;
  writePage(`job-${r.slug}.html`, { title: `${r.title}, remote from Dhaka`, description: `${r.closed ? 'Closed, not accepting applications. ' : ''}${r.summary} Remote ${r.type.toLowerCase()} for candidates based in Dhaka, Bangladesh, with ${site.name}. Fixed salary.`, key: 'careers' }, content);
}

// Package data for the finder and the estimator, from the same source as the page text.
writeFileSync(
  join(root, 'assets', 'packages.js'),
  '// Generated by _source/build.mjs from _source/packages.json. Edit that file, then rebuild.\n' +
    'window.SW_PACKAGES = ' + JSON.stringify(packages.map(({ slug, name, summary, timeline }) => ({ slug, name, summary, timeline })), null, 2) + ';\n'
);

writeFileSync(
  join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
    '\n</urlset>\n'
);
writeFileSync(join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

console.log(`done: ${pageFiles.length + roles.length} pages`);
