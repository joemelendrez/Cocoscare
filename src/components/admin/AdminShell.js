"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { browserSupabase, supabaseConfigured } from "@/lib/supabase";
import { Button, Field, TextInput } from "@/components/admin/AdminUI";
import AdminNav from "@/components/admin/AdminNav";

const AdminContext = createContext(null);

export function useAdmin() {
  return useContext(AdminContext);
}

function Centered({ children }) {
  return (
    <div className="dots-ink flex min-h-screen items-center justify-center bg-blush px-5 py-16">
      <div className="sticker w-full max-w-md rounded-[2rem] bg-paper p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="relative block h-14 w-14">
            <Image src="/coco-logo.webp" alt="" fill sizes="56px" className="object-contain" />
          </span>
          <p className="font-display text-2xl tracking-wide">Coco&rsquo;s Kitchen</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function SignIn({ supabase }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.message === "Invalid login credentials" ? "That email and password don't match." : err.message);
    setBusy(false);
  };

  return (
    <Centered>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <TextInput type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="rounded-2xl bg-pink-soft px-4 py-2 text-sm font-semibold text-pink-deep">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Centered>
  );
}

// Gate for every /admin page: sign in, then only accounts in the admins
// table get through (the database enforces the same rule on every write).
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const supabase = browserSupabase();
  const [state, setState] = useState({ loading: Boolean(supabase), user: null, isAdmin: false });

  const check = useCallback(
    async (session) => {
      if (!session?.user) {
        setState({ loading: false, user: null, isAdmin: false });
        return;
      }
      const { data, error } = await supabase.rpc("is_admin");
      if (error) console.error("is_admin failed", error.message);
      setState({ loading: false, user: session.user, isAdmin: data === true });
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") check(session);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, check]);

  // Tells the live site to refresh these pages now instead of within a minute.
  const refreshSite = useCallback(
    async (paths) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paths }),
      }).catch(() => {});
    },
    [supabase],
  );

  if (!supabaseConfigured) {
    return (
      <Centered>
        <p className="font-semibold">The admin isn&rsquo;t connected to a database yet.</p>
        <p className="mt-2 text-ink/70">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Netlify, then redeploy. The README has the steps.
        </p>
      </Centered>
    );
  }
  if (state.loading) {
    return (
      <Centered>
        <p className="animate-pulse font-semibold text-ink/60">Loading…</p>
      </Centered>
    );
  }
  if (!state.user) return <SignIn supabase={supabase} />;
  if (!state.isAdmin) {
    return (
      <Centered>
        <p className="font-semibold">You&rsquo;re signed in as {state.user.email}, but this account isn&rsquo;t an admin.</p>
        <p className="mt-2 text-ink/70">Ask Joseph to add it to the admins list.</p>
        <Button variant="ghost" className="mt-5" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </Centered>
    );
  }

  return (
    <AdminContext.Provider value={{ supabase, user: state.user, refreshSite }}>
      <div className="min-h-screen bg-blush/60">
        <AdminNav pathname={pathname} email={state.user.email} onSignOut={() => supabase.auth.signOut()} />
        <div className="lg:pl-72">
          <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:pt-8 lg:pb-10">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
