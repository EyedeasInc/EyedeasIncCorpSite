/* Eyedeas Inc. site behaviour: section entrances and the agent readiness check */
(function () {
  'use strict';

  var BOOKING = 'https://outlook.office.com/book/PowerPagesPlusbyEyedeasInc@eyedeasinc.com';
  var EMAIL = 'victor@eyedeasinc.com';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Entrances, once, as each part enters ---------- */
  /* A fully clipped element never reports as visible, so [data-open]
     pictures are watched through their parent and revealed from there. */
  var targets = document.querySelectorAll('[data-rise], #versus, #pipe, #lineup');
  var opens = document.querySelectorAll('[data-open]');
  var showAll = /[?&]static\b/.test(location.search); /* ?static shows every section at once, for review tools */
  if ('IntersectionObserver' in window && !reduce && !showAll) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        /* Also reveal anything already scrolled past (a nav jump skips the crossing) */
        if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
        var t = e.target._reveal || [e.target];
        t.forEach(function (n) { n.classList.add('in'); });
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (t) { io.observe(t); });
    opens.forEach(function (t) {
      var p = t.parentElement;
      (p._reveal = p._reveal || []).push(t);
      io.observe(p);
    });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
    opens.forEach(function (t) { t.classList.add('in'); });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    var closeMenu = function () { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); };
    menuBtn.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Copilot tabs, accordion and prompt preview ---------- */
  var tabs = [].slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  var card = document.getElementById('promptCard');
  var pText = document.getElementById('promptText');
  var pFile = document.getElementById('promptFile');
  var pLogo = document.getElementById('promptLogo');
  var swapTimer;
  function showPrompt(d) {
    if (!d || !card) return;
    var prompt = d.getAttribute('data-prompt') || '';
    var token = d.getAttribute('data-token') || '';
    var render = function () {
      var i = prompt.indexOf(token);
      pText.innerHTML = i < 0 || !token ? esc0(prompt) :
        esc0(prompt.slice(0, i)) + '<span class="tok">' + esc0(token) + '</span>' + esc0(prompt.slice(i + token.length));
      pFile.textContent = d.getAttribute('data-file') || '';
      pLogo.src = 'assets/logos/' + (d.getAttribute('data-logo') || 'logo-copilot.png');
      card.classList.remove('swap');
    };
    clearTimeout(swapTimer);
    if (reduce) { render(); return; }
    card.classList.add('swap');
    swapTimer = setTimeout(render, 200);
  }
  function esc0(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    var panel = document.getElementById(tab.getAttribute('aria-controls'));
    showPrompt(panel.querySelector('details[open]') || panel.querySelector('details'));
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      else if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
      else if (n) { e.preventDefault(); selectTab(tabs[(i + n + tabs.length) % tabs.length], true); }
    });
  });
  document.querySelectorAll('.panel details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open && !d.closest('.panel').hidden) {
        /* keep one open per panel where the name attribute is unsupported */
        d.parentElement.querySelectorAll('details[open]').forEach(function (o) { if (o !== d) o.open = false; });
        showPrompt(d);
      }
    });
  });
  if (tabs.length) {
    var firstPanel = document.getElementById(tabs[0].getAttribute('aria-controls'));
    var first = firstPanel && firstPanel.querySelector('details[open]');
    if (first) setTimeout(function () { var r = reduce; reduce = true; showPrompt(first); reduce = r; }, 0);
  }
  document.querySelectorAll('.family-acc details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) d.parentElement.querySelectorAll('details[open]').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- Count-ups: stats count from zero once their block is in view ---------- */
  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach(function (n) {
      var to = +n.getAttribute('data-count');
      if (reduce || showAll) { n.textContent = to; return; }
      var t0 = null, dur = 1400;
      n.textContent = '0';
      function tick(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        n.textContent = Math.round(to * e);
        if (k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  ['versus', 'pipeTotal'].forEach(function (id) {
    var box = document.getElementById(id);
    if (!box) return;
    if (!('IntersectionObserver' in window)) { countUp(box); return; }
    if (!reduce && !showAll) box.querySelectorAll('[data-count]').forEach(function (n) { n.textContent = '0'; });
    var o = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { countUp(box); o.disconnect(); }
    }, { threshold: 0.4 });
    o.observe(box);
  });

  /* ---------- The wheel: the four services take turns in ink ---------- */
  var wheel = document.getElementById('wheel');
  if (wheel) {
    wheel.querySelectorAll('.w-logo').forEach(function (l, i) { l.style.setProperty('--i', i); });
    var segs = wheel.querySelectorAll('.seg'), labs = wheel.querySelectorAll('.seg-labels text');
    var wi = 0, wheelVisible = true;
    var light = function (i) {
      segs.forEach(function (s, j) { s.classList.toggle('on', i === j); });
      labs.forEach(function (s, j) { s.classList.toggle('on', i === j); });
    };
    light(0);
    if (!reduce) {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { wheelVisible = es[0].isIntersecting; }).observe(wheel);
      setInterval(function () { if (!wheelVisible || document.hidden) return; wi = (wi + 1) % segs.length; light(wi); }, 2400);
    }
  }

  /* ---------- Family art follows the open accordion item ---------- */
  var famArt = document.getElementById('familyArt');
  var famItems = [].slice.call(document.querySelectorAll('.family-acc details'));
  function famSync() {
    if (!famArt) return;
    var open = famItems.findIndex(function (d) { return d.open; });
    famArt.querySelectorAll('.fa-tile').forEach(function (t, i) { t.classList.toggle('on', i === open); });
  }
  famItems.forEach(function (d) { d.addEventListener('toggle', famSync); });
  famSync();

  /* ---------- Contact field -> prefilled email ---------- */
  var askForm = document.getElementById('askForm');
  if (askForm) {
    askForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var idea = document.getElementById('askText').value.trim();
      if (!idea) return;
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('What we want to build') +
        '&body=' + encodeURIComponent('Hi Victor,\n\nWe want to build: ' + idea + '\n\n');
    });
  }

  /* ---------- Agent readiness check ---------- */
  var cs = document.getElementById('cs');
  if (!cs) return;

  var PILLARS = ['Training', 'Readiness', 'Implementation', 'Governance'];

  var QUESTIONS = [
    {
      pillar: 'Implementation',
      q: 'What should your first agent do most?',
      options: [
        { t: 'Answer questions from our documents', l: 'logo-sharepoint.svg', s: 3, r: 'A knowledge agent is the classic first win: fast to ship and easy to measure.' },
        { t: 'Take actions in our systems', l: 'logo-power-automate.png', s: 2, r: 'Agents that act need connectors, tools and clear permissions. Very doable with a good design.' },
        { t: 'Run a multi-step process', l: 'logo-copilot-studio.png', s: 2, r: 'That sounds like a workflow, maybe with an agent inside it. Copilot Studio handles both in one place.' },
        { t: 'Not sure yet', l: 'question', s: 1, r: 'Completely normal. Picking the right first use case is half of the assessment.' }
      ]
    },
    {
      pillar: 'Readiness',
      q: 'Where does the knowledge it needs live today?',
      options: [
        { t: 'SharePoint and OneDrive', l: 'logo-sharepoint.svg', s: 3, r: 'Good news: that is one of the quickest knowledge sources to connect.' },
        { t: 'Dataverse or Dynamics 365', l: 'logo-dataverse.png', s: 3, r: 'Structured data in Dataverse makes agents precise. Nice.' },
        { t: 'Websites and shared files', l: 'globe', s: 2, r: 'Workable. We will want to tidy and own those sources first.' },
        { t: 'All over the place', l: 'question', s: 1, r: 'Very common. A short knowledge inventory fixes most of that.' }
      ]
    },
    {
      pillar: 'Readiness',
      q: 'What is your Microsoft licensing picture?',
      options: [
        { t: 'We have Microsoft 365 Copilot licenses', l: 'logo-copilot.png', s: 3, r: 'Great, your people can use agents right inside Microsoft 365 Copilot.' },
        { t: 'Microsoft 365, no Copilot yet', l: 'logo-m365.png', s: 2, r: 'You can still start: Copilot Chat and Copilot Studio credits open the door.' },
        { t: 'Copilot Studio credits or capacity', l: 'logo-copilot-studio.png', s: 3, r: 'Then you can build and publish agents today.' },
        { t: 'Not sure', l: 'question', s: 1, r: 'No problem. We map licensing to the use case so you only pay for what you need.' }
      ]
    },
    {
      pillar: 'Governance',
      q: 'How are your Power Platform environments set up?',
      options: [
        { t: 'Dev, test and prod with DLP policies', l: 'logo-power-platform.png', s: 3, r: 'That is a mature foundation. Agents slot right into it.' },
        { t: 'Mostly the default environment', l: 'logo-power-platform.png', s: 1, r: 'Common, and fixable in days. Agents deserve their own managed environments.' },
        { t: 'We have not used Power Platform yet', l: 'spark', s: 1, r: 'Then we get to set it up right from day one.' },
        { t: 'Not sure', l: 'question', s: 1, r: 'We will check it together in the assessment.' }
      ]
    },
    {
      pillar: 'Governance',
      q: 'How confident are you about who can see what in Microsoft 365?',
      options: [
        { t: 'Sensitivity labels and Purview in place', l: 'shield', s: 3, r: 'Excellent. That is exactly what keeps Copilot grounded safely.' },
        { t: 'Permissions are mostly clean', l: 'check', s: 2, r: 'Good. A quick oversharing review will make it airtight.' },
        { t: 'We worry about oversharing', l: 'warn', s: 1, r: 'Honest answer, and the right worry. We review that before any agent goes live.' },
        { t: 'Not sure', l: 'question', s: 1, r: 'That is the first thing we look at, because Copilot respects the permissions you already have.' }
      ]
    },
    {
      pillar: 'Training',
      q: 'Who would build and own the agent?',
      options: [
        { t: 'Makers who already build on Power Platform', l: 'logo-power-apps.png', s: 3, r: 'Perfect. A short Copilot Studio bootcamp and they are building.' },
        { t: 'IT or developers', l: 'logo-github-copilot.svg', s: 2, r: 'Great for advanced agents. We add the maker and governance side.' },
        { t: 'Business experts, no builders yet', l: 'people', s: 2, r: 'They are the best people to shape an agent. We pair them with a builder.' },
        { t: 'Nobody yet', l: 'spark', s: 1, r: 'That is what training and our pilot model are for.' }
      ]
    },
    {
      pillar: 'Implementation',
      q: 'Last one. How will you know it worked?',
      options: [
        { t: 'A clear metric, like hours or tickets saved', l: 'chart', s: 3, r: 'Love it. A metric makes the ROI case write itself.' },
        { t: 'A rough idea', l: 'check', s: 2, r: 'Good start. We will turn it into a number before we build.' },
        { t: 'Not defined yet', l: 'question', s: 1, r: 'We will define it together. No agent ships without one.' }
      ]
    }
  ];

  var NOTES = {
    Training: ['Your people need a first pass on Copilot Studio. Our bootcamp covers it.', 'A short bootcamp gets your builders going.', 'Your builders are ready to go.'],
    Readiness: ['Licensing and knowledge sources need mapping first.', 'Mostly ready. A little prep on data and licensing.', 'Your data and licensing are in good shape.'],
    Implementation: ['We will pick and size the right first use case together.', 'A clear use case is forming. We will sharpen it.', 'A clear, measurable first use case.'],
    Governance: ['Environments and permissions come first. We set them up.', 'A solid base. A quick review makes it airtight.', 'A mature governance foundation.']
  };

  var log = document.getElementById('csLog');
  var replyForm = document.getElementById('csReplyForm');
  var reply = document.getElementById('csReply');
  var progress = document.getElementById('csProgress');
  var stepLabel = document.getElementById('csStep');
  var fill = document.getElementById('csFill');

  var state = { idea: '', kind: '', i: 0, answers: [], busy: false, done: false };


  /* ---------- Sample agents: what the simulated agent reads, then the draft it proposes ---------- */
  var L = function (f) { return 'assets/logos/' + f; };
  var MODEL_ICON = '<span class="src-svg"><svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="7" width="3" height="6" rx="1" fill="#0e1b26"/><rect x="5.5" y="4" width="3" height="9" rx="1" fill="#0e1b26"/><rect x="10" y="1" width="3" height="12" rx="1" fill="#0e1b26"/></svg></span>';
  var SAMPLES = [
    { id: 'ap', title: 'Build an Accounts Payable agent', sub: 'Invoices, purchase orders and exceptions', icon: 'logo-copilot-studio.png',
      reads: [
        ['logo-sharepoint.svg', 'Reading SharePoint', 'Finance > Accounts Payable > Invoice approval policy.docx', '14 files indexed, 3 approval policies found'],
        ['logo-teams.png', 'Scanning a Teams channel', 'Finance > #ap-exceptions', '212 messages, most common issue: missing PO number'],
        [null, 'Querying a semantic model', 'Finance > AP Aging (Fabric)', '1,284 open invoices, 9% past 60 days'],
        ['logo-foundry.svg', 'Searching a Foundry IQ knowledge base', 'vendor-contracts', '38 contracts with payment terms'],
        ['logo-dataverse.png', 'Reading a Dataverse table', 'Vendors (contoso_vendor)', '612 active vendors']
      ],
      agent: { name: 'AP Assistant', desc: 'Matches incoming invoices to purchase orders, answers vendor payment questions and sends exceptions to Finance for approval.',
        knowledge: [['logo-sharepoint.svg', 'AP policies'], ['logo-teams.png', '#ap-exceptions'], ['logo-foundry.svg', 'Vendor contracts']],
        tools: [['logo-power-automate.png', 'Match invoice to PO'], ['logo-dataverse.png', 'Look up vendor'], ['logo-teams.png', 'Request approval in Teams']],
        trigger: 'When an invoice arrives in ap@contoso.com' } },
    { id: 'hr', title: 'Build an HR policy agent', sub: 'Leave, benefits and onboarding answers', icon: 'logo-teams.png',
      reads: [
        ['logo-sharepoint.svg', 'Reading SharePoint', 'People > Policies > Employee handbook 2026.pdf', '46 pages, 12 policies indexed'],
        ['logo-teams.png', 'Scanning a Teams channel', 'People Ops > #ask-hr', '540 questions, top topic: parental leave'],
        ['logo-excel.png', 'Opening a workbook', 'Benefits by region.xlsx', '7 regions, 4 benefit plans'],
        ['logo-foundry.svg', 'Searching a Foundry IQ knowledge base', 'hr-knowledge', '118 approved answers']
      ],
      agent: { name: 'Ask HR', desc: 'Answers policy and benefits questions in Teams with citations, and opens a ticket when a person needs to step in.',
        knowledge: [['logo-sharepoint.svg', 'Employee handbook'], ['logo-excel.png', 'Benefits by region']],
        tools: [['logo-power-automate.png', 'Open an HR ticket'], ['logo-outlook.png', 'Book time off']],
        trigger: 'Published to Teams and Microsoft 365 Copilot' } },
    { id: 'sales', title: 'Build a sales proposal agent', sub: 'Drafts proposals from past wins', icon: 'logo-word.png',
      reads: [
        ['logo-sharepoint.svg', 'Reading SharePoint', 'Sales > Proposals > Won 2025', '86 proposals, 31 tagged as won'],
        ['logo-teams.png', 'Scanning a Teams channel', 'Sales > #deal-desk', '1,020 messages, pricing rules found'],
        [null, 'Querying a semantic model', 'Sales > Pipeline (Fabric)', '214 open opportunities'],
        ['logo-word.png', 'Opening a template', 'Proposal template v4.docx', '9 sections mapped']
      ],
      agent: { name: 'Proposal Builder', desc: 'Drafts a first proposal from the opportunity, past winning proposals and current pricing rules, ready for a seller to review.',
        knowledge: [['logo-sharepoint.svg', 'Won proposals'], ['logo-teams.png', '#deal-desk']],
        tools: [['logo-word.png', 'Create proposal draft'], ['logo-dataverse.png', 'Read opportunity']],
        trigger: 'When an opportunity reaches the Propose stage' } },
    { id: 'it', title: 'Build an IT help desk agent', sub: 'Resets, access requests and how-tos', icon: 'logo-agent-365.png',
      reads: [
        ['logo-sharepoint.svg', 'Reading SharePoint', 'IT > Knowledge base', '230 articles indexed'],
        ['logo-teams.png', 'Scanning a Teams channel', 'IT > #help', '3,400 messages, top request: access to shared mailboxes'],
        ['logo-dataverse.png', 'Reading a Dataverse table', 'Devices (contoso_device)', '2,150 managed devices']
      ],
      agent: { name: 'Help Desk', desc: 'Solves common IT requests in Teams, from password resets to mailbox access, and hands the rest to an engineer with the details filled in.',
        knowledge: [['logo-sharepoint.svg', 'IT knowledge base']],
        tools: [['logo-power-automate.png', 'Grant mailbox access'], ['logo-agent-365.png', 'Register with Agent 365']],
        trigger: 'Published to Teams' } },
    { id: 'contracts', title: 'Build a contract review agent', sub: 'Flags risky clauses before legal signs', icon: 'logo-foundry.svg',
      reads: [
        ['logo-sharepoint.svg', 'Reading SharePoint', 'Legal > Contracts > Inbound', '64 contracts waiting for review'],
        ['logo-foundry.svg', 'Calling a Foundry model', 'clause-classifier', '11 clause types recognised'],
        ['logo-word.png', 'Opening the playbook', 'Legal review playbook.docx', '27 fallback positions']
      ],
      agent: { name: 'Contract Reviewer', desc: 'Compares each inbound contract with the legal playbook, flags risky clauses and suggests the fallback wording.',
        knowledge: [['logo-word.png', 'Legal playbook'], ['logo-sharepoint.svg', 'Inbound contracts']],
        tools: [['logo-foundry.svg', 'Classify clauses'], ['logo-teams.png', 'Notify legal']],
        trigger: 'When a contract lands in the Inbound library' } },
    { id: 'field', title: 'Build a field service agent', sub: 'Schedules jobs and briefs technicians', icon: 'logo-power-apps.png',
      reads: [
        ['logo-dataverse.png', 'Reading a Dataverse table', 'Work orders', '318 open work orders'],
        ['logo-sharepoint.svg', 'Reading SharePoint', 'Service > Manuals', '140 equipment manuals'],
        ['logo-teams.png', 'Scanning a Teams channel', 'Field > #dispatch', '760 messages, top delay: missing parts']
      ],
      agent: { name: 'Dispatch Assistant', desc: 'Suggests the best technician for each job, checks parts and sends a briefing with the right manual before the visit.',
        knowledge: [['logo-sharepoint.svg', 'Equipment manuals']],
        tools: [['logo-dataverse.png', 'Assign work order'], ['logo-teams.png', 'Send technician briefing']],
        trigger: 'When a work order is created' } }
  ];
  var GENERIC_READS = [
    ['logo-sharepoint.svg', 'Searching SharePoint', 'All sites you can access', '23 related documents'],
    ['logo-teams.png', 'Scanning Teams channels', 'Teams you belong to', '4 channels discuss this'],
    ['logo-foundry.svg', 'Searching a Foundry IQ knowledge base', 'company-knowledge', '12 relevant sources']
  ];
  var samplesEl = document.getElementById('csSamples');
  if (samplesEl) {
    samplesEl.innerHTML = SAMPLES.map(function (x, i) {
      return '<button class="cs-sample" type="button" data-sample="' + i + '"><span class="ic"><img src="' + L(x.icon) + '" alt="" /></span>' +
        '<span><b>' + esc(x.title) + '</b><small>' + esc(x.sub) + '</small></span><span class="go" aria-hidden="true">→</span></button>';
    }).join('');
    samplesEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sample]');
      if (b) start('sample', SAMPLES[+b.getAttribute('data-sample')]);
    });
  }
  cs.querySelectorAll('[data-start]').forEach(function (b) {
    b.addEventListener('click', function () { start(b.getAttribute('data-start')); });
  });

  replyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = reply.value.trim();
    if (!v || state.busy || state.done) return;
    reply.value = '';
    answer({ t: v, s: 2, r: 'Thanks, noted. We will dig into that in the assessment.' });
  });

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var GLYPH = {
    globe: '<circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c2.2 2 2.2 12 0 14M10 3c-2.2 2-2.2 12 0 14"/>',
    shield: '<path d="M10 2.5l6 2.3v4.7c0 3.6-2.6 6.4-6 7.5-3.4-1.1-6-3.9-6-7.5V4.8z"/><path d="M7.5 10l1.8 1.8 3.4-3.6"/>',
    check: '<circle cx="10" cy="10" r="7"/><path d="M7 10.2l2 2 4-4.2"/>',
    warn: '<path d="M10 3l7.5 13h-15z"/><path d="M10 8.5v3.5M10 14.2v.1"/>',
    people: '<circle cx="7.5" cy="7" r="2.5"/><circle cx="13.5" cy="7.5" r="2"/><path d="M3 16c0-2.5 2-4.5 4.5-4.5S12 13.5 12 16M12.5 11.8c2.3 0 4.5 1.4 4.5 4.2"/>',
    spark: '<path d="M10 2.5l1.8 5.7 5.7 1.8-5.7 1.8L10 17.5l-1.8-5.7L2.5 10l5.7-1.8z"/>',
    chart: '<path d="M3 16h14M5.5 13V9M10 13V5M14.5 13v-6"/>',
    question: '<circle cx="10" cy="10" r="7"/><path d="M8 8a2 2 0 1 1 2.8 1.8c-.6.3-.8.7-.8 1.4M10 13.6v.1"/>'
  };
  function optIcon(l) {
    if (!l) return '';
    if (GLYPH[l]) return '<svg class="oi" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + GLYPH[l] + '</svg>';
    return '<img class="oi" src="assets/logos/' + l + '" alt="" />';
  }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function avatar() {
    return '<span class="av" aria-hidden="true"><svg viewBox="0 0 30 30" width="30" height="30"><rect width="30" height="30" rx="8" fill="#4f52e6"/><path d="M15 7l2.2 5.8L23 15l-5.8 2.2L15 23l-2.2-5.8L7 15l5.8-2.2z" fill="#fff"/></svg></span>';
  }
  function userMsg(t) { log.appendChild(el('div', 'msg user', esc(t))); scroll(); }

  function botMsg(html, cb) {
    var m = el('div', 'msg bot', avatar() + '<div class="bubble"><span class="typing" aria-label="Copilot is typing"><i></i><i></i><i></i></span></div>');
    log.appendChild(m); scroll();
    var wait = reduce ? 80 : Math.min(1100, 380 + html.length * 4);
    setTimeout(function () {
      m.querySelector('.bubble').innerHTML = html;
      scroll();
      if (cb) cb();
    }, wait);
  }

  function setProgress() {
    var n = Math.min(state.i + 1, QUESTIONS.length);
    stepLabel.textContent = state.done ? 'Readiness check complete' : 'Readiness ' + n + ' of ' + QUESTIONS.length;
    fill.style.transform = 'scaleX(' + (state.done ? 1 : state.i / QUESTIONS.length) + ')';
  }

  function start(kind, sample) {
    state = { idea: '', kind: kind, sample: sample || null, i: 0, answers: [], busy: true, done: false };
    cs.classList.remove('done');
    cs.classList.add('chatting');
    progress.classList.remove('show');
    log.innerHTML = '';

    if (kind === 'unsure') {
      userMsg('I am not sure where to start.');
      progress.classList.add('show'); setProgress();
      botMsg('<p>That is exactly what this is for. Seven quick questions and I will tell you where you stand.</p>', askNext);
      return;
    }
    var reads, title;
    if (sample) { userMsg(sample.title); reads = sample.reads; title = sample.agent.name; }
    else { userMsg(state.idea); reads = GENERIC_READS; }
    botMsg('<p>On it. Let me look at what you already have before I draft the agent.</p>', function () {
      activity(reads, function () {
        var next = function () {
          botMsg('<p>Before you build it, let\'s check whether your organization is set up for ' + (title ? esc(title) : 'this agent') + ' to succeed. Seven quick questions.</p>', function () {
            progress.classList.add('show'); setProgress(); askNext();
          });
        };
        if (sample) draftCard(sample.agent, next); else botMsg('<p>I found enough to draft it. I will shape the instructions, knowledge and tools with you in the assessment.</p>', next);
      });
    });
  }

  function srcIcon(f) { return f ? '<img class="src" src="' + L(f) + '" alt="" />' : MODEL_ICON; }

  /* one row at a time: spinner, then a check and what it found */
  function activity(reads, cb) {
    var m = el('div', 'msg bot', avatar() + '<div class="bubble"><div class="act"></div></div>');
    log.appendChild(m); scroll();
    var box = m.querySelector('.act'), i = 0;
    var step = reduce ? 0 : 900;
    (function next() {
      if (i >= reads.length) { setTimeout(cb, reduce ? 0 : 350); return; }
      var r = reads[i++];
      var row = el('div', 'act-row run', '<span class="dot"></span>' + srcIcon(r[0]) + '<span><b>' + esc(r[1]) + '</b><code>' + esc(r[2]) + '</code><span class="found">' + esc(r[3]) + '</span></span>');
      box.appendChild(row);
      requestAnimationFrame(function () { row.classList.add('on'); });
      scroll();
      setTimeout(function () { row.classList.replace('run', 'done'); scroll(); next(); }, step);
    })();
  }

  function chips(list) {
    return '<div class="chips">' + list.map(function (c) { return '<span><img src="' + L(c[0]) + '" alt="" />' + esc(c[1]) + '</span>'; }).join('') + '</div>';
  }
  function draftCard(a, cb) {
    botMsg('<p>Here is a first draft.</p>', function () {
      var d = el('div', 'draft');
      d.innerHTML =
        '<div class="draft-head"><span class="av"><svg width="18" height="18" viewBox="0 0 30 30"><path d="M15 5l2.6 6.8L24 15l-6.4 2.6L15 25l-2.6-7.4L6 15l6.6-3.2z" fill="#fff"/></svg></span>' +
          '<span><b>' + esc(a.name) + '</b><span>Draft agent</span></span><span class="tag">Copilot Studio</span></div>' +
        '<div class="draft-body"><p>' + esc(a.desc) + '</p>' +
          '<div class="draft-sec"><h4>Knowledge</h4>' + chips(a.knowledge) + '</div>' +
          '<div class="draft-sec"><h4>Tools</h4>' + chips(a.tools) + '</div>' +
          '<div class="draft-sec"><h4>Trigger</h4><div class="chips"><span>' + esc(a.trigger) + '</span></div></div></div>';
      log.appendChild(d); scroll();
      setTimeout(cb, reduce ? 0 : 700);
    });
  }

  function askNext() {
    var q = QUESTIONS[state.i];
    setProgress();
    botMsg('<p class="q">' + esc(q.q) + '</p>', function () {
      var wrap = el('div', 'cs-options');
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', q.q);
      q.options.forEach(function (o) {
        var b = el('button', null, optIcon(o.l) + '<span>' + esc(o.t) + '</span>');
        b.type = 'button';
        b.addEventListener('click', function () { if (!state.busy) answer(o); });
        wrap.appendChild(b);
      });
      log.appendChild(wrap);
      state.busy = false;
      scroll();
      var first = wrap.querySelector('button');
      if (first && document.activeElement && cs.contains(document.activeElement)) first.focus({ preventScroll: true });
    });
  }

  function answer(o) {
    state.busy = true;
    var q = QUESTIONS[state.i];
    var opts = log.querySelectorAll('.cs-options');
    if (opts.length) opts[opts.length - 1].remove();
    userMsg(o.t);
    state.answers.push({ q: q.q, a: o.t, s: o.s, pillar: q.pillar });
    state.i++;
    botMsg('<p>' + esc(o.r) + '</p>', function () {
      if (state.i < QUESTIONS.length) askNext();
      else finish();
    });
  }

  function scores() {
    var out = {};
    PILLARS.forEach(function (p) {
      var list = state.answers.filter(function (a) { return a.pillar === p; });
      var avg = list.length ? list.reduce(function (t, a) { return t + a.s; }, 0) / list.length : 2;
      out[p] = avg;
    });
    return out;
  }

  function finish() {
    state.done = true;
    cs.classList.add('done');
    setProgress();
    var sc = scores();
    var meters = PILLARS.map(function (p) {
      var v = sc[p];
      var level = v >= 2.5 ? 2 : v >= 1.75 ? 1 : 0;
      var label = ['Needs prep', 'Nearly there', 'Strong'][level];
      return '<div class="meter"><b>' + p + '<span>' + label + '</span></b><div class="bar"><i data-w="' + (0.18 + (v / 3) * 0.82).toFixed(2) + '"></i></div><p>' + esc(NOTES[p][level]) + '</p></div>';
    }).join('');

    var summary = state.answers.map(function (a) { return '- ' + a.q + ' ' + a.a; }).join('\n');
    var body = 'Hi Victor,\n\nI just took the agent readiness check on eyedeasinc.com and would like the complimentary assessment.\n\n' +
      (state.sample ? 'Sample I picked: ' + state.sample.title + '\n\n' : state.idea ? 'What we want to build: ' + state.idea + '\n\n' : '') + 'My answers:\n' + summary + '\n\nName:\nCompany:\n';
    var mailto = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Complimentary agent readiness assessment') + '&body=' + encodeURIComponent(body);

    botMsg('<p>Thanks, that is everything I need.</p>', function () {
      var card = el('div', 'result');
      card.innerHTML =
        '<p class="rh">Your readiness</p>' +
        '<p class="verdict">We believe you are ready to start. Contact us for a complimentary assessment.</p>' +
        '<div class="meters">' + meters + '</div>' +
        '<div class="result-actions">' +
          '<a class="cs-primary" href="' + BOOKING + '" target="_blank" rel="noopener">Book my complimentary assessment</a>' +
          '<a class="sec" href="' + mailto + '">Email my answers</a>' +
          '<button class="sec" type="button" data-restart>Start over</button>' +
        '</div>';
      log.appendChild(card);
      scroll();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          card.querySelectorAll('.bar i').forEach(function (i) { i.style.transform = 'scaleX(' + i.getAttribute('data-w') + ')'; });
        });
      });
      card.querySelector('[data-restart]').addEventListener('click', restart);
      state.busy = false;
    });
  }

  function restart() {
    cs.classList.remove('chatting', 'done');
    progress.classList.remove('show');
    log.innerHTML = '';
    var firstSample = cs.querySelector('.cs-sample'); if (firstSample) firstSample.focus();
  }
})();
