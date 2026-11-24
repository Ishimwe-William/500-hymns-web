export interface PresentationScreen {
  left: number; top: number; width: number; height: number;
  availLeft: number; availTop: number; availWidth: number; availHeight: number;
  isInternal?: boolean; isPrimary?: boolean; label?: string;
}
export interface PresentationScreens extends EventTarget {
  screens: PresentationScreen[];
  currentScreen: PresentationScreen;
}
export interface AudienceWindow {
  window: Window;
  root: HTMLDivElement;
}

export function chooseAudienceScreen(details: Pick<PresentationScreens, "screens" | "currentScreen">) {
  const others = details.screens.filter((screen) => screen.left !== details.currentScreen.left || screen.top !== details.currentScreen.top);
  return others.find((screen) => !screen.isInternal) ?? others[0] ?? null;
}
export function screenKey(screen: PresentationScreen) { return `${screen.left},${screen.top}`; }
export function screenLabel(screen: PresentationScreen) { return screen.label || `${screen.width} x ${screen.height}${screen.isInternal ? " (built-in)" : ""}`; }

export function openAudienceWindow(): AudienceWindow | null {
  const audience = window.open("", `hymn-audience-${crypto.randomUUID()}`, "popup=yes,width=1280,height=720");
  if (!audience) return null;
  const doc = audience.document;
  doc.title = "Hymn presentation - Audience";
  doc.documentElement.className = document.documentElement.className;
  doc.documentElement.style.background = "#000";
  doc.body.style.cssText = "margin:0;background:#000;overflow:hidden;";
  doc.body.style.fontFamily = getComputedStyle(document.body).fontFamily;
  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => doc.head.appendChild(node.cloneNode(true)));
  const favicon = doc.createElement("link"); favicon.rel = "icon"; favicon.href = `${location.origin}/icon.png`; doc.head.appendChild(favicon);
  const root = doc.createElement("div"); root.style.cssText = "width:100vw;height:100vh;background:#000;";
  doc.body.appendChild(root);
  const output = { window: audience, root };
  // Native listeners keep the activation in the audience document. Projection
  // has no visible controls; one click (or F/Enter) retries if auto-entry is denied.
  doc.addEventListener("click", () => {
    if (!doc.fullscreenElement) void fullscreenAudience(output);
  });
  doc.addEventListener("keydown", (event) => {
    if (!doc.fullscreenElement && !event.ctrlKey && !event.altKey && !event.metaKey && ["f", "enter"].includes(event.key.toLowerCase())) {
      event.preventDefault();
      void fullscreenAudience(output);
    }
  });
  // Request during the Present click, before asynchronous display detection.
  void fullscreenAudience(output);
  return output;
}

export async function getPresentationScreens(): Promise<PresentationScreens | null> {
  const manager = window as Window & { getScreenDetails?: () => Promise<PresentationScreens> };
  return manager.getScreenDetails ? manager.getScreenDetails() : null;
}

export async function fullscreenAudience(output: AudienceWindow, screen?: PresentationScreen | null) {
  if (output.window.closed) return false;
  try {
    if (!screen && output.window.document.fullscreenElement) return true;
    if (screen) {
      output.window.moveTo(screen.availLeft, screen.availTop);
      output.window.resizeTo(screen.availWidth, screen.availHeight);
    }
    output.window.focus();
    await output.window.document.documentElement.requestFullscreen({ navigationUI: "hide", ...(screen ? { screen } : {}) } as FullscreenOptions);
    return true;
  } catch { return false; }
}
