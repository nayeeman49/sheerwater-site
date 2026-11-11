/* Sheerwater Consulting: lead finder.
   Turns the options chosen on the page into ready-made search links (LinkedIn, Google, job boards,
   public sector tenders). Nothing is sent anywhere and nothing is scraped: each link opens the
   search site in a new tab and you read the results yourself. */
(function () {
  'use strict';

  /* ---------- Data ---------- */

  var AUDIENCES = {
    regulated: {
      label: 'Regulated businesses (law, health, finance)',
      sectors: ['law firm', 'solicitors', 'accountancy', 'financial services', 'healthcare'],
      titles: ['IT Director', 'Head of IT', 'IT Manager', 'Data Protection Officer', 'Practice Manager', 'Managing Partner']
    },
    startup: {
      label: 'Startups and scale-ups',
      sectors: ['startup', 'scale-up', 'SaaS'],
      titles: ['CTO', 'Head of Engineering', 'VP Engineering', 'Technical Co-founder']
    },
    research: {
      label: 'Research groups',
      sectors: ['university', 'research institute', 'laboratory'],
      titles: ['Head of Research Computing', 'Research IT Manager', 'Head of IT', 'Research Software Engineering Manager']
    },
    msp: {
      label: 'IT providers',
      sectors: ['managed service provider', 'IT support company'],
      titles: ['Managing Director', 'Technical Director', 'Service Delivery Manager', 'Head of Infrastructure']
    }
  };

  var SECTORS = [
    { key: 'legal', label: 'Legal', terms: ['law firm', 'solicitors'], sic: '69101, 69102' },
    { key: 'accountancy', label: 'Accountancy', terms: ['accountancy', 'accountants'], sic: '69201, 69202, 69203' },
    { key: 'health', label: 'Healthcare and clinics', terms: ['clinic', 'healthcare', 'care provider'], sic: '86210, 86220, 86900, 87100' },
    { key: 'education', label: 'Universities and schools', terms: ['university', 'college', 'academy trust'], sic: '85310, 85320, 85421, 85422' },
    { key: 'research', label: 'Research and life sciences', terms: ['research institute', 'biotech', 'laboratory'], sic: '72110, 72190' },
    { key: 'engineering', label: 'Engineering and manufacturing', terms: ['engineering firm', 'manufacturer'], sic: '71129, 25110, 28990' },
    { key: 'finance', label: 'Financial services', terms: ['financial services', 'wealth management', 'insurance broker'], sic: '64999, 66190, 66220' },
    { key: 'software', label: 'Software and SaaS', terms: ['software company', 'SaaS'], sic: '62012, 62020, 62090' },
    { key: 'public', label: 'Local government and charities', terms: ['local authority', 'council', 'charity'], sic: '84110, 88990, 94990' },
    { key: 'media', label: 'Media and creative', terms: ['production company', 'creative agency'], sic: '59111, 73110' }
  ];

  var REGIONS = [
    'United Kingdom', 'London', 'South East England', 'Surrey', 'Hampshire', 'Berkshire',
    'South West England', 'East of England', 'Midlands', 'North West England',
    'North East England', 'Yorkshire', 'Scotland', 'Wales', 'Northern Ireland'
  ];

  var SIGNALS = [
    { key: 'hiring', label: 'Companies hiring for it' },
    { key: 'pain', label: 'People talking about the problem' },
    { key: 'tender', label: 'Public sector tenders' },
    { key: 'people', label: 'People and companies to contact' }
  ];

  var GROUP_INFO = {
    hiring: { title: 'Who is hiring for it', blurb: 'A job advert for these skills usually means the work exists and the team is stretched.' },
    pain: { title: 'Who is talking about the problem', blurb: 'Posts, news and forum threads where people describe the pain your package fixes.' },
    tender: { title: 'Who is buying it', blurb: 'Public sector notices that mention the technology. Useful for finding buyers and for pricing.' },
    people: { title: 'Who to contact', blurb: 'The people and organisations that match your customer type.' }
  };

  /* Per package: skills that show up in job adverts, roles, problems people complain about,
     tender wording, what to check before reaching out, and a first message (keep it under 200
     characters once the placeholders are filled in). */
  var SERVICES = {
    'on-prem-infrastructure': {
      hiring: ['VMware', 'vSphere', 'ESXi', 'Proxmox', 'Hyper-V'],
      roles: ['systems administrator', 'infrastructure engineer', 'virtualisation engineer'],
      pain: ['VMware renewal', 'Broadcom VMware licence', 'VMware price increase', 'replace VMware'],
      tender: ['VMware', 'virtualisation', 'hyperconverged', 'server refresh'],
      qualify: [
        'Runs VMware or Hyper-V on its own hardware',
        'Small IT team, so little spare capacity for a migration',
        'A renewal, hardware refresh or licence change is coming up',
        'Not locked into a long contract with a larger provider'
      ],
      note: 'Hi [Name], I run Sheerwater Consulting in Woking. We do fixed-price VMware to Proxmox migrations. Saw [signal] at [Company]. Happy to share what we see in the field, no pitch.',
      offer: 'a free 20-minute review of your current estate'
    },
    'local-ai-gpu-machines': {
      hiring: ['GPU', 'CUDA', 'Ollama', 'LLM', 'on-premises AI'],
      roles: ['AI engineer', 'machine learning engineer', 'IT manager'],
      pain: ['private AI on-premises', 'local LLM data privacy', 'self-hosted LLM', 'AI data protection'],
      tender: ['GPU server', 'AI workstation', 'high performance computing'],
      qualify: [
        'Has data it cannot send to a cloud AI service',
        'A named use case, not just curiosity',
        'The budget holder is reachable',
        'Has a suitable room, power and cooling, or can use UK colocation'
      ],
      note: 'Hi [Name], I build local AI machines for UK teams that cannot send data to cloud AI. Saw [signal] at [Company]. Happy to compare notes on what is practical on-site.',
      offer: 'a short call to size the hardware before you spend anything'
    },
    'cloud-landing-zone': {
      hiring: ['Azure', 'AWS', 'landing zone', 'Terraform', 'cloud migration'],
      roles: ['cloud engineer', 'DevOps engineer', 'infrastructure engineer'],
      pain: ['cloud costs', 'Azure landing zone', 'AWS account structure', 'cloud migration'],
      tender: ['cloud migration', 'Azure', 'AWS'],
      qualify: [
        'Already in the cloud, or about to move, with no agreed structure',
        'Accounts or subscriptions created ad hoc',
        'No infrastructure as code yet',
        'Someone who owns the cloud bill'
      ],
      note: 'Hi [Name], I am Nayeem from Sheerwater Consulting (Woking). We set up Azure and AWS foundations with Terraform. Saw [signal] at [Company]. Open to a short chat?',
      offer: 'a short call to look at how your cloud accounts are set up today'
    },
    'kubernetes-baseline': {
      hiring: ['Kubernetes', 'Helm', 'Argo CD', 'Prometheus', 'EKS', 'AKS'],
      roles: ['DevOps engineer', 'platform engineer', 'site reliability engineer'],
      pain: ['Kubernetes upgrade', 'Kubernetes production readiness', 'Kubernetes monitoring', 'Kubernetes small team'],
      tender: ['Kubernetes', 'container platform'],
      qualify: [
        'Runs or plans to run Kubernetes in production',
        'No dedicated platform team',
        'Gaps in upgrades, monitoring or backups',
        'Engineers who would own it after handover'
      ],
      note: 'Hi [Name], I help small teams get Kubernetes production-ready: upgrades, monitoring, backups. Saw [signal] at [Company]. Happy to swap notes?',
      offer: 'a short call to review how your cluster is set up'
    },
    'cicd-pipeline': {
      hiring: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'CI/CD', 'Terraform'],
      roles: ['DevOps engineer', 'release engineer', 'platform engineer'],
      pain: ['slow deployments', 'manual deployment', 'Jenkins migration', 'CI/CD pipeline'],
      tender: ['CI/CD', 'DevOps'],
      qualify: [
        'Releases are manual or risky',
        'Small engineering team',
        'Code is already in Git',
        'A lead engineer or CTO who feels the pain'
      ],
      note: 'Hi [Name], I am Nayeem at Sheerwater Consulting. We build CI/CD pipelines that make releases boring. Saw [signal] at [Company]. Worth a quick chat?',
      offer: 'a short call to walk through how you release today'
    },
    'linux-automation': {
      hiring: ['Ansible', 'RHEL', 'Rocky Linux', 'Linux', 'patching'],
      roles: ['Linux systems administrator', 'infrastructure engineer', 'HPC systems administrator'],
      pain: ['Ansible Linux patching', 'CentOS migration', 'RHEL 7 migration', 'manual Linux patching'],
      tender: ['Linux', 'patch management', 'server support'],
      qualify: [
        'Dozens of Linux servers managed by hand',
        'Old distributions that need migrating',
        'Patching is inconsistent or late',
        'A small team with no automation owner'
      ],
      note: 'Hi [Name], I am Nayeem at Sheerwater Consulting. We automate Linux patching and builds with Ansible. Saw [signal] at [Company]. Open to comparing notes?',
      offer: 'a short call to look at how your servers are patched and built'
    },
    'hpc-gpu-cluster': {
      hiring: ['Slurm', 'HPC', 'GPU cluster', 'CUDA', 'Lustre'],
      roles: ['HPC systems administrator', 'research computing', 'research software engineer'],
      pain: ['Slurm cluster', 'research computing GPU', 'university GPU cluster', 'HPC cluster setup'],
      tender: ['high performance computing', 'GPU cluster', 'research computing'],
      qualify: [
        'Scientists waiting on compute, or sharing machines informally',
        'Grant funding for equipment, with no engineer to run it',
        'Someone on the team who can own it after handover',
        'Clear workloads (GPU, memory or storage heavy)'
      ],
      note: 'Hi [Name], I have a background in HPC and Slurm and set up GPU clusters for research groups. Saw [signal] at [Company]. Happy to compare notes?',
      offer: 'a short call to size the cluster against your workloads'
    },
    'private-ai-pilot': {
      hiring: ['AI', 'LLM', 'RAG', 'document search'],
      roles: ['AI lead', 'innovation manager', 'head of IT'],
      pain: ['AI confidentiality client data', 'private ChatGPT alternative', 'self-hosted AI documents', 'cannot use ChatGPT client data'],
      tender: ['artificial intelligence', 'document search', 'knowledge management'],
      qualify: [
        'Wants AI on documents it cannot send to a third party',
        'One concrete task to test',
        'A data protection lead who will review the setup',
        'Realistic that a pilot gives a verdict, not a finished product'
      ],
      note: 'Hi [Name], I am Nayeem at Sheerwater Consulting. We run five-week private AI pilots on a client’s own servers. Saw [signal] at [Company]. Open to a short chat?',
      offer: 'a free scoping call; if a cloud AI service would suit you better, I will say so'
    },
    'application-development': {
      hiring: ['web developer', 'mobile app developer', 'React', 'Python'],
      roles: ['software developer', 'full stack developer'],
      pain: ['need custom app', 'replace spreadsheets internal tool', 'legacy system replacement', 'booking system development'],
      tender: ['web application development', 'mobile app development', 'bespoke software'],
      qualify: [
        'A clear workflow that is stuck in spreadsheets or email',
        'No in-house developers, or a team with no spare time',
        'A budget holder who can decide',
        'Willing to agree a small first version'
      ],
      note: 'Hi [Name], I am Nayeem at Sheerwater Consulting (Woking). We build custom web and mobile apps for small teams. Saw [signal] at [Company]. Open to a chat?',
      offer: 'a short call to scope a first version'
    }
  };

  /* ---------- Search builders (pure functions, no page access) ---------- */

  function enc(s) { return encodeURIComponent(s); }
  function quote(t) { return /\s/.test(t) ? '"' + t + '"' : t; }
  function anyOf(list) {
    var l = (list || []).filter(Boolean);
    if (!l.length) { return ''; }
    return l.length === 1 ? quote(l[0]) : '(' + l.map(quote).join(' OR ') + ')';
  }
  function join() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }
  function google(q, news) { return 'https://www.google.com/search?q=' + enc(q) + (news ? '&tbm=nws' : ''); }
  function unique(list) {
    var out = [];
    list.forEach(function (x) { if (out.indexOf(x) === -1) { out.push(x); } });
    return out;
  }
  function sectorByKey(key) {
    for (var i = 0; i < SECTORS.length; i++) { if (SECTORS[i].key === key) { return SECTORS[i]; } }
    return null;
  }

  function sectorTerms(state) {
    var picked = (state.sectors || []).map(sectorByKey).filter(Boolean);
    if (!picked.length) { return AUDIENCES[state.audience].sectors.slice(); }
    var terms = [];
    picked.forEach(function (s) { terms = terms.concat(s.terms); });
    return unique(terms).slice(0, 6);
  }

  function sicCodes(state) {
    var picked = (state.sectors || []).map(sectorByKey).filter(Boolean);
    return picked.map(function (s) { return s.label + ': ' + s.sic; });
  }

  function places(state) {
    var place = (state.place || '').replace(/\s+/g, ' ').trim();
    var region = state.region || 'United Kingdom';
    return {
      jobs: place || region,
      google: place || (region === 'United Kingdom' ? 'UK' : region)
    };
  }

  function buildSearches(state) {
    var svc = SERVICES[state.service];
    var aud = AUDIENCES[state.audience];
    if (!svc || !aud) { return []; }
    var terms = sectorTerms(state);
    var where = places(state);
    var wanted = state.signals && state.signals.length ? state.signals : SIGNALS.map(function (s) { return s.key; });
    var items = [];
    function add(group, title, desc, tag, url) {
      if (wanted.indexOf(group) !== -1) { items.push({ group: group, title: title, desc: desc, tag: tag, url: url }); }
    }

    var skills = anyOf(svc.hiring);
    var roles = anyOf(svc.roles);

    /* Hiring */
    add('hiring', 'LinkedIn jobs, newest first',
      'Adverts from the past month that mention these skills. Open the company page to see its size and who works there.',
      'LinkedIn',
      'https://www.linkedin.com/jobs/search/?keywords=' + enc(join(skills, roles)) +
        '&location=' + enc(where.jobs) + '&f_TPR=r2592000&sortBy=DD');
    add('hiring', 'Indeed UK',
      'The same search on Indeed, last 30 days. Employers who post here often do not appear on LinkedIn.',
      'Job board',
      'https://uk.indeed.com/jobs?q=' + enc(join(skills, roles)) + '&l=' + enc(where.jobs) + '&fromage=30&sort=date');
    add('hiring', 'Reed',
      'A simpler keyword search on Reed. Good for small and mid-sized employers.',
      'Job board',
      'https://www.reed.co.uk/jobs?keywords=' + enc(svc.hiring[0] + ' ' + svc.roles[0]) + '&location=' + enc(where.jobs));
    add('hiring', 'Employer career pages (Google)',
      'Finds adverts on companies’ own sites, excluding agencies and recruiters.',
      'Google',
      google(join(skills, roles, '(careers OR vacancies OR "we are hiring")', where.google, '-recruitment -agency')));
    add('hiring', 'Other job boards (Google)',
      'CWJobs, Totaljobs and jobs.ac.uk in one search. The last one matters for universities and research.',
      'Google',
      google(join('(site:cwjobs.co.uk OR site:totaljobs.com OR site:jobs.ac.uk)', skills, roles)));

    /* Pain */
    var pain = anyOf(svc.pain);
    add('pain', 'LinkedIn posts about the problem',
      'People describing the problem in public. A comment or a considered reply is a better start than a cold message.',
      'LinkedIn',
      'https://www.linkedin.com/search/results/content/?keywords=' + enc(pain) + '&origin=GLOBAL_SEARCH_HEADER');
    add('pain', 'UK news mentioning it',
      'Recent stories about the technology or the problem, for context and for timely openers.',
      'Google News',
      google(join(pain, 'UK'), true));
    add('pain', 'Forum threads (Reddit)',
      'Threads where administrators ask for help. Read these to learn the language buyers use. Do not sell in them.',
      'Google',
      google(join('site:reddit.com', pain)));
    add('pain', 'Your chosen sectors and the problem',
      'Organisations in the sectors you picked that mention the problem anywhere on their sites.',
      'Google',
      google(join(anyOf(terms), anyOf(svc.pain.slice(0, 2)), where.google)));

    /* Tenders */
    var tender = anyOf(svc.tender);
    add('tender', 'Contracts Finder',
      'Notices from UK public bodies that mention these technologies, including awarded contracts and who won them.',
      'Public sector',
      google(join('site:contractsfinder.service.gov.uk', tender)));
    add('tender', 'Find a Tender',
      'Larger public contracts. Awards show who is buying and roughly what it costs.',
      'Public sector',
      google(join('site:find-tender.service.gov.uk', tender)));

    /* People */
    add('people', 'LinkedIn people: likely buyers',
      'Job titles that usually hold the budget for this package in your chosen customer type. Add a Locations filter once it opens.',
      'LinkedIn',
      'https://www.linkedin.com/search/results/people/?keywords=' + enc(join(anyOf(aud.titles.slice(0, 6)), anyOf(terms.slice(0, 4)))) +
        '&origin=GLOBAL_SEARCH_HEADER');
    add('people', 'LinkedIn companies in your sectors',
      'A list of organisations to check one by one. Look at headcount and recent posts before you contact anyone.',
      'LinkedIn',
      'https://www.linkedin.com/search/results/companies/?keywords=' + enc(join(anyOf(terms.slice(0, 4)), state.place || '')) +
        '&origin=GLOBAL_SEARCH_HEADER');
    var sics = sicCodes(state);
    add('people', 'Companies House advanced search',
      sics.length
        ? 'Filter by SIC code, location and incorporation date. Suggested codes: ' + sics.join('; ') + '.'
        : 'Filter by SIC code, location and incorporation date. Pick sectors above to see suggested SIC codes.',
      'Companies House',
      'https://find-and-update.company-information.service.gov.uk/advanced-search');

    return items;
  }

  function followUp(state, pkg) {
    var svc = SERVICES[state.service];
    var name = pkg ? pkg.name : 'package';
    var timeline = pkg && pkg.timeline ? ', ' + pkg.timeline : '';
    return 'Thanks for connecting, [Name].\n\n' +
      'I got in touch because of [signal]. We offer a fixed-price “' + name + '” package' + timeline +
      '. If it is useful I can send a one-page outline, or we can do ' + svc.offer + '.\n\n' +
      'If it is not relevant, no problem at all, and just say if you would rather I did not message again.\n\n' +
      'Nayeem An-noor\nFounder and Lead Engineer, Sheerwater Consulting\nsheerwaterconsulting.co.uk';
  }

  /* Exposed so the logic can be tested without a browser. */
  window.SWLead = {
    SERVICES: SERVICES, AUDIENCES: AUDIENCES, SECTORS: SECTORS, REGIONS: REGIONS, SIGNALS: SIGNALS,
    buildSearches: buildSearches, followUp: followUp, sectorTerms: sectorTerms, anyOf: anyOf
  };

  /* ---------- Page ---------- */

  var root = document.getElementById('lead-finder');
  if (!root) { return; }

  function $(id) { return document.getElementById(id); }
  var packages = window.SW_PACKAGES || [];
  function pkg(slug) {
    for (var i = 0; i < packages.length; i++) { if (packages[i].slug === slug) { return packages[i]; } }
    return null;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }
  function fill(select, options, selected) {
    select.innerHTML = '';
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      if (o.value === selected) { opt.selected = true; }
      select.appendChild(opt);
    });
  }

  var serviceSel = $('lf-service');
  var audienceSel = $('lf-audience');
  var regionSel = $('lf-region');
  var placeInput = $('lf-place');
  var sectorBox = $('lf-sectors');
  var signalBox = $('lf-signals');

  var picked = {};          // sector key -> true
  var query = {};
  try {
    var sp = new URLSearchParams(window.location.search);
    ['service', 'audience', 'region', 'place', 'sectors', 'signals'].forEach(function (k) { query[k] = sp.get(k); });
  } catch (e) { /* older browsers: use defaults */ }

  var serviceOptions = packages
    .filter(function (p) { return SERVICES[p.slug]; })
    .map(function (p) { return { value: p.slug, label: p.name }; });
  if (!serviceOptions.length) {
    serviceOptions = Object.keys(SERVICES).map(function (k) { return { value: k, label: k }; });
  }
  fill(serviceSel, serviceOptions, SERVICES[query.service] ? query.service : 'on-prem-infrastructure');
  fill(audienceSel, Object.keys(AUDIENCES).map(function (k) { return { value: k, label: AUDIENCES[k].label }; }),
    AUDIENCES[query.audience] ? query.audience : 'regulated');
  fill(regionSel, REGIONS.map(function (r) { return { value: r, label: r }; }),
    REGIONS.indexOf(query.region) !== -1 ? query.region : 'United Kingdom');
  if (query.place) { placeInput.value = query.place.slice(0, 60); }
  if (query.sectors) { query.sectors.split(',').forEach(function (k) { if (sectorByKey(k)) { picked[k] = true; } }); }

  SECTORS.forEach(function (s) {
    var b = el('button', 'chip', s.label);
    b.type = 'button';
    b.setAttribute('aria-pressed', picked[s.key] ? 'true' : 'false');
    b.addEventListener('click', function () {
      picked[s.key] = !picked[s.key];
      b.setAttribute('aria-pressed', picked[s.key] ? 'true' : 'false');
      render();
    });
    sectorBox.appendChild(b);
  });

  var wantedFromUrl = query.signals ? query.signals.split(',') : null;
  SIGNALS.forEach(function (s) {
    var label = el('label', 'choice');
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.value = s.key;
    input.checked = wantedFromUrl ? wantedFromUrl.indexOf(s.key) !== -1 : true;
    input.addEventListener('change', render);
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + s.label));
    signalBox.appendChild(label);
  });

  function state() {
    return {
      service: serviceSel.value,
      audience: audienceSel.value,
      region: regionSel.value,
      place: placeInput.value,
      sectors: Object.keys(picked).filter(function (k) { return picked[k]; }),
      signals: Array.prototype.slice.call(signalBox.querySelectorAll('input:checked')).map(function (i) { return i.value; })
    };
  }

  function copy(text, button) {
    function done(ok) {
      var old = button.getAttribute('data-label') || button.textContent;
      button.setAttribute('data-label', old);
      button.textContent = ok ? 'Copied' : 'Copy failed, select the text';
      setTimeout(function () { button.textContent = old; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
  }

  function renderMessage(host, title, text, hint) {
    var box = el('div', 'field');
    var label = el('label', null, title);
    var area = document.createElement('textarea');
    area.value = text;
    area.rows = hint ? 4 : 9;
    area.id = 'lf-msg-' + title.toLowerCase().replace(/[^a-z]+/g, '-');
    label.setAttribute('for', area.id);
    var count = el('span', 'hint');
    function update() { count.textContent = hint ? area.value.length + ' characters. ' + hint : ''; }
    area.addEventListener('input', update);
    update();
    label.appendChild(count);
    var btn = el('button', 'btn btn-quiet btn-small', 'Copy');
    btn.type = 'button';
    btn.style.marginTop = '0.5rem';
    btn.addEventListener('click', function () { copy(area.value, btn); });
    box.appendChild(label);
    box.appendChild(area);
    box.appendChild(btn);
    host.appendChild(box);
  }

  function render() {
    var s = state();
    var svc = SERVICES[s.service];
    var aud = AUDIENCES[s.audience];
    var p = pkg(s.service);
    var where = places(s);

    var summaryParts = [p ? p.name : s.service, aud.label.toLowerCase(), where.jobs];
    if (s.sectors.length) { summaryParts.splice(2, 0, s.sectors.map(function (k) { return sectorByKey(k).label.toLowerCase(); }).join(', ')); }
    $('lf-summary').textContent = 'Searches for: ' + summaryParts.join(' · ');

    var host = $('lf-groups');
    host.innerHTML = '';
    var items = buildSearches(s);
    var order = ['hiring', 'pain', 'tender', 'people'];
    order.forEach(function (g) {
      var groupItems = items.filter(function (i) { return i.group === g; });
      if (!groupItems.length) { return; }
      var block = el('div', 'lf-group');
      block.appendChild(el('h3', null, GROUP_INFO[g].title));
      block.appendChild(el('p', 'muted', GROUP_INFO[g].blurb));
      var ul = el('ul', 'pkg-list');
      groupItems.forEach(function (i) {
        var li = document.createElement('li');
        var a = el('a', 'pkg-row');
        a.href = i.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        var left = document.createElement('div');
        left.appendChild(el('h3', null, i.title));
        left.appendChild(el('p', null, i.desc));
        var facts = el('div', 'pkg-facts');
        facts.appendChild(el('span', 'pkg-price', i.tag));
        facts.appendChild(el('span', 'pkg-time', 'Opens in a new tab'));
        a.appendChild(left);
        a.appendChild(facts);
        li.appendChild(a);
        ul.appendChild(li);
      });
      block.appendChild(ul);
      host.appendChild(block);
    });
    if (!items.length) { host.appendChild(el('p', 'muted', 'Tick at least one box under “Look for”.')); }

    var titles = $('lf-titles');
    titles.innerHTML = '';
    aud.titles.forEach(function (t) { titles.appendChild(el('li', null, t)); });
    var qualify = $('lf-qualify');
    qualify.innerHTML = '';
    svc.qualify.forEach(function (t) { qualify.appendChild(el('li', null, t)); });
    var sic = $('lf-sic');
    var sics = sicCodes(s);
    sic.textContent = sics.length ? 'Suggested Companies House SIC codes. ' + sics.join('; ') + '.' : '';

    var msgHost = $('lf-messages');
    msgHost.innerHTML = '';
    renderMessage(msgHost, 'Connection note', svc.note, 'Free LinkedIn accounts allow about 200, so trim after you fill in the brackets.');
    renderMessage(msgHost, 'Follow-up after they accept', followUp(s, p), '');

    try {
      var qs = new URLSearchParams();
      qs.set('service', s.service);
      qs.set('audience', s.audience);
      qs.set('region', s.region);
      if (s.place.trim()) { qs.set('place', s.place.trim()); }
      if (s.sectors.length) { qs.set('sectors', s.sectors.join(',')); }
      qs.set('signals', s.signals.join(','));
      window.history.replaceState(null, '', '?' + qs.toString());
    } catch (e) { /* not essential */ }
  }

  [serviceSel, audienceSel, regionSel].forEach(function (n) { n.addEventListener('change', render); });
  var timer;
  placeInput.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 250); });

  render();
})();
