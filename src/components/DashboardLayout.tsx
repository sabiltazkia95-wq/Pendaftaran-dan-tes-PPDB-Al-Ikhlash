import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Home,
  FileText,
  UploadCloud,
  CreditCard,
  MonitorCheck,
  Award,
  Bell,
  HelpCircle,
  User,
  Users,
  CheckCircle2,
  BookOpen,
  Calendar,
  Settings,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';

interface DashboardLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPath,
  navigate,
  title,
  subtitle,
  children,
}) => {
  const { user, studentProfile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Student Menu
  const studentMenu = [
    { label: 'Beranda', path: '/student/dashboard', icon: Home },
    { label: 'Formulir Pendaftaran', path: '/student/registration', icon: FileText },
    { label: 'Berkas Persyaratan', path: '/student/documents', icon: UploadCloud },
    { label: 'Kartu Peserta Digital', path: '/student/exam-card', icon: CreditCard },
    { label: 'Ujian Online CBT', path: '/student/exams', icon: MonitorCheck },
    { label: 'Hasil Seleksi', path: '/student/results', icon: Award },
    { label: 'Pengumuman', path: '/announcements', icon: Bell },
    { label: 'Petunjuk & Bantuan', path: '/help', icon: HelpCircle },
    { label: 'Profil Saya', path: '/student/profile', icon: User },
  ];

  // Committee Menu
  const committeeMenu = [
    { label: 'Dashboard Panitia', path: '/committee/dashboard', icon: Home },
    { label: 'Data Calon Santri', path: '/committee/applicants', icon: Users },
    { label: 'Penilaian Esai CBT', path: '/committee/essays', icon: ClipboardList },
    { label: 'Monitoring Ujian CBT', path: '/committee/monitoring', icon: MonitorCheck },
    { label: 'Pengumuman Resmi', path: '/announcements', icon: Bell },
  ];

  // Admin Menu
  const adminMenu = [
    { label: 'Dashboard Statistik', path: '/admin/dashboard', icon: Home },
    { label: 'Pengguna & Hak Akses', path: '/admin/users', icon: Users },
    { label: 'Data Pendaftar', path: '/committee/applicants', icon: FileText },
    { label: 'Bank Soal CBT', path: '/admin/questions', icon: BookOpen },
    { label: 'Jadwal & Bobot Ujian', path: '/admin/exams', icon: Calendar },
    { label: 'Hasil & Kelulusan', path: '/admin/results', icon: Award },
    { label: 'Pengumuman Sistem', path: '/announcements', icon: Bell },
    { label: 'Pengaturan PPDB', path: '/admin/settings', icon: Settings },
    { label: 'Audit Log Keamanan', path: '/admin/audit-logs', icon: History },
    { label: 'Audit Keamanan & RLS', path: '/admin/security-tests', icon: ShieldCheck },
  ];

  const menu = user?.role === 'admin' ? adminMenu : user?.role === 'committee' ? committeeMenu : studentMenu;

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#B39DDB]/40 bg-[#F3EEFF]">
            <img
              src="/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-[#29243A]">PPDB Al-Ikhlash</div>
            <div className="text-[10px] text-slate-500 font-mono">2027/2028</div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static shrink-0 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl overflow-hidden border border-[#B39DDB]/30 bg-[#F3EEFF] p-1 flex items-center justify-center shrink-0 shadow-xs"
            >
              <img
                src="/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </button>
            <div className="overflow-hidden text-left">
              <button onClick={() => navigate('/')} className="block text-sm font-bold text-slate-900 truncate hover:text-[#5E35B1]">
                PPDB Al-Ikhlash
              </button>
              <div className="text-[11px] font-medium text-[#5E35B1]">T.A. 2027/2028</div>
            </div>
          </div>

          {/* User badge */}
          <div className="p-3 mx-3 my-2 bg-[#F3EEFF]/60 rounded-xl border border-[#B39DDB]/20">
            <div className="text-xs font-bold text-[#29243A] truncate">{user?.full_name}</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
              <span className="capitalize font-medium text-[#5E35B1]">
                {user?.role === 'student' ? 'Calon Santri' : user?.role === 'committee' ? 'Panitia PPDB' : 'Administrator'}
              </span>
              {studentProfile?.registration_number && (
                <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {studentProfile.registration_number}
                </span>
              )}
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#5E35B1] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-left"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Lihat Halaman Publik</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            {studentProfile?.registration_number && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-medium">Nomor Pendaftaran</span>
                <span className="text-xs font-mono font-bold text-[#5E35B1] bg-[#F3EEFF] px-2 py-0.5 rounded">
                  {studentProfile.registration_number}
                </span>
              </div>
            )}
            <div className="w-9 h-9 rounded-full bg-[#5E35B1]/10 text-[#5E35B1] flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
