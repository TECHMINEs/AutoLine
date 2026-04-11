import { createContext, useContext, useState } from 'react';
import { loginUser } from '../services/api';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN:    'admin',
  MANAGER:  'manager',
  OPERATOR: 'operator',
};

// Normalize whatever role string comes from DB → known role
const normalizeRole = (dbRole) => {
  if (!dbRole) return ROLES.OPERATOR;
  const r = dbRole.toLowerCase();
  if (r.includes('admin'))   return ROLES.ADMIN;
  if (r.includes('manager')) return ROLES.MANAGER;
  return ROLES.OPERATOR;
};

const PERMISSIONS = {
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    try {
      const res  = await loginUser(username, password);
      const data = res.data;

      const role = normalizeRole(data.role);

      setUser({
        user_id:     data.user_id,
        username:    data.username,
        displayName: data.displayName,
        role,
        rawRole:     data.role,        // original DB value kept for reference
        permissions: PERMISSIONS[role],
      });

      return { success: true };

    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid username or password.';
      return { success: false, message: msg };
    }
  };

  const logout = () => setUser(null);

  const can = (permission) => user?.permissions?.[permission] === true;

  return (
    <AuthContext.Provider value={{ user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}