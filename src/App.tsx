import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { DemoRoleSwitcher } from './components/DemoRoleSwitcher.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { AnnouncementsPage } from './pages/AnnouncementsPage.tsx';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';

// Student
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { StudentRegistrationForm } from './pages/student/StudentRegistrationForm.tsx';
import { StudentDocuments } from './pages/student/StudentDocuments.tsx';
import { StudentExamCard } from './pages/student/StudentExamCard.tsx';
import { StudentExamList } from './pages/student/StudentExamList.tsx';
import { StudentCbtExam } from './pages/student/StudentCbtExam.tsx';
import { StudentResultPage } from './pages/student/StudentResultPage.tsx';
import { StudentProfilePage } from './pages/student/StudentProfilePage.tsx';

// Committee
import { CommitteeDashboard } from './pages/committee/CommitteeDashboard.tsx';
import { CommitteeApplicants } from './pages/committee/CommitteeApplicants.tsx';
import { CommitteeEssays } from './pages/committee/CommitteeEssays.tsx';
import { CommitteeMonitoring } from './pages/committee/CommitteeMonitoring.tsx';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminUsers } from './pages/admin/AdminUsers.tsx';
import { AdminQuestions } from './pages/admin/AdminQuestions.tsx';
import { AdminExams } from './pages/admin/AdminExams.tsx';
import { AdminResults } from './pages/admin/AdminResults.tsx';
import { AdminSettings } from './pages/admin/AdminSettings.tsx';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs.tsx';
import { AdminSecurityTests } from './pages/admin/AdminSecurityTests.tsx';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [activeExamId, setActiveExamId] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If active in a CBT exam session, render full screen CBT room
  if (activeExamId) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] p-4 sm:p-6">
        <StudentCbtExam
          examId={activeExamId}
          navigate={navigate}
          onExit={() => setActiveExamId(null)}
        />
        <DemoRoleSwitcher />
      </div>
    );
  }

  // Public Paths
  const isPublicRoute = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/announcements',
    '/privacy-policy',
    '/help',
  ].includes(currentPath);

  if (isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFBFE]">
        <Navbar currentPath={currentPath} navigate={navigate} />
        <main className="flex-1">
          {currentPath === '/' && <LandingPage navigate={navigate} />}
          {currentPath === '/login' && <LoginPage navigate={navigate} />}
          {currentPath === '/register' && <RegisterPage navigate={navigate} />}
          {currentPath === '/forgot-password' && <ForgotPasswordPage navigate={navigate} />}
          {currentPath === '/announcements' && <AnnouncementsPage navigate={navigate} />}
          {currentPath === '/privacy-policy' && <PrivacyPolicyPage />}
          {currentPath === '/help' && <HelpPage />}
        </main>
        <Footer navigate={navigate} />
        <DemoRoleSwitcher />
      </div>
    );
  }

  // Protected Dashboard Router
  const renderDashboardContent = () => {
    // Student Routes
    if (currentPath === '/student/dashboard') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Beranda Calon Santri"
          subtitle="Ringkasan tahapan seleksi penerimaan santri baru Pondok Pesantren Al-Ikhlash."
        >
          <StudentDashboard navigate={navigate} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/student/registration') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Formulir Pendaftaran"
          subtitle="Isi data pribadi, asal sekolah, dan identitas orang tua/wali."
        >
          <StudentRegistrationForm navigate={navigate} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/student/documents') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Berkas Persyaratan"
          subtitle="Unggah Pas Foto, KK, dan dokumen pendukung lainnya."
        >
          <StudentDocuments navigate={navigate} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/student/exam-card') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Kartu Peserta Ujian Digital"
          subtitle="Kartu resmi tanda bukti peserta ujian seleksi masuk santri baru."
        >
          <StudentExamCard navigate={navigate} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/student/exams') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Ujian Online CBT"
          subtitle="Daftar ujian seleksi terintegrasi dan petunjuk pelaksanaan."
        >
          <StudentExamList navigate={navigate} onSelectExam={(id) => setActiveExamId(id)} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/student/results') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Pengumuman Hasil Seleksi"
          subtitle="Status keputusan kelulusan dan rincian perolehan skor nilai akhir."
        >
          <StudentResultPage navigate={navigate} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/student/profile') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Profil Saya"
          subtitle="Pengaturan biodata dan ubah kata sandi akun."
        >
          <StudentProfilePage />
        </DashboardLayout>
      );
    }

    // Committee Routes
    if (currentPath === '/committee/dashboard') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Dashboard Panitia PPDB"
          subtitle="Statistik pendaftar, monitoring berkas, dan antrean verifikasi."
        >
          <CommitteeDashboard navigate={navigate} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/committee/applicants') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Data Calon Santri & Verifikasi"
          subtitle="Pemeriksaan biodata santri dan verifikasi keabsahan dokumen persyaratan."
        >
          <CommitteeApplicants />
        </DashboardLayout>
      );
    }
    if (currentPath === '/committee/essays') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Penilaian Soal Esai CBT"
          subtitle="Evaluasi jawaban uraian subjektif calon santri dan pemberian skor."
        >
          <CommitteeEssays />
        </DashboardLayout>
      );
    }
    if (currentPath === '/committee/monitoring') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Monitoring Sesi Ujian CBT"
          subtitle="Pantauan langsung durasi, konektivitas, dan progres pengerjaan santri."
        >
          <CommitteeMonitoring />
        </DashboardLayout>
      );
    }

    // Admin Routes
    if (currentPath === '/admin/dashboard') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Dashboard Administrator"
          subtitle="Statistik eksekutif, rekapitulasi data pendaftar, dan kelulusan."
        >
          <AdminDashboard navigate={navigate} />
        </DashboardLayout>
      );
    }
    if (currentPath === '/admin/users') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Manajemen Pengguna & Staf"
          subtitle="Kelola akun pendaftar, panitia seleksi, dan administrator."
        >
          <AdminUsers />
        </DashboardLayout>
      );
    }
    if (currentPath === '/admin/questions') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Bank Soal Ujian CBT"
          subtitle="Manajemen butir soal pilihan ganda, esai, dan kunci jawaban terlindungi."
        >
          <AdminQuestions />
        </DashboardLayout>
      );
    }
    if (currentPath === '/admin/exams') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Jadwal & Bobot Nilai"
          subtitle="Pengaturan durasi ujian dan proporsi bobot kategori mata uji (100%)."
        >
          <AdminExams />
        </DashboardLayout>
      );
    }
    if (currentPath === '/admin/results') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Hasil & Keputusan Kelulusan"
          subtitle="Rekapitulasi nilai komposit dan publikasi resmi ke calon santri."
        >
          <AdminResults />
        </DashboardLayout>
      );
    }
    if (currentPath === '/admin/settings') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Pengaturan PPDB"
          subtitle="Parameter tahun ajaran, kontak sekretariat, dan batas kelulusan."
        >
          <AdminSettings />
        </DashboardLayout>
      );
    }
    if (currentPath === '/admin/audit-logs') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Audit Log Keamanan"
          subtitle="Catatan riwayat rekam jejak seluruh operasi sensitif pada sistem PPDB."
        >
          <AdminAuditLogs />
        </DashboardLayout>
      );
    }
    if (currentPath === '/admin/security-tests') {
      return (
        <DashboardLayout
          currentPath={currentPath}
          navigate={navigate}
          title="Audit Keamanan & RLS"
          subtitle="Pengujian otomatis hak akses, pencegahan kebocoran data santri, dan integritas CBT."
        >
          <AdminSecurityTests />
        </DashboardLayout>
      );
    }

    // Fallback
    return (
      <DashboardLayout
        currentPath={currentPath}
        navigate={navigate}
        title="Halaman Tidak Ditemukan"
      >
        <div className="text-center py-12">
          <p className="text-sm text-slate-600 mb-4">Halaman yang Anda tuju tidak tersedia.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-xs font-bold text-white bg-[#5E35B1] rounded-lg"
          >
            Kembali ke Beranda
          </button>
        </div>
      </DashboardLayout>
    );
  };

  return (
    <>
      {renderDashboardContent()}
      <DemoRoleSwitcher />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
