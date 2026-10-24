import React, { useEffect, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import type { Locale } from '../../types';
import { subscribeAdminTeam, type AdminTeamMember } from '../../lib/team';

const roleLabels: Record<string, string> = {
  super_admin: 'Super administrateur',
  catalogue_manager: 'Gestionnaire du catalogue',
  order_manager: 'Gestionnaire des commandes',
  sales_manager: 'Gestionnaire commercial',
  read_only: 'Lecture seule',
};

export const AdminTeamManagement: React.FC<{ locale: Locale }> = ({ locale }) => {
  const [members, setMembers] = useState<AdminTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isArabic = locale === 'ar';

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    return subscribeAdminTeam((nextMembers) => {
      setMembers(nextMembers);
      setIsLoading(false);
      setError(null);
    }, (reason) => {
      setError(reason.message || 'Impossible de charger la liste de l’équipe.');
      setIsLoading(false);
    });
  }, []);

  return (
    <section className="w-full min-w-0 space-y-5 rounded-xs border border-[#E3E5DF] bg-white p-4 shadow-xs sm:p-6" aria-labelledby="team-management-title">
      <div className="flex min-w-0 flex-col items-start gap-3 border-b border-[#E3E5DF] pb-4 sm:flex-row sm:items-center">
        <Users className="w-5 h-5 text-[#244A3B]" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="team-management-title" className="break-words font-serif-botanical text-xl font-bold text-[#244A3B]">
            {isArabic ? 'إدارة الفريق' : 'Gestion de l’équipe'}
            {!isArabic && <span className="ms-2 text-sm font-sans font-medium text-[#6D746E]">(Team Management)</span>}
          </h2>
          <p className="mt-1 text-xs text-[#6D746E]">
            {isArabic
              ? 'قائمة الحسابات التي لديها سجل إداري. لا يتم عرض كلمات المرور أو رموز المصادقة.'
              : 'Comptes autorisés dans le registre administrateur. Aucun mot de passe ni jeton n’est affiché.'}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" role="note">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <p>
          {isArabic
            ? 'الإدارة هنا للعرض فقط حتى إعداد خادم موثوق. أضف الحسابات أو اسحب صلاحياتها من Firebase Console؛ لا يمكن للمتصفح تعديل /admins بأمان.'
            : 'Consultation uniquement tant qu’aucun service serveur de confiance n’est configuré. Ajoutez un compte ou révoquez ses droits dans Firebase Console; le navigateur ne peut pas modifier /admins en sécurité.'}
        </p>
      </div>

      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      {isLoading && <p role="status" className="bg-[#EAE8D9] p-3 text-xs text-[#244A3B]">{isArabic ? 'جارٍ تحميل الفريق…' : 'Chargement de l’équipe…'}</p>}
      {!isLoading && !error && members.length === 0 && (
        <p className="border border-[#E3E5DF] bg-[#FAF9F5] p-4 text-xs text-[#6D746E]">
          {isArabic ? 'لا توجد سجلات إدارية.' : 'Aucun compte administrateur autorisé.'}
        </p>
      )}

      {!error && members.length > 0 && (
        <div
          className="w-full min-w-0 overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#829477]"
          role="region"
          aria-label={isArabic ? 'جدول أعضاء الفريق قابل للتمرير' : 'Tableau des membres de l’équipe défilant horizontalement'}
          tabIndex={0}
        >
          <table className="w-full min-w-[620px] text-start text-xs">
            <thead className="bg-[#FAF9F5] text-[#244A3B]">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">{isArabic ? 'الاسم' : 'Nom'}</th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">E-mail</th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">{isArabic ? 'الدور' : 'Rôle'}</th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">{isArabic ? 'صلاحية الإدارة' : 'Accès admin'}</th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">UID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E5DF]">
              {members.map((member) => (
                <tr key={member.uid}>
                  <td className="px-3 py-3 font-semibold text-[#292D29]">{member.displayName}</td>
                  <td className="px-3 py-3 text-[#292D29]">{member.email}</td>
                  <td className="px-3 py-3 text-[#292D29]">{roleLabels[member.role] || member.role}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-xs px-2 py-1 font-semibold ${
                      roleLabels[member.role] ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                    }`}>
                      {roleLabels[member.role]
                        ? isArabic ? 'سجل إداري نشط' : 'Enregistrement actif'
                        : isArabic ? 'دور غير صالح' : 'Rôle invalide'}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[#6D746E]">{member.uid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[#6D746E]">
        {isArabic
          ? 'تعكس الحالة وجود سجل /admins فقط، ولا تؤكد أن حساب Firebase Authentication غير معطّل. تحقّق من حالة الحساب في Firebase Console.'
          : 'Le statut indique uniquement qu’un document /admins existe; l’état activé/désactivé de Firebase Authentication doit être vérifié dans Firebase Console.'}
      </p>
    </section>
  );
};
