(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.getElementById('mobile-nav');
  const setSolid = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', setSolid, { passive: true });
  setSolid();
  const closeMenu = () => { toggle.setAttribute('aria-expanded', 'false'); mobileNav.hidden = true; setSolid(); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    setSolid();
  });
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { closeMenu(); toggle.focus(); } });

  if (reduceMotion) {
    document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); v.controls = true; });
  }

  const how = document.querySelector('[data-how]');
  if (how && 'IntersectionObserver' in window) {
    const num = how.querySelector('[data-how-num]');
    const bars = [...how.querySelectorAll('[data-how-bar]')];
    let current = 1;
    const show = step => {
      if (step === current) return;
      current = step;
      num.textContent = String(step).padStart(2, '0');
      bars.forEach((b, i) => b.classList.toggle('is-on', i < step));
      if (!reduceMotion) { num.classList.remove('is-rolling'); void num.offsetWidth; num.classList.add('is-rolling'); }
    };
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) show(Number(e.target.dataset.howStep));
    }), { rootMargin: '-45% 0px -55% 0px' });
    how.querySelectorAll('[data-how-step]').forEach(card => io.observe(card));
  }

  const gaitVideo = document.querySelector('[data-gait-video]');
  document.querySelectorAll('[data-gait]').forEach(btn => btn.addEventListener('click', () => {
    const view = btn.dataset.gait;
    document.querySelectorAll('[data-gait]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    gaitVideo.poster = `assets/media/gait-${view}.jpg`;
    gaitVideo.src = `assets/media/gait-${view}.mp4`;
    gaitVideo.setAttribute('aria-label', view === 'side'
      ? 'Запись анализа походки сбоку: корова идёт по коридору, справа графики углов суставов'
      : 'Запись анализа походки сзади: корова уходит по проходу, справа графики высоты копыт и хода маклоков');
    if (!reduceMotion) gaitVideo.play().catch(() => {});
  }));

  const DATA = [
    ['5766', 152, 151.2], ['5809', 152, 147.9], ['5845', 144, 141.5], ['5870', 148, 150.1], ['5882', 151, 153.2],
    ['5889', 145, 152.7], ['5892', 148, 144.4], ['5903', 150, 149.7], ['5904', 146, 148.0], ['5906', 145, 145.5],
    ['5909', 151, 150.8], ['5913', 156, 155.8], ['5920', 149, 142.5], ['5923', 144, 141.5], ['5934', 150, 155.8],
    ['5939', 150, 145.0], ['5940', 147, 143.9], ['5941', 137, 144.5], ['5943', 144, 147.1], ['5947', 149, 151.5],
    ['5957', 148, 142.8], ['5958', 148, 153.9], ['5964', 148, 144.6], ['5966', 150, 150.2], ['5970', 147, 148.3],
    ['5974', 151, 151.0], ['5991', 142, 137.8], ['5992', 144, 140.3], ['6014', 145, 144.1], ['6041', 155, 151.5]
  ];
  const box = document.querySelector('[data-scatter]');
  if (box) {
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
    const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
    const tip = document.createElement('div');
    tip.className = 'tag scatter-tip';
    tip.hidden = true;
    tip.setAttribute('aria-hidden', 'true');
    box.appendChild(tip);

    let drawnK = 0;
    const draw = () => {
    const k = Number(Math.min(1.8, Math.max(1, 520 / (box.clientWidth || 640))).toFixed(2));
    if (k === drawnK) return;
    drawnK = k;
    box.querySelector('svg')?.remove();
    tip.hidden = true;
    box.style.setProperty('--k', k);
    const W = 640, H = 480, m = { l: 40 + 12 * k, r: 14, t: 12, b: 38 + 12 * k }, lo = 134, hi = 160, BAND = 3;
    const x = v => m.l + (v - lo) / (hi - lo) * (W - m.l - m.r);
    const y = v => H - m.b - (v - lo) / (hi - lo) * (H - m.t - m.b);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Рост в крестце: ручной промер и промер камеры по 30 коровам. 15 коров в пределах 3 сантиметров.' });
    box.prepend(svg);
    for (let v = 135; v <= 160; v += 5) {
      el('line', { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b, class: 'grid' }, svg);
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'grid' }, svg);
      const tx = el('text', { x: x(v), y: H - m.b + 8 + 12 * k, 'text-anchor': 'middle', class: 'ax' }, svg); tx.textContent = v;
      const ty = el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'ax' }, svg); ty.textContent = v;
    }
    const xl = el('text', { x: (m.l + W - m.r) / 2, y: H - 8, 'text-anchor': 'middle', class: 'axt' }, svg); xl.textContent = 'Мерная палка бонитера, см';
    const yl = el('text', { x: 14, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle', class: 'axt', transform: `rotate(-90 14 ${(m.t + H - m.b) / 2})` }, svg); yl.textContent = 'Камера АгроБиоСенс, см';
    el('path', { class: 'band', d: `M${x(lo)},${y(lo + BAND)} L${x(hi - BAND)},${y(hi)} L${x(hi)},${y(hi)} L${x(hi)},${y(hi - BAND)} L${x(lo + BAND)},${y(lo)} L${x(lo)},${y(lo)} Z` }, svg);
    el('line', { class: 'diag', x1: x(lo), y1: y(lo), x2: x(hi), y2: y(hi) }, svg);

    DATA.forEach(([cowNo, manual, abt]) => {
      const inside = Math.abs(abt - manual) <= BAND;
      const r0 = 7 * k;
      const dot = el('circle', { cx: x(manual), cy: y(abt), r: r0, class: `dot ${inside ? 'dot-in' : 'dot-out'}` }, svg);
      const hit = el('circle', { cx: x(manual), cy: y(abt), r: 14 * k, class: 'hit', tabindex: 0, role: 'img',
        'aria-label': `Корова ${cowNo}: палка ${manual} см, камера ${fmt(abt)} см` }, svg);
      const on = () => {
        dot.setAttribute('r', r0 * 1.4);
        const diff = abt - manual;
        tip.innerHTML = `<span class="tag-no">${cowNo}</span><span class="tag-row"><span>камера</span><b>${fmt(abt)}</b></span><span class="tag-row"><span>палка</span><b>${manual}</b></span><span class="tag-row"><span>разница</span><b>${diff > 0 ? '+' : ''}${fmt(diff)}</b></span>`;
        const r = svg.getBoundingClientRect(), b = box.getBoundingClientRect();
        const left = (x(manual) / W) * r.width + r.left - b.left;
        tip.style.left = `${Math.min(Math.max(left, 70), b.width - 70)}px`;
        tip.style.top = `${(y(abt) / H) * r.height + r.top - b.top}px`;
        tip.hidden = false;
      };
      const off = () => { dot.setAttribute('r', r0); tip.hidden = true; };
      hit.addEventListener('mouseenter', on); hit.addEventListener('focus', on);
      hit.addEventListener('mouseleave', off); hit.addEventListener('blur', off);
    });
    };
    draw();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  }

  const modal = document.querySelector('[data-modal]');
  if (modal) {
    let opener = null;
    const openModal = () => {
      if (modal.open) return;
      opener = document.activeElement;
      modal.showModal();
      const first = modal.querySelector('#f-name');
      if (first) first.focus();
    };
    document.querySelectorAll('a[href="#contact"]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      openModal();
    }));
    modal.querySelector('[data-modal-close]').addEventListener('click', () => modal.close());
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); }); // клик по подложке
    modal.addEventListener('close', () => {
      if (location.hash === '#contact') history.replaceState(null, '', location.pathname + location.search);
      if (opener && opener.focus) opener.focus();
    });
    if (location.hash === '#contact') openModal(); // переход с technology.html
  }

  document.querySelectorAll('[data-interest]').forEach(a => a.addEventListener('click', () => {
    const input = document.querySelector(`[data-interest-input="${a.dataset.interest}"]`);
    if (input) input.checked = true;
  }));
  document.querySelectorAll('[data-module]').forEach(a => a.addEventListener('click', () => {
    const input = document.querySelector(`[data-module-input="${a.dataset.module}"]`);
    if (input) input.checked = true;
  }));

  const form = document.querySelector('[data-form]');
  if (form) {
    const done = form.querySelector('[data-form-done]');
    const check = (input, errId, ok) => {
      const err = document.getElementById(errId);
      input.setAttribute('aria-invalid', String(!ok));
      if (ok) input.removeAttribute('aria-describedby'); else input.setAttribute('aria-describedby', errId);
      err.hidden = ok;
      return ok;
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      const okName = check(f.name, 'f-name-err', f.name.value.trim().length > 1);
      const okContact = check(f.contact, 'f-contact-err', f.contact.value.trim().length > 4);
      const okConsent = check(f.consent, 'f-consent-err', f.consent.checked);
      if (!(okName && okContact && okConsent)) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }
      const lines = [
        `Интерес: ${f.interest.value}`,
        `Модуль: ${f.module.value}`,
        `Имя: ${f.name.value.trim()}`,
        `Хозяйство и регион: ${f.org.value.trim() || '—'}`,
        `Поголовье: ${f.herd.value || 'не указано'}`,
        `Контакт: ${f.contact.value.trim()}`,
        `Вопрос или комментарий: ${f.message.value.trim() || '—'}`
      ];
      const subject = `Заявка с сайта АгроБиоСенс: ${f.interest.value} — ${f.module.value}`;
      window.location.href = `mailto:top_apk@rgau-msha.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      done.hidden = false;
    });
  }

  const stage = document.querySelector('[data-cf-stage]');
  if (stage) {
    const cow = stage.querySelector('[data-cf-cow]');
    const svg = cow.querySelector('svg');
    const vb = svg.viewBox.baseVal;
    const body = cow.querySelector('[data-cf-body]');
    const clip = cow.querySelector('[data-cf-clip]');
    const legs = [...cow.querySelectorAll('[data-leg]')].map(g => {
      const sk = cow.querySelector(`[data-legsk="${g.dataset.leg}"]`); // скелет ноги лежит в верхнем слое, крутится вместе с силуэтом
      return { gs: [g, sk], sk, px: Number(g.dataset.px), py: Number(g.dataset.py), off: Number(g.dataset.off) * Math.PI, pts: [...sk.querySelectorAll('.cf-pt')] };
    });
    const bodyPts = [...cow.querySelectorAll('.cf-pt')].filter(p => !p.closest('[data-legsk]'));
    let W, cowW, k, gateX, startX, endX, x, phase = 0, raf = 0, last = 0, done = false;

    const measure = () => {
      W = stage.clientWidth;
      cowW = cow.getBoundingClientRect().width;
      k = cowW / vb.width;
      gateX = Math.round(W * (W < 720 ? 0.2 : 0.56));
      stage.style.setProperty('--gate-x', gateX + 'px');
      startX = -stage.getBoundingClientRect().left - cowW - 10;
      endX = W - cowW * (W < 720 ? 1 : 1.02);
    };
    const draw = amp => {
      cow.style.transform = `translateX(${x}px)`;
      legs.forEach(l => { const r = `rotate(${(amp * 7 * Math.sin(phase + l.off)).toFixed(2)} ${l.px} ${l.py})`; l.gs.forEach(g => g.setAttribute('transform', r)); });
      body.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(phase)) * 6 * amp).toFixed(2)})`);
      const reveal = (gateX - x) / k + vb.x; // всё, что в координатах коровы правее этой линии, уже прошло камеру
      clip.setAttribute('x', Math.max(0, Math.min(2000, reveal)));
      bodyPts.forEach(p => p.classList.toggle('is-on', Number(p.dataset.lx) >= reveal));
      legs.forEach(l => { const on = l.px >= reveal; l.sk.classList.toggle('is-on', on); l.pts.forEach(p => p.classList.toggle('is-on', on)); });
      stage.classList.toggle('is-scanning', reveal > 49 && reveal < 1407);
    };
    const tick = t => {
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      const v = Math.max(150, W / 4.6);
      const slow = Math.min(1, Math.max(0.15, (endX - x) / (W * 0.12)));
      const step = v * slow * dt;
      x = Math.min(endX, x + step);
      phase += step / (cowW * 0.32) * Math.PI;
      draw(slow);
      if (endX - x < 0.5) {
        let a = slow; // ноги плавно встают
        const settle = () => { a *= 0.8; phase += 0.15; draw(a); if (a > 0.02) raf = requestAnimationFrame(settle); else { draw(0); finish(); } };
        raf = requestAnimationFrame(settle);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => { done = true; stage.classList.remove('is-scanning'); stage.classList.add('is-done'); };
    const run = () => {
      cancelAnimationFrame(raf);
      measure();
      done = false; stage.classList.remove('is-done');
      if (reduceMotion) { x = endX; draw(0); finish(); return; }
      x = startX; phase = 0; last = 0;
      draw(1);
      raf = requestAnimationFrame(tick);
    };

    measure(); x = startX; draw(0);
    cow.addEventListener('click', run);
    window.addEventListener('resize', () => { const was = done; measure(); if (was) { x = endX; draw(0); } });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.5 });
      io.observe(stage);
    } else run();
  }
  
  const fanWrap = document.querySelector('.about .fan-wrap');
  if (fanWrap && !reduceMotion) {
    const order = ['gr', 'gz', 'ip', 'vw'];
    let i = 0, timer = null;
    const hovered = () => fanWrap.querySelector('[data-sheet]:is(:hover, :focus-visible)');
    const step = () => { if (!hovered()) { fanWrap.dataset.auto = order[i]; i = (i + 1) % order.length; } };
    const start = () => { if (!timer) { step(); timer = setInterval(step, 3200); } };
    const stop = () => { clearInterval(timer); timer = null; };
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.4 }).observe(fanWrap);
  }
})();
