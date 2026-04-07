import { useState, useEffect, useMemo } from "react";

const THEMES = {
  dark: {
    bg: "#0a0e17", card: "#111827", border: "#1e293b", muted: "#475569",
    dim: "#64748b", text: "#94a3b8", bright: "#f1f5f9", accent: "#8b5cf6",
    headerBg: "#0a0e17", tabActive: "#1e293b", tabText: "#64748b",
    tabTextActive: "#f1f5f9", shadow: "none", cardShadow: "none",
  },
  light: {
    bg: "#e8ecf2", card: "#f0f2f7", border: "#d0d6e0", muted: "#8892a4",
    dim: "#5f6b7e", text: "#3d4758", bright: "#151b28", accent: "#6366f1",
    headerBg: "#edf0f5", tabActive: "#d8dde8", tabText: "#8892a4",
    tabTextActive: "#151b28", shadow: "0 1px 3px rgba(0,0,0,0.06)", cardShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
};

const F = { display: '"Sora", sans-serif', body: '"DM Sans", sans-serif', mono: '"DM Mono", monospace' };

// Calm, unified palette — no hot pinks or alarm reds
const P = {
  accent: "#818cf8",   // soft indigo — primary accent everywhere
  teal: "#2dd4bf",     // macro/nutrition data
  blue: "#60a5fa",     // protein / fitness
  green: "#4ade80",    // positive / carbs
  amber: "#fbbf24",    // fat / finance
  coral: "#fca5a5",    // over-budget (muted, not alarming)
  slate: "#94a3b8",    // neutral data
};

// ─────────────────────────────────────────────────────────
// USER CONFIG — edit these to match your personal targets
// In production: loaded from dashboard/config.yaml
// ─────────────────────────────────────────────────────────

const USER_CONFIG = {
  // Body — used for protein/kg calculation
  body_weight_kg: 90,

  // Daily targets
  calories_target: 2500,
  protein_target_g: 144,                // 1.6 g/kg × 90kg
  fat_target_g: 78,                     // ~28% of 2500 kcal
  carbs_target_g: 295,                  // ~47% of 2500 kcal

  // Protein per kg body weight target
  // Sedentary: 0.8 | Active: 1.2–1.6 | Resistance training: 1.6–2.2
  protein_per_kg_target: 1.6,

  // Macro composition targets (percentages, should sum to 100)
  macro_split_target: { protein: 25, fat: 28, carbs: 47 },

  // Heatmap calorie ranges — defines color thresholds
  heatmap: {
    fasting_max: 0,
    low_max: 2000,
    normal_max: 2500,
    elevated_max: 3000,
  },

  // Meal timing — day range for the timeline axis
  timeline_start_hour: 6,
  timeline_end_hour: 22,
};

// ── SKILL MANIFESTS ──

const SKILL_MANIFESTS = [
  {
    id: "nutrition", display_name: "Nutrition", icon: "🍱", color: P.accent, sort_order: 1,
    summary: {
      primary: { label: "Today", value: "1,847", unit: "kcal", target: USER_CONFIG.calories_target.toLocaleString() },
      secondary: [{ label: "Protein", value: (94 / USER_CONFIG.body_weight_kg).toFixed(2) + " g/kg", pct: Math.round((94 / USER_CONFIG.body_weight_kg) / USER_CONFIG.protein_per_kg_target * 100) }, { label: "Fat", value: "62g", pct: Math.round(62 / USER_CONFIG.fat_target_g * 100) }, { label: "Carbs", value: "198g", pct: Math.round(198 / USER_CONFIG.carbs_target_g * 100) }],
      footnote: `Protein at ${(94 / USER_CONFIG.body_weight_kg).toFixed(2)} g/kg — ${(94 / USER_CONFIG.body_weight_kg) < USER_CONFIG.protein_per_kg_target ? "below" : "above"} ${USER_CONFIG.protein_per_kg_target} g/kg target`,
    },
    widgets: [
      { id: "summary_cards", type: "card", title: "Monthly Averages", size: "large", render: "nutrition_summary_cards" },
      { id: "yearly_heatmap", type: "chart", title: "Daily Calorie Heatmap — 2026", size: "large", render: "nutrition_heatmap" },
      { id: "todays_macros", type: "card", title: "Today's Macros", size: "large", render: "nutrition_macros" },
      { id: "todays_meals", type: "table", title: "Today's Log", size: "large", render: "nutrition_meals" },
      { id: "meal_timing", type: "chart", title: "Meal Timing — This Month", size: "medium", render: "nutrition_meal_timing" },
      { id: "macro_comp", type: "chart", title: "Macro Composition", size: "medium", render: "nutrition_macro_comp" },
      { id: "monthly_insights", type: "card", title: "Monthly Insights — April", size: "large", render: "nutrition_insights" },
    ],
  },
  {
    id: "fitness", display_name: "Fitness", icon: "💪", color: P.accent, sort_order: 2,
    summary: {
      primary: { label: "This week", value: "2/3", unit: "sessions" },
      secondary: [{ label: "Weight", value: "81.2 kg", pct: null }, { label: "Trend", value: "↓ 0.4 kg", pct: null }],
      footnote: "Calisthenics Mon, Swimming Wed — Fri remaining",
    },
    widgets: [
      { id: "weekly_schedule", type: "card", title: "This Week", size: "large", render: "fitness_week" },
      { id: "body_comp", type: "card", title: "Body Composition", size: "large", render: "fitness_body" },
      { id: "weight_chart", type: "chart", title: "Weight Trend (12 weeks)", size: "large", render: "fitness_weight_trend" },
      { id: "monthly_calendar", type: "chart", title: "April Activity", size: "medium", render: "fitness_calendar" },
      { id: "body_stats", type: "card", title: "Progress", size: "medium", render: "fitness_progress" },
    ],
  },
  {
    id: "finance", display_name: "Finance", icon: "💰", color: P.accent, sort_order: 3,
    summary: {
      primary: { label: "Spent", value: "£1,247", unit: "/ £2,500" },
      secondary: [{ label: "Groceries", value: "£340", pct: 76 }, { label: "Dining", value: "£285", pct: 95 }, { label: "Transport", value: "£180", pct: 90 }],
      footnote: "Dining at 95% of budget — 5 days remaining",
    },
    widgets: [
      { id: "budget_overview", type: "card", title: "Budget Overview", size: "large", render: "finance_budget" },
      { id: "spending_trend", type: "chart", title: "Daily Spending", size: "large", render: "finance_trend" },
      { id: "recent_transactions", type: "table", title: "Recent Transactions", size: "large", render: "finance_transactions" },
    ],
  },
];

// ── SHARED COMPONENTS ──

function Sparkline({ points, color, height = 40 }) {
  const id = useMemo(() => "sp" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg viewBox={`0 0 200 ${height}`} style={{ width: "100%", height }}>
      <polyline points={`${points} 200,${height} 0,${height}`} fill={`url(#${id})`} stroke="none" />
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.12" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bar({ pct, color, t, h = 4 }) {
  return (
    <div style={{ height: h, borderRadius: h, background: t.border }}>
      <div style={{ height: "100%", borderRadius: h, background: color, width: `${Math.min(100, pct)}%`, transition: "width 0.8s ease" }} />
    </div>
  );
}

function Stat({ label, value, sub, color, t }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "10px 6px", background: (color || t.dim) + "08", borderRadius: 8, border: `1px solid ${t.border}` }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || t.bright, fontFamily: F.display }}>{value}</div>
      <div style={{ fontSize: 9, color: t.dim, fontFamily: F.mono, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 8, color: t.muted, fontFamily: F.mono, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── CALORIE HEATMAP — rows=days(1-31), columns=months ──

function CalorieHeatmap({ t }) {
  const months = useMemo(() => {
    const seed = (d) => { const x = Math.sin(d * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const monthNames = ["Jan", "Feb", "Mar", "Apr"];
    const daysInMonth = [31, 28, 31, 30];
    const ms = [];
    let idx = 0;
    for (let mi = 0; mi < 4; mi++) {
      const days = [];
      const count = mi === 3 ? 4 : daysInMonth[mi];
      for (let d = 1; d <= 31; d++) {
        if (d <= count) {
          const r = seed(idx);
          let kcal;
          if (r < 0.03) kcal = 0;
          else if (r < 0.25) kcal = 1600 + Math.floor(seed(idx + 100) * 400);
          else if (r < 0.65) kcal = 2000 + Math.floor(seed(idx + 200) * 500);
          else if (r < 0.88) kcal = 2500 + Math.floor(seed(idx + 300) * 500);
          else kcal = 3000 + Math.floor(seed(idx + 400) * 400);
          days.push({ day: d, kcal });
          idx++;
        } else {
          days.push(null);
        }
      }
      const logged = days.filter((d) => d && d.kcal > 0);
      const avg = logged.length > 0 ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length) : 0;
      const fasts = days.filter((d) => d && d.kcal === 0).length;
      const over = logged.filter((d) => d.kcal >= 3000).length;
      ms.push({ name: monthNames[mi], days, avg, logged: logged.length + fasts, fasts, over });
    }
    return ms;
  }, []);

  const H = USER_CONFIG.heatmap;
  const getColor = (kcal) => {
    if (kcal <= H.fasting_max) return "#7c3aed";
    if (kcal < H.low_max) return "#22c55e";
    if (kcal < H.normal_max) return "#86efac";
    if (kcal < H.elevated_max) return "#facc15";
    return "#f97316";
  };

  const cs = 14, gap = 2;

  return (
    <div>
      {/* Day number header */}
      <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 4 }}>
        <div style={{ width: 32, flexShrink: 0 }} />
        <div style={{ display: "flex", gap }}>
          {Array.from({ length: 31 }, (_, i) => (
            <div key={i} style={{ width: cs, textAlign: "center", fontSize: 7, fontFamily: F.mono, color: (i + 1) % 5 === 1 || i === 0 ? t.dim : "transparent" }}>{i + 1}</div>
          ))}
        </div>
        <div style={{ width: 120, flexShrink: 0, paddingLeft: 12, fontSize: 8, fontFamily: F.mono, color: t.dim, fontWeight: 600 }}>MONTHLY</div>
      </div>
      {/* Month rows */}
      {months.map((month) => (
        <div key={month.name} style={{ display: "flex", alignItems: "center", marginBottom: gap }}>
          {/* Month label */}
          <div style={{ width: 32, flexShrink: 0, fontSize: 10, fontFamily: F.mono, color: t.dim, fontWeight: 600 }}>{month.name}</div>
          {/* Day cells */}
          <div style={{ display: "flex", gap }}>
            {month.days.map((day, di) => {
              if (!day) return <div key={di} style={{ width: cs, height: cs, borderRadius: 2, background: t.border }} />;
              return (
                <div key={di} title={`${month.name} ${day.day}: ${day.kcal === 0 ? "Fasting" : day.kcal + " kcal"}`}
                  style={{ width: cs, height: cs, borderRadius: 2, background: getColor(day.kcal), opacity: 0.85, cursor: "default" }} />
              );
            })}
          </div>
          {/* Month stats */}
          <div style={{ flexShrink: 0, paddingLeft: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontFamily: F.mono, color: t.bright, fontWeight: 600, width: 36, textAlign: "right" }}>
              {month.avg > 0 ? month.avg.toLocaleString() : "—"}
            </span>
            <span style={{ fontSize: 8, fontFamily: F.mono, color: t.muted, width: 28 }}>avg</span>
            {month.fasts > 0 && (
              <span style={{ fontSize: 8, fontFamily: F.mono, color: "#7c3aed" }}>{month.fasts}f</span>
            )}
            {month.over > 0 && (
              <span style={{ fontSize: 8, fontFamily: F.mono, color: "#f97316" }}>{month.over}↑</span>
            )}
          </div>
        </div>
      ))}
      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingLeft: 32, flexWrap: "wrap" }}>
        {[{ bg: t.border, l: "No data" }, { bg: "#7c3aed", l: "Fasting" }, { bg: "#22c55e", l: `<${USER_CONFIG.heatmap.low_max/1000}k` }, { bg: "#86efac", l: `${USER_CONFIG.heatmap.low_max/1000}–${USER_CONFIG.heatmap.normal_max/1000}k` }, { bg: "#facc15", l: `${USER_CONFIG.heatmap.normal_max/1000}–${USER_CONFIG.heatmap.elevated_max/1000}k` }, { bg: "#f97316", l: `${USER_CONFIG.heatmap.elevated_max/1000}k+` }].map((x) => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: x.bg, opacity: 0.85 }} />
            <span style={{ fontSize: 8, fontFamily: F.mono, color: t.dim }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WIDGET RENDERERS ──

const R = {
  // ── NUTRITION — ordered from 10,000ft to daily detail ──

  nutrition_summary_cards: ({ t }) => {
    const cards = [
      { label: "Avg Daily Calories", value: "2,340", unit: "kcal", delta: "+3.2%", up: true },
      { label: "Avg Protein", value: "98", unit: "g/day", delta: "−5.1%", up: false },
      { label: "Avg Fat", value: "95", unit: "g/day", delta: "+2.8%", up: true },
      { label: "Avg Carbs", value: "285", unit: "g/day", delta: "+1.4%", up: true },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: t.dim, fontFamily: F.mono, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{c.label}</div>
            <div>
              <span style={{ fontSize: 26, fontWeight: 700, color: t.bright, fontFamily: F.display }}>{c.value}</span>
              <span style={{ fontSize: 12, color: t.dim, fontWeight: 500, marginLeft: 4 }}>{c.unit}</span>
            </div>
            <div style={{ marginTop: 5, fontSize: 10, fontFamily: F.mono, fontWeight: 600, color: c.up ? "#f97316" : "#22c55e" }}>{c.delta} vs prev month</div>
          </div>
        ))}
      </div>
    );
  },

  nutrition_heatmap: ({ t }) => <CalorieHeatmap t={t} />,

  nutrition_trend_comp: ({ t }) => {
    // 4 weeks of data: stacked bars (P/F/C as kcal) + calorie trend line
    const weeks = [
      { label: "W1", days: [
        { p: 88, f: 54, c: 220 }, { p: 112, f: 63, c: 245 }, { p: 96, f: 58, c: 230 },
        { p: 104, f: 72, c: 260 }, { p: 78, f: 68, c: 210 }, { p: 68, f: 80, c: 270 }, { p: 72, f: 75, c: 255 },
      ]},
      { label: "W2", days: [
        { p: 110, f: 60, c: 235 }, { p: 98, f: 55, c: 240 }, { p: 120, f: 58, c: 225 },
        { p: 105, f: 65, c: 250 }, { p: 92, f: 70, c: 215 }, { p: 75, f: 82, c: 268 }, { p: 80, f: 78, c: 260 },
      ]},
      { label: "W3", days: [
        { p: 115, f: 56, c: 230 }, { p: 108, f: 62, c: 242 }, { p: 125, f: 52, c: 218 },
        { p: 100, f: 68, c: 255 }, { p: 95, f: 60, c: 235 }, { p: 70, f: 85, c: 275 }, { p: 82, f: 76, c: 248 },
      ]},
      { label: "W4", days: [
        { p: 118, f: 58, c: 238 }, { p: 102, f: 60, c: 245 }, { p: 130, f: 50, c: 220 },
        { p: 108, f: 62, c: 248 }, { p: 94, f: 62, c: 198 }, null, null,
      ]},
    ];
    // Convert grams to kcal: P×4, F×9, C×4
    const allDays = weeks.flatMap(w => w.days).filter(Boolean);
    const bars = allDays.map(d => ({
      pKcal: d.p * 4, fKcal: d.f * 9, cKcal: d.c * 4,
      total: d.p * 4 + d.f * 9 + d.c * 4,
    }));
    const maxKcal = Math.max(...bars.map(b => b.total));
    const chartH = 65, chartW = 440, barW = 14, gap = 2.5;
    const totalBars = bars.length;
    const startX = 2;

    // Build calorie trend line points
    const linePoints = bars.map((b, i) => {
      const x = startX + i * (barW + gap) + barW / 2;
      const y = chartH - (b.total / maxKcal) * (chartH - 8);
      return `${x},${y}`;
    }).join(" ");

    return (
      <div>
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${Math.max(chartW, totalBars * (barW + gap) + 20)} ${chartH + 22}`} style={{ width: "100%", minWidth: 400, height: chartH + 22 }}>
            {/* Target line */}
            <line x1="0" y1={chartH - (2100 / maxKcal) * (chartH - 8)} x2={totalBars * (barW + gap) + 20} y2={chartH - (2100 / maxKcal) * (chartH - 8)} stroke={t.muted} strokeWidth="0.5" strokeDasharray="4 3" />
            <text x={totalBars * (barW + gap) + 4} y={chartH - (2100 / maxKcal) * (chartH - 8) - 3} fill={t.muted} fontSize="7" fontFamily={F.mono}>2,100</text>

            {/* Stacked bars */}
            {bars.map((b, i) => {
              const x = startX + i * (barW + gap);
              const pH = (b.pKcal / maxKcal) * (chartH - 8);
              const fH = (b.fKcal / maxKcal) * (chartH - 8);
              const cH = (b.cKcal / maxKcal) * (chartH - 8);
              const cY = chartH - cH;
              const fY = cY - fH;
              const pY = fY - pH;
              return (
                <g key={i}>
                  <rect x={x} y={pY} width={barW} height={pH} rx={1} fill={P.blue} opacity="0.7" />
                  <rect x={x} y={fY} width={barW} height={fH} rx={0} fill={P.amber} opacity="0.6" />
                  <rect x={x} y={cY} width={barW} height={cH} rx={1} fill={P.green} opacity="0.5" />
                </g>
              );
            })}

            {/* Calorie trend line overlay */}
            <polyline points={linePoints} fill="none" stroke={t.bright} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

            {/* Week labels */}
            {weeks.map((w, wi) => {
              const dayCount = w.days.filter(Boolean).length;
              const xStart = startX + weeks.slice(0, wi).reduce((s, ww) => s + ww.days.filter(Boolean).length, 0) * (barW + gap);
              const xMid = xStart + (dayCount * (barW + gap)) / 2 - gap / 2;
              return <text key={wi} x={xMid} y={chartH + 16} textAnchor="middle" fill={t.muted} fontSize="8" fontFamily={F.mono}>{w.label}</text>;
            })}
          </svg>
        </div>

        {/* Legend + stats */}
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 9, fontFamily: F.mono, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: P.blue, opacity: 0.7 }} /><span style={{ color: t.text }}>Protein</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: P.amber, opacity: 0.6 }} /><span style={{ color: t.text }}>Fat</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: P.green, opacity: 0.5 }} /><span style={{ color: t.text }}>Carbs</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 1.5, borderRadius: 1, background: t.bright, opacity: 0.5 }} /><span style={{ color: t.text }}>Total kcal</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 0, borderTop: `1px dashed ${t.muted}` }} /><span style={{ color: t.muted }}>Target</span></div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <Stat label="Avg kcal" value="2,040" color={P.teal} t={t} />
          <Stat label="Avg protein" value="108g" sub="1.33 g/kg" color={P.blue} t={t} />
          <Stat label="Avg fibre" value="22g" sub="/ 30g target" color={P.green} t={t} />
        </div>
      </div>
    );
  },

  nutrition_macro_comp: ({ t }) => {
    const thisMonth = { p: 23, f: 30, c: 47, label: "April", avg: "2,040" };
    const lastMonth = { p: 19, f: 34, c: 47, label: "March", avg: "2,180" };
    const Donut = ({ data, cx, cy, r }) => {
      const total = data.p + data.f + data.c;
      const pAng = (data.p / total) * 360;
      const fAng = (data.f / total) * 360;
      const arc = (startDeg, endDeg) => {
        const s = (startDeg - 90) * Math.PI / 180;
        const e = (endDeg - 90) * Math.PI / 180;
        const large = endDeg - startDeg > 180 ? 1 : 0;
        return `M${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
      };
      return (
        <g>
          <path d={arc(0, pAng)} fill="none" stroke={P.blue} strokeWidth="8" strokeLinecap="round" />
          <path d={arc(pAng + 3, pAng + fAng)} fill="none" stroke={P.amber} strokeWidth="8" strokeLinecap="round" />
          <path d={arc(pAng + fAng + 3, 357)} fill="none" stroke={P.green} strokeWidth="8" strokeLinecap="round" />
          <text x={cx} y={cy - 4} textAnchor="middle" fill={t.bright} fontSize="11" fontFamily={F.display} fontWeight="700" dominantBaseline="middle">{data.label}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill={t.muted} fontSize="8" fontFamily={F.mono} dominantBaseline="middle">{data.avg} kcal</text>
        </g>
      );
    };
    const r = 38;
    return (
      <div>
        <svg viewBox="0 0 240 100" style={{ width: "100%", height: 120 }}>
          <Donut data={thisMonth} cx={60} cy={50} r={r} />
          <Donut data={lastMonth} cx={180} cy={50} r={r} />
          {/* Arrow between */}
          <text x="120" y="50" textAnchor="middle" fill={t.muted} fontSize="14" dominantBaseline="middle">←</text>
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: t.text }}>
              <span style={{ color: P.blue }}>P {thisMonth.p}%</span>
              <span style={{ color: t.muted, margin: "0 4px" }}>·</span>
              <span style={{ color: P.amber }}>F {thisMonth.f}%</span>
              <span style={{ color: t.muted, margin: "0 4px" }}>·</span>
              <span style={{ color: P.green }}>C {thisMonth.c}%</span>
            </div>
          </div>
          <div style={{ width: 40 }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: t.text }}>
              <span style={{ color: P.blue }}>P {lastMonth.p}%</span>
              <span style={{ color: t.muted, margin: "0 4px" }}>·</span>
              <span style={{ color: P.amber }}>F {lastMonth.f}%</span>
              <span style={{ color: t.muted, margin: "0 4px" }}>·</span>
              <span style={{ color: P.green }}>C {lastMonth.c}%</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 9, fontFamily: F.body, color: t.muted, textAlign: "center", borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
          Protein up 4% from March — fat down 4%. Carbs stable.
        </div>
      </div>
    );
  },

  nutrition_macros: ({ t }) => {
    const m = [
      { label: "Calories", value: "1,847", target: USER_CONFIG.calories_target.toLocaleString(), pct: Math.round(1847 / USER_CONFIG.calories_target * 100), color: P.teal },
      { label: "Protein", value: "94g", target: USER_CONFIG.protein_target_g + "g", pct: Math.round(94 / USER_CONFIG.protein_target_g * 100), color: P.blue },
      { label: "Fat", value: "62g", target: USER_CONFIG.fat_target_g + "g", pct: Math.round(62 / USER_CONFIG.fat_target_g * 100), color: P.amber },
      { label: "Carbs", value: "198g", target: USER_CONFIG.carbs_target_g + "g", pct: Math.round(198 / USER_CONFIG.carbs_target_g * 100), color: P.green },
    ];
    return (
      <div>
        <div style={{ display: "flex", gap: 10 }}>
          {m.map((x) => (
            <div key={x.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: x.color, fontFamily: F.display }}>{x.value}</div>
              <div style={{ fontSize: 9, color: t.dim, fontFamily: F.mono, marginBottom: 6 }}>{x.label}</div>
              <Bar pct={x.pct} color={x.color} t={t} />
              <div style={{ fontSize: 8, color: t.muted, fontFamily: F.mono, marginTop: 3 }}>/ {x.target}</div>
            </div>
          ))}
        </div>
        {/* Protein/kg callout */}
        <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 8, background: P.blue + "0a", border: `1px solid ${P.blue}18`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontFamily: F.body, color: t.text }}>Protein per kg body weight</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: F.display, color: (94 / USER_CONFIG.body_weight_kg) < USER_CONFIG.protein_per_kg_target ? P.amber : P.green }}>{(94 / USER_CONFIG.body_weight_kg).toFixed(2)}</span>
            <span style={{ fontSize: 10, fontFamily: F.mono, color: t.dim }}>g/kg</span>
            <span style={{ fontSize: 9, fontFamily: F.mono, color: t.muted }}>/ {USER_CONFIG.protein_per_kg_target} target</span>
          </div>
        </div>
      </div>
    );
  },

  nutrition_meal_timing: ({ t }) => {
    const meals = [
      { time: 8.5, label: "Porridge", kcal: 350, p: 8 },
      { time: 10.25, label: "Shake", kcal: 180, p: 32 },
      { time: 12.75, label: "Salmon wrap", kcal: 520, p: 38 },
      { time: 15.5, label: "Yogurt", kcal: 185, p: 12 },
      { time: 19.0, label: "Pasta", kcal: 612, p: 18 },
    ];
    const startH = USER_CONFIG.timeline_start_hour, endH = USER_CONFIG.timeline_end_hour;
    const maxKcal = 700;
    const chartW = 280, chartH = 70, barW = 18;
    const timeToX = (h) => ((h - startH) / (endH - startH)) * chartW;
    const kcalToH = (k) => (k / maxKcal) * (chartH - 12);
    return (
      <div>
        <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} style={{ width: "100%", height: chartH + 20 }}>
          {/* Time axis */}
          <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke={t.border} strokeWidth="0.5" />
          {/* Hour marks */}
          {Array.from({ length: Math.floor((endH - startH) / 2) + 1 }, (_, i) => startH + i * 2).map((h) => (
            <g key={h}>
              <line x1={timeToX(h)} y1={chartH - 2} x2={timeToX(h)} y2={chartH + 2} stroke={t.muted} strokeWidth="0.5" />
              <text x={timeToX(h)} y={chartH + 12} textAnchor="middle" fill={t.muted} fontSize="7" fontFamily={F.mono}>{h}:00</text>
            </g>
          ))}
          {/* Meal bars */}
          {meals.map((m, i) => {
            const x = timeToX(m.time) - barW / 2;
            const h = kcalToH(m.kcal);
            const pRatio = (m.p * 4) / m.kcal;
            const pH = h * pRatio;
            return (
              <g key={i}>
                {/* Full calorie bar — theme-aware, outlined */}
                <rect x={x} y={chartH - h} width={barW} height={h} rx={3} fill={t.border} stroke={t.dim} strokeWidth="0.5" />
                {/* Protein portion — vivid cyan */}
                <rect x={x} y={chartH - h} width={barW} height={pH} rx={3} fill="#22d3ee" />
                {/* Label */}
                <text x={timeToX(m.time)} y={chartH - h - 4} textAnchor="middle" fill={t.text} fontSize="7" fontFamily={F.mono} fontWeight="500">{m.kcal}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 9, fontFamily: F.mono }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "#22d3ee" }} /><span style={{ color: t.text }}>Protein</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: t.border, border: `1px solid ${t.dim}` }} /><span style={{ color: t.text }}>Other kcal</span></div>
        </div>
        <div style={{ fontSize: 9, fontFamily: F.body, color: t.muted, marginTop: 6, borderTop: `1px solid ${t.border}`, paddingTop: 6 }}>
          4h gap between lunch and snack · Evening protein low (18g) — 74% consumed before 3pm
        </div>
      </div>
    );
  },

  nutrition_meals: ({ t }) => {
    const meals = [
      { time: "08:30", dish: "Porridge, honey, banana", kcal: 350, p: 8, f: 6, c: 60 },
      { time: "10:15", dish: "Protein shake (whey + milk)", kcal: 180, p: 32, f: 3, c: 8 },
      { time: "12:45", dish: "Salmon wrap + salad", kcal: 520, p: 38, f: 22, c: 42 },
      { time: "15:30", dish: "Greek yogurt + blueberries", kcal: 185, p: 12, f: 5, c: 24 },
      { time: "19:00", dish: "Pasta pesto + grilled veg", kcal: 612, p: 18, f: 26, c: 64 },
    ];
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 52px 36px 36px 36px", gap: "0 6px", fontSize: 9, fontFamily: F.mono, color: t.dim, paddingBottom: 6, borderBottom: `1px solid ${t.border}`, marginBottom: 2 }}>
          <span>TIME</span><span>DISH</span><span style={{ textAlign: "right" }}>KCAL</span><span style={{ textAlign: "right" }}>P</span><span style={{ textAlign: "right" }}>F</span><span style={{ textAlign: "right" }}>C</span>
        </div>
        {meals.map((m, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 1fr 52px 36px 36px 36px", gap: "0 6px", fontSize: 11, fontFamily: F.body, padding: "6px 0", borderBottom: i < meals.length - 1 ? `1px solid ${t.border}44` : "none" }}>
            <span style={{ color: t.muted, fontFamily: F.mono, fontSize: 10 }}>{m.time}</span>
            <span style={{ color: t.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.dish}</span>
            <span style={{ color: P.teal, fontWeight: 600, textAlign: "right", fontFamily: F.mono, fontSize: 10 }}>{m.kcal}</span>
            <span style={{ color: P.blue, textAlign: "right", fontFamily: F.mono, fontSize: 10 }}>{m.p}g</span>
            <span style={{ color: P.amber, textAlign: "right", fontFamily: F.mono, fontSize: 10 }}>{m.f}g</span>
            <span style={{ color: P.green, textAlign: "right", fontFamily: F.mono, fontSize: 10 }}>{m.c}g</span>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 52px 36px 36px 36px", gap: "0 6px", fontSize: 11, fontFamily: F.mono, padding: "8px 0 0", borderTop: `1px solid ${t.border}`, fontWeight: 700, marginTop: 2 }}>
          <span /><span style={{ color: t.text }}>Total</span>
          <span style={{ color: P.teal, textAlign: "right", fontSize: 10 }}>1,847</span>
          <span style={{ color: P.blue, textAlign: "right", fontSize: 10 }}>108g</span>
          <span style={{ color: P.amber, textAlign: "right", fontSize: 10 }}>62g</span>
          <span style={{ color: P.green, textAlign: "right", fontSize: 10 }}>198g</span>
        </div>
      </div>
    );
  },

  nutrition_food_freq: ({ t }) => {
    const foods = [{ name: "Protein shake", count: 22, avg: 180 }, { name: "Porridge standard", count: 18, avg: 350 }, { name: "Greek yogurt + blueberries", count: 14, avg: 185 }, { name: "Salmon wrap", count: 11, avg: 520 }, { name: "Itsu veggie gyoza", count: 9, avg: 245 }, { name: "Espresso", count: 45, avg: 5 }];
    const topCalPct = 82;
    return (
      <div>
        {foods.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < foods.length - 1 ? `1px solid ${t.border}44` : "none" }}>
            <span style={{ fontSize: 11, color: t.bright, fontFamily: F.body }}>{f.name}</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: t.muted, fontFamily: F.mono }}>{f.count}×</span>
              <span style={{ fontSize: 10, color: P.teal, fontFamily: F.mono, fontWeight: 600, width: 48, textAlign: "right" }}>{f.avg} kcal</span>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: t.border + "44", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontFamily: F.body, color: t.text }}>Dietary variety</span>
          <span style={{ fontSize: 10, fontFamily: F.mono }}>
            Top 6 foods = <span style={{ color: topCalPct > 80 ? P.amber : P.green, fontWeight: 600 }}>{topCalPct}%</span>
            <span style={{ color: t.muted }}> of calories</span>
          </span>
        </div>
      </div>
    );
  },

  nutrition_insights: ({ t }) => {
    const insights = [
      { icon: "⚠", color: P.amber, text: "Protein averages 1.2 g/kg — below the 1.6–2.2 g/kg range recommended for resistance training. Consider adding a second protein shake or switching to higher-protein dinners." },
      { icon: "📉", color: P.blue, text: "Weekend protein drops 35% — Saturday/Sunday average is 68g vs 112g on weekdays. Your weekend meals are carb-heavy." },
      { icon: "🔁", color: t.dim, text: "Dietary variety is low — top 6 foods account for 82% of your calories. Consider rotating in new fish dishes or legume-based lunches." },
      { icon: "🕐", color: P.teal, text: "Protein distribution is front-loaded — 74% consumed before 3pm. Evening meals average just 18g protein, which is suboptimal for overnight muscle protein synthesis." },
      { icon: "🌿", color: P.green, text: "Fibre consistently below target — averaging 22g vs 30g goal. Blueberries and yogurt contribute, but adding lentils, chickpeas, or an extra vegetable portion would close the gap." },
    ];
    return (
      <div>
        <div style={{ fontSize: 10, fontFamily: F.body, color: t.muted, marginBottom: 10, lineHeight: 1.5 }}>
          Generated by Veda on Apr 4 from analysis of 94 daily logs (Jan–Apr 2026)
        </div>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < insights.length - 1 ? `1px solid ${t.border}66` : "none" }}>
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <div style={{ fontSize: 11, fontFamily: F.body, color: t.text, lineHeight: 1.7 }}>{ins.text}</div>
          </div>
        ))}
      </div>
    );
  },

  fitness_week: ({ t }) => {
    const days = [{ d: "Mon", a: "Calisthenics", done: true }, { d: "Tue" }, { d: "Wed", a: "Swimming", done: true }, { d: "Thu" }, { d: "Fri", a: "Calisthenics", today: true }, { d: "Sat" }, { d: "Sun" }];
    return (
      <div>
        <div style={{ display: "flex", gap: 6 }}>
          {days.map((d) => (
            <div key={d.d} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, fontFamily: F.mono, color: d.today ? t.bright : t.muted, marginBottom: 4, fontWeight: d.today ? 700 : 400 }}>{d.d}</div>
              <div style={{ height: 34, borderRadius: 6, background: d.done ? P.blue + "18" : d.today ? P.blue + "08" : t.border + "44", border: d.done ? `1px solid ${P.blue}44` : d.today ? `1px dashed ${P.blue}44` : "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {d.done && <span style={{ fontSize: 12, color: P.blue }}>✓</span>}
                {d.today && !d.done && <span style={{ fontSize: 9, color: P.blue + "88" }}>→</span>}
              </div>
              {d.a && <div style={{ fontSize: 8, fontFamily: F.mono, color: d.done ? P.blue : t.muted, marginTop: 3, lineHeight: 1.2 }}>{d.a}</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: t.text, borderTop: `1px solid ${t.border}`, paddingTop: 8, fontFamily: F.body }}>2 of 3 sessions done · Calisthenics due today</div>
      </div>
    );
  },

  fitness_body: ({ t }) => (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Stat label="Weight" value="81.2" sub="kg" color={P.blue} t={t} />
        <Stat label="BMI" value="24.1" sub="Normal" color={P.green} t={t} />
        <Stat label="Body Fat" value="18.2" sub="%" color={P.amber} t={t} />
        <Stat label="Lean Mass" value="66.4" sub="kg" color={t.dim} t={t} />
      </div>
      <div style={{ fontSize: 11, color: t.text, fontFamily: F.body, lineHeight: 1.6 }}>Body fat down from 20.1% in January. Lean mass stable — fat loss without muscle loss.</div>
    </div>
  ),

  fitness_weight_trend: ({ t }) => (
    <div>
      <Sparkline points="0,50 17,48 34,46 51,48 68,44 85,42 102,44 119,40 136,38 153,36 170,32 187,28 200,25" color={P.blue} height={60} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, fontFamily: F.mono, color: t.muted, marginTop: 4 }}><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span></div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <Stat label="Start" value="82.8" sub="Jan 6" color={t.dim} t={t} />
        <Stat label="Current" value="81.2" color={P.blue} t={t} />
        <Stat label="Change" value="-1.6 kg" color={P.green} t={t} />
        <Stat label="Goal" value="78.0" sub="~16 wk" color={t.dim} t={t} />
      </div>
    </div>
  ),

  fitness_calendar: ({ t }) => {
    const done = [1, 3, 5, 7, 9, 11];
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 8, fontFamily: F.mono, color: t.muted, paddingBottom: 3 }}>{d}</div>)}
          {[null, null].map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
            const a = done.includes(day), fu = day > 4;
            return <div key={day} style={{ aspectRatio: "1", borderRadius: 4, background: a ? P.blue + "18" : fu ? "transparent" : t.border + "44", border: a ? `1px solid ${P.blue}44` : `1px solid ${t.border}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: F.mono, color: a ? P.blue : fu ? t.border : t.muted }}>{day}</div>;
          })}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 14, fontSize: 10, fontFamily: F.mono, color: t.text }}>
          <span><span style={{ color: P.blue, fontWeight: 600 }}>6</span> sessions</span>
          <span><span style={{ color: P.green, fontWeight: 600 }}>100%</span> adherence</span>
        </div>
      </div>
    );
  },

  fitness_progress: ({ t }) => (
    <div style={{ display: "flex", gap: 8 }}>
      <Stat label="Sessions/wk" value="2.8" sub="avg" color={P.blue} t={t} />
      <Stat label="Streak" value="4 wk" color={P.green} t={t} />
      <Stat label="Next target" value="80 kg" sub="~4 wk" color={t.dim} t={t} />
    </div>
  ),

  finance_budget: ({ t }) => {
    const cats = [{ cat: "Groceries", amt: 340, max: 450, color: P.green }, { cat: "Dining", amt: 285, max: 300, color: P.amber }, { cat: "Transport", amt: 180, max: 200, color: P.blue }, { cat: "Subscriptions", amt: 95, max: 100, color: P.accent }, { cat: "Misc", amt: 347, max: 450, color: P.slate }];
    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 30, fontWeight: 700, fontFamily: F.display, color: t.bright }}>£1,247</span>
          <span style={{ fontSize: 12, color: t.dim, fontFamily: F.body }}>/ £2,500</span>
          <span style={{ fontSize: 11, color: P.green, fontFamily: F.mono, marginLeft: "auto" }}>50%</span>
        </div>
        {cats.map((c) => (
          <div key={c.cat} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: F.body, marginBottom: 3 }}>
              <span style={{ color: t.text }}>{c.cat}</span>
              <span style={{ color: c.amt > c.max * 0.9 ? P.coral : t.dim, fontFamily: F.mono, fontSize: 10 }}>£{c.amt} / £{c.max}</span>
            </div>
            <Bar pct={(c.amt / c.max) * 100} color={c.color} t={t} />
          </div>
        ))}
      </div>
    );
  },

  finance_trend: ({ t }) => (
    <div>
      <Sparkline points="0,20 15,35 30,15 45,40 60,25 75,38 90,30 105,22 120,45 135,18 150,32 165,28 180,35 200,20" color={P.amber} height={50} />
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <Stat label="Daily avg" value="£48" color={P.amber} t={t} />
        <Stat label="Highest" value="£127" sub="Apr 1" color={P.coral} t={t} />
        <Stat label="Lowest" value="£12" sub="Apr 3" color={P.green} t={t} />
      </div>
    </div>
  ),

  finance_transactions: ({ t }) => {
    const txns = [{ date: "Apr 4", desc: "Tesco Express", cat: "Groceries", amt: "£18.40" }, { date: "Apr 4", desc: "TfL Oyster", cat: "Transport", amt: "£4.90" }, { date: "Apr 3", desc: "Itsu", cat: "Dining", amt: "£8.50" }, { date: "Apr 3", desc: "Spotify", cat: "Subs", amt: "£10.99" }, { date: "Apr 2", desc: "Waitrose", cat: "Groceries", amt: "£42.15" }];
    return (
      <div>
        {txns.map((x, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: i < txns.length - 1 ? `1px solid ${t.border}44` : "none", fontSize: 11, fontFamily: F.body }}>
            <span style={{ color: t.muted, fontFamily: F.mono, fontSize: 10, width: 44, flexShrink: 0 }}>{x.date}</span>
            <span style={{ color: t.bright, flex: 1, marginLeft: 8 }}>{x.desc}</span>
            <span style={{ color: t.dim, fontSize: 9, fontFamily: F.mono, padding: "2px 6px", borderRadius: 4, background: t.border + "66", marginRight: 10 }}>{x.cat}</span>
            <span style={{ color: P.amber, fontWeight: 600, fontFamily: F.mono, fontSize: 10, width: 52, textAlign: "right" }}>{x.amt}</span>
          </div>
        ))}
      </div>
    );
  },
};

// ── GENERIC CONTAINERS ──

function WidgetCard({ widget, skill, t }) {
  const Renderer = R[widget.render];
  return (
    <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, padding: 18, gridColumn: widget.size === "large" ? "1 / -1" : undefined, boxShadow: t.cardShadow, transition: "background 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: t.bright, letterSpacing: "-0.01em" }}>{widget.title}</span>
        <span style={{ fontSize: 8, fontFamily: F.mono, color: t.muted, padding: "2px 6px", borderRadius: 4, background: t.border + "88" }}>{widget.type}</span>
      </div>
      {Renderer ? <Renderer skill={skill} t={t} /> : <div style={{ padding: 20, textAlign: "center", fontSize: 11, color: t.muted, fontFamily: F.mono }}>"{widget.render}" not registered</div>}
    </div>
  );
}

function SummaryCard({ skill, onClick, t }) {
  const s = skill.summary;
  if (!s) return null;
  return (
    <div onClick={onClick} style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, padding: 18, cursor: "pointer", transition: "all 0.2s", boxShadow: t.cardShadow }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = P.accent + "44"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${P.accent}10`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = t.cardShadow; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{skill.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: F.display, color: t.bright }}>{skill.display_name}</span>
        <span style={{ fontSize: 10, color: t.muted, marginLeft: "auto" }}>→</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 700, fontFamily: F.display, color: t.bright }}>{s.primary.value}</span>
        <span style={{ fontSize: 12, color: t.dim, fontFamily: F.body }}>{s.primary.unit || ""}</span>
        {s.primary.target && <span style={{ fontSize: 10, color: t.muted, fontFamily: F.mono }}>/ {s.primary.target}</span>}
      </div>
      {s.secondary && (
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          {s.secondary.map((m, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: F.body, marginBottom: 3 }}>
                <span style={{ color: t.dim }}>{m.label}</span>
                <span style={{ color: t.text, fontFamily: F.mono, fontSize: 10 }}>{m.value}</span>
              </div>
              {m.pct !== null && m.pct !== undefined && <Bar pct={m.pct} color={P.accent} t={t} />}
            </div>
          ))}
        </div>
      )}
      {s.footnote && <div style={{ fontSize: 10, color: t.muted, borderTop: `1px solid ${t.border}`, paddingTop: 8, marginTop: 4, lineHeight: 1.5, fontFamily: F.body }}>{s.footnote}</div>}
    </div>
  );
}

// ── MAIN APP ──

export default function QuantifiedLife() {
  const skills = useMemo(() => [...SKILL_MANIFESTS].sort((a, b) => a.sort_order - b.sort_order), []);
  const isSingleSkill = skills.length === 1;
  const [activeTab, setActiveTab] = useState(isSingleSkill ? skills[0].id : "overview");
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const t = isDark ? THEMES.dark : THEMES.light;
  const activeSkill = skills.find((s) => s.id === activeTab);
  const tabs = isSingleSkill ? [] : [{ id: "overview", label: "Overview", icon: "◉" }, ...skills.map((s) => ({ id: s.id, label: s.display_name, icon: s.icon }))];

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: t.bg, fontFamily: F.body, color: t.bright, transition: "background 0.3s, color 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: isMobile ? "12px 14px" : "14px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: t.headerBg, zIndex: 20, boxShadow: t.shadow, transition: "all 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #4338ca, #3730a3, #1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(99,102,241,0.3)", padding: 3 }}>
            <svg viewBox="0 0 64 40" width="22" height="14" style={{ marginTop: 2 }}>
              <path d="M4 36 A28 28 0 0 1 60 36" fill="none" stroke="#fff" strokeWidth="3" opacity="0.18" strokeLinecap="round"/>
              <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#5eead4"/><stop offset="50%" stopColor="#93c5fd"/><stop offset="100%" stopColor="#e0e7ff"/></linearGradient></defs>
              <path d="M4 36 A28 28 0 0 1 54.2 16" fill="none" stroke="url(#gg)" strokeWidth="3.5" strokeLinecap="round"/>
              <line x1="4" y1="36" x2="8" y2="36" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
              <line x1="32" y1="8" x2="32" y2="12" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
              <line x1="60" y1="36" x2="56" y2="36" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
              <line x1="32" y1="36" x2="50" y2="16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="32" cy="36" r="3" fill="#fff"/>
              <circle cx="32" cy="36" r="1.5" fill="#4338ca"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: isMobile ? 13 : 15, letterSpacing: "-0.02em", lineHeight: 1.1, color: t.bright }}>Quantified Life</div>
            <div style={{ fontSize: 9, color: t.accent, fontFamily: F.mono, fontWeight: 500, letterSpacing: "0.04em" }}>{skills.length} skill{skills.length !== 1 ? "s" : ""} active</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 9, fontFamily: F.mono, color: t.muted, display: isMobile ? "none" : "inline" }}>Updated 2 min ago</span>
          <button onClick={() => setIsDark(!isDark)} style={{ background: t.tabActive, border: `1px solid ${t.border}`, borderRadius: 20, padding: "4px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.dim, fontFamily: F.body, transition: "all 0.2s", fontWeight: 500 }}>
            {isDark ? "☀︎" : "☽"}
            <span style={{ fontSize: 10 }}>{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>

      {/* Tab bar — hidden when single skill */}
      {tabs.length > 0 && (
      <div style={{ padding: isMobile ? "6px 10px" : "8px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: isMobile ? 2 : 4, overflowX: "auto", position: "sticky", top: isMobile ? 50 : 56, background: t.bg, zIndex: 19, transition: "background 0.3s" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "5px 8px" : "6px 14px", border: "none", borderRadius: 8, fontSize: isMobile ? 10 : 11, fontWeight: isActive ? 700 : 500, fontFamily: F.display, cursor: "pointer", background: isActive ? t.accent + "14" : "transparent", color: isActive ? t.accent : t.tabText, whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0, borderBottom: isActive ? `2px solid ${t.accent}` : "2px solid transparent" }}>
              <span style={{ fontSize: isMobile ? 12 : 14 }}>{tab.icon}</span>
              {(!isMobile || isActive) && tab.label}
            </button>
          );
        })}
      </div>
      )}

      {/* Content */}
      <div style={{ padding: isMobile ? "16px 12px" : "24px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {activeTab === "overview" ? (
          <div>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 18, fontFamily: F.body }}>Tap any card to explore the full dashboard</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {skills.map((sk) => <SummaryCard key={sk.id} skill={sk} onClick={() => setActiveTab(sk.id)} t={t} />)}
            </div>
          </div>
        ) : activeSkill ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>{activeSkill.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: F.display, color: t.bright }}>{activeSkill.display_name}</div>
                <div style={{ fontSize: 10, fontFamily: F.mono, color: t.muted }}>{activeSkill.widgets.length} widgets · skill/{activeSkill.id}-tracker</div>
              </div>
              {!isSingleSkill && <button onClick={() => setActiveTab("overview")} style={{ marginLeft: "auto", padding: "5px 12px", border: `1px solid ${t.border}`, borderRadius: 6, background: "transparent", color: t.dim, fontSize: 11, fontFamily: F.display, cursor: "pointer", fontWeight: 500 }}>← Overview</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 14 }}>
              {activeSkill.widgets.map((w) => <WidgetCard key={w.id} widget={w} skill={activeSkill} t={t} />)}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ padding: "20px 24px", borderTop: `1px solid ${t.border}`, textAlign: "center", fontSize: 10, fontFamily: F.mono, color: t.muted, marginTop: 40 }}>
        Powered by <span style={{ color: t.accent, fontWeight: 600 }}>Veda</span> · {skills.length} skill{skills.length !== 1 ? "s" : ""} · Precomputed by generate.py
      </div>
    </div>
  );
}
