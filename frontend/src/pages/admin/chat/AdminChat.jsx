import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, WifiOff, Ban } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import chatApi from '../../../chat/chatApi';
import * as store from '../../../chat/chatStore';
import RoomList from './RoomList.jsx';
import Conversation from './Conversation.jsx';
import { NewChatDialog, SearchDialog } from './Dialogs.jsx';
import { tr } from '../../../i18n/tr.js';

// Ichki chat: chapda xonalar, o'ngda suhbat. Mobil ekranda bittadan panel.
export default function AdminChat() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('room');
  const jumpTo = params.get('msg');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState(null);
  const [packs, setPacks] = useState([]);
  const [status, setStatus] = useState(store.getState().status);
  const [dialog, setDialog] = useState(null);
  const [typingByRoom, setTypingByRoom] = useState({});
  const reloadTimer = useRef(null);

  const toast = useCallback((msg, type = 'info') => showToast(msg, type), [showToast]);

  const loadRooms = useCallback(() => {
    chatApi
      .rooms()
      .then((r) => {
        setRooms(r.items);
        store.setRoomMeta(r.items);
      })
      .catch((err) => {
        if (err?.response?.data?.code === 'CHAT_DISABLED') setStatus('disabled');
      })
      .finally(() => setLoading(false));
  }, []);

  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(loadRooms, 400);
  }, [loadRooms]);

  useEffect(() => {
    store.start(user);
    store.loadOutbox();
    loadRooms();
    chatApi.settings().then(setLimits).catch(() => {});
    chatApi
      .stickers()
      .then((r) => setPacks(r.items))
      .catch(() => {});
    const typingTimers = {};
    const offs = [
      store.on('status', setStatus),
      store.on('message:new', scheduleReload),
      store.on('message:deleted', scheduleReload),
      store.on('room:updated', scheduleReload),
      store.on('unread', scheduleReload),
      store.on('reconnected', scheduleReload),
      store.on('presence', () => setRooms((r) => [...r])),
      store.on('typing', (d) => {
        if (d.userId === user.id) return;
        clearTimeout(typingTimers[d.roomId]);
        setTypingByRoom((t) => ({ ...t, [d.roomId]: d.typing ? d.fullName.split(' ')[0] : undefined }));
        if (d.typing) typingTimers[d.roomId] = setTimeout(() => setTypingByRoom((t) => ({ ...t, [d.roomId]: undefined })), 5000);
      }),
      store.on('open-room', (roomId) => setParams({ room: roomId })),
    ];
    return () => {
      offs.forEach((off) => off());
      clearTimeout(reloadTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roomsById = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r])), [rooms]);
  const stickerMap = useMemo(() => new Map(packs.flatMap((p) => p.stickers.map((s) => [s.id, s]))), [packs]);
  const active = activeId ? roomsById[activeId] : null;

  const select = useCallback((id, msg) => setParams(msg ? { room: id, msg } : { room: id }), [setParams]);
  const back = useCallback(() => setParams({}), [setParams]);
  const onLeft = useCallback(() => {
    setParams({});
    loadRooms();
  }, [setParams, loadRooms]);

  // Ro'yxatda yo'q xona (masalan, yangi ochilgan) — ro'yxatni yangilash.
  useEffect(() => {
    if (activeId && !loading && !roomsById[activeId]) loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, loading]);

  if (status === 'disabled') {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
        <Ban className="h-10 w-10 text-slate-400" />
        <h1 className="text-lg font-bold text-ink">{tr('Chat mavjud emas')}</h1>
        <p className="max-w-md text-sm text-slate-500">{tr("Siz uchun chat o'chirilgan yoki vaqtincha yopilgan. Savollar bo'lsa, administratorga murojaat qiling.")}</p>
      </div>
    );
  }

  return (
    <div className="-m-5 flex h-[calc(100dvh-4rem)] overflow-hidden bg-white lg:-m-8">
      <div className={`${active ? 'hidden md:flex' : 'flex'} h-full w-full md:w-auto`}>
        <RoomList
          rooms={rooms}
          activeId={activeId}
          me={user}
          loading={loading}
          typingByRoom={typingByRoom}
          toast={toast}
          onSelect={(id) => select(id)}
          onNew={() => setDialog('new')}
          onSearch={() => setDialog('search')}
        />
      </div>
      <div className={`${active ? 'flex' : 'hidden md:flex'} relative h-full min-w-0 flex-1`}>
        {status === 'offline' && (
          <div className="absolute left-1/2 top-16 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 shadow">
            <WifiOff className="h-3.5 w-3.5" /> {tr('Ulanish tiklanmoqda…')}
          </div>
        )}
        {active ? (
          <Conversation
            key={active.id}
            room={active}
            me={user}
            limits={limits}
            stickerPacks={packs}
            stickerMap={stickerMap}
            rooms={rooms}
            jumpTo={jumpTo}
            onBack={back}
            onLeft={onLeft}
            onRoomsChanged={scheduleReload}
            onOpenRoom={select}
            toast={toast}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#eef2f6] text-center text-slate-500">
            <MessageCircle className="h-12 w-12 text-primary/40" />
            <p className="text-sm">{tr('Suhbatni tanlang yoki yangisini boshlang.')}</p>
          </div>
        )}
      </div>

      {dialog === 'new' && (
        <NewChatDialog
          canCreateGroups={limits?.canCreateGroups}
          onClose={() => setDialog(null)}
          onError={(e) => toast(e, 'error')}
          onOpened={(room) => {
            setDialog(null);
            setRooms((list) => (list.some((r) => r.id === room.id) ? list : [room, ...list]));
            select(room.id);
            scheduleReload();
          }}
        />
      )}
      {dialog === 'search' && (
        <SearchDialog
          roomsById={roomsById}
          onClose={() => setDialog(null)}
          onOpen={(rid, mid) => {
            setDialog(null);
            select(rid, mid);
          }}
        />
      )}
    </div>
  );
}
