// Gamification utilities for VetSim UI
(function () {
  const STORAGE_KEY = 'vetsim_gam';

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { xp: 0, last: null, streak: 0 };
      const data = JSON.parse(raw);
      return { xp: Number(data.xp || 0), last: data.last || null, streak: Number(data.streak || 0) };
    } catch (_) {
      return { xp: 0, last: null, streak: 0 };
    }
  }

  function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); try { if (window.BroadcastChannel) { (window.__vetsim_bc ||= new BroadcastChannel('vetsim_gam')).postMessage({ type: 'state', payload: state }); } } catch(_){} }

  function isNewDay(lastIso) {
    if (!lastIso) return true;
    const last = new Date(lastIso).toDateString();
    const now = new Date().toDateString();
    return last !== now;
  }

  function computeLevel(xp) {
    // Simple levelling curve: every 100 XP -> +1 level
    const level = Math.floor(xp / 100) + 1;
    const inLevel = xp % 100;
    const pct = Math.min(100, Math.max(0, inLevel));
    return { level, inLevel, pct };
  }

  function setXPBar(pct) {
    const el = document.getElementById('xp-progress-inner');
    if (el && el.dataset.lock !== 'true') el.style.width = pct + '%';
  }

  function setLevel(level) {
    const el = document.getElementById('level-value');
    if (el && el.dataset.lock !== 'true') el.textContent = String(level);
  }

  function setStreak(streak) {
    const el = document.getElementById('streak-value');
    if (el) el.textContent = String(streak);
  }

  function toast(message, type = 'success') {
    const cont = document.getElementById('toast-container');
    if (!cont) return;
    const item = document.createElement('div');
    item.className = 'vs-toast ' + type;
    item.textContent = message;
    cont.appendChild(item);
    setTimeout(() => item.remove(), 3500);
  }

  function awardXP(amount, reason) {
    const st = readState();
    st.xp = Math.max(0, st.xp + Number(amount || 0));
    st.last = new Date().toISOString();
    saveState(st);
    const { level, pct } = computeLevel(st.xp);
    setLevel(level);
    setXPBar(pct);
    if (amount > 0) toast(`+${amount} XP ${reason ? '— ' + reason : ''}`, 'success');
  }

  function init() {
    const role = (typeof window !== 'undefined' && window.__userRole) ? window.__userRole : 'student';
    if (role === 'admin' || role === 'teacher') return;

    const body = document.body;
    if (body && !body.classList.contains('vs-gradient')) body.classList.add('vs-gradient');

    const st = readState();
    // Sync with server-reported XP if available to keep tabs consistent
    try {
      const sxp = (typeof window !== 'undefined' && window.__serverXP !== undefined)
        ? Number(window.__serverXP) : NaN;
      if (Number.isFinite(sxp) && sxp >= 0 && st.xp !== sxp) {
        st.xp = sxp;
        saveState(st);
      }
    } catch (_) {}
    try { fetch('/me/streak/tick', { method: 'POST' }).then(function(r){ return r.json(); }).then(function(data){ if (data && typeof data.streak === 'number') { st.streak = Number(data.streak); st.last = new Date().toISOString(); saveState(st); setStreak(st.streak); } }).catch(function(){ if (isNewDay(st.last)) { st.streak = Number(st.streak || 0) + 1; st.last = new Date().toISOString(); saveState(st); toast('Streak diário +1 🔥', 'warn'); } }); } catch (_e) { if (isNewDay(st.last)) { st.streak = Number(st.streak || 0) + 1; st.last = new Date().toISOString(); saveState(st); toast('Streak diário +1 🔥', 'warn'); } }

    setStreak(st.streak || 0);
    const { level, pct } = computeLevel(st.xp || 0);
    // Respeita valores renderizados pelo servidor quando bloqueados via data-lock
    setLevel(level);
    setXPBar(pct);

    // Auto-award XP for mission links with data-xp
    document.querySelectorAll('[data-xp]').forEach((el) => {
      el.addEventListener('click', () => {
        const v = Number(el.getAttribute('data-xp')) || 0;
        if (v > 0) awardXP(v, el.getAttribute('data-reason') || 'Missão');
      });
    });
  }

  window.gamification = { init, awardXP, toast };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
// Cross-tab synchronization handlers
(function(){
  try {
    function applyExternalState(raw){
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!data) return;
        if (typeof data.streak === 'number') {
          const val = Number(data.streak);
          const el = document.getElementById('streak-value');
          el && (el.textContent = String(val));
        }
        if (typeof data.xp === 'number') {
          const xp = Number(data.xp);
          const level = Math.floor(xp / 100) + 1;
          const pct = Math.min(100, Math.max(0, xp % 100));
          const lvlEl = document.getElementById('level-value');
          if (lvlEl && lvlEl.dataset.lock !== 'true') lvlEl.textContent = String(level);
          const bar = document.getElementById('xp-progress-inner');
          if (bar && bar.dataset.lock !== 'true') bar.style.width = pct + '%';
        }
      } catch(_){}
    }
    window.addEventListener('storage', function(ev){
      if (!ev || ev.key !== 'vetsim_gam' || !ev.newValue) return;
      applyExternalState(ev.newValue);
    });
    if (window.BroadcastChannel) {
      var bc = (window.__vetsim_bc ||= new BroadcastChannel('vetsim_gam'));
      bc.onmessage = function(ev){
        if (!ev || !ev.data || ev.data.type !== 'state') return;
        applyExternalState(ev.data.payload);
      };
    }
  } catch(_){}
})();
