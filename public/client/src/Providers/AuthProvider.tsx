import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks'; // typed useDispatch hook
import { checkAuthToken } from '../features/authThunks';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    
    dispatch(checkAuthToken());
  }, [dispatch]);

  return <>{children}</>;
}
