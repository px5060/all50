// ===== T50 RAZEM — nakładka wspólna (wstrzykiwana do każdej tabeli) =====
// Nie zmienia silnika ani widoków. Wyłącza tylko: kradzież fokusu z pola RAZEM,
// pytania confirm() przy cofaniu sterowanym z RAZEM i wibrację; API window.T50 dodaje nakładka tabeli.
(function () {
  const _focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function () { if (window.__t50focus) return _focus.apply(this, arguments); };
  const _conf = window.confirm.bind(window);
  window.confirm = function (m) { return window.__t50auto ? true : _conf(m); };
  try { Object.defineProperty(navigator, 'vibrate', { value: function () { return true; }, configurable: true }); } catch (e) {}
})();
window.__t50esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
window.__t50zl = v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toLocaleString('pl-PL')} zł`;
window.__t50auto1 = function (fn) { window.__t50auto = true; try { return fn(); } finally { window.__t50auto = false; } };
window.__t50flash = function (tr) {
  if (!tr) return;
  tr.style.outline = '3px solid #ff6600'; tr.style.outlineOffset = '-3px';
  tr.scrollIntoView({ block: 'center' });
  setTimeout(() => { tr.style.outline = ''; }, 2600);
};

// ===== UT — wspólny widok TABELI (wzór TOP5): Nr · Kod · GRA · Stan/Rola + okno szczegółów =====
// Adapter A (z nakładki aplikacji) podaje tylko etykiety, które silnik tej aplikacji już liczy.
window.UT = (function () {
  const esc = window.__t50esc;
  const css = `
.ut{color:#e8ebf2;font:13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.ut-top{padding:6px 0 0}
.ut-ch{display:flex;gap:4px;overflow-x:auto;padding:6px 0;scrollbar-width:none}
.ut-ch::-webkit-scrollbar{display:none}
.ut-ch button{flex:0 0 auto;padding:6px 9px;border-radius:14px;border:1px solid #323a4d;background:#242a38;color:#e8ebf2;font-weight:700;font-size:13px}
.ut-ch button.on{background:#ff6600;border-color:#ff6600;color:#fff}
.ut-ch button.bn1{border:2px solid #ff6600;color:#ffb27a;box-shadow:0 0 6px #ff660099}
.ut-ch button.bn1.on{border-color:#fff;color:#fff}
.ut-ch button.bn2{border:2px dashed #ff9a4d}
.ut-bn{background:#ff6600;color:#fff;border-radius:8px;padding:5px 9px;margin:0 0 6px;font-size:12.5px;font-weight:700}
.ut tr.hl-step,.ut tr.hl-trig,.ut tr.hl-wait,.ut tr.hl-pre,.ut tr.hl-play,.ut tr.hl-win,.ut tr.hl-loss{outline-offset:-3px}
.ut tr.hl-step{outline:3px solid #ffd34d}.ut tr.hl-step td.nr,.ut tr.hl-step td.c{background:rgba(255,211,77,.18)}
.ut tr.hl-trig{outline:3px solid #4da3ff}.ut tr.hl-trig td.nr,.ut tr.hl-trig td.c{background:rgba(77,163,255,.2)}
.ut tr.hl-wait{outline:2px dashed #9aa3b5}
.ut tr.hl-pre{outline:3px solid #ff6600}.ut tr.hl-pre td.nr,.ut tr.hl-pre td.c{background:rgba(255,102,0,.18)}
.ut tr.hl-play{outline:3px dashed #ff6600}
.ut tr.hl-win{outline:3px solid #5fd38a}.ut tr.hl-win td.nr,.ut tr.hl-win td.c{background:rgba(95,211,138,.2)}
.ut tr.hl-loss{outline:3px solid #ff6666}.ut tr.hl-loss td.nr,.ut tr.hl-loss td.c{background:rgba(255,102,102,.2)}
.ut-hlb{background:#1b1f2a;border:1px solid #323a4d;border-radius:8px;padding:7px 9px;margin:0 0 6px;font-size:12.5px;line-height:1.5}
.ut-hlb .sw{display:inline-block;border-radius:5px;padding:1px 6px;margin:3px 4px 0 0;font-size:11.5px;font-weight:700;color:#12151c}
.ut-hlb .s1{background:#ffd34d}.ut-hlb .s2{background:#4da3ff}.ut-hlb .s3{background:transparent;color:#c9cfdc;border:1px dashed #9aa3b5}.ut-hlb .s4{background:#ff6600;color:#fff}.ut-hlb .s5{background:transparent;color:#ffb27a;border:1px dashed #ff6600}.ut-hlb .s6{background:#5fd38a}.ut-hlb .s7{background:#ff6666;color:#fff}
.ut-hlb .bt{display:flex;gap:6px;margin-top:6px}.ut-hlb .bt button{flex:1;padding:6px;border-radius:8px;border:1px solid #323a4d;background:#242a38;color:#e8ebf2;font-weight:600;font-size:12px}
.ut-hlb .hm{color:#8b93a7;font-size:11px}
.ut-pop .stt{margin-top:4px}.ut-pop .stt td:last-child{text-align:right!important;font-weight:700!important}
.ut-tool{display:flex;gap:5px;flex-wrap:wrap;padding:0 0 6px}
.ut-tool button{padding:5px 9px;border-radius:12px;border:1px solid #323a4d;background:#1b1f2a;color:#c9cfdc;font-size:12px;font-weight:600}
.ut-tool button.on{background:#2e75b6;border-color:#2e75b6;color:#fff}
.ut-desc{color:#8b93a7;font-size:12px;margin:0 0 6px}
.ut-win{display:inline-block;background:#00B050;color:#fff;font-weight:800;border-radius:6px;padding:1px 7px;margin-right:6px}
.ut-tw{overflow:auto;border:1px solid #323a4d;border-radius:8px;background:#12151c;-webkit-overflow-scrolling:touch}
.ut table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:12px}
.ut th,.ut td{padding:4px 5px;border-bottom:1px solid #2a3142;text-align:left;vertical-align:top}
.ut th{position:sticky;top:0;background:#242a38;color:#8b93a7;font-weight:600;z-index:1}
.ut td.nr{color:#8b93a7;font-variant-numeric:tabular-nums;font-size:11.5px}
.ut td.c{font-weight:700;font-variant-numeric:tabular-nums;color:#fff}
.ut td.c.hit{color:#7ee2a0}
.ut td.g,.ut td.s{white-space:normal;overflow-wrap:anywhere}
.ut td.g{font-weight:700}
.ut .cl{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.ut .sub{display:block;font-size:10.5px;opacity:.8;font-weight:500;margin-top:1px}
.ut .more{float:right;font-size:10px;opacity:.75;margin-left:3px}
.ut tr.ghost td{opacity:.82;border-bottom:1px dashed #555}
.ut tr.ghost td.c{color:#8b93a7}
.ut tr.new td.nr{box-shadow:inset 3px 0 #e8b25c}
.ut tr.fx,.ut tr.sel{outline:3px solid #ff6600;outline-offset:-3px}
.ut tr.sel+tr.gr.sel{outline:none}
.ut td.mi{text-align:center;font-weight:700;padding:4px 1px}
.ut tr.gr td{padding:1px 4px 5px;border-bottom:1px solid #3a4358}
.ut .gc{display:inline-block;white-space:nowrap;padding:1px 5px;border-radius:4px;margin:1px 2px 1px 0;font-size:11px;font-weight:700}
.ut-more{width:100%;padding:8px;border:0;border-bottom:1px solid #323a4d;background:#1b1f2a;color:#9fc4ff;font-weight:600}
.ut-leg{font-size:11.5px;color:#8b93a7;line-height:1.7;padding:2px 0 6px}
.ut-leg span{display:inline-block;padding:0 5px;border-radius:4px;margin-right:3px}
.ut-pop{position:fixed;inset:0;z-index:200;background:#000a;display:flex;align-items:flex-end}
.ut-pop .sh{width:100%;max-height:78vh;overflow:auto;background:#1b1f2a;border-top:2px solid #ff6600;border-radius:14px 14px 0 0;padding:12px 14px 22px;color:#e8ebf2;font:14px/1.4 system-ui,sans-serif}
.ut-pop h3{margin:0 0 4px;font-size:16px}
.ut-pop .hs{color:#8b93a7;font-size:12px;margin-bottom:8px}
.ut-pop .x{float:right;background:#242a38;border:1px solid #323a4d;color:#e8ebf2;border-radius:8px;padding:4px 10px;font-size:15px}
.ut-pop .bl{border-radius:8px;padding:7px 9px;margin:5px 0;font-weight:600}
.ut-pop .lb{font-size:11px;color:#8b93a7;margin:8px 0 2px;letter-spacing:.4px;text-transform:uppercase}
.ut-pop table{width:100%;border-collapse:collapse;font-size:13px}
.ut-pop table,.ut-pop td{background:transparent!important;border:0!important;text-align:left!important;font:13px/1.4 system-ui,sans-serif!important;color:#e8ebf2!important}.ut-pop td{padding:4px 2px!important;border-bottom:1px solid #323a4d!important}.ut-pop td:first-child{color:#8b93a7!important;width:38%}
.ut th{text-transform:none!important;letter-spacing:0!important;font-size:12px!important}
.ut-pop .mh{font-weight:800;margin-top:10px}
.ut-pop .go{margin-top:12px;width:100%;padding:10px;border-radius:9px;border:0;background:#ff6600;color:#fff;font-weight:700;font-size:14px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const NEU = 'background:#F4F5F7;color:#9aa0ad';
  const CC = { step: 'color:#5AB0FF;font-weight:800', trig: 'color:#FF4D4D;font-weight:800', win: 'color:#3DDC84;font-weight:800' };
  window.UT_CC = CC;   // wiersz bez zdarzenia — jasne pole zamiast czarnego
  const S = { sel: null, limit: 80, onlyEv: false, leg: false, focus: null };
  let A = null, host = null;

  function rowsRange(N, last) {
    const from = Math.max(0, N - S.limit);
    const out = [];
    for (let i = from; i <= last; i++) out.push(i);
    return { from, rows: out };
  }
  function cellHtml(cls, x, extra) {
    if (!x) return `<td class="${cls}"></td>`;
    const many = x.full && x.full.length > 1 ? `<span class="more">+${x.full.length - 1}</span>` : '';
    return `<td class="${cls}" style="${x.css || ''}">${many}<span class="cl">${esc(x.t)}</span>${x.sub ? `<span class="sub">${esc(x.sub)}</span>` : ''}${extra || ''}</td>`;
  }
  // modele grające na następnym wierszu — z linii GRA tej tabeli (window.T60/T50.lines(): p1 pewna, p2 w toku)
  function betNow(models) {
    let items = [];
    try { const W = window.T60 || window.T50; items = [].concat(...W.lines().sections.map(s => s.items)); } catch (e) {}
    return models.map(m => {
      let best = 9;
      items.forEach(it => { const id = String(it.id); if (id === m.id || id.endsWith('·' + m.id)) best = Math.min(best, it.p); });
      return best === 1 ? 1 : best === 2 ? 2 : 0;
    });
  }
  function render(h, adapter) {
    A = adapter; host = h;
    try { const MN = window.parent && window.parent.T50_MASTER_N; if (MN) A.isNew = i => i >= MN; } catch (e) {}
    const N = A.N(), models = A.models();
    if (S.sel == null || (S.sel !== 'ALL' && !models.some(m => m.id === S.sel))) S.sel = A.defSel ? A.defSel() : 'ALL';
    const isAll = S.sel === 'ALL';
    const mi = isAll ? -1 : models.findIndex(m => m.id === S.sel);
    let last = N - 1;
    if (isAll) models.forEach((m, k) => { last = Math.max(last, A.last(k)); }); else last = Math.max(last, A.last(mi));
    let { from, rows } = rowsRange(N, last);
    if (S.onlyEv) rows = rows.filter(i => i >= N || (isAll ? models.some((m, k) => A.ev(k, i)) : A.ev(mi, i)));
    let x = `<div class="ut"><div class="ut-top">${A.top ? A.top() : ''}</div>`;
    // ▼ = model gra na NASTĘPNYM wierszu (z GRA tej tabeli: linia p1); ▷ = gra w toku (p2)
    const BN = betNow(models), bnIds = models.filter((m, k) => BN[k] === 1).map(m => m.id);
    x += `<div class="ut-ch">${['ALL', ...models.map(m => m.id)].map((id, k) => { const b = k ? BN[k - 1] : (bnIds.length ? 1 : 0); return `<button data-m="${esc(id)}" class="${S.sel === id ? 'on' : ''}${b ? ' bn' + b : ''}">${b === 1 ? '▼ ' : b === 2 ? '▷ ' : ''}${id === 'ALL' ? 'WSZ' : esc(id)}</button>`; }).join('')}</div>`;
    if (bnIds.length) x += `<div class="ut-bn">▼ GRA na następnym wierszu Nr ${(N + 1).toLocaleString('pl-PL')}: <b>${bnIds.map(esc).join(' · ')}</b></div>`;
    x += `<div class="ut-tool"><button id="utEv" class="${S.onlyEv ? 'on' : ''}">tylko zdarzenia</button>${A.tools ? A.tools() : ''}<button id="utEnd">↓ koniec</button><button id="utLeg" class="${S.leg ? 'on' : ''}">legenda ${S.leg ? '▴' : '▾'}</button></div>`;
    if (S.leg) x += `<div class="ut-leg">${A.legend()}<br><b>Kod</b> (widok modelu): <span style="${CC.step}">STEP</span><span style="${CC.trig}">TRIGGER</span><span style="${CC.win}">WIN</span> — kod, który w tym modelu tworzy step, trigger albo wygrany zakład. Tapnij wiersz → pełny opis.</div>`;
    if (A.win) x += `<div class="ut-desc"><span class="ut-win">WIN = ${esc(A.win(isAll ? 0 : mi))}</span>${!isAll && A.desc ? A.desc(mi) : ''}</div>`;
    else if (!isAll && A.desc) x += `<div class="ut-desc">${A.desc(mi)}</div>`;
    if (!isAll) x += `<div class="ut-hlb" id="utHl" hidden></div><div class="ut-desc" style="margin-top:-2px">dotknij wiersz zakładu → łańcuch STEP · TRIGGER · GRA · przytrzymaj wiersz → statystyki modelu</div>`;
    x += `<div class="ut-tw" id="utTw">`;
    if (from > 0) x += `<button class="ut-more" id="utMore">▲ Pokaż +200 wcześniejszych (ukrytych ${from})</button>`;
    if (isAll) {
      x += `<table><colgroup><col style="width:52px"><col style="width:38px">${models.map(() => '<col>').join('')}</colgroup><thead><tr><th>Nr</th><th>Kod</th>${models.map((m, k) => BN[k] === 1 ? `<th style="text-align:center;padding:4px 1px;background:#ff6600;color:#fff">▼${esc(m.id)}</th>` : `<th style="text-align:center;padding:4px 1px">${esc(m.id)}</th>`).join('')}</tr></thead><tbody>`;
      for (const i of rows) {
        const g = i >= N;
        let cells = '', chips = [];
        models.forEach((m, k) => {
          const t = A.tag(k, i);
          cells += t ? `<td class="mi" style="${t.css || ''}">${esc(t.t)}</td>` : '<td class="mi"></td>';
          const ch = A.chip ? A.chip(k, i) : null;
          if (ch) chips.push(`<span class="gc" style="${ch.css || ''}">${esc(m.id)} ${esc(ch.t)}</span>`);
        });
        x += `<tr data-i="${i}" class="${g ? 'ghost' : ''}${A.isNew && A.isNew(i) ? ' new' : ''}"><td class="nr">${i + 1}</td><td class="c">${g ? (i === N ? 'nast.' : '…') : A.code(i)}</td>${cells}</tr>`;
        if (chips.length) x += `<tr data-i="${i}" class="gr${g ? ' ghost' : ''}"><td></td><td colspan="${models.length + 1}">${chips.join('')}</td></tr>`;
      }
    } else {
      x += `<table><colgroup><col style="width:52px"><col style="width:38px"><col style="width:46%"><col></colgroup><thead><tr><th>Nr</th><th>Kod</th><th>GRA</th><th>Stan / Rola</th></tr></thead><tbody>`;
      for (const i of rows) {
        const g = i >= N, c = A.cell(mi, i) || {};
        const stan = c.stan || (g ? { t: i === N ? 'następny kod' : 'przyszły kod', css: 'color:#8b93a7' } : { t: '—', css: NEU });
        const gra = c.gra;
        const cr = !g && A.codeRole ? A.codeRole(mi, i) : null;
        x += `<tr data-i="${i}" class="${g ? 'ghost' : ''}${A.isNew && A.isNew(i) ? ' new' : ''}"><td class="nr">${i + 1}</td><td class="c" style="${cr ? CC[cr] : ''}">${g ? (i === N ? 'nast.' : '…') : A.code(i)}</td>${cellHtml('g', gra)}${cellHtml('s', stan)}</tr>`;
      }
    }
    x += `</tbody></table></div></div>`;
    h.innerHTML = x;
    if (A.bindTop) A.bindTop(h);
    h.querySelectorAll('.ut-ch button').forEach(b => b.onclick = () => { S.sel = b.dataset.m; S.limit = 80; S.focus = null; if (A.onSel) A.onSel(S.sel); render(host, A); });
    h.querySelector('#utEv').onclick = () => { S.onlyEv = !S.onlyEv; render(host, A); };
    h.querySelector('#utLeg').onclick = () => { S.leg = !S.leg; render(host, A); };
    h.querySelector('#utEnd').onclick = () => { S.focus = null; S.limit = 80; render(host, A); };
    if (A.bindTools) A.bindTools(h);
    const tw = h.querySelector('#utTw');
    const mb = h.querySelector('#utMore');
    if (mb) mb.onclick = () => { const fb = tw.scrollHeight - tw.scrollTop; S.limit += 200; S.keep = fb; render(host, A); };
    const mark = i => { S.selRow = i; tw.querySelectorAll('tbody tr.sel').forEach(t => t.classList.remove('sel')); tw.querySelectorAll(`tbody tr[data-i="${i}"]`).forEach(t => t.classList.add('sel')); };
    if (S.selRow != null) mark(S.selRow);
    // dotknięcie: widok modelu → łańcuch zakładu (STEP · TRIGGER · czekanie · następny · GRA), WSZ → okno wiersza;
    // przytrzymanie wiersza (albo prawy klik) → STATYSTYKI modelu
    tw.querySelectorAll('tbody tr').forEach(tr => {
      const i = +tr.dataset.i; let t = null, lp = false, x0 = 0, y0 = 0;
      const cancel = () => { clearTimeout(t); t = null; };
      const hold = () => { lp = true; if (!isAll && A.stats) statsPop(mi, i); else popup(i); };
      tr.addEventListener('pointerdown', e => { lp = false; x0 = e.clientX; y0 = e.clientY; cancel(); t = setTimeout(hold, 550); });
      tr.addEventListener('pointermove', e => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancel(); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => tr.addEventListener(ev, cancel));
      tr.addEventListener('contextmenu', e => { e.preventDefault(); cancel(); hold(); });
      tr.onclick = () => {
        if (lp) { lp = false; return; }
        if (isAll) { mark(i); popup(i); return; }
        if (S.hl && S.hl.sel === S.sel && /\bhl-/.test(tr.className)) { S.hl = null; applyHl(h, mi); return; }   // ponowne dotknięcie zamyka
        const ch = chainAt(mi, i);
        if (ch) {
          S.hl = { sel: S.sel, i };
          // łańcuch zaczyna się nad widocznymi wierszami → dociągnij je i zostań przy dotkniętym wierszu
          const lo = Math.min(...['step', 'trig', 'wait', 'pre', 'play', 'win', 'loss'].map(k => ch[k].length ? Math.min(...ch[k]) : Infinity));
          if (lo < from) { S.limit = A.N() - lo + 5; S.focus = i; render(host, A); } else applyHl(h, mi);
        }
        else { mark(i); popup(i); }
      };
    });
    if (!isAll) applyHl(h, mi);
    // tabela wypełnia ekran do dolnego paska; przewija się tylko tabela (nagłówek kolumn zostaje)
    const fit = () => {
      const top = tw.getBoundingClientRect().top;
      tw.style.height = Math.max(220, window.innerHeight - top - (A.bottomH ? A.bottomH() : 0) - 6) + 'px';
    };
    window.scrollTo(0, 0); fit();
    requestAnimationFrame(() => {
      fit();
      if (S.keep != null) { tw.scrollTop = tw.scrollHeight - S.keep; S.keep = null; return; }
      const fr = S.focus != null ? tw.querySelector(`tbody tr[data-i="${S.focus}"]`) : null;
      if (fr) { tw.scrollTop = Math.max(0, fr.offsetTop - tw.clientHeight / 3); fr.classList.add('fx'); setTimeout(() => fr.classList.remove('fx'), 2600); S.focus = null; }
      else tw.scrollTop = tw.scrollHeight;
    });
  }
  // otwarcie modelu z innego ekranu (tapnięcie w GRA): model + wiersz do pokazania
  function open(id, focusI) { S.sel = id; S.focus = focusI == null ? null : focusI; S.limit = Math.max(80, (A ? A.N() : window.T50 ? window.T50.count() : 0) - (focusI == null ? 0 : focusI) + 40); }

  // ---- łańcuch zakładu: adapter A.chain(mi, i) (silniki STEP → TRIGGER → zakład) albo okno po numerze triggera w etykietach ----
  const KEYRE = /(?:\[T:|okno T:|TRIG#|TRIGGER #|trig#)(\d+)/g;
  function segs(mi, i) {
    const c = A.cell(mi, i) || {}, out = [];
    [c.gra].forEach(x => { if (!x) return; (x.full && x.full.length ? x.full : String(x.t).split(' | ')).forEach(t => out.push(`${t} ${x.sub || ''}`)); });   // rodzaj tylko z kolumny GRA
    return out;
  }
  function kindOf(t) {
    if (/IGNORED/.test(t)) return null;
    if (/pudło|bez rozstrzygnięcia|czekamy na|\(STEP\)|✗ · ▼/.test(t)) return 'play';   // krok gry bez wygranej — gra trwa dalej
    if (/▶|TRIGGER|TRIG#|\(trigger\)/.test(t)) return 'trig';
    if (/✓|→ WIN|WIN K=|WIN \+/.test(t)) return 'win';
    if (/LOSS|BUST|przegran/.test(t)) return 'loss';
    if (/START/.test(t)) return 'pre';
    if (/▼|następny wiersz|nast\. wiersz/.test(t)) return 'pre';
    if (/krok gry|Krok Gry|stawka|GRA /i.test(t)) return 'play';
    return 'wait';
  }
  const KR = { win: 0, loss: 0, play: 1, pre: 2, trig: 3, wait: 4 };
  function keysAt(mi, i) {
    // numer triggera z etykiet (albo ze szczegółów wiersza, jak w PIKOFF); rodzaj zdarzenia tylko z etykiet GRA / Stan
    const out = [], rowKeys = new Set(), free = [], c = A.cell(mi, i) || {};
    const keysIn = t => { const r = []; let m; KEYRE.lastIndex = 0; while ((m = KEYRE.exec(t))) r.push(m[1]); return r; };
    segs(mi, i).forEach(t => { const k = kindOf(t), ks = keysIn(t); ks.forEach(x => rowKeys.add(x)); if (!k) return; if (ks.length) ks.forEach(x => out.push({ key: x, kind: k })); else free.push(k); });
    (c.det || []).forEach(d => keysIn(String(d[1])).forEach(x => rowKeys.add(x)));
    if (rowKeys.size === 1 && free.length) { const key = [...rowKeys][0]; free.forEach(k => out.push({ key, kind: k })); }
    return out;
  }
  function chainAt(mi, i) {
    if (A.chain) {
      const c = A.chain(mi, i); if (!c) return null;
      const out = { step: c.step || [], trig: c.trig || [], wait: [], pre: [], play: c.play || [], win: [], loss: [] };
      const lt = Math.max(...out.trig, -1);
      for (let j = lt + 1; j < c.betI - 1; j++) out.wait.push(j);
      if (c.betI - 1 > lt) out.pre.push(c.betI - 1);
      (c.res === 'win' ? out.win : c.res ? out.loss : out.pre).push(c.betI);
      const N = A.N(), res = c.res === 'win' ? 'WIN' : c.res === 'bust' ? 'BUST' : c.res ? 'przegrana' : null;
      out.title = res ? `Zakład Nr ${c.betI + 1}${c.k ? ` · K${c.k}` : ''} → ${res}` : `Gra w toku → zakład na Nr ${c.betI + 1}${c.k ? ` · K${c.k}` : ''}${c.betI === N ? ' (NASTĘPNY WIERSZ)' : ''}`;
      return out;
    }
    const ks = keysAt(mi, i); if (!ks.length) return null;
    ks.sort((a, b) => KR[a.kind] - KR[b.kind]);
    const key = ks[0].key, out = { step: [], trig: [], wait: [], pre: [], play: [], win: [], loss: [] };
    const N = A.N(), hi = Math.min(Math.max(N - 1, A.last(mi)), i + 2500);
    for (let j = Math.max(0, i - 2500); j <= hi; j++) {
      let best = null;
      keysAt(mi, j).forEach(x => { if (x.key === key && (!best || KR[x.kind] < KR[best])) best = x.kind; });
      if (best) out[best].push(j);
    }
    const res = out.win.length ? 'WIN' : out.loss.length ? 'LOSS / BUST' : null;
    out.title = `Okno trig#${key}${res ? ` → ${res}` : ' · w toku'}`;
    return out;
  }
  const rngTxt = a => { if (!a.length) return ''; const s = a.slice().sort((x, y) => x - y); return s.length === 1 ? `Nr ${s[0] + 1}` : `Nr ${s[0] + 1}–${s[s.length - 1] + 1}${s.length > 2 && s[s.length - 1] - s[0] + 1 !== s.length ? ` (${s.length})` : ''}`; };
  function applyHl(h, mi) {
    const tw = h.querySelector('#utTw'), box = h.querySelector('#utHl'); if (!tw || !box) return;
    tw.querySelectorAll('tbody tr').forEach(r => r.classList.remove('hl-step', 'hl-trig', 'hl-wait', 'hl-pre', 'hl-play', 'hl-win', 'hl-loss'));
    const c = S.hl && S.hl.sel === S.sel ? chainAt(mi, S.hl.i) : null;
    if (!c) { box.hidden = true; box.innerHTML = ''; return; }
    const add = (arr, cl) => arr.forEach(j => tw.querySelectorAll(`tbody tr[data-i="${j}"]`).forEach(r => r.classList.add(cl)));
    add(c.wait, 'hl-wait'); add(c.step, 'hl-step'); add(c.trig, 'hl-trig'); add(c.play, 'hl-play'); add(c.pre, 'hl-pre'); add(c.win, 'hl-win'); add(c.loss, 'hl-loss');
    const chip = (a, cl, t) => a.length ? `<span class="sw ${cl}">${t} ${rngTxt(a)}</span>` : '';
    box.innerHTML = `<b>${esc(c.title)}</b><div>${chip(c.step, 's1', 'STEP')}${chip(c.trig, 's2', 'TRIGGER')}${chip(c.wait, 's3', 'czekanie')}${chip(c.pre, 's4', '▶ następny / START')}${chip(c.play, 's5', 'GRA')}${chip(c.win, 's6', 'WIN')}${chip(c.loss, 's7', 'przegrana')}</div>
      <div class="bt"><button id="utHlRow">Szczegóły wiersza Nr ${S.hl.i + 1}</button><button id="utHlSt">Statystyki</button><button id="utHlX">✕ Zamknij</button></div><div class="hm">dotknij obramowany wiersz, żeby zamknąć</div>`;
    box.hidden = false;
    box.querySelector('#utHlRow').onclick = () => popup(S.hl.i);
    box.querySelector('#utHlSt').onclick = () => { if (A.stats) statsPop(mi); };
    box.querySelector('#utHlX').onclick = () => { S.hl = null; applyHl(h, mi); };
  }
  // ---- STATYSTYKI modelu (przytrzymanie wiersza) ----
  function statsPop(mi, ri) {
    const models = A.models(), id = models[mi] ? models[mi].id : '', rows = A.stats ? A.stats(mi) || [] : [];
    // przytrzymany wiersz: wszystkie jego etykiety (GRA + Stan/Rola) nad statystykami
    let lab = '';
    if (ri != null && ri < A.N()) {
      const c = A.cell(mi, ri) || {}, bl = x => (x.full && x.full.length ? x.full : String(x.t).split(' | ')).map(t => `<div class="bl" style="${x.css || ''}">${esc(t)}</div>`).join('') + (x.sub ? `<div class="hs">${esc(x.sub)}</div>` : '');
      if (c.gra || c.stan) lab = `<div class="hs" style="margin-top:6px;font-weight:700;color:#ffb27a">ETYKIETY WIERSZA Nr ${ri + 1} · ${esc(A.code(ri))}</div>${c.gra ? bl(c.gra) : ''}${c.stan ? bl(c.stan) : ''}<div class="hs" style="margin-top:10px;font-weight:700;color:#ffb27a">STATYSTYKI MODELU</div>`;
    }
    const p = document.createElement('div'); p.className = 'ut-pop';
    p.innerHTML = `<div class="sh"><button class="x">✕</button><h3>${lab ? '' : 'Statystyki · '}${esc(id)}</h3><div class="hs">${A.descTxt ? esc(A.descTxt(mi)) : ''}${A.win ? ` · WIN = ${esc(A.win(mi))}` : ''}</div>${lab}
      <table class="stt">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><button class="go" id="utStX">✕ Zamknij</button></div>`;
    p.onclick = e => { if (e.target === p || e.target.classList.contains('x') || e.target.id === 'utStX') p.remove(); };
    document.body.appendChild(p);
  }

  function popup(i) {
    const N = A.N(), models = A.models(), isAll = S.sel === 'ALL', g = i >= N;
    const blk = x => x ? (x.full && x.full.length ? x.full : [x.t]).map(t => `<div class="bl" style="${x.css || ''}">${esc(t)}</div>`).join('') + (x.sub ? `<div class="hs">${esc(x.sub)}</div>` : '') : '<div class="hs">—</div>';
    const det = d => d && d.length ? `<table>${d.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : '';
    let b = `<button class="x">✕</button><h3>Nr ${i + 1} · ${g ? (i === N ? 'następny kod' : 'przyszły kod') : `kod <b>${A.code(i)}</b>`}</h3>`;
    const others = skip => {
      let o = '', n = 0;
      models.forEach((m, k) => {
        if (k === skip || !A.ev(k, i)) return;
        const c = A.cell(k, i) || {};
        n++; o += `<div class="mh">${esc(m.id)}</div>${c.gra ? blk(c.gra) : (c.stan ? blk(c.stan) : '')}`;
      });
      return { o, n };
    };
    if (!isAll) {
      const mi = models.findIndex(m => m.id === S.sel), c = A.cell(mi, i) || {};
      b += `<div class="hs">${esc(S.sel)}${A.descTxt ? ' · ' + esc(A.descTxt(mi)) : ''}</div>`;
      b += `<div class="lb">GRA</div>${blk(c.gra)}<div class="lb">Stan / Rola</div>${blk(c.stan || (g ? { t: i === N ? 'następny kod — jeszcze nie wpisany' : 'przyszły kod — jeszcze nie wpisany', css: 'color:#8b93a7' } : null))}`;
      if (c.det && c.det.length) b += `<div class="lb">Szczegóły</div>${det(c.det)}`;
    } else {
      if (A.rowInfo) b += det(A.rowInfo(i));
      const ot = others(-1);
      b += `<div class="lb">Zdarzenia na tym wierszu (${ot.n})</div>${ot.n ? ot.o : '<div class="hs">brak zdarzeń</div>'}`;
    }
    if (isAll) b += '';
    const p = document.createElement('div'); p.className = 'ut-pop';
    p.innerHTML = `<div class="sh">${b}</div>`;
    p.onclick = e => { if (e.target === p || e.target.classList.contains('x')) p.remove(); };
    document.body.appendChild(p);
  }
  return { render, open, S, popup, statsPop };
})();

// ===== UG — wspólny ekran GRA (wzór PIKOFF): baner + karta na model + okno ze wszystkimi etykietami =====
// cfg = { N, top?, bindTop?, note?, idleSub?, sections:[{name?, cards:[{id, rule, lines:[{p,txt,sub,er?}], meta:[l,r], go(er?)}]}], last:[kody] }
// p: 1 GRA pewna · 2 GRA warunkowa / w toku · 3 trigger jeśli wpadnie · 4 gra za n / start · 5 inne zdarzenie · 6 brak
window.UG = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = `
.ug{color:#e8ebf2;font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.ug-ban{border-radius:10px;padding:9px 12px;margin-bottom:8px;font-weight:700}
.ug-ban.bet{background:#ff6600;color:#fff}.ug-ban.idle{background:#242a38;color:#e8ebf2;font-weight:500}
.ug-ban .big{font-size:16px}.ug-ban .sub{font-weight:500;font-size:12px;margin-top:3px;opacity:.95}
.ug-note{background:#1b1f2a;border:1px solid #323a4d;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:12.5px;color:#c9cfdc}
.ug-note b{color:#e8ebf2}
.ug-sec{background:#1b1f2a;border:1px solid #323a4d;border-radius:10px;padding:8px;margin-bottom:10px}
.ug-sh{display:flex;justify-content:space-between;align-items:baseline;margin:0 2px 6px;font-size:13px}
.ug-sh b{font-size:14px}.ug-sh .g{font-weight:800;color:#ff9a4d}.ug-sh .m{color:#8b93a7;font-size:12px}
.ug-mc{border-left:5px solid #323a4d;background:#242a38;border-radius:8px;padding:7px 9px;margin-bottom:6px;cursor:pointer}
.ug-mc{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:pan-y}.ug-mc.hold{filter:brightness(1.3);transition:filter .45s}
.ug-hint{color:#8b93a7;font-size:11px;margin:-2px 2px 6px}
.ug-lb{font-size:11px;color:#8b93a7;margin:10px 0 3px;letter-spacing:.4px;text-transform:uppercase}
.ug-stt{width:100%;border-collapse:collapse;font-size:13px}.ug-stt td{padding:4px 2px;border-bottom:1px solid #323a4d}.ug-stt td:first-child{color:#8b93a7;width:55%}.ug-stt td:last-child{text-align:right;font-weight:700}
.ug-none{background:#1b1f2a;border:1px solid #323a4d;border-radius:10px;padding:10px 12px;margin-bottom:8px;color:#8b93a7;font-size:13px}
.ug-wt{display:block;width:100%;margin:2px 0 10px;padding:11px 12px;border-radius:10px;border:1px dashed #3a4358;background:#1b1f2a;color:#9fc4ff;font-weight:700;font-size:13.5px;text-align:left}
.ug-wl .ug-sec{opacity:.9}
.ug-mc.b1{border-left-color:#ff6600}.ug-mc.b2{border-left-color:#ff9a4d}.ug-mc.b3{border-left-color:#2e75b6}.ug-mc.b4{border-left-color:#7030a0}
.ug-mc .h{display:flex;justify-content:space-between;gap:6px;align-items:baseline}
.ug-mc .id{font-weight:800;font-size:15px;white-space:nowrap}
.ug-mc .rule{color:#8b93a7;font-size:11.5px;text-align:right}
.ug-mc .go{color:#ff9a4d;font-size:11px;margin-left:6px;font-weight:700;white-space:nowrap;padding:2px 0 2px 6px}
.ug-st{margin-top:5px;padding:6px 8px;border-radius:7px;font-weight:700;font-size:13px}
.ug-st .s{display:block;font-weight:500;font-size:11.5px;opacity:.85;margin-top:1px}
.ug-st.p1{background:#ff6600;color:#fff;box-shadow:0 0 0 2px #fff inset;font-size:14px}
.ug-st.p2{background:rgba(255,102,0,.18);color:#ffcfa8;border:1.5px dashed #ff6600}
.ug-st.p3{background:#DEEBF7;color:#1F4E78}
.ug-st.p4{background:#7030A0;color:#fff}
.ug-st.p5{background:#1b1f2a;color:#ffc896;font-weight:600}
.ug-st.p6{background:#1b1f2a;color:#8b93a7;font-weight:500}
.ug-mc .more{margin-top:4px;font-size:11.5px;color:#9fc4ff;font-weight:600}
.ug-mc .meta{margin-top:5px;color:#8b93a7;font-size:12px;display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap}
.ug-mc .meta .pos{color:#5fd38a;font-weight:700}.ug-mc .meta .neg{color:#ff8a8a;font-weight:700}
.ug-last{display:flex;gap:5px;flex-wrap:wrap;margin:6px 2px 10px;color:#8b93a7;font-size:12px;align-items:center}
.ug-last b{color:#e8ebf2;background:#242a38;border-radius:5px;padding:2px 6px;font-variant-numeric:tabular-nums}
.ug-pop{position:fixed;inset:0;z-index:300;background:#000a;display:flex;align-items:flex-end}
.ug-pop .sh{width:100%;max-height:80vh;overflow:auto;background:#1b1f2a;border-top:2px solid #ff6600;border-radius:14px 14px 0 0;padding:12px 14px 22px;color:#e8ebf2;font:14px/1.4 system-ui,sans-serif}
.ug-pop h3{margin:0 0 2px;font-size:17px}.ug-pop .hs{color:#8b93a7;font-size:12px;margin-bottom:8px}
.ug-pop .x{float:right;background:#242a38;border:1px solid #323a4d;color:#e8ebf2;border-radius:8px;padding:4px 10px;font-size:15px}
.ug-pop .ug-st{cursor:default}.ug-pop .ug-st.j{cursor:pointer}
.ug-pop .ug-st .jr{float:right;font-size:11px;opacity:.85}
.ug-pop .meta{color:#8b93a7;font-size:12.5px;margin-top:10px;display:flex;justify-content:space-between}
.ug-pop .gobtn{margin-top:12px;width:100%;padding:11px;border-radius:9px;border:0;background:#ff6600;color:#fff;font-weight:700;font-size:15px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const lineHtml = (l, pop) => `<div class="ug-st p${l.p}${pop && l.er ? ' j' : ''}"${l.er ? ` data-er="${l.er}"` : ''}>${pop && l.er ? `<span class="jr">Nr ${l.er} ›</span>` : ''}${esc(l.txt)}${l.sub ? `<span class="s">${esc(l.sub)}</span>` : ''}</div>`;
  const metaHtml = m => m ? `<div class="meta"><span>${esc(m[0])}</span><span class="${/^\+/.test(m[1]) ? 'pos' : /^[−-]/.test(m[1]) ? 'neg' : ''}">${esc(m[1])}</span></div>` : '';

  // przytrzymanie karty → STATYSTYKI modelu (jak SZUKAJ / BUST) + wszystkie etykiety
  function statsHtml(c) {
    let rows = [];
    try { rows = c.stats ? c.stats() || [] : []; } catch (e) {}
    return rows.length ? `<div class="ug-lb">Statystyki modelu</div><table class="ug-stt">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : '';
  }
  function popup(c) {
    const p = document.createElement('div'); p.className = 'ug-pop';
    p.innerHTML = `<div class="sh"><button class="x">✕</button><h3>${esc(c.id)}</h3><div class="hs">${esc(c.rule || '')}</div>${statsHtml(c)}
      <div class="ug-lb">Etykiety teraz</div>${c.lines.map(l => lineHtml(l, true)).join('')}${metaHtml(c.meta)}<button class="gobtn">› TABELA ${esc(c.id)}</button></div>`;
    p.onclick = e => { if (e.target === p || e.target.classList.contains('x')) p.remove(); };
    p.querySelector('.gobtn').onclick = () => { p.remove(); c.go(); };
    p.querySelectorAll('.ug-st.j').forEach(el => el.onclick = () => { p.remove(); c.go(+el.dataset.er); });
    document.body.appendChild(p);
  }

  // kolejność: w karcie linie wg pilności; karty i sekcje — najpierw GRA na następnym wierszu
  const topP = c => Math.min(...c.lines.map(l => l.p));
  function order(sections) {
    sections.forEach(s => {
      s.cards.forEach(c => { c.lines = c.lines.map((l, i) => [l, i]).sort((a, b) => a[0].p - b[0].p || a[1] - b[1]).map(x => x[0]); });
      s.cards = s.cards.map((c, i) => [c, i]).sort((a, b) => topP(a[0]) - topP(b[0]) || a[1] - b[1]).map(x => x[0]);
    });
    return sections.map((s, i) => [s, i]).sort((a, b) => {
      const pa = a[0].cards.length ? topP(a[0].cards[0]) : 9, pb = b[0].cards.length ? topP(b[0].cards[0]) : 9;
      return (pa === 1 ? 0 : 1) - (pb === 1 ? 0 : 1) || a[1] - b[1];
    }).map(x => x[0]);
  }
  let wOpen = false;   // „Modele oczekujące” rozwinięte / zwinięte (pamiętane między odświeżeniami)
  function render(host, cfg) {
    cfg.sections = order(cfg.sections);
    const all = [].concat(...cfg.sections.map(s => s.cards));
    const bets = [];
    all.forEach(c => c.lines.forEach(l => { if (l.p === 1) bets.push({ id: c.id, l }); }));
    const sum = bets.reduce((a, b) => a + (b.l.stake || 0), 0);
    const cond = all.filter(c => c.lines.some(l => l.p === 2)).length;
    const NX = cfg.N + 1, fmt = n => n.toLocaleString('pl-PL');
    let h = `<div class="ug">${cfg.top || ''}`;
    h += bets.length
      ? `<div class="ug-ban bet"><div class="big">▼ NASTĘPNY WIERSZ Nr ${fmt(NX)} = GRA</div><div class="sub">${bets.length} × · razem ${fmt(sum)} zł · ${bets.map(b => esc(b.id)).join(' · ')}</div></div>`
      : `<div class="ug-ban idle"><div><b>Bez gry na Nr ${fmt(NX)}</b>${cond ? ` · gra w toku: ${cond}` : ''}</div>${cfg.idleSub ? `<div class="sub">${esc(cfg.idleSub)}</div>` : ''}</div>`;
    if (cfg.note) h += `<div class="ug-note">${cfg.note}</div>`;
    h += `<div class="ug-hint">Tapnij kartę → tabela modelu · przytrzymaj → statystyki modelu</div>`;
    // tylko okna po START: gra na następnym wierszu (p1), gra w toku (p2, p4 bez „START”, BUST czeka na zamknięcie, act);
    // modele bez triggera i okna przed START (przygotowanie, ★ START za 1) → zwinięta lista „Modele oczekujące” pod spodem
    // linia okna po START; karta grająca pokazuje tylko takie linie, jej okna przed START idą do „Modele oczekujące”
    const lA = l => l.p === 1 || l.p === 2 || l.act || (l.p === 4 && !/START/.test(l.txt)) || (l.p === 5 && /^BUST (#|trig#)/.test(l.txt));
    const lPre = l => !lA(l) && l.p < 6;
    const act = c => c.lines.some(lA);
    let ci = 0; const idx = [];
    const card = (c, L) => {
      L = L || c.lines;
      const top = Math.min(...L.map(l => l.p));
      const shown = L.slice(0, 2), more = c.lines.length - shown.length;   // przytrzymanie pokazuje wszystkie etykiety karty
      idx.push(c);
      return `<div class="ug-mc b${top}" data-c="${ci++}"><div class="h"><span class="id">${esc(c.id)}</span><span class="rule">${esc(c.rule || '')}<span class="go">› tabela</span></span></div>
          ${shown.map(l => lineHtml(l, false)).join('')}${more > 0 ? `<div class="more">+ ${more} ${more === 1 ? 'etykieta' : more < 5 ? 'etykiety' : 'etykiet'} · przytrzymaj</div>` : ''}${metaHtml(c.meta)}</div>`;
    };
    let nAct = 0, nWait = 0, waitH = '';
    cfg.sections.forEach(s => {
      const ac = s.cards.filter(act), wt = s.cards.filter(c => !act(c)), pre = ac.filter(c => c.lines.some(lPre));
      if (ac.length) {
        const sb = ac.reduce((a, c) => a + c.lines.filter(l => l.p === 1).length, 0);
        const ss = ac.reduce((a, c) => a + c.lines.filter(l => l.p === 1).reduce((x, l) => x + (l.stake || 0), 0), 0);
        h += `<div class="ug-sec"><div class="ug-sh"><b>${s.name ? esc(s.name) : `NASTĘPNY WIERSZ Nr ${fmt(NX)}`}</b><span class="${sb ? 'g' : 'm'}">${sb ? `GRA ${sb} × · ${fmt(ss)} zł` : 'gra w toku'}</span></div>${ac.map(c => card(c, c.lines.filter(lA))).join('')}</div>`;
        nAct += ac.length;
      }
      if (wt.length || pre.length) {
        nWait += wt.length + pre.length;
        waitH += `<div class="ug-sec"><div class="ug-sh"><b>${s.name ? esc(s.name) : 'Modele'}</b><span class="m">${wt.length + pre.length} przed START / bez gry</span></div>${pre.map(c => card(c, c.lines.filter(lPre))).join('')}${wt.map(c => card(c)).join('')}</div>`;
      }
    });
    if (!nAct) h += `<div class="ug-none">Żaden model nie gra teraz (brak okna po START).</div>`;
    if (nWait) h += `<button class="ug-wt" type="button">${wOpen ? '▴' : '▾'} Modele oczekujące (${nWait}) — przed START / bez triggera</button><div class="ug-wl"${wOpen ? '' : ' hidden'}>${waitH}</div>`;
    if (cfg.last && cfg.last.length) h += `<div class="ug-last">Ostatnie: ${cfg.last.map(c => `<b>${esc(c)}</b>`).join('')}</div>`;
    h += `</div>`;
    host.innerHTML = h;
    if (cfg.bindTop) cfg.bindTop(host);
    const wb = host.querySelector('.ug-wt');
    if (wb) wb.onclick = () => { wOpen = !wOpen; host.querySelector('.ug-wl').hidden = !wOpen; wb.textContent = `${wOpen ? '▴' : '▾'} Modele oczekujące (${nWait}) — przed START / bez triggera`; };
    // tapnięcie karty / linii / strzałki → TABELA (linia z Nr → ten wiersz); przytrzymanie karty → okno ze wszystkimi etykietami
    host.querySelectorAll('.ug-mc').forEach(el => {
      const c = idx[+el.dataset.c];
      let t = null, long = false, x0 = 0, y0 = 0;
      const cancel = () => { clearTimeout(t); t = null; el.classList.remove('hold'); };
      el.addEventListener('pointerdown', e => {
        long = false; x0 = e.clientX; y0 = e.clientY; el.classList.add('hold');
        t = setTimeout(() => { long = true; el.classList.remove('hold'); if (navigator.vibrate) navigator.vibrate(25); popup(c); }, 450);
      });
      el.addEventListener('pointermove', e => { if (t && (Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10)) cancel(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, cancel));
      el.addEventListener('contextmenu', e => e.preventDefault());
      el.addEventListener('click', e => {
        if (long) { long = false; e.preventDefault(); return; }
        const st = e.target.closest('.ug-st[data-er]');
        c.go(st ? +st.dataset.er : undefined);
      });
    });
  }
  return { render, popup };
})();

// ===== T50Frame — wygląd apek T50 x1x (nagłówek + GRA · TABELA · STATY) dla tabel o innym układzie (TRÓJKA, 2-SLOT) =====
// Stary interfejs apki zostaje w DOM (ukryty) — silnik i jego funkcje działają bez zmian.
window.T50Frame = function (title, views) {
  const css = `
html,body{height:auto!important;overflow:visible!important;display:block!important;margin:0;background:#12151c!important;color:#e8ebf2;font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
body>*:not(.t5f):not(.ut-pop):not(.ug-pop){display:none!important}
.t5f-h{position:sticky;top:0;z-index:5;background:#1b1f2a;border-bottom:1px solid #323a4d;padding:5px 12px;display:flex;align-items:center;gap:8px}
.t5f-h h1{font-size:14px;margin:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t5f-h .n{color:#8b93a7;font-size:12px;white-space:nowrap}
.t5f-m{padding:10px 10px 80px}
.t5f-nav{position:fixed;bottom:0;left:0;right:0;z-index:5;display:flex;background:#1b1f2a;border-top:1px solid #323a4d}
.t5f-nav button{flex:1;background:none;border:0;color:#8b93a7;padding:10px 0 12px;font-size:13px;font-weight:600}
.t5f-nav button.on{color:#ff6600}
.t5f .card{background:#1b1f2a;border:1px solid #323a4d;border-radius:10px;padding:10px;margin-bottom:10px}
.t5f h2{font-size:14px;margin:4px 0 8px}
.t5f .muted{color:#8b93a7;font-size:12px}
.t5f table.stt{border-collapse:collapse;width:100%;font-size:12.5px}
.t5f table.stt td{padding:4px 5px;border-bottom:1px solid #2a3142}
.t5f table.stt td:first-child{color:#8b93a7;width:52%}
.t5f .pos{color:#5fd38a}.t5f .neg{color:#ff8a8a}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const h = document.createElement('header'); h.className = 't5f t5f-h'; h.innerHTML = `<h1></h1><span class="n"></span>`;
  h.querySelector('h1').textContent = title;
  const main = document.createElement('main'); main.className = 't5f t5f-m';
  const nav = document.createElement('nav'); nav.className = 't5f t5f-nav';
  nav.innerHTML = views.map(([k, t]) => `<button data-v="${k}">${t}</button>`).join('');
  document.body.append(h, main, nav);
  const F = { main, nav, view: views[0][0], render: null,
    setN: t => { h.querySelector('.n').textContent = t; },
    show: v => { F.view = v; nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); if (F.render) F.render(v); if (v !== 'tab') window.scrollTo(0, 0); } };
  nav.querySelectorAll('button').forEach(b => b.onclick = () => F.show(b.dataset.v));
  return F;
};

// ===== T50Stat — STATY jak w T50 1T/200/2T (zestawienie + karty modeli) dla TRÓJKI i 2-SLOT =====
// Gra (okno) = {trigEr, er, K}: er = wiersz rozliczenia (0-based), K = krok trafienia (K > 8 = BUST).
// Zakłady w oknie: kroki 1…min(K,8), trafienie tylko na kroku K — progresja jak prog() w T50 x1x.
window.T50Stat = (function () {
  const esc = window.__t50esc || (v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]));
  const zl = window.__t50zl || (v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toLocaleString('pl-PL')} zł`), fmt = v => Number(v).toLocaleString('pl-PL');
  const css = `
.t5s .card{background:#1b1f2a;border:1px solid #323a4d;border-radius:10px}
.t5s{color:#fff;font-size:12px;line-height:1.25}
.t5s .card{padding:7px 8px;margin-bottom:6px}
.t5s h2{font-size:13px;margin:0 0 4px;color:#fff}
.t5s .muted,.t5s .def{color:#fff;font-size:11px;opacity:.85}
.t5s .def{margin:0 0 4px}
.t5s table td,.t5s table th{border:0;border-bottom:1px solid #2a3142;color:#fff;text-align:left;background:transparent;vertical-align:top;font-family:inherit;padding:2px 5px}
.t5s table.stt{font-size:12px}
.t5s table.stt td:first-child{color:#fff;width:40%;opacity:.8}
.t5s td.pos,.t5s .pos{color:#5fd38a}.t5s td.neg,.t5s .neg{color:#ff8a8a}
.t5s .tw{overflow-x:auto;border:1px solid #323a4d;border-radius:8px}
.t5s .tw table{border-collapse:collapse;width:100%;font-size:11.5px;table-layout:auto}
.t5s .tw td,.t5s .tw th{width:auto!important;min-width:0;max-width:none;white-space:nowrap;padding:3px 3px}
.t5s .tw th{background:#232838;color:#fff;font-weight:600;font-size:11px}
.t5s .row{display:flex;gap:6px;margin-top:6px}
.t5s .btn{flex:1;padding:6px;border-radius:8px;border:1px solid #323a4d;background:#232838;color:#fff;font-weight:600;font-size:12px}
.t5s .tw table .grp td{color:#ffb27a;font-weight:700;background:#161a24}`;
  let styled = false;
  function prog(o, ST, odds, Kl) {
    let bs = 0, W = 0, B = 0, pnl = 0;
    const sum = k => ST.slice(0, k).reduce((a, b) => a + b, 0);
    for (const x of o) {
      if (x) { pnl += Math.trunc(ST[bs] * odds) - sum(bs + 1); W++; bs = 0; }
      else { bs++; if (bs === Kl) { pnl -= sum(Kl); B++; bs = 0; } }
    }
    return [W, B, pnl];
  }
  function rng32(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  // games → statystyki (pola jak computeStats w T50 x1x)
  function compute(games, N, ST, odds, mc) {
    const Kl = ST.length, o = [], b = [];
    games.forEach(g => { const n = Math.min(g.K, Kl); for (let k = 1; k <= n; k++) { o.push(g.K <= Kl && k === g.K); b.push(g.er); } });
    const [W, B, P] = prog(o, ST, odds, Kl);
    let ml = 0, cur = 0; for (const x of o) { cur = x ? 0 : cur + 1; if (cur > ml) ml = cur; }
    const per = [];
    for (let s = 0; s < 5; s++) { const lo = Math.floor(s * N / 5), hi = Math.floor((s + 1) * N / 5); per.push(prog(o.filter((_, j) => b[j] >= lo && b[j] < hi), ST, odds, Kl)[2]); }
    const cut = Math.trunc(N * 0.6), [, Bo, Po] = prog(o.filter((_, j) => b[j] >= cut), ST, odds, Kl);
    const k6 = prog(o, ST, odds, 6)[1], k7 = prog(o, ST, odds, 7)[1], okresy = per.filter(p => p > 0).length;
    const maxk = games.reduce((a, g) => Math.max(a, Math.min(g.K, Kl)), 0);
    const lens = games.filter(g => g.trigEr != null).map(g => g.er - g.trigEr + 1);
    const s = {
      zakl: o.length, cykle: games.length, W, B, hit: o.length ? r1(W / o.length * 100) : 0, P, wr: games.length ? r1(W / games.length * 100) : 0,
      zc: games.length ? r2(o.length / games.length) : null, sr: lens.length ? r1(lens.reduce((a, v) => a + v, 0) / lens.length) : null,
      ml, maxwyl: ST.slice(0, maxk).reduce((a, v) => a + v, 0), k6, k7, okresy, per, Bo, Po,
      obrot: games.reduce((a, g) => a + ST.slice(0, Math.min(g.K, Kl)).reduce((x, v) => x + v, 0), 0),
      wk: ST.map((_, j) => games.filter(g => g.K === j + 1).length),
      ptsDet: { '5 okresów': okresy === 5 ? 2 : (okresy === 4 ? 1 : 0), 'BUST K7': k7 <= 3 ? 2 : (k7 <= 5 ? 1 : 0),
                '40%: 0 BUST, +': (Bo === 0 && Po > 0) ? 1 : 0, '0 BUST K8': B === 0 ? 1 : 0 },
      bootP: null, bootMed: null, permMed: null, score: null,
    };
    if (mc && o.length) {
      const rnd = rng32(42), n = o.length, IT = 5000, bb = [], pb = [];
      for (let it = 0; it < IT; it++) { const smp = new Array(n); for (let j = 0; j < n; j++) smp[j] = o[Math.floor(rnd() * n)]; bb.push(prog(smp, ST, odds, Kl)[2]); }
      for (let it = 0; it < IT; it++) { const a = o.slice(); for (let j = n - 1; j > 0; j--) { const q = Math.floor(rnd() * (j + 1)); const t = a[j]; a[j] = a[q]; a[q] = t; } pb.push(prog(a, ST, odds, Kl)[1]); }
      const med = arr => { const a = arr.slice().sort((x, y) => x - y), L = a.length; return L % 2 ? a[(L - 1) / 2] : (a[L / 2 - 1] + a[L / 2]) / 2; };
      s.bootMed = med(bb); s.bootP = bb.filter(v => v <= 0).length / IT; s.permMed = med(pb);
      s.score = (s.bootMed > 0 ? 2 : 0) + (s.bootP < 0.35 ? 1 : 0) + Object.values(s.ptsDet).reduce((a, v) => a + v, 0);
    }
    return s;
  }
  function lastTxt(games, ST, odds) {
    const g = games[games.length - 1]; if (!g) return '—';
    const Kl = ST.length, sum = ST.slice(0, Math.min(g.K, Kl)).reduce((a, v) => a + v, 0);
    const v = g.K <= Kl ? Math.trunc(ST[g.K - 1] * odds) - sum : -sum;
    return `Nr ${g.er + 1} · ${g.K <= Kl ? `WIN K${g.K} (${ST[g.K - 1]} zł)` : `BUST K=${g.K}`} · ${zl(v)}`;
  }
  // wiersze karty modelu (te same co w T50 x1x) + extra na końcu
  function rows(s, games, ST, odds, extra) {
    const sumPts = Object.values(s.ptsDet).reduce((a, v) => a + v, 0);
    const mc = s.bootP === null ? `— (Monte-Carlo) · bez MC ${sumPts}/6` : `boot P(≤0) ${s.bootP.toFixed(2)} · med ${zl(Math.round(s.bootMed))} · perm BUST ${s.permMed} · <b>${s.score} pkt</b>`;
    return [
      ['Zakł / cykle / WIN / BUST', `${s.zakl} / ${s.cykle} / ${s.W} / ${s.B}`],
      ['Bilans · obrót', `<b class="${s.P >= 0 ? 'pos' : 'neg'}">${zl(s.P)}</b> · ${fmt(s.obrot)} zł`],
      ['Traf% · WR% · zakł/cykl', `${s.hit.toFixed(1)} · ${s.wr.toFixed(1)} · ${s.zc ?? '—'}`],
      ['maxL · wyłoż. · śr. cykl', `${s.ml} · ${fmt(s.maxwyl)} zł · ${s.sr ?? '—'} w.`],
      ['WIN k1…k8', s.wk.join(' · ')],
      ['BUST K6/K7 · okr · 40%', `${s.k6}/${s.k7} · ${s.okresy}/5 · ${s.Bo} B ${zl(s.Po)}`],
      ['Monte-Carlo', mc],
      ['Ostatni', esc(lastTxt(games, ST, odds))],
    ].concat(extra || []);
  }
  // groups: [{name, items:[{id, sub, def, games, extra}]}]
  let mcOn = false;
  function render(el, o) {
    if (!styled) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); styled = true; }
    const { N, ST, odds } = o, mc = mcOn;
    const all = o.groups.map(g => ({ name: g.name, items: g.items.map(it => Object.assign({ s: compute(it.games, N, ST, odds, mc) }, it)) }));
    let h = `<div class="t5s"><div class="card"><h2>${esc(o.title)} — zestawienie, ${fmt(N)} kodów <span class="muted">(bilans w zł)</span></h2><div class="tw"><table><thead><tr><th>M</th><th>Zakł/W</th><th>WR%</th><th>maxL</th><th>B</th><th>Bilans</th><th>WF</th>${mc ? '<th>pkt</th>' : ''}</tr></thead><tbody>`;
    const items = [].concat(...all.map(g => g.items));
    all.forEach(g => {
      if (g.name) h += `<tr class="grp"><td colspan="${mc ? 8 : 7}">${esc(g.name)}</td></tr>`;
      g.items.forEach(({ id, s }) => { h += `<tr><td><b>${esc(id)}</b></td><td>${s.zakl}/${s.W}</td><td>${s.hit.toFixed(1)}</td><td>${s.ml}</td><td>${s.B}</td><td class="${s.P >= 0 ? 'pos' : 'neg'}">${(s.P >= 0 ? '+' : '−') + fmt(Math.abs(s.P))}</td><td>${s.okresy}/5</td>${mc ? `<td>${s.score ?? '—'}</td>` : ''}</tr>`; });
    });
    const sumI = items.filter(x => !x.noSum), tot = sumI.reduce((a, x) => a + x.s.P, 0);
    h += `<tr><td><b>Σ</b></td><td>${sumI.reduce((a, x) => a + x.s.zakl, 0)}/${sumI.reduce((a, x) => a + x.s.W, 0)}</td><td colspan="3"></td><td><b class="${tot >= 0 ? 'pos' : 'neg'}">${(tot >= 0 ? '+' : '−') + fmt(Math.abs(tot))}</b></td><td></td>${mc ? '<td></td>' : ''}</tr></tbody></table></div>
    <div class="muted" style="margin-top:4px">${o.note || ''}</div>
    <div class="row"><button class="btn t5s-mc">${mc ? 'Ukryj Monte-Carlo' : 'Policz Monte-Carlo (bootstrap/permutacja)'}</button></div>
    ${mc ? '<div class="muted" style="margin-top:4px">Monte-Carlo: 5000 losowań, wynik przybliżony.</div>' : ''}</div>`;
    all.forEach(g => g.items.forEach(it => {
      h += `<div class="card"><h2>${esc(it.id)}${it.sub ? ` · ${esc(it.sub)}` : ''}</h2>${it.def ? `<div class="def">${esc(it.def)}</div>` : ''}<table class="stt"><tbody>${rows(it.s, it.games, ST, odds, it.extra).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody></table></div>`;
    }));
    h += `<div class="card muted">Punkty (z 9): bootstrap mediana &gt; 0 (2) · P(straty) &lt; 0,35 (1) · 5/5 okresów na plus (2; 4/5 = 1) · BUST K7 ≤ 3 (2; ≤ 5 = 1) · część 40%: 0 BUST i bilans &gt; 0 (1) · 0 BUST K8 (1). ≥ 7 GRAĆ.</div>`;
    h += o.tail || '';
    el.innerHTML = h + '</div>';
    el.querySelector('.t5s-mc').onclick = () => { mcOn = !mcOn; render(el, o); };
  }
  // krótka lista do okna „przytrzymaj → statystyki”
  function brief(games, N, ST, odds) {
    const s = compute(games, N, ST, odds, false);
    return [['Zakłady / cykle / WIN / BUST', `${s.zakl} / ${s.cykle} / ${s.W} / ${s.B}`], ['Trafienie % · WR %', `${s.hit.toFixed(1)} · ${s.wr.toFixed(1)}`],
      ['Bilans', zl(s.P)], ['Max seria przegr. · max wyłożone', `${s.ml} · ${fmt(s.maxwyl)} zł`], ['WIN k1…k8', s.wk.join(' · ')],
      ['BUST przy K6 / K7', `${s.k6} / ${s.k7}`], ['Okresy + (z 5)', s.okresy], ['Część 40%: BUST / bilans', `${s.Bo} / ${zl(s.Po)}`],
      ['Obrót', `${fmt(s.obrot)} zł`], ['Ostatni zakład', lastTxt(games, ST, odds)]];
  }
  return { compute, render, brief, esc };
})();
