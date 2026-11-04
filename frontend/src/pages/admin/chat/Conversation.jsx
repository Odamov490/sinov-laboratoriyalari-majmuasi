import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowDown, Search, Pin, Info, BellOff, Loader2, X, RotateCw, Upload, Paperclip } from 'lucide-react';
import chatApi, { apiError } from '../../../chat/chatApi';
import * as store from '../../../chat/chatStore';
import { prepareImage, prepareVideo, videoThumbFromBlob } from '../../../chat/media';
import { dayLabel, sameDay, lastSeenText, formatSize } from '../../../chat/format';
import MessageItem, { Avatar } from './MessageItem.jsx';
import Composer, { AttachDialog, limitFor } from './Composer.jsx';
import { Lightbox } from './Attachments.jsx';
import { EmojiPicker, pushRecentSticker } from './Pickers.jsx';
import { ForwardDialog, MessageInfoDialog, PinnedDialog, DeleteDialog, SearchDialog, RoomSettingsDialog } from './Dialogs.jsx';
import TaskModal from '../../../components/admin/TaskModal.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { tr } from '../../../i18n/tr.js';

const PAGE = 40;
const EDITABLE = ['TEXT', 'IMAGE', 'VIDEO', 'FILE'];
const ANNOUNCERS = ['SUPER_ADMIN', 'MANAGER'];
const minutesSince = (d) => (Date.now() - new Date(d).getTime()) / 60000;
const GROUP_GAP_MS = 5 * 60 * 1000;

function upsert(list, msg) {
  const i = list.findIndex((m) => m.id === msg.id);
  if (i === -1) return [...list, msg];
  const next = list.slice();
  next[i] = msg;
  return next;
}

export default function Conversation({ room, me, limits, stickerPacks, stickerMap, rooms, jumpTo, onBack, onRoomsChanged, onOpenRoom, onLeft, toast }) {
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [hasNewer, setHasNewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState(null);
  const [pins, setPins] = useState([]);
  const [typing, setTyping] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [, setTick] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const [newBelow, setNewBelow] = useState(0);
  const [highlight, setHighlight] = useState(null);
  const [dialog, setDialog] = useState(null); // { kind, message? }
  const [attachFiles, setAttachFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const scroller = useRef(null);
  const restore = useRef(null);
  const stick = useRef(true);
  const unreadAnchor = useRef(room.lastReadAt || room.joinedAt);
  const firstUnreadId = useRef(null);
  const aborts = useRef(new Map());
  const roomId = room.id;

  const members = detail?.members || [];
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const isDirect = room.type === 'DIRECT';
  const peer = detail?.peer || room.peer;

  // ---------------- yuklash ----------------
  const loadDetail = useCallback(() => {
    chatApi
      .room(roomId)
      .then(setDetail)
      .catch((err) => {
        if (err?.response?.status === 404) onLeft?.();
      });
    chatApi
      .pins(roomId)
      .then((r) => setPins(r.items))
      .catch(() => {});
  }, [roomId, onLeft]);

  const scrollToBottom = (smooth) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const flash = (id) => {
    setHighlight(id);
    setTimeout(() => setHighlight((h) => (h === id ? null : h)), 2000);
  };

  const scrollToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    flash(id);
    return true;
  };

  const loadLatest = useCallback(async () => {
    const r = await chatApi.messages(roomId, { limit: PAGE });
    store.rememberUrls(r.items.flatMap((m) => m.attachments || []));
    setMessages(r.items);
    setHasMore(r.hasMore);
    setHasNewer(false);
    return r.items;
  }, [roomId]);

  const jump = useCallback(
    async (id) => {
      if (scrollToMessage(id)) return;
      try {
        const r = await chatApi.messages(roomId, { around: id, limit: PAGE });
        store.rememberUrls(r.items.flatMap((m) => m.attachments || []));
        stick.current = false;
        setMessages(r.items);
        setHasMore(r.hasMore);
        setHasNewer(r.hasNewer);
        setTimeout(() => scrollToMessage(id), 50);
      } catch {
        toast(tr('Xabar topilmadi.'), 'error');
      }
    },
    [roomId, toast]
  );

  useEffect(() => {
    let alive = true;
    store.setActiveRoom(roomId);
    unreadAnchor.current = room.lastReadAt || room.joinedAt;
    setLoading(true);
    setError(null);
    setMessages([]);
    setReplyTo(null);
    setEditing(null);
    setTyping({});
    setNewBelow(0);
    setDetail(null);
    loadDetail();
    const first = jumpTo
      ? chatApi.messages(roomId, { around: jumpTo, limit: PAGE }).then((r) => {
          store.rememberUrls(r.items.flatMap((m) => m.attachments || []));
          setMessages(r.items);
          setHasMore(r.hasMore);
          setHasNewer(r.hasNewer);
          return r.items;
        })
      : loadLatest();
    first
      .then((items) => {
        if (!alive) return;
        const anchor = unreadAnchor.current ? new Date(unreadAnchor.current) : null;
        const fu = items.find((m) => m.senderId !== me.id && m.type !== 'SYSTEM' && (!anchor || new Date(m.createdAt) > anchor));
        firstUnreadId.current = room.unread > 0 && fu ? fu.id : null;
        setLoading(false);
        requestAnimationFrame(() => {
          if (jumpTo) {
            stick.current = false;
            scrollToMessage(jumpTo);
          } else if (firstUnreadId.current) {
            document.getElementById('chat-unread-divider')?.scrollIntoView({ block: 'start' });
            const el = scroller.current;
            stick.current = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 80 : true;
          } else {
            stick.current = true;
            scrollToBottom();
          }
          onScroll();
        });
      })
      .catch((err) => {
        if (!alive) return;
        setError(apiError(err));
        setLoading(false);
      });
    return () => {
      alive = false;
      store.setActiveRoom(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, jumpTo]);

  // Yuqoriga yuklashda ko'rinish joyida qoladi.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (restore.current !== null) {
      el.scrollTop = el.scrollHeight - restore.current;
      restore.current = null;
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  });

  const loadOlder = async () => {
    if (loadingOlder || !hasMore || !messages.length) return;
    setLoadingOlder(true);
    try {
      const r = await chatApi.messages(roomId, { before: messages[0].id, limit: PAGE });
      store.rememberUrls(r.items.flatMap((m) => m.attachments || []));
      const el = scroller.current;
      restore.current = el ? el.scrollHeight - el.scrollTop : null;
      setMessages((prev) => [...r.items.filter((m) => !prev.some((p) => p.id === m.id)), ...prev]);
      setHasMore(r.hasMore);
    } catch {
      /* keyingi aylantirishda qayta urinadi */
    } finally {
      setLoadingOlder(false);
    }
  };

  const loadNewer = async () => {
    if (!hasNewer || !messages.length || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const r = await chatApi.messages(roomId, { after: messages[messages.length - 1].id, limit: PAGE });
      store.rememberUrls(r.items.flatMap((m) => m.attachments || []));
      setMessages((prev) => [...prev, ...r.items.filter((m) => !prev.some((p) => p.id === m.id))]);
      setHasNewer(r.hasNewer);
    } finally {
      setLoadingOlder(false);
    }
  };

  // ---------------- o'qildi ----------------
  const lastServer = useMemo(() => [...messages].reverse().find((m) => !m.pending), [messages]);
  useEffect(() => {
    if (!atBottom || hasNewer || !lastServer || document.visibilityState !== 'visible') return;
    store.markRead(roomId, lastServer.id);
    setNewBelow(0);
  }, [atBottom, hasNewer, lastServer, roomId]);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && atBottom && lastServer && !hasNewer) store.markRead(roomId, lastServer.id);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [atBottom, lastServer, hasNewer, roomId]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const bottomGap = el.scrollHeight - el.scrollTop - el.clientHeight;
    const bottom = bottomGap < 80;
    stick.current = bottom && !hasNewer;
    setAtBottom(bottom);
    if (el.scrollTop < 200) loadOlder();
    if (bottomGap < 200 && hasNewer) loadNewer();
  }

  // ---------------- real vaqt hodisalari ----------------
  useEffect(() => {
    const offs = [
      store.on('message:new', (m) => {
        if (m.roomId !== roomId) return;
        if (hasNewer) {
          if (m.senderId !== me.id) setNewBelow((n) => n + 1);
          return;
        }
        setMessages((prev) => upsert(prev, m));
        setTyping((t) => {
          if (!t[m.senderId]) return t;
          const next = { ...t };
          delete next[m.senderId];
          return next;
        });
        if (!stick.current && m.senderId !== me.id) setNewBelow((n) => n + 1);
        if (m.type === 'SYSTEM') loadDetail();
      }),
      store.on('message:updated', (m) => m.roomId === roomId && setMessages((prev) => (prev.some((p) => p.id === m.id) ? upsert(prev, { ...m, attachments: prev.find((p) => p.id === m.id).attachments }) : prev))),
      store.on('message:deleted', (d) => {
        if (d.roomId !== roomId) return;
        setMessages((prev) =>
          d.forMe
            ? prev.filter((m) => m.id !== d.messageId)
            : prev.map((m) => (m.id === d.messageId ? { ...m, deletedAt: new Date().toISOString(), body: null, attachments: [], reactions: [], meta: null } : m))
        );
        setPins((p) => p.filter((x) => x.message.id !== d.messageId));
      }),
      store.on('reaction:updated', (d) => d.roomId === roomId && setMessages((prev) => prev.map((m) => (m.id === d.messageId ? { ...m, reactions: d.reactions } : m)))),
      store.on('room:read-by', (d) => {
        if (d.roomId !== roomId) return;
        setDetail((det) => (det ? { ...det, members: det.members.map((m) => (m.id === d.userId ? { ...m, lastReadAt: d.readAt, lastReadMessageId: d.messageId } : m)) } : det));
      }),
      store.on('typing', (d) => {
        if (d.roomId !== roomId || d.userId === me.id) return;
        setTyping((t) => {
          const next = { ...t };
          if (d.typing) next[d.userId] = { name: d.fullName, until: Date.now() + 5000 };
          else delete next[d.userId];
          return next;
        });
      }),
      store.on('room:updated', (d) => {
        if (d.roomId === roomId) loadDetail();
      }),
      store.on('presence', () => setTick((t) => t + 1)),
      store.on('outbox', () => setTick((t) => t + 1)),
      // Uzilishdan keyin: o'tkazib yuborilgan xabarlar.
      store.on('reconnected', () => {
        setMessages((prev) => {
          const last = [...prev].reverse().find((m) => !m.pending);
          if (last && !hasNewer) {
            chatApi
              .messages(roomId, { after: last.id, limit: 100 })
              .then((r) => {
                store.rememberUrls(r.items.flatMap((m) => m.attachments || []));
                setMessages((cur) => r.items.reduce((acc, m) => upsert(acc, m), cur));
                if (r.hasNewer) setHasNewer(true);
              })
              .catch(() => {});
          }
          return prev;
        });
        loadDetail();
      }),
    ];
    const timer = setInterval(() => {
      setTyping((t) => {
        const now = Date.now();
        const live = Object.fromEntries(Object.entries(t).filter(([, v]) => v.until > now));
        return Object.keys(live).length === Object.keys(t).length ? t : live;
      });
    }, 1500);
    return () => {
      offs.forEach((off) => off());
      clearInterval(timer);
    };
  }, [roomId, me.id, hasNewer, loadDetail]);

  // ---------------- yuborish ----------------
  const sendPayload = (payload) => {
    stick.current = true;
    store.sendMessage({ roomId, clientId: store.newClientId(), ...payload }).then((msg) => {
      if (msg) setMessages((prev) => upsert(prev, msg));
      onRoomsChanged();
    });
    setReplyTo(null);
    setTimeout(() => scrollToBottom(true), 30);
  };

  const sendText = (body, mentions) => sendPayload({ type: 'TEXT', body, replyToId: replyTo?.id, mentions });
  const sendSticker = (s) => {
    pushRecentSticker(s.id);
    sendPayload({ type: 'STICKER', meta: { stickerId: s.id }, replyToId: replyTo?.id });
  };

  const saveEdit = async (body) => {
    const m = editing;
    setEditing(null);
    try {
      const r = await store.editMessage(m.id, body);
      if (r.message) setMessages((prev) => upsert(prev, { ...r.message, attachments: m.attachments }));
    } catch (err) {
      toast(err.error || tr("Tahrirlab bo'lmadi."), 'error');
    }
  };

  // Media: yuklash (progress, bekor qilish, qayta urinish) -> xabar.
  const runUpload = async (item) => {
    const update = (patch) => setUploads((list) => list.map((u) => (u.id === item.id ? { ...u, ...patch } : u)));
    update({ status: 'uploading', error: null });
    const ids = [...(item.done || [])];
    try {
      for (let i = ids.length; i < item.files.length; i += 1) {
        const entry = item.files[i];
        let file = entry.file;
        const form = new FormData();
        let thumb = entry.thumb || null;
        if (entry.prepare === 'image') {
          const p = await prepareImage(file).catch(() => ({ file }));
          file = p.file;
          thumb = p.thumb;
          if (p.width) form.append('width', p.width);
          if (p.height) form.append('height', p.height);
        } else if (entry.prepare === 'video') {
          const p = await prepareVideo(file);
          thumb = p.thumb;
          if (p.width) form.append('width', p.width);
          if (p.height) form.append('height', p.height);
          if (p.duration) form.append('durationSec', p.duration);
        }
        if (entry.durationSec) form.append('durationSec', entry.durationSec);
        if (entry.purpose) form.append('purpose', entry.purpose);
        form.append('file', file, file.name);
        if (thumb) form.append('thumb', thumb, 'thumb.jpg');
        const ctrl = new AbortController();
        aborts.current.set(item.id, ctrl);
        const res = await chatApi.upload(form, {
          signal: ctrl.signal,
          onProgress: (p) => update({ progress: (i + p) / item.files.length }),
        });
        ids.push(res.attachment.id);
        item.done = ids;
      }
      aborts.current.delete(item.id);
      setUploads((list) => list.filter((u) => u.id !== item.id));
      sendPayload({ type: item.type, attachmentIds: ids, body: item.caption || undefined, replyToId: item.replyToId, meta: item.meta });
    } catch (err) {
      aborts.current.delete(item.id);
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      update({ status: 'failed', error: apiError(err) });
    }
  };

  const queueUpload = (type, files, extra = {}) => {
    const item = { id: store.newClientId(), type, files, caption: extra.caption, meta: extra.meta, replyToId: replyTo?.id, progress: 0, status: 'uploading', done: [] };
    setUploads((list) => [...list, item]);
    setReplyTo(null);
    stick.current = true;
    runUpload(item);
  };

  const sendFiles = (caption) => {
    const files = attachFiles;
    setAttachFiles([]);
    const images = files.filter((f) => /^image\/(jpeg|png|webp|gif)$/.test(f.type));
    const videos = files.filter((f) => /^video\/(mp4|webm|quicktime)$/.test(f.type));
    const others = files.filter((f) => !images.includes(f) && !videos.includes(f));
    let cap = caption;
    const take = () => {
      const c = cap;
      cap = '';
      return c;
    };
    if (images.length) queueUpload('IMAGE', images.map((file) => ({ file, prepare: 'image' })), { caption: take() });
    videos.forEach((file) => queueUpload('VIDEO', [{ file, prepare: 'video' }], { caption: take() }));
    if (others.length) queueUpload('FILE', others.map((file) => ({ file })), { caption: take() });
  };

  const sendVoice = (r) => {
    const file = new File([r.blob], r.name, { type: r.mime });
    if (file.size > (limits?.maxAudioMB || 20) * 1024 * 1024) return toast(tr('Ovozli xabar juda katta.'), 'error');
    return queueUpload('VOICE', [{ file, purpose: 'voice', durationSec: r.duration }], { meta: { duration: r.duration, waveform: r.waveform } });
  };

  const sendVideoNote = async (r) => {
    const file = new File([r.blob], r.name, { type: r.mime });
    if (file.size > (limits?.maxVideoMB || 95) * 1024 * 1024) return toast(tr('Video xabar juda katta.'), 'error');
    const thumb = await videoThumbFromBlob(r.blob).catch(() => null);
    return queueUpload('VIDEO_NOTE', [{ file, purpose: 'video_note', durationSec: r.duration, thumb }], { meta: { duration: r.duration } });
  };

  const addFiles = (files) => {
    const accepted = [];
    for (const f of files) {
      if (f.size > limitFor(f, limits) * 1024 * 1024) toast(`${f.name}: ${limitFor(f, limits)} MB dan katta.`, 'error');
      else accepted.push(f);
    }
    if (accepted.length) setAttachFiles((prev) => [...prev, ...accepted].slice(0, 10));
  };

  // ---------------- xabar amallari ----------------
  const canPin = !room.isArchived && (isDirect || (room.type === 'GROUP' ? ['OWNER', 'ADMIN'].includes(room.myRole) : ANNOUNCERS.includes(me.role)));
  const pinIds = useMemo(() => new Set(pins.map((p) => p.message.id)), [pins]);
  const canDeleteForAll = (m) =>
    (m.senderId === me.id && m.type !== 'SYSTEM' && minutesSince(m.createdAt) <= (limits?.deleteForAllWindowMinutes ?? 1440)) ||
    (me.role === 'SUPER_ADMIN' && !isDirect);

  const onAction = async (action, m, extra) => {
    try {
      switch (action) {
        case 'react': {
          const r = await store.toggleReaction(m.id, extra);
          setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, reactions: r.reactions } : x)));
          break;
        }
        case 'react-more':
          setDialog({ kind: 'react', message: m });
          break;
        case 'reply':
          setEditing(null);
          setReplyTo(m);
          break;
        case 'copy':
          await navigator.clipboard?.writeText(m.body || '');
          toast(tr('Nusxa olindi.'), 'success');
          break;
        case 'forward':
        case 'info':
        case 'delete':
        case 'task':
          setDialog({ kind: action, message: m });
          break;
        case 'pin':
        case 'unpin': {
          const items = action === 'pin' ? await chatApi.pin(m.id) : await chatApi.unpin(m.id);
          setPins(items);
          break;
        }
        case 'edit':
          setReplyTo(null);
          setEditing(m);
          break;
        case 'retry':
          store.retryMessage(m.clientId);
          break;
        case 'discard':
          store.discardMessage(m.clientId);
          break;
        default:
      }
    } catch (err) {
      toast(err?.error || apiError(err), 'error');
    }
  };

  const doDelete = async (m, scope) => {
    setDialog(null);
    try {
      await store.deleteMessage(m.id, scope);
      setMessages((prev) =>
        scope === 'me' ? prev.filter((x) => x.id !== m.id) : prev.map((x) => (x.id === m.id ? { ...x, deletedAt: new Date().toISOString(), body: null, attachments: [], reactions: [] } : x))
      );
      onRoomsChanged();
    } catch (err) {
      toast(err.error || tr("O'chirib bo'lmadi."), 'error');
    }
  };

  // ---------------- ko'rinish ----------------
  const pending = store.outboxFor(roomId);
  const pendingMsgs = pending
    .filter((p) => !messages.some((m) => m.clientId === p.payload.clientId && m.senderId === me.id))
    .map((p) => ({
      id: `pending-${p.payload.clientId}`,
      clientId: p.payload.clientId,
      roomId,
      senderId: me.id,
      sender: { id: me.id, fullName: me.fullName },
      type: p.payload.type,
      body: p.payload.body || null,
      meta: p.payload.meta || null,
      attachments: [],
      reactions: [],
      createdAt: p.createdAt,
      pending: p,
    }));
  const all = hasNewer ? messages : [...messages, ...pendingMsgs];

  const readCountOf = useCallback(
    (m) => {
      if (m.senderId !== me.id || m.pending) return 0;
      const t = new Date(m.createdAt).getTime();
      let n = 0;
      for (const mem of members) {
        if (mem.id !== me.id && mem.lastReadAt && new Date(mem.lastReadAt).getTime() >= t) n += 1;
      }
      return n;
    },
    [members, me.id]
  );

  const mentionNamesOf = (m) => (m.meta?.mentions || []).map((id) => membersById.get(id)?.fullName).filter(Boolean);
  const typingNames = Object.values(typing).map((t) => t.name);
  const subtitle = typingNames.length
    ? tr('{0}{1} yozmoqda…', typingNames.slice(0, 2).join(', '), typingNames.length > 2 ? (' ' + tr('va boshqalar')) : '')
    : isDirect
      ? peer
        ? peer.active === false
          ? tr('faol emas')
          : lastSeenText(store.getState().online.has(peer.id), peer.lastSeenAt)
        : ''
      : tr("{0} a'zo{1}", detail?.memberCount ?? room.memberCount, room.type === 'GROUP' && members.length ? tr(', {0} onlayn', members.filter((m) => store.getState().online.has(m.id)).length) : '');

  const topPin = pins[0];

  return (
    <div
      className="relative flex h-full min-w-0 flex-1 flex-col bg-[#eef2f6]"
      onDragOver={(e) => {
        if (room.canWrite && [...(e.dataTransfer?.types || [])].includes('Files')) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (room.canWrite) addFiles([...(e.dataTransfer?.files || [])]);
      }}
    >
      {/* Sarlavha */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-3 py-2.5">
        <button type="button" onClick={onBack} className="rounded-full p-1.5 text-slate-500 hover:bg-bg-light md:hidden" title={tr('Orqaga')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => setDialog({ kind: 'settings' })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar id={peer?.id || room.id} name={room.title} online={isDirect && peer && store.getState().online.has(peer.id)} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 truncate font-semibold text-ink">
              {room.title} {room.muted && <BellOff className="h-3.5 w-3.5 text-slate-400" />}
            </span>
            <span className={`block truncate text-xs ${typingNames.length ? 'text-primary' : 'text-slate-500'}`}>{subtitle}</span>
          </span>
        </button>
        <button type="button" onClick={() => setDialog({ kind: 'search' })} className="rounded-full p-2 text-slate-500 hover:bg-bg-light hover:text-primary" title={tr('Shu suhbatda qidirish')}>
          <Search className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => setDialog({ kind: 'settings' })} className="rounded-full p-2 text-slate-500 hover:bg-bg-light hover:text-primary" title={tr("Ma'lumot")}>
          <Info className="h-5 w-5" />
        </button>
      </div>

      {topPin && (
        <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-1.5">
          <Pin className="h-4 w-4 shrink-0 text-primary" />
          <button type="button" onClick={() => jump(topPin.message.id)} className="min-w-0 flex-1 text-left">
            <span className="block text-xs font-semibold text-primary">{tr('Qadalgan xabar')}{pins.length > 1 ? ` (${pins.length})` : ''}</span>
            <span className="block truncate text-xs text-slate-600">{store.previewText(topPin.message)}</span>
          </button>
          <button type="button" onClick={() => setDialog({ kind: 'pins' })} className="text-xs font-medium text-primary hover:underline">
            {tr('Hammasi')}
          </button>
        </div>
      )}

      {/* Xabarlar */}
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
            {error}
            <button type="button" onClick={() => window.location.reload()} className="text-primary hover:underline">
              {tr('Qayta yuklash')}
            </button>
          </div>
        )}
        {!loading && !error && (
          <>
            {loadingOlder && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
            {!hasMore && all.length === 0 && <p className="mt-10 text-center text-sm text-slate-400">{tr("Hali xabar yo'q. Birinchi bo'lib yozing!")}</p>}
            {all.map((m, i) => {
              const prev = all[i - 1];
              const next = all[i + 1];
              const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
              const grouped = prev && !newDay && prev.senderId === m.senderId && prev.type !== 'SYSTEM' && new Date(m.createdAt) - new Date(prev.createdAt) < GROUP_GAP_MS;
              const lastInGroup = !next || next.senderId !== m.senderId || next.type === 'SYSTEM' || !sameDay(next.createdAt, m.createdAt) || new Date(next.createdAt) - new Date(m.createdAt) >= GROUP_GAP_MS;
              const mine = m.senderId === me.id;
              return (
                <React.Fragment key={m.id}>
                  {newDay && (
                    <div className="sticky top-1 z-10 my-2 flex justify-center">
                      <span className="rounded-full bg-white/90 px-3 py-0.5 text-xs font-medium text-slate-500 shadow-sm">{dayLabel(m.createdAt)}</span>
                    </div>
                  )}
                  {m.id === firstUnreadId.current && (
                    <div id="chat-unread-divider" className="my-2 flex items-center gap-3 px-4">
                      <span className="h-px flex-1 bg-primary/30" />
                      <span className="text-xs font-semibold text-primary">{tr("O'qilmagan xabarlar")}</span>
                      <span className="h-px flex-1 bg-primary/30" />
                    </div>
                  )}
                  <div className={grouped ? '' : 'mt-1.5'}>
                    <MessageItem
                      message={m}
                      mine={mine}
                      pending={m.pending}
                      showSender={!isDirect && !grouped}
                      showAvatar={lastInGroup}
                      isDirect={isDirect}
                      readCount={readCountOf(m)}
                      mentionNames={mentionNamesOf(m)}
                      sticker={m.type === 'STICKER' ? stickerMap.get(m.meta?.stickerId) : null}
                      highlighted={highlight === m.id}
                      perms={{
                        meId: me.id,
                        canReact: !room.isArchived,
                        canWrite: room.canWrite,
                        canPin: canPin && m.type !== 'SYSTEM',
                        pinned: pinIds.has(m.id),
                        canEdit: mine && EDITABLE.includes(m.type) && !room.isArchived && minutesSince(m.createdAt) <= (limits?.editWindowMinutes ?? 1440),
                      }}
                      onAction={onAction}
                      onJump={jump}
                      onOpenImages={(items, index) => setLightbox({ items, index })}
                    />
                  </div>
                </React.Fragment>
              );
            })}
            {!hasNewer &&
              uploads.map((u) => (
                <div key={u.id} className="mt-1.5 flex justify-end px-4">
                  <div className="w-72 max-w-[85%] rounded-2xl rounded-br-md bg-primary/90 p-3 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <Upload className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {u.files.length > 1 ? tr('{0} ta fayl', u.files.length) : u.files[0].file.name} · {formatSize(u.files.reduce((s, f) => s + f.file.size, 0))}
                      </span>
                      {u.status === 'failed' ? (
                        <button type="button" onClick={() => runUpload(u)} className="rounded p-1 hover:bg-white/20" title={tr('Qayta urinish')}>
                          <RotateCw className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          aborts.current.get(u.id)?.abort();
                          setUploads((list) => list.filter((x) => x.id !== u.id));
                        }}
                        className="rounded p-1 hover:bg-white/20"
                        title={tr('Bekor qilish')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {u.status === 'failed' ? (
                      <p className="mt-1 text-xs text-red-100">{u.error}</p>
                    ) : (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30">
                        <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.round((u.progress || 0) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

      {(!atBottom || hasNewer) && !loading && (
        <button
          type="button"
          onClick={async () => {
            if (hasNewer) await loadLatest();
            stick.current = true;
            scrollToBottom(true);
            setNewBelow(0);
          }}
          className="absolute bottom-24 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-lg hover:bg-bg-light"
          title={tr('Pastga')}
        >
          <ArrowDown className="h-5 w-5" />
          {newBelow > 0 && <span className="absolute -top-1.5 -right-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">{newBelow}</span>}
        </button>
      )}

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-white/90 px-8 py-6 text-center text-primary">
            <Paperclip className="mx-auto mb-2 h-8 w-8" /> {tr('Fayllarni shu yerga tashlang')}
          </div>
        </div>
      )}

      <Composer
        room={room}
        meId={me.id}
        members={members}
        limits={limits}
        stickerPacks={stickerPacks}
        replyTo={replyTo}
        editing={editing}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditing(null)}
        onSendText={sendText}
        onSaveEdit={saveEdit}
        onFiles={addFiles}
        onSendSticker={sendSticker}
        onSendVoice={sendVoice}
        onSendVideoNote={sendVideoNote}
        onTyping={(t) => store.sendTyping(roomId, t)}
        onError={(msg) => toast(msg, 'error')}
      />

      {attachFiles.length > 0 && (
        <AttachDialog
          files={attachFiles}
          limits={limits}
          onRemove={(i) => setAttachFiles((list) => list.filter((_, j) => j !== i))}
          onClose={() => setAttachFiles([])}
          onSend={sendFiles}
        />
      )}
      {lightbox && <Lightbox items={lightbox.items} index={lightbox.index} onClose={() => setLightbox(null)} />}
      {dialog?.kind === 'react' && (
        <Modal open onClose={() => setDialog(null)} title={tr('Reaksiya')} size="sm">
          <div className="flex justify-center">
            <EmojiPicker
              inline
              onClose={() => setDialog(null)}
              onPick={(e) => {
                const m = dialog.message;
                setDialog(null);
                onAction('react', m, e);
              }}
            />
          </div>
        </Modal>
      )}
      {dialog?.kind === 'forward' && (
        <ForwardDialog
          message={dialog.message}
          rooms={rooms}
          onClose={() => setDialog(null)}
          onError={(e) => toast(e, 'error')}
          onDone={(n) => {
            setDialog(null);
            toast(tr('{0} ta suhbatga ulashildi.', n), 'success');
            onRoomsChanged();
          }}
        />
      )}
      {dialog?.kind === 'info' && <MessageInfoDialog message={dialog.message} room={room} members={members} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'delete' && <DeleteDialog message={dialog.message} canDeleteForAll={canDeleteForAll(dialog.message)} onClose={() => setDialog(null)} onDelete={doDelete} />}
      {dialog?.kind === 'pins' && (
        <PinnedDialog
          pins={pins}
          canUnpin={canPin}
          onClose={() => setDialog(null)}
          onJump={(id) => {
            setDialog(null);
            jump(id);
          }}
          onUnpin={async (id) => setPins(await chatApi.unpin(id))}
        />
      )}
      {dialog?.kind === 'search' && (
        <SearchDialog
          roomId={roomId}
          roomsById={{}}
          onClose={() => setDialog(null)}
          onOpen={(rid, mid) => {
            setDialog(null);
            if (rid === roomId) jump(mid);
            else onOpenRoom(rid, mid);
          }}
        />
      )}
      {dialog?.kind === 'settings' && detail && (
        <RoomSettingsDialog
          room={detail}
          meId={me.id}
          onClose={() => setDialog(null)}
          onChanged={() => {
            loadDetail();
            onRoomsChanged();
          }}
          onLeft={() => {
            setDialog(null);
            onLeft();
          }}
          onError={(e) => toast(e, 'error')}
        />
      )}
      {dialog?.kind === 'task' && (
        <TaskModal
          open
          taskId={null}
          onClose={() => setDialog(null)}
          initial={{
            title: (dialog.message.body || store.previewText(dialog.message) || tr('Chat xabari')).split('\n')[0].slice(0, 120),
            description: `${dialog.message.body || store.previewText(dialog.message)}\n\n— ${dialog.message.sender?.fullName || ''}, ${dayLabel(dialog.message.createdAt)} (${room.title})`,
            relatedType: 'BOSHQA',
            relatedLabel: tr('Chat: {0}', room.title).slice(0, 300),
          }}
          onChanged={() => toast(tr('Vazifa yaratildi.'), 'success')}
        />
      )}
    </div>
  );
}
