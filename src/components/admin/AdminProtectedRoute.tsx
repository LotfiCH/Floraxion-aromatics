import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Loader2, ShieldAlert } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { admin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex flex-col items-center justify-center p-6 select-none">
        <div className="bg-white p-8 rounded-xs border border-[#E3E5DF] shadow-xs max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xs bg-[#244A3B]/10 text-[#244A3B] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="font-serif-botanical text-lg font-bold text-[#244A3B]">
              Vérification de la session
            </h2>
            <p className="text-xs text-[#6D746E] mt-1">
              Contrôle des accréditations sécurisées en cours...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated or not verified as admin: redirect to /admin
  if (!admin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
