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

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

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
    if (el) el.style.width = pct + '%';
  }

  function setLevel(level) {
    const el = document.getElementById('level-value');
    if (el) el.textContent = String(level);
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
    const body = document.body;
    if (body && !body.classList.contains('vs-gradient')) body.classList.add('vs-gradient');

    const st = readState();
    if (isNewDay(st.last)) {
      st.streak = Number(st.streak || 0) + 1;
      st.last = new Date().toISOString();
      saveState(st);
      toast('Streak diário +1 🔥', 'warn');
    }

    setStreak(st.streak || 0);
    const { level, pct } = computeLevel(st.xp || 0);
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

