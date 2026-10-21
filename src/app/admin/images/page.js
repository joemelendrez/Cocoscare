"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Field, Notice, PageTitle, Segmented, TextInput } from "@/components/admin/AdminUI";
import { CATEGORIES } from "@/lib/content";
import { CATEGORY_DEFAULTS, IMAGE_COLORS, IMAGE_FORMATS, MAX_WORDS, imageColor, sectionImageUrl } from "@/lib/sectionImages";
import { SECTION_ICONS, SECTION_ICON_GROUPS } from "@/lib/sectionIcons";

function Icon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      // Fixed icon data from src/lib/sectionIcons.js, never user input.
      dangerouslySetInnerHTML={{ __html: SECTION_ICONS[name] }}
    />
  );
}

// Section images to break up a long post: a brand color, one icon on a white
// sticker, a few words. Download one and add it in the post editor with the
// photo button. Covers and pins stay real photos.
export default function AdminImages() {
  const [category, setCategory] = useState("recipes");
  const [color, setColor] = useState(CATEGORY_DEFAULTS.recipes.color);
  const [icon, setIcon] = useState(CATEGORY_DEFAULTS.recipes.icon);
  const [text, setText] = useState("");
  const [words, setWords] = useState("");
  const [format, setFormat] = useState("wide");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // The preview is drawn by the server, so wait for a pause in typing.
  useEffect(() => {
    const t = setTimeout(() => setWords(text), 400);
    return () => clearTimeout(t);
  }, [text]);

  const src = sectionImageUrl({ color, icon, text: words, format });
  const { width, height } = IMAGE_FORMATS[format];

  const pickCategory = (key) => {
    setCategory(key);
    setColor(CATEGORY_DEFAULTS[key].color);
    setIcon(CATEGORY_DEFAULTS[key].icon);
  };

  const q = query.trim().toLowerCase().replace(/\s+/g, "-");
  const groups = useMemo(
    () => (q ? [{ label: "Results", names: Object.keys(SECTION_ICONS).filter((n) => n.includes(q)) }] : SECTION_ICON_GROUPS),
    [q],
  );

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `section-${icon}${
        words
          ? `-${words
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")}`
          : ""
      }.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setNotice({ type: "success", text: "Downloaded. In the post editor, tap the photo button and pick it." });
    } catch {
      setNotice({ type: "error", text: "Couldn't make the image. Try again in a moment." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        title="Section images"
        intro="Little graphics to break up a long post, like a recipe's steps or a list of tips. Covers and pins stay real photos."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card title="Make one">
          <div className="space-y-5">
            <div>
              <p className="mb-1.5 font-display tracking-wide">Post category</p>
              <Segmented
                label="Post category"
                value={category}
                onChange={pickCategory}
                options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
              />
            </div>
            <div>
              <p className="mb-1.5 font-display tracking-wide">Color</p>
              <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
                {IMAGE_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    role="radio"
                    aria-checked={color === c.key}
                    aria-label={c.label}
                    title={c.label}
                    onClick={() => setColor(c.key)}
                    className={`h-10 w-10 rounded-full border-[2.5px] border-ink transition-transform ${color === c.key ? "scale-110 shadow-[3px_3px_0_var(--shadow)]" : "hover:-translate-y-0.5"}`}
                    style={{ background: c.bg }}
                  />
                ))}
              </div>
            </div>
            <Field label="Words (optional)" hint={`Up to ${MAX_WORDS} characters, like "Step 2" or "Pack the night before".`}>
              <TextInput value={text} maxLength={MAX_WORDS} onChange={(e) => setText(e.target.value)} />
            </Field>
            <div>
              <p className="mb-1.5 font-display tracking-wide">Size</p>
              <Segmented
                label="Size"
                value={format}
                onChange={setFormat}
                options={Object.entries(IMAGE_FORMATS).map(([value, f]) => ({ value, label: f.label }))}
              />
            </div>
            <div>
              <p className="mb-1.5 font-display tracking-wide">Icon</p>
              <TextInput
                type="search"
                placeholder="Find an icon (cake, baby, park…)"
                aria-label="Find an icon"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-2xl border-2 border-ink/20 p-3">
                {groups.map((g) => (
                  <div key={g.label}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-ink/50">{g.label}</p>
                    {g.names.length === 0 ? (
                      <p className="text-sm text-ink/60">No icon by that name.</p>
                    ) : (
                      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                        {g.names.map((name) => (
                          <button
                            key={name}
                            type="button"
                            title={name.replace(/-/g, " ")}
                            aria-label={name.replace(/-/g, " ")}
                            aria-pressed={icon === name}
                            onClick={() => setIcon(name)}
                            className={`grid aspect-square place-items-center rounded-xl border-2 ${icon === name ? "border-ink bg-pink-soft" : "border-transparent hover:bg-blush"}`}
                          >
                            <Icon name={name} className="h-6 w-6" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card title="Preview">
            <div
              className="mx-auto overflow-hidden rounded-[1.25rem] border-[2.5px] border-ink"
              style={{ aspectRatio: `${width} / ${height}`, maxHeight: 520, background: imageColor(color).bg }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- drawn on the fly by /blog/section-image */}
              <img src={src} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={download} disabled={busy}>
                {busy ? "Making it…" : "Download"}
              </Button>
              <span className="text-sm text-ink/60">
                {width} × {height}
              </span>
            </div>
            <div className="mt-3">
              <Notice notice={notice} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
