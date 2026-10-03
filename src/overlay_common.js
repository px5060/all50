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
