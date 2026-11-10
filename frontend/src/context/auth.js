import { createContext, useContext } from 'react';

// Shared auth primitives. Kept separate from <AuthProvider> so that file only exports a
// component, which keeps React Fast Refresh working.
export const AuthContext = createContext(null);

export const ROLES = {
  ADMIN:    'admin',
  MANAGER:  'manager',
  OPERATOR: 'operator',
};

// Normalize whatever role string comes from DB → known role
export const normalizeRole = (dbRole) => {
  if (!dbRole) return ROLES.OPERATOR;
  const r = dbRole.toLowerCase();
  if (r.includes('admin'))   return ROLES.ADMIN;
  if (r.includes('manager')) return ROLES.MANAGER;
  return ROLES.OPERATOR;
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    canEdit:            true,
    canAdd:             true,
    canBulkStockUpdate: true,
    canAccessSettings:  true,
  },
  [ROLES.MANAGER]: {
    canEdit:            false,
    canAdd:             true,
    canBulkStockUpdate: true,
    canAccessSettings:  true,
  },
  [ROLES.OPERATOR]: {
    canEdit:            false,
    canAdd:             false,
    canBulkStockUpdate: false,
    canAccessSettings:  false,
  },
};

export function useAuth() {
  return useContext(AuthContext);
}