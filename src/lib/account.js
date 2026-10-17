"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { browserSupabase } from "@/lib/supabase";

// Reader accounts (supabase/migrations/0004_accounts.sql). Signing in is an
// email link; the grocery list and meal plan sync through member_data and
// hearts go in saves. Everything still works signed out, on this device.

// The signed-in user, shared by every component: undefined while the
// session loads, then the user or null.
let current;
let shown; // what components see; only changes when the account does
const listeners = new Set();
let started = false;

function start() {
  if (started) return;
  started = true;
  const supabase = browserSupabase();
  if (!supabase) {
    set(null);
    return;
  }
  supabase.auth.getSession().then(({ data }) => set(data.session?.user || null));
  supabase.auth.onAuthStateChange((_event, session) => set(session?.user || null));
}

// Listeners only hear about sign-in, sign-out or a different account, not
// every token refresh.
function set(user) {
  const same = current !== undefined && (user?.id || null) === (current?.id || null);
  current = user;
  if (same) return;
  shown = user;
  listeners.forEach((l) => l());
}

const subscribe = (cb) => {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useUser() {
  return useSyncExternalStore(
    subscribe,
    () => shown,
    () => undefined,
  );
}

export async function sendSignInLink(email, next = "/account") {
  const supabase = browserSupabase();
  if (!supabase) return { error: "Accounts aren't switched on yet." };
  const redirect = new URL("/account", window.location.origin);
  if (next && next !== "/account") redirect.searchParams.set("next", next);
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirect.toString(), shouldCreateUser: true },
  });
  if (!error) return {};
  if (/rate|seconds/i.test(error.message)) return { error: "That was quick! Wait a minute, then send it again." };
  if (/invalid/i.test(error.message)) return { error: "That email doesn't look right. Check it and try again." };
  return { error: "Couldn't send the link. Try again in a minute." };
}

export async function signOut() {
  await browserSupabase()?.auth.signOut();
}

export async function deleteAccount() {
  const supabase = browserSupabase();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: /admin/i.test(error.message) ? error.message : "Couldn't delete your account. Try again." };
  await supabase.auth.signOut();
  return {};
}

// ---- Synced tool data -------------------------------------------------

// Each synced tool keeps { value, savedAt } in one member_data column.
// pullSynced returns the cloud copy (or null); pushSynced saves a newer one.
export async function pullSynced(column) {
  const supabase = browserSupabase();
  if (!supabase || !current) return null;
  const { data, error } = await supabase.from("member_data").select(column).eq("user_id", current.id).maybeSingle();
  if (error) return null;
  return data?.[column] || null;
}

const timers = {};
export function pushSynced(column, value, savedAt) {
  const supabase = browserSupabase();
  if (!supabase || !current) return;
  const userId = current.id;
  clearTimeout(timers[column]);
  timers[column] = setTimeout(() => {
    supabase
      .from("member_data")
      .upsert({ user_id: userId, [column]: { value, savedAt } }, { onConflict: "user_id" })
      .then(({ error }) => error && console.error("Sync failed", error.message));
  }, 800);
}

// Saves a tool's state on this device and, signed in, to the account.
// value: the plain object to keep; loaded: true once the tool has read this
// device's copy; apply(value): load a newer copy from another device.
// The newest copy wins, by savedAt. Returns { user, synced }.
export function useSyncedSave(storageKey, column, value, { loaded, apply }) {
  const user = useUser();
  const [synced, setSynced] = useState(false);
  const last = useRef(null); // { json, savedAt } of what this device holds
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });
  const userId = user?.id;

  // Save on every real change (not on load, so loading never looks newer).
  useEffect(() => {
    if (!loaded) return;
    const json = JSON.stringify(value);
    if (!last.current) {
      let savedAt = 0;
      try {
        savedAt = JSON.parse(localStorage.getItem(storageKey) || "null")?.savedAt || 0;
      } catch {}
      last.current = { json, savedAt };
      return;
    }
    if (json === last.current.json) return;
    const savedAt = Date.now();
    last.current = { json, savedAt };
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ...value, savedAt }));
    } catch {}
    pushSynced(column, value, savedAt);
  }, [value, loaded, storageKey, column]);

  // Signed in: on load and whenever the tab comes back, take the account's
  // copy when it's newer, otherwise send this device's copy up.
  useEffect(() => {
    if (!loaded || !userId) return;
    let live = true;
    async function check() {
      const cloud = await pullSynced(column);
      if (!live || !last.current) return;
      if (cloud?.value && (cloud.savedAt || 0) > last.current.savedAt) {
        last.current = { json: JSON.stringify(cloud.value), savedAt: cloud.savedAt };
        try {
          localStorage.setItem(storageKey, JSON.stringify({ ...cloud.value, savedAt: cloud.savedAt }));
        } catch {}
        applyRef.current(cloud.value);
      } else if (!cloud || (cloud.savedAt || 0) < last.current.savedAt) {
        pushSynced(column, JSON.parse(last.current.json), last.current.savedAt || Date.now());
      }
      setSynced(true);
    }
    check();
    const onShow = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [loaded, userId, column, storageKey]);

  return { user, synced: Boolean(userId) && synced };
}

// ---- Saves -------------------------------------------------------------

let saves = null; // Map key -> row, once loaded for the signed-in user
let savesFor = null;
const saveListeners = new Set();
const emitSaves = () => saveListeners.forEach((l) => l());
const keyOf = (kind, ref) => `${kind}:${ref}`;

async function loadSaves() {
  const supabase = browserSupabase();
  const userId = current?.id;
  if (!supabase || !userId) {
    saves = null;
    savesFor = null;
    emitSaves();
    return;
  }
  if (savesFor === userId && saves) return;
  savesFor = userId;
  const { data } = await supabase.from("saves").select("*").order("created_at", { ascending: false });
  if (savesFor !== userId) return;
  saves = new Map((data || []).map((r) => [keyOf(r.kind, r.ref), r]));
  emitSaves();
}

const subscribeSaves = (cb) => {
  saveListeners.add(cb);
  const unsub = subscribe(() => loadSaves());
  loadSaves();
  return () => {
    saveListeners.delete(cb);
    unsub();
  };
};

let savesSnapshot = { map: null };
saveListeners.add(() => (savesSnapshot = { map: saves }));

export function useSaves() {
  return useSyncExternalStore(
    subscribeSaves,
    () => savesSnapshot,
    () => savesSnapshot,
  ).map;
}

export async function toggleSave(item) {
  const supabase = browserSupabase();
  if (!supabase || !current || !saves) return { error: "signin" };
  const key = keyOf(item.kind, item.ref);
  const had = saves.get(key);
  const next = new Map(saves);
  if (had) next.delete(key);
  else next.set(key, { ...item, created_at: new Date().toISOString() });
  saves = next;
  emitSaves();
  const { error } = had
    ? await supabase.from("saves").delete().match({ user_id: current.id, kind: item.kind, ref: item.ref })
    : await supabase.from("saves").insert({
        user_id: current.id,
        kind: item.kind,
        ref: item.ref,
        title: item.title.slice(0, 200),
        href: item.href.slice(0, 300),
        image_url: item.image_url || null,
      });
  if (error) {
    const undo = new Map(saves);
    if (had) undo.set(key, had);
    else undo.delete(key);
    saves = undo;
    emitSaves();
    return { error: "Couldn't save that. Try again." };
  }
  return { saved: !had };
}
