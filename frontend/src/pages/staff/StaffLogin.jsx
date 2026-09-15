import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FlaskConical, LogIn } from 'lucide-react';
import { useStaffAuth } from '../../context/StaffAuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function StaffLogin() {
  const { staff, login } = useStaffAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [passportSeries, setPassportSeries] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [pinfl, setPinfl] = useState('');
  const [loading, setLoading] = useState(false);

  if (staff) return <Navigate to="/kabinet" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(passportSeries, passportNumber, pinfl);
      navigate('/kabinet');
    } catch (err) {
      showToast(err?.response?.data?.error || "Pasport ma'lumotlari yoki PINFL noto'g'ri.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-8">
        <div className="flex flex-col items-center mb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-3">
            <FlaskConical className="h-6 w-6" />
          </span>
          <h1 className="font-bold text-lg text-ink">Xodim kabineti</h1>
          <p className="text-xs text-slate-500 mt-1 text-center">
            Kirish uchun pasport seriya-raqami va PINFL kiriting
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              value={passportSeries}
              onChange={(e) => setPassportSeries(e.target.value.toUpperCase())}
              placeholder="Seriya (AA)"
              maxLength={2}
              className="input-field uppercase"
            />
            <input
              required
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Raqam"
              maxLength={7}
              inputMode="numeric"
              className="input-field"
            />
          </div>
          <input
            required
            value={pinfl}
            onChange={(e) => setPinfl(e.target.value.replace(/\D/g, ''))}
            placeholder="PINFL (14 ta raqam)"
            maxLength={14}
            inputMode="numeric"
            className="input-field"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn className="h-4 w-4" /> Kirish
          </button>
        </form>
      </div>
    </div>
  );
}
