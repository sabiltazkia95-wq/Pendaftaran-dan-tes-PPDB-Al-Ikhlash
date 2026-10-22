import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'committee') return '/committee/dashboard';
    return '/student/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-18">
          {/* Zone 1: Brand wordmark & logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left shrink-0 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#B39DDB]/30 bg-[#F3EEFF] flex items-center justify-center p-0.5 shadow-xs">
              <img
                src="/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg"
                alt="Logo Pondok Pesantren Al-Ikhlash"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="whitespace-nowrap">
              <span className="font-extrabold text-lg text-[#29243A] tracking-tight group-hover:text-[#5E35B1] transition-colors">
                PPDB Al-Ikhlash
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-[#5E35B1] bg-[#F3EEFF] px-2 py-0.5 rounded">
                2027/2028
              </span>
            </div>
          </button>

          {/* Zone 2: 4-5 Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => navigate('/')}
              className={`hover:text-[#5E35B1] transition-colors whitespace-nowrap shrink-0 ${
                currentPath === '/' ? 'text-[#5E35B1] font-semibold' : ''
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('alur-pendaftaran')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-[#5E35B1] transition-colors whitespace-nowrap shrink-0"
            >
              Alur Pendaftaran
            </button>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('persyaratan')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-[#5E35B1] transition-colors whitespace-nowrap shrink-0"
            >
              Persyaratan
            </button>
            <button
              onClick={() => navigate('/announcements')}
              className={`hover:text-[#5E35B1] transition-colors whitespace-nowrap shrink-0 ${
                currentPath === '/announcements' ? 'text-[#5E35B1] font-semibold' : ''
              }`}
            >
              Pengumuman
            </button>
            <button
              onClick={() => navigate('/help')}
              className={`hover:text-[#5E35B1] transition-colors whitespace-nowrap shrink-0 ${
                currentPath === '/help' ? 'text-[#5E35B1] font-semibold' : ''
              }`}
            >
              Bantuan
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                <span>Buka Dashboard ({user.role === 'student' ? 'Santri' : user.role === 'committee' ? 'Panitia' : 'Admin'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#5E35B1] transition-colors whitespace-nowrap shrink-0"
                >
                  Masuk
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
                >
                  Daftar Sekarang
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-[#5E35B1]"
          >
            Beranda
          </button>
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
              setTimeout(() => {
                document.getElementById('alur-pendaftaran')?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-[#5E35B1]"
          >
            Alur Pendaftaran
          </button>
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
              setTimeout(() => {
                document.getElementById('persyaratan')?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-[#5E35B1]"
          >
            Persyaratan & Jadwal
          </button>
          <button
            onClick={() => { navigate('/announcements'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-[#5E35B1]"
          >
            Pengumuman
          </button>
          <button
            onClick={() => { navigate('/help'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-[#5E35B1]"
          >
            Bantuan & Kontak
          </button>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => { navigate(getDashboardPath()); setMobileMenuOpen(false); }}
                className="w-full text-center py-2.5 px-4 text-xs font-semibold text-white bg-[#5E35B1] rounded-lg"
              >
                Masuk ke Dashboard ({user.role})
              </button>
            ) : (
              <>
                <button
                  onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2.5 px-4 text-xs font-semibold text-white bg-[#5E35B1] rounded-lg"
                >
                  Daftar Calon Santri
                </button>
                <button
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2 px-4 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Masuk ke Akun
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
