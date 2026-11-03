// Rol nomlari interfeysda (backend Role enum bilan bir xil kalitlar).
export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super admin',
  MANAGER: 'Menejer',
  EDITOR: 'Muharrir',
  STAFF: 'Xodim',
};

export const roleLabel = (role) => ROLE_LABELS[role] || role;
