import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { admin, login, isLoading, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated as an authorized administrator, redirect to dashboard or attempted route
  if (!isLoading && admin) {
    const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email.trim()) {
      setLocalError('Veuillez saisir votre adresse e-mail professionnelle.');
      return;
    }
    if (!password) {
      setLocalError('Veuillez saisir votre mot de passe administrateur.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      const destination = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setLocalError(err?.message || 'Échec de la connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen bg-[#F4F1E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle botanical decorative background gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#244A3B]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#829477]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Back to Storefront Link */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#244A3B] hover:text-[#1C3A2E] bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xs border border-[#E3E5DF] shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au site public</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xs bg-[#244A3B] text-white shadow-md mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="block text-[11px] uppercase tracking-widest text-[#829477] font-mono font-medium">
            FLORAXION AROMATICS · PORTAIL OFFICIEL
          </span>
          <h1 className="mt-1 font-serif-botanical text-2xl sm:text-3xl font-bold text-[#244A3B]">
            Console d’Administration
          </h1>
          <p className="mt-2 text-xs text-[#6D746E] max-w-sm mx-auto leading-relaxed">
            Espace d'administration sécurisé pour la gestion du catalogue, des commandes et des devis professionnels.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-sm border border-[#E3E5DF] rounded-xs sm:px-10">
          {displayedError && (
            <div
              data-testid="login-error-banner"
              className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xs flex items-start gap-2.5 text-xs text-rose-900 animate-fade-in"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{displayedError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#292D29] mb-1.5"
              >
                Adresse e-mail professionnelle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#829477]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  data-testid="login-email-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (displayedError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="directeur@floraxion.dz"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] placeholder-[#829477]/60 focus:bg-white focus:border-[#244A3B] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#292D29] mb-1.5"
              >
                Mot de passe administrateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#829477]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (displayedError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] placeholder-[#829477]/60 focus:bg-white focus:border-[#244A3B] focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#829477] hover:text-[#244A3B] cursor-pointer"
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              data-testid="login-submit-btn"
              disabled={isSubmitting || isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-bold rounded-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification des accréditations...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Connexion au Back-Office</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-[#E3E5DF] text-center">
            <p className="text-[11px] text-[#6D746E] leading-relaxed">
              <span className="font-semibold text-[#244A3B]">Accès strictement contrôlé :</span> Seuls les
              collaborateurs enregistrés dans le registre officiel des administrateurs ont l'autorisation d'accès.
              Toute tentative non autorisée est tracée et consignée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
