/* AI voor je bedrijf — site behaviour (v3). No dependencies. Every part checks for its own markup, so one file serves every page. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IDEA_KEY = 'avjb-idee';

  /* ---------- nav: the phone menu ---------- */
  const nav = $('.nav'), toggle = $('.nav__toggle');
  if (nav && toggle) {
    const set = (open) => { nav.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); };
    toggle.addEventListener('click', () => set(!nav.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); toggle.focus(); } });
    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) set(false); });
  }

  /* ---------- the idea bar: what the visitor types travels to the contact form (kept in this tab only) ---------- */
  const ideaForms = $$('[data-idea]');
  const ideaInputs = ideaForms.map((f) => $('input', f));
  const remember = (text) => { try { sessionStorage.setItem(IDEA_KEY, text); } catch (_) { /* private mode: the form simply opens empty */ } };
  ideaForms.forEach((form, i) => {
    const input = ideaInputs[i];
    input.addEventListener('input', () => ideaInputs.forEach((o) => { if (o !== input) o.value = input.value; }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const folded = form.classList.contains('dock') && getComputedStyle(input).display === 'none';
      const close = $('#idea-close');
      if (folded && close) { close.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' }); close.focus({ preventScroll: true }); return; }
      remember(input.value.trim()); location.href = 'contact.html';
    });
  });
  $$('[data-focus-idea]').forEach((a) => a.addEventListener('click', (e) => {
    const target = $('#idea-close'); if (!target) return;
    e.preventDefault(); target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' }); target.focus({ preventScroll: true });
  }));

  $$('[data-eg]').forEach((b) => b.addEventListener('click', () => {
    ideaInputs.forEach((o) => { o.value = b.textContent; });
    const target = $('#idea-close'); if (target) target.focus();
  }));

  /* the floating glass takes the tone of what lies under it: dark over the navy band and the dark tile */
  const floats = $$('.nav, .dock'), darks = $$('[data-dark]'), accs = $$('[data-accent]');
  if (floats.length && darks.length) {
    let ticking = false;
    const tone = () => {
      ticking = false;
      floats.forEach((f) => {
        const r = f.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        const seam = accs.some((d) => { const b = d.getBoundingClientRect(); return r.bottom > b.top && r.top < b.bottom && r.right > b.left && r.left < b.right; });
        f.classList.toggle('on-dark', seam || darks.some((d) => { const b = d.getBoundingClientRect(); return y > b.top && y < b.bottom && x > b.left && x < b.right; }));
        f.classList.toggle('on-seam', seam);
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(tone); } }, { passive: true });
    addEventListener('resize', tone); tone();
  }

  /* examples typed into the hero bar: finite (two rounds), stops for good on focus or input */
  const heroInput = $('#idea-hero');
  if (heroInput && !still) {
    const base = heroInput.placeholder;
    const examples = ['Een offertetool met onze prijslijst', 'Een onderhoudsplanner met herinneringen', 'Bestellingen uit mail en webshop op één plek',
      'Een portaal voor onze leden', 'Een app voor werkbonnen op locatie', 'Een dashboard met al onze cijfers'];
    let stop = false, timer;
    const halt = () => { stop = true; clearTimeout(timer); heroInput.placeholder = base; };
    heroInput.addEventListener('focus', halt, { once: true });
    const run = async () => {
      const wait = (ms) => new Promise((r) => { timer = setTimeout(r, ms); });
      await wait(1600);
      for (let round = 0; round < 2 && !stop; round++) {
        for (const text of examples) {
          for (let n = 1; n <= text.length && !stop; n++) { heroInput.placeholder = text.slice(0, n); await wait(34); }
          await wait(1500);
          for (let n = text.length; n >= 0 && !stop; n -= 2) { heroInput.placeholder = text.slice(0, n); await wait(14); }
          if (stop) return;
        }
      }
      if (!stop) heroInput.placeholder = base;
    };
    run();
  }

  /* the dock: shown once the hero bar has scrolled away, hidden while the closing bar or the contact form is on screen.
     Where it would lie on a button, a field or the result card, it folds to its round button. */
  const dock = $('.dock');
  if (dock && 'IntersectionObserver' in window) {
    const watched = [$('.hero [data-idea]'), $('.close [data-idea]'), $('#contact-form')].filter(Boolean);
    const seen = new Set(), small = matchMedia('(max-width: 639px)');
    let queued = false;
    const update = () => {
      queued = false;
      const on = seen.size === 0 && scrollY > 200;
      dock.classList.toggle('is-on', on); dock.inert = !on;
      if (!on || small.matches) return;
      const w = Math.min(620, innerWidth - 80), box = { l: (innerWidth - w) / 2 - 12, r: (innerWidth + w) / 2 + 12, t: innerHeight - 96, b: innerHeight - 6 };
      const hit = $$('main .btn, main .eg, main .part, main input, main .cell__text, main .tile, main .build__note, main .calc, main .cell, main .win, main .more, .foot a').some((n) => {
        if (dock.contains(n)) return false; const q = n.getBoundingClientRect();
        return q.width > 0 && q.left < box.r && q.right > box.l && q.top < box.b && q.bottom > box.t;
      });
      dock.classList.toggle('is-mini', hit); dock.inert = hit;
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    const io = new IntersectionObserver((entries) => { entries.forEach((en) => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)); ask(); }, { rootMargin: '0px 0px -40px 0px' });
    watched.forEach((el) => io.observe(el));
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); update();
  }

  /* ---------- the builder: toggle parts, the system takes shape ---------- */
  const side = $('#build-side'), tiles = $('#build-tiles');
  if (side && tiles) {
    const count = $('#build-count'), partsBox = $('.parts');
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
    const mini = (pairs) => { const m = el('div', 'mini'); pairs.forEach(([a, b]) => { const r = el('div'); r.append(el('span', '', a), el('span', '', b)); m.append(r); }); return m; };
    const sk = (kind, n, vals) => { const s = el('div', 'sk sk--' + kind); for (let i = 0; i < n; i++) { const b = el('i'); if (vals) b.style.setProperty('--v', vals[i] + '%'); s.append(b); } return s; };
    const content = {
      klanten: () => [mini([['Van Dalen', 'Offerte'], ['Morgenrood', 'Nieuw'], ['Kleurrijk', 'Klant']])],
      offertes: () => [mini([['2026-118', '€ 5.600'], ['2026-117', '€ 12.300'], ['2026-115', '€ 4.800']])],
      planning: () => [sk('cal', 10), el('small', '', 'Dinsdag: 6 klussen')],
      boeken: () => [sk('cal', 10), el('small', '', 'Vandaag 4 nieuwe afspraken')],
      facturen: () => [mini([['2026-0412', 'Betaald'], ['2026-0411', 'Verstuurd'], ['2026-0398', 'Herinnerd']])],
      voorraad: () => [sk('bars', 6, [82, 24, 55, 12, 68, 40]), el('small', '', '2 artikelen bijna op')],
      uren: () => [sk('bars', 6, [38, 62, 48, 74, 58, 92]), el('small', '', '164 uur deze week')],
      portaal: () => [mini([['Warmtepomp, fase 2', 'Loopt'], ['Offerte fase 2', 'Getekend']]), el('small', '', '3 klanten online')],
      rapport: () => [sk('bars', 6, [42, 51, 47, 63, 70, 88]), el('small', '', 'Omzet per maand')],
      ai: () => [el('p', 'msg', 'Zal ik de offerte voor Van Dalen klaarzetten?'), el('p', 'msg msg--me', 'Ja, graag')],
      chatbot: () => [el('p', 'msg msg--me', 'Kan ik zaterdag langskomen?'), el('p', 'msg', 'Om 10:30 is er nog plek.')],
      flow: () => [mini([['Aanvraag naar CRM', '14x'], ['Factuur naar boekhouding', '23x'], ['Herinnering', '3x']])],
    };
    const custom = () => [mini([['Jouw velden', ''], ['Jouw stappen', ''], ['Jouw rechten', '']])];
    const render = () => {
      const on = $$('.part[aria-pressed="true"]', partsBox);
      side.replaceChildren(...on.map((p, i) => el('span', i === 0 ? 'on' : '', p.textContent)));
      const have = new Map($$('.tile', tiles).map((t) => [t.dataset.id, t]));
      on.forEach((p) => {
        let t = have.get(p.dataset.part);
        if (!t) { t = el('div', 'tile'); t.dataset.id = p.dataset.part; t.append(el('b', '', p.textContent), ...(content[p.dataset.part] || custom)()); }
        have.delete(p.dataset.part); tiles.append(t);
      });
      have.forEach((t) => t.remove());
      count.textContent = on.length === 1 ? '1 onderdeel' : on.length + ' onderdelen';
    };
    partsBox.addEventListener('click', (e) => {
      const p = e.target.closest('.part'); if (!p) return;
      p.setAttribute('aria-pressed', String(p.getAttribute('aria-pressed') !== 'true')); render();
    });
    const own = $('#own'), ownInput = $('#own-input');
    own.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = ownInput.value.trim().replace(/\s+/g, ' '); if (!text) return;
      const b = el('button', 'part', text); b.type = 'button'; b.setAttribute('aria-pressed', 'true'); b.dataset.part = 'eigen-' + Date.now();
      partsBox.append(b); ownInput.value = ''; render();
    });
    $('#build-send').addEventListener('click', () => {
      const names = $$('.part[aria-pressed="true"]', partsBox).map((p) => p.textContent.toLowerCase());
      remember(names.length ? 'Een systeem met ' + names.join(', ') : ''); location.href = 'contact.html';
    });
    render();
  }

  /* ---------- the savings calculator: the visitor's own figures, 46 working weeks a year ---------- */
  const calc = $('#calc');
  if (calc) {
    const id = (x) => document.getElementById(x), nl = new Intl.NumberFormat('nl-NL'), shown = {};
    const roll = (key, to) => {
      const el = id(key), from = shown[key] ?? to; shown[key] = to;
      if (still || from === to) { el.textContent = nl.format(to); return; }
      const t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 320), e = 1 - Math.pow(1 - p, 3); el.textContent = nl.format(Math.round(from + (to - from) * e)); if (p < 1 && shown[key] === to) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const fill = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
    const run = () => {
      const uren = +id('c-uren').value, mensen = +id('c-mensen').value, tarief = +id('c-tarief').value, deel = +id('c-deel').value;
      id('l-uren').textContent = uren + ' uur'; id('l-mensen').textContent = mensen; id('l-tarief').textContent = '€ ' + tarief; id('l-deel').textContent = deel + '%';
      const nu = uren * mensen * 46, terug = Math.round(nu * deel / 100);
      roll('o-uren-nu', nu); roll('o-euro-nu', nu * tarief); roll('o-uren', terug); roll('o-euro', terug * tarief);
      roll('o-uren-na', nu - terug); const bn = id('bar-na'); if (bn) bn.style.width = Math.max(4, 100 - deel) + '%';
      $$('input[type="range"]', calc).forEach(fill);
    };
    calc.addEventListener('input', run); run();
  }

  /* ---------- the contact form: the idea from the bar lands in the question field ---------- */
  const question = $('#f-msg');
  if (question) {
    let idea = ''; try { idea = sessionStorage.getItem(IDEA_KEY) || ''; } catch (_) { /* nothing stored */ }
    if (idea && !question.value) question.value = idea;
  }

  /* the form checks its fields, then opens the visitor's mail app with the message filled in (until a form service is connected) */
  const form = $('#contact-form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    $$('[required]', form).forEach((el) => {
      const val = el.value.trim(), bad = !val || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(val));
      el.setAttribute('aria-invalid', String(bad)); document.getElementById(el.getAttribute('aria-describedby')).hidden = !bad;
      if (bad && !first) first = el;
    });
    if (first) { first.focus(); return; }
    const v = (x) => document.getElementById(x).value.trim();
    const body = 'Naam: ' + v('f-name') + '\nBedrijf: ' + v('f-company') + '\nE-mail: ' + v('f-email') + '\n\n' + v('f-msg');
    location.href = form.getAttribute('action') + '?subject=' + encodeURIComponent('Kennismaking: ' + v('f-company')) + '&body=' + encodeURIComponent(body);
  });

  /* ---------- liquid glass: real refraction where the browser can do it (Chromium), blur everywhere else ----------
     Each [data-lens] element gets its own SVG filter: a displacement map drawn for its exact size bends the backdrop
     at the rim, the way a thick glass edge does. Skipped on small screens and when less transparency is asked for. */
  const chromium = !!(navigator.userAgentData && navigator.userAgentData.brands && navigator.userAgentData.brands.some((b) => b.brand === 'Chromium'));
  const lensOk = chromium && matchMedia('(min-width: 640px)').matches && !matchMedia('(prefers-reduced-transparency: reduce)').matches;
  if (lensOk) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.style.position = 'absolute';
    document.body.append(svg);
    const mapFor = (w, h, r, bezel) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const px = x + .5 - w / 2, py = y + .5 - h / 2, qx = Math.abs(px) - (w / 2 - r), qy = Math.abs(py) - (h / 2 - r);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0), out = Math.hypot(ox, oy), dist = r - out - Math.min(Math.max(qx, qy), 0);
        let nx = 0, ny = 0;
        if (dist >= 0 && dist < bezel) {
          if (qx > 0 && qy > 0) { nx = ox / out * Math.sign(px); ny = oy / out * Math.sign(py); } else if (qx > qy) nx = Math.sign(px); else ny = Math.sign(py);
          const t = 1 - dist / bezel, m = t * t; nx *= m; ny *= m;
        }
        const k = (y * w + x) * 4; d[k] = 128 + nx * 127; d[k + 1] = 128 + ny * 127; d[k + 2] = 128; d[k + 3] = 255;
      }
      ctx.putImageData(img, 0, 0); return c.toDataURL();
    };
    let n = 0;
    const build = (el) => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight); if (!w || !h) return;
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, h / 2, w / 2), bezel = Math.max(10, Math.min(18, h * .26));
      const fid = el.dataset.lensId || (el.dataset.lensId = 'lens-' + n++);
      let f = document.getElementById(fid);
      if (!f) { f = document.createElementNS(NS, 'filter'); f.id = fid; f.setAttribute('color-interpolation-filters', 'sRGB'); svg.append(f); }
      f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', w); f.setAttribute('height', h); f.setAttribute('filterUnits', 'userSpaceOnUse');
      f.innerHTML = '';
      const blur = document.createElementNS(NS, 'feGaussianBlur'); blur.setAttribute('in', 'SourceGraphic'); blur.setAttribute('stdDeviation', '8'); blur.setAttribute('result', 'soft');
      const im = document.createElementNS(NS, 'feImage'); im.setAttribute('href', mapFor(w, h, r, bezel)); im.setAttribute('x', '0'); im.setAttribute('y', '0'); im.setAttribute('width', w); im.setAttribute('height', h); im.setAttribute('result', 'map');
      const dm = document.createElementNS(NS, 'feDisplacementMap'); dm.setAttribute('in', 'soft'); dm.setAttribute('in2', 'map'); dm.setAttribute('scale', String(-Math.round(bezel * 3.6))); dm.setAttribute('xChannelSelector', 'R'); dm.setAttribute('yChannelSelector', 'G');
      f.append(blur, im, dm);
      el.style.setProperty('--lens', `url(#${fid}) saturate(165%)`);
    };
    const lenses = $$('[data-lens]');
    let raf; const ro = new ResizeObserver((entries) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => entries.forEach((en) => build(en.target))); });
    lenses.forEach((el) => { build(el); ro.observe(el); });
    document.documentElement.classList.add('lens');
  }
})();
