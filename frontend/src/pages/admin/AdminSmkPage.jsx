import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminResource } from '../../services/adminApi';
import { Loading, EmptyState } from '../../components/StateViews.jsx';
import AdminCrudPage from './AdminCrudPage.jsx';

// The lab a user is confined to (mirrors backend crudFactory: a
// non-SUPER_ADMIN user with a labId only works with that lab's SMK).
export const smkConfinedLabId = (user) => (user && user.role !== 'SUPER_ADMIN' ? user.labId || null : null);

function useLabs() {
  const [labs, setLabs] = useState(null);
  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items || []))
      .catch(() => setLabs([]));
  }, []);
  return labs;
}

// /admin/smk/:labSlug/<module> — one SMK module, scoped to one laboratory.
export default function AdminSmkPage({ config }) {
  const { labSlug } = useParams();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const labs = useLabs();

  if (labs === null) return <Loading />;

  const confinedId = smkConfinedLabId(user);
  if (confinedId) {
    const own = labs.find((l) => l.id === confinedId);
    if (own && own.slug !== labSlug) {
      return <Navigate to={pathname.replace(`/smk/${labSlug}/`, `/smk/${own.slug}/`)} replace />;
    }
  }

  const lab = labs.find((l) => l.slug === labSlug);
  if (!lab) return <EmptyState message="Laboratoriya topilmadi." />;

  // Keyed by lab so switching labs starts from a clean list/form state.
  return <AdminCrudPage key={labSlug} config={config} labScope={{ id: lab.id, name: lab.nameUz }} />;
}

// Old /admin/smk/<module> links (before the per-lab split) land on the same
// module of the user's own lab, or the first lab.
export function AdminSmkLegacyRedirect() {
  const { module } = useParams();
  const { user } = useAuth();
  const labs = useLabs();

  if (labs === null) return <Loading />;
  const confinedId = smkConfinedLabId(user);
  const lab = (confinedId && labs.find((l) => l.id === confinedId)) || labs[0];
  if (!lab) return <EmptyState message="Laboratoriya topilmadi." />;
  return <Navigate to={`/admin/smk/${lab.slug}/${module}`} replace />;
}
