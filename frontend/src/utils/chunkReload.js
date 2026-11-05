// Deploy'dan keyin eski sahifa endi mavjud bo'lmagan (hash'i o'zgargan) JS/CSS
// bo'lagini so'rasa, Vite 'vite:preloadError' hodisasini chiqaradi. Bunda sahifani
// BIR MARTA qayta yuklaymiz — yangi index.html yangi fayl nomlarini olib keladi.
// Cheksiz sikldan himoya: sessionStorage'dagi vaqt belgisi; 60 soniya ichida
// takroran xato bo'lsa, qayta yuklanmaydi va xato odatdagidek ko'rsatiladi.
// (Belgi vaqtga bog'langan, shuning uchun keyingi deploy'da yana bir marta ishlaydi.)

const KEY = 'slm_chunk_reload_at';
const GUARD_MS = 60 * 1000;

export function installChunkReload() {
  try {
    window.addEventListener('vite:preloadError', (event) => {
      try {
        const last = Number(window.sessionStorage.getItem(KEY) || 0);
        if (last && Date.now() - last < GUARD_MS) return; // allaqachon urinilgan
        window.sessionStorage.setItem(KEY, String(Date.now()));
        event.preventDefault(); // xatoni yutamiz — sahifa baribir yangilanadi
        window.location.reload();
      } catch {
        // sessionStorage yopiq (masalan, maxfiy rejim): sikl xavfi bor —
        // qayta yuklamaymiz, xato odatdagidek ko'rsatiladi.
      }
    });
  } catch {
    // window yo'q yoki hodisa qo'llab-quvvatlanmaydi — hech narsa qilmaymiz.
  }
}
