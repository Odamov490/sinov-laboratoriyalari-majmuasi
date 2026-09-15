import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { staffLogin, staffLogout, fetchStaffMe } from '../services/staffApi';

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffMe()
      .then(setStaff)
      .catch(() => setStaff(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (passportSeries, passportNumber, pinfl) => {
    const data = await staffLogin(passportSeries, passportNumber, pinfl);
    setStaff(data.staff);
    return data.staff;
  }, []);

  const logout = useCallback(async () => {
    await staffLogout();
    setStaff(null);
  }, []);

  return (
    <StaffAuthContext.Provider value={{ staff, setStaff, loading, login, logout }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuth must be used within StaffAuthProvider');
  return ctx;
}
