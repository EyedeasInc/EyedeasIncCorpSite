/* Eyedeas Inc. build kit: the harness demo, the skill pipeline and the prompt stepper.
   Adapted from the Zero To Hero Ignite kit; prompts are the real ones from the stakeholder hub build. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => s.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const CK = '<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const wait = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));
  const once = (el, fn, margin = '0px 0px -15% 0px') => { if (!el) return; const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { fn(); o.disconnect(); } }, {rootMargin: margin}); o.observe(el); };
  const IMG = 'assets/img/kit/';

  function tabs(list, sel, onPick) {
    const items = $$(sel, list);
    const pick = (i, focus) => { items.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; }); if (focus) items[i].focus(); onPick(i); };
    items.forEach((t, i) => {
      t.addEventListener('click', () => pick(i));
      t.addEventListener('keydown', e => {
        const k = e.key; let n = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % items.length;
        if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i - 1 + items.length) % items.length;
        if (n !== null) { e.preventDefault(); pick(n, true); }
      });
    });
    return pick;
  }

  const ENV = 'https://YOUR-ENV.crm.dynamics.com';
  const STEPS = [
    {k: 'dv-connect', s: 'Sign in and connect', at: 12.9,
     short: `/dv-connect Connect to ${ENV} using device code sign-in.`,
     full: `/dv-connect Connect to ${ENV} using device code sign-in.`,
     rows: [['Check existing setup and tools', 'dataverse --version'], ['Check dependencies and auth', 'python3 -c "from PowerPlatform.Dataverse.client import DataverseClient"'], ['Sign in to Dataverse', 'dataverse auth create --deviceCode'], ['Sign in to the Power Platform CLI', 'pac auth create --deviceCode']],
     ans: `<p>Connected. ${CK} Dataverse CLI profile, ${CK} PAC profile, ${CK} Dataverse MCP server registered, ${CK} workspace .env written.</p>`,
     shots: null},
    {k: 'dv-solution', s: 'Publisher and solution', at: 31.2,
     short: '/dv-solution Create a publisher "Hero" with prefix hero and an unmanaged solution "Hero Stakeholder Management".',
     full: '/dv-solution Create a publisher "Hero" with prefix hero and an unmanaged solution "Hero Stakeholder Management".',
     rows: [['Loaded skill dv-solution', ''], ['Check for an existing publisher', "dataverse data list --table publishers --filter \"customizationprefix eq 'hero'\""], ['Create publisher and solution', 'python scripts/create_solution.py --publisher Hero --prefix hero']],
     ans: `<p>Created publisher <b>Hero</b> with prefix hero and the unmanaged solution <b>Hero Stakeholder Management</b>, set as preferred. ${CK}</p>`,
     shots: [['ev-solutions.jpg', 'The solution in the Power Apps maker portal']]},
    {k: 'dv-metadata', s: 'The data model', at: 48.9,
     short: '/dv-metadata In the Hero Stakeholder Management solution, model stakeholder management for Zava Institute for Open Markets: organizations by sector, stakeholders, programs, committees, engagements, grants and relationship affinity scores.',
     full: `/dv-metadata In the Hero Stakeholder Management solution (prefix hero), model stakeholder management for Zava Institute for Open Markets. Follow model-app-plan.md. Show me the plan before you create anything.

Reuse, do not recreate:
- Organization = account. Add: Sector (choice: Private Sector, Public Sector, Government, Civil Society, Multilateral), Organization Type (choice: Business Association, Chamber of Commerce, Think Tank, Donor / Foundation, Government Agency, Legislative Committee, Multilateral Institution, Corporation, Media, NGO), Region (choice: Africa, Asia-Pacific, Europe and Eurasia, Latin America and Caribbean, Middle East and North Africa, North America, Global), Country (text), Partnership Status (choice: Prospect, Active Partner, Past Partner, Donor, Government Counterpart).
- Stakeholder = contact. Add: Sector (same choices), Stakeholder Tier (choice: Tier 1 - Strategic, Tier 2 - Key, Tier 3 - Engaged), Affinity Score (whole number 0 to 100), Relationship Health (choice: Warm, Steady, Cooling, Cold), Last Touch (date), Stakeholder Profile (multiline text).

Create:
- Program (hero_program): Theme (choice: Anti-Corruption and Ethics, Digital Economy, Trade Facilitation, Women's Economic Empowerment, Accountable Investment, Association Development, Democratic Governance), Region (same choices), Program Status (choice: Planning, Active, Closing, Completed), Budget (currency), Start Date, End Date, Summary (multiline). Notes enabled.
- Committee (hero_committee): Committee Type (choice: Congressional Committee, Advisory Board, Working Group, Coalition), Chamber (choice: House, Senate, Not Applicable), Jurisdiction / Focus (multiline).
- Engagement (hero_engagement): Subject (primary), Engagement Type (choice: Meeting, Briefing, Event, Call, Site Visit, Conference), Engagement Date, Sentiment (choice: Positive, Neutral, Negative), Outcome (multiline), Follow-up Required (yes/no). Notes enabled.
- Engagement Participant (hero_engagementparticipant): links a stakeholder to an engagement. Role (choice: Host, Speaker, Attendee, Organizer).
- Donor Grant (hero_grant): Amount (currency), Stage (choice: Identify, Cultivate, Propose, Awarded, Declined), Expected Decision (date), Proposal Submitted (yes/no).

Relationships:
- account 1:N contact (Stakeholder Organization)
- account 1:N hero_program (Lead Partner)
- account 1:N hero_engagement (Organization)
- hero_program 1:N hero_engagement (Program)
- hero_committee 1:N hero_engagement (Committee)
- hero_engagement 1:N hero_engagementparticipant (Engagement)
- contact 1:N hero_engagementparticipant (Stakeholder)
- account 1:N hero_grant (Donor)
- hero_program 1:N hero_grant (Grant Program)
- hero_committee N:N contact (committee members)
- hero_program N:N account (program partners)`,
     rows: [['Loaded skill dv-metadata', ''], ['Read workspace conventions', 'cat CLAUDE.md .env'], ['Wrote data model plan', 'model-plan.md'], ['Create tables and columns', 'python scripts/create_model.py --solution HeroStakeholderManagement']],
     ans: `<p>Data model created in <b>Hero Stakeholder Management</b>: account and contact extended, five hero tables created, 11 relationships. ${CK}</p>`,
     shots: [['ev-tables.jpg', 'The tables inside the solution']]},
    {k: 'dv-data', s: 'Sample data with photos', at: 75.3,
     short: '/dv-data Load realistic sample data: 32 organizations, 60 stakeholders with photos, 140 engagements and grants. All people are fictitious.',
     full: `/dv-data Load the Zava sample data with scripts/load_sample_data.py, then upload stakeholder photos with scripts/upload_headshots.py (photos are in assets/headshots). Load in dependency order and resume if a run stops.

What it creates:
- 32 organizations across all five sectors and seven regions. Real institutions carry public facts only; private organizations and donors are fictitious (Woodgrove Foundation, Humongous Philanthropies, Contoso Global Prosperity Fund).
- 8 committees: 4 Congressional (House Foreign Affairs, Senate Foreign Relations, Senate Finance trade subcommittee, House Ways and Means trade subcommittee) plus the Zava Global Advisory Council, two working groups and a coalition.
- 10 programs, for example Open Procurement East Africa, Digital Trade Readiness ASEAN, Women Exporters Accelerator and Ukraine Business Resilience, each with a lead partner and budget.
- 60 fictitious stakeholders with photos, linked to organizations and committees.
- 140 engagements over the last year, with participants, sentiment and follow ups.
- Affinity Score, Relationship Health and Last Touch calculated from each stakeholder's engagements.
- 12 donor grants across every pipeline stage.

All people are fictitious.`,
     rows: [['Loaded skill dv-data', ''], ['Read table schema', 'dataverse data describe --table contact --include attributes'], ['Load records in dependency order', 'python scripts/load_sample_data.py'], ['Upload stakeholder photos', 'python scripts/upload_headshots.py']],
     ans: `<p>Loaded 32 organizations, 8 committees, 10 programs, 60 stakeholders with photos, 140 engagements and 12 grants. ${CK} All people are fictitious.</p>`,
     shots: [['ev-data.jpg', 'Stakeholder records with photos']]},
    {k: 'app-builder', s: 'The model driven app', at: 95.9,
     short: '/app-builder Build the Zava Stakeholder Hub model-driven app on these tables: forms, views, charts, a sitemap and two security roles, in the Hero Stakeholder Management solution.',
     full: `/app-builder Build the Zava Stakeholder Hub model-driven app in the Hero Stakeholder Management solution, on the tables we just created. Follow model-app-plan.md.

Personas and jobs:
- Zava Relationship Manager: maintain organizations and stakeholders, log engagements and participants, explore stakeholder networks, spot cooling relationships. Out of scope: approving grants.
- Zava Leadership: review relationship health and the donor pipeline.

Forms (main, with sub-grids):
- Zava Organization (account): stakeholders, programs, engagements, grants
- Zava Stakeholder (contact): engagement participations, committees
- Program: partners, engagements, grants
- Committee: members, engagements
- Engagement: participants
- Engagement Participant, Donor Grant

Views:
- Active Partners by Region (account, status Active Partner, Donor or Government Counterpart, sorted by region)
- Key Stakeholders (contact, sorted by affinity score, highest first)
- My Relationships (my contacts, oldest last touch first)
- Cooling Relationships (contact, health Cooling or Cold, oldest last touch first)
- Recent Engagements (newest first)
- Engagement Participants List
- Donor Pipeline by Stage (grants not Declined, by expected decision)
- Program Portfolio, Committee Directory

Charts: Stakeholders by Relationship Health (pie), Organizations by Sector (bar), Grants by Stage (column), Engagements by Type (column).

Business process flow: Grant Pipeline on Donor Grant, following the stages Identify, Cultivate, Propose, Awarded.

Sitemap, area Stakeholder Hub:
- Insights: Network Explorer, Relationship Health (generative pages, built in the next step)
- Relationships: Stakeholders, Organizations, Engagements, Committees
- Programs and Funding: Programs, Donor Grants

Security roles, organization scope:
- Zava Relationship Manager: read, create and write on organizations, stakeholders and engagements; full access to participants; read only on programs and committees.
- Zava Leadership: read only on organizations, stakeholders, engagements and participants; read, create and write on programs, committees and grants.

Design: accent #5B5FC7, comfortable density, large corners, light theme, card layout.

Show me the plan before you build.`,
     rows: [['Loaded skill app-builder', ''], ['Authored App Spec', 'app-spec.json'], ['Lint App Spec', 'maker lint app-spec.json   1 fix applied'], ['Plan approved by a person', ''], ['Build the app', 'maker build --stage full']],
     ans: `<p><b>Zava Stakeholder Hub</b> is built and published: 7 forms, 9 views, 4 charts, the Grant Pipeline flow and two roles. verify PASS, 144 of 144 ${CK}</p>`,
     shots: [['ev-app.jpg', 'A stakeholder record in Zava Stakeholder Hub']]},
    {k: 'genpage', s: 'Two generative pages', at: 121.3,
     short: '/genpage Add two pages to the Zava Stakeholder Hub: a stakeholder network explorer and a relationship health dashboard.',
     full: `/genpage Add two pages to the Zava Stakeholder Hub, under Insights in the sitemap. Use the app's design: accent #5B5FC7, large corners, light theme.

1. Stakeholder Network Explorer (network-explorer)
- Top: a search box and filters for Sector, Region and Tier.
- A grid of stakeholder cards for Tier 1 and Tier 2 contacts: photo or coloured initials, name, job title, organization, sector colour (Private Sector blue, Public Sector teal, Government purple, Civil Society green, Multilateral amber), an affinity score ring from 0 to 100, a relationship health badge and last touch date.
- Selecting a card opens a network view with the stakeholder as the hub and labelled clusters with counts: Contacts (people who shared engagements), Organizations, Committees and Initiatives (programs of engagements they attended).
- Edge thickness shows the number of shared engagements; edge colour shows recency (warm for the last 90 days, cool for older).
- Selecting a contact node recentres the graph on them, with a breadcrumb to go back. A side panel lists their last 5 engagements and an Open record button.

2. Relationship Health (relationship-health)
- KPI tiles: active stakeholders, engagements in the last 90 days, cooling or cold relationships, open grant pipeline value.
- Affinity score distribution in buckets from 0 to 100.
- Engagements by region, and engagements over the last 12 months.
- Top 10 relationships by affinity, and the 10 most at risk (Cooling or Cold, oldest last touch) with photo, organization and days since last touch. Selecting a row opens the contact.
- Grants by stage as a funnel with amounts.

Show me the page plan before you build.`,
     rows: [['Loaded skill genpage', ''], ['Read verified schema', 'RuntimeTypes.ts'], ['Started 2 page builders in parallel', ''], ['Generating pages', 'network-explorer.tsx · relationship-health.tsx']],
     ans: `<p>Two generative pages published to <b>Zava Stakeholder Hub</b>: Stakeholder Network Explorer and Relationship Health. ${CK}</p>`,
     shots: [['01-network-explorer-cards.jpg', 'Network explorer: stakeholder cards'], ['02-network-view.jpg', 'Network explorer: the network view'], ['03-relationship-health.jpg', 'Relationship Health dashboard']]}
  ];

  const cmdHTML = (t, n) => { const sp = t.indexOf(' '); const s = t.slice(0, n);
    return n <= sp ? `<span class="cmd">${esc(s)}</span>` : `<span class="cmd">${esc(t.slice(0, sp))}</span>${esc(s.slice(sp))}`; };

  // one simulated run in a window; a token cancels older runs in the same window
  async function play(win, step, {text, rowsCode = true, typeMs, rowMs, scroll = true}) {
    const token = (win._run = (win._run || 0) + 1); const live = () => win._run === token;
    win.innerHTML = '<div class="ubub"></div><div class="rows"></div><div class="ans"></div>';
    const bub = $('.ubub', win), rows = $('.rows', win), ans = $('.ans', win);
    if (RM) bub.innerHTML = cmdHTML(text, text.length);
    else {
      const total = text.length, t0 = performance.now();
      await new Promise(res => { const tick = now => { if (!live()) return res();
        const n = Math.min(total, Math.round(total * Math.min(1, (now - t0) / typeMs)));
        bub.innerHTML = cmdHTML(text, n) + '<span class="caret"></span>';
        if (scroll) win.scrollTop = win.scrollHeight;
        n < total ? requestAnimationFrame(tick) : res(); }; requestAnimationFrame(tick); });
      if (!live()) return false; bub.innerHTML = cmdHTML(text, text.length);
    }
    await wait(300);
    for (const [label, code] of step.rows) {
      if (!live()) return false;
      const r = document.createElement('div'); r.className = 'r run';
      r.innerHTML = `<span class="dot"></span><span>${esc(label)}${rowsCode && code ? `<code>${esc(code)}</code>` : ''}</span>`;
      rows.appendChild(r); requestAnimationFrame(() => r.classList.add('on'));
      if (scroll) win.scrollTop = win.scrollHeight;
      await wait(rowMs); r.classList.replace('run', 'done');
    }
    if (!live()) return false;
    ans.innerHTML = step.ans; ans.classList.add('on'); if (scroll) win.scrollTop = win.scrollHeight;
    if (RM) $$('.r', rows).forEach(r => r.classList.add('on'));
    return true;
  }

  // ---------- Step 1: describe the app, the plan comes back for approval ----------
  const PLAN = {
    rows: [['Loaded skills app-builder and dv-metadata', ''], ['Read conventions and brief', 'CLAUDE.md · model-app-plan.md'], ['Wrote the plan, waiting for approval', 'plan.md']],
    ans: `<p>Here is the plan for <b>Zava Stakeholder Hub</b>, in the solution Hero Stakeholder Management.</p>
      <div class="plan"><div><b>7</b><span>tables</span></div><div><b>11</b><span>relationships</span></div><div><b>9</b><span>views, 7 forms</span></div><div><b>2</b><span>generative pages</span></div></div>
      <p class="ok">${CK} Plan approved by a person. Building now.</p>`
  };
  const PLAN_PROMPT = 'Build a stakeholder hub for Zava with two generative pages. Show me the plan first.';
  const heroWin = $('#heroWin');
  if (heroWin) {
    let visible = false;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, {rootMargin: '0px 0px -10% 0px'}).observe(heroWin);
    (async () => {
      if (RM) { await play(heroWin, PLAN, {text: PLAN_PROMPT, typeMs: 0, rowMs: 0, scroll: false}); return; }
      for (;;) {
        while (!visible || document.hidden) await wait(400);
        await play(heroWin, PLAN, {text: PLAN_PROMPT, typeMs: 2600, rowMs: 650, scroll: false});
        await wait(5200);
      }
    })();
  }

  // ---------- Step 2: the pipeline lights up step by step ----------
  const pipe = $('#pipe');
  if (pipe) {
    const cards = $$('.pipe-card', pipe);
    const run = async () => {
      if (RM) { cards.forEach(c => c.classList.add('seen')); return; }
      for (const c of cards) { c.classList.add('on'); await wait(520); c.classList.remove('on'); c.classList.add('seen'); }
    };
    if (/[?&]static\b/.test(location.search)) cards.forEach(c => c.classList.add('seen')); else once(pipe, run, '0px 0px -20% 0px');
  }

  // ---------- Step 3: every prompt, and what it built ----------
  const pWin = $('#pWin'), stepsEl = $('#steps'), shotBtn = $('#shotBtn'), copyBtn = $('#copyBtn');
  if (!pWin || !stepsEl) return;
  stepsEl.innerHTML = STEPS.map((s, i) => `<button class="pstep" type="button" role="tab" aria-selected="false" data-i="${i}"><span class="n">${i + 1}</span><span><b>/${s.k}</b><span>${s.s}</span></span></button>`).join('');
  let cur = 0;
  const show = i => {
    cur = i; const s = STEPS[i];
    $$('.pstep', stepsEl)[i].classList.add('seen');
    shotBtn.hidden = !s.shots;
    $('span', shotBtn).textContent = s.shots && s.shots.length > 1 ? `See the ${s.shots.length} results` : 'See the result';
    pWin.scrollTop = 0;
    play(pWin, s, {text: s.short, typeMs: Math.min(2400, s.short.length * 18), rowMs: 600});
  };
  const pickStep = tabs(stepsEl, '.pstep', show);
  once(pWin, () => pickStep(0), '0px 0px -25% 0px');
  $('#replayBtn').addEventListener('click', () => show(cur));
  copyBtn.addEventListener('click', async () => { const lab = $('span', copyBtn);
    try { await navigator.clipboard.writeText(STEPS[cur].full); lab.textContent = 'Copied'; copyBtn.classList.add('copied'); }
    catch (e) { lab.textContent = 'Copy blocked, select the text'; }
    setTimeout(() => { lab.textContent = 'Copy prompt'; copyBtn.classList.remove('copied'); }, 1800); });

  // result and video dialog
  const dlg = $('#dlg'), box = $('#dlgShots');
  const close = () => { const v = $('video', box); if (v) v.pause(); dlg.close(); };
  shotBtn.addEventListener('click', () => { const s = STEPS[cur]; if (!s.shots) return;
    $('#dlgTitle').textContent = `/${s.k}: ${s.s}`; $('#dlgSub').textContent = s.shots.map(x => x[1]).join(' · ');
    box.innerHTML = s.shots.map(([f, a]) => `<img src="${IMG}${f}" alt="${esc(a)}">`).join('');
    dlg.showModal(); });
  $('#videoBtn').addEventListener('click', () => {
    $('#dlgTitle').textContent = 'The whole build, sped up'; $('#dlgSub').textContent = 'A two minute time-lapse of the 33 minute agent build';
    box.innerHTML = `<video src="assets/video/zava-build.mp4" poster="assets/video/zava-poster.jpg" controls ${RM ? '' : 'autoplay'} muted playsinline></video>`;
    dlg.showModal(); });
  $('#dlgX').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', () => { const v = $('video', box); if (v) v.pause(); });
})();
