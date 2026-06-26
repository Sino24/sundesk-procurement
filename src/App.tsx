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

interface EditState {
  qty: number | string;
  unitPrice: number | string;
  link: string;
}

// ── Empty initial data (backend is source of truth) ──────────────────────

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

// ── Editable inline text ────────────────────────────────────────────────

function Editable({
  value,
  onChange,
  className = "",
  as = "span",
  placeholder = "Click to edit",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  as?: "span" | "div" | "h1";
  placeholder?: string;
}) {
  const Tag = as as any;
  return (
    <Tag
      className={`editable ${className}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e: React.FocusEvent<HTMLElement>) =>
        onChange(e.currentTarget.textContent ?? "")
      }
    >
      {value}
    </Tag>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────────

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
              <div key={j} className="skel skel-row" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState<AppData>(emptyData);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ qty: 0, unitPrice: 0, link: "" });
  const [filter, setFilter] = useState<"all" | "must" | "nice">("all");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  // ── Load from API on mount ──
  useEffect(() => {
    fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((doc) => {
        const { checked: savedChecked, ...rest } = doc;
        setData(rest as AppData);
        setChecked(savedChecked || {});
        // Default all sections to expanded
        const exp: Record<string, boolean> = {};
        (rest as AppData).sections.forEach((s: Section) => { exp[s.id] = true; });
        setExpandedSections(exp);
      })
      .catch((err) => {
        console.error("Failed to load checklist from API:", err);
        setLoadError(true);
      })
      .finally(() => setLoaded(true));
  }, []);

  // ── Save data (debounced) ──
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`API returned ${r.status}`);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        })
        .catch((err) => {
          console.error("Save failed:", err);
          setSaveStatus("error");
        });
    }, 600);
    return () => clearTimeout(t);
  }, [data, loaded]);

  // ── Save checked state (debounced) ──
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}/checked`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      }).catch((err) => console.error("Checked-save failed:", err));
    }, 400);
    return () => clearTimeout(t);
  }, [checked, loaded]);

  // ── Derived ──
  const allItems = useMemo(() => data.sections.flatMap((s) => s.items), [data]);
  const mustItems = allItems.filter((i) => i.priority === "must");
  const niceItems = allItems.filter((i) => i.priority === "nice");
  const totalEstimate = allItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const mustTotal = mustItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const checkedTotal = allItems.filter((i) => checked[i.id]).reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const budgetPct = data.budgetMax > 0 ? Math.min(100, (totalEstimate / data.budgetMax) * 100) : 0;
  const budgetState =
    data.budgetMax === 0 ? "under"
    : totalEstimate > data.budgetMax ? "over"
    : totalEstimate > data.budgetMin ? "ok"
    : "under";

  // ── Mutators ──
  function patchTop<K extends keyof AppData>(field: K, value: AppData[K]) {
    setData((d) => ({ ...d, [field]: value }));
  }
  function patchSection(sectionId: string, field: keyof Section, value: string) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id !== sectionId ? s : { ...s, [field]: value })),
    }));
  }
  function patchItem(sectionId: string, itemId: string, patch: Partial<Item>) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, items: s.items.map((i) => (i.id !== itemId ? i : { ...i, ...patch })) }
      ),
    }));
  }
  function toggleCheck(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }
  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditState({ qty: item.qty, unitPrice: item.unitPrice, link: item.link });
  }
  function saveEdit(sectionId: string, itemId: string) {
    patchItem(sectionId, itemId, {
      qty: Number(editState.qty) || 0,
      unitPrice: Number(editState.unitPrice) || 0,
      link: editState.link,
    });
    setEditingId(null);
  }
  function addItem(sectionId: string) {
    const id = nextId("i");
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              items: [
                ...s.items,
                { id, label: "New item", note: "Add a note", priority: "must", qty: 1, unitPrice: 0, link: "" },
              ],
            }
      ),
    }));
    setEditingId(id);
    setEditState({ qty: 1, unitPrice: 0, link: "" });
  }
  function removeItem(sectionId: string, itemId: string) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, items: s.items.filter((i) => i.id !== itemId) }
      ),
    }));
  }
  function togglePriority(sectionId: string, itemId: string, current: Item["priority"]) {
    patchItem(sectionId, itemId, { priority: current === "must" ? "nice" : "must" });
  }
  function addSection() {
    const id = nextId("sec");
    setData((d) => ({ ...d, sections: [...d.sections, { id, title: "New section", items: [] }] }));
    setExpandedSections((e) => ({ ...e, [id]: true }));
  }
  function removeSection(sectionId: string) {
    setData((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== sectionId) }));
  }
  function toggleSection(id: string) {
    setExpandedSections((e) => ({ ...e, [id]: !e[id] }));
  }

  function resetAll() {
    if (!confirm("Reset to the default checklist? This clears everything saved on the server.")) return;
    fetch(`${API_BASE}/checklists/${CHECKLIST_SLUG}/reset`, { method: "POST" })
      .then((r) => r.json())
      .then((doc) => {
        const { checked: savedChecked, ...rest } = doc;
        setData(rest as AppData);
        setChecked(savedChecked || {});
      })
      .catch((err) => {
        console.error("Reset failed:", err);
        alert("Couldn't reset — check your connection and try again.");
      });
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ ...data, checked }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "procurement-checklist.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const { checked: importedChecked, ...rest } = parsed;
        setData(rest);
        setChecked(importedChecked || {});
      } catch {
        alert("Couldn't read that file — please pick a checklist JSON exported from this page.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Loading state ──
  if (!loaded) return <Skeleton />;

  // ── Error state ──
  if (loadError && allItems.length === 0) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠</div>
        <h2>Couldn't reach the server</h2>
        <p>Make sure the backend is running at <code>{API_BASE}</code> and refresh.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const progressPct = allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0;

  // ── Render ──
  return (
    <div className="ulx">

      {/* ── Top header ── */}
      <header className="page-header">
        <div className="page-header-inner">
          <div className="brand-row">
            <div className="brand-mark">
              <Editable
                value={data.instituteName}
                onChange={(v) => patchTop("instituteName", v)}
                className="brand-name"
              />
              <Editable
                value={data.instituteTag}
                onChange={(v) => patchTop("instituteTag", v)}
                className="brand-sub"
              />
            </div>
            <div className="header-actions no-print">
              <span className={`save-pill save-${saveStatus}`}>
                {saveStatus === "saving" && <><span className="save-spinner" />Saving</>}
                {saveStatus === "saved" && <>✓ Saved</>}
                {saveStatus === "error" && <>✕ Save failed</>}
              </span>
              <button className="hdr-btn" onClick={() => window.print()}>Print</button>
              <button className="hdr-btn" onClick={exportJSON}>Export</button>
              <button className="hdr-btn" onClick={() => fileInput.current?.click()}>Import</button>
              <button className="hdr-btn danger" onClick={resetAll}>Reset</button>
              <input ref={fileInput} type="file" accept="application/json" onChange={importJSON} hidden />
            </div>
          </div>

          <div className="doc-title-row">
            <Editable
              value={data.docTitle}
              onChange={(v) => patchTop("docTitle", v)}
              as="h1"
              className="doc-title"
            />
            <Editable
              value={data.targetNote}
              onChange={(v) => patchTop("targetNote", v)}
              className="doc-target"
            />
          </div>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-label">Total estimate</div>
          <div className={`stat-value budget-${budgetState}`}>{fmt(totalEstimate)}</div>
          <div className="stat-sub">
            Budget&nbsp;
            <Editable
              value={fmt(data.budgetMin).replace("₹", "")}
              onChange={(v) => patchTop("budgetMin", Number(v.replace(/[^\d]/g, "")) || 0)}
              className="stat-budget-edit"
            />
            {" – "}
            <Editable
              value={fmt(data.budgetMax).replace("₹", "")}
              onChange={(v) => patchTop("budgetMax", Number(v.replace(/[^\d]/g, "")) || 0)}
              className="stat-budget-edit"
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Must-have cost</div>
          <div className="stat-value">{fmt(mustTotal)}</div>
          <div className="stat-sub">{mustItems.length} essential items</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Procured value</div>
          <div className="stat-value procured">{fmt(checkedTotal)}</div>
          <div className="stat-sub">{checkedCount} of {allItems.length} items ticked</div>
        </div>

        <div className="stat-card stat-card-wide no-print">
          <div className="stat-label">Budget utilisation</div>
          <div className="budget-track">
            <div className={`budget-fill budget-${budgetState}`} style={{ width: budgetPct + "%" }} />
            {data.budgetMin > 0 && (
              <div
                className="budget-min-marker"
                style={{ left: Math.min(100, (data.budgetMin / data.budgetMax) * 100) + "%" }}
              />
            )}
          </div>
          <div className="budget-labels">
            <span className={`budget-status budget-${budgetState}`}>
              {budgetState === "over" ? "Over budget" : budgetState === "ok" ? "Within range" : "Below range"}
            </span>
            <span className="budget-pct">{budgetPct.toFixed(0)}%</span>
          </div>
        </div>

        <div className="stat-card stat-card-wide no-print">
          <div className="stat-label">Procurement progress</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: progressPct + "%" }} />
          </div>
          <div className="budget-labels">
            <span className="stat-sub">Items checked off</span>
            <span className="progress-pct">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar no-print">
        <div className="filter-tabs">
          {(["all", "must", "nice"] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab${filter === f ? " active" : ""}`}
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

      {/* ── Main sections ── */}
      <main className="main-content">
        {data.sections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No sections yet</h3>
            <p>Click "+ Add section" to start building your checklist.</p>
          </div>
        ) : (
          data.sections.map((section) => {
            const items = section.items.filter((i) => filter === "all" || i.priority === filter);
            const sectionTotal = section.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
            const sectionChecked = section.items.filter((i) => checked[i.id]).length;
            const isOpen = expandedSections[section.id] !== false;

            return (
              <div key={section.id} className="section-block">
                {/* Section header */}
                <div className="section-head">
                  <button
                    className="section-toggle"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isOpen}
                  >
                    <span className={`chevron ${isOpen ? "open" : ""}`}>›</span>
                  </button>
                  <Editable
                    value={section.title}
                    onChange={(v) => patchSection(section.id, "title", v)}
                    className="section-title"
                  />
                  <div className="section-meta">
                    <span className="section-progress-badge">
                      {sectionChecked}/{section.items.length}
                    </span>
                    <span className="section-total">{fmt(sectionTotal)}</span>
                  </div>
                  <div className="section-actions no-print">
                    <button className="act-btn" onClick={() => addItem(section.id)}>+ Item</button>
                    <button className="act-btn danger" onClick={() => removeSection(section.id)}>Remove</button>
                  </div>
                </div>

                {/* Section items */}
                {isOpen && (
                  <div className="section-body">
                    {/* Column headers */}
                    {items.length > 0 && (
                      <div className="col-header">
                        <span />
                        <span>Item</span>
                        <span className="d-desk">Qty</span>
                        <span className="d-desk">Unit price</span>
                        <span className="d-desk">Total</span>
                        <span className="d-desk">Link</span>
                        <span className="no-print" />
                      </div>
                    )}

                    {items.map((item) => {
                      const isEditing = editingId === item.id;
                      const rowTotal = item.qty * item.unitPrice;
                      const isDone = !!checked[item.id];

                      return (
                        <div
                          key={item.id}
                          className={`item-row ${isDone ? "item-done" : ""} ${isEditing ? "item-editing" : ""}`}
                        >
                          <label className="check-wrap">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleCheck(item.id)}
                            />
                            <span className="check-box" />
                          </label>

                          <div className="item-info">
                            <div className="item-label-row">
                              <Editable
                                value={item.label}
                                onChange={(v) => patchItem(section.id, item.id, { label: v })}
                                className={`item-name ${isDone ? "item-strikethrough" : ""}`}
                              />
                              <span
                                className={`priority-tag priority-${item.priority} no-print`}
                                onClick={() => togglePriority(section.id, item.id, item.priority)}
                                title="Click to toggle priority"
                              >
                                {item.priority === "must" ? "Must" : "Nice"}
                              </span>
                            </div>
                            <Editable
                              value={item.note}
                              onChange={(v) => patchItem(section.id, item.id, { note: v })}
                              as="div"
                              className="item-note"
                            />
                          </div>

                          {/* Qty */}
                          <div className="d-desk">
                            {isEditing ? (
                              <input
                                type="number"
                                className="inline-input w-sm"
                                value={editState.qty}
                                min={0}
                                onChange={(e) => setEditState((s) => ({ ...s, qty: e.target.value }))}
                              />
                            ) : (
                              <span className="cell-val">{item.qty}</span>
                            )}
                          </div>

                          {/* Unit price */}
                          <div className="d-desk">
                            {isEditing ? (
                              <input
                                type="number"
                                className="inline-input w-md"
                                value={editState.unitPrice}
                                min={0}
                                onChange={(e) => setEditState((s) => ({ ...s, unitPrice: e.target.value }))}
                              />
                            ) : (
                              <span className="cell-val">{fmt(item.unitPrice)}</span>
                            )}
                          </div>

                          {/* Row total */}
                          <div className="d-desk">
                            <span className="cell-total">{fmt(rowTotal)}</span>
                          </div>

                          {/* Link */}
                          <div className="d-desk cell-link-wrap">
                            {isEditing ? (
                              <input
                                type="url"
                                className="inline-input w-url"
                                placeholder="https://..."
                                value={editState.link}
                                onChange={(e) => setEditState((s) => ({ ...s, link: e.target.value }))}
                              />
                            ) : item.link ? (
                              <a href={item.link} target="_blank" rel="noreferrer" className="link-view">
                                View ↗
                              </a>
                            ) : (
                              <span className="link-empty">—</span>
                            )}
                          </div>

                          {/* Row actions */}
                          <div className="row-acts no-print">
                            {isEditing ? (
                              <button className="btn-save" onClick={() => saveEdit(section.id, item.id)}>
                                Save
                              </button>
                            ) : (
                              <button className="btn-edit" onClick={() => startEdit(item)}>
                                Edit
                              </button>
                            )}
                            <button
                              className="btn-del"
                              onClick={() => removeItem(section.id, item.id)}
                              title="Remove item"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {items.length === 0 && filter !== "all" && (
                      <div className="section-empty">
                        No {filter === "must" ? "must-have" : "nice-to-have"} items in this section.
                      </div>
                    )}
                    {items.length === 0 && filter === "all" && (
                      <div className="section-empty">
                        No items yet —{" "}
                        <button className="link-btn" onClick={() => addItem(section.id)}>
                          add the first one
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <button className="add-section-btn no-print" onClick={addSection}>
          + Add section
        </button>

        {/* ── Timeline ── */}
        {data.timeline.length > 0 && (
          <div className="timeline-block">
            <div className="timeline-heading">Procurement timeline</div>
            <div className="timeline-cols">
              {data.timeline.map((t, idx) => (
                <div key={idx} className="timeline-col">
                  <div className="timeline-index">{String(idx + 1).padStart(2, "0")}</div>
                  <div className="timeline-phase">{t.phase}</div>
                  <div className="timeline-tag">{t.tag}</div>
                  <Editable
                    value={t.text}
                    onChange={(v) =>
                      setData((d) => ({
                        ...d,
                        timeline: d.timeline.map((tt, i) => (i === idx ? { ...tt, text: v } : tt)),
                      }))
                    }
                    as="div"
                    className="timeline-text"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}