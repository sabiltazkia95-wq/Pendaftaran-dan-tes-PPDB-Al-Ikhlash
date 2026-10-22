import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, UserCheck, GraduationCap, ArrowRightLeft, Check, ChevronUp } from 'lucide-react';

export const DemoRoleSwitcher: React.FC = () => {
  const { user, switchAccount, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-72 text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#5E35B1]" />
              Ganti Akun Demo (Uji Role)
            </span>
            <span className="text-[11px] text-slate-400">PPDB 2027/2028</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => { switchAccount('student'); setIsOpen(false); }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                user?.role === 'student' ? 'bg-[#F3EEFF] text-[#5E35B1] font-semibold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#5E35B1]" />
                <div>
                  <div className="text-xs font-medium">Calon Santri</div>
                  <div className="text-[10px] text-slate-500">santri@alikhlash.sch.id</div>
                </div>
              </div>
              {user?.role === 'student' && <Check className="w-3.5 h-3.5 text-[#5E35B1]" />}
            </button>

            <button
              onClick={() => { switchAccount('committee'); setIsOpen(false); }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                user?.role === 'committee' ? 'bg-[#F3EEFF] text-[#5E35B1] font-semibold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#5E35B1]" />
                <div>
                  <div className="text-xs font-medium">Panitia PPDB</div>
                  <div className="text-[10px] text-slate-500">panitia@alikhlash.sch.id</div>
                </div>
              </div>
              {user?.role === 'committee' && <Check className="w-3.5 h-3.5 text-[#5E35B1]" />}
            </button>

            <button
              onClick={() => { switchAccount('admin'); setIsOpen(false); }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                user?.role === 'admin' ? 'bg-[#F3EEFF] text-[#5E35B1] font-semibold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#5E35B1]" />
                <div>
                  <div className="text-xs font-medium">Administrator</div>
                  <div className="text-[10px] text-slate-500">admin@alikhlash.sch.id</div>
                </div>
              </div>
              {user?.role === 'admin' && <Check className="w-3.5 h-3.5 text-[#5E35B1]" />}
            </button>
          </div>

          {user && (
            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { logout(); setIsOpen(false); }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded hover:bg-rose-50 transition-colors"
              >
                Keluar (Mode Publik)
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#5E35B1] hover:bg-[#512DA8] text-white px-3.5 py-2 rounded-full shadow-lg hover:shadow-xl transition-all text-xs font-medium border border-white/20"
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        <span>Mode: <strong>{user ? (user.role === 'student' ? 'Santri' : user.role === 'committee' ? 'Panitia' : 'Admin') : 'Publik'}</strong></span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
