"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import {
  Button,
  Card,
  DeleteButton,
  Field,
  Notice,
  PageTitle,
  Segmented,
  Select,
  TextArea,
  TextInput,
  adminFetch,
} from "@/components/admin/AdminUI";
import { NEWSLETTER_LIMITS, newsletterHtml, postBlock } from "@/lib/newsletterEmail";

const STORE = "cocoscare-newsletter-draft";
const EMPTY = { id: null, subject: "", preheader: "", heading: "", markdown: "" };
const STATUS = { save: "Draft", schedule: "Scheduled", sending: "Sending", sent: "Sent", paused: "Paused" };
const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const pct = (n) => (n == null ? "" : `${Math.round(n * 100)}%`);

// Write an issue, see it in the newsletter design, send yourself a test, and
// save it as a draft campaign in Mailchimp, where it gets sent or scheduled.
// The issue in progress is kept on this device until it's cleared.
export default function AdminNewsletter() {
  const { supabase } = useAdmin();
  const [issue, setIssue] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("desktop");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);
  const [lastUrl, setLastUrl] = useState("");
  const [list, setList] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pick, setPick] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this device's saved draft once
      if (saved && typeof saved === "object") setIssue({ ...EMPTY, ...saved });
    } catch {
      /* storage blocked; start empty */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(issue));
    } catch {
      /* storage blocked; the draft just isn't kept */
    }
  }, [issue, loaded]);

  const loadList = useCallback(
    () =>
      adminFetch(supabase, "/api/admin/newsletter")
        .then(setList)
        .catch((err) => setList({ error: err.message, campaigns: [] })),
    [supabase],
  );

  useEffect(() => {
    loadList();
    supabase
      .from("posts")
      .select("slug, title, excerpt, cover_url")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setPosts(data || []));
  }, [supabase, loadList]);

  const set = (key) => (e) => setIssue((i) => ({ ...i, [key]: e.target.value }));
  const html = useMemo(() => newsletterHtml(issue, { preview: true }), [issue]);

  const addPost = () => {
    const post = posts.find((p) => p.slug === pick);
    if (!post) return;
    setIssue((i) => ({ ...i, markdown: `${i.markdown.trimEnd()}${i.markdown.trim() ? "\n\n" : ""}${postBlock(post)}\n` }));
    setPick("");
  };

  const save = async (action) => {
    if (busy) return;
    setBusy(action);
    setNotice(null);
    try {
      const json = await adminFetch(supabase, "/api/admin/newsletter", {
        method: "POST",
        body: JSON.stringify({ action, ...issue }),
      });
      setIssue((i) => ({ ...i, id: json.id }));
      setLastUrl(json.url || "");
      setNotice({ type: "success", text: json.message });
      loadList();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy("");
    }
  };

  // Clears this device's copy only; anything saved to Mailchimp stays there.
  // Returns false so the two-tap button resets for the next issue.
  const startOver = () => {
    setIssue(EMPTY);
    setLastUrl("");
    setNotice(null);
    return false;
  };

  const ready = issue.subject.trim() && issue.markdown.trim();

  return (
    <div className="space-y-5">
      <PageTitle
        title="Newsletter"
        intro={`Write it here, check it on a phone, send yourself a test, then send it from Mailchimp.${
          list?.subscribers != null ? ` ${list.subscribers} people on the list.` : ""
        }`}
      >
        {(issue.subject || issue.markdown) && <DeleteButton label="Start a new issue" onDelete={startOver} />}
      </PageTitle>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Write">
          <div className="space-y-4">
            <Field label="Subject" hint="What shows in the inbox. Short and specific works best.">
              <TextInput value={issue.subject} onChange={set("subject")} maxLength={NEWSLETTER_LIMITS.subject} />
            </Field>
            <Field label="Preview line" hint="The grey line after the subject in most inboxes.">
              <TextInput value={issue.preheader} onChange={set("preheader")} maxLength={NEWSLETTER_LIMITS.preheader} />
            </Field>
            <Field label="Heading" hint="The big words in the pink band. Leave empty to use the subject.">
              <TextInput value={issue.heading} onChange={set("heading")} maxLength={NEWSLETTER_LIMITS.heading} />
            </Field>
            <Field
              label="Message"
              hint="Markdown: a blank line between paragraphs, ## for a heading, - for a list, [words](https://link) for a link."
            >
              <TextArea rows={14} value={issue.markdown} onChange={set("markdown")} maxLength={NEWSLETTER_LIMITS.markdown} />
            </Field>
            {posts.length > 0 && (
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Add a post" className="min-w-0 flex-1">
                  <Select
                    value={pick}
                    onChange={(e) => setPick(e.target.value)}
                    options={[
                      { value: "", label: "Pick a live post…" },
                      ...posts.map((p) => ({ value: p.slug, label: p.title })),
                    ]}
                  />
                </Field>
                <Button variant="ghost" onClick={addPost} disabled={!pick}>
                  Add
                </Button>
              </div>
            )}
            <Notice notice={notice} />
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => save("test")} disabled={!ready || Boolean(busy)}>
                {busy === "test" ? "Sending test…" : "Send me a test"}
              </Button>
              <Button onClick={() => save("draft")} disabled={!ready || Boolean(busy)}>
                {busy === "draft" ? "Saving…" : issue.id ? "Update draft in Mailchimp" : "Save draft in Mailchimp"}
              </Button>
              {lastUrl && (
                <a
                  href={lastUrl}
                  target="_blank"
                  rel="noopener"
                  className="self-center px-2 text-sm font-semibold text-pink-deep underline-offset-2 hover:underline"
                >
                  Open in Mailchimp ↗
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card
          title="Preview"
          aside={
            <Segmented
              label="Preview size"
              value={view}
              onChange={setView}
              options={[
                { value: "desktop", label: "Desktop" },
                { value: "phone", label: "Phone" },
              ]}
            />
          }
        >
          <div className="overflow-hidden rounded-[1.25rem] border-[2.5px] border-ink bg-blush">
            <iframe
              title="Newsletter preview"
              srcDoc={html}
              sandbox=""
              className="mx-auto block h-[640px] bg-white transition-[width]"
              style={{ width: view === "phone" ? 375 : "100%", maxWidth: "100%" }}
            />
          </div>
        </Card>
      </div>

      <Card title="Recent newsletters">
        {list === null ? (
          <div className="h-16 animate-pulse rounded-2xl bg-blush" aria-busy="true" />
        ) : list.error ? (
          <Notice notice={{ type: "error", text: list.error }} />
        ) : list.campaigns.length === 0 ? (
          <p className="text-ink/60">Nothing yet. Drafts you save here show up in this list.</p>
        ) : (
          <ul className="space-y-2">
            {list.campaigns.map((c) => (
              <li key={c.id}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener"
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border-2 border-ink px-4 py-3 hover:bg-blush"
                >
                  <span className="min-w-0 font-semibold">{c.subject}</span>
                  <span className="text-sm text-ink/60">
                    {[
                      STATUS[c.status] || c.status,
                      c.sent ? fmt.format(new Date(c.sent)) : fmt.format(new Date(c.created)),
                      c.status === "sent" && `${c.emailsSent} sent`,
                      c.status === "sent" && c.openRate != null && `${pct(c.openRate)} opened`,
                      c.status === "sent" && c.clickRate != null && `${pct(c.clickRate)} clicked`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}{" "}
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
