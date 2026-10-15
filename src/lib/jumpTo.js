const HEADER_GAP = 112;

// Smooth-scrolls a heading to just under the floating header. Photos in the
// post load lazily as the page scrolls past them and push everything below
// down, so one scroll aimed at where the heading was lands short. Each time
// the page comes to rest it checks again and scrolls on, until the heading
// stays put (about 5s at most), or stops at once if the reader scrolls.
function scrollSettled(el) {
  const target = () => el.getBoundingClientRect().top + window.scrollY - HEADER_GAP;
  window.scrollTo({ top: target(), behavior: "smooth" });
  let stopped = false;
  const stop = () => (stopped = true);
  const events = ["wheel", "touchstart", "keydown", "pointerdown"];
  events.forEach((t) => window.addEventListener(t, stop, { once: true, passive: true }));
  let last = window.scrollY;
  let ticks = 0;
  const check = () => {
    const resting = Math.abs(window.scrollY - last) < 1;
    last = window.scrollY;
    if (!stopped && ++ticks < 25) {
      if (resting && Math.abs(el.getBoundingClientRect().top - HEADER_GAP) > 4) {
        window.scrollTo({ top: target(), behavior: "smooth" });
      }
      setTimeout(check, 200);
    } else events.forEach((t) => window.removeEventListener(t, stop));
  };
  setTimeout(check, 200);
}

// A same-page jump (table of contents, "Jump to recipe"): scrolls there,
// puts the #id in the address bar and fires hashchange, which recipe cards
// listen for to open (replaceState doesn't fire it on its own).
export function jumpTo(el) {
  scrollSettled(el);
  history.replaceState(null, "", `#${el.id}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

// onClick for an <a href="#id">.
export function onJumpClick(e) {
  const id = e.currentTarget.getAttribute("href")?.slice(1);
  const el = id && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  jumpTo(el);
}
