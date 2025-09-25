/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  DragEndEvent,
  //   DragOverEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDndContext,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  GripVertical,
  Mail,
  MessageCircle,
  Linkedin,
  Plus,
  Search,
  Users,
  Settings,
  LayoutGrid,
  Home,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckSquare,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Pencil,
} from "lucide-react";

/**
 * SaaS Kanban CRM — Side Navbar Layout
 * - Left vertical navbar (workspace, teams, navigation)
 * - Sticky toolbar header inside content
 * - Board fills remaining height (even with zero leads)
 * - Filters are a dropdown popover (no layout shift)
 * - Drag & drop with dnd-kit
 * - Compact cards w/ ReplyRate benchmark + quick actions
 * - Detail drawer w/ tabs + Playbooks
 * - Column customization modal (rename/color/WIP)
 * - Create Lead modal
 *
 * Drop this file at: app/kanban/page.tsx
 * Deps: npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
 */

/* -------------------- Types & Mock Data -------------------- */
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
  avatar: string;
  stage: StageId;
  owner?: string;
  priority?: "low" | "medium" | "high";
  industry?: string;
  tags?: string[];
  headline?: string;
  location?: string;
  firstInteraction?: string;
  avgResponseHrs?: number;
  engagement: number; // 0-100
  replyRate: number; // %
  industryAvgReply: number; // %
  dealValue: number; // $ amount
  nextStepAt?: string; // ISO
};

const STAGES: { id: StageId; label: string; color: string; wip?: number }[] = [
  { id: "new", label: "New", color: "bg-slate-500", wip: 8 },
  { id: "sent_dm", label: "Sent DM", color: "bg-indigo-500", wip: 8 },
  { id: "in_progress", label: "In Progress", color: "bg-blue-500", wip: 8 },
  { id: "qualified", label: "Qualified", color: "bg-emerald-500", wip: 6 },
  { id: "call_booked", label: "Call Booked", color: "bg-amber-500", wip: 4 },
  { id: "proposal", label: "Proposal", color: "bg-purple-500", wip: 4 },
  { id: "won", label: "Won", color: "bg-emerald-700" },
  { id: "lost", label: "Lost", color: "bg-rose-500" },
];

const COLOR_OPTIONS = [
  { label: "Slate", class: "bg-slate-500" },
  { label: "Indigo", class: "bg-indigo-500" },
  { label: "Blue", class: "bg-blue-500" },
  { label: "Green", class: "bg-emerald-500" },
  { label: "Amber", class: "bg-amber-500" },
  { label: "Purple", class: "bg-purple-500" },
  { label: "Dark Green", class: "bg-emerald-700" },
  { label: "Rose", class: "bg-rose-500" },
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

/* -------------------- Helpers -------------------- */
const currency = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const cn = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ");

/* -------------------- KPI with Benchmark -------------------- */
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
      <div className="text-slate-700 text-md font-semibold leading-5">
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

function CardMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        className="p-1 rounded hover:bg-slate-50 text-slate-500"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border bg-white shadow-lg p-1 text-sm z-10">
          <button className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Open
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-rose-600">
            <Trash2 className="h-4 w-4" /> Remove
          </button>
        </div>
      )}
    </div>
  );
}
/* -------------------- Lead Card (Compact) -------------------- */
// function LeadCard({
//   lead,
//   onOpen,
//   dragHandleProps,
// }: {
//   lead: Lead;
//   onOpen: (l: Lead) => void;
//   dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
// }) {
//   const aboveAvg = lead.replyRate >= lead.industryAvgReply;
//   const [hover, setHover] = useState(false);

//   return (
//     <div
//       className="group relative"
//       onMouseEnter={() => setHover(true)}
//       onMouseLeave={() => setHover(false)}
//     >
//       <div
//         role="button"
//         tabIndex={0}
//         onClick={() => onOpen(lead)}
//         onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(lead)}
//         className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm hover:border-slate-300 transition shadow-[0_1px_0_rgba(0,0,0,0.03)] overflow-hidden"
//       >
//         <div className="flex items-start gap-3">
//           {dragHandleProps && (
//             <button
//               aria-label="Drag"
//               className="mt-1 h-6 w-6 shrink-0 rounded hover:bg-slate-50 text-slate-400 grid place-items-center cursor-grab active:cursor-grabbing"
//               {...dragHandleProps}
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//               }}
//             >
//               <GripVertical className="h-4 w-4" />
//             </button>
//           )}

//           <Image
//             src={`${lead.avatar}`}
//             alt=""
//             className="h-8 w-8 rounded-full object-cover"
//             width={100}
//             height={100}
//           />

//           <div className="flex-1 min-w-0">
//             <div className="flex items-center justify-between gap-2">
//               <div className="truncate">
//                 <div className="text-sm font-semibold text-slate-900 truncate">
//                   {lead.name}
//                 </div>
//                 <div className="text-xs text-slate-500 truncate">
//                   {lead.title} · {lead.company}
//                 </div>
//               </div>
//               {/* <span
//                 className={cn(
//                   "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white",
//                   STAGES.find((s) => s.id === lead.stage)?.color
//                 )}
//               >
//                 {STAGES.find((s) => s.id === lead.stage)?.label}
//               </span> */}

//               <div className="flex items-center gap-1 shrink-0">
//                 <span
//                   className={cn(
//                     "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white",
//                     STAGES.find((s) => s.id === lead.stage)?.color
//                   )}
//                 >
//                   {STAGES.find((s) => s.id === lead.stage)?.label}
//                 </span>

//                 {/* Kebab */}
//                 <CardMenu />
//               </div>
//             </div>

//             {/* Benchmarked Reply Rate */}
//             <div className="mt-2 flex items-center gap-2 text-sm">
//               <span
//                 className={cn(
//                   "font-semibold",
//                   aboveAvg ? "text-emerald-700" : "text-rose-700"
//                 )}
//               >
//                 {lead.replyRate}%
//               </span>
//               <span className="text-xs text-slate-500">
//                 (Avg {lead.industryAvgReply}%)
//               </span>
//               <span
//                 className={cn(
//                   "text-xs",
//                   aboveAvg ? "text-emerald-600" : "text-rose-600"
//                 )}
//               >
//                 {aboveAvg ? "↑" : "↓"}
//               </span>
//             </div>

//             {/* Key Metrics Row */}
//             <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
//               <span className="rounded bg-slate-50 px-1.5 py-0.5">
//                 Eng {lead.engagement}
//               </span>
//               <span className="rounded bg-slate-50 px-1.5 py-0.5">
//                 {currency(lead.dealValue)}
//               </span>
//               {lead.nextStepAt && (
//                 <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 whitespace-nowrap">
//                   <Calendar className="h-3.5 w-3.5" />
//                   {new Date(lead.nextStepAt).toLocaleDateString()}
//                 </span>
//               )}
//             </div>

//             {/* Quick Actions */}
//             {/* opacity-0 group-hover:opacity-100 */}
//             <div className="mt-2 flex items-center gap-2  transition">
//               <button
//                 className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <Mail className="h-4 w-4" />
//               </button>
//               <button
//                 className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <MessageCircle className="h-4 w-4" />
//               </button>
//               <button
//                 className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <Linkedin className="h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Hover Quick View */}
//       {hover && (
//         <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-white p-3 text-xs text-slate-700 shadow">
//           {lead.headline && <div className="mb-1">{lead.headline}</div>}
//           <div className="flex flex-wrap gap-x-3 gap-y-1">
//             {lead.location && <span>{lead.location}</span>}
//             {lead.priority && <span>Priority: {lead.priority}</span>}
//             {lead.firstInteraction && (
//               <span>First: {lead.firstInteraction}</span>
//             )}
//             {lead.avgResponseHrs !== undefined && (
//               <span>Avg resp: {lead.avgResponseHrs}h</span>
//             )}
//             {!!lead.tags?.length && <span>Tags: {lead.tags.join(", ")}</span>}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

function LeadCard({
  lead,
  onOpen,
  dragHandleProps,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const aboveAvg = lead.replyRate >= lead.industryAvgReply;

  const [hover, setHover] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);

  // Hide hover preview while dragging globally
  const { active } = useDndContext();
  const dragging = Boolean(active);

  useEffect(() => {
    const up = () => setIsPointerDown(false);
    const end = () => setIsPointerDown(false);
    window.addEventListener("pointerup", up);
    window.addEventListener("dragend", end);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("dragend", end);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  useEffect(() => {
    if (dragging) {
      setHover(false);
      setIsPointerDown(false);
    }
  }, [dragging]);

  const showHover = hover && !isPointerDown && !dragging;

  // Stage bg class (e.g. "bg-indigo-500") for the accent strip + progress bar fill
  const stageBgClass =
    STAGES.find((s) => s.id === lead.stage)?.color || "bg-slate-300";

  const engagementClamped = Math.max(0, Math.min(100, lead.engagement));

  return (
    <div
      className="group relative"
      onMouseEnter={() => {
        if (!isPointerDown && !dragging) setHover(true);
      }}
      onMouseLeave={() => setHover(false)}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(lead)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(lead)}
        onPointerDown={() => {
          setHover(false);
          setIsPointerDown(true);
        }}
        className="relative w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm hover:border-slate-300 transition shadow-[0_1px_0_rgba(0,0,0,0.03)] overflow-hidden"
      >
        {/* Left color accent that matches stage */}
        <div
        //   className={cn(
        //     "pointer-events-none absolute left-0 top-0 h-full w-1.5 rounded-l-xl",
        //     stageBgClass
        //   )}
        />

        {/* Top row: drag handle + (avatar + identity) + stage + menu */}
        <div className="flex items-start gap-3">
          {dragHandleProps && (
            <button
              aria-label="Drag"
              className="mt-1 h-6 w-6 shrink-0 rounded hover:bg-slate-50 text-slate-400 grid place-items-center cursor-grab active:cursor-grabbing"
              {...dragHandleProps}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {/* Avatar + identity kept together so rows below span full width */}
              <div className="flex items-center gap-3 min-w-0">
                <Image
                  src={`${lead.avatar}`}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover shrink-0"
                  width={100}
                  height={100}
                />
                <div className="truncate">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {lead.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {lead.title} · {lead.company}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white",
                    STAGES.find((s) => s.id === lead.stage)?.color
                  )}
                >
                  {STAGES.find((s) => s.id === lead.stage)?.label}
                </span>
                <CardMenu />
              </div>
            </div>

            {/* Benchmarked Reply Rate */}
            <div className="mt-2 flex items-center gap-2 text-sm">
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

            {/* Engagement score + mini progress bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium text-slate-700">Engagement</span>
                <span className="font-semibold text-slate-900">
                  {engagementClamped}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", stageBgClass)}
                  style={{ width: `${engagementClamped}%` }}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded bg-slate-50 px-1.5 py-0.5">
                {currency(lead.dealValue)}
              </span>
              {lead.nextStepAt && (
                <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 whitespace-nowrap">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(lead.nextStepAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Quick Actions with tooltips */}
            <div className="mt-2 flex items-center gap-2 transition">
              <div className="relative group/tt">
                <button
                  aria-label="Send email"
                  title="Send email"
                  className="rounded border px-2 py-1 text-xs hover:bg-slate-50 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-4 w-4" />
                </button>
                {/* Tooltip */}
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 group-hover/tt:opacity-100 transition-opacity shadow">
                  Send email
                </div>
              </div>

              <div className="relative group/tt">
                <button
                  aria-label="Open WhatsApp"
                  title="Open WhatsApp"
                  className="rounded border px-2 py-1 text-xs hover:bg-slate-50 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 group-hover/tt:opacity-100 transition-opacity shadow">
                  Open WhatsApp
                </div>
              </div>

              <div className="relative group/tt">
                <button
                  aria-label="Open LinkedIn DM"
                  title="Open LinkedIn DM"
                  className="rounded border px-2 py-1 text-xs hover:bg-slate-50 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 group-hover/tt:opacity-100 transition-opacity shadow">
                  Open LinkedIn DM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Quick View — hidden while pointer down or dragging */}
      {showHover && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-white p-3 text-xs text-slate-700 shadow pointer-events-none">
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

/* -------------------- Sortable Wrapper -------------------- */
function SortableLeadCard({
  lead,
  onOpen,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
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
    opacity: isDragging ? 0.2 : 1, // faint original
    // keep space so layout doesn't jump
    // (no height collapse since the node remains in flow)
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <LeadCard
        lead={lead}
        onOpen={onOpen}
        dragHandleProps={listeners as any}
      />
    </div>
  );
}

/* -------------------- Column -------------------- */
function StageColumn({
  stage,
  leads,
  onOpen,
  wip,
}: {
  stage: { id: StageId; label: string; color: string };
  leads: Lead[];
  onOpen: (l: Lead) => void;
  wip?: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const overWip = typeof wip === "number" && leads.length >= wip;

  return (
    <div
      className="w-[320px] shrink-0 rounded-xl border border-slate-200 bg-white p-2"
      id={stage.id}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", stage.color)} />
          <h3 className="text-sm font-semibold text-slate-800">
            {stage.label}
          </h3>
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              overWip ? "bg-rose-50 text-rose-600" : "text-slate-500"
            )}
          >
            {leads.length}
            {typeof wip === "number" ? `/${wip}` : ""}
          </span>
        </div>
        <button className="text-xs text-slate-500 hover:text-slate-700">
          ⋯
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "space-y-3 min-h-[120px] rounded-lg p-1 bg-slate-50/50",
          isOver && !overWip && "ring-2 ring-slate-300",
          isOver && overWip && "ring-2 ring-rose-300"
        )}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={rectSortingStrategy}
        >
          {leads.map((l) => (
            <SortableLeadCard key={l.id} lead={l} onOpen={onOpen} />
          ))}
          {leads.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              Drop here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

/* -------------------- Playbooks -------------------- */
function Playbooks({
  context,
}: {
  context: "dm" | "comments" | "email" | "deal";
}) {
  const [open, setOpen] = useState(false);
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
                {
                  '"Saw your post on {topic}. Curious how you handle {pain}. We helped {peer} get X with Y — worth 10 mins?"'
                }
              </div>
            </>
          )}
          {context === "deal" && (
            <>
              <div className="text-sm text-slate-700">
                Budget objection detected → offer option framing.
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {
                  'Basic / Standard / Pilot (outcome-based). Anchor on ROI. Ask: "Which scope gets you moving this quarter?"'
                }
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------- Detail Drawer -------------------- */
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
  const [commTab, setCommTab] = useState<
    "dm" | "comments" | "email" | "whatsapp"
  >("dm");

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl border-l border-slate-200 p-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={`${lead.avatar}`}
                className="h-10 w-10 rounded-full"
                alt="lead"
                width={100}
                height={100}
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
          <div className="flex  justify-around gap-3 text-sm">
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
              <div className="mb-5 flex gap-2 text-sm mt-2">
                {[
                  { k: "dm", l: "LinkedIn DMs" },
                  { k: "comments", l: "Comments" },
                  { k: "email", l: "Emails" },
                  { k: "whatsapp", l: "WhatsApp" },
                ].map((t) => (
                  <button
                    key={t.k}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border",
                      commTab === t.k
                        ? "border-slate-900 text-slate-900"
                        : "border-slate-200 text-slate-600 hover:text-slate-800"
                    )}
                    onClick={() => setCommTab(t.k as any)}
                  >
                    {t.l}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mb-6">
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

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm font-medium text-slate-800 mb-2">
                  {commTab === "dm"
                    ? "LinkedIn DMs"
                    : commTab === "comments"
                    ? "LinkedIn Comments"
                    : commTab === "email"
                    ? "Emails"
                    : "WhatsApp"}
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
                    placeholder={`Write a ${
                      commTab === "email" ? "message" : "DM"
                    }…`}
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
/* -------------------- Sidebar (Left Navbar) -------------------- */
function SideNavbar() {
  return (
    <aside className="h-full w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-3 py-3 border-b border-slate-200 flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-slate-900" />
        <div className="text-sm font-semibold">Acme Workspace</div>
      </div>

      <nav className="p-3 space-y-3 mt-4">
        <NavItem icon={<Home className="h-4 w-4" />} label="Home" active />
        <NavItem icon={<LayoutGrid className="h-4 w-4" />} label="Pipeline" />
        <NavItem icon={<Users className="h-4 w-4" />} label="Contacts" />
        <NavItem icon={<Sparkles className="h-4 w-4" />} label="Playbooks" />
        <div className="pt-8 text-[11px] uppercase tracking-wide text-slate-500">
          Teams
        </div>
        <NavItem label="Growth" />
        <NavItem label="Sales" />
        <NavItem label="Success" />
      </nav>

      <div className="mt-auto border-t border-slate-200 p-3 flex items-center justify-between">
        <button className="inline-flex items-center gap-2 text-sm text-slate-700">
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <Image
          src="https://i.pravatar.cc/60?img=6"
          alt="me"
          width={28}
          height={28}
          className="rounded-full"
        />
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer",
        active
          ? "bg-slate-100 text-slate-900"
          : "text-slate-700 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* -------------------- Column Customization Modal -------------------- */
function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] rounded-2xl border bg-white shadow-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          <button className="text-slate-500 text-xl" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* -------------------- Toolbar (sticky inside content) -------------------- */
function BoardToolbar({
  onOpenCreate,
  onOpenCustomize,
  owners,
  industries,
  tagsList,
  filters,
  setFilters,
  query,
  setQuery,
}: {
  onOpenFilters: () => void;
  onOpenCreate: () => void;
  onOpenCustomize: () => void;
  owners: string[]; // NEW
  industries: string[]; // NEW
  tagsList: string[]; // NEW
  filters: Filters; // NEW
  setFilters: (f: Filters) => void; // NEW
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          className="w-[260px] rounded-lg border px-3 py-2 pr-8 text-sm"
          placeholder="Search leads…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search className="absolute right-2 top-2 h-4 w-4 text-slate-400" />
      </div>

      <div className="ml-1">
        <FilterPopover
          owners={owners}
          industries={industries}
          tags={tagsList}
          value={filters}
          onChange={setFilters}
        />
      </div>

      <button
        className="rounded-lg border px-3 py-2 text-sm cursor-pointer"
        onClick={onOpenCustomize}
      >
        Customize columns
      </button>

      <div className="ml-auto flex gap-2">
        <BulkActions />
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm cursor-pointer"
          onClick={onOpenCreate}
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>
    </div>
  );
}

/* -------------------- Create Lead Form (Modal Body) -------------------- */
function CreateLeadForm({ onCreate }: { onCreate: (lead: Lead) => void }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const l: Lead = {
          id: Math.random().toString(36).slice(2),
          name,
          title,
          company,
          avatar: "https://i.pravatar.cc/60?img=8",
          stage: "new",
          engagement: 10,
          replyRate: 0,
          industryAvgReply: 22,
          dealValue: 0,
        };
        onCreate(l);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <div className="text-xs text-slate-500 mb-1">Name</div>
          <input
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <div className="text-xs text-slate-500 mb-1">Title</div>
          <input
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
      </div>
      <label className="text-sm block">
        <div className="text-xs text-slate-500 mb-1">Company</div>
        <input
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => onCreate as any}
        >
          Cancel
        </button>
        <button className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm">
          Create lead
        </button>
      </div>
    </form>
  );
}

type Filters = {
  owner?: string;
  priority?: "low" | "medium" | "high";
  industry?: string;
  tag?: string;
  stage?: StageId;
  replyMin?: number;
  replyMax?: number;
  engageMin?: number;
  engageMax?: number;
};

function FilterPopover({
  owners,
  industries,
  tags,
  value,
  onChange,
}: {
  owners: string[];
  industries: string[];
  tags: string[];
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<Filters>(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setLocal(value), [value]);

  // click outside + Esc to close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = () => {
    onChange(local);
    setOpen(false);
  };
  const clear = () => setLocal({});

  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <Filter className="h-4 w-4" />
        Filters
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[340px] rounded-xl border bg-white shadow-lg p-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Owner */}
            <label className="text-xs text-slate-500">
              Owner
              <select
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={local.owner ?? ""}
                onChange={(e) =>
                  setLocal({ ...local, owner: e.target.value || undefined })
                }
              >
                <option value="">Any</option>
                {owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            {/* Priority */}
            <label className="text-xs text-slate-500">
              Priority
              <select
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={local.priority ?? ""}
                onChange={(e) =>
                  setLocal({
                    ...local,
                    priority: (e.target.value as any) || undefined,
                  })
                }
              >
                <option value="">Any</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            {/* Industry */}
            <label className="text-xs text-slate-500">
              Industry
              <select
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={local.industry ?? ""}
                onChange={(e) =>
                  setLocal({ ...local, industry: e.target.value || undefined })
                }
              >
                <option value="">Any</option>
                {industries.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>

            {/* Tag */}
            <label className="text-xs text-slate-500">
              Tag
              <select
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={local.tag ?? ""}
                onChange={(e) =>
                  setLocal({ ...local, tag: e.target.value || undefined })
                }
              >
                <option value="">Any</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {/* Stage */}
            <label className="text-xs text-slate-500">
              Stage
              <select
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={local.stage ?? ""}
                onChange={(e) =>
                  setLocal({
                    ...local,
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
            </label>

            {/* Reply / Engagement ranges */}
            <div>
              <div className="text-xs text-slate-500">Reply Rate %</div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Min"
                  className="w-full rounded border px-2 py-1.5 text-sm"
                  value={local.replyMin ?? ""}
                  onChange={(e) =>
                    setLocal({
                      ...local,
                      replyMin:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Max"
                  className="w-full rounded border px-2 py-1.5 text-sm"
                  value={local.replyMax ?? ""}
                  onChange={(e) =>
                    setLocal({
                      ...local,
                      replyMax:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Engagement</div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Min"
                  className="w-full rounded border px-2 py-1.5 text-sm"
                  value={local.engageMin ?? ""}
                  onChange={(e) =>
                    setLocal({
                      ...local,
                      engageMin:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Max"
                  className="w-full rounded border px-2 py-1.5 text-sm"
                  value={local.engageMax ?? ""}
                  onChange={(e) =>
                    setLocal({
                      ...local,
                      engageMax:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              className="text-sm text-slate-600 hover:underline"
              onClick={clear}
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                className="rounded-lg border px-3 py-1.5 text-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm"
                onClick={apply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BulkActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="rounded-lg border px-3 py-2 text-sm cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        Bulk actions
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg p-1 text-sm">
          <button className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2">
            <CheckSquare className="h-4 w-4" /> Mark as Qualified
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Remove from board
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------- Page -------------------- */
export default function KanbanCRMPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [open, setOpen] = useState<Lead | null>(null);

  const [filters, setFilters] = useState<Filters>({});
  const [query, setQuery] = useState("");

  const owners = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.owner).filter(Boolean) as string[])
      ).sort(),
    [leads]
  );

  const industries = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.industry).filter(Boolean) as string[])
      ).sort(),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (filters.owner && l.owner !== filters.owner) return false;
      if (filters.priority && l.priority !== filters.priority) return false;
      if (filters.industry && l.industry !== filters.industry) return false;
      if (filters.tag && !(l.tags || []).includes(filters.tag)) return false;
      if (filters.stage && l.stage !== filters.stage) return false;
      if (filters.replyMin != null && l.replyRate < filters.replyMin)
        return false;
      if (filters.replyMax != null && l.replyRate > filters.replyMax)
        return false;
      if (filters.engageMin != null && l.engagement < filters.engageMin)
        return false;
      if (filters.engageMax != null && l.engagement > filters.engageMax)
        return false;

      if (q) {
        const hay = [l.name, l.title, l.company, ...(l.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, filters, query]);
  const tagsList = useMemo(
    () =>
      Array.from(
        new Set(leads.flatMap((l) => (l.tags ? l.tags.filter(Boolean) : [])))
      ).sort(),
    [leads]
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLead = useMemo(
    () => leads.find((l) => l.id === activeId) || null,
    [leads, activeId]
  );

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  // Derived groupings
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
    leads.forEach((l) => map[l.stage].push(l));
    return map;
  }, [leads]);

  const byStageFiltered = useMemo(() => {
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
    filteredLeads.forEach((l) => map[l.stage].push(l));
    return map;
  }, [filteredLeads]);

  const findStageOf = (id: string): StageId =>
    (Object.keys(byStage) as StageId[]).find((s) =>
      byStage[s].some((l) => l.id === id)
    )!;

  //   const wipOf = (stageId: StageId) => STAGES.find((s) => s.id === stageId)?.wip;

  //   function onDragOver(e: DragOverEvent) {
  //     // const { active, over } = e;
  //     // if (!over) return;
  //     // const activeId = String(active.id);
  //     // const overId = String(over.id);
  //     // const activeStage = findStageOf(activeId);
  //     // const overStage = STAGES.some((s) => s.id === overId)
  //     //   ? (overId as StageId)
  //     //   : findStageOf(overId);
  //     // // Soft WIP enforcement: prevent moving into columns over WIP
  //     // const wip = wipOf(overStage);
  //     // if (
  //     //   typeof wip === "number" &&
  //     //   byStage[overStage].length >= wip &&
  //     //   activeStage !== overStage
  //     // )
  //     //   return;
  //     // if (activeStage !== overStage) {
  //     //   setLeads((prev) =>
  //     //     prev.map((l) => (l.id === activeId ? { ...l, stage: overStage } : l))
  //     //   );
  //     // }
  //   }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragCancel() {
    setActiveId(null);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);

    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceStage = findStageOf(activeId);
    const overIsColumn = STAGES.some((s) => s.id === overId);
    const destStage = overIsColumn ? (overId as StageId) : findStageOf(overId);

    setLeads((prev) => {
      // 1) Move to new stage if needed

      let next = prev.map((l) =>
        l.id === activeId ? { ...l, stage: destStage } : l
      );

      // 2) Reorder within destination stage
      const destIds = next
        .filter((l) => l.stage === destStage)
        .map((l) => l.id);
      const fromIdx = destIds.indexOf(activeId);
      const toIdx = overIsColumn ? destIds.length - 1 : destIds.indexOf(overId);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const reordered = arrayMove(destIds, fromIdx, toIdx);
        const order = new Map(reordered.map((id, i) => [id, i]));
        next = [...next].sort((a, b) => {
          if (a.stage !== destStage || b.stage !== destStage) return 0;
          return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
        });
      }

      // 3) If staying in same stage and dropped over a card, keep that order too
      if (sourceStage === destStage && !overIsColumn) {
        const srcIds = next
          .filter((l) => l.stage === sourceStage)
          .map((l) => l.id);
        const o = new Map(srcIds.map((id, i) => [id, i]));
        next = [...next].sort((a, b) => {
          if (a.stage !== sourceStage || b.stage !== sourceStage) return 0;
          return (o.get(a.id) ?? 0) - (o.get(b.id) ?? 0);
        });
      }
      return next;
    });
  }

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

  // Column customization (demo only — persists in state)
  const [stages, setStages] = useState(STAGES);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50">
      <div className="h-full w-full flex">
        {/* Left Sidebar */}
        <SideNavbar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar inside content */}
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
            <div className="px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">
                  Pipeline — Q3 New Business
                </div>
              </div>
              <div className="mt-3">
                <BoardToolbar
                  onOpenFilters={() => {}}
                  onOpenCreate={() => setCreateOpen(true)}
                  onOpenCustomize={() => setCustomizeOpen(true)}
                  owners={owners}
                  industries={industries}
                  tagsList={tagsList}
                  filters={filters}
                  setFilters={setFilters}
                  query={query}
                  setQuery={setQuery}
                />
              </div>
            </div>
          </header>

          {/* Board container fills remaining height */}
          <main className="flex-1 min-h-0 overflow-hidden ">
            {mounted && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                // onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={onDragCancel}
              >
                <div className="h-full w-full overflow-hidden">
                  {/* Horizontal scroll area; columns grow vertically */}
                  <div className="h-full overflow-x-auto overflow-y-hidden scrollbar-thin-x">
                    <div className="h-full min-h-[calc(100dvh-140px)] pb-4 px-6 pt-4">
                      <div className="flex gap-4 h-full items-start">
                        {stages.map((stage) => (
                          <StageColumn
                            key={stage.id}
                            stage={stage}
                            leads={byStageFiltered[stage.id]}
                            onOpen={openLead}
                            wip={stage.wip}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DragOverlay>
                  {activeLead ? (
                    <div className="opacity-90 scale-[1.02]">
                      <LeadCard lead={activeLead} onOpen={() => {}} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </main>
        </div>
      </div>

      {/* Drawers & Modals */}
      <DetailDrawer
        lead={open}
        onClose={() => setOpen(null)}
        onStageChange={updateStage}
      />

      <Modal
        title="Create Lead"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      >
        <CreateLeadForm
          onCreate={(l) => {
            setLeads((prev) => [l, ...prev]);
            setCreateOpen(false);
          }}
        />
      </Modal>

      <Modal
        title="Customize Columns"
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      >
        <div className="space-y-3">
          {stages.map((s, idx) => (
            <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <input
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                  value={s.label}
                  onChange={(e) =>
                    setStages((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                />
              </div>
              <div className="col-span-4">
                <select
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                  value={
                    COLOR_OPTIONS.find((c) => c.class === s.color)?.label ??
                    "Slate"
                  }
                  onChange={(e) =>
                    setStages((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? {
                              ...x,
                              color: COLOR_OPTIONS.find(
                                (c) => c.label === e.target.value
                              )!.class,
                            }
                          : x
                      )
                    )
                  }
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.class} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                  placeholder="WIP (optional)"
                  value={s.wip ?? ""}
                  onChange={(e) =>
                    setStages((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? {
                              ...x,
                              wip: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            }
                          : x
                      )
                    )
                  }
                />
              </div>
              <div className="col-span-1 text-right">
                <button
                  className="text-sm text-rose-600"
                  onClick={() =>
                    setStages((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-2 flex justify-between">
            <button
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={() =>
                setStages((prev) => [
                  ...prev,
                  {
                    id: `custom_${Date.now()}` as StageId,
                    label: "New Stage",
                    color: "bg-slate-500",
                  },
                ])
              }
            >
              Add stage
            </button>
            <button
              className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm"
              onClick={() => setCustomizeOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
