import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Leaf,
  LoaderCircle,
  LogOut,
  Mail,
  PackageCheck,
  UserRound,
} from 'lucide-react';
import type { Locale, Order, OrderStatus } from '../../types';
import { useAuth } from '../../lib/auth';
import { getDictionary, translations } from '../../lib/i18n';
import { formatDZD } from '../../lib/commerce';
import { mergeCustomerOrders, safeAccountReturnPath } from '../../lib/customerAccount';
import { subscribeCustomerOrders } from '../../lib/customerOrders';
import { storage } from '../../lib/storage';

type FormMode = 'login' | 'register' | 'reset';

interface CustomerAccountViewProps {
  locale: Locale;
}

function firebaseCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return '';
}

function authErrorMessage(error: unknown, locale: Locale, t: typeof translations.fr.account): string {
  const code = firebaseCode(error);
  const errorKey = code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
    ? 'invalidCredentials'
    : code === 'auth/email-already-in-use'
      ? 'emailInUse'
      : code === 'auth/weak-password'
        ? 'weakPassword'
        : code === 'auth/invalid-email'
          ? 'invalidEmail'
          : code === 'auth/too-many-requests'
            ? 'tooManyRequests'
            : code === 'auth/network-request-failed'
              ? 'network'
              : code === 'auth/operation-not-allowed'
                ? 'providerDisabled'
                : null;
  if (errorKey) return t.errors[errorKey];
  if (!code && error instanceof Error && locale === 'fr' && error.message) return error.message;
  return t.errors.generic;
}

function orderStatus(status: OrderStatus, t: typeof translations.fr.account): string {
  const labels: Record<OrderStatus, string> = {
    pending: t.statusPending,
    confirmed: t.statusConfirmed,
    processing: t.statusProcessing,
    shipped: t.statusShipped,
    delivered: t.statusDelivered,
    cancelled: t.statusCancelled,
    refunded: t.statusRefunded,
  };
  return labels[status];
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({ locale }) => {
  const t = getDictionary(locale).account;
  const location = useLocation();
  const navigate = useNavigate();
  const {
    firebaseUser,
    isAuthReady,
    loginCustomer,
    registerCustomer,
    sendCustomerPasswordReset,
    logout,
  } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const returnTo = safeAccountReturnPath(queryParams.get('returnTo'));
  const [mode, setMode] = useState<FormMode>(() => queryParams.get('mode') === 'register' ? 'register' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    if (firebaseUser && returnTo && location.pathname === '/account') {
      navigate(returnTo, { replace: true });
    }
  }, [firebaseUser?.uid, location.pathname, navigate, returnTo]);

  useEffect(() => {
    if (!firebaseUser) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError(false);
      return;
    }

    const uid = firebaseUser.uid;
    const storedOrders = storage.getOrders().filter((order) => order.customerUid === uid);
    setOrders(mergeCustomerOrders(uid, storedOrders, []));
    setOrdersLoading(true);
    setOrdersError(false);

    return subscribeCustomerOrders(uid, (remoteOrders) => {
      setOrders(mergeCustomerOrders(uid, storedOrders, remoteOrders));
      setOrdersLoading(false);
    }, (error) => {
      console.error('Customer order subscription failed:', error);
      setOrdersError(true);
      setOrdersLoading(false);
    });
  }, [firebaseUser?.uid]);

  const title = mode === 'register' ? t.registerTitle : mode === 'reset' ? t.resetTitle : t.loginTitle;
  const subtitle = mode === 'register' ? t.registerSubtitle : mode === 'reset' ? t.resetSubtitle : t.loginSubtitle;

  const sortedOrders = orders;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    if (!email.trim() || (mode !== 'reset' && !password) || (mode === 'register' && !fullName.trim())) {
      setFormError(t.errors.requiredFields);
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setFormError(t.errors.passwordMismatch);
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setFormError(t.errors.passwordTooShort);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'reset') {
        await sendCustomerPasswordReset(email, locale);
        setNotice(t.resetSent);
      } else if (mode === 'register') {
        await registerCustomer(fullName, email, password);
      } else {
        await loginCustomer(email, password);
      }
    } catch (error) {
      setFormError(authErrorMessage(error, locale, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setFormError(null);
    try {
      await logout();
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setFormError(t.errors.generic);
    }
  };

  const openAccountMode = (nextMode: FormMode) => {
    setMode(nextMode);
    setFormError(null);
    setNotice(null);
  };

  if (!isAuthReady) {
    return (
      <AccountFrame locale={locale} eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6D746E]" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#244A3B]" />
          <span>{t.loading}</span>
        </div>
      </AccountFrame>
    );
  }

  if (firebaseUser) {
    return (
      <AccountFrame locale={locale} eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
        <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <section className="border border-[#E3E5DF] bg-[#FAF9F5] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#244A3B]/8 text-[#244A3B]">
                <UserRound className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif-botanical text-lg font-semibold text-[#244A3B]">{t.accountDetails}</h2>
                <p className="mt-1 break-all text-sm text-[#6D746E]">{firebaseUser.email}</p>
                {firebaseUser.displayName && <p className="mt-1 text-sm text-[#292D29]">{firebaseUser.displayName}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[#E3E5DF] bg-white px-4 text-xs font-semibold text-[#244A3B] transition-colors hover:border-[#244A3B] hover:bg-[#244A3B]/5"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.logout}</span>
            </button>
          </section>

          <section className="border border-[#E3E5DF] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2 border-b border-[#E3E5DF] pb-4">
              <PackageCheck className="h-5 w-5 text-[#829477]" strokeWidth={1.6} />
              <h2 className="font-serif-botanical text-xl font-semibold text-[#244A3B]">{t.ordersTitle}</h2>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#6D746E]">{t.ordersPreviewNotice}</p>
            {ordersLoading && sortedOrders.length === 0 && (
              <p className="py-6 text-sm text-[#6D746E]" role="status">{t.loadingOrders}</p>
            )}
            {ordersError && <p className="mt-4 text-xs text-[#8B4A38]" role="status">{t.ordersUnavailable}</p>}
            {!ordersLoading && sortedOrders.length === 0 && (
              <p className="py-7 text-sm leading-relaxed text-[#6D746E]">{t.ordersEmpty}</p>
            )}
            {sortedOrders.length > 0 && (
              <div className="divide-y divide-[#E3E5DF]">
                {sortedOrders.map((order) => (
                  <article key={order.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#829477]">{t.orderNumber}</p>
                      <p className="mt-0.5 font-medium text-[#292D29]">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-[#6D746E]">
                        {t.orderDate} · {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { dateStyle: 'medium' }).format(new Date(order.createdAt))}
                        <span className="mx-2 text-[#C9CEC6]">·</span>{orderStatus(order.status, t)}
                      </p>
                    </div>
                    <p className="font-serif-botanical text-lg font-semibold text-[#244A3B]">{formatDZD(order.totalDZD, locale)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </AccountFrame>
    );
  }

  return (
    <AccountFrame locale={locale} eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <section className="mx-auto max-w-xl border border-[#E3E5DF] bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#244A3B]/8 text-[#244A3B]">
            {mode === 'reset' ? <KeyRound className="h-5 w-5" strokeWidth={1.6} /> : <Mail className="h-5 w-5" strokeWidth={1.6} />}
          </div>
          <div>
            <h2 className="font-serif-botanical text-xl font-semibold text-[#244A3B]">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#6D746E]">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <label className="block text-xs font-medium text-[#292D29]">
              {t.fullName}
              <input
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1.5 w-full border border-[#E3E5DF] bg-[#FAF9F5] px-3 py-3 text-sm text-[#292D29] outline-none transition-colors focus:border-[#244A3B]"
              />
            </label>
          )}
          <label className="block text-xs font-medium text-[#292D29]">
            {t.email}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full border border-[#E3E5DF] bg-[#FAF9F5] px-3 py-3 text-sm text-[#292D29] outline-none transition-colors focus:border-[#244A3B]"
            />
          </label>
          {mode !== 'reset' && (
            <label className="block text-xs font-medium text-[#292D29]">
              {t.password}
              <input
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full border border-[#E3E5DF] bg-[#FAF9F5] px-3 py-3 text-sm text-[#292D29] outline-none transition-colors focus:border-[#244A3B]"
              />
            </label>
          )}
          {mode === 'register' && (
            <label className="block text-xs font-medium text-[#292D29]">
              {t.confirmPassword}
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full border border-[#E3E5DF] bg-[#FAF9F5] px-3 py-3 text-sm text-[#292D29] outline-none transition-colors focus:border-[#244A3B]"
              />
            </label>
          )}

          {formError && <p className="border border-[#E7CBC3] bg-[#FBF3F0] p-3 text-xs leading-relaxed text-[#8B4A38]" role="alert">{formError}</p>}
          {notice && <p className="border border-[#D8E0D3] bg-[#F2F5EF] p-3 text-xs leading-relaxed text-[#244A3B]" role="status">{notice}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#244A3B] px-5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#1C3A2E] disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <span>{mode === 'register' ? t.register : mode === 'reset' ? t.sendResetLink : t.login}</span>}
            {!isSubmitting && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-3 border-t border-[#E3E5DF] pt-4 text-xs text-[#6D746E]">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => openAccountMode('reset')} className="self-start font-medium text-[#244A3B] underline-offset-4 hover:underline">{t.forgotPassword}</button>
              <p>{t.noAccount} <button type="button" onClick={() => openAccountMode('register')} className="font-semibold text-[#244A3B] underline-offset-4 hover:underline">{t.createAccount}</button></p>
            </>
          )}
          {mode === 'register' && (
            <p>{t.hasAccount} <button type="button" onClick={() => openAccountMode('login')} className="font-semibold text-[#244A3B] underline-offset-4 hover:underline">{t.login}</button></p>
          )}
          {mode === 'reset' && (
            <button type="button" onClick={() => openAccountMode('login')} className="inline-flex items-center gap-1 self-start font-medium text-[#244A3B] underline-offset-4 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />{t.backToLogin}
            </button>
          )}
        </div>
      </section>
    </AccountFrame>
  );
};

const AccountFrame: React.FC<{
  locale: Locale;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ locale, eyebrow, title, subtitle, children }) => (
  <div className="bg-[#F8F7F2] px-4 py-10 sm:py-14">
    <div className="mx-auto max-w-5xl">
      <div className="mb-7 text-center">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-[#829477]">
          <Leaf className="h-3.5 w-3.5" strokeWidth={1.7} />{eyebrow}
        </span>
        <h1 className="mt-3 font-serif-botanical text-3xl font-bold text-[#244A3B] sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-[#6D746E] sm:text-sm">{subtitle}</p>
      </div>
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>{children}</div>
    </div>
  </div>
);
