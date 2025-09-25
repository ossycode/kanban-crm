/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  GripVertical,
  Mail,
  MessageCircle,
  Linkedin,
  SquarePen,
  LayoutGrid,
  FolderClosed,
  Settings,
  Users2,
  MoreHorizontal,
  Trash2,
  Edit3,
  Palette,
  ChevronDown,
} from "lucide-react";

/* ---------- Types you already have ---------- */
type StageId =
  | "new"
  | "sent_dm"
  | "in_progress"
  | "qualified"
  | "call_booked"
  | "proposal"
  | "won"
  | "lost"
  | string;

type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  stage: StageId;
  replyRate: number;
  industryAvgReply: number;
  engagement: number; // 0-100
  dealValue: number;
  nextStepAt?: string;
  owner?: string;
  priority?: "low" | "medium" | "high";
  location?: string;
  headline?: string;
  firstInteraction?: string;
  avgResponseHrs?: number;
  tags?: string[];
  industry?: string;
};

type Stage = { id: StageId; label: string; color: string };

/* ---------- Data you already have ---------- */
const DEFAULT_STAGES: Stage[] = [
  { id: "new", label: "New", color: "bg-slate-400" },
  { id: "sent_dm", label: "Sent DM", color: "bg-sky-400" },
  { id: "in_progress", label: "In Progress", color: "bg-violet-400" },
  { id: "qualified", label: "Qualified", color: "bg-green-500" },
  { id: "call_booked", label: "Call Booked", color: "bg-cyan-500" },
  { id: "proposal", label: "Proposal", color: "bg-amber-500" },
  { id: "won", label: "Won", color: "bg-emerald-500" },
  { id: "lost", label: "Lost", color: "bg-rose-500" },
];

const INITIAL_LEADS: Lead[] = [
  // NEW
  {
    id: "n1",
    name: "Ava Collins",
    title: "Head of Growth",
    company: "Nimbus",
    avatar: "https://i.pravatar.cc/60?img=2",
    stage: "new",
    owner: "You",
    priority: "high",
    industry: "SaaS",
    tags: ["PLG", "Outbound"],
    headline: "Driving 0→1 growth loops.",
    location: "Remote",
    firstInteraction: "2025-09-19",
    avgResponseHrs: 6,
    engagement: 72,
    replyRate: 34,
    industryAvgReply: 27,
    dealValue: 6200,
    nextStepAt: new Date().toISOString(),
  },
  {
    id: "n2",
    name: "Samir Bhatt",
    title: "CTO",
    company: "Kairo",
    avatar: "https://i.pravatar.cc/60?img=5",
    stage: "new",
    owner: "You",
    priority: "medium",
    industry: "Fintech",
    tags: ["Warm"],
    headline: "Modernizing credit rails.",
    location: "London",
    firstInteraction: "2025-09-17",
    avgResponseHrs: 14,
    engagement: 55,
    replyRate: 22,
    industryAvgReply: 25,
    dealValue: 3800,
  },
  {
    id: "n3",
    name: "Lina Zhou",
    title: "Founder",
    company: "FolkLabs",
    avatar: "https://i.pravatar.cc/60?img=1",
    stage: "new",
    owner: "Jess",
    priority: "high",
    industry: "Ecommerce",
    tags: ["Referral"],
    headline: "Ops & merchandising tooling.",
    engagement: 81,
    replyRate: 31,
    industryAvgReply: 24,
    dealValue: 8200,
  },

  // SENT DM
  {
    id: "sd1",
    name: "Owen Diaz",
    title: "GM",
    company: "MetroFit",
    avatar: "https://i.pravatar.cc/60?img=6",
    stage: "sent_dm",
    owner: "You",
    priority: "low",
    industry: "Wellness",
    tags: ["Franchise"],
    engagement: 39,
    replyRate: 21,
    industryAvgReply: 24,
    dealValue: 3000,
  },
  {
    id: "sd2",
    name: "Sara Khan",
    title: "Head of CS",
    company: "Helply",
    avatar: "https://i.pravatar.cc/60?img=5",
    stage: "sent_dm",
    owner: "Jess",
    priority: "high",
    industry: "SaaS",
    tags: ["CS"],
    engagement: 71,
    replyRate: 35,
    industryAvgReply: 29,
    dealValue: 9800,
  },
  {
    id: "sd3",
    name: "Jason Cole",
    title: "COO",
    company: "GreenYard",
    avatar: "https://i.pravatar.cc/60?img=4",
    stage: "sent_dm",
    owner: "You",
    priority: "medium",
    industry: "AgriTech",
    tags: ["Ops", "Pilot"],
    engagement: 48,
    replyRate: 26,
    industryAvgReply: 27,
    dealValue: 4200,
  },

  // IN PROGRESS
  {
    id: "ip1",
    name: "Nora Lee",
    title: "Product Lead",
    company: "Formo",
    avatar: "https://i.pravatar.cc/60?img=7",
    stage: "in_progress",
    owner: "Jess",
    priority: "high",
    industry: "SaaS",
    tags: ["Product", "Beta"],
    engagement: 80,
    replyRate: 38,
    industryAvgReply: 27,
    dealValue: 12500,
    nextStepAt: "2025-10-01",
  },
  {
    id: "ip2",
    name: "Chris Adams",
    title: "CTO",
    company: "Paymind",
    avatar: "https://i.pravatar.cc/60?img=8",
    stage: "in_progress",
    owner: "You",
    priority: "medium",
    industry: "Fintech",
    tags: ["Security"],
    engagement: 66,
    replyRate: 33,
    industryAvgReply: 28,
    dealValue: 8700,
  },
  {
    id: "ip3",
    name: "Ivy Brooks",
    title: "Sales Lead",
    company: "Fieldy",
    avatar: "https://i.pravatar.cc/60?img=9",
    stage: "in_progress",
    owner: "Jess",
    priority: "medium",
    industry: "Field Services",
    tags: ["Sales"],
    engagement: 52,
    replyRate: 24,
    industryAvgReply: 26,
    dealValue: 6100,
  },
  {
    id: "ip4",
    name: "Tom Hall",
    title: "Founder",
    company: "Binder",
    avatar: "https://i.pravatar.cc/60?img=10",
    stage: "in_progress",
    owner: "Jess",
    priority: "low",
    industry: "SaaS",
    tags: ["Bootstrap"],
    engagement: 58,
    replyRate: 29,
    industryAvgReply: 27,
    dealValue: 5400,
  },

  // QUALIFIED
  {
    id: "q1",
    name: "Riya Patel",
    title: "Ops Lead",
    company: "Shiply",
    avatar: "https://i.pravatar.cc/60?img=11",
    stage: "qualified",
    owner: "You",
    priority: "high",
    industry: "Logistics",
    tags: ["Ops"],
    engagement: 78,
    replyRate: 36,
    industryAvgReply: 25,
    dealValue: 13200,
  },
  {
    id: "q2",
    name: "Ben Fox",
    title: "VP Growth",
    company: "Lenz",
    avatar: "https://i.pravatar.cc/60?img=12",
    stage: "qualified",
    owner: "Jess",
    priority: "medium",
    industry: "SaaS",
    tags: ["Growth"],
    engagement: 60,
    replyRate: 28,
    industryAvgReply: 29,
    dealValue: 10100,
  },
  {
    id: "q3",
    name: "Zara Mills",
    title: "Head of RevOps",
    company: "BrightOps",
    avatar: "https://i.pravatar.cc/60?img=13",
    stage: "qualified",
    owner: "Jess",
    priority: "high",
    industry: "SaaS",
    tags: ["RevOps", "Playbook"],
    engagement: 84,
    replyRate: 41,
    industryAvgReply: 29,
    dealValue: 15400,
  },

  // CALL BOOKED
  {
    id: "cb1",
    name: "Ethan Ray",
    title: "Director",
    company: "Coastline",
    avatar: "https://i.pravatar.cc/60?img=14",
    stage: "call_booked",
    owner: "Jess",
    priority: "medium",
    industry: "Travel",
    tags: ["Demo"],
    engagement: 72,
    replyRate: 30,
    industryAvgReply: 23,
    dealValue: 9300,
    nextStepAt: "2025-09-29",
  },
  {
    id: "cb2",
    name: "Yara Gomez",
    title: "CRO",
    company: "Rexton",
    avatar: "https://i.pravatar.cc/60?img=15",
    stage: "call_booked",
    owner: "You",
    priority: "high",
    industry: "SaaS",
    tags: ["Enterprise"],
    engagement: 88,
    replyRate: 44,
    industryAvgReply: 29,
    dealValue: 22000,
  },
  {
    id: "cb3",
    name: "Kai Wu",
    title: "Head of Marketing",
    company: "Mosaic",
    avatar: "https://i.pravatar.cc/60?img=16",
    stage: "call_booked",
    owner: "Jess",
    priority: "low",
    industry: "SaaS",
    tags: ["Content"],
    engagement: 57,
    replyRate: 27,
    industryAvgReply: 29,
    dealValue: 7200,
  },

  // PROPOSAL
  {
    id: "p1",
    name: "Elena Rossi",
    title: "GM",
    company: "Weave",
    avatar: "https://i.pravatar.cc/60?img=17",
    stage: "proposal",
    owner: "Jess",
    priority: "high",
    industry: "SaaS",
    tags: ["Pilot"],
    engagement: 82,
    replyRate: 39,
    industryAvgReply: 29,
    dealValue: 18000,
  },
  {
    id: "p2",
    name: "Luis Ortega",
    title: "Ops",
    company: "FastCart",
    avatar: "https://i.pravatar.cc/60?img=18",
    stage: "proposal",
    owner: "You",
    priority: "medium",
    industry: "E-commerce",
    tags: ["Ops", "Integration"],
    engagement: 70,
    replyRate: 31,
    industryAvgReply: 26,
    dealValue: 13400,
  },
  {
    id: "p3",
    name: "Hana Suzuki",
    title: "Founder",
    company: "Nimble",
    avatar: "https://i.pravatar.cc/60?img=19",
    stage: "proposal",
    owner: "Jess",
    priority: "low",
    industry: "SaaS",
    tags: ["Beta", "Self-serve"],
    engagement: 51,
    replyRate: 24,
    industryAvgReply: 29,
    dealValue: 6400,
  },

  // WON
  {
    id: "w1",
    name: "Mark Lewis",
    title: "VP Sales",
    company: "Beacon",
    avatar: "https://i.pravatar.cc/60?img=20",
    stage: "won",
    owner: "Jess",
    priority: "high",
    industry: "SaaS",
    tags: ["Success"],
    engagement: 91,
    replyRate: 46,
    industryAvgReply: 29,
    dealValue: 26000,
  },
  {
    id: "w2",
    name: "Sofia Iqbal",
    title: "Ops",
    company: "Porto",
    avatar: "https://i.pravatar.cc/60?img=21",
    stage: "won",
    owner: "You",
    priority: "medium",
    industry: "Logistics",
    tags: ["Rollout"],
    engagement: 77,
    replyRate: 34,
    industryAvgReply: 25,
    dealValue: 15000,
  },

  // LOST
  {
    id: "l1x",
    name: "Ivan Petrov",
    title: "CTO",
    company: "SkyNet",
    avatar: "https://i.pravatar.cc/60?img=22",
    stage: "lost",
    owner: "Jess",
    priority: "medium",
    industry: "Telecom",
    tags: ["Security"],
    engagement: 28,
    replyRate: 18,
    industryAvgReply: 24,
    dealValue: 0,
  },
  {
    id: "l2x",
    name: "Ruth Kim",
    title: "Founder",
    company: "Nucleus",
    avatar: "https://i.pravatar.cc/60?img=23",
    stage: "lost",
    owner: "You",
    priority: "low",
    industry: "SaaS",
    tags: ["Pricing"],
    engagement: 34,
    replyRate: 21,
    industryAvgReply: 29,
    dealValue: 0,
  },
];

/* ---------- Utils ---------- */
const currency = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ");

/* ---------- Small headless primitives ---------- */
function Popover({
  trigger,
  children,
  align = "end",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm hover:bg-slate-50"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-30 mt-1 min-w-[180px] rounded-md border bg-white p-1 shadow-md",
            align === "end" ? "right-0" : "left-0"
          )}
          onMouseLeave={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Dropdown({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
      >
        {label} <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-1 min-w-[220px] rounded-md border bg-white p-1 shadow-md"
          onMouseLeave={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50",
        danger && "text-rose-600 hover:bg-rose-50"
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------- KPI w/ Benchmark ---------- */
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

/* ---------- Edit Title Modal ---------- */
function EditTitleModal({
  open,
  onClose,
  lead,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(lead?.name ?? "");
  useEffect(() => setName(lead?.name ?? ""), [lead?.name]);
  if (!open || !lead) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 shadow-xl">
        <div className="mb-2 text-sm font-semibold">Edit card title</div>
        <input
          className="w-full rounded border px-2 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            className="rounded border px-3 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
            onClick={() => {
              onSave(name.trim());
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Lead Card ---------- */
function LeadCard({
  lead,
  onOpen,
  dragHandleProps,
  onDelete,
  onEditTitle,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  stages: Stage[];
  onDelete: () => void;
  onEditTitle: () => void;
}) {
  const aboveAvg = lead.replyRate >= lead.industryAvgReply;
  const [hover, setHover] = useState(false);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(lead)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(lead)}
        className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 transition shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-sm"
      >
        <div className="flex items-start gap-3">
          {/* drag handle */}
          {dragHandleProps && (
            <span
              aria-label="Drag"
              className="mt-1 grid h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-slate-400 hover:bg-slate-50 active:cursor-grabbing touch-none"
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}

          <Image
            src={lead.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
            width={40}
            height={40}
          />

          <div className="min-w-0 flex-1">
            {/* title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {lead.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {lead.title} · {lead.company}
                </div>
              </div>
              <Popover
                trigger={<MoreHorizontal className="h-4 w-4" />}
                align="end"
              >
                <MenuItem
                  icon={<Edit3 className="h-4 w-4" />}
                  onClick={onEditTitle}
                >
                  Edit title
                </MenuItem>
                <MenuItem icon={<Palette className="h-4 w-4" />}>
                  Edit fields
                </MenuItem>
                <MenuItem
                  danger
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={onDelete}
                >
                  Delete card
                </MenuItem>
              </Popover>
            </div>

            {/* reply rate + benchmark */}
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
                <span
                  className={cn(
                    "text-xs",
                    aboveAvg ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {aboveAvg ? "↑" : "↓"}
                </span>
              </div>
            </div>

            {/* key metrics row */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-700">
              {/* engagement */}
              <span className="inline-flex items-center gap-2">
                <span className="relative block h-2 w-16 overflow-hidden rounded bg-slate-100">
                  <span
                    className="absolute inset-y-0 left-0 rounded bg-slate-400"
                    style={{
                      width: `${Math.min(100, Math.max(0, lead.engagement))}%`,
                    }}
                  />
                </span>
                <span className="tabular-nums">{lead.engagement}</span>
              </span>

              {/* deal value */}
              <span className="rounded bg-slate-50 px-1.5 py-0.5">
                {currency(lead.dealValue)}
              </span>

              {/* next step date */}
              {lead.nextStepAt && (
                <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(lead.nextStepAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* quick actions */}
            <div className="mt-2 flex items-center gap-2">
              <button
                className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-4 w-4" />
              </button>
              <button
                className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button
                className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Linkedin className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* hover quick view */}
      {hover && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-white p-3 text-xs text-slate-700 shadow">
          {lead.headline && <div className="mb-1">{lead.headline}</div>}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {lead.location && <span>{lead.location}</span>}
            {lead.priority && <span>Priority: {lead.priority}</span>}
            {lead.firstInteraction && (
              <span>First: {lead.firstInteraction}</span>
            )}
            {lead.avgResponseHrs !== undefined && (
              <span>Avg resp: {lead.avgResponseHrs}h</span>
            )}
            {!!lead.tags?.length && <span>Tags: {lead.tags.join(", ")}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Column ---------- */
function StageColumn({
  stage,
  leads,
  onOpen,
  onRename,
  onRecolor,
  onRemove,
  stages,
  onEditTitle,
  onDeleteLead,
}: {
  stage: Stage;
  leads: Lead[];
  onOpen: (l: Lead) => void;
  onRename: (id: Stage["id"], label: string) => void;
  onRecolor: (id: Stage["id"], colorUtility: string) => void;
  onRemove: (id: Stage["id"]) => void;
  stages: Stage[];
  onEditTitle: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: String(stage.id) });
  const [renameOpen, setRenameOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [value, setValue] = useState(stage.label);

  return (
    <div className="w-[320px] shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", stage.color)} />
          <div className="text-sm font-semibold text-slate-800">
            {stage.label}
          </div>
          <span className="text-xs text-slate-500">{leads.length}</span>
        </div>

        <Popover trigger={<MoreHorizontal className="h-4 w-4" />}>
          <MenuItem
            icon={<Edit3 className="h-4 w-4" />}
            onClick={() => setRenameOpen(true)}
          >
            Rename stage
          </MenuItem>
          <MenuItem
            icon={<Palette className="h-4 w-4" />}
            onClick={() => setColorOpen(true)}
          >
            Edit color
          </MenuItem>
          <MenuItem
            danger
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => onRemove(stage.id)}
          >
            Delete stage
          </MenuItem>
        </Popover>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[20px] space-y-3 rounded-lg p-0.5",
          isOver && "ring-2 ring-slate-300"
        )}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={rectSortingStrategy}
        >
          {leads.map((l) => (
            <SortableLeadCard
              key={l.id}
              lead={l}
              onOpen={onOpen}
              stages={stages}
              onEditTitle={() => onEditTitle(l)}
              onDelete={() => onDeleteLead(l)}
            />
          ))}
          {leads.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              Drop here
            </div>
          )}
        </SortableContext>
      </div>

      {/* rename modal */}
      {renameOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setRenameOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 shadow-xl">
            <div className="mb-2 text-sm font-semibold">Rename stage</div>
            <input
              className="w-full rounded border px-2 py-2 text-sm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                onClick={() => {
                  onRename(stage.id, value.trim() || stage.label);
                  setRenameOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* color modal */}
      {colorOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setColorOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 shadow-xl">
            <div className="mb-3 text-sm font-semibold">Choose a color</div>
            <div className="grid grid-cols-8 gap-2">
              {[
                "bg-slate-400",
                "bg-sky-400",
                "bg-violet-400",
                "bg-green-500",
                "bg-cyan-500",
                "bg-amber-500",
                "bg-emerald-500",
                "bg-rose-500",
              ].map((c) => (
                <button
                  key={c}
                  className={cn("h-6 w-6 rounded-full border", c)}
                  onClick={() => {
                    onRecolor(stage.id, c);
                    setColorOpen(false);
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sortable item wrapper ---------- */
function SortableLeadCard({
  lead,
  onOpen,
  stages,
  onDelete,
  onEditTitle,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
  stages: Stage[];
  onDelete: () => void;
  onEditTitle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <LeadCard
        lead={lead}
        onOpen={onOpen}
        dragHandleProps={listeners as any}
        stages={stages}
        onDelete={onDelete}
        onEditTitle={onEditTitle}
      />
    </div>
  );
}

/* ---------- Drawer (content same as your last good version, spacing fixed) ---------- */
function DetailDrawer({
  lead,
  onClose,
  onStageChange,
  stages,
}: {
  lead: Lead | null;
  onClose: () => void;
  onStageChange: (id: StageId) => void;
  stages: Stage[];
}) {
  const [tab, setTab] = useState<"engagement" | "deal" | "notes" | "timeline">(
    "engagement"
  );
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl">
        {/* header */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image
                src={lead.avatar}
                className="h-10 w-10 rounded-full"
                alt="lead"
                width={40}
                height={40}
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {lead.name}
                </div>
                <div className="text-xs text-slate-500">
                  {lead.title} · {lead.company}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {lead.industry && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                      {lead.industry}
                    </span>
                  )}
                  {lead.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <select
                className="rounded-full border border-slate-300 px-2 py-1 text-xs"
                value={lead.stage}
                onChange={(e) => onStageChange(e.target.value as StageId)}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-full border border-slate-300 px-2 py-1 text-xs"
                defaultValue={lead.priority ?? "medium"}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input
                className="w-24 rounded-full border border-slate-300 px-2 py-1 text-xs"
                placeholder="Group"
              />
              <input
                className="w-32 rounded-full border border-slate-300 px-2 py-1 text-xs"
                type="date"
              />
              <button className="rounded-full border px-2 py-1 text-xs">
                Enrich
              </button>
              <button
                className="text-xl leading-none text-slate-500"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div className="border-b border-slate-200 px-4">
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
                  "py-2 -mb-px border-b-2",
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

        {/* content */}
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {tab === "engagement" && (
            <div className="space-y-4">
              <div className="space-y-1">
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

              {/* DMs */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    LinkedIn DMs
                  </div>
                  <div className="text-xs text-slate-500">
                    Reply Rate: {lead.replyRate}% | Industry Avg:{" "}
                    {lead.industryAvgReply}%
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="rounded bg-slate-50 p-2">
                    You: Quick intro about {lead.company}…
                  </div>
                  <div className="rounded border bg-white p-2">
                    {lead.name}: Sounds interesting—send details.
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    placeholder="Write a DM…"
                  />
                  <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                    Send
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    Comments
                  </div>
                  <div className="text-xs text-slate-500">
                    Avg Replies Per Comment: 0.8 | Top: 1.4
                  </div>
                </div>
                <div className="text-xs text-slate-600">No comments yet.</div>
              </div>

              {/* Emails */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    Emails
                  </div>
                  <div className="text-xs text-slate-500">
                    Open Rate: 46% | Industry Avg: 32%
                  </div>
                </div>
                <div className="text-xs text-slate-600">No emails yet.</div>
              </div>

              {/* WhatsApp */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    WhatsApp
                  </div>
                  <div className="text-xs text-slate-500">
                    Response Rate: 31% | Industry Avg: 22%
                  </div>
                </div>
                <div className="text-xs text-slate-600">No messages yet.</div>
              </div>
            </div>
          )}

          {tab === "deal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-500">Deal Value</div>
                  <div className="text-base font-semibold">
                    {currency(lead.dealValue)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Avg deal in your industry: $4.2k
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-500">Close Date</div>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-2 rounded-xl border p-3">
                  <div className="mb-1 text-xs text-slate-500">
                    Won/Lost Reason
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {"Budget, Timing, Feature Gap, Competitor"
                      .split(", ")
                      .map((r) => (
                        <button
                          key={r}
                          className="rounded-full border px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          {r}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              <textarea
                className="h-36 w-full rounded-xl border p-3 text-sm"
                placeholder="Notes about this lead…"
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  placeholder="Reminder: follow up next week"
                />
                <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
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
                "2025-09-19 Added to pipeline",
              ].map((t, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                  <div>{t}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <button className="rounded-lg border px-3 py-2 text-sm">
            Log activity
          </button>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-2 text-sm">
              Add reminder
            </button>
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
              More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sidebar (left, always visible) ---------- */
function AppSidebar({ onCreate }: { onCreate: () => void }) {
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <div className="text-sm font-semibold">Alex Johnson</div>
        </div>
        <button
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-slate-50"
          onClick={onCreate}
          title="Create lead"
        >
          <SquarePen className="h-4 w-4" />
          <span className="hidden lg:inline">Create</span>
        </button>
      </div>

      <nav className="nice-scroll grid flex-1 gap-6 overflow-auto p-3">
        <section>
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Workspace
          </div>
          <div className="grid gap-1">
            <a className="cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <span className="inline-flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" /> Pipeline
              </span>
            </a>
            <a className="cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <span className="inline-flex items-center gap-2">
                <FolderClosed className="h-4 w-4" /> Deals
              </span>
            </a>
            <a className="cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" /> Settings
              </span>
            </a>
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Teams
          </div>
          <div className="grid gap-1">
            <a className="cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <span className="inline-flex items-center gap-2">
                <Users2 className="h-4 w-4" /> New Business
              </span>
            </a>
            <a className="cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <span className="inline-flex items-center gap-2">
                <Users2 className="h-4 w-4" /> Enterprise
              </span>
            </a>
          </div>
        </section>
      </nav>
    </aside>
  );
}

/* ---------- Toolbar (top) ---------- */
function BoardToolbar({
  filters,
  setFilters,
  owners,
  industries,
  tags,
  stages,
  onBulk,
}: {
  owners: string[];
  industries: string[];
  tags: string[];
  stages: Stage[];
  filters: {
    owner?: string;
    priority?: "low" | "medium" | "high";
    industry?: string;
    tag?: string;
    stage?: StageId;
    replyMin?: number;
    replyMax?: number;
    engMin?: number;
    engMax?: number;
  };
  setFilters: (f: any) => void;
  onBulk: (action: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          className="w-[260px] rounded-lg border px-3 py-2 pr-8 text-sm"
          placeholder="Quick search…"
        />
        <span className="absolute right-2 top-2 text-slate-400">⌘K</span>
      </div>

      {/* inline filters */}
      <select
        className="hidden rounded-lg border px-2 py-2 text-sm sm:block"
        value={filters.owner ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, owner: e.target.value || undefined })
        }
      >
        <option value="">Owner</option>
        {owners.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>

      <select
        className="hidden rounded-lg border px-2 py-2 text-sm sm:block"
        value={filters.priority ?? ""}
        onChange={(e) =>
          setFilters({
            ...filters,
            priority: (e.target.value as any) || undefined,
          })
        }
      >
        <option value="">Priority</option>
        <option>high</option>
        <option>medium</option>
        <option>low</option>
      </select>

      <select
        className="hidden rounded-lg border px-2 py-2 text-sm sm:block"
        value={filters.industry ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, industry: e.target.value || undefined })
        }
      >
        <option value="">Industry</option>
        {industries.map((i) => (
          <option key={i}>{i}</option>
        ))}
      </select>

      <select
        className="hidden rounded-lg border px-2 py-2 text-sm sm:block"
        value={filters.tag ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, tag: e.target.value || undefined })
        }
      >
        <option value="">Tag</option>
        {tags.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <select
        className="hidden rounded-lg border px-2 py-2 text-sm sm:block"
        value={filters.stage ?? ""}
        onChange={(e) =>
          setFilters({
            ...filters,
            stage: (e.target.value as StageId) || undefined,
          })
        }
      >
        <option value="">Stage</option>
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      {/* quick metric ranges */}
      <div className="hidden items-center gap-1 text-xs sm:flex">
        <span className="text-slate-500">Reply %</span>
        <input
          type="number"
          placeholder="min"
          className="w-14 rounded border px-1 py-1"
          value={filters.replyMin ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              replyMin: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        <span>–</span>
        <input
          type="number"
          placeholder="max"
          className="w-14 rounded border px-1 py-1"
          value={filters.replyMax ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              replyMax: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <div className="hidden items-center gap-1 text-xs sm:flex">
        <span className="text-slate-500">Eng</span>
        <input
          type="number"
          placeholder="min"
          className="w-14 rounded border px-1 py-1"
          value={filters.engMin ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              engMin: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        <span>–</span>
        <input
          type="number"
          placeholder="max"
          className="w-14 rounded border px-1 py-1"
          value={filters.engMax ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              engMax: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <Dropdown label="Bulk actions">
        <MenuItem onClick={() => onBulk("assign")}>Assign owner…</MenuItem>
        <MenuItem onClick={() => onBulk("stage")}>Change stage…</MenuItem>
        <MenuItem onClick={() => onBulk("export")}>Export CSV</MenuItem>
        <MenuItem danger onClick={() => onBulk("delete")}>
          Delete selected
        </MenuItem>
      </Dropdown>

      <button className="hidden rounded-lg border px-3 py-2 text-sm sm:inline-flex">
        Customize
      </button>
    </div>
  );
}

/* ---------- Create Lead Modal (unchanged from your version) ---------- */
function CreateLeadModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (l: Omit<Lead, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<Lead, "id">>({
    name: "",
    title: "",
    company: "",
    avatar: "https://i.pravatar.cc/60?img=1",
    stage: "new",
    replyRate: 0,
    industryAvgReply: 27,
    engagement: 0,
    dealValue: 0,
    nextStepAt: undefined,
    owner: "Alex",
    priority: "medium",
    location: "",
    headline: "",
    firstInteraction: undefined,
    avgResponseHrs: 12,
    tags: [],
    industry: "",
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Create Lead</div>
          <button className="text-xl text-slate-500" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <input
            className="rounded border px-2 py-1"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded border px-2 py-1"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="col-span-2 rounded border px-2 py-1"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <input
            className="rounded border px-2 py-1"
            type="number"
            placeholder="Deal value"
            value={form.dealValue}
            onChange={(e) =>
              setForm({ ...form, dealValue: Number(e.target.value || 0) })
            }
          />
          <input
            className="rounded border px-2 py-1"
            type="number"
            placeholder="Engagement"
            value={form.engagement}
            onChange={(e) =>
              setForm({ ...form, engagement: Number(e.target.value || 0) })
            }
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded border px-3 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
            onClick={() => {
              onCreate(form);
              onClose();
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sortable Stage wrapper ---------- */
function SortableStage({
  stage,
  children,
}: {
  stage: Stage;
  children: React.ReactNode;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="shrink-0"
    >
      {children}
    </div>
  );
}

/* ---------- Main ---------- */
export default function KanbanCRMBoard() {
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [open, setOpen] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [filters, setFilters] = useState<any>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  /* filtering */
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const f = filters;
      if (f.owner && l.owner !== f.owner) return false;
      if (f.priority && l.priority !== f.priority) return false;
      if (f.industry && l.industry !== f.industry) return false;
      if (f.tag && !(l.tags ?? []).includes(f.tag)) return false;
      if (f.stage && l.stage !== f.stage) return false;
      if (f.replyMin !== undefined && l.replyRate < f.replyMin) return false;
      if (f.replyMax !== undefined && l.replyRate > f.replyMax) return false;
      if (f.engMin !== undefined && l.engagement < f.engMin) return false;
      if (f.engMax !== undefined && l.engagement > f.engMax) return false;
      return true;
    });
  }, [leads, filters]);

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = Object.fromEntries(
      stages.map((s) => [String(s.id), [] as Lead[]])
    );
    filtered.forEach((l) => {
      const key = String(l.stage);
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  }, [filtered, stages]);

  const allByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    leads.forEach((l) => {
      const k = String(l.stage);
      (map[k] ||= []).push(l);
    });
    return map;
  }, [leads]);

  const findStageOf = (id: string): StageId =>
    (Object.keys(allByStage) as StageId[]).find((s) =>
      (allByStage[s] ?? []).some((l) => l.id === id)
    ) as StageId;

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const activeStage = findStageOf(activeId);
    const overStage = stages.some((s) => String(s.id) === overId)
      ? (overId as StageId)
      : findStageOf(overId);

    if (activeStage && overStage && activeStage !== overStage) {
      setLeads((prev) =>
        prev.map((l) => (l.id === activeId ? { ...l, stage: overStage } : l))
      );
    }
  }

  function onDragEndCards(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const stage = findStageOf(activeId);
    const ids = (allByStage[stage] ?? []).map((l) => l.id);
    const oldIndex = ids.indexOf(activeId);
    const newIndex = stages.some((s) => String(s.id) === overId)
      ? oldIndex
      : ids.indexOf(overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(ids, oldIndex, newIndex);
      const order = new Map(reordered.map((id, i) => [id, i]));
      setLeads((prev) =>
        [...prev].sort((a, b) => {
          if (a.stage !== stage || b.stage !== stage) return 0;
          return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
        })
      );
    }
  }

  function onDragEndColumns(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = stages.map((x) => String(x.id));
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    setStages((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  /* stage ops */
  function addStage() {
    const nid = crypto.randomUUID();
    setStages((s) => [
      ...s,
      { id: nid, label: "New Stage", color: "bg-slate-400" },
    ]);
  }
  function renameStage(id: Stage["id"], label: string) {
    setStages((s) => s.map((x) => (x.id === id ? { ...x, label } : x)));
  }
  function recolorStage(id: Stage["id"], color: string) {
    setStages((s) => s.map((x) => (x.id === id ? { ...x, color } : x)));
  }
  function removeStage(id: Stage["id"]) {
    setStages((s) => s.filter((x) => x.id !== id));
    setLeads((prev) =>
      prev.map((l) => (l.stage === id ? { ...l, stage: "new" as StageId } : l))
    );
  }

  /* card ops */
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
  function handleCreateLead(l: Omit<Lead, "id">) {
    setLeads((prev) => [{ ...l, id: crypto.randomUUID() }, ...prev]);
  }
  function deleteLead(lead: Lead) {
    setLeads((prev) => prev.filter((x) => x.id !== lead.id));
    if (open?.id === lead.id) setOpen(null);
  }
  function editLeadTitle(lead: Lead) {
    setEditLead(lead);
    setEditOpen(true);
  }
  function saveLeadTitle(name: string) {
    if (!editLead) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === editLead.id ? { ...l, name } : l))
    );
  }

  /* layout: fill viewport height, board never overflows body */
  return (
    <div className="flex min-h-[100dvh]">
      {/* left sidebar (always) */}
      <AppSidebar onCreate={() => setCreateOpen(true)} />

      {/* main area */}
      <div className="flex min-h-[100dvh] flex-1 flex-col">
        {/* header */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="mx-auto w-[95%] max-w-[1600px] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded bg-slate-900" />
              <div className="text-sm font-semibold">
                Pipeline — Q3 New Business
              </div>
            </div>
            <div className="mt-3">
              <BoardToolbar
                owners={owners}
                industries={industries}
                tags={tagsList}
                stages={stages}
                filters={filters}
                setFilters={setFilters}
                onBulk={(a) => console.log("bulk:", a)}
              />
            </div>
          </div>
        </header>

        {/* content */}
        <div className="mx-auto flex w-[95%] max-w-[1600px] flex-1 px-4">
          {/* board container that fills remaining height */}
          <div className="nice-scroll flex-1 overflow-hidden">
            {mounted && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragOver={onDragOver}
                onDragEnd={(e) => {
                  onDragEndCards(e);
                  onDragEndColumns(e);
                }}
              >
                <main className="flex h-full flex-col py-6">
                  <div className="nice-scroll flex gap-4 overflow-x-auto pb-2">
                    <SortableContext
                      items={stages.map((s) => s.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {stages.map((stage) => (
                        <SortableStage key={stage.id} stage={stage}>
                          <StageColumn
                            stage={stage}
                            leads={byStage[String(stage.id)] ?? []}
                            onOpen={openLead}
                            onRename={renameStage}
                            onRecolor={recolorStage}
                            onRemove={removeStage}
                            stages={stages}
                            onEditTitle={editLeadTitle}
                            onDeleteLead={deleteLead}
                          />
                        </SortableStage>
                      ))}

                      {/* Add Stage */}
                      <button
                        onClick={addStage}
                        className="h-fit shrink-0 self-start rounded-lg border border-dashed px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        + Add stage
                      </button>
                    </SortableContext>
                  </div>
                </main>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* drawers & modals */}
      <DetailDrawer
        lead={open}
        onClose={() => setOpen(null)}
        onStageChange={updateStage}
        stages={stages}
      />
      <CreateLeadModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateLead}
      />
      <EditTitleModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        lead={editLead}
        onSave={saveLeadTitle}
      />
    </div>
  );
}

/* ---------- Nice scrollbar utility (global or module) ---------- */
/* add this to your globals.css (or tailwind layer):
.nice-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}
.nice-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
.nice-scroll::-webkit-scrollbar-thumb { background: rgb(203 213 225); border-radius: 9999px; }
.nice-scroll::-webkit-scrollbar-track { background: transparent; }
*/
