import React, { useEffect, useMemo, useState } from 'react';
import { Search, Check, Crown, Shield, UserMinus, UserPlus, LogOut, Archive, BellOff, Bell, Loader2, PinOff, Pencil } from 'lucide-react';
import { Modal } from '../../../components/Modal.jsx';
import chatApi, { apiError } from '../../../chat/chatApi';
import { getState, previewText } from '../../../chat/chatStore';
import { Avatar } from './MessageItem.jsx';
import { lastSeenText, formatTime, dayLabel } from '../../../chat/format';
import { roleLabel } from '../../../utils/roles';

const ROOM_ROLE = { OWNER: 'Egasi', ADMIN: 'Administrator', MEMBER: "A'zo" };

function UserPicker({ selected, onToggle, exclude = [], single, onPickSingle }) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState(null);
  useEffect(() => {
    chatApi
      .users()
      .then((r) => setUsers(r.items))
      .catch(() => setUsers([]));
  }, []);
  const list = useMemo(
    () => (users || []).filter((u) => !exclude.includes(u.id) && (!q || u.fullName.toLowerCase().includes(q.toLowerCase()) || (u.laboratoryName || '').toLowerCase().includes(q.toLowerCase()))),
    [users, q, exclude]
  );
  const online = getState().online;
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism yoki laboratoriya" className="input-field !pl-9" autoFocus />
      </div>
      <div className="mt-2 max-h-[45vh] divide-y divide-border overflow-y-auto">
        {!users && (
          <div className="flex justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {users && list.length === 0 && <p className="p-4 text-center text-sm text-slate-400">Hech kim topilmadi.</p>}
        {list.map((u) => {
          const on = selected?.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => (single ? onPickSingle(u) : onToggle(u.id))}
              className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-bg-light"
            >
              <Avatar id={u.id} name={u.fullName} online={online.has(u.id)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{u.fullName}</span>
                <span className="block truncate text-xs text-slate-500">{[u.position || roleLabel(u.role), u.laboratoryName].filter(Boolean).join(' · ')}</span>
              </span>
              {!single && (
                <span className={`flex h-5 w-5 items-center justify-center rounded border ${on ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NewChatDialog({ canCreateGroups, onClose, onOpened, onError }) {
  const [tab, setTab] = useState('direct');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const run = async (fn) => {
    setBusy(true);
    try {
      onOpened(await fn());
    } catch (err) {
      onError(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title="Yangi suhbat" size="md">
      {canCreateGroups && (
        <div className="mb-3 flex gap-1 rounded-lg bg-bg-light p-1">
          {[
            ['direct', 'Shaxsiy xabar'],
            ['group', 'Guruh yaratish'],
          ].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 rounded-md py-1.5 text-sm font-medium ${tab === k ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
              {l}
            </button>
          ))}
        </div>
      )}
      {tab === 'direct' ? (
        <UserPicker single onPickSingle={(u) => !busy && run(() => chatApi.openDirect(u.id))} />
      ) : (
        <>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Guruh nomi" className="input-field mb-3" />
          <UserPicker selected={selected} onToggle={toggle} />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Tanlandi: {selected.length}</span>
            <button type="button" disabled={busy || title.trim().length < 2} onClick={() => run(() => chatApi.createGroup(title.trim(), selected))} className="btn-primary !py-2">
              Yaratish
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

const MUTE_OPTIONS = [
  ['1 soat', { minutes: 60 }],
  ['8 soat', { minutes: 480 }],
  ['1 kun', { minutes: 1440 }],
  ['Doimiy', { forever: true }],
];

export function RoomSettingsDialog({ room, meId, onClose, onChanged, onLeft, onError }) {
  const [detail, setDetail] = useState(room);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState([]);
  const [title, setTitle] = useState(room.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const online = getState().online;
  const isGroup = room.type === 'GROUP';
  const manage = detail.canManage;
  const owner = detail.myRole === 'OWNER';

  const run = async (fn) => {
    try {
      const r = await fn();
      if (r && r.members) setDetail(r);
      onChanged?.();
      return r;
    } catch (err) {
      onError(apiError(err));
      return null;
    }
  };
  const reload = () => run(() => chatApi.room(room.id));

  return (
    <Modal open onClose={onClose} title={isGroup ? "Guruh ma'lumotlari" : "Xona ma'lumotlari"} size="md">
      <div className="mb-4 flex items-center gap-3">
        <Avatar id={detail.id} name={detail.title} size="h-12 w-12" />
        {editingTitle ? (
          <form
            className="flex flex-1 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => chatApi.renameGroup(room.id, title))) setEditingTitle(false);
            }}
          >
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="input-field !py-1.5" autoFocus />
            <button className="btn-primary !px-3 !py-1.5">Saqlash</button>
          </form>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-semibold text-ink">
              {detail.title}
              {isGroup && manage && (
                <button type="button" onClick={() => setEditingTitle(true)} className="text-slate-400 hover:text-primary" title="Nomini o'zgartirish">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </p>
            <p className="text-xs text-slate-500">{detail.memberCount} a'zo{detail.isArchived ? ' · arxivlangan' : ''}</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">Bildirishnomalar</p>
        <div className="flex flex-wrap gap-1.5">
          {detail.muted ? (
            <button type="button" onClick={() => run(() => chatApi.mute(room.id, { minutes: 0 })).then(reload)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-light">
              <Bell className="h-4 w-4" /> Ovozni yoqish
            </button>
          ) : (
            MUTE_OPTIONS.map(([label, body]) => (
              <button key={label} type="button" onClick={() => run(() => chatApi.mute(room.id, body)).then(reload)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-light">
                <BellOff className="h-3.5 w-3.5" /> {label}
              </button>
            ))
          )}
        </div>
      </div>

      {adding ? (
        <div>
          <UserPicker selected={picked} onToggle={(id) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} exclude={detail.members.map((m) => m.id)} />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="btn-secondary !py-2">
              Bekor qilish
            </button>
            <button
              type="button"
              disabled={!picked.length}
              onClick={async () => {
                if (await run(() => chatApi.addMembers(room.id, picked))) {
                  setAdding(false);
                  setPicked([]);
                }
              }}
              className="btn-primary !py-2"
            >
              Qo'shish ({picked.length})
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-slate-400">A'zolar</p>
            {isGroup && manage && (
              <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <UserPlus className="h-4 w-4" /> Qo'shish
              </button>
            )}
          </div>
          <div className="max-h-[40vh] divide-y divide-border overflow-y-auto">
            {detail.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <Avatar id={m.id} name={m.fullName} online={online.has(m.id)} size="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {m.fullName} {m.id === meId && <span className="text-xs text-slate-400">(siz)</span>}
                  </p>
                  <p className="text-xs text-slate-500">{m.active ? lastSeenText(online.has(m.id), m.lastSeenAt) : 'faol emas'}</p>
                </div>
                {isGroup && m.role !== 'MEMBER' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    {m.role === 'OWNER' ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />} {ROOM_ROLE[m.role]}
                  </span>
                )}
                {isGroup && owner && m.role !== 'OWNER' && (
                  <button
                    type="button"
                    onClick={() => run(() => chatApi.setMemberRole(room.id, m.id, m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'))}
                    className="rounded p-1 text-slate-400 hover:text-primary"
                    title={m.role === 'ADMIN' ? 'Administratorlikdan olish' : 'Administrator qilish'}
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                )}
                {isGroup && manage && m.id !== meId && m.role !== 'OWNER' && (owner || m.role === 'MEMBER') && (
                  <button type="button" onClick={() => run(() => chatApi.removeMember(room.id, m.id))} className="rounded p-1 text-slate-400 hover:text-red-600" title="Guruhdan chiqarish">
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isGroup && !adding && (
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {(owner || detail.myRole === 'ADMIN') && (
            <button type="button" onClick={() => run(() => chatApi.archive(room.id, !detail.isArchived))} className="btn-secondary !py-2">
              <Archive className="h-4 w-4" /> {detail.isArchived ? 'Arxivdan chiqarish' : 'Arxivlash'}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              try {
                await chatApi.leave(room.id);
                onLeft();
              } catch (err) {
                onError(apiError(err));
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" /> Guruhdan chiqish
          </button>
        </div>
      )}
    </Modal>
  );
}

export function ForwardDialog({ message, rooms, onClose, onDone, onError }) {
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const list = rooms.filter((r) => r.canWrite && (!q || r.title.toLowerCase().includes(q.toLowerCase())));
  return (
    <Modal open onClose={onClose} title="Ulashish" size="md">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Xona qidirish" className="input-field mb-2" autoFocus />
      <div className="max-h-[50vh] divide-y divide-border overflow-y-auto">
        {list.map((r) => {
          const on = selected.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected((s) => (on ? s.filter((x) => x !== r.id) : s.length >= 10 ? s : [...s, r.id]))}
              className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-bg-light"
            >
              <Avatar id={r.peer?.id || r.id} name={r.title} size="h-8 w-8" />
              <span className="flex-1 truncate text-sm text-ink">{r.title}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded border ${on ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={!selected.length || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await chatApi.forward(message.id, selected);
              onDone(selected.length);
            } catch (err) {
              onError(apiError(err));
            } finally {
              setBusy(false);
            }
          }}
          className="btn-primary !py-2"
        >
          Yuborish ({selected.length})
        </button>
      </div>
    </Modal>
  );
}

export function MessageInfoDialog({ message, room, members, onClose }) {
  const readers = members.filter((m) => m.id !== message.senderId && m.lastReadAt && new Date(m.lastReadAt) >= new Date(message.createdAt));
  const notYet = members.filter((m) => m.id !== message.senderId && !readers.includes(m));
  return (
    <Modal open onClose={onClose} title="Xabar ma'lumoti" size="sm">
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Yuborildi</dt>
          <dd className="text-ink">{dayLabel(message.createdAt)}, {formatTime(message.createdAt)}</dd>
        </div>
        {message.editedAt && (
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Tahrirlandi</dt>
            <dd className="text-ink">{dayLabel(message.editedAt)}, {formatTime(message.editedAt)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Yuboruvchi</dt>
          <dd className="text-ink">{message.sender?.fullName}</dd>
        </div>
      </dl>
      {room.type !== 'ANNOUNCEMENT' || members.length < 200 ? (
        <>
          <p className="mb-1 mt-4 text-xs font-semibold uppercase text-slate-400">Ko'rdi ({readers.length})</p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {readers.map((m) => (
              <p key={m.id} className="flex items-center gap-2 text-sm text-ink">
                <Avatar id={m.id} name={m.fullName} size="h-6 w-6" /> {m.fullName}
              </p>
            ))}
            {readers.length === 0 && <p className="text-sm text-slate-400">Hali hech kim.</p>}
          </div>
          {notYet.length > 0 && room.type !== 'DIRECT' && <p className="mt-3 text-xs text-slate-500">Ko'rmagan: {notYet.length}</p>}
        </>
      ) : null}
    </Modal>
  );
}

export function PinnedDialog({ pins, canUnpin, onJump, onUnpin, onClose }) {
  return (
    <Modal open onClose={onClose} title={`Qadalgan xabarlar (${pins.length})`} size="md">
      {pins.length === 0 && <p className="text-sm text-slate-400">Qadalgan xabar yo'q.</p>}
      <div className="divide-y divide-border">
        {pins.map((p) => (
          <div key={p.message.id} className="flex items-start gap-3 py-2">
            <button type="button" onClick={() => onJump(p.message.id)} className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-primary">{p.message.sender?.fullName}</p>
              <p className="line-clamp-2 text-sm text-ink">{previewText(p.message)}</p>
            </button>
            {canUnpin && (
              <button type="button" onClick={() => onUnpin(p.message.id)} className="rounded p-1 text-slate-400 hover:text-red-600" title="Olib tashlash">
                <PinOff className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function DeleteDialog({ message, canDeleteForAll, onClose, onDelete }) {
  return (
    <Modal open onClose={onClose} title="Xabarni o'chirish" size="sm">
      <p className="text-sm text-slate-600">
        {canDeleteForAll ? "Xabarni kim uchun o'chirasiz?" : "Hamma uchun o'chirish muddati o'tgan yoki ruxsat yo'q. Xabar faqat sizdan yashiriladi."}
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary !py-2">
          Bekor qilish
        </button>
        <button type="button" onClick={() => onDelete(message, 'me')} className="btn-secondary !py-2">
          Faqat men uchun
        </button>
        {canDeleteForAll && (
          <button type="button" onClick={() => onDelete(message, 'all')} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Hamma uchun
          </button>
        )}
      </div>
    </Modal>
  );
}

// Xabarlar bo'yicha qidiruv (barcha xonalar yoki bitta xona).
export function SearchDialog({ roomId, roomsById, onClose, onOpen }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const run = async (offset = 0) => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const r = await chatApi.search({ q: q.trim(), roomId, offset });
      setRes((prev) => (offset && prev ? { ...r, items: [...prev.items, ...r.items] } : r));
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={roomId ? 'Shu suhbatda qidirish' : 'Xabarlarni qidirish'} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(0);
        }}
        className="flex gap-2"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kamida 2 ta belgi" className="input-field" autoFocus />
        <button className="btn-primary !px-4 !py-2" disabled={loading}>
          <Search className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 max-h-[55vh] divide-y divide-border overflow-y-auto">
        {res?.items.length === 0 && <p className="p-4 text-center text-sm text-slate-400">Hech narsa topilmadi.</p>}
        {res?.items.map((m) => (
          <button key={m.id} type="button" onClick={() => onOpen(m.roomId, m.id)} className="block w-full px-2 py-2 text-left hover:bg-bg-light">
            <p className="flex justify-between gap-2 text-xs text-slate-500">
              <span className="truncate font-semibold text-primary">
                {!roomId && roomsById[m.roomId] ? `${roomsById[m.roomId].title} · ` : ''}
                {m.sender?.fullName}
              </span>
              <span className="shrink-0">{dayLabel(m.createdAt)} {formatTime(m.createdAt)}</span>
            </p>
            <p className="line-clamp-2 text-sm text-ink">{previewText(m) || m.attachments?.[0]?.name}</p>
          </button>
        ))}
      </div>
      {res?.hasMore && (
        <button type="button" onClick={() => run(res.nextOffset)} disabled={loading} className="mt-2 w-full text-sm font-medium text-primary hover:underline">
          Yana ko'rsatish
        </button>
      )}
    </Modal>
  );
}
