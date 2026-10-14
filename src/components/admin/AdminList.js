"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import { Notice, Segmented, StatusPill } from "@/components/admin/AdminUI";

// One list screen for posts, recipes and products: filter by status, tap a
// row to edit, "New" to start one.
export default function AdminList({ table, title, newHref, newLabel, select, statuses, render, emptyText, intro }) {
  const { supabase } = useAdmin();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let live = true;
    supabase
      .from(table)
      .select(select)
      .order("updated_at", { ascending: false })
      .limit(500)
      .then(({ data, error: err }) => {
        if (!live) return;
        if (err) setError(err.message);
        setRows(data || []);
      });
    return () => {
      live = false;
    };
  }, [supabase, table, select]);

  const shown = rows ? (filter === "all" ? rows : rows.filter((r) => r.status === filter)) : [];
  const counts = Object.fromEntries(statuses.map((s) => [s.value, rows?.filter((r) => r.status === s.value).length || 0]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide">{title}</h1>
          {intro && <p className="mt-1 text-ink/70">{intro}</p>}
        </div>
        <Link
          href={newHref}
          className="rounded-full border-[2.5px] border-ink bg-pink px-5 py-2.5 font-display tracking-wide text-paper shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5"
        >
          + {newLabel}
        </Link>
      </div>

      <Segmented
        label="Filter"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All${rows ? ` (${rows.length})` : ""}` },
          ...statuses.map((s) => ({ value: s.value, label: `${s.label} (${counts[s.value]})` })),
        ]}
      />

      <Notice notice={error ? { type: "error", text: error } : null} />

      {rows === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[1.5rem] border-[3px] border-ink/20 bg-paper" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-[1.5rem] border-[3px] border-dashed border-ink/40 bg-paper p-8 text-center text-ink/60">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((row) => (
            <li key={row.id}>
              <Link
                href={`${newHref.replace(/\/new$/, "")}/${row.id}`}
                className="flex items-center gap-4 rounded-[1.5rem] border-[3px] border-ink bg-paper p-3 pr-5 transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)]"
              >
                {render(row)}
                <StatusPill status={row.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RowThumb({ src, fallback }) {
  return (
    <span className="dots-ink grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-[2.5px] border-ink bg-blush text-xl">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- storage URLs
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        fallback
      )}
    </span>
  );
}

export function RowText({ title, sub }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-display text-lg tracking-wide">{title}</span>
      {sub && <span className="block truncate text-sm text-ink/60">{sub}</span>}
    </span>
  );
}

export function ago(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
