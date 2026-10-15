"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, useEditorState } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { editorHtmlToMarkdown, markdownToEditorHtml } from "@/lib/editorMarkdown";

// What-you-see post editor. Saves Markdown (see editorMarkdown.js), so the
// blog renders posts exactly as before; product and recipe cards are
// blocks you can move and delete.

const LibraryContext = createContext({ products: [], recipes: [] });

function CardView({ node, deleteNode, selected }) {
  const lib = useContext(LibraryContext);
  const { kind, slug } = node.attrs;
  const item = (kind === "product" ? lib.products : lib.recipes).find((x) => x.slug === slug);
  const image = item?.image_url;
  return (
    <NodeViewWrapper
      className={`not-prose my-4 flex items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-blush p-2.5 ${selected ? "shadow-[4px_4px_0_var(--pink)]" : ""}`}
      data-drag-handle=""
      contentEditable={false}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink bg-paper text-xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL thumbnail
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : kind === "product" ? (
          "🛍️"
        ) : (
          "🍳"
        )}
      </span>
      <span className="min-w-0 flex-1 cursor-grab">
        <span className="block text-xs font-semibold uppercase tracking-wider text-pink-deep">{kind === "product" ? "Product card" : "Recipe card"}</span>
        <span className="block truncate font-display text-lg tracking-wide">{item ? item.name || item.title : slug}</span>
        {!item && lib.loaded && <span className="block text-xs font-semibold text-pink-deep">Nothing has this link name, so it won&rsquo;t show.</span>}
      </span>
      <button type="button" onClick={deleteNode} className="shrink-0 rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-semibold hover:bg-pink-soft">
        Remove
      </button>
    </NodeViewWrapper>
  );
}

const CardNode = Node.create({
  name: "card",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      kind: { default: "product", parseHTML: (el) => el.getAttribute("data-card"), renderHTML: (a) => ({ "data-card": a.kind }) },
      slug: { default: "", parseHTML: (el) => el.getAttribute("data-slug"), renderHTML: (a) => ({ "data-slug": a.slug }) },
    };
  },
  parseHTML: () => [{ tag: "div[data-card]" }],
  renderHTML: ({ node, HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes), `{{${node.attrs.kind}:${node.attrs.slug}}}`],
  addNodeView: () => ReactNodeViewRenderer(CardView),
});

function ToolButton({ active, onClick, label, children, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 text-sm font-bold transition-colors disabled:opacity-40 ${
        active ? "bg-ink text-paper" : "hover:bg-blush"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-6 w-px bg-ink/20" />;

export default function RichEditor({ value, onChange, library, onUploadPhoto, onOpenPicker, cardInserterRef, placeholder }) {
  const photoRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [initial] = useState(() => markdownToEditorHtml(value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        underline: false,
        strike: false,
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer", target: null } },
      }),
      Image,
      Placeholder.configure({ placeholder }),
      CardNode,
    ],
    content: initial,
    editorProps: { attributes: { class: "post-body min-h-[24rem] px-4 py-4 focus:outline-none sm:px-6", "aria-label": "Post text" } },
    onUpdate: ({ editor }) => onChange(editorHtmlToMarkdown(editor.getHTML())),
  });

  const toolState = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            link: e.isActive("link"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            image: e.isActive("image"),
            alt: e.isActive("image") ? e.getAttributes("image").alt || "" : "",
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  // Cards picked from the post page's picker land at the cursor.
  useEffect(() => {
    if (!editor || !cardInserterRef) return;
    cardInserterRef.current = (kind, slug) => editor.chain().focus().insertContent([{ type: "card", attrs: { kind, slug } }, { type: "paragraph" }]).run();
  }, [editor, cardInserterRef]);

  const state = toolState || {};
  if (!editor) return <div className="min-h-[24rem] animate-pulse rounded-2xl bg-blush" />;
  const chain = () => editor.chain().focus();

  const addPhoto = async (file) => {
    if (!file) return;
    setPhotoBusy(true);
    const url = await onUploadPhoto(file);
    setPhotoBusy(false);
    if (url) chain().setImage({ src: url, alt: "" }).run();
  };

  const openLink = () => {
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkOpen(true);
  };
  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}` }).run();
    setLinkOpen(false);
  };

  // Adds a question to the end of the post's FAQ section (or starts one
  // where the cursor is), so new questions join the imported ones in the
  // same FAQ card.
  const addFaq = () => {
    const question = [
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Your question?" }] },
      { type: "paragraph", content: [{ type: "text", text: "The answer in a sentence or two." }] },
    ];
    let faqAt = null;
    let endAt = null;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name !== "heading" || node.attrs.level !== 2) return;
      if (faqAt === null && /^(frequently asked questions|faqs?|common questions)\b/i.test(node.textContent.trim())) faqAt = offset;
      else if (faqAt !== null && endAt === null) endAt = offset;
    });
    if (faqAt === null) {
      chain()
        .insertContent([{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Frequently Asked Questions" }] }, ...question])
        .run();
      return;
    }
    const at = endAt ?? editor.state.doc.content.size;
    chain().insertContentAt(at, question).setTextSelection(at + 1).scrollIntoView().run();
  };

  return (
    <LibraryContext.Provider value={library}>
      <div className="overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b-2 border-ink/15 bg-paper/95 p-1.5 backdrop-blur">
          <ToolButton label="Text" active={!state.h2 && !state.h3} onClick={() => chain().setParagraph().run()}>
            ¶
          </ToolButton>
          <ToolButton label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
            H2
          </ToolButton>
          <ToolButton label="Small heading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
            H3
          </ToolButton>
          <Divider />
          <ToolButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
            B
          </ToolButton>
          <ToolButton label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
            <span className="italic">I</span>
          </ToolButton>
          <ToolButton label="Link" active={state.link} onClick={openLink}>
            🔗
          </ToolButton>
          <Divider />
          <ToolButton label="Bullet list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
            • List
          </ToolButton>
          <ToolButton label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
            1. List
          </ToolButton>
          <ToolButton label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
            “ ”
          </ToolButton>
          <Divider />
          <ToolButton label="Add a photo" disabled={photoBusy} onClick={() => photoRef.current?.click()}>
            {photoBusy ? "Uploading…" : "📷 Photo"}
          </ToolButton>
          {onOpenPicker && (
            <>
              <ToolButton label="Add a product card" onClick={() => onOpenPicker("product")}>
                🛍️ Product
              </ToolButton>
              <ToolButton label="Add a recipe card" onClick={() => onOpenPicker("recipe")}>
                🍳 Recipe
              </ToolButton>
            </>
          )}
          <ToolButton label="Add an FAQ question" onClick={addFaq}>
            ❓ FAQ
          </ToolButton>
          <span className="ml-auto flex">
            <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
              ↶
            </ToolButton>
            <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
              ↷
            </ToolButton>
          </span>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              addPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {linkOpen && (
          <form
            className="flex flex-wrap items-center gap-2 border-b-2 border-ink/15 bg-blush px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <label className="text-sm font-semibold" htmlFor="editor-link">
              Link to
            </label>
            <input
              id="editor-link"
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
              className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper px-3 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-full border-2 border-ink bg-ink px-4 py-1.5 text-sm font-semibold text-paper">
              {linkUrl.trim() ? "Save link" : "Remove link"}
            </button>
            <button type="button" onClick={() => setLinkOpen(false)} className="px-2 text-sm font-semibold text-ink/60">
              Cancel
            </button>
          </form>
        )}

        {state.image && (
          <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink/15 bg-blush px-3 py-2">
            <label className="text-sm font-semibold" htmlFor="editor-alt">
              Photo description
            </label>
            <input
              id="editor-alt"
              value={state.alt}
              onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()}
              placeholder="What's in the photo (for Google and screen readers)"
              className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper px-3 py-1.5 text-sm"
            />
            <button type="button" onClick={() => chain().deleteSelection().run()} className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-sm font-semibold hover:bg-pink-soft">
              Remove photo
            </button>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </LibraryContext.Provider>
  );
}
