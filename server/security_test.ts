/**
 * Security & RLS Automated Test Suite for PPDB Online Pondok Pesantren Al-Ikhlash
 * Verifies authentication, database schema, RBAC, and Row Level Security rules.
 */

export interface TestResult {
  id: string;
  name: string;
  category: 'REGISTRATION' | 'RLS_DATA' | 'RBAC_ACCESS' | 'CBT_INTEGRITY' | 'AUTH_SECURITY';
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: any;
}

const BASE_URL = 'http://localhost:3000';

async function req(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function runSecurityAuditSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  duration_ms: number;
  results: TestResult[];
}> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  const addResult = (
    id: string,
    name: string,
    category: TestResult['category'],
    description: string,
    passed: boolean,
    expected: string,
    actual: string,
    details?: any
  ) => {
    results.push({ id, name, category, description, passed, expected, actual, details });
  };

  try {
    // SETUP: Logins for Admin, Committee, and Existing Student (Ahmad Fauzi)
    const adminLogin = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@alikhlash.sch.id', password: 'admin123' })
    });
    const adminToken = adminLogin.data.token;

    const commLogin = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'panitia@alikhlash.sch.id', password: 'panitia123' })
    });
    const commToken = commLogin.data.token;

    const studentALogin = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'santri@alikhlash.sch.id', password: 'santri123' })
    });
    const studentAToken = studentALogin.data.token;

    // TEST 1: Public Registration Role Tampering
    // Attacker tries to register with role: 'admin'
    const testEmailB = `santri_b_${Date.now()}@test.com`;
    const regRes = await req('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'Santri B (Test Persona)',
        email: testEmailB,
        phone: '089912345678',
        password: 'password123',
        confirm_password: 'password123',
        terms_accepted: true,
        role: 'admin' // ATTEMPT TO PRIVILEGE ESCALATE
      })
    });

    const regRole = regRes.data.user?.role;
    const studentBToken = regRes.data.token;
    addResult(
      'SEC-01',
      'Lockdown Registrasi Publik (Role Student Saja)',
      'REGISTRATION',
      'Registrasi publik tidak boleh mengizinkan manipulasi role menjadi admin atau committee.',
      regRole === 'student',
      'Role terkunci sebagai student',
      `Role yang terbentuk: ${regRole}`
    );

    // TEST 2: Profil Calon Santri (Isolasi Data Pribadi)
    // Student B requests /api/student/profile
    const profB = await req('/api/student/profile', {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    const isProfileIsolated = profB.data.email === testEmailB && profB.data.full_name === 'Santri B (Test Persona)';
    addResult(
      'SEC-02',
      'Isolasi Profil Calon Santri (Data Pribadi)',
      'RLS_DATA',
      'Calon santri hanya dapat membaca profil dirinya sendiri dan tidak mendapatkan profil peserta lain.',
      isProfileIsolated,
      `Hanya membaca data miliknya (${testEmailB})`,
      `Data terbaca untuk: ${profB.data.email}`
    );

    // TEST 3: Pencegahan Mutasi Silang (Cross-Student Mutation)
    // Student B tries to update Student A's data by passing fake IDs
    const updateRes = await req('/api/student/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        user_id: 'u_student_001', // Target Ahmad Fauzi
        address: 'Hacked Address'
      })
    });
    // Check if Student A was modified
    const checkA = await req('/api/student/profile', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const aNotModified = checkA.data.address !== 'Hacked Address';
    addResult(
      'SEC-03',
      'Pencegahan Modifikasi Silang Profil Antar Santri',
      'RLS_DATA',
      'Calon santri tidak dapat memodifikasi profil pendaftar lain meskipun mengirim user_id peserta lain.',
      aNotModified && updateRes.ok,
      'Profil peserta lain tidak terpengaruh',
      aNotModified ? 'Profil peserta sasaran tetap aman' : 'TERJADI KEBOCORAN: Profil peserta lain termutasi'
    );

    // TEST 4: Proteksi Berkas Privat (RLS Dokumen)
    // Student B attempts to read Student A's document doc_001 directly
    const docBReadA = await req('/api/documents/doc_001', {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    const docDenied = docBReadA.status === 403;
    addResult(
      'SEC-04',
      'Proteksi RLS Berkas Persyaratan Privat',
      'RLS_DATA',
      'Calon santri ditolak (403 Forbidden) saat mencoba mengunduh/melihat dokumen milik peserta lain.',
      docDenied,
      'HTTP 403 Forbidden',
      `HTTP ${docBReadA.status} (${docBReadA.data?.error || 'OK'})`
    );

    // TEST 5: Proteksi Hapus Berkas Silang
    const docBDeleteA = await req('/api/student/documents/doc_001', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    const delDenied = docBDeleteA.status === 404 || docBDeleteA.status === 403;
    addResult(
      'SEC-05',
      'Pencegahan Penghapusan Berkas Milik Peserta Lain',
      'RLS_DATA',
      'Calon santri tidak dapat menghapus dokumen yang bukan miliknya.',
      delDenied,
      'HTTP 404 atau 403',
      `HTTP ${docBDeleteA.status}`
    );

    // TEST 6: Proteksi Rute Panitia dari Calon Santri (RBAC)
    const commRouteTest = await req('/api/committee/applicants', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    addResult(
      'SEC-06',
      'Pembatasan Akses Rute Panitia PPDB (RBAC)',
      'RBAC_ACCESS',
      'Calon santri dilarang mengakses data pendaftar dan antrean verifikasi panitia.',
      commRouteTest.status === 403,
      'HTTP 403 Forbidden',
      `HTTP ${commRouteTest.status}`
    );

    // TEST 7: Proteksi Rute Administrator dari Calon Santri & Panitia (RBAC)
    const adminRouteTest = await req('/api/admin/users', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const commAdminTest = await req('/api/admin/users', {
      headers: { Authorization: `Bearer ${commToken}` }
    });
    const adminSafe = adminRouteTest.status === 403 && commAdminTest.status === 403;
    addResult(
      'SEC-07',
      'Pembatasan Akses Panel Administrator (RBAC)',
      'RBAC_ACCESS',
      'Calon santri dan panitia dilarang mengakses panel manajemen pengguna dan wewenang admin.',
      adminSafe,
      'HTTP 403 Forbidden untuk Santri & Panitia',
      `Santri: HTTP ${adminRouteTest.status}, Panitia: HTTP ${commAdminTest.status}`
    );

    // TEST 8: Kerahasiaan Kunci Jawaban CBT
    const examQRes = await req('/api/student/exams/exam_cbt_001/questions', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    let keyLeaked = false;
    if (examQRes.data.questions) {
      examQRes.data.questions.forEach((q: any) => {
        if (q.correct_option_id !== undefined || q.is_correct !== undefined || q.answer_key !== undefined) {
          keyLeaked = true;
        }
      });
    }
    addResult(
      'SEC-08',
      'Kerahasiaan Kunci Jawaban Soal CBT',
      'CBT_INTEGRITY',
      'Kunci jawaban terlindungi di server dan tidak boleh disertakan pada respons API peserta ujian.',
      !keyLeaked,
      'Tidak ada properti kunci jawaban pada daftar soal',
      !keyLeaked ? 'Kunci jawaban terproteksi sempurna' : 'TERJADI KEBOCORAN KUNCI JAWABAN'
    );

    // TEST 9: Pencegahan Pembajakan Sesi Ujian Silang
    const hijackTest = await req('/api/student/exams/save-answer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        attempt_id: 'att_non_existent_or_other_student',
        question_id: 'q_ag_01',
        selected_option_id: 'q_ag_01_opt_1'
      })
    });
    addResult(
      'SEC-09',
      'Pencegahan Pembajakan Sesi Ujian Peserta Lain',
      'CBT_INTEGRITY',
      'Jawaban hanya dapat disimpan pada sesi ujian yang sah dan dimiliki oleh peserta bersangkutan.',
      hijackTest.status === 403,
      'HTTP 403 Forbidden',
      `HTTP ${hijackTest.status}`
    );

    // TEST 10: Kebijakan Privasi Nilai Belum Terpublikasi
    // Make sure unpublished results return has_result: false
    await req('/api/admin/results/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ is_published: false })
    });
    const resultCheck = await req('/api/student/results', {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const resultHidden = resultCheck.data.has_result === false && resultCheck.data.final_score === undefined;
    addResult(
      'SEC-10',
      'Penyembunyian Nilai Sebelum Dipublikasikan',
      'CBT_INTEGRITY',
      'Nilai dan status kelulusan tidak dapat dibaca oleh calon santri sebelum dipublikasikan resmi oleh admin.',
      resultHidden,
      'has_result: false (Nilai dirahasiakan)',
      `has_result: ${resultCheck.data.has_result}`
    );

    // TEST 11: Penolakan Akses Tanpa Autentikasi
    const unauthTest = await req('/api/student/profile');
    addResult(
      'SEC-11',
      'Penolakan Permintaan Tanpa Token Autentikasi',
      'AUTH_SECURITY',
      'Setiap permintaan ke rute terproteksi tanpa Bearer token wajib ditolak.',
      unauthTest.status === 401,
      'HTTP 401 Unauthorized',
      `HTTP ${unauthTest.status}`
    );

    // TEST 12: Proteksi Reset Kata Sandi Tanpa Token
    const resetWithoutToken = await req('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@alikhlash.sch.id',
        new_password: 'hackedpassword',
        confirm_password: 'hackedpassword'
      })
    });
    addResult(
      'SEC-12',
      'Penolakan Reset Kata Sandi Tanpa Token Verifikasi',
      'AUTH_SECURITY',
      'Reset kata sandi wajib memvalidasi token kriptografis unik satu kali pakai (one-time token).',
      resetWithoutToken.status === 400,
      'HTTP 400 Bad Request (Token wajib disertakan)',
      `HTTP ${resetWithoutToken.status} (${resetWithoutToken.data?.error || ''})`
    );

  } catch (err: any) {
    addResult(
      'SEC-ERR',
      'Kegagalan Eksekusi Pengujian',
      'AUTH_SECURITY',
      'Pengujian mengalami error eksekusi.',
      false,
      'Sukses',
      err.message || 'Unknown error'
    );
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    duration_ms: Date.now() - startTime,
    results
  };
}
