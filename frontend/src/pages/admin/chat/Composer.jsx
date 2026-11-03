import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Smile, Sticker, Mic, Video, Send, X, CornerUpLeft, Pencil, Lock, FileText, Image as ImageIcon } from 'lucide-react';
import { EmojiPicker, StickerPicker } from './Pickers.jsx';
import { VoiceRecorder, VideoNoteRecorder } from './Recorders.jsx';
import { Avatar } from './MessageItem.jsx';
import { formatSize } from '../../../chat/format';
import { Modal } from '../../../components/Modal.jsx';

const DRAFT_KEY = (roomId) => `slm-chat-draft:${roomId}`;
const readDraft = (roomId) => {
  try {
    return localStorage.getItem(DRAFT_KEY(roomId)) || '';
  } catch {
    return '';
  }
};
const writeDraft = (roomId, text) => {
  try {
    if (text) localStorage.setItem(DRAFT_KEY(roomId), text);
    else localStorage.removeItem(DRAFT_KEY(roomId));
  } catch {
    /* saqlanmasa ham ishlaydi */
  }
};

// Biriktirish oynasi: tanlangan fayllar, rasm ko'rinishi, izoh.
export function AttachDialog({ files, onRemove, onClose, onSend, limits }) {
  const [caption, setCaption] = useState('');
  const previews = useMemo(() => files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)), [files]);
  useEffect(() => () => previews.forEach((p) => p && URL.revokeObjectURL(p)), [previews]);
  const tooBig = files.filter((f) => f.size > limitFor(f, limits) * 1024 * 1024);
  return (
    <Modal open onClose={onClose} title={`Yuborish (${files.length})`} size="md">
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {files.map((f, i) => (
          <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-border p-2">
            {previews[i] ? (
              <img src={previews[i]} alt="" className="h-14 w-14 rounded object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded bg-bg-light text-primary">
                {f.type.startsWith('video/') ? <Video className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{f.name}</p>
              <p className={`text-xs ${tooBig.includes(f) ? 'text-red-600' : 'text-slate-500'}`}>
                {formatSize(f.size)}
                {tooBig.includes(f) && ` — ruxsat etilgan ${limitFor(f, limits)} MB dan katta`}
              </p>
            </div>
            <button type="button" onClick={() => onRemove(i)} className="rounded p-1 text-slate-400 hover:text-red-600" title="Olib tashlash">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={4000}
        rows={2}
        placeholder="Izoh (ixtiyoriy)"
        className="input-field mt-3 resize-none"
      />
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <ImageIcon className="h-3.5 w-3.5" /> Rasmlar yuborishdan oldin siqiladi (eng uzun tomoni 1920 px).
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary !py-2">
          Bekor qilish
        </button>
        <button type="button" disabled={!files.length || tooBig.length > 0} onClick={() => onSend(caption.trim())} className="btn-primary !py-2">
          <Send className="h-4 w-4" /> Yuborish
        </button>
      </div>
    </Modal>
  );
}

export function limitFor(file, limits) {
  if (!limits) return 50;
  if (/^image\//.test(file.type)) return limits.maxImageMB;
  if (/^video\//.test(file.type)) return limits.maxVideoMB;
  if (/^audio\//.test(file.type)) return limits.maxAudioMB;
  return limits.maxFileMB;
}

// @eslatma: kursor oldidagi "@so'z".
function mentionQuery(text, caret) {
  const before = text.slice(0, caret);
  const m = /(^|\s)@([\p{L}\p{N}'._-]{0,30})$/u.exec(before);
  return m ? { query: m[2].toLowerCase(), start: caret - m[2].length - 1 } : null;
}

export default function Composer({
  room,
  meId,
  members,
  limits,
  stickerPacks,
  replyTo,
  editing,
  onCancelReply,
  onCancelEdit,
  onSendText,
  onSaveEdit,
  onFiles,
  onSendSticker,
  onSendVoice,
  onSendVideoNote,
  onTyping,
  onError,
}) {
  const [text, setText] = useState(() => readDraft(room.id));
  const [picker, setPicker] = useState(null); // 'emoji' | 'sticker'
  const [recording, setRecording] = useState(null); // 'voice' | 'video'
  const [mention, setMention] = useState(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const mentioned = useRef(new Map()); // fullName -> id
  const area = useRef(null);
  const fileInput = useRef(null);

  // Xona almashganda — o'sha xonaning qoralamasi.
  useEffect(() => {
    setText(editing ? editing.body || '' : readDraft(room.id));
    mentioned.current = new Map();
    setPicker(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  useEffect(() => {
    if (editing) {
      setText(editing.body || '');
      setTimeout(() => area.current?.focus(), 0);
    }
  }, [editing]);

  useEffect(() => {
    if (replyTo) area.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    if (editing) return undefined;
    const t = setTimeout(() => writeDraft(room.id, text), 300);
    return () => clearTimeout(t);
  }, [text, room.id, editing]);

  // Balandlik matnga moslashadi (ko'pi bilan ~8 qator).
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  const candidates = useMemo(() => {
    if (!mention) return [];
    return members.filter((m) => m.id !== meId && m.fullName.toLowerCase().includes(mention.query)).slice(0, 6);
  }, [mention, members, meId]);

  if (!room.canWrite) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-border bg-white px-4 py-4 text-sm text-slate-500">
        <Lock className="h-4 w-4" /> {room.readOnlyReason || "Bu xonaga yozib bo'lmaydi."}
      </div>
    );
  }

  const insert = (str) => {
    const el = area.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + str + text.slice(end);
    setText(next);
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + str.length, start + str.length);
    }, 0);
  };

  const pickMention = (m) => {
    const el = area.current;
    const caret = el?.selectionStart ?? text.length;
    const next = `${text.slice(0, mention.start)}@${m.fullName} ${text.slice(caret)}`;
    mentioned.current.set(m.fullName, m.id);
    setText(next);
    setMention(null);
    const pos = mention.start + m.fullName.length + 2;
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    }, 0);
  };

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    if (body.length > 4000) {
      onError('Xabar 4000 belgidan oshmasin.');
      return;
    }
    if (editing) {
      onSaveEdit(body);
      setText(readDraft(room.id));
      return;
    }
    const mentions = [...mentioned.current.entries()].filter(([name]) => body.includes(`@${name}`)).map(([, id]) => id);
    onSendText(body, mentions);
    setText('');
    writeDraft(room.id, '');
    mentioned.current = new Map();
    onTyping(false);
  };

  const onKeyDown = (e) => {
    if (mention && candidates.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx((i) => (i + 1) % candidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx((i) => (i - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pickMention(candidates[mentionIdx] || candidates[0]);
        return;
      }
      if (e.key === 'Escape') {
        setMention(null);
        return;
      }
    }
    if (e.key === 'Escape') {
      if (editing) onCancelEdit();
      else if (replyTo) onCancelReply();
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const onChange = (e) => {
    setText(e.target.value);
    const q = mentionQuery(e.target.value, e.target.selectionStart);
    setMention(q && room.type !== 'DIRECT' ? q : null);
    setMentionIdx(0);
    if (e.target.value.trim() && !editing) onTyping(true);
  };

  const onPaste = (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) {
      e.preventDefault();
      onFiles(files);
    }
  };

  if (recording === 'voice') {
    return (
      <div className="flex items-center gap-2 border-t border-border bg-white p-3">
        <VoiceRecorder
          maxSeconds={limits?.maxVoiceSeconds || 300}
          onCancel={() => setRecording(null)}
          onError={onError}
          onSend={(r) => {
            setRecording(null);
            onSendVoice(r);
          }}
        />
      </div>
    );
  }

  const canSend = text.trim().length > 0;
  return (
    <div className="border-t border-border bg-white">
      {(replyTo || editing) && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          {editing ? <Pencil className="h-4 w-4 shrink-0 text-primary" /> : <CornerUpLeft className="h-4 w-4 shrink-0 text-primary" />}
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
            <p className="text-xs font-semibold text-primary">{editing ? 'Tahrirlash' : `Javob: ${replyTo.sender?.fullName || ''}`}</p>
            <p className="truncate text-xs text-slate-500">{(editing || replyTo).body || 'Media'}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (editing) {
                onCancelEdit();
                setText(readDraft(room.id));
              } else onCancelReply();
            }}
            className="rounded p-1 text-slate-400 hover:text-slate-600"
            title="Bekor qilish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="relative flex items-end gap-1 p-2 sm:gap-2 sm:p-3">
        {mention && candidates.length > 0 && (
          <div className="absolute bottom-full left-3 z-50 mb-1 w-64 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
            {candidates.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickMention(m);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${i === mentionIdx ? 'bg-bg-light' : ''}`}
              >
                <Avatar id={m.id} name={m.fullName} size="h-7 w-7" /> {m.fullName}
              </button>
            ))}
          </div>
        )}
        {!editing && (
          <div className="relative flex items-center">
            <button type="button" onClick={() => fileInput.current?.click()} className="rounded-full p-2 text-slate-500 hover:bg-bg-light hover:text-primary" title="Fayl biriktirish">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/*,.pdf,.docx,.xlsx,.pptx,.txt,.zip,.csv"
              onChange={(e) => {
                const files = [...e.target.files];
                e.target.value = '';
                if (files.length) onFiles(files);
              }}
            />
          </div>
        )}
        <div className="relative flex min-w-0 flex-1 items-end rounded-2xl bg-bg-light">
          {picker === 'emoji' && <EmojiPicker onPick={(e) => insert(e)} onClose={() => setPicker(null)} />}
          {picker === 'sticker' && (
            <StickerPicker
              packs={stickerPacks}
              onClose={() => setPicker(null)}
              onPick={(s) => {
                setPicker(null);
                onSendSticker(s);
              }}
            />
          )}
          <textarea
            ref={area}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => setTimeout(() => setMention(null), 150)}
            rows={1}
            maxLength={4000}
            placeholder="Xabar yozing…"
            className="max-h-[200px] min-h-[42px] flex-1 resize-none bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none"
          />
          <div className="relative flex items-center pb-1 pr-1">
            <button type="button" onClick={() => setPicker(picker === 'emoji' ? null : 'emoji')} className="rounded-full p-1.5 text-slate-500 hover:text-primary" title="Emoji">
              <Smile className="h-5 w-5" />
            </button>
            {!editing && stickerPacks?.length > 0 && (
              <button type="button" onClick={() => setPicker(picker === 'sticker' ? null : 'sticker')} className="rounded-full p-1.5 text-slate-500 hover:text-primary" title="Stikerlar">
                <Sticker className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        {canSend || editing ? (
          <button type="button" onClick={submit} disabled={!canSend} className="rounded-full bg-primary p-2.5 text-white hover:bg-primary-light disabled:opacity-50" title={editing ? 'Saqlash' : 'Yuborish'}>
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <>
            <button type="button" onClick={() => setRecording('video')} className="rounded-full p-2 text-slate-500 hover:bg-bg-light hover:text-primary" title="Video xabar">
              <Video className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setRecording('voice')} className="rounded-full bg-primary p-2.5 text-white hover:bg-primary-light" title="Ovozli xabar">
              <Mic className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {recording === 'video' && (
        <VideoNoteRecorder
          maxSeconds={limits?.maxVideoNoteSeconds || 60}
          onCancel={() => setRecording(null)}
          onError={onError}
          onSend={(r) => {
            setRecording(null);
            onSendVideoNote(r);
          }}
        />
      )}
    </div>
  );
}
