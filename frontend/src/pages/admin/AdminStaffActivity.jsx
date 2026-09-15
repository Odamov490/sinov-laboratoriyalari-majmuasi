import React, { useEffect, useState } from 'react';
import { getStaffActivity, adminResource } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Pagination } from '../../components/UI.jsx';

const ACTION_LABELS = {
  LOGIN: 'Kirdi',
  LOGIN_FAILED: 'Muvaffaqiyatsiz urinish',
  PROFILE_UPDATE: 'Profilni yangiladi',
};

const ACTION_TONE = {
  LOGIN: 'bg-emerald-50 text-emerald-700',
  LOGIN_FAILED: 'bg-red-50 text-red-700',
  PROFILE_UPDATE: 'bg-blue-50 text-blue-700',
};

function formatDateTime(d) {
  return new Date(d).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminStaffActivity() {
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminResource('staff')
      .list({ pageSize: 200 })
      .then((d) => setStaffList(d.items))
      .catch(() => setStaffList([]));
  }, []);

  useEffect(() => {
    setData(null);
    setError(false);
    getStaffActivity({ staffId: staffId || undefined, page, pageSize: 20 })
      .then(setData)
      .catch(() => setError(true));
  }, [staffId, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Xodimlar faoliyati</h1>
      <p className="text-sm text-slate-500 mb-6">
        Har bir xodimning shaxsiy kabinetiga kirishlari va profil o'zgarishlari.
      </p>

      <div className="mb-5 max-w-xs">
        <select
          value={staffId}
          onChange={(e) => {
            setStaffId(e.target.value);
            setPage(1);
          }}
          className="input-field"
        >
          <option value="">Barcha xodimlar</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {error ? (
          <div className="p-6"><ErrorState /></div>
        ) : data === null ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <div className="p-6"><EmptyState /></div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Xodim</th>
                <th className="px-4 py-3">Amal</th>
                <th className="px-4 py-3">Tafsilot</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{a.staff?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400">{a.staff?.position}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_TONE[a.action] || 'bg-bg-light text-slate-600'}`}>
                      {ACTION_LABELS[a.action] || a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.detail || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{a.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <Pagination page={page} pageSize={20} total={data.total} onChange={setPage} />}
    </div>
  );
}
