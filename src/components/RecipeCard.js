"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Sparkle } from "@/components/Doodles";
import RecipeEmail from "@/components/RecipeEmail";
import { formatAmount, formatClock, formatMinutes } from "@/lib/recipe";

// Two soft chimes, made with Web Audio so there's no sound file to load.
function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 1 ? 1046.5 : 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.65);
    });
    setTimeout(() => ctx.close(), 1600);
  } catch {}
  navigator.vibrate?.([200, 100, 200]);
}

// "Ready at 9:45 PM" while a long wait runs, else how long it is ("2 hr").
function longLabel(t, left, total) {
  if (t?.endsAt) {
    const at = new Date(t.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `Ready at ${at}`;
  }
  if (t?.done) return "Done";
  return formatMinutes(Math.ceil((t ? left : total) / 60)) + (t ? " left" : "");
}

function Stat({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border-[2.5px] border-ink bg-paper px-3 py-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</p>
      <p className="font-display text-lg tracking-wide">{value}</p>
    </div>
  );
}

// Waits this long or more ("freeze 2 hours") show the clock time they'll
// be ready at instead of a ticking countdown, since nobody watches a page
// for two hours.
const LONG_WAIT = 60 * 60;

// timers: { [stepIndex]: { endsAt: number|null, left: seconds, done: bool } }
// Running timers are kept on the device (per recipe), so closing the page
// or locking the phone mid-wait doesn't lose them.
function useStepTimers(steps, storeKey) {
  const [timers, setTimers] = useState({});
  const [now, setNow] = useState(0);
  const running = Object.values(timers).some((t) => t.endsAt);
  const loaded = useRef(false);

  const timersRef = useRef(timers);
  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  useEffect(() => {
    if (!storeKey) return;
    const frame = requestAnimationFrame(() => {
      loaded.current = true;
      try {
        const saved = JSON.parse(localStorage.getItem(storeKey) || "{}");
        const t = Date.now();
        const keep = {};
        for (const [k, v] of Object.entries(saved)) {
          if (!steps[k]?.timer_seconds) continue;
          // A wait that ended while the page was closed shows as done.
          keep[k] = v.endsAt && v.endsAt <= t ? { endsAt: null, left: 0, done: true } : v;
        }
        if (Object.keys(keep).length) {
          setNow(t);
          setTimers(keep);
        }
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [storeKey, steps]);

  useEffect(() => {
    if (!storeKey || !loaded.current) return;
    try {
      // Finished timers aren't worth keeping past this visit.
      const live = Object.fromEntries(Object.entries(timers).filter(([, v]) => !v.done));
      if (Object.keys(live).length) localStorage.setItem(storeKey, JSON.stringify(live));
      else localStorage.removeItem(storeKey);
    } catch {}
  }, [storeKey, timers]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const expired = Object.entries(timersRef.current).filter(([, v]) => v.endsAt && v.endsAt <= t);
      if (!expired.length) return;
      chime();
      setTimers((prev) => {
        const next = { ...prev };
        for (const [k] of expired) if (next[k]?.endsAt) next[k] = { endsAt: null, left: 0, done: true };
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const leftFor = (i) => {
    const t = timers[i];
    if (!t) return steps[i].timer_seconds;
    if (t.endsAt) return Math.max(0, (t.endsAt - (now || Date.now())) / 1000);
    return t.left;
  };

  const start = (i) => {
    const t = Date.now();
    setNow(t);
    setTimers((prev) => {
      const left = prev[i]?.left && !prev[i].done ? prev[i].left : steps[i].timer_seconds;
      return { ...prev, [i]: { endsAt: t + left * 1000, left, done: false } };
    });
  };
  const pause = (i) =>
    setTimers((prev) => ({
      ...prev,
      [i]: { endsAt: null, left: Math.max(0, (prev[i].endsAt - Date.now()) / 1000), done: false },
    }));
  const reset = (i) =>
    setTimers((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });

  return { timers, leftFor, start, pause, reset };
}

const noopSubscribe = () => () => {};

function useWakeLock() {
  const [on, setOn] = useState(false);
  const lock = useRef(null);
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "wakeLock" in navigator,
    () => false,
  );

  useEffect(() => {
    if (!on) return;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock.current = await navigator.wakeLock.request("screen");
      } catch {
        if (!cancelled) setOn(false);
      }
    };
    acquire();
    const onVisible = () => document.visibilityState === "visible" && acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock.current?.release().catch(() => {});
      lock.current = null;
    };
  }, [on]);

  return { supported, on, toggle: () => setOn((v) => !v) };
}

// `anchor` is the card's id for "Jump to recipe" (true = "recipe"); a post
// with several recipes gives each its own (recipe, recipe-2, ...).
// `emailFrom` ({ slug, listOpen }) turns on "Email me this" once recipe
// emails are set up; `pinUrl` saves this recipe's own pin.
export default function RecipeCard({ recipe, pinUrl, anchor = true, emailFrom }) {
  const steps = recipe.steps || [];
  const ingredients = recipe.ingredients || [];
  const base = recipe.servings || 1;
  const [servings, setServings] = useState(base);
  const [have, setHave] = useState(() => new Set());
  const [doneSteps, setDoneSteps] = useState(() => new Set());
  const { timers, leftFor, start, pause, reset } = useStepTimers(steps, recipe.id ? `coco-timers:${recipe.id}` : null);
  const wake = useWakeLock();
  const id = anchor === true ? "recipe" : anchor || undefined;
  // Cards start closed to save scrolling; "Jump to recipe" (a #id link)
  // opens the card it lands on, including on a page loaded with that hash.
  const [open, setOpen] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const canEmail = Boolean(emailFrom?.slug && recipe.id);
  useEffect(() => {
    if (!id) return;
    const check = () => window.location.hash === `#${id}` && setOpen(true);
    const frame = requestAnimationFrame(check);
    window.addEventListener("hashchange", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", check);
    };
  }, [id]);
  const scale = servings / base;
  const total = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);

  const toggle = (setter, i) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section
      id={id}
      aria-label={`Recipe: ${recipe.title}`}
      className="recipe-card sticker scroll-mt-28 overflow-hidden rounded-[2rem] bg-paper"
    >
      <div
        className={`dots relative border-ink bg-pink p-6 text-paper sm:p-8 ${open ? "border-b-[3px]" : "print:border-b-[3px]"}`}
      >
        <span className="sticker-sm inline-flex -rotate-2 items-center gap-1.5 rounded-full bg-butter px-3 py-1 font-display tracking-wide text-ink">
          <Sparkle className="h-4 w-4" fill="var(--paper)" /> Recipe card
        </span>
        <h2 className="mt-3 font-display text-4xl leading-tight tracking-wide text-outline sm:text-5xl">{recipe.title}</h2>
        {recipe.summary && <p className="mt-2 max-w-2xl text-lg font-medium">{recipe.summary}</p>}
        <div className="mt-5 grid grid-cols-3 gap-2 text-ink sm:max-w-md">
          <Stat label="Prep" value={formatMinutes(recipe.prep_minutes)} />
          <Stat label="Cook" value={formatMinutes(recipe.cook_minutes)} />
          <Stat label="Total" value={formatMinutes(total)} />
        </div>
        <div className="no-print mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={id ? `${id}-body` : undefined}
            className="rounded-full border-[2.5px] border-ink bg-butter px-4 py-1.5 font-display tracking-wide text-ink shadow-[3px_3px_0_var(--ink)]"
          >
            {open ? "Hide recipe ▴" : "Show full recipe ▾"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border-[2.5px] border-ink bg-paper px-4 py-1.5 font-display tracking-wide text-ink"
          >
            Print
          </button>
          {canEmail && (
            <button
              type="button"
              onClick={() => setEmailing((v) => !v)}
              aria-expanded={emailing}
              className="rounded-full border-[2.5px] border-ink bg-paper px-4 py-1.5 font-display tracking-wide text-ink"
            >
              Email me this
            </button>
          )}
          {pinUrl && (
            <a
              href={pinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-[2.5px] border-ink bg-ink px-4 py-1.5 font-display tracking-wide text-paper"
            >
              Save to Pinterest
            </a>
          )}
          {wake.supported && (
            <button
              type="button"
              onClick={wake.toggle}
              aria-pressed={wake.on}
              className={`rounded-full border-[2.5px] border-ink px-4 py-1.5 font-display tracking-wide ${wake.on ? "bg-mint text-ink" : "bg-paper/20 text-paper"}`}
            >
              {wake.on ? "Cook mode on: screen stays awake" : "Cook mode"}
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {canEmail && emailing && (
            <RecipeEmail
              slug={emailFrom.slug}
              recipeId={String(recipe.id)}
              anchor={id}
              listOpen={emailFrom.listOpen}
              onClose={() => setEmailing(false)}
            />
          )}
        </AnimatePresence>
      </div>

      <div
        id={id ? `${id}-body` : undefined}
        className={`gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.4fr] ${open ? "grid" : "hidden print:grid"}`}
      >
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-2xl tracking-wide">Ingredients</h3>
            <div className="no-print flex items-center gap-1.5 rounded-full border-[2.5px] border-ink p-1">
              <button
                type="button"
                aria-label="Fewer servings"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-blush font-display text-xl"
              >
                −
              </button>
              <span className="min-w-20 text-center text-sm font-semibold" aria-live="polite">
                {servings} serving{servings === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                aria-label="More servings"
                onClick={() => setServings((s) => Math.min(99, s + 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-blush font-display text-xl"
              >
                +
              </button>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {ingredients.map((ing, i) => {
              const checked = have.has(i);
              return (
                <li key={i}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-blush ${checked ? "text-ink/45 line-through" : ""}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(setHave, i)} className="peer sr-only" />
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-pink ${checked ? "bg-mint" : "bg-paper"}`}
                    >
                      {checked && <span className="text-sm font-bold">✓</span>}
                    </span>
                    <span>
                      {ing.amount != null && <strong className="font-semibold">{formatAmount(ing.amount * scale)} </strong>}
                      {ing.unit && <strong className="font-semibold">{ing.unit} </strong>}
                      {ing.item}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-2xl tracking-wide">Steps</h3>
          <ol className="mt-4 space-y-4">
            {steps.map((step, i) => {
              const done = doneSteps.has(i);
              const t = timers[i];
              const left = step.timer_seconds ? leftFor(i) : 0;
              const progress = step.timer_seconds ? 1 - left / step.timer_seconds : 0;
              const long = step.timer_seconds >= LONG_WAIT;
              return (
                <li
                  key={i}
                  className={`rounded-[1.5rem] border-[2.5px] border-ink p-4 transition-colors ${done ? "bg-mint/40" : "bg-paper"}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(setDoneSteps, i)}
                      aria-pressed={done}
                      aria-label={`Step ${i + 1} ${done ? "done" : "not done"}`}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-[2.5px] border-ink font-display text-lg ${done ? "bg-mint" : "bg-butter"}`}
                    >
                      {done ? "✓" : i + 1}
                    </button>
                    <p className={`pt-1 text-lg leading-relaxed ${done ? "text-ink/55" : ""}`}>{step.text}</p>
                  </div>
                  {step.timer_seconds > 0 && (
                    <div className="no-print mt-3 flex flex-wrap items-center gap-2 pl-12">
                      <div className="relative h-10 min-w-28 overflow-hidden rounded-full border-[2.5px] border-ink bg-blush">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-pink"
                          animate={{ width: `${Math.min(100, progress * 100)}%` }}
                          transition={{ ease: "linear", duration: 0.25 }}
                        />
                        <span
                          className={`relative grid h-full place-items-center px-4 font-display text-lg tabular-nums tracking-wide ${progress > 0.5 ? "text-paper" : ""}`}
                          aria-live="off"
                        >
                          {long ? longLabel(t, left, step.timer_seconds) : formatClock(left)}
                        </span>
                      </div>
                      {long && t?.endsAt && (
                        <span className="text-sm font-semibold text-ink/70">{formatMinutes(Math.ceil(left / 60))} left</span>
                      )}
                      {t?.endsAt ? (
                        <button
                          type="button"
                          onClick={() => pause(i)}
                          className="rounded-full border-[2.5px] border-ink bg-butter px-4 py-1.5 font-display tracking-wide"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => start(i)}
                          className="rounded-full border-[2.5px] border-ink bg-ink px-4 py-1.5 font-display tracking-wide text-paper"
                        >
                          {t?.done ? "Again" : t ? "Resume" : "Start timer"}
                        </button>
                      )}
                      {t && (
                        <button
                          type="button"
                          onClick={() => reset(i)}
                          className="rounded-full px-3 py-1.5 font-semibold text-ink/60 underline-offset-2 hover:underline"
                        >
                          Reset
                        </button>
                      )}
                      <AnimatePresence>
                        {t?.done && (
                          <motion.span
                            role="status"
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            className="flex items-center gap-1 rounded-full border-[2.5px] border-ink bg-mint px-3 py-1 font-display tracking-wide"
                          >
                            Time&rsquo;s up! <Heart className="h-4 w-4" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {recipe.tips && (
            <div className="mt-6 rounded-[1.5rem] border-[2.5px] border-dashed border-ink bg-butter/30 p-4">
              <p className="font-display text-lg tracking-wide">Coco&rsquo;s tips</p>
              <p className="mt-1 whitespace-pre-line">{recipe.tips}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
