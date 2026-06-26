import { useState, useMemo, useRef, useEffect } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const CHECKLIST_SLUG = "default";

// ── Types ──────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  label: string;
  note: string;
  priority: "must" | "nice";
  qty: number;
  unitPrice: number;
  link: string;
}

interface Section {
  id: string;
  title: string;
  items: Item[];
}

interface TimelinePhase {
  phase: string;
  tag: string;
  text: string;
}

interface AppData {
  instituteName: string;
  instituteTag: string;
  docTitle: string;
  targetNote: string;
  budgetMin: number;
  budgetMax: number;
  sections: Section[];
  timeline: TimelinePhase[];
  aiSpecs: string[];
}

const emptyData: AppData = {
  instituteName: "Institute Name",
  instituteTag: "Tagline",
  docTitle: "Procurement Checklist",
  targetNote: "Target: — Students",
  budgetMin: 0,
  budgetMax: 0,
  sections: [],
  timeline: [],
  aiSpecs: [],
};

let uid = 1000;
const nextId = (p: string) => `${p}${uid++}`;

function fmt(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return "₹" + Math.round(v).toLocaleString("en-IN");
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconPrint() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
    >
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

// ── Settings Modal ─────────────────────────────────────────────────────────

interface SettingsModalProps {
  data: AppData;
  onSave: (patch: Partial<AppData>) => void;
  onClose: () => void;
}
function SettingsModal({ data, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState({
    instituteName: data.instituteName,
    instituteTag: data.instituteTag,
    docTitle: data.docTitle,
    targetNote: data.targetNote,
    budgetMin: String(data.budgetMin),
    budgetMax: String(data.budgetMax),
  });

  function handleSave() {
    onSave({
      instituteName: form.instituteName,
      instituteTag: form.instituteTag,
      docTitle: form.docTitle,
      targetNote: form.targetNote,
      budgetMin: Number(form.budgetMin.replace(/[^\d]/g, "")) || 0,
      budgetMax: Number(form.budgetMax.replace(/[^\d]/g, "")) || 0,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Document Settings</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">Institute name</label>
            <input className="field-input" value={form.instituteName} onChange={e => setForm(f => ({ ...f, instituteName: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Tagline</label>
            <input className="field-input" value={form.instituteTag} onChange={e => setForm(f => ({ ...f, instituteTag: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Document title</label>
            <input className="field-input" value={form.docTitle} onChange={e => setForm(f => ({ ...f, docTitle: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Target note</label>
            <input className="field-input" value={form.targetNote} onChange={e => setForm(f => ({ ...f, targetNote: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Budget min (₹)</label>
              <input className="field-input" value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Budget max (₹)</label>
              <input className="field-input" value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Item Edit Modal ────────────────────────────────────────────────────────
// FIX: receives an optional `isNew` flag and a `onConfirm` callback so that
// when adding, nothing is committed to state until the user clicks "Save item".

interface ItemEditModalProps {
  item: Item;
  isNew?: boolean;
  onConfirm: (patch: Partial<Item>) => void;
  onClose: () => void;
}
function ItemEditModal({ item, isNew = false, onConfirm, onClose }: ItemEditModalProps) {
  const [form, setForm] = useState({
    label: item.label,
    note: item.note,
    qty: String(item.qty),
    unitPrice: String(item.unitPrice),
    link: item.link,
    priority: item.priority,
  });

  function handleSave() {
    onConfirm({
      label: form.label,
      note: form.note,
      qty: Number(form.qty) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      link: form.link,
      priority: form.priority as "must" | "nice",
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isNew ? "Add new item" : "Edit item"}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">Item name</label>
            <input className="field-input" placeholder="e.g. Laptop, Projector…" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Note / description</label>
            <input className="field-input" placeholder="Optional specs or notes" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Quantity</label>
              <input type="number" min={0} className="field-input" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Unit price (₹)</label>
              <input type="number" min={0} className="field-input" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Link (optional)</label>
            <input type="url" className="field-input" placeholder="https://…" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Priority</label>
            <div className="priority-toggle">
              <button
                className={`ptoggle-btn ${form.priority === "must" ? "active-must" : ""}`}
                onClick={() => setForm(f => ({ ...f, priority: "must" }))}
              >Must have</button>
              <button
                className={`ptoggle-btn ${form.priority === "nice" ? "active-nice" : ""}`}
                onClick={() => setForm(f => ({ ...f, priority: "nice" }))}
              >Nice to have</button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{isNew ? "Add item" : "Save item"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Section Title Edit ─────────────────────────────────────────────────────

interface SectionTitleEditorProps {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}
function SectionTitleEditor({ value, onSave, onCancel }: SectionTitleEditorProps) {
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="section-title-editor">
      <input
        ref={ref}
        className="section-title-input"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel(); }}
      />
      <button className="btn-primary btn-sm" onClick={() => onSave(val)}>Save</button>
      <button className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="skeleton-wrap">
      <div className="skel skel-header" />
      <div className="skel skel-bar" />
      <div className="skeleton-sections">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skel-card">
            <div className="skel skel-title" />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="skel skel-row" style={{ width: j % 2 === 0 ? "85%" : "95%" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState<AppData>(emptyData);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [filter, setFilter] = useState<"all" | "must" | "nice">("all");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  // editingItem.item is the current saved item (for edits) or a blank draft (for new)
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: Item; isNew: boolean } | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  // ── Load ──
  useEffect(() => {
    fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((doc) => {
        const { checked: savedChecked, ...rest } = doc;
        setData(rest as AppData);
        setChecked(savedChecked || {});
        const exp: Record<string, boolean> = {};
        (rest as AppData).sections.forEach((s: Section) => { exp[s.id] = true; });
        setExpandedSections(exp);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoaded(true));
  }, []);

  // ── Autosave data ──
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((r) => { if (!r.ok) throw new Error(); setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 1500); })
        .catch(() => setSaveStatus("error"));
    }, 600);
    return () => clearTimeout(t);
  }, [data, loaded]);

  // ── Autosave checked ──
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}/checked`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [checked, loaded]);

  // ── Derived stats ──
  const allItems = useMemo(() => data.sections.flatMap((s) => s.items), [data]);
  const mustItems = allItems.filter((i) => i.priority === "must");
  const niceItems = allItems.filter((i) => i.priority === "nice");
  const totalEstimate = allItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const mustTotal = mustItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const checkedTotal = allItems.filter((i) => checked[i.id]).reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const budgetPct = data.budgetMax > 0 ? Math.min(100, (totalEstimate / data.budgetMax) * 100) : 0;
  const progressPct = allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0;
  const budgetState =
    data.budgetMax === 0 ? "under"
    : totalEstimate > data.budgetMax ? "over"
    : totalEstimate > data.budgetMin ? "ok"
    : "under";

  // ── Mutators ──
  function patchData(patch: Partial<AppData>) { setData((d) => ({ ...d, ...patch })); }

  function patchItem(sectionId: string, itemId: string, patch: Partial<Item>) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId ? s
          : { ...s, items: s.items.map((i) => (i.id !== itemId ? i : { ...i, ...patch })) }
      ),
    }));
  }

  // FIX: open modal with a blank draft; nothing is added to state until onConfirm
  function openAddItem(sectionId: string) {
    const draft: Item = {
      id: nextId("i"),
      label: "",
      note: "",
      priority: "must",
      qty: 1,
      unitPrice: 0,
      link: "",
    };
    setEditingItem({ sectionId, item: draft, isNew: true });
  }

  // FIX: separate confirm handler that actually inserts the item
  function confirmAddItem(sectionId: string, id: string, patch: Partial<Item>) {
    const newItem: Item = { id, label: "New item", note: "", priority: "must", qty: 1, unitPrice: 0, link: "", ...patch };
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, items: [...s.items, newItem] }
      ),
    }));
  }

  function removeItem(sectionId: string, itemId: string) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, items: s.items.filter((i) => i.id !== itemId) }
      ),
    }));
  }

  function addSection() {
    const id = nextId("sec");
    setData((d) => ({ ...d, sections: [...d.sections, { id, title: "New section", items: [] }] }));
    setExpandedSections((e) => ({ ...e, [id]: true }));
    setEditingSectionId(id);
  }

  function saveSectionTitle(sectionId: string, title: string) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) => s.id !== sectionId ? s : { ...s, title }),
    }));
    setEditingSectionId(null);
  }

  function removeSection(sectionId: string) {
    setData((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== sectionId) }));
  }

  function toggleCheck(id: string) { setChecked((c) => ({ ...c, [id]: !c[id] })); }
  function toggleSection(id: string) { setExpandedSections((e) => ({ ...e, [id]: !e[id] })); }

  function resetAll() {
    fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}/reset`, { method: "POST" })
      .then((r) => r.json())
      .then((doc) => { const { checked: c, ...rest } = doc; setData(rest); setChecked(c || {}); })
      .catch(() => alert("Reset failed — check your connection."));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ ...data, checked }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "checklist.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { checked: c, ...rest } = JSON.parse(reader.result as string);
        setData(rest); setChecked(c || {});
      } catch { alert("Invalid file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  if (!loaded) return <Skeleton />;
  if (loadError && allItems.length === 0) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠</div>
        <h2>Cannot reach server</h2>
        <p>Make sure the backend is running at <code>{API_BASE}</code></p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">

      {/* ── Modals ── */}
      {showSettings && (
        <SettingsModal
          data={data}
          onSave={(patch) => patchData(patch)}
          onClose={() => setShowSettings(false)}
        />
      )}
      {editingItem && (
        <ItemEditModal
          item={editingItem.item}
          isNew={editingItem.isNew}
          onConfirm={(patch) => {
            if (editingItem.isNew) {
              // Only add to state when user confirms
              confirmAddItem(editingItem.sectionId, editingItem.item.id, patch);
            } else {
              patchItem(editingItem.sectionId, editingItem.item.id, patch);
            }
          }}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* ── Header ── */}
      <header className="page-header">
        <div className="header-inner">
          <div className="header-left">
            <div className="brand-block">
              <div className="brand-logo">{data.instituteName.charAt(0)}</div>
              <div>
                <div className="brand-name">{data.instituteName}</div>
                <div className="brand-tag">{data.instituteTag}</div>
              </div>
            </div>
            <div className="doc-block">
              <h1 className="doc-title">{data.docTitle}</h1>
              <span className="doc-target">{data.targetNote}</span>
            </div>
          </div>
          <div className="header-right no-print">
            <span className={`save-indicator ${saveStatus}`}>
              {saveStatus === "saving" && <><span className="spinner" />Saving…</>}
              {saveStatus === "saved" && "✓ Saved"}
              {saveStatus === "error" && "✕ Error"}
            </span>
            <button className="hdr-btn" onClick={() => setShowSettings(true)}>
              <IconSettings /> Settings
            </button>
            <button className="hdr-btn" onClick={() => window.print()}>
              <IconPrint /> Print
            </button>
            <button className="hdr-btn" onClick={exportJSON}>
              <IconDownload /> Export
            </button>
            <button className="hdr-btn" onClick={() => fileInput.current?.click()}>
              <IconUpload /> Import
            </button>
            <button className="hdr-btn hdr-btn-danger" onClick={resetAll}>
              <IconRefresh /> Reset
            </button>
            <input ref={fileInput} type="file" accept="application/json" onChange={importJSON} hidden />
          </div>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-label">Total estimate</div>
          <div className={`stat-value val-${budgetState}`}>{fmt(totalEstimate)}</div>
          <div className="stat-sub">Budget: {fmt(data.budgetMin)} – {fmt(data.budgetMax)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Must-have cost</div>
          <div className="stat-value">{fmt(mustTotal)}</div>
          <div className="stat-sub">{mustItems.length} essential items</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Procured so far</div>
          <div className="stat-value val-green">{fmt(checkedTotal)}</div>
          <div className="stat-sub">{checkedCount} of {allItems.length} items ticked</div>
        </div>
        <div className="stat-item stat-wide no-print">
          <div className="stat-label">
            Budget utilisation
            <span className={`budget-badge bdg-${budgetState}`}>
              {budgetState === "over" ? "Over budget" : budgetState === "ok" ? "Within range" : "Below range"}
            </span>
          </div>
          <div className="progress-bar-wrap">
            <div className={`progress-bar-fill fill-${budgetState}`} style={{ width: budgetPct + "%" }} />
            {data.budgetMin > 0 && data.budgetMax > 0 && (
              <div className="progress-min-marker" style={{ left: Math.min(100, (data.budgetMin / data.budgetMax) * 100) + "%" }} />
            )}
          </div>
          <div className="progress-meta">{budgetPct.toFixed(0)}% of max budget</div>
        </div>
        <div className="stat-item stat-wide no-print">
          <div className="stat-label">Procurement progress</div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill fill-violet" style={{ width: progressPct + "%" }} />
          </div>
          <div className="progress-meta">{progressPct}% complete · {checkedCount}/{allItems.length} items</div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar no-print">
        <div className="filter-group">
          {(["all", "must", "nice"] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "filter-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All items" : f === "must" ? "Must have" : "Nice to have"}
              <span className="filter-count">
                {f === "all" ? allItems.length : f === "must" ? mustItems.length : niceItems.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="content">
        {data.sections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No sections yet</h3>
            <p>Click "+ Add section" below to get started.</p>
          </div>
        ) : (
          data.sections.map((section) => {
            const visibleItems = section.items.filter((i) => filter === "all" || i.priority === filter);
            const sectionTotal = section.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
            const sectionChecked = section.items.filter((i) => checked[i.id]).length;
            const isOpen = expandedSections[section.id] !== false;
            const isEditingTitle = editingSectionId === section.id;

            return (
              <div key={section.id} className="section-block">
                <div className="section-head">
                  <button className="collapse-btn" onClick={() => toggleSection(section.id)}>
                    <IconChevron open={isOpen} />
                  </button>

                  {isEditingTitle ? (
                    <SectionTitleEditor
                      value={section.title}
                      onSave={(v) => saveSectionTitle(section.id, v)}
                      onCancel={() => setEditingSectionId(null)}
                    />
                  ) : (
                    <>
                      <span className="section-title">{section.title}</span>
                      <button
                        className="icon-btn no-print"
                        title="Rename section"
                        onClick={() => setEditingSectionId(section.id)}
                      >
                        <IconEdit />
                      </button>
                    </>
                  )}

                  <div className="section-meta">
                    <span className="section-badge">{sectionChecked}/{section.items.length}</span>
                    <span className="section-total">{fmt(sectionTotal)}</span>
                  </div>

                  <div className="section-acts no-print">
                    <button className="act-btn act-add" onClick={() => openAddItem(section.id)}>
                      <IconPlus /> Add item
                    </button>
                    <button className="act-btn act-danger" onClick={() => removeSection(section.id)}>
                      <IconTrash />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="section-body">
                    {visibleItems.length > 0 && (
                      <div className="table-head">
                        <span />
                        <span>Item</span>
                        <span className="d-desk">Qty</span>
                        <span className="d-desk">Unit price</span>
                        <span className="d-desk">Total</span>
                        <span className="d-desk">Link</span>
                        <span className="no-print" />
                      </div>
                    )}

                    {visibleItems.map((item) => {
                      const isDone = !!checked[item.id];
                      const rowTotal = item.qty * item.unitPrice;
                      return (
                        <div key={item.id} className={`item-row ${isDone ? "row-done" : ""}`}>
                          <label className="cb-wrap">
                            <input type="checkbox" checked={isDone} onChange={() => toggleCheck(item.id)} />
                            <span className="cb-box" />
                          </label>

                          <div className="item-info">
                            <div className="item-name-row">
                              <span className={`item-name ${isDone ? "name-done" : ""}`}>{item.label}</span>
                              <span className={`p-tag p-${item.priority}`}>
                                {item.priority === "must" ? "Must" : "Nice"}
                              </span>
                            </div>
                            {item.note && <div className="item-note">{item.note}</div>}
                          </div>

                          <div className="d-desk"><span className="cell">{item.qty}</span></div>
                          <div className="d-desk"><span className="cell">{fmt(item.unitPrice)}</span></div>
                          <div className="d-desk"><span className="cell cell-bold">{fmt(rowTotal)}</span></div>

                          <div className="d-desk">
                            {item.link
                              ? <a href={item.link} target="_blank" rel="noreferrer" className="item-link"><IconLink /> View</a>
                              : <span className="cell-empty">—</span>}
                          </div>

                          <div className="row-acts no-print">
                            <button
                              className="row-edit-btn"
                              onClick={() => setEditingItem({ sectionId: section.id, item, isNew: false })}
                            >
                              <IconEdit /> Edit
                            </button>
                            <button className="row-del-btn" onClick={() => removeItem(section.id, item.id)}>
                              <IconTrash />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {visibleItems.length === 0 && (
                      <div className="empty-section">
                        {filter !== "all"
                          ? `No ${filter === "must" ? "must-have" : "nice-to-have"} items here.`
                          : <><button className="text-btn" onClick={() => openAddItem(section.id)}>+ Add the first item</button></>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <button className="add-section-btn no-print" onClick={addSection}>
          <IconPlus /> Add section
        </button>

        {data.timeline.length > 0 && (
          <div className="timeline-block">
            <div className="timeline-heading">Procurement timeline</div>
            <div className="timeline-cols">
              {data.timeline.map((t, idx) => (
                <div key={idx} className="timeline-col">
                  <div className="tl-num">{String(idx + 1).padStart(2, "0")}</div>
                  <div className="tl-phase">{t.phase}</div>
                  <div className="tl-tag">{t.tag}</div>
                  <div className="tl-text">{t.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}