"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GroceryBag, PlannerDoodle } from "@/components/Doodles";
import { deleteAccount, sendSignInLink, signOut, toggleSave, useSaves, useUser } from "@/lib/account";
import { supabaseConfigured } from "@/lib/supabase";

const CARD = "rounded-[2rem] border-[3px] border-ink bg-paper p-6 shadow-[6px_6px_0_var(--shadow)] sm:p-8";
const BUTTON =
  "rounded-full border-[2.5px] border-ink px-6 py-2.5 font-display text-lg tracking-wide shadow-[3px_3px_0_var(--shadow)] disabled:opacity-60";

// Only send people back to a page on this site after signing in.
function safeNext() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default function AccountClient() {
  const user = useUser();
  const router = useRouter();

  // Arriving from the email link signed in: go back to where they were.
  useEffect(() => {
    if (!user) return;
    const next = safeNext();
    if (next) router.replace(next);
  }, [user, router]);

  if (!supabaseConfigured) {
    return (
      <div className={`${CARD} text-center`}>
        <h2 className="font-display text-3xl tracking-wide">Accounts are coming soon</h2>
        <p className="mt-2 font-medium text-ink/75">Everything on the site still works without one, on this device.</p>
      </div>
    );
  }
  if (user === undefined) return <div className={`${CARD} h-64 animate-pulse`} aria-label="Loading" />;
  return user ? <SignedIn user={user} /> : <SignIn />;
}

const PERKS = [
  { emoji: "🛒", title: "Your grocery list everywhere", text: "Make it on the laptop, tick it off on your phone in the store." },
  { emoji: "🗓️", title: "Your meal plan too", text: "Plan the week once and see it on every device." },
  { emoji: "💗", title: "Save recipes and posts", text: "Tap Save on anything you want to find again." },
];

function SignIn() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ sending: false, sent: false, error: "" });

  async function submit(e) {
    e.preventDefault();
    if (state.sending) return;
    setState({ sending: true, sent: false, error: "" });
    const { error } = await sendSignInLink(email, safeNext() || "/account");
    setState({ sending: false, sent: !error, error: error || "" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className={CARD}>
        <AnimatePresence mode="wait" initial={false}>
          {state.sent ? (
            <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-5xl" aria-hidden="true">
                💌
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-wide">Check your email</h2>
              <p className="mt-2 font-medium text-ink/75">
                I sent a sign-in link to <strong>{email.trim()}</strong>. Open it on this device and you&rsquo;re in. It can take
                a minute, so peek in spam too.
              </p>
              <button
                type="button"
                onClick={() => setState({ sending: false, sent: false, error: "" })}
                className="mt-5 text-sm font-semibold text-pink-deep underline"
              >
                Use a different email
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-display text-3xl tracking-wide">Sign in or join</h2>
              <p className="mt-2 font-medium text-ink/75">
                Type your email and I&rsquo;ll send you a link. No password to remember, and it&rsquo;s free.
              </p>
              <label htmlFor="account-email" className="mt-5 block text-sm font-bold">
                Email
              </label>
              <input
                id="account-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-1.5 w-full rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-3 text-lg font-medium outline-none placeholder:text-ink/40 focus:shadow-[3px_3px_0_var(--pink)]"
              />
              {state.error && (
                <p role="alert" className="mt-2 text-sm font-semibold text-pink-deep">
                  {state.error}
                </p>
              )}
              <button type="submit" disabled={state.sending} className={`${BUTTON} mt-4 w-full bg-pink text-paper`}>
                {state.sending ? "Sending…" : "Email me a sign-in link"}
              </button>
              <p className="mt-4 text-xs text-ink/60">
                I only use your email to sign you in. See the{" "}
                <Link href="/privacy" className="underline">
                  privacy policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="underline">
                  terms
                </Link>
                .
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      <ul className="grid content-start gap-4">
        {PERKS.map((p, i) => (
          <li
            key={p.title}
            className={`flex gap-4 rounded-[1.5rem] border-[3px] border-ink p-5 shadow-[4px_4px_0_var(--shadow)] ${["bg-mint", "bg-butter", "bg-blush"][i]}`}
          >
            <span className="text-3xl" aria-hidden="true">
              {p.emoji}
            </span>
            <span>
              <span className="block font-display text-xl tracking-wide">{p.title}</span>
              <span className="mt-0.5 block font-medium text-ink/75">{p.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignedIn({ user }) {
  const saves = useSaves();
  const list = saves ? [...saves.values()] : null;
  const [filter, setFilter] = useState("all");
  const shown = list?.filter((s) => filter === "all" || s.kind === filter) || [];

  return (
    <div className="space-y-6">
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-4`}>
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wider text-ink/55">Signed in as</p>
          <p className="truncate font-display text-2xl tracking-wide">{user.email}</p>
        </div>
        <button type="button" onClick={signOut} className={`${BUTTON} bg-paper`}>
          Sign out
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ToolLink
          href="/tools/grocery-list"
          color="bg-mint"
          icon={<GroceryBag className="h-12 w-12" />}
          title="My grocery list"
        />
        <ToolLink
          href="/tools/meal-planner"
          color="bg-butter"
          icon={<PlannerDoodle className="h-12 w-12" />}
          title="My meal plan"
        />
      </div>

      <section className={CARD} aria-labelledby="saves-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="saves-title" className="font-display text-3xl tracking-wide">
            My saves
          </h2>
          <div className="flex gap-1.5" role="group" aria-label="Show">
            {[
              ["all", "All"],
              ["recipe", "Recipes"],
              ["post", "Posts"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${filter === value ? "bg-ink text-paper" : "hover:bg-blush"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {list === null ? (
          <div className="mt-5 h-24 animate-pulse rounded-2xl bg-blush" />
        ) : shown.length ? (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {shown.map((s) => (
                <motion.li
                  key={`${s.kind}:${s.ref}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 rounded-2xl border-2 border-ink p-2.5"
                >
                  <Link href={s.href} className="flex min-w-0 flex-1 items-center gap-3">
                    {s.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Supabase storage or WordPress URLs
                      <img src={s.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover" />
                    ) : (
                      <span
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-ink bg-blush text-2xl"
                        aria-hidden="true"
                      >
                        {s.kind === "recipe" ? "🍽️" : "📖"}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wider text-ink/55">
                        {s.kind === "recipe" ? "Recipe" : "Post"}
                      </span>
                      <span className="line-clamp-2 font-semibold leading-snug hover:text-pink-deep">{s.title}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleSave(s)}
                    aria-label={`Remove ${s.title} from my saves`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-ink/50 hover:bg-blush hover:text-ink"
                  >
                    ×
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <p className="mt-5 rounded-2xl border-2 border-dashed border-ink/40 p-6 text-center font-medium text-ink/70">
            Nothing saved yet. Tap <strong>Save</strong> on a{" "}
            <Link href="/blog" className="text-pink-deep underline">
              post or recipe
            </Link>{" "}
            and it shows up here.
          </p>
        )}
      </section>

      <DeleteAccount />
    </div>
  );
}

function ToolLink({ href, color, icon, title }) {
  return (
    <Link href={href} className={`sticker lift flex items-center gap-4 rounded-[1.5rem] p-5 text-ink ${color}`}>
      {icon}
      <span>
        <span className="block font-display text-2xl tracking-wide">{title}</span>
        <span className="text-sm font-semibold">Synced to your account ✓</span>
      </span>
    </Link>
  );
}

function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ busy: false, error: "" });

  async function remove() {
    setState({ busy: true, error: "" });
    const { error } = await deleteAccount();
    setState({ busy: false, error: error || "" });
  }

  return (
    <div className="rounded-[1.5rem] border-2 border-dashed border-ink/40 p-5">
      {open ? (
        <div>
          <p className="font-display text-xl tracking-wide">Delete your account?</p>
          <p className="mt-1 text-sm font-medium text-ink/75">
            This removes your email, saves and synced lists for good. Your grocery list and meal plan stay on this device.
          </p>
          {state.error && (
            <p role="alert" className="mt-2 text-sm font-semibold text-pink-deep">
              {state.error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={state.busy}
              className="rounded-full border-2 border-ink bg-pink px-4 py-1.5 text-sm font-bold text-paper disabled:opacity-60"
            >
              {state.busy ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold"
            >
              Keep my account
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-ink/60 underline">
          Delete my account
        </button>
      )}
    </div>
  );
}
