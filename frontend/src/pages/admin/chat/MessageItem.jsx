import React, { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  CornerUpLeft,
  Copy,
  Forward,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  ListPlus,
  Info,
  MoreHorizontal,
  SmilePlus,
  RotateCw,
  X,
} from 'lucide-react';
import { renderText, bigEmojiCount, formatTime, initials, avatarColor } from '../../../chat/format';
import { ImageGrid, VideoAttachment, FileAttachment, VoicePlayer, VideoNote, ExpiredMedia } from './Attachments.jsx';

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function Avatar({ id, name, size = 'h-9 w-9', online }) {
  return (
    <span className={`relative inline-flex shrink-0 ${size}`}>
      <span className={`flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(id)}`}>
        {initials(name)}
      </span>
      {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />}
    </span>
  );
}

function ReplyQuote({ reply, mine, onJump }) {
  return (
    <button
      type="button"
      onClick={() => onJump(reply.id)}
      className={`mb-1 block w-full rounded-md border-l-[3px] px-2 py-1 text-left text-xs ${mine ? 'border-white/70 bg-white/15' : 'border-primary bg-primary/5'}`}
    >
      <span className={`block font-semibold ${mine ? 'text-white' : 'text-primary'}`}>{reply.senderName || 'Foydalanuvchi'}</span>
      <span className={`line-clamp-2 ${mine ? 'text-white/80' : 'text-slate-600'}`}>
        {reply.deleted ? "Xabar o'chirildi" : reply.body || { IMAGE: 'Rasm', VIDEO: 'Video', VOICE: 'Ovozli xabar', VIDEO_NOTE: 'Video xabar', FILE: 'Fayl', STICKER: 'Stiker' }[reply.type] || ''}
      </span>
    </button>
  );
}

function Status({ message, pending, readCount, isDirect, mine }) {
  if (!mine) return null;
  if (pending?.status === 'failed') return <AlertCircle className="h-3.5 w-3.5 text-red-300" />;
  if (pending) return <Clock className="h-3 w-3" />;
  if (isDirect) return readCount > 0 ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />;
  return readCount > 0 ? <span className="text-[10px]">Ko'rdi: {readCount}</span> : <Check className="h-3.5 w-3.5" />;
}

function MenuButton({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-bg-light ${danger ? 'text-red-600' : 'text-ink'}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function MessageItem({
  message: m,
  mine,
  pending,
  showSender,
  showAvatar,
  isDirect,
  readCount,
  mentionNames,
  sticker,
  highlighted,
  perms,
  onAction,
  onJump,
  onOpenImages,
}) {
  // Menyu portal orqali chiziladi (scroll konteyneri uni qirqmasin).
  const [menu, setMenuState] = useState(null);
  const setMenu = (v, anchor) => {
    const open = typeof v === 'function' ? v(Boolean(menu)) : v;
    if (!open) return setMenuState(null);
    const rect = (anchor || document.getElementById(`msg-${m.id}`))?.getBoundingClientRect();
    const W = 232;
    const H = 400;
    const left = rect ? Math.min(Math.max(8, mine ? rect.left - W - 4 : rect.right + 4), window.innerWidth - W - 8) : 8;
    const top = rect ? Math.min(Math.max(8, rect.top - H / 2), window.innerHeight - H - 8) : 8;
    return setMenuState({ left, top: Math.max(8, top) });
  };

  if (m.type === 'SYSTEM') {
    return (
      <div className="my-2 flex justify-center px-4">
        <span className="rounded-full bg-slate-200/80 px-3 py-1 text-center text-xs text-slate-600">{m.body}</span>
      </div>
    );
  }

  const deleted = Boolean(m.deletedAt);
  const images = m.attachments?.filter((a) => a.kind === 'IMAGE') || [];
  const isMediaOnly = !deleted && (m.type === 'STICKER' || m.type === 'VIDEO_NOTE');
  const big = !deleted && m.type === 'TEXT' ? bigEmojiCount(m.body) : 0;
  const bubbleless = isMediaOnly || big > 0;
  const time = formatTime(m.createdAt);

  const act = (name, extra) => {
    setMenu(false);
    onAction(name, m, extra);
  };

  const content = deleted ? (
    <span className="text-sm italic opacity-70">Xabar o'chirildi</span>
  ) : (
    <>
      {m.meta?.forwardedFrom && (
        <div className={`mb-1 flex items-center gap-1 text-xs ${mine ? 'text-white/80' : 'text-primary/80'}`}>
          <Forward className="h-3 w-3" /> Ulashildi{m.meta.forwardedFrom.senderName ? `: ${m.meta.forwardedFrom.senderName}` : ''}
        </div>
      )}
      {m.replyTo && <ReplyQuote reply={m.replyTo} mine={mine} onJump={onJump} />}
      {m.type === 'IMAGE' && images.length > 0 && <ImageGrid attachments={images} onOpen={(i) => onOpenImages(images, i)} />}
      {m.type === 'VIDEO' && m.attachments?.[0] && <VideoAttachment att={m.attachments[0]} />}
      {m.type === 'VOICE' && m.attachments?.[0] && <VoicePlayer att={m.attachments[0]} meta={m.meta} mine={mine} />}
      {m.type === 'VOICE' && !m.attachments?.length && <ExpiredMedia />}
      {m.type === 'FILE' && (
        <div className="space-y-1">
          {m.attachments.map((a) =>
            a.kind === 'IMAGE' ? (
              <ImageGrid key={a.id} attachments={[a]} onOpen={() => onOpenImages([a], 0)} />
            ) : (
              <FileAttachment key={a.id} att={a} mine={mine} />
            )
          )}
        </div>
      )}
      {m.body && (
        <div className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${m.attachments?.length ? 'mt-1.5' : ''}`}>
          {renderText(m.body, { mentionNames, mine })}
        </div>
      )}
    </>
  );

  const reactions = !deleted && m.reactions?.length > 0 && (
    <div className={`mt-1 flex flex-wrap gap-1 ${mine ? 'justify-end' : ''}`}>
      {m.reactions.map((r) => {
        const minePick = r.userIds?.includes(perms.meId);
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onAction('react', m, r.emoji)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${minePick ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-slate-600'}`}
            title={minePick ? 'Reaksiyani olib tashlash' : 'Reaksiya qo\'shish'}
          >
            <span className="text-sm leading-none">{r.emoji}</span> {r.count}
          </button>
        );
      })}
    </div>
  );

  const footer = (
    <span className={`ml-2 inline-flex translate-y-1 items-center gap-1 whitespace-nowrap align-bottom text-[10px] ${mine && !bubbleless ? 'text-white/75' : 'text-slate-400'}`}>
      {m.editedAt && !deleted && <span>tahrirlangan</span>}
      {time}
      <Status message={m} pending={pending} readCount={readCount} isDirect={isDirect} mine={mine} />
    </span>
  );

  return (
    <div
      id={`msg-${m.id}`}
      className={`group flex items-end gap-2 px-3 py-0.5 sm:px-4 ${mine ? 'flex-row-reverse' : ''} transition-colors duration-700 ${highlighted ? 'bg-amber-100/80' : ''}`}
      onContextMenu={(e) => {
        if (pending || deleted) return;
        e.preventDefault();
        setMenu(true, { getBoundingClientRect: () => ({ left: e.clientX, right: e.clientX, top: e.clientY }) });
      }}
    >
      {!mine && !isDirect && <div className="w-9 shrink-0">{showAvatar && <Avatar id={m.senderId} name={m.sender?.fullName} />}</div>}
      <div className={`relative flex max-w-[85%] flex-col sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'}`}>
        {bubbleless ? (
          <div className="flex flex-col">
            {showSender && !mine && <span className="mb-0.5 text-xs font-semibold text-primary">{m.sender?.fullName}</span>}
            {m.type === 'STICKER' &&
              (sticker ? (
                <img src={sticker.url} alt={sticker.emoji || 'Stiker'} className="h-32 w-32 object-contain" loading="lazy" />
              ) : (
                <span className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">Stiker</span>
              ))}
            {m.type === 'VIDEO_NOTE' && <VideoNote att={m.attachments?.[0]} meta={m.meta} />}
            {big > 0 && <span className={big === 1 ? 'text-6xl' : big === 2 ? 'text-5xl' : 'text-4xl'}>{m.body}</span>}
            <div className={`mt-0.5 ${mine ? 'text-right' : ''}`}>{footer}</div>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-3 py-2 shadow-sm ${mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-white text-ink'} ${pending?.status === 'failed' ? 'opacity-70' : ''}`}
          >
            {showSender && !mine && <div className="mb-0.5 text-xs font-semibold text-primary">{m.sender?.fullName}</div>}
            {content}
            {footer}
          </div>
        )}
        {reactions}
        {pending?.status === 'failed' && (
          <div className="mt-1 flex items-center gap-2 text-xs text-red-600">
            {pending.error || 'Yuborilmadi'}
            <button type="button" onClick={() => onAction('retry', m)} className="inline-flex items-center gap-1 font-semibold hover:underline">
              <RotateCw className="h-3 w-3" /> Qayta
            </button>
            <button type="button" onClick={() => onAction('discard', m)} className="inline-flex items-center gap-1 hover:underline">
              <X className="h-3 w-3" /> Bekor
            </button>
          </div>
        )}
      </div>

      {!pending && !deleted && (
        <div className={`relative self-center ${menu ? '' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}>
          <button type="button" onClick={(e) => setMenu(!menu, e.currentTarget)} className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-600" title="Amallar">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menu &&
            createPortal(
              <>
                <div
                  className="fixed inset-0 z-[110]"
                  onClick={() => setMenu(false)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu(false);
                  }}
                />
                <div style={{ left: menu.left, top: menu.top }} className="fixed z-[111] w-56 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
                  {perms.canReact && (
                    <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
                      {QUICK_REACTIONS.map((e) => (
                        <button key={e} type="button" onClick={() => act('react', e)} className="rounded-full p-1 text-lg leading-none hover:bg-bg-light">
                          {e}
                        </button>
                      ))}
                      <button type="button" onClick={() => act('react-more')} className="rounded-full p-1 text-slate-500 hover:bg-bg-light" title="Boshqa">
                        <SmilePlus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {perms.canWrite && <MenuButton icon={CornerUpLeft} label="Javob berish" onClick={() => act('reply')} />}
                  {m.body && <MenuButton icon={Copy} label="Nusxa olish" onClick={() => act('copy')} />}
                  <MenuButton icon={Forward} label="Ulashish" onClick={() => act('forward')} />
                  {perms.canPin && (
                    <MenuButton icon={perms.pinned ? PinOff : Pin} label={perms.pinned ? 'Qadashni olib tashlash' : 'Qadash'} onClick={() => act(perms.pinned ? 'unpin' : 'pin')} />
                  )}
                  {perms.canEdit && <MenuButton icon={Pencil} label="Tahrirlash" onClick={() => act('edit')} />}
                  <MenuButton icon={ListPlus} label="Vazifa qilish" onClick={() => act('task')} />
                  <MenuButton icon={Info} label="Ma'lumot" onClick={() => act('info')} />
                  <MenuButton icon={Trash2} label="O'chirish" onClick={() => act('delete')} danger />
                </div>
              </>,
              document.body
            )}
        </div>
      )}
    </div>
  );
}

export default memo(MessageItem);
