import React, { useMemo, useState } from 'react';
import { Search, SquarePen, Megaphone, Users, FlaskConical, Globe, BellOff, Archive, MoreVertical, BellRing, Smile, Settings, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from './MessageItem.jsx';
import { shortStamp } from '../../../chat/format';
import { previewText, getState } from '../../../chat/chatStore';

const TABS = [
  ['all', 'Hammasi'],
  ['direct', 'Shaxsiy'],
  ['groups', 'Guruhlar'],
];

const TYPE_ICON = { ANNOUNCEMENT: Megaphone, GENERAL: Globe, LABORATORY: FlaskConical, GROUP: Users };

function RoomAvatar({ room }) {
  const Icon = TYPE_ICON[room.type];
  if (room.type === 'DIRECT') return <Avatar id={room.peer?.id} name={room.title} size="h-11 w-11" online={room.peer && getState().online.has(room.peer.id)} />;
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${room.type === 'ANNOUNCEMENT' ? 'bg-accent' : room.type === 'GENERAL' ? 'bg-primary' : room.type === 'LABORATORY' ? 'bg-secondary' : 'bg-emerald-600'}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

// Ovoz va brauzer bildirishnomalari endi profildagi "Bildirishnomalar" yorlig'ida.
function PrefsMenu({ me, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl">
        <Link to="/admin/mening-profilim?tab=bildirishnomalar" className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-bg-light">
          <BellRing className="h-4 w-4" /> Bildirishnoma sozlamalari
        </Link>
        {me.role === 'SUPER_ADMIN' && (
          <>
            <div className="my-1 border-t border-border" />
            <Link to="/admin/stikerlar" className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-bg-light">
              <Smile className="h-4 w-4" /> Stikerlar
            </Link>
            <Link to="/admin/chat-sozlamalari" className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-bg-light">
              <Settings className="h-4 w-4" /> Chat sozlamalari
            </Link>
          </>
        )}
      </div>
    </>
  );
}

export default function RoomList({ rooms, activeId, me, loading, onSelect, onNew, onSearch, typingByRoom, toast }) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [menu, setMenu] = useState(false);

  const list = useMemo(() => {
    const text = q.trim().toLowerCase();
    return rooms.filter((r) => {
      if (tab === 'direct' && r.type !== 'DIRECT') return false;
      if (tab === 'groups' && r.type === 'DIRECT') return false;
      return !text || r.title.toLowerCase().includes(text);
    });
  }, [rooms, q, tab]);

  const unreadOf = (type) => rooms.filter((r) => (type === 'direct' ? r.type === 'DIRECT' : type === 'groups' ? r.type !== 'DIRECT' : true) && !r.muted).reduce((s, r) => s + r.unread, 0);

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-white md:w-80 lg:w-96">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <h1 className="flex-1 text-lg font-bold text-ink">Chat</h1>
        <button type="button" onClick={onSearch} className="rounded-full p-2 text-slate-500 hover:bg-bg-light hover:text-primary" title="Xabarlarni qidirish">
          <MessageSquareText className="h-5 w-5" />
        </button>
        <button type="button" onClick={onNew} className="rounded-full p-2 text-slate-500 hover:bg-bg-light hover:text-primary" title="Yangi suhbat">
          <SquarePen className="h-5 w-5" />
        </button>
        <div className="relative">
          <button type="button" onClick={() => setMenu((v) => !v)} className="rounded-full p-2 text-slate-500 hover:bg-bg-light hover:text-primary" title="Sozlamalar">
            <MoreVertical className="h-5 w-5" />
          </button>
          {menu && <PrefsMenu me={me} onClose={() => setMenu(false)} />}
        </div>
      </div>
      <div className="px-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suhbatlarni qidirish" className="input-field !rounded-full !py-2 !pl-9" />
        </div>
        <div className="mt-2 flex gap-1">
          {TABS.map(([k, label]) => {
            const n = unreadOf(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tab === k ? 'bg-primary text-white' : 'text-slate-600 hover:bg-bg-light'}`}
              >
                {label}
                {n > 0 && <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === k ? 'bg-white text-primary' : 'bg-primary text-white'}`}>{n > 99 ? '99+' : n}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {loading && rooms.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Yuklanmoqda…</p>}
        {!loading && list.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Suhbat topilmadi.</p>}
        {list.map((r) => {
          const typing = typingByRoom[r.id];
          const lm = r.lastMessage;
          const preview = typing
            ? `${typing} yozmoqda…`
            : lm
              ? `${lm.senderId === me.id ? 'Siz: ' : r.type !== 'DIRECT' && lm.type !== 'SYSTEM' && lm.senderName ? `${lm.senderName.split(' ')[0]}: ` : ''}${previewText(lm)}`
              : r.type === 'DIRECT'
                ? 'Suhbatni boshlang'
                : '';
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${activeId === r.id ? 'bg-primary/10' : 'hover:bg-bg-light'}`}
            >
              <RoomAvatar room={r} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1">
                  <span className="truncate text-sm font-semibold text-ink">{r.title}</span>
                  {r.muted && <BellOff className="h-3 w-3 shrink-0 text-slate-400" />}
                  {r.isArchived && <Archive className="h-3 w-3 shrink-0 text-slate-400" />}
                  <span className="ml-auto shrink-0 pl-2 text-[11px] text-slate-400">{shortStamp(lm?.createdAt)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className={`min-w-0 flex-1 truncate text-xs ${typing ? 'text-primary' : 'text-slate-500'}`}>{preview}</span>
                  {r.unread > 0 && (
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${r.muted ? 'bg-slate-400' : 'bg-primary'}`}>{r.unread > 99 ? '99+' : r.unread}</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
