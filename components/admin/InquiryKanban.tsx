"use client";

import { useState, useRef } from "react";
import { User, Calendar, Phone, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const FUNNEL_STAGES = [
  { id: "NEW",         label: "Нова",      color: "bg-slate-500" },
  { id: "IN_PROGRESS", label: "В роботі",  color: "bg-blue-500" },
  { id: "SHOWING",     label: "Показ",     color: "bg-amber-500" },
  { id: "DECISION",    label: "Рішення",   color: "bg-purple-500" },
  { id: "RESULT",      label: "Результат", color: "bg-emerald-500" },
];

interface InquiryCard {
  id: string;
  name: string;
  phone: string | null;
  message: string;
  source: string | null;
  funnelStage: string;
  deadline: string | null;
  createdAt: string;
  assignedUser: { id: string; name: string | null; email: string; accentColor: string | null } | null;
  property: { titleUk: string; slug: string } | null;
  seqNum: number;
}

interface Props {
  initialCards: InquiryCard[];
  agents: { id: string; name: string | null; email: string; accentColor: string | null }[];
}

function isOverdue(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });
}

function Card({
  card,
  onMoveRight,
  onMoveLeft,
  agents,
  onAssign,
  onSetDeadline,
}: {
  card: InquiryCard;
  onMoveRight?: () => void;
  onMoveLeft?: () => void;
  agents: Props["agents"];
  onAssign: (agentId: string | null) => void;
  onSetDeadline: (date: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const agentColor = card.assignedUser?.accentColor ?? "#94a3b8";
  const overdue = isOverdue(card.deadline);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-sm hover:shadow-md transition cursor-default">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400">#{card.seqNum}</span>
          <span className="text-[10px] text-gray-400">{fmtDate(card.createdAt)}</span>
        </div>
        <span className={cn(
          "w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5",
          card.source ? "bg-orange-400" : "bg-gray-300"
        )} />
      </div>

      {/* Message */}
      <p className="text-xs font-semibold text-navy-900 leading-snug line-clamp-2 mb-1">
        {card.message}
      </p>

      {/* Contact */}
      <p className="text-xs text-gray-500 font-medium truncate mb-1.5">{card.name}</p>

      {/* Property */}
      {card.property && (
        <p className="text-[10px] text-gray-400 truncate mb-1.5">{card.property.titleUk}</p>
      )}

      {/* Deadline */}
      {card.deadline && (
        <span className={cn(
          "inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-1.5",
          overdue ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-600"
        )}>
          {fmtDate(card.deadline)}
        </span>
      )}

      {/* Assigned agent */}
      {card.assignedUser && (
        <p className="text-[10px] font-semibold mb-2" style={{ color: agentColor }}>
          {card.assignedUser.name ?? card.assignedUser.email}
        </p>
      )}

      {/* Expand */}
      <button
        onClick={() => setExpanded((o) => !o)}
        className="text-[10px] text-gray-400 hover:text-gray-600 transition mb-2"
      >
        {expanded ? "Згорнути ▲" : "Деталі ▼"}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-gray-100 pt-2 mt-1">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline">
              <Phone className="w-3 h-3" />{card.phone}
            </a>
          )}
          {card.source && (
            <p className="text-[10px] text-gray-400">Джерело: <span className="font-semibold text-gray-600">{card.source}</span></p>
          )}

          {/* Assign agent */}
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Відповідальний:</p>
            <select
              value={card.assignedUser?.id ?? ""}
              onChange={(e) => onAssign(e.target.value || null)}
              className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
            >
              <option value="">— Не вказано —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Дедлайн:</p>
            <input
              type="date"
              defaultValue={card.deadline ? card.deadline.split("T")[0] : ""}
              onChange={(e) => onSetDeadline(e.target.value || null)}
              className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Move buttons */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <button
          onClick={onMoveLeft}
          disabled={!onMoveLeft}
          className="text-[10px] text-gray-400 hover:text-navy-700 disabled:opacity-20 transition px-1"
        >
          ← Назад
        </button>
        <button
          onClick={onMoveRight}
          disabled={!onMoveRight}
          className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-navy-700 disabled:opacity-20 transition px-1"
        >
          Далі <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function InquiryKanban({ initialCards, agents }: Props) {
  const [cards, setCards] = useState(initialCards);
  const dragCard = useRef<string | null>(null);

  async function moveCard(id: string, newStage: string) {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, funnelStage: newStage } : c));
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelStage: newStage }),
    });
  }

  async function assignCard(id: string, agentId: string | null) {
    const agent = agents.find((a) => a.id === agentId) ?? null;
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, assignedUser: agent } : c));
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedUserId: agentId }),
    });
  }

  async function setDeadline(id: string, date: string | null) {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, deadline: date } : c));
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: date }),
    });
  }

  function handleDrop(stageId: string) {
    if (dragCard.current && dragCard.current !== stageId) {
      const card = cards.find((c) => c.id === dragCard.current);
      if (card && card.funnelStage !== stageId) {
        moveCard(dragCard.current, stageId);
      }
    }
    dragCard.current = null;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
      {FUNNEL_STAGES.map((stage, stageIdx) => {
        const stageCards = cards.filter((c) => c.funnelStage === stage.id);
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-64 flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.id)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
              <span className="font-semibold text-sm text-navy-900">{stage.label}</span>
              <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {stageCards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {stageCards.map((card) => {
                const currentIdx = FUNNEL_STAGES.findIndex((s) => s.id === card.funnelStage);
                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => { dragCard.current = card.id; }}
                  >
                    <Card
                      card={card}
                      agents={agents}
                      onMoveLeft={currentIdx > 0 ? () => moveCard(card.id, FUNNEL_STAGES[currentIdx - 1].id) : undefined}
                      onMoveRight={currentIdx < FUNNEL_STAGES.length - 1 ? () => moveCard(card.id, FUNNEL_STAGES[currentIdx + 1].id) : undefined}
                      onAssign={(agentId) => assignCard(card.id, agentId)}
                      onSetDeadline={(date) => setDeadline(card.id, date)}
                    />
                  </div>
                );
              })}

              {/* Drop zone */}
              {stageCards.length === 0 && (
                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center min-h-[80px]">
                  <p className="text-xs text-gray-300">Перетягніть сюди</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
