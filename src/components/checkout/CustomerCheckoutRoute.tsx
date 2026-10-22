import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { LoaderCircle } from 'lucide-react';
import type { Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';

export const CustomerCheckoutRoute: React.FC<{ children: React.ReactNode; locale: Locale }> = ({ children, locale }) => {
  const { firebaseUser, isAuthReady } = useAuth();
  const location = useLocation();
  const t = getDictionary(locale);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center gap-2 text-sm text-[#6D746E]" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin text-[#244A3B]" />
        <span>{t.account.loading}</span>
      </div>
    );
  }

  if (!firebaseUser) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/account?mode=login&returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
};
