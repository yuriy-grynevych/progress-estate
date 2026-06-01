"use client";

import { useState, useRef } from "react";
import { Phone, ChevronRight, Pencil, X, Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AddLeadModal from "./AddLeadModal";

export const FUNNEL_STAGES = [
  { id: "NEW",          label: "Нова",      color: "bg-slate-500" },
  { id: "IN_PROGRESS",  label: "В роботі",  color: "bg-blue-500" },
  { id: "SHOWING",      label: "Показ",     color: "bg-amber-500" },
  { id: "DECISION",     label: "Рішення",   color: "bg-purple-500" },
  { id: "RESULT",       label: "Результат", color: "bg-emerald-500" },
];

interface NoteEntry {
  id: string;
  text: string;
  date: string;
  stage?: string;
}

function parseNotes(raw: string | null): NoteEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy plain text — wrap into single entry
  return [{ id: "legacy_0", text: raw, date: "" }];
}

function stringifyNotes(notes: NoteEntry[]): string | null {
  if (notes.length === 0) return null;
  return JSON.stringify(notes);
}

interface InquiryCard {
  id: string;
  name: string;
  phone: string | null;
  message: string;
  notes: string | null;
  source: string | null;
  funnelStage: string;
  deadline: string | null;
  createdAt: string;
  assignedUser: { id: string; name: string | null; email: string; accentColor: string | null } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  property: { titleUk: string; slug: string } | null;
  seqNum: number;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
  accentColor: string | null;
}

interface Props {
  initialCards: InquiryCard[];
  agents: Agent[];
  role: string;
  currentUserId: string;
}

interface PostMoveState {
  cardId: string;
  cardName: string;
  stageName: string;
  note: string;
  addTask: boolean;
  taskTitle: string;
  taskDue: string;
}

interface EditState {
  card: InquiryCard;
  name: string;
  phone: string;
  message: string;
}

function isOverdue(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

function Card({
  card,
  onMoveRight,
  onMoveLeft,
  agents,
  isAdmin,
  onAssign,
  onSetDeadline,
  onEdit,
  onNotesChange,
}: {
  card: InquiryCard;
  onMoveRight?: () => void;
  onMoveLeft?: () => void;
  agents: Agent[];
  isAdmin: boolean;
  onAssign: (agentId: string | null) => void;
  onSetDeadline: (date: string | null) => void;
  onEdit: () => void;
  onNotesChange: (notes: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState<NoteEntry[]>(() => parseNotes(card.notes));
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const agentColor = card.assignedUser?.accentColor ?? "#94a3b8";
  const overdue = isOverdue(card.deadline);

  async function persistNotes(updated: NoteEntry[]) {
    const json = stringifyNotes(updated);
    await fetch(`/api/inquiries/${card.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: json }),
    });
    onNotesChange(json);
  }

  async function addNote() {
    if (!newNoteText.trim()) return;
    const entry: NoteEntry = {
      id: Date.now().toString(36),
      text: newNoteText.trim(),
      date: new Date().toLocaleDateString("uk-UA"),
    };
    const updated = [...notes, entry];
    setNotes(updated);
    setNewNoteText("");
    setAddingNote(false);
    await persistNotes(updated);
  }

  async function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await persistNotes(updated);
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    const updated = notes.map(n => n.id === id ? { ...n, text: editText.trim() } : n);
    setNotes(updated);
    setEditingId(null);
    await persistNotes(updated);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gold-300 p-3 text-sm hover:shadow-md transition cursor-default">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400">#{card.seqNum}</span>
          <span className="text-[10px] text-gray-400">{fmtDate(card.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="text-gray-300 hover:text-navy-600 transition"
            title="Редагувати"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", card.source ? "bg-orange-400" : "bg-gray-300")} />
        </div>
      </div>

      <p className="text-xs font-semibold text-navy-900 leading-snug line-clamp-2 mb-1">{card.message}</p>
      <p className="text-xs text-gray-500 font-medium truncate mb-0.5">{card.name}</p>
      {card.createdBy && (
        <p className="text-[10px] text-gray-400 truncate mb-1">
          Додав: <span className="font-medium text-gray-500">{card.createdBy.name ?? card.createdBy.email}</span>
        </p>
      )}

      {card.property && (
        <p className="text-[10px] text-gray-400 truncate mb-1.5">{card.property.titleUk}</p>
      )}
      {card.deadline && (
        <span className={cn(
          "inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-1.5",
          overdue ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-600"
        )}>
          {fmtDate(card.deadline)}
        </span>
      )}
      {isAdmin ? (
        <p className="text-[10px] font-semibold mb-2" style={{ color: card.assignedUser ? agentColor : '#9ca3af' }}>
          {card.assignedUser ? (card.assignedUser.name ?? card.assignedUser.email) : "— Не призначено —"}
        </p>
      ) : card.assignedUser && (
        <p className="text-[10px] font-semibold mb-2" style={{ color: agentColor }}>
          {card.assignedUser.name ?? card.assignedUser.email}
        </p>
      )}

      <button onClick={() => setExpanded(o => !o)} className="text-[10px] text-gray-400 hover:text-gray-600 transition mb-2">
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
          {isAdmin && agents.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Відповідальний:</p>
              <select
                value={card.assignedUser?.id ?? ""}
                onChange={e => onAssign(e.target.value || null)}
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
              >
                <option value="">— Не вказано —</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Дедлайн:</p>
            <input
              type="date"
              defaultValue={card.deadline ? card.deadline.split("T")[0] : ""}
              onChange={e => onSetDeadline(e.target.value || null)}
              className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Notes panel — always visible */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold text-gray-400">Нотатки</p>
          {!addingNote && (
            <button
              onClick={() => setAddingNote(true)}
              className="text-gray-300 hover:text-navy-600 transition"
              title="Додати нотатку"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {notes.length > 0 && (
          <div className="space-y-1.5 mb-1.5">
            {notes.map(note => (
              <div key={note.id} className="bg-amber-50 rounded-lg px-2 py-1.5">
                {note.date || note.stage ? (
                  <p className="text-[9px] text-amber-600 font-semibold mb-0.5">
                    {[note.date, note.stage].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {editingId === note.id ? (
                  <div className="space-y-1">
                    <textarea
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={2}
                      className="w-full text-[10px] border border-amber-200 rounded px-1.5 py-1 bg-white focus:outline-none resize-none"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(note.id)} className="flex items-center gap-0.5 text-[9px] text-emerald-600 hover:text-emerald-700 font-semibold">
                        <Check className="w-2.5 h-2.5" /> Зберегти
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-[9px] text-gray-400 hover:text-gray-600 ml-1">
                        Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[10px] text-gray-700 whitespace-pre-wrap flex-1">{note.text}</p>
                    <div className="flex gap-1 flex-shrink-0 ml-1">
                      <button
                        onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                        className="text-gray-300 hover:text-navy-600 transition"
                        title="Редагувати"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-gray-300 hover:text-red-500 transition"
                        title="Видалити"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {addingNote && (
          <div className="space-y-1">
            <textarea
              autoFocus
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } if (e.key === "Escape") { setAddingNote(false); setNewNoteText(""); } }}
              placeholder="Текст нотатки..."
              rows={2}
              className="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none resize-none focus:border-amber-300"
            />
            <div className="flex gap-1.5">
              <button
                onClick={addNote}
                disabled={!newNoteText.trim()}
                className="flex items-center gap-0.5 text-[9px] bg-amber-400 text-navy-900 px-2 py-0.5 rounded font-semibold disabled:opacity-40 hover:bg-amber-500 transition"
              >
                <Check className="w-2.5 h-2.5" /> Додати
              </button>
              <button onClick={() => { setAddingNote(false); setNewNoteText(""); }} className="text-[9px] text-gray-400 hover:text-gray-600">
                Скасувати
              </button>
            </div>
          </div>
        )}

        {notes.length === 0 && !addingNote && (
          <p className="text-[9px] text-gray-300 italic">Немає нотаток</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <button onClick={onMoveLeft} disabled={!onMoveLeft} className="text-[10px] text-gray-400 hover:text-navy-700 disabled:opacity-20 transition px-1">
          ← Назад
        </button>
        <button onClick={onMoveRight} disabled={!onMoveRight} className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-navy-700 disabled:opacity-20 transition px-1">
          Далі <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function InquiryKanban({ initialCards, agents, role, currentUserId }: Props) {
  const [cards, setCards] = useState(initialCards);
  const [totalCount, setTotalCount] = useState(initialCards.length);
  const [filterAgent, setFilterAgent] = useState("");
  const [postMove, setPostMove] = useState<PostMoveState | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const dragCard = useRef<string | null>(null);
  const isAdmin = role === "ADMIN";

  const displayCards = filterAgent
    ? cards.filter(c => c.assignedUser?.id === filterAgent)
    : cards;

  function handleCreated(inq: any) {
    const newCard: InquiryCard = {
      id: inq.id, name: inq.name, phone: inq.phone, message: inq.message,
      notes: null, source: inq.source, funnelStage: inq.funnelStage ?? "NEW",
      deadline: inq.deadline ?? null, createdAt: inq.createdAt,
      assignedUser: inq.assignedUser ?? null, property: inq.property ?? null,
      seqNum: totalCount + 1,
    };
    setCards(prev => [newCard, ...prev]);
    setTotalCount(n => n + 1);
  }

  async function moveCard(id: string, newStage: string) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, funnelStage: newStage } : c));
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelStage: newStage }),
    });
    const stageName = FUNNEL_STAGES.find(s => s.id === newStage)?.label ?? newStage;
    setPostMove({ cardId: id, cardName: card.name, stageName, note: "", addTask: false, taskTitle: "", taskDue: "" });
  }

  async function savePostMove() {
    if (!postMove) return;
    setSaving(true);
    try {
      const { cardId, note, stageName, addTask, taskTitle, taskDue } = postMove;
      if (note.trim()) {
        const card = cards.find(c => c.id === cardId);
        if (card) {
          const existingNotes = parseNotes(card.notes);
          const entry: NoteEntry = {
            id: Date.now().toString(36),
            text: note.trim(),
            date: new Date().toLocaleDateString("uk-UA"),
            stage: stageName,
          };
          const updated = [...existingNotes, entry];
          const json = stringifyNotes(updated);
          await fetch(`/api/inquiries/${cardId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: json }),
          });
          setCards(prev => prev.map(c => c.id === cardId ? { ...c, notes: json } : c));
        }
      }
      if (addTask && taskTitle.trim()) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: taskTitle.trim(), dueAt: taskDue || null }),
        });
      }
    } finally {
      setSaving(false);
      setPostMove(null);
    }
  }

  async function assignCard(id: string, agentId: string | null) {
    const agent = agents.find(a => a.id === agentId) ?? null;
    setCards(prev => prev.map(c => c.id === id ? { ...c, assignedUser: agent } : c));
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedUserId: agentId }),
    });
  }

  async function setDeadline(id: string, date: string | null) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, deadline: date } : c));
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: date }),
    });
  }

  async function saveEdit() {
    if (!editState) return;
    setSaving(true);
    try {
      await fetch(`/api/inquiries/${editState.card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editState.message }),
      });
      setCards(prev => prev.map(c => c.id === editState.card.id
        ? { ...c, name: editState.name, phone: editState.phone || null, message: editState.message }
        : c));
      setEditState(null);
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(stageId: string) {
    if (dragCard.current) {
      const card = cards.find(c => c.id === dragCard.current);
      if (card && card.funnelStage !== stageId) moveCard(dragCard.current, stageId);
    }
    dragCard.current = null;
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-400">{displayCards.length} заявок</p>
          {agents.length > 0 && (
            <select
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
            >
              <option value="">Всі агенти</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
              ))}
            </select>
          )}
        </div>
        <AddLeadModal agents={agents} onCreated={handleCreated} />
      </div>

      {/* Columns */}
      <div className="flex gap-3 pb-4 overflow-x-auto" style={{ height: "calc(100vh - 220px)" }}>
        {FUNNEL_STAGES.map(stage => {
          const stageCards = displayCards.filter(c => c.funnelStage === stage.id);
          return (
            <div
              key={stage.id}
              className="flex-1 min-w-[170px] flex flex-col"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <span className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
                <span className="font-semibold text-sm text-navy-900">{stage.label}</span>
                <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{stageCards.length}</span>
              </div>
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {stageCards.map(card => {
                  const currentIdx = FUNNEL_STAGES.findIndex(s => s.id === card.funnelStage);
                  return (
                    <div key={card.id} draggable onDragStart={() => { dragCard.current = card.id; }}>
                      <Card
                        card={card}
                        agents={agents}
                        isAdmin={isAdmin}
                        onMoveLeft={currentIdx > 0 ? () => moveCard(card.id, FUNNEL_STAGES[currentIdx - 1].id) : undefined}
                        onMoveRight={currentIdx < FUNNEL_STAGES.length - 1 ? () => moveCard(card.id, FUNNEL_STAGES[currentIdx + 1].id) : undefined}
                        onAssign={agentId => assignCard(card.id, agentId)}
                        onSetDeadline={date => setDeadline(card.id, date)}
                        onEdit={() => setEditState({ card, name: card.name, phone: card.phone ?? "", message: card.message })}
                        onNotesChange={notes => setCards(prev => prev.map(c => c.id === card.id ? { ...c, notes } : c))}
                      />
                    </div>
                  );
                })}
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

      {/* Edit Modal */}
      {editState && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditState(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-navy-900">Редагувати заявку</h2>
              <button onClick={() => setEditState(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ім'я</label>
                <input
                  value={editState.name}
                  onChange={e => setEditState(p => p && ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Телефон</label>
                <input
                  value={editState.phone}
                  onChange={e => setEditState(p => p && ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Опис</label>
                <textarea
                  value={editState.message}
                  onChange={e => setEditState(p => p && ({ ...p, message: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditState(null)} className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                  Скасувати
                </button>
                <button onClick={saveEdit} disabled={saving} className="flex-1 px-4 py-2 text-sm font-semibold bg-navy-900 text-white rounded-xl hover:bg-navy-800 disabled:opacity-40">
                  {saving ? "..." : "Зберегти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-move Popup */}
      {postMove && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-navy-900 text-sm">{postMove.cardName}</p>
                <p className="text-xs text-gray-400">
                  Переміщено → <span className="font-semibold text-navy-700">{postMove.stageName}</span>
                </p>
              </div>
              <button onClick={() => setPostMove(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Нотатка — необов'язково
                </label>
                <textarea
                  value={postMove.note}
                  onChange={e => setPostMove(p => p && ({ ...p, note: e.target.value }))}
                  placeholder="Що оглядали, результат показу..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postMove.addTask}
                    onChange={e => setPostMove(p => p && ({ ...p, addTask: e.target.checked }))}
                    className="rounded"
                  />
                  Додати нове завдання
                </label>
                {postMove.addTask && (
                  <div className="space-y-2 pl-5 border-l-2 border-gray-100">
                    <input
                      value={postMove.taskTitle}
                      onChange={e => setPostMove(p => p && ({ ...p, taskTitle: e.target.value }))}
                      placeholder="Назва завдання..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
                    />
                    <input
                      type="date"
                      value={postMove.taskDue}
                      onChange={e => setPostMove(p => p && ({ ...p, taskDue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPostMove(null)} className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                  Пропустити
                </button>
                <button
                  onClick={savePostMove}
                  disabled={saving || (!postMove.note.trim() && (!postMove.addTask || !postMove.taskTitle.trim()))}
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-navy-900 text-white rounded-xl hover:bg-navy-800 disabled:opacity-40"
                >
                  {saving ? "..." : "Зберегти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
