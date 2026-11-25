/* Offline presentation uses the saved sections and a same-origin audience window. */
window.HymnOfflinePresentation = {
  start(hymn, onEnd) {
    const ordered = hymn.sections.filter(section => section.lines.some(line => line.trim()));
    const refrains = ordered.filter(section => section.type === "refrain");
    const slides = [];
    ordered.forEach(section => {
      if (slides[slides.length - 1] !== section) slides.push(section);
      if (section.type === "verse") {
        const refrain = refrains.find(item => item.number === section.number) || refrains[0];
        if (refrain) slides.push(refrain);
      }
    });
    if (!slides.length) return;
    let index = 0, blank = false, size = 1, audience = null, ended = false;
    const host = document.createElement("div");
    host.className = "offline-presenter";
    host.setAttribute("role", "region");
    host.setAttribute("aria-label", "Offline presenter");
    document.body.classList.add("presenting");
    document.body.append(host);
    const heading = section => section.type === "refrain" ? "Refrain" : String(section.number ?? 1);
    function node(doc, tag, text, className) {
      const value = doc.createElement(tag);
      if (text) value.textContent = text;
      if (className) value.className = className;
      return value;
    }
    function button(doc, text, action) {
      const value = node(doc, "button", text);
      value.type = "button"; value.onclick = action; return value;
    }
    function frame(doc, section, hidden) {
      const value = node(doc, "div", "", "offline-slide");
      if (!hidden && section) {
        value.append(node(doc, "p", `Hymn ${hymn.number} · ${hymn.title}`, "slide-title"));
        value.append(node(doc, "h2", heading(section)));
        const lyrics = node(doc, "p", section.lines.join("\n"), "slide-lyrics");
        window.renderHymnLyrics(lyrics, section);
        value.append(lyrics);
        doc.defaultView.requestAnimationFrame(() => {
          if (!lyrics.isConnected) return;
          let pixels = Math.min(96 * size, value.clientHeight * 0.13 * size);
          do { lyrics.style.fontSize = `${pixels}px`; pixels -= 1; }
          while (pixels > 8 && (value.scrollHeight > value.clientHeight + 1 || lyrics.scrollWidth > lyrics.clientWidth + 1));
        });
      }
      return value;
    }
    function fullscreen() {
      if (!audience || audience.closed) return;
      audience.focus();
      if (audience.document.fullscreenElement) return;
      void audience.document.documentElement.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {
        status.textContent = "Click anywhere in the audience window, or press F there, to enter fullscreen.";
      });
    }
    function drawAudience() {
      if (!audience || audience.closed) return;
      const doc = audience.document;
      doc.body.replaceChildren(frame(doc, slides[index], blank));
    }
    function openAudience() {
      if (audience && !audience.closed) { fullscreen(); return; }
      audience = window.open("", "hymn-offline-audience", "popup,width=1280,height=720");
      if (!audience) { status.textContent = "Allow popups, then choose Open audience window."; return; }
      const doc = audience.document;
      doc.title = `${hymn.number}. ${hymn.title} — Audience`;
      // An about:blank popup has no service-worker controller. Copy the already
      // loaded styles instead of requesting a stylesheet over the offline network.
      const stylesheet = node(doc, "style");
      stylesheet.textContent = Array.from(document.styleSheets).flatMap(sheet => {
        try { return Array.from(sheet.cssRules, rule => rule.cssText); }
        catch { return []; }
      }).join("\n");
      doc.head.replaceChildren(node(doc, "title", doc.title), stylesheet);
      doc.documentElement.style.background = "#000";
      doc.body.className = "offline-audience";
      doc.addEventListener("click", () => { if (!doc.fullscreenElement) fullscreen(); });
      doc.addEventListener("keydown", event => {
        if (!doc.fullscreenElement && !event.ctrlKey && !event.altKey && !event.metaKey && ["f", "enter"].includes(event.key.toLowerCase())) {
          event.preventDefault(); fullscreen();
        }
      });
      audience.addEventListener("keydown", keydown);
      audience.addEventListener("resize", drawAudience);
      doc.addEventListener("fullscreenchange", drawAudience);
      drawAudience();
      status.textContent = "Move the audience window to your projector, then click anywhere in it to enter fullscreen.";
      fullscreen();
    }
    async function detect() {
      if (!window.getScreenDetails) { status.textContent = "Move the audience window to your projector manually."; return; }
      openAudience();
      try {
        const details = await window.getScreenDetails();
        const screen = details.screens.find(item => item !== details.currentScreen && !item.isPrimary)
          || details.screens.find(item => item !== details.currentScreen);
        if (!screen) { status.textContent = "No additional display detected. Your preview is available."; return; }
        openAudience();
        if (audience) {
          audience.moveTo(screen.availLeft, screen.availTop);
          audience.resizeTo(screen.availWidth, screen.availHeight);
          try { await audience.document.documentElement.requestFullscreen({ navigationUI: "hide", screen }); }
          catch { status.textContent = "Audience moved. Click anywhere in the audience window to enter fullscreen."; }
        }
      } catch { status.textContent = "Display access unavailable. Move the audience window manually."; }
    }
    function move(change) { index = Math.max(0, Math.min(slides.length - 1, index + change)); draw(); }
    function end() {
      if (ended) return;
      ended = true; clearInterval(closedTimer);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", draw);
      window.removeEventListener("pagehide", end);
      if (audience && !audience.closed) audience.close();
      host.remove(); document.body.classList.remove("presenting"); onEnd();
    }
    function keydown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (["ArrowRight", "ArrowDown", " "].includes(event.key)) { event.preventDefault(); move(1); }
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); move(-1); }
      if (event.key.toLowerCase() === "b") { blank = !blank; draw(); }
      if (event.key === "Escape") end();
    }
    const status = node(document, "p", "", "present-status");
    status.setAttribute("role", "status");
    function draw() {
      host.replaceChildren();
      const title = node(document, "div", "", "present-bar");
      title.append(node(document, "strong", `${hymn.number}. ${hymn.title}`), button(document, "End presentation", end));
      const displays = node(document, "div", "", "present-bar");
      displays.append(status, button(document, "Open audience window", openAudience), button(document, "Detect displays", detect), button(document, "Fullscreen audience", fullscreen));
      const body = node(document, "div", "", "present-columns");
      const current = node(document, "div", "", "present-current");
      current.append(node(document, "p", `Live audience preview · ${index + 1} / ${slides.length}`), frame(document, slides[index], blank));
      const next = node(document, "aside", "", "present-next");
      next.append(node(document, "p", "Up next"), frame(document, slides[index + 1], false));
      const navigation = node(document, "div", "", "present-slides");
      slides.forEach((slide, position) => {
        const item = button(document, `${position + 1}. ${heading(slide)}`, () => { index = position; draw(); });
        item.setAttribute("aria-pressed", String(position === index)); navigation.append(item);
      });
      next.append(navigation); body.append(current, next);
      const controls = node(document, "div", "", "present-bar");
      const previous = button(document, "Previous slide", () => move(-1)); previous.disabled = index === 0;
      const following = button(document, "Next slide", () => move(1)); following.disabled = index === slides.length - 1;
      controls.append(previous, following, button(document, blank ? "Show audience screen" : "Blank audience screen", () => { blank = !blank; draw(); }), button(document, "A−", () => { size = Math.max(0.5, size - 0.1); draw(); }), button(document, "A+", () => { size = Math.min(2, size + 0.1); draw(); }));
      host.append(title, displays, body, controls); drawAudience();
    }
    const closedTimer = setInterval(() => { if (audience?.closed) status.textContent = "Audience window closed. Your preview is still available."; }, 1000);
    window.addEventListener("keydown", keydown);
    window.addEventListener("resize", draw);
    window.addEventListener("pagehide", end);
    draw(); openAudience();
  },
};
