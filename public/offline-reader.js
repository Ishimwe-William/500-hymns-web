/* Standalone public reader: hymn content is always inserted as text. */
(() => {
  const content = document.getElementById("content");
  const notice = document.getElementById("status");
  let library;
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event("hymns:storage-change")); } catch { notice.textContent = "Browser storage is unavailable. Changes cannot be saved."; } };
  const theme = read("hymns:theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
  function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }
  function link(text, href) { const node = element("a", text); node.href = href; return node; }
  function button(text, action) { const node = element("button", text); node.type = "button"; node.onclick = action; return node; }
  async function send(command) {
    const registration = await navigator.serviceWorker.ready;
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); reject(new Error("Offline storage did not respond.")); }, 60000);
      channel.port1.onmessage = ({data}) => { clearTimeout(timeout); channel.port1.close(); if (data.ok) resolve(data); else reject(new Error(data.error)); };
      registration.active.postMessage({type:"HYMN_OFFLINE", command}, [channel.port2]);
    });
  }
  function render() {
    if (document.body.classList.contains("presenting")) return;
    if (!library) { notice.textContent = "No offline download is saved. Reconnect and choose Settings → Download hymns."; return; }
    const query = document.querySelector("#search")?.value || "";
    content.replaceChildren();
    notice.textContent = `${library.hymns.length} hymns available offline. Last checked: ${new Date(library.checkedAt).toLocaleString()}.`;
    const id = /^\/hymns\/([^/]+)\/?$/.exec(location.pathname)?.[1];
    const hymn = id && library.hymns.find(h => h.id === decodeURIComponent(id));
    if (id && !hymn) { content.append(element("h1", "Hymn not in this download"), link("Browse downloaded hymns", "/hymns")); return; }
    if (hymn) {
      document.title = `${hymn.number}. ${hymn.title} — Offline hymnbook`;
      const recent = read("hymns:recent", []);
      save("hymns:recent", [{id:hymn.id, openedAt:Date.now()}, ...recent.filter(entry => entry.id !== hymn.id)].slice(0,50));
      const controls = element("div", "", "controls");
      controls.append(link("← Hymns", "/hymns"));
      const fav = button("", () => { const ids = read("hymns:favorites", []); save("hymns:favorites", ids.includes(hymn.id) ? ids.filter(value => value !== hymn.id) : [...ids,hymn.id]); updateFavorite(); });
      function updateFavorite() { const selected = read("hymns:favorites", []).includes(hymn.id); fav.textContent = selected ? "♥ Favorited" : "♡ Favorite"; fav.setAttribute("aria-pressed", String(selected)); }
      updateFavorite(); controls.append(fav);
      const desktop = matchMedia("(hover: hover) and (pointer: fine)").matches
        && !/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)
        && !(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (desktop && hymn.sections.length) controls.append(button("Present", () => window.HymnOfflinePresentation.start(hymn, render)));
      const reader = element("article", "", "reader");
      reader.append(element("p", `HYMN ${hymn.number}`, "origin"), element("h1", hymn.title));
      if (hymn.origin) reader.append(element("p", hymn.origin, "origin"));
      const settings = {fontSize:22, showVerseNumbers:true, ...read("hymns:settings", {})};
      hymn.sections.forEach((section, index) => {
        const block = element("section", "", section.type);
        if (settings.showVerseNumbers) block.append(element("h2", section.type === "refrain" ? "Refrain" : String(section.number ?? index + 1)));
        const lyrics = element("p", section.lines.join("\n"), "lyrics");
        lyrics.style.fontSize = `${Math.min(30, Math.max(16, Number(settings.fontSize) || 22))}px`;
        block.append(lyrics); reader.append(block);
      });
      const neighbors = element("div", "", "controls");
      const index = library.hymns.indexOf(hymn);
      if (index > 0) neighbors.append(link("← Previous hymn", `/hymns/${encodeURIComponent(library.hymns[index-1].id)}`));
      if (index < library.hymns.length-1) neighbors.append(link("Next hymn →", `/hymns/${encodeURIComponent(library.hymns[index+1].id)}`));
      content.append(controls, reader, neighbors);
    } else {
      const favorites = read("hymns:favorites", []);
      const recent = read("hymns:recent", []);
      let hymns = library.hymns;
      if (location.pathname === "/favorites") hymns = hymns.filter(h => favorites.includes(h.id));
      if (location.pathname === "/recent") hymns = recent.map(entry => hymns.find(h => h.id === entry.id)).filter(Boolean);
      content.append(element("h1", location.pathname === "/favorites" ? "Favorites" : location.pathname === "/recent" ? "Recent hymns" : "Your offline hymnbook"));
      const input = element("input"); input.type = "search"; input.id = "search"; input.placeholder = "Search number, title, origin, or lyrics…"; input.setAttribute("aria-label", "Search downloaded hymns"); input.value = query;
      const results = element("ul", "", "results");
      function search() {
        results.replaceChildren();
        const needle = input.value.trim().toLocaleLowerCase();
        const matches = hymns.filter(h => `${h.number} ${h.title} ${h.origin || ""} ${h.lyricsText}`.toLocaleLowerCase().includes(needle));
        matches.forEach(h => { const row = element("li"); const a = link("", `/hymns/${encodeURIComponent(h.id)}`); a.append(element("strong", String(h.number)), document.createTextNode(h.title)); row.append(a); results.append(row); });
        if (!matches.length) results.append(element("li", "No hymns found."));
      }
      input.oninput = search; search(); content.append(input, results);
    }
    if (navigator.onLine) { const online = link("Open online hymnbook", location.pathname); online.className = "button"; content.append(online); }
  }
  async function load() { const result = await send("LIBRARY"); library = result.library; render(); }
  async function check() {
    if (!navigator.onLine || !library) return;
    try { await send("CHECK"); await load(); }
    catch { notice.textContent = "Could not check for updates. Your saved hymns are still available."; }
  }
  load().then(check).catch(() => { notice.textContent = "Offline storage is unavailable. Reconnect to open the hymnbook."; });
  // Allow the network stack to settle after the browser announces reconnection.
  window.addEventListener("online", () => setTimeout(check, 1500));
  setInterval(() => { if (document.visibilityState === "visible") void check(); }, 300000);
})();
