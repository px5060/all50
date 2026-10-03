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
.ut-tool{display:flex;gap:5px;flex-wrap:wrap;padding:0 0 6px}
.ut-tool button{padding:5px 9px;border-radius:12px;border:1px solid #323a4d;background:#1b1f2a;color:#c9cfdc;font-size:12px;font-weight:600}
.ut-tool button.on{background:#2e75b6;border-color:#2e75b6;color:#fff}
.ut-desc{color:#8b93a7;font-size:12px;margin:0 0 6px}
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
    x += `<div class="ut-ch">${['ALL', ...models.map(m => m.id)].map(id => `<button data-m="${esc(id)}" class="${S.sel === id ? 'on' : ''}">${id === 'ALL' ? 'WSZ' : esc(id)}</button>`).join('')}</div>`;
    x += `<div class="ut-tool"><button id="utEv" class="${S.onlyEv ? 'on' : ''}">tylko zdarzenia</button>${A.tools ? A.tools() : ''}<button id="utEnd">↓ koniec</button><button id="utLeg" class="${S.leg ? 'on' : ''}">legenda ${S.leg ? '▴' : '▾'}</button></div>`;
    if (S.leg) x += `<div class="ut-leg">${A.legend()}<br><b>Kod</b> (widok modelu): <span style="${CC.step}">STEP</span><span style="${CC.trig}">TRIGGER</span><span style="${CC.win}">WIN</span> — kod, który w tym modelu tworzy step, trigger albo wygrany zakład. Tapnij wiersz → pełny opis.</div>`;
    if (!isAll && A.desc) x += `<div class="ut-desc">${A.desc(mi)}</div>`;
    x += `<div class="ut-tw" id="utTw">`;
    if (from > 0) x += `<button class="ut-more" id="utMore">▲ Pokaż +200 wcześniejszych (ukrytych ${from})</button>`;
    if (isAll) {
      x += `<table><colgroup><col style="width:52px"><col style="width:38px">${models.map(() => '<col>').join('')}</colgroup><thead><tr><th>Nr</th><th>Kod</th>${models.map(m => `<th style="text-align:center;padding:4px 1px">${esc(m.id)}</th>`).join('')}</tr></thead><tbody>`;
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
    tw.querySelectorAll('tbody tr').forEach(tr => tr.onclick = () => { mark(+tr.dataset.i); popup(+tr.dataset.i); });
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
  return { render, open, S, popup };
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

  function popup(c) {
    const p = document.createElement('div'); p.className = 'ug-pop';
    p.innerHTML = `<div class="sh"><button class="x">✕</button><h3>${esc(c.id)}</h3><div class="hs">${esc(c.rule || '')}</div>
      ${c.lines.map(l => lineHtml(l, true)).join('')}${metaHtml(c.meta)}<button class="gobtn">› TABELA ${esc(c.id)}</button></div>`;
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
    h += `<div class="ug-hint">Tapnij kartę → tabela modelu · przytrzymaj → wszystkie etykiety</div>`;
    let ci = 0; const idx = [];
    cfg.sections.forEach(s => {
      const sb = s.cards.reduce((a, c) => a + c.lines.filter(l => l.p === 1).length, 0);
      const ss = s.cards.reduce((a, c) => a + c.lines.filter(l => l.p === 1).reduce((x, l) => x + (l.stake || 0), 0), 0);
      h += `<div class="ug-sec"><div class="ug-sh"><b>${s.name ? esc(s.name) : `NASTĘPNY WIERSZ Nr ${fmt(NX)}`}</b><span class="${sb ? 'g' : 'm'}">${sb ? `GRA ${sb} × · ${fmt(ss)} zł` : 'bez gry'}</span></div>`;
      s.cards.forEach(c => {
        const top = Math.min(...c.lines.map(l => l.p));
        const shown = c.lines.slice(0, 2), more = c.lines.length - shown.length;
        h += `<div class="ug-mc b${top}" data-c="${ci}"><div class="h"><span class="id">${esc(c.id)}</span><span class="rule">${esc(c.rule || '')}<span class="go" data-go="${ci}">› tabela</span></span></div>
          ${shown.map(l => lineHtml(l, false)).join('')}${more > 0 ? `<div class="more">+ ${more} ${more === 1 ? 'etykieta' : more < 5 ? 'etykiety' : 'etykiet'} · przytrzymaj</div>` : ''}${metaHtml(c.meta)}</div>`;
        idx.push(c); ci++;
      });
      h += `</div>`;
    });
    if (cfg.last && cfg.last.length) h += `<div class="ug-last">Ostatnie: ${cfg.last.map(c => `<b>${esc(c)}</b>`).join('')}</div>`;
    h += `</div>`;
    host.innerHTML = h;
    if (cfg.bindTop) cfg.bindTop(host);
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
.t5f-m{padding:10px 10px 80px;max-width:720px;margin:0 auto}
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
