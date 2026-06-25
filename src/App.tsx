import { useState, useMemo, useRef, useEffect } from "react";
import "./App.css";

const STORAGE_KEY = "ulearns-checklist-data";

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

// ── Initial data ─────────────────────────────────────────────────────────

const initialData: AppData = {
  instituteName: "ULearns",
  instituteTag: "Institute of AI & Technology",
  docTitle: "Procurement & Essentials Checklist",
  targetNote: "Target: 20–30 Students",
  budgetMin: 2000000,
  budgetMax: 5000000,
  sections: [
    {
      id: "classroom",
      title: "Classroom & Training Equipment",
      items: [
        { id: "c1", label: "Student desks and chairs", note: "Ergonomic, optimised for 20–30 seats", priority: "must", qty: 25, unitPrice: 3500, link: "" },
        { id: "c2", label: "Trainer table and chair", note: "Comfortable for long lectures", priority: "must", qty: 1, unitPrice: 8000, link: "" },
        { id: "c3", label: "Whiteboard / glass board", note: "Large format, scratch-resistant", priority: "must", qty: 1, unitPrice: 6000, link: "" },
        { id: "c4", label: "Projector / smart TV", note: '55"–75" with 4K support recommended', priority: "must", qty: 1, unitPrice: 45000, link: "" },
        { id: "c5", label: "Laser pointer / clicker", note: "For slide presentations", priority: "must", qty: 1, unitPrice: 1500, link: "" },
        { id: "c6", label: "Extension boards", note: "Heavy duty for student laptops", priority: "must", qty: 5, unitPrice: 800, link: "" },
        { id: "c7", label: "Wi-Fi router & backup", note: "High concurrency connection", priority: "must", qty: 2, unitPrice: 8000, link: "" },
        { id: "c8", label: "UPS / inverter backup", note: "Minimum 2–3 hours backup capacity", priority: "must", qty: 1, unitPrice: 25000, link: "" },
        { id: "c9", label: "Desktop PCs / laptops", note: "Optional if students bring own devices", priority: "must", qty: 0, unitPrice: 55000, link: "" },
        { id: "c10", label: "Interactive smart board", note: "Replaces standard whiteboard", priority: "nice", qty: 1, unitPrice: 80000, link: "" },
        { id: "c11", label: "Wireless presentation clicker", note: "Advanced range with digital pointer", priority: "nice", qty: 1, unitPrice: 3000, link: "" },
        { id: "c12", label: "Document camera", note: "For live demonstration of physical components", priority: "nice", qty: 1, unitPrice: 12000, link: "" },
      ],
    },
    {
      id: "office",
      title: "Office & Administration",
      items: [
        { id: "o1", label: "Reception desk & office chairs", note: "First point of visual branding", priority: "must", qty: 1, unitPrice: 15000, link: "" },
        { id: "o2", label: "Visitor chairs & notice board", note: "For displaying updates / schedules", priority: "must", qty: 4, unitPrice: 2000, link: "" },
        { id: "o3", label: "Biometric attendance machine", note: "To track student / staff entry logs", priority: "must", qty: 1, unitPrice: 5000, link: "" },
        { id: "o4", label: "Telephone system", note: "Dedicated landline or mobile desk phone", priority: "must", qty: 1, unitPrice: 2000, link: "" },
        { id: "o5", label: "Lockable cupboard", note: "Secure document storage", priority: "must", qty: 2, unitPrice: 6000, link: "" },
        { id: "o6", label: "Fireproof document box", note: "For registrations and legal papers", priority: "must", qty: 1, unitPrice: 4000, link: "" },
      ],
    },
    {
      id: "printing",
      title: "Printing & Stationery",
      items: [
        { id: "p1", label: "Colour printer", note: "EcoTank / InkTank type for low-cost colour printing", priority: "must", qty: 1, unitPrice: 18000, link: "" },
        { id: "p2", label: "Black & white laser printer", note: "High speed for bulk handouts", priority: "must", qty: 1, unitPrice: 12000, link: "" },
        { id: "p3", label: "Scanner & laminator", note: "Laminator is critical for certificate preservation", priority: "must", qty: 1, unitPrice: 8000, link: "" },
        { id: "p4", label: "Paper cutter", note: "For brochures and custom handouts", priority: "must", qty: 1, unitPrice: 2500, link: "" },
        { id: "p5", label: "Consumables pack", note: "A4 paper, certificate sheets, markers, sticky notes, punch, files", priority: "must", qty: 1, unitPrice: 5000, link: "" },
      ],
    },
    {
      id: "comfort",
      title: "Student Comfort & Pantry",
      items: [
        { id: "sc1", label: "Air conditioners (AC)", note: "Sized correctly for 30 people + computers", priority: "must", qty: 3, unitPrice: 45000, link: "" },
        { id: "sc2", label: "Ceiling fans & wall clock", note: "Essential backups / utility", priority: "must", qty: 5, unitPrice: 2000, link: "" },
        { id: "sc3", label: "Water purifier & dispenser", note: "RO / UV unit with hot & cold option", priority: "must", qty: 1, unitPrice: 12000, link: "" },
        { id: "sc4", label: "Electric kettle", note: "For tea, coffee, and quick refreshments", priority: "must", qty: 1, unitPrice: 1500, link: "" },
        { id: "sc5", label: "Pantry supplies", note: "Cups, glasses, water bottles, coffee / tea sachets", priority: "must", qty: 1, unitPrice: 3000, link: "" },
        { id: "sc6", label: "Dustbins", note: "Colour-coded for dry and wet waste segregation", priority: "must", qty: 4, unitPrice: 400, link: "" },
        { id: "sc7", label: "Waiting area sofa", note: "Premium look for prospective parents / students", priority: "nice", qty: 1, unitPrice: 25000, link: "" },
        { id: "sc8", label: "Charging station", note: "Multi-dock charging station for phones", priority: "nice", qty: 2, unitPrice: 3000, link: "" },
        { id: "sc9", label: "Coffee machine", note: "Automated vendor type for premium convenience", priority: "nice", qty: 1, unitPrice: 20000, link: "" },
        { id: "sc10", label: "Mini refrigerator & microwave", note: "For staff and long-hour student bootcamps", priority: "nice", qty: 1, unitPrice: 18000, link: "" },
      ],
    },
    {
      id: "safety",
      title: "Cleaning, Safety & Security",
      items: [
        { id: "s1", label: "Vacuum cleaner", note: "Essential to keep heavy electronic equipment dust-free", priority: "must", qty: 1, unitPrice: 8000, link: "" },
        { id: "s2", label: "Mop, bucket & cloths", note: "Daily maintenance essentials", priority: "must", qty: 1, unitPrice: 1000, link: "" },
        { id: "s3", label: "CCTV camera setup", note: "High definition coverage of reception & lab", priority: "must", qty: 1, unitPrice: 25000, link: "" },
        { id: "s4", label: "Fire extinguisher", note: "CO2 / powder type rated for electrical fires", priority: "must", qty: 2, unitPrice: 2500, link: "" },
        { id: "s5", label: "First aid kit & emergency lights", note: "Basic medical response + backup path lighting", priority: "must", qty: 1, unitPrice: 3000, link: "" },
        { id: "s6", label: "Surge protectors", note: "Protects high-end computer infrastructure", priority: "must", qty: 5, unitPrice: 1500, link: "" },
      ],
    },
    {
      id: "marketing",
      title: "Marketing, Branding & IT Infrastructure",
      items: [
        { id: "m1", label: "Institute physical signage", note: "Exterior backlit / LED glow signboard", priority: "must", qty: 1, unitPrice: 35000, link: "" },
        { id: "m2", label: "Reception branding wall", note: "Acrylic or 3D logo installation", priority: "must", qty: 1, unitPrice: 20000, link: "" },
        { id: "m3", label: "Roll-up standees & brochures", note: "For walk-in leads and events", priority: "must", qty: 3, unitPrice: 4000, link: "" },
        { id: "m4", label: "High-speed broadband", note: "Fibre line with dedicated bandwidth", priority: "must", qty: 1, unitPrice: 5000, link: "" },
        { id: "m5", label: "Network switches & APs", note: "Distributes uniform load across classroom", priority: "must", qty: 1, unitPrice: 15000, link: "" },
        { id: "m6", label: "Antivirus & backup drive", note: "External HDD / cloud for student project data", priority: "must", qty: 1, unitPrice: 6000, link: "" },
        { id: "m7", label: "Trainer machine (AI lab)", note: "Intel Core i7 / Ryzen 7+ · 32GB DDR5 · NVIDIA RTX GPU (8GB VRAM) · 1TB NVMe SSD", priority: "must", qty: 1, unitPrice: 150000, link: "" },
      ],
    },
  ],
  timeline: [
    { phase: "Week 1", tag: "Essential launch", text: "ACs, chairs, desks, high-speed Wi-Fi, colour InkTank printer, whiteboard, fire extinguisher, electric kettle, basic exterior signage." },
    { phase: "Month 1", tag: "Stabilisation", text: "Vacuum cleaner, laminator, UPS / inverter backup, smart TV / projector system, admin filing cabinets." },
    { phase: "Month 2+", tag: "Expansion", text: "Interactive smart board, dedicated AI student computer lab, mini refrigerator, coffee machine, advanced branding assets." },
  ],
  aiSpecs: ["Intel Core i7 or AMD Ryzen 7+", "32GB DDR5 RAM", "NVIDIA RTX GPU (min. 8GB VRAM)", "1TB NVMe SSD"],
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
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  as?: "span" | "div" | "h1";
}) {
  const Tag = as as any;
  return (
    <Tag
      className={`editable ${className}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.textContent ?? "")}
    >
      {value}
    </Tag>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AppData) : initialData;
    } catch {
      return initialData;
    }
  });
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "-checked");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ qty: 0, unitPrice: 0, link: "" });
  const [filter, setFilter] = useState<"all" | "must" | "nice">("all");
  const fileInput = useRef<HTMLInputElement>(null);

  // ── Persist to localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveStatus("saved");
      const t = setTimeout(() => setSaveStatus("idle"), 1200);
      return () => clearTimeout(t);
    } catch {
      // storage unavailable (e.g. private browsing quota) — fail silently
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + "-checked", JSON.stringify(checked));
    } catch {
      // ignore
    }
  }, [checked]);

  // ── Derived ──
  const allItems = useMemo(() => data.sections.flatMap((s) => s.items), [data]);
  const totalEstimate = allItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const checkedTotal = allItems
    .filter((i) => checked[i.id])
    .reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const budgetPct = Math.min(100, (totalEstimate / data.budgetMax) * 100);
  const budgetState =
    totalEstimate > data.budgetMax ? "over" : totalEstimate > data.budgetMin ? "ok" : "under";
  const budgetStatus =
    budgetState === "over" ? "Over budget" : budgetState === "ok" ? "Within range" : "Under minimum";

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
  }
  function removeSection(sectionId: string) {
    setData((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== sectionId) }));
  }

  function resetAll() {
    if (!confirm("Reset to the default checklist? This clears everything saved in this browser.")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + "-checked");
    setData(initialData);
    setChecked({});
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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
        setData(parsed);
        setChecked({});
      } catch {
        alert("Couldn't read that file — please pick a checklist JSON exported from this page.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Render ──
  return (
    <div className="ulx">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <Editable value={data.instituteName} onChange={(v) => patchTop("instituteName", v)} className="header-brand" />
          <span className="header-divider" />
          <Editable value={data.instituteTag} onChange={(v) => patchTop("instituteTag", v)} className="header-tag" />
        </div>
        <Editable value={data.docTitle} onChange={(v) => patchTop("docTitle", v)} as="h1" className="header-title" />
        <div className="header-meta">
          <Editable value={data.targetNote} onChange={(v) => patchTop("targetNote", v)} />
          <span>
            Budget&nbsp;
            <Editable
              value={fmt(data.budgetMin).replace("₹", "")}
              onChange={(v) => patchTop("budgetMin", Number(v.replace(/[^\d]/g, "")) || 0)}
              className="header-meta-strong"
            />
            {" – "}
            <Editable
              value={fmt(data.budgetMax).replace("₹", "")}
              onChange={(v) => patchTop("budgetMax", Number(v.replace(/[^\d]/g, "")) || 0)}
              className="header-meta-strong"
            />
          </span>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="summary-bar no-print">
        <div>
          <div className="summary-stat-label">Total estimate</div>
          <div className={`summary-stat-value budget-${budgetState}`}>{fmt(totalEstimate)}</div>
        </div>
        <div>
          <div className="summary-stat-label">Procured value</div>
          <div className="summary-stat-value procured">{fmt(checkedTotal)}</div>
        </div>
        <div>
          <div className="summary-stat-label">Items checked</div>
          <div className="summary-stat-value">{checkedCount} / {allItems.length}</div>
        </div>
        <div className="budget-bar-wrap">
          <div className="budget-bar-label">vs maximum budget</div>
          <div className="budget-bar-track">
            <div className={`budget-bar-fill budget-${budgetState}`} style={{ width: budgetPct + "%" }} />
          </div>
          <div className={`budget-bar-status budget-${budgetState}`}>{budgetStatus}</div>
        </div>
        <div className="filter-group">
          {(["all", "must", "nice"] as const).map((f) => (
            <button
              key={f}
              className={`pill-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "must" ? "Must have" : "Nice to have"}
            </button>
          ))}
        </div>
        <div className="action-group">
          <span className={`save-indicator ${saveStatus}`}>{saveStatus === "saved" ? "Saved" : ""}</span>
          <button className="pill-btn" onClick={() => window.print()}>Print</button>
          <button className="pill-btn" onClick={exportJSON}>Export</button>
          <button className="pill-btn" onClick={() => fileInput.current?.click()}>Import</button>
          <button className="pill-btn danger-text" onClick={resetAll}>Reset</button>
          <input ref={fileInput} type="file" accept="application/json" onChange={importJSON} hidden />
        </div>
      </div>

      {/* Sections */}
      <div className="main">
        {data.sections.map((section) => {
          const items = section.items.filter((i) => filter === "all" || i.priority === filter);
          const sectionTotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

          return (
            <div key={section.id} className="section-card">
              <div className="section-header">
                <Editable
                  value={section.title}
                  onChange={(v) => patchSection(section.id, "title", v)}
                  className="section-header-title"
                />
                <div className="section-header-actions">
                  <span className="section-header-total">{fmt(sectionTotal)}</span>
                  <button className="mini-btn no-print" onClick={() => addItem(section.id)}>+ Item</button>
                  <button className="mini-btn danger no-print" onClick={() => removeSection(section.id)}>Remove</button>
                </div>
              </div>

              <div className="table-header no-print">
                <span />
                <span>Item</span>
                <span className="col-desktop">Qty</span>
                <span className="col-desktop">Unit price</span>
                <span className="col-desktop">Total</span>
                <span>Link</span>
                <span />
              </div>

              {items.map((item) => {
                const isEditing = editingId === item.id;
                const rowTotal = item.qty * item.unitPrice;
                return (
                  <div key={item.id} className={`item-row${checked[item.id] ? " checked" : ""}`}>
                    <input
                      type="checkbox"
                      className="item-checkbox"
                      checked={!!checked[item.id]}
                      onChange={() => toggleCheck(item.id)}
                    />

                    <div>
                      <div className="item-label-row">
                        <Editable
                          value={item.label}
                          onChange={(v) => patchItem(section.id, item.id, { label: v })}
                          className={checked[item.id] ? "item-label checked-text" : "item-label"}
                        />
                        <span
                          className={`priority-badge no-print ${item.priority}`}
                          onClick={() => togglePriority(section.id, item.id, item.priority)}
                        >
                          {item.priority === "nice" ? "Nice to have" : "Must have"}
                        </span>
                      </div>
                      <Editable
                        value={item.note}
                        onChange={(v) => patchItem(section.id, item.id, { note: v })}
                        as="div"
                        className="item-note"
                      />
                    </div>

                    <div className="col-desktop">
                      {isEditing ? (
                        <input
                          type="number"
                          className="edit-input-sm"
                          value={editState.qty}
                          onChange={(e) => setEditState((s) => ({ ...s, qty: e.target.value }))}
                        />
                      ) : (
                        <span className="item-qty">{item.qty}</span>
                      )}
                    </div>

                    <div className="col-desktop">
                      {isEditing ? (
                        <input
                          type="number"
                          className="edit-input-md"
                          value={editState.unitPrice}
                          onChange={(e) => setEditState((s) => ({ ...s, unitPrice: e.target.value }))}
                        />
                      ) : (
                        <span className="item-unit-price">{fmt(item.unitPrice)}</span>
                      )}
                    </div>

                    <div className="col-desktop">
                      <span className="item-total">{fmt(rowTotal)}</span>
                    </div>

                    <div style={{ overflow: "hidden" }}>
                      {isEditing ? (
                        <input
                          type="url"
                          className="edit-input-url"
                          placeholder="https://..."
                          value={editState.link}
                          onChange={(e) => setEditState((s) => ({ ...s, link: e.target.value }))}
                        />
                      ) : item.link ? (
                        <a href={item.link} target="_blank" rel="noreferrer" className="item-link-text">
                          View ↗
                        </a>
                      ) : (
                        <span className="item-link-empty">—</span>
                      )}
                    </div>

                    <div className="row-actions no-print">
                      {isEditing ? (
                        <button className="btn-save" onClick={() => saveEdit(section.id, item.id)}>Save</button>
                      ) : (
                        <button className="btn-edit" onClick={() => startEdit(item)}>Edit</button>
                      )}
                      <button className="btn-delete" onClick={() => removeItem(section.id, item.id)}>×</button>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <div className="empty-note">No items in this section yet.</div>}
            </div>
          );
        })}

        <button className="add-section-btn no-print" onClick={addSection}>+ Add section</button>

        {/* Timeline */}
        <div className="timeline-card">
          <div className="timeline-title">Procurement timeline</div>
          <div className="timeline-grid">
            {data.timeline.map((t, idx) => (
              <div key={idx} className="timeline-phase">
                <div className="timeline-phase-name">{t.phase}</div>
                <div className="timeline-phase-tag">{t.tag}</div>
                <Editable
                  value={t.text}
                  onChange={(v) =>
                    setData((d) => ({
                      ...d,
                      timeline: d.timeline.map((tt, i) => (i === idx ? { ...tt, text: v } : tt)),
                    }))
                  }
                  as="div"
                  className="timeline-phase-text"
                />
              </div>
            ))}
          </div>
        </div>

        {/* AI Lab Specs */}
        <div className="ailab-card">
          <div className="ailab-title">Recommended AI training lab specs</div>
          <div className="ailab-specs">
            {data.aiSpecs.map((spec, idx) => (
              <Editable
                key={idx}
                value={spec}
                onChange={(v) =>
                  setData((d) => ({ ...d, aiSpecs: d.aiSpecs.map((s, i) => (i === idx ? v : s)) }))
                }
                className="ailab-spec-chip"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}