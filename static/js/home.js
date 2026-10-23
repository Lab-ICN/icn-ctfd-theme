// ICN home: countdown, event stats, category list and top 5.
// Everything that comes from the API is written with textContent: user and
// challenge names are user-controlled.
(function () {
  "use strict";

  const init = window.init || {};
  const page = window.ICN_HOME || {};
  const root = init.urlRoot || "";
  const $ = (key) => document.querySelector(`[data-icn="${key}"]`);

  const ICONS = {
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 2v4M14 2v4M10 18v4M14 18v4M2 10h4M2 14h4M18 10h4M18 14h4"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  };
  const CATEGORY_STYLE = [
    [/crypt/i, "lock", "c-crypto"],
    [/web/i, "globe", "c-web"],
    [/foren/i, "search", "c-foren"],
    [/rev|pwn|binary|exploit/i, "chip", "c-pwn"],
  ];

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function icon(name) {
    const span = el("span", "r-ic");
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    return span;
  }

  async function api(path) {
    const res = await fetch(root + path, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const body = await res.json();
    if (!body.success) throw new Error("api");
    return body;
  }

  // Countdown ---------------------------------------------------------------
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function format(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const clock = `${pad(h)}:${pad(m)}:${pad(s % 60)}`;
    return d > 0 ? `${d}d ${clock}` : clock;
  }

  function tick() {
    const label = $("clock-label");
    const clock = $("clock");
    if (!label || !clock) return;
    const now = Date.now() / 1000;
    const start = Number(init.start) || null;
    const end = Number(init.end) || null;

    if (start && now < start) {
      label.textContent = "Starts in";
      clock.textContent = format(start - now);
    } else if (end && now < end) {
      label.textContent = "Time left";
      clock.textContent = format(end - now);
    } else if (end) {
      label.textContent = "Event ended";
      clock.textContent = "00:00:00";
      return;
    } else {
      label.textContent = "Status";
      clock.textContent = "Open";
      return;
    }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }

  // Categories + stats ------------------------------------------------------
  function renderCategories(challenges) {
    const box = $("categories");
    box.replaceChildren();

    const groups = new Map();
    for (const c of challenges) {
      if (!groups.has(c.category)) groups.set(c.category, []);
      groups.get(c.category).push(c);
    }
    if (!groups.size) {
      box.append(el("div", "empty", "No challenges yet."));
      return;
    }

    for (const [category, list] of groups) {
      const style = CATEGORY_STYLE.find(([re]) => re.test(category)) || [null, "flag", "c-other"];
      const row = el("a", "row");
      row.href = page.challengesUrl;

      const ic = icon(style[1]);
      ic.classList.add(style[2]);

      const main = el("div", "r-main");
      main.append(el("div", "r-name", category));
      main.append(el("div", "r-sub", list.map((c) => c.name).join(" · ")));

      const solved = list.filter((c) => c.solved_by_me).length;
      const points = list.reduce((sum, c) => sum + (c.value || 0), 0);
      const count = el("div", "r-count");
      const n = el("div", "n", String(list.length));
      n.append(el("small", null, "chall"));
      count.append(n);
      count.append(el("div", "p", page.authed ? `${solved}/${list.length} solved · ${points} pts` : `${points} pts`));

      const right = el("div", "r-right");
      right.append(count);
      right.insertAdjacentHTML("beforeend", '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>');

      row.append(ic, main, right);
      box.append(row);
    }

    const total = challenges.length;
    $("cat-summary").textContent = `${total} challenges · `;
  }

  function challengesUnavailable(err) {
    const box = $("categories");
    box.replaceChildren();
    const msg = el("div", "empty");
    if (!page.authed) {
      msg.append("Log in to see the challenges. ");
      const a = el("a", null, "Login");
      a.href = page.loginUrl;
      msg.append(a);
    } else if (err.message === "403") {
      msg.textContent = "Challenges aren't open yet.";
    } else {
      msg.textContent = "Couldn't load challenges.";
    }
    box.append(msg);
  }

  async function loadChallenges() {
    try {
      const { data } = await api("/api/v1/challenges");
      renderCategories(data);
      $("stat-challenges").textContent = data.length;
      $("stat-solves").textContent = data.reduce((sum, c) => sum + (c.solves || 0), 0);
    } catch (err) {
      challengesUnavailable(err);
    }
  }

  async function loadUsers() {
    try {
      const body = await api("/api/v1/users?page=1");
      const total = body.meta && body.meta.pagination ? body.meta.pagination.total : body.data.length;
      $("stat-users").textContent = total;
    } catch (err) {
      // Account listing hidden: leave the dash.
    }
  }

  // Top 5 -------------------------------------------------------------------
  async function loadTop() {
    const box = $("top");
    if (!box) return;
    try {
      const { data } = await api("/api/v1/scoreboard");
      box.replaceChildren();
      if (!data.length) {
        box.append(el("div", "empty", "No scores yet."));
        return;
      }
      for (const s of data.slice(0, 5)) {
        const row = el("a", "rank");
        row.href = s.account_url || "#";
        if (init.userId && s.account_id === init.userId) row.classList.add("me");
        row.append(el("span", "pos", String(s.pos)));
        row.append(el("span", "who", s.name));
        const pts = el("span", "pts", String(s.score));
        pts.append(el("small", null, "pts"));
        row.append(pts);
        box.append(row);
      }
    } catch (err) {
      box.replaceChildren(el("div", "empty", "Scoreboard unavailable."));
    }
  }

  tick();
  loadChallenges();
  loadUsers();
  loadTop();
})();
