"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** ---------- Types ---------- */
type StageId =
  | "new"
  | "sent_dm"
  | "in_progress"
  | "qualified"
  | "call_booked"
  | "proposal"
  | "won"
  | "lost";

type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar?: string;
  stage: StageId;
  replyRate: number;
  industryAvgReply: number;
  engagement: number; // 0-100
  dealValue: number; // $
  nextStepAt?: string; // ISO
  owner?: string;
  priority?: "low" | "medium" | "high";
  location?: string;
  headline?: string;
  firstInteraction?: string;
  avgResponseHrs?: number;
  tags?: string[];
  industry?: string;
};

/** ---------- Mock Data ---------- */
const INITIAL_LEADS: Lead[] = [
  {
    id: "ld_01",
    name: "Sofia Ramos",
    title: "Head of Growth",
    company: "NimbusAI",
    avatar: "https://i.pravatar.cc/60?img=5",
    stage: "new",
    replyRate: 34,
    industryAvgReply: 27,
    engagement: 68,
    dealValue: 8400,
    nextStepAt: "2025-09-25",
    owner: "Ava",
    priority: "high",
    location: "London, UK",
    headline: "Scaling B2B PLG motion @ NimbusAI",
    firstInteraction: "2025-09-12",
    avgResponseHrs: 9,
    tags: ["PLG", "AI"],
    industry: "SaaS",
  },
  {
    id: "ld_02",
    name: "Marcus Lee",
    title: "VP Sales",
    company: "OrbitCloud",
    avatar: "https://i.pravatar.cc/60?img=12",
    stage: "sent_dm",
    replyRate: 21,
    industryAvgReply: 27,
    engagement: 41,
    dealValue: 5200,
    nextStepAt: "2025-09-24",
    owner: "Noah",
    priority: "medium",
    location: "Austin, US",
    headline: "Quota crusher. Hiring 🤝",
    firstInteraction: "2025-09-10",
    avgResponseHrs: 20,
    tags: ["Enterprise"],
    industry: "Cloud",
  },
  {
    id: "ld_03",
    name: "Amira Khan",
    title: "Founder",
    company: "Finlytics",
    avatar: "https://i.pravatar.cc/60?img=32",
    stage: "in_progress",
    replyRate: 29,
    industryAvgReply: 27,
    engagement: 77,
    dealValue: 12900,
    nextStepAt: "2025-09-27",
    owner: "Liam",
    priority: "high",
    location: "Dubai, AE",
    headline: "Automating ops for fintechs",
    firstInteraction: "2025-09-03",
    avgResponseHrs: 6,
    tags: ["Fintech", "Seed"],
    industry: "Fintech",
  },
  {
    id: "ld_04",
    name: "John Ramos",
    title: "Head of Growth",
    company: "NimbusAI",
    avatar: "https://i.pravatar.cc/60?img=6",
    stage: "new",
    replyRate: 34,
    industryAvgReply: 27,
    engagement: 68,
    dealValue: 8400,
    nextStepAt: "2025-09-25",
    owner: "Ava",
    priority: "high",
    location: "London, UK",
    headline: "Scaling B2B PLG motion @ NimbusAI",
    firstInteraction: "2025-09-12",
    avgResponseHrs: 9,
    tags: ["PLG", "AI"],
    industry: "SaaS",
  },
  {
    id: "ld_05",
    name: "Paul Ramos",
    title: "Head of Growth",
    company: "NimbusAI",
    avatar: "https://i.pravatar.cc/60?img=7",
    stage: "new",
    replyRate: 34,
    industryAvgReply: 27,
    engagement: 68,
    dealValue: 8400,
    nextStepAt: "2025-09-25",
    owner: "Ava",
    priority: "high",
    location: "London, UK",
    headline: "Scaling B2B PLG motion @ NimbusAI",
    firstInteraction: "2025-09-12",
    avgResponseHrs: 9,
    tags: ["PLG"],
    industry: "SaaS",
  },
  {
    id: "ld_06",
    name: "Sally Ramos",
    title: "Head of Growth",
    company: "NimbusAI",
    avatar: "https://i.pravatar.cc/60?img=9",
    stage: "new",
    replyRate: 21,
    industryAvgReply: 50,
    engagement: 100,
    dealValue: 8400,
    nextStepAt: "2025-09-25",
    owner: "Ava",
    priority: "high",
    location: "London, UK",
    headline: "Scaling B2B PLG motion @ NimbusAI",
    firstInteraction: "2025-09-12",
    avgResponseHrs: 9,
    tags: ["PLG"],
    industry: "SaaS",
  },
  {
    id: "ld_07a",
    name: "Pet Smile",
    title: "Head of Growth",
    company: "NimbusAI",
    avatar: "https://i.pravatar.cc/60?img=8",
    stage: "new",
    replyRate: 21,
    industryAvgReply: 50,
    engagement: 100,
    dealValue: 8400,
    nextStepAt: "2025-09-25",
    owner: "Ava",
    priority: "high",
    location: "London, UK",
    headline: "Scaling B2B PLG motion @ NimbusAI",
    firstInteraction: "2025-09-12",
    avgResponseHrs: 9,
    tags: ["PLG"],
    industry: "SaaS",
  },
  {
    id: "ld_07b",
    name: "Shan Smile",
    title: "Manager of Growth",
    company: "NimbusAI",
    avatar: "https://i.pravatar.cc/60?img=15",
    stage: "qualified",
    replyRate: 21,
    industryAvgReply: 50,
    engagement: 100,
    dealValue: 8400,
    nextStepAt: "2025-09-25",
    owner: "Ava",
    priority: "high",
    location: "London, UK",
    headline: "Scaling B2B PLG motion @ NimbusAI",
    firstInteraction: "2025-09-12",
    avgResponseHrs: 9,
    tags: ["PLG"],
    industry: "SaaS",
  },
  {
    id: "ld_7fh",
    name: "Shan Smile",
    title: "Manager of Growth",
    company: "NimbusAI",
    avatar: "https://i.pravatar.cc/60?img=16",
    stage: "call_booked",
    replyRate: 21,
    industryAvgReply: 50,
    engagement: 100,
    dealValue: 8400,
    nextStepAt: "2025-09-25",
    owner: "Ava",
    priority: "high",
    location: "London, UK",
    headline: "Scaling B2B PLG motion @ NimbusAI",
    firstInteraction: "2025-09-12",
    avgResponseHrs: 9,
    tags: ["PLG"],
    industry: "SaaS",
  },
];

const STAGES: { id: StageId; label: string; color: string }[] = [
  { id: "new", label: "New", color: "bg-slate-400" },
  { id: "sent_dm", label: "Sent DM", color: "bg-sky-400" },
  { id: "in_progress", label: "In Progress", color: "bg-violet-400" },
  { id: "qualified", label: "Qualified", color: "bg-green-500" },
  { id: "call_booked", label: "Call Booked", color: "bg-cyan-500" },
  { id: "proposal", label: "Proposal", color: "bg-amber-500" },
  { id: "won", label: "Won", color: "bg-emerald-500" },
  { id: "lost", label: "Lost", color: "bg-rose-500" },
];

/** ---------- Utils ---------- */
const currency = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ");

/** ---------- KPI w/ Benchmark ---------- */
function KpiWithBenchmark({
  label,
  value,
  benchmark,
  goodWhenHigher = true,
}: {
  label: string;
  value: string;
  benchmark?: string;
  goodWhenHigher?: boolean;
}) {
  const v = parseFloat(value.replace(/[^0-9.\-]/g, ""));
  const b = benchmark ? parseFloat(benchmark.replace(/[^0-9.\-]/g, "")) : NaN;
  const delta = isNaN(b) ? undefined : v - b;
  const up = delta !== undefined ? delta > 0 : undefined;
  const color =
    up === undefined
      ? "text-slate-800"
      : up === goodWhenHigher
      ? "text-emerald-600"
      : "text-rose-600";
  return (
    <div className="flex items-end gap-2">
      <div className="text-slate-900 text-base font-semibold leading-5">
        {label}: {value}
      </div>
      {benchmark && (
        <div className={cn("text-xs", color)}>
          {up === undefined ? null : up ? "↑" : "↓"}{" "}
          <span className="text-slate-500">Avg {benchmark}</span>
        </div>
      )}
    </div>
  );
}

/** ---------- Compact Card ---------- */
function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (l: Lead) => void }) {
  const aboveAvg = lead.replyRate >= lead.industryAvgReply;
  const [hover, setHover] = useState(false);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={() => onOpen(lead)}
        className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm hover:border-slate-300 transition shadow-[0_1px_0_rgba(0,0,0,0.03)]"
      >
        <div className="flex items-start gap-3">
          <img
            src={lead.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {lead.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {lead.title} · {lead.company}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white",
                  STAGES.find((s) => s.id === lead.stage)?.color
                )}
              >
                {STAGES.find((s) => s.id === lead.stage)?.label}
              </span>
            </div>

            {/* Reply Rate with benchmark (per guide) */}
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "font-semibold",
                    aboveAvg ? "text-emerald-700" : "text-rose-700"
                  )}
                >
                  {lead.replyRate}%
                </span>
                <span className="text-xs text-slate-500">
                  (Avg {lead.industryAvgReply}%)
                </span>
                {aboveAvg ? (
                  <span className="text-emerald-600 text-xs">↑</span>
                ) : (
                  <span className="text-rose-600 text-xs">↓</span>
                )}
              </div>
            </div>

            {/* Mini metrics row */}
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
              <span className="rounded bg-slate-50 px-1.5 py-0.5">
                Eng {lead.engagement}
              </span>
              <span className="rounded bg-slate-50 px-1.5 py-0.5">
                {currency(lead.dealValue)}
              </span>
              {lead.nextStepAt && (
                <span className="rounded bg-slate-50 px-1.5 py-0.5">
                  📅 {new Date(lead.nextStepAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Quick actions (email / whatsapp / linkedin) */}
            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
              <button className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                ✉️
              </button>
              <button className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                💬
              </button>
              <button className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                🔗
              </button>
            </div>
          </div>
        </div>
      </button>

      {/* Hover quick view (headline, location, priority, first interaction, avg response) */}
      {hover && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-white p-3 text-xs text-slate-700 shadow">
          {lead.headline && <div className="mb-1">{lead.headline}</div>}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {lead.location && <span>📍 {lead.location}</span>}
            {lead.priority && <span>⚑ {lead.priority}</span>}
            {lead.firstInteraction && (
              <span>First: {lead.firstInteraction}</span>
            )}
            {lead.avgResponseHrs !== undefined && (
              <span>Avg resp: {lead.avgResponseHrs}h</span>
            )}
            {lead.tags?.length ? (
              <span>Tags: {lead.tags.join(", ")}</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/** ---------- Column ---------- */
function StageColumn({
  stage,
  leads,
  onOpen,
}: {
  stage: { id: StageId; label: string; color: string };
  leads: Lead[];
  onOpen: (l: Lead) => void;
}) {
  return (
    <div className="w-[320px] shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", stage.color)} />
          <h3 className="text-sm font-semibold text-slate-800">
            {stage.label}
          </h3>
          <span className="text-xs text-slate-500">{leads.length}</span>
        </div>
        <button className="text-xs text-slate-500 hover:text-slate-700">
          ⋯
        </button>
      </div>
      <div className="space-y-3">
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} onOpen={onOpen} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Empty — add your first lead
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------- Playbooks ---------- */
function Playbooks({
  context,
}: {
  context: "dm" | "comments" | "email" | "deal";
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <div className="text-sm font-semibold text-slate-800">
          AI Coaching & Playbooks
        </div>
        <span className="text-slate-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {context === "dm" && (
            <>
              <div className="text-sm text-slate-700">
                No reply after 2 DMs → try a nurture comment strategy.
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {`"Saw your post on {topic}. Curious how you handle {pain}. We helped {peer} get X with Y — worth 10 mins?"`}
              </div>
            </>
          )}
          {context === "deal" && (
            <>
              <div className="text-sm text-slate-700">
                Budget objection detected → offer option framing.
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {`Basic / Standard / Pilot (outcome-based). Anchor on ROI. Ask: "Which scope gets you moving this quarter?"`}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** ---------- Detail Drawer ---------- */
function DetailDrawer({
  lead,
  onClose,
  onStageChange,
}: {
  lead: Lead | null;
  onClose: () => void;
  onStageChange: (id: StageId) => void;
}) {
  const [tab, setTab] = useState<"engagement" | "deal" | "notes" | "timeline">(
    "engagement"
  );
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-[520px] h-full bg-white shadow-2xl border-l border-slate-200 p-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src={lead.avatar} className="h-10 w-10 rounded-full" />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {lead.name}
                </div>
                <div className="text-xs text-slate-500">
                  {lead.title} · {lead.company}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {lead.industry && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {lead.industry}
                    </span>
                  )}
                  {lead.tags?.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="text-xs rounded-full border border-slate-300 px-2 py-1"
                value={lead.stage}
                onChange={(e) => onStageChange(e.target.value as StageId)}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                className="text-slate-500 text-xl leading-none"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 border-b border-slate-200">
          <div className="flex gap-3 text-sm">
            {[
              { k: "engagement", l: "Engagement" },
              { k: "deal", l: "Deal" },
              { k: "notes", l: "Notes" },
              { k: "timeline", l: "Timeline" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as any)}
                className={cn(
                  "py-2 border-b-2 -mb-px",
                  tab === t.k
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto">
          {tab === "engagement" && (
            <div>
              {/* Benchmarks under KPIs (per tab) */}
              <div className="space-y-1 mb-4">
                <KpiWithBenchmark
                  label="Reply Rate"
                  value={`${lead.replyRate}%`}
                  benchmark={`${lead.industryAvgReply}%`}
                />
                <KpiWithBenchmark
                  label="Engagement"
                  value={`${lead.engagement}`}
                />
                {lead.avgResponseHrs !== undefined && (
                  <KpiWithBenchmark
                    label="Avg Response"
                    value={`${lead.avgResponseHrs}h`}
                    goodWhenHigher={false}
                  />
                )}
              </div>

              {/* Example DM tab block */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm font-medium text-slate-800 mb-2">
                  LinkedIn DMs
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="bg-slate-50 p-2 rounded">
                    You: Quick intro about {lead.company} fit…
                  </div>
                  <div className="bg-white p-2 rounded border">
                    {lead.name}: Sounds interesting—send details.
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    You: Shared 2-liner case study…
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 text-sm rounded-lg border px-3 py-2"
                    placeholder="Write a DM…"
                  />
                  <button className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm">
                    Send
                  </button>
                </div>
              </div>

              <Playbooks context="dm" />
            </div>
          )}

          {tab === "deal" && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-500">Deal Value</div>
                  <div className="text-base font-semibold">
                    {currency(lead.dealValue)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Avg deal in your industry: $4.2k
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-500">Close Date</div>
                  <input
                    type="date"
                    className="mt-1 text-sm rounded-lg border px-2 py-1 w-full"
                  />
                </div>
                <div className="rounded-xl border p-3 col-span-2">
                  <div className="text-xs text-slate-500 mb-1">
                    Won/Lost Reason
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {"Budget, Timing, Feature Gap, Competitor"
                      .split(", ")
                      .map((r) => (
                        <button
                          key={r}
                          className="px-2 py-1 rounded-full border text-xs hover:bg-slate-50"
                        >
                          {r}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
              <Playbooks context="deal" />
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              <textarea
                className="w-full h-36 rounded-xl border p-3 text-sm"
                placeholder="Notes about this lead…"
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 text-sm rounded-lg border px-3 py-2"
                  placeholder="Reminder: follow up next week"
                />
                <button className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm">
                  Add
                </button>
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div className="space-y-3">
              {[
                "2025-09-22 Moved to In Progress",
                "2025-09-21 DM reply received",
                "2025-09-19 Added by Ava to pipeline",
              ].map((t, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                  <div>{t}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-slate-200 flex items-center justify-between">
          <button className="rounded-lg border px-3 py-2 text-sm">
            Log activity
          </button>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-2 text-sm">
              Add reminder
            </button>
            <button className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm">
              More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------- Sidebar (saved views + filters) ---------- */
function Sidebar({
  owners,
  industries,
  tags,
  filters,
  setFilters,
  open,
  setOpen,
}: {
  owners: string[];
  industries: string[];
  tags: string[];
  filters: {
    owner?: string;
    priority?: "low" | "medium" | "high";
    industry?: string;
    tag?: string;
    stage?: StageId;
  };
  setFilters: (f: SidebarProps["filters"]) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const Body = (
    <div className="h-full w-72 bg-white border-r border-slate-200 p-3 flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Views & Filters</div>
        <button
          className="sm:hidden text-slate-500"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </div>

      {/* Saved views (placeholder) */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 mb-1">Saved Views</div>
        <div className="space-y-1">
          {["All", "My leads", "High priority", "This week"].map((v) => (
            <button
              key={v}
              className="w-full text-left rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t my-3" />

      {/* Filters */}
      <div className="space-y-3">
        <section>
          <div className="text-xs text-slate-500 mb-1">Owner</div>
          <select
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            value={filters.owner ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, owner: e.target.value || undefined })
            }
          >
            <option value="">Any</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </section>

        <section>
          <div className="text-xs text-slate-500 mb-1">Priority</div>
          <select
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            value={filters.priority ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                priority: (e.target.value as any) || undefined,
              })
            }
          >
            <option value="">Any</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </section>

        <section>
          <div className="text-xs text-slate-500 mb-1">Industry</div>
          <select
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            value={filters.industry ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                industry: e.target.value || undefined,
              })
            }
          >
            <option value="">Any</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </section>

        <section>
          <div className="text-xs text-slate-500 mb-1">Tag</div>
          <select
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            value={filters.tag ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                tag: e.target.value || undefined,
              })
            }
          >
            <option value="">Any</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </section>

        <section>
          <div className="text-xs text-slate-500 mb-1">Stage</div>
          <select
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            value={filters.stage ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                stage: (e.target.value as StageId) || undefined,
              })
            }
          >
            <option value="">Any</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </section>
      </div>

      <div className="mt-auto pt-3">
        <button
          className="w-full rounded-lg border px-3 py-2 text-sm"
          onClick={() =>
            setFilters({
              owner: undefined,
              priority: undefined,
              industry: undefined,
              tag: undefined,
              stage: undefined,
            })
          }
        >
          Clear filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:block sticky top-0 h-[100dvh]">{Body}</div>

      {/* Mobile slide-over */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">{Body}</div>
        </div>
      )}
    </>
  );
}
type SidebarProps = React.ComponentProps<typeof Sidebar>;

/** ---------- Toolbar ---------- */
function BoardToolbar({ onOpenFilters }: { onOpenFilters: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          className="w-[260px] rounded-lg border px-3 py-2 pr-8 text-sm"
          placeholder="Search leads…"
        />
        <span className="absolute right-2 top-2 text-slate-400">⌘K</span>
      </div>
      <button
        className="rounded-lg border px-3 py-2 text-sm sm:hidden"
        onClick={onOpenFilters}
      >
        Filters
      </button>
      <button className="hidden sm:inline-flex rounded-lg border px-3 py-2 text-sm">
        Save view
      </button>
      <div className="ml-auto flex gap-2">
        <button className="rounded-lg border px-3 py-2 text-sm">
          Bulk actions
        </button>
        <button className="rounded-lg border px-3 py-2 text-sm">
          Customize columns
        </button>
      </div>
    </div>
  );
}

/** ---------- Main ---------- */
export default function KanbanCRMPrototype() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [open, setOpen] = useState<Lead | null>(null);

  // sidebar filters
  const [filters, setFilters] = useState<SidebarProps["filters"]>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const owners = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.owner).filter(Boolean))
      ) as string[],
    [leads]
  );
  const industries = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.industry).filter(Boolean))
      ) as string[],
    [leads]
  );
  const tagsList = useMemo(
    () => Array.from(new Set(leads.flatMap((l) => l.tags ?? []))),
    [leads]
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filters.owner && l.owner !== filters.owner) return false;
      if (filters.priority && l.priority !== filters.priority) return false;
      if (filters.industry && l.industry !== filters.industry) return false;
      if (filters.tag && !(l.tags ?? []).includes(filters.tag)) return false;
      if (filters.stage && l.stage !== filters.stage) return false;
      return true;
    });
  }, [leads, filters]);

  const byStage = useMemo(() => {
    const map: Record<StageId, Lead[]> = {
      new: [],
      sent_dm: [],
      in_progress: [],
      qualified: [],
      call_booked: [],
      proposal: [],
      won: [],
      lost: [],
    };
    filtered.forEach((l) => map[l.stage].push(l));
    return map;
  }, [filtered]);

  function openLead(l: Lead) {
    setOpen(l);
  }
  function updateStage(stage: StageId) {
    if (!open) return;
    setLeads((prev) =>
      prev.map((x) => (x.id === open.id ? { ...x, stage } : x))
    );
    setOpen((prev) => (prev ? { ...prev, stage } : prev));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="mx-auto w-[80%] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="sm:hidden rounded border px-2 py-1 text-sm"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="h-6 w-6 rounded bg-slate-900" />
            <div className="text-sm font-semibold">
              Pipeline — Q3 New Business
            </div>
          </div>
          <div className="mt-3">
            <BoardToolbar onOpenFilters={() => setSidebarOpen(true)} />
          </div>
        </div>
      </header>

      {/* Content with Sidebar */}
      <div className="mx-auto w-full px-4">
        <div className="flex gap-4">
          <Sidebar
            owners={owners}
            industries={industries}
            tags={tagsList}
            filters={filters}
            setFilters={setFilters}
            open={sidebarOpen}
            setOpen={setSidebarOpen}
          />

          {/* Board */}
          <main className="flex-1 py-6 overflow-hidden">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {STAGES.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  leads={byStage[stage.id]}
                  onOpen={openLead}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

      <DetailDrawer
        lead={open}
        onClose={() => setOpen(null)}
        onStageChange={updateStage}
      />
    </div>
  );
}
