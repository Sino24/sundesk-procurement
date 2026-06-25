import { useState } from "react";
import "./App.css";

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

interface EditState {
  qty: number | string;
  unitPrice: number | string;
  link: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

const initialData: { sections: Section[] } = {
  sections: [
    {
      id: "classroom",
      title: "1. Classroom & Training Equipment",
      items: [
        { id: "c1", label: "Student desks and chairs", note: "Ergonomic, optimized for 20-30 seats", priority: "must", qty: 25, unitPrice: 3500, link: "" },
        { id: "c2", label: "Trainer table and chair", note: "Comfortable for long lectures", priority: "must", qty: 1, unitPrice: 8000, link: "" },
        { id: "c3", label: "Whiteboard / Glass board", note: "Large format, scratch-resistant", priority: "must", qty: 1, unitPrice: 6000, link: "" },
        { id: "c4", label: "Projector / Smart TV", note: '55"–75" with 4K support recommended', priority: "must", qty: 1, unitPrice: 45000, link: "" },
        { id: "c5", label: "Laser pointer / Clicker", note: "For slide presentations", priority: "must", qty: 1, unitPrice: 1500, link: "" },
        { id: "c6", label: "Extension boards", note: "Heavy duty for student laptops", priority: "must", qty: 5, unitPrice: 800, link: "" },
        { id: "c7", label: "Wi-Fi Router & Backup", note: "High concurrency connection", priority: "must", qty: 2, unitPrice: 8000, link: "" },
        { id: "c8", label: "UPS / Inverter backup", note: "Minimum 2-3 hours backup capacity", priority: "must", qty: 1, unitPrice: 25000, link: "" },
        { id: "c9", label: "Desktop PCs / Laptops", note: "Optional if students bring own devices", priority: "must", qty: 0, unitPrice: 55000, link: "" },
        { id: "c10", label: "Interactive Smart Board", note: "Replaces standard whiteboard", priority: "nice", qty: 1, unitPrice: 80000, link: "" },
        { id: "c11", label: "Wireless presentation clicker", note: "Advanced range with digital pointer", priority: "nice", qty: 1, unitPrice: 3000, link: "" },
        { id: "c12", label: "Document camera", note: "For live demonstration of physical components", priority: "nice", qty: 1, unitPrice: 12000, link: "" },
      ],
    },
    {
      id: "office",
      title: "2. Office & Administration",
      items: [
        { id: "o1", label: "Reception desk & Office chairs", note: "First point of visual branding", priority: "must", qty: 1, unitPrice: 15000, link: "" },
        { id: "o2", label: "Visitor chairs & Notice board", note: "For displaying updates/schedules", priority: "must", qty: 4, unitPrice: 2000, link: "" },
        { id: "o3", label: "Biometric attendance machine", note: "To track student/staff entry logs", priority: "must", qty: 1, unitPrice: 5000, link: "" },
        { id: "o4", label: "Telephone system", note: "Dedicated landline or mobile desk phone", priority: "must", qty: 1, unitPrice: 2000, link: "" },
        { id: "o5", label: "Lockable cupboard", note: "Secure document storage", priority: "must", qty: 2, unitPrice: 6000, link: "" },
        { id: "o6", label: "Fireproof document box", note: "For registrations and legal papers", priority: "must", qty: 1, unitPrice: 4000, link: "" },
      ],
    },
    {
      id: "printing",
      title: "3. Printing & Stationery",
      items: [
        { id: "p1", label: "Colour printer", note: "EcoTank / InkTank type for low-cost color printing", priority: "must", qty: 1, unitPrice: 18000, link: "" },
        { id: "p2", label: "Black & white laser printer", note: "High speed for bulk handouts", priority: "must", qty: 1, unitPrice: 12000, link: "" },
        { id: "p3", label: "Scanner & Laminator", note: "Laminator is critical for certificate preservation", priority: "must", qty: 1, unitPrice: 8000, link: "" },
        { id: "p4", label: "Paper cutter", note: "For brochures and custom handouts", priority: "must", qty: 1, unitPrice: 2500, link: "" },
        { id: "p5", label: "Consumables Pack", note: "A4 paper, Certificate sheets, Markers, Sticky notes, Punch, Files", priority: "must", qty: 1, unitPrice: 5000, link: "" },
      ],
    },
    {
      id: "comfort",
      title: "4. Student Comfort & Pantry",
      items: [
        { id: "sc1", label: "Air Conditioners (AC)", note: "Sized correctly for 30 people + computers", priority: "must", qty: 3, unitPrice: 45000, link: "" },
        { id: "sc2", label: "Ceiling fans & Wall clock", note: "Essential backups / utility", priority: "must", qty: 5, unitPrice: 2000, link: "" },
        { id: "sc3", label: "Water purifier & Dispenser", note: "RO / UV unit with hot & cold option", priority: "must", qty: 1, unitPrice: 12000, link: "" },
        { id: "sc4", label: "Electric kettle", note: "For tea, coffee, and quick refreshments", priority: "must", qty: 1, unitPrice: 1500, link: "" },
        { id: "sc5", label: "Pantry supplies", note: "Cups, glasses, water bottles, coffee/tea sachets", priority: "must", qty: 1, unitPrice: 3000, link: "" },
        { id: "sc6", label: "Dustbins", note: "Color-coded for dry and wet waste segregation", priority: "must", qty: 4, unitPrice: 400, link: "" },
        { id: "sc7", label: "Waiting area sofa", note: "Premium look for prospective parents/students", priority: "nice", qty: 1, unitPrice: 25000, link: "" },
        { id: "sc8", label: "Charging station", note: "Multi-dock charging station for phones", priority: "nice", qty: 2, unitPrice: 3000, link: "" },
        { id: "sc9", label: "Coffee machine", note: "Automated vendor type for premium convenience", priority: "nice", qty: 1, unitPrice: 20000, link: "" },
        { id: "sc10", label: "Mini refrigerator & Microwave", note: "For staff and long-hour student bootcamps", priority: "nice", qty: 1, unitPrice: 18000, link: "" },
      ],
    },
    {
      id: "safety",
      title: "5. Cleaning, Safety & Security",
      items: [
        { id: "s1", label: "Vacuum cleaner", note: "Essential to keep heavy electronic equipment dust-free", priority: "must", qty: 1, unitPrice: 8000, link: "" },
        { id: "s2", label: "Mop, bucket & cloths", note: "Daily maintenance essentials", priority: "must", qty: 1, unitPrice: 1000, link: "" },
        { id: "s3", label: "CCTV camera setup", note: "High definition coverage of reception & lab", priority: "must", qty: 1, unitPrice: 25000, link: "" },
        { id: "s4", label: "Fire extinguisher", note: "CO2 / Powder type rated for electrical fires", priority: "must", qty: 2, unitPrice: 2500, link: "" },
        { id: "s5", label: "First aid kit & Emergency lights", note: "Basic medical response + backup path lighting", priority: "must", qty: 1, unitPrice: 3000, link: "" },
        { id: "s6", label: "Surge protectors", note: "Protects high-end computer infrastructure", priority: "must", qty: 5, unitPrice: 1500, link: "" },
      ],
    },
    {
      id: "marketing",
      title: "6. Marketing, Branding & IT Infrastructure",
      items: [
        { id: "m1", label: "Institute physical signage", note: "Exterior backlit/LED glow signboard", priority: "must", qty: 1, unitPrice: 35000, link: "" },
        { id: "m2", label: "Reception branding wall", note: "Acrylic or 3D logo installation", priority: "must", qty: 1, unitPrice: 20000, link: "" },
        { id: "m3", label: "Roll-up standees & Brochures", note: "For walk-in leads and events", priority: "must", qty: 3, unitPrice: 4000, link: "" },
        { id: "m4", label: "High-speed broadband", note: "Fiber line with dedicated bandwidth", priority: "must", qty: 1, unitPrice: 5000, link: "" },
        { id: "m5", label: "Network switches & APs", note: "Distributes uniform load across classroom", priority: "must", qty: 1, unitPrice: 15000, link: "" },
        { id: "m6", label: "Antivirus & Backup drive", note: "External HDD/Cloud for student project data", priority: "must", qty: 1, unitPrice: 6000, link: "" },
        { id: "m7", label: "Trainer Machine (AI Lab)", note: "Intel Core i7 / Ryzen 7+ | 32GB DDR5 | NVIDIA RTX GPU (8GB VRAM) | 1TB NVMe SSD", priority: "must", qty: 1, unitPrice: 150000, link: "" },
      ],
    },
  ],
};

const BUDGET_MIN = 2_000_000;
const BUDGET_MAX = 5_000_000;

const TIMELINE_PHASES = [
  {
    phase: "Week 1",
    tag: "Essential Launch",
    color: "#dcfce7",
    border: "#22c55e",
    text: "ACs, Chairs, Desks, High-Speed Wi-Fi, Colour InkTank Printer, Whiteboard, Fire Extinguisher, Electric Kettle, Basic Exterior Signage.",
  },
  {
    phase: "Month 1",
    tag: "Stabilization",
    color: "#fef9c3",
    border: "#f59e0b",
    text: "Vacuum Cleaner, Laminator, UPS/Inverter Backup, Smart TV/Projector system, Admin Filing Cabinets.",
  },
  {
    phase: "Month 2+",
    tag: "Expansion",
    color: "#dbeafe",
    border: "#2563eb",
    text: "Interactive Smart Board, Dedicated AI Student Computer Lab, Mini Refrigerator, Coffee Machine, Advanced Branding Assets.",
  },
];

const AI_SPECS = [
  "Intel Core i7 or AMD Ryzen 7+",
  "32GB DDR5 RAM",
  "NVIDIA RTX GPU (Min. 8GB VRAM)",
  "1TB NVMe SSD",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ULearnsProcurement() {
  const [data, setData] = useState(initialData);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ qty: 0, unitPrice: 0, link: "" });
  const [filter, setFilter] = useState<"all" | "must" | "nice">("all");

  // ── Derived ──
  const allItems = data.sections.flatMap((s) => s.items);
  const totalEstimate = allItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const checkedTotal = allItems
    .filter((i) => checked[i.id])
    .reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const budgetPct = Math.min(100, (totalEstimate / BUDGET_MAX) * 100);
  const budgetColor =
    totalEstimate > BUDGET_MAX ? "#ef4444" : totalEstimate > BUDGET_MIN ? "#f59e0b" : "#22c55e";
  const budgetStatus =
    totalEstimate > BUDGET_MAX ? "Over budget" : totalEstimate > BUDGET_MIN ? "Within range" : "Under minimum";

  // ── Handlers ──
  function toggleCheck(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditState({ qty: item.qty, unitPrice: item.unitPrice, link: item.link });
  }

  function saveEdit(sectionId: string, itemId: string) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              items: s.items.map((i) =>
                i.id !== itemId
                  ? i
                  : {
                      ...i,
                      qty: Number(editState.qty),
                      unitPrice: Number(editState.unitPrice),
                      link: editState.link,
                    }
              ),
            }
      ),
    }));
    setEditingId(null);
  }

  // ── Render ──
  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <span className="header-brand">ULearns</span>
          <span className="header-badge">Institute of AI &amp; Technology</span>
        </div>
        <div className="header-title">Procurement &amp; Essentials Checklist</div>
        <div className="header-meta">
          <span>🎯 Target: 20–30 Students</span>
          <span>💰 Budget: {fmt(BUDGET_MIN)} – {fmt(BUDGET_MAX)}</span>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="summary-bar">
        <div>
          <div className="summary-stat-label">Total Estimate</div>
          <div className="summary-stat-value" style={{ color: budgetColor }}>{fmt(totalEstimate)}</div>
        </div>
        <div>
          <div className="summary-stat-label">Procured Value</div>
          <div className="summary-stat-value" style={{ color: "#00a881" }}>{fmt(checkedTotal)}</div>
        </div>
        <div>
          <div className="summary-stat-label">Items Checked</div>
          <div className="summary-stat-value">{checkedCount} / {allItems.length}</div>
        </div>
        <div className="budget-bar-wrap">
          <div className="budget-bar-label">vs Max Budget</div>
          <div className="budget-bar-track">
            <div className="budget-bar-fill" style={{ width: budgetPct + "%", background: budgetColor }} />
          </div>
          <div className="budget-bar-status" style={{ color: budgetColor }}>{budgetStatus}</div>
        </div>
        <div className="filter-group">
          {(["all", "must", "nice"] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "must" ? "✔ Must Have" : "◎ Nice to Have"}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="main">
        {data.sections.map((section) => {
          const items = section.items.filter((i) => filter === "all" || i.priority === filter);
          if (!items.length) return null;
          const sectionTotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

          return (
            <div key={section.id} className="section-card">
              {/* Section Header */}
              <div className="section-header">
                <span className="section-header-title">{section.title}</span>
                <span className="section-header-total">{fmt(sectionTotal)}</span>
              </div>

              {/* Table Header */}
              <div className="table-header">
                <span />
                <span>Item</span>
                <span className="col-desktop">Qty</span>
                <span className="col-desktop">Unit Price</span>
                <span className="col-desktop">Total</span>
                <span>Link</span>
                <span />
              </div>

              {/* Rows */}
              {items.map((item) => {
                const isEditing = editingId === item.id;
                const rowTotal = item.qty * item.unitPrice;
                return (
                  <div key={item.id} className={`item-row${checked[item.id] ? " checked" : ""}`}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      className="item-checkbox"
                      checked={!!checked[item.id]}
                      onChange={() => toggleCheck(item.id)}
                    />

                    {/* Label + Note */}
                    <div>
                      <div className="item-label">
                        <span className={checked[item.id] ? "checked-text" : ""}>{item.label}</span>
                        {item.priority === "nice" && <span className="nice-badge">Nice</span>}
                      </div>
                      <div className="item-note">{item.note}</div>
                    </div>

                    {/* Qty */}
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

                    {/* Unit Price */}
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

                    {/* Row Total */}
                    <div className="col-desktop">
                      <span className="item-total">{fmt(rowTotal)}</span>
                    </div>

                    {/* Link */}
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
                          🔗 View
                        </a>
                      ) : (
                        <span className="item-link-empty">—</span>
                      )}
                    </div>

                    {/* Edit / Save */}
                    <div>
                      {isEditing ? (
                        <button className="btn-save" onClick={() => saveEdit(section.id, item.id)}>✓</button>
                      ) : (
                        <button className="btn-edit" onClick={() => startEdit(item)}>✎</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Timeline */}
        <div className="timeline-card">
          <div className="timeline-title">⏱ Procurement Timeline</div>
          <div className="timeline-grid">
            {TIMELINE_PHASES.map((t) => (
              <div
                key={t.phase}
                className="timeline-phase"
                style={{ background: t.color, borderColor: t.border }}
              >
                <div className="timeline-phase-name" style={{ color: t.border }}>{t.phase}</div>
                <div className="timeline-phase-tag">{t.tag}</div>
                <div className="timeline-phase-text">{t.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Lab Specs */}
        <div className="ailab-card">
          <div className="ailab-title">🚀 Recommended AI Training Lab Specs</div>
          <div className="ailab-specs">
            {AI_SPECS.map((spec) => (
              <span key={spec} className="ailab-spec-chip">{spec}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}