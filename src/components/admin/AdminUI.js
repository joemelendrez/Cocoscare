"use client";

import { useId, useRef, useState } from "react";

// Small form kit for /admin, in the site's sticker style but calmer.

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block font-display tracking-wide">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-ink/60">{hint}</span>}
    </label>
  );
}

const inputCls =
  "rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-2.5 text-base outline-none transition-shadow focus:shadow-[3px_3px_0_var(--pink)]";

// Full width unless the caller sets its own width (w-16, w-24…).
const width = (className) => (/(^|\s)w-/.test(className) ? "" : "w-full");

export function TextInput({ className = "", ...props }) {
  return <input className={`${inputCls} ${width(className)} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`${inputCls} ${width(className)} leading-relaxed ${className}`} {...props} />;
}

export function Select({ options, className = "", ...props }) {
  return (
    <select className={`${inputCls} w-full ${className}`} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const BUTTON = {
  primary: "border-ink bg-pink text-paper shadow-[3px_3px_0_var(--shadow)] hover:-translate-y-0.5",
  dark: "border-ink bg-ink text-paper shadow-[3px_3px_0_var(--pink)] hover:-translate-y-0.5",
  ghost: "border-ink bg-paper hover:bg-blush",
  danger: "border-pink-deep bg-paper text-pink-deep hover:bg-pink-soft",
};

export function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full border-[2.5px] px-5 py-2.5 font-display tracking-wide transition-transform disabled:pointer-events-none disabled:opacity-50 ${BUTTON[variant]} ${className}`}
      {...props}
    />
  );
}

export const STATUS_LABEL = { draft: "Draft", review: "Ready for review", published: "Live" };
const STATUS_CLS = { draft: "bg-paper", review: "bg-butter", published: "bg-mint" };

export function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_CLS[status] || "bg-paper"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full border-[2.5px] border-ink bg-paper p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${value === o.value ? "bg-ink text-paper" : "hover:bg-blush"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ title, children, className = "", aside }) {
  return (
    <section className={`rounded-[1.75rem] border-[3px] border-ink bg-paper p-5 sm:p-6 ${className}`}>
      {(title || aside) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-2xl tracking-wide">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Notice({ notice }) {
  if (!notice) return null;
  return (
    <p
      role={notice.type === "error" ? "alert" : "status"}
      className={`rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold ${
        notice.type === "error" ? "border-pink-deep bg-pink-soft text-pink-deep" : "border-ink bg-mint/50"
      }`}
    >
      {notice.text}
    </p>
  );
}

export function friendlyError(error) {
  if (!error) return "";
  if (error.code === "23505") return "That link name is already used. Change the link name and save again.";
  if (error.code === "23514") return "Something in the form isn't allowed. Check the link name (lowercase letters, numbers, dashes) and the shop link (must start with https://).";
  return error.message || "Something went wrong. Try again.";
}

// Shrinks a photo to at most 1600px wide JPEG on the device before upload.
async function shrink(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob || file;
  } catch {
    return file;
  }
}

// Uploads a photo to the public media bucket; returns { url } or { error }.
export async function uploadPhoto(supabase, folder, file) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return { error: "Pick a JPG, PNG or WebP photo." };
  const blob = await shrink(file);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) return { error: error.message };
  return { url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl };
}

export function PhotoInput({ supabase, folder, value, onChange, label = "Photo" }) {
  const id = useId();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    const { url, error: err } = await uploadPhoto(supabase, folder, file);
    if (err) setError(err);
    else onChange(url);
    setBusy(false);
  };

  return (
    <div>
      <span className="mb-1.5 block font-display tracking-wide" id={`${id}-label`}>
        {label}
      </span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-labelledby={`${id}-label`}
          className="dots-ink relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[1.25rem] border-[2.5px] border-dashed border-ink bg-blush text-sm font-semibold"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- just-uploaded storage URL
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : busy ? (
            "Uploading…"
          ) : (
            "+ Add photo"
          )}
        </button>
        <div className="space-y-2 text-sm">
          <Button variant="ghost" className="py-1.5 text-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "Uploading…" : value ? "Change photo" : "Choose photo"}
          </Button>
          {value && !busy && (
            <button type="button" className="block font-semibold text-ink/60 hover:underline" onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-pink-deep">{error}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Two taps to delete, so a stray tap never loses work.
export function DeleteButton({ onDelete, label = "Delete" }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!armed) {
    return (
      <Button variant="danger" onClick={() => setArmed(true)}>
        {label}
      </Button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant="danger"
        className="bg-pink-soft"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await onDelete();
          if (!ok) {
            setBusy(false);
            setArmed(false);
          }
        }}
      >
        {busy ? "Deleting…" : "Yes, delete it"}
      </Button>
      <Button variant="ghost" onClick={() => setArmed(false)}>
        Keep it
      </Button>
    </span>
  );
}

export function RowTools({ index, count, onMove, onRemove, label }) {
  const btn = "grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-paper text-sm font-bold disabled:opacity-30";
  return (
    <span className="flex shrink-0 gap-1">
      <button type="button" className={btn} aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index, -1)}>
        ↑
      </button>
      <button type="button" className={btn} aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(index, 1)}>
        ↓
      </button>
      <button type="button" className={`${btn} text-pink-deep`} aria-label={`Remove ${label}`} onClick={() => onRemove(index)}>
        ✕
      </button>
    </span>
  );
}

export function moveItem(list, index, dir) {
  const next = [...list];
  const to = index + dir;
  if (to < 0 || to >= next.length) return list;
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

// A card's code ({{product:…}} / {{recipe:…}}) with a Copy button, to paste
// on its own line anywhere in a post. `compact` is the small list version.
export function CopyCode({ code, compact = false, disabled = false }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the code is on screen to copy by hand */
    }
  };
  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        disabled={disabled}
        title={`Copy ${code} to paste into a post`}
        className="shrink-0 rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-semibold hover:bg-blush disabled:opacity-50"
      >
        {copied ? "Copied!" : "Copy card"}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="max-w-full break-all rounded-xl border-2 border-ink bg-blush px-3 py-2 font-mono text-sm">{code}</code>
      <Button variant="ghost" className="py-1.5 text-sm" onClick={copy} disabled={disabled}>
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}

// Calls one of the /api/admin routes as the signed-in admin. Throws with the
// route's own error message.
export async function adminFetch(supabase, path, init = {}) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong. Try again.");
  return json;
}

// A page title with an optional line under it and buttons on the right.
export function PageTitle({ title, intro, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-4xl tracking-wide">{title}</h1>
        {intro && <p className="mt-1 text-ink/70">{intro}</p>}
      </div>
      {children}
    </div>
  );
}
