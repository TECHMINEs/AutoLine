import { useState } from 'react';
import { loginUser } from '../services/api';
import { AuthContext, normalizeRole, PERMISSIONS } from './auth';

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
