import { tr } from '../i18n/tr.js';
// Rol nomlari interfeysda (backend Role enum bilan bir xil kalitlar).
export const ROLE_LABELS = {
  SUPER_ADMIN: tr('Super admin'),
  MANAGER: tr('Menejer'),
  EDITOR: tr('Muharrir'),
  STAFF: tr('Xodim'),
};

export const roleLabel = (role) => ROLE_LABELS[role] || role;
