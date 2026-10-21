"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import { Button, Notice, PageTitle, Segmented, TextInput, adminFetch } from "@/components/admin/AdminUI";

const STATUS = { subscribed: "Subscribed", unsubscribed: "Unsubscribed", cleaned: "Bounced", pending: "Pending" };
const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

// Everyone on the blog's Mailchimp list, read from Mailchimp. Signups are
// tagged "blog" plus where they came from (home, or a post's category).
export default function AdminSubscribers() {
  const { supabase } = useAdmin();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("subscribed");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    adminFetch(supabase, "/api/admin/subscribers")
      .then((json) => live && setState(json))
      .catch((err) => {
        if (!live) return;
        setError(err.message);
        setState({ configured: true, members: [] });
      });
    return () => {
      live = false;
    };
  }, [supabase]);

  const members = useMemo(() => state?.members || [], [state]);
  const counts = useMemo(() => members.reduce((acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }), {}), [members]);
  const bySource = useMemo(() => {
    const out = {};
    for (const m of members) {
      if (m.status !== "subscribed") continue;
      for (const t of m.tags.filter((t) => t !== "blog")) out[t] = (out[t] || 0) + 1;
    }
    return Object.entries(out).sort((a, b) => b[1] - a[1]);
  }, [members]);
  const q = query.trim().toLowerCase();
  const shown = members.filter((m) => (filter === "all" || m.status === filter) && (!q || m.email.includes(q)));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown.map((m) => m.email).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Your browser blocked copying. Select the emails below by hand.");
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        title="Subscribers"
        intro="Everyone on the email list, straight from Mailchimp. Signups are tagged with where they joined."
      >
        {shown.length > 0 && (
          <Button variant="ghost" onClick={copy}>
            {copied ? "Copied!" : `Copy ${shown.length} email${shown.length === 1 ? "" : "s"}`}
          </Button>
        )}
      </PageTitle>

      <Notice notice={error ? { type: "error", text: error } : null} />

      {state && !state.configured && (
        <p className="rounded-[1.5rem] border-[3px] border-dashed border-ink/40 bg-paper p-6 text-ink/70">
          The list isn&rsquo;t connected yet. Add MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID on Netlify and redeploy.
        </p>
      )}

      {state === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[1.5rem] border-[3px] border-ink/20 bg-paper" />
          ))}
        </div>
      ) : (
        state.configured && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="On the list" value={counts.subscribed || 0} color="bg-mint" />
              <Stat label="New in 30 days" value={state.newLast30 ?? 0} color="bg-butter" />
              <Stat
                label="Unsubscribed"
                value={counts.unsubscribed || 0}
                color="bg-periwinkle"
                className="col-span-2 sm:col-span-1"
              />
            </div>
            {bySource.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="self-center text-sm font-semibold text-ink/60">Joined from:</span>
                {bySource.map(([tag, n]) => (
                  <span key={tag} className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-semibold">
                    {tag} · {n}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                label="Filter"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "subscribed", label: `Subscribed (${counts.subscribed || 0})` },
                  { value: "unsubscribed", label: `Unsubscribed (${counts.unsubscribed || 0})` },
                  { value: "all", label: `All (${members.length})` },
                ]}
              />
              <TextInput
                type="search"
                placeholder="Find an email"
                aria-label="Find an email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            {state.total > members.length && (
              <p className="text-sm text-ink/60">
                Showing the newest {members.length} of {state.total}. Mailchimp has the rest.
              </p>
            )}
            {shown.length === 0 ? (
              <p className="rounded-[1.5rem] border-[3px] border-dashed border-ink/40 bg-paper p-8 text-center text-ink/60">
                {members.length ? "Nobody matches that." : "No signups yet. They'll show up here as people join."}
              </p>
            ) : (
              <ul className="divide-y-2 divide-dashed divide-ink/20 rounded-[1.5rem] border-[3px] border-ink bg-paper">
                {shown.map((m) => (
                  <li key={m.email} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
                    <span className="min-w-0 break-all font-semibold">{m.email}</span>
                    <span className="text-sm text-ink/60">
                      {[
                        m.status !== "subscribed" && STATUS[m.status],
                        m.tags.filter((t) => t !== "blog").join(", "),
                        m.joined && fmt.format(new Date(m.joined)),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}
    </div>
  );
}

function Stat({ label, value, color, className = "" }) {
  return (
    <div className={`rounded-[1.5rem] border-[3px] border-ink p-4 ${color} ${className}`}>
      <p className="font-display text-4xl tracking-wide text-ink">{value}</p>
      <p className="text-sm font-semibold text-ink/80">{label}</p>
    </div>
  );
}
