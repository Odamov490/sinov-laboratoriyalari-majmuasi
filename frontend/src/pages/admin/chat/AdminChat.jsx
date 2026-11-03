import React from 'react';
import { MessageCircle } from 'lucide-react';

// Chat sahifasi (route darajasida lazy-load). To'liq interfeys keyingi
// bosqichda shu faylda quriladi.
export default function AdminChat() {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
      <MessageCircle className="h-10 w-10 text-primary" />
      <h1 className="text-lg font-bold text-ink">Chat</h1>
      <p className="max-w-md text-sm text-slate-500">Ichki chat tayyorlanmoqda. Tez orada shu yerda xabar almashish mumkin bo'ladi.</p>
    </div>
  );
}
