/**
 * Security & RLS Automated Test Suite for PPDB Online Pondok Pesantren Al-Ikhlash
 * Verifies authentication, database schema, RBAC, and Row Level Security rules.
 */

import { db } from './db.ts';

export interface TestResult {
  id: string;
  name: string;
  category: 'REGISTRATION' | 'RLS_DATA' | 'RBAC_ACCESS' | 'CBT_INTEGRITY' | 'AUTH_SECURITY' | 'CBT_LIFECYCLE';
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

    // ==========================================
    // SIKLUS PENGUJIAN CBT MENYELURUH (CBT LIFECYCLE)
    // ==========================================

    // SETUP Dedicated Student for CBT lifecycle testing
    const cbtStudentEmail = `cbt_pilot_${Date.now()}@test.com`;
    const cbtReg = await req('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'Calon Santri Pilot CBT',
        email: cbtStudentEmail,
        phone: '081299998888',
        password: 'password123',
        confirm_password: 'password123',
        terms_accepted: true
      })
    });
    const cbtStudentToken = cbtReg.data.token;
    const cbtStudentUser = cbtReg.data.user;

    // Retrieve active exam
    const activeExam = db.get('exams').find(e => e.status === 'aktif');
    const examId = activeExam?.id || 'exam_cbt_001';

    // Set registration status to 'siap_ujian' and ensure exam_assignment exists
    const cbtStudentProf = db.get('student_profiles').find(s => s.user_id === cbtStudentUser.id);
    if (cbtStudentProf) {
      const reg = db.get('registrations').find(r => r.student_id === cbtStudentProf.id);
      if (reg) {
        reg.status = 'siap_ujian';
      }
      // Assign active exam
      const existingAssign = db.get('exam_assignments').find(a => a.student_id === cbtStudentProf.id && a.exam_id === examId);
      if (!existingAssign) {
        db.get('exam_assignments').push({
          id: 'ea_' + crypto.randomUUID(),
          exam_id: examId,
          student_id: cbtStudentProf.id,
          status: 'assigned',
          created_at: new Date().toISOString()
        });
      }
      db.save();
    }

    // TEST CBT-01: Memulai Sesi & Timer Server-Authoritative
    const startRes1 = await req(`/api/student/exams/${examId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cbtStudentToken}` }
    });
    const hasServerTimer = startRes1.status === 200 &&
      Boolean(startRes1.data.attempt_id) &&
      Boolean(startRes1.data.started_at) &&
      Boolean(startRes1.data.deadline_at) &&
      typeof startRes1.data.remaining_seconds === 'number' &&
      startRes1.data.remaining_seconds > 0;

    const attemptId = startRes1.data.attempt_id;
    addResult(
      'CBT-01',
      'Memulai Sesi & Timer Server-Authoritative',
      'CBT_LIFECYCLE',
      'Sesi ujian dimulai dengan timer, durasi, dan deadline yang ditentukan oleh server, bukan browser.',
      hasServerTimer,
      'HTTP 200 dengan attempt_id, started_at, deadline_at, remaining_seconds',
      `HTTP ${startRes1.status} (remaining: ${startRes1.data.remaining_seconds}s, attempt: ${attemptId})`
    );

    // TEST CBT-02: Pencegahan Sesi Duplikat pada Dua Permintaan Bersamaan (Concurrent Start)
    const [concurrentStartA, concurrentStartB] = await Promise.all([
      req(`/api/student/exams/${examId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cbtStudentToken}` }
      }),
      req(`/api/student/exams/${examId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cbtStudentToken}` }
      })
    ]);
    const attemptsInDb = db.get('exam_attempts').filter(a => a.student_id === cbtStudentProf?.id && a.exam_id === examId);
    const noDuplicateSessions = concurrentStartA.data.attempt_id === concurrentStartB.data.attempt_id &&
      concurrentStartA.data.attempt_id === attemptId &&
      attemptsInDb.length === 1;

    addResult(
      'CBT-02',
      'Pencegahan Sesi Duplikat pada Permintaan Bersamaan',
      'CBT_LIFECYCLE',
      'Dua permintaan paralel memulai ujian bersamaan wajib mengembalikan sesi yang sama dan tidak menduplikasi record attempt.',
      noDuplicateSessions,
      'Tepat 1 sesi attempt di database dan ID sesi identik',
      `ID Sesi A: ${concurrentStartA.data.attempt_id}, ID Sesi B: ${concurrentStartB.data.attempt_id}, Total Attempt di DB: ${attemptsInDb.length}`
    );

    // TEST CBT-03: Penyimpanan Jawaban Pilihan Ganda & Esai
    const questionsRes = await req(`/api/student/exams/${examId}/questions`, {
      headers: { Authorization: `Bearer ${cbtStudentToken}` }
    });
    const mcQuestion = questionsRes.data.questions?.find((q: any) => q.question_type === 'multiple_choice' && q.options?.length > 0);
    const essayQuestion = questionsRes.data.questions?.find((q: any) => q.question_type === 'essay');

    const chosenOptionId = mcQuestion?.options[0]?.id;
    const testEssayText = 'Rukun Islam ada 5 yaitu syahadat, shalat, zakat, puasa, dan haji.';

    const saveMcRes = await req('/api/student/exams/save-answer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cbtStudentToken}` },
      body: JSON.stringify({
        attempt_id: attemptId,
        question_id: mcQuestion?.id,
        selected_option_id: chosenOptionId,
        marked_for_review: false
      })
    });

    let saveEssayRes = { status: 200 };
    if (essayQuestion) {
      saveEssayRes = await req('/api/student/exams/save-answer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cbtStudentToken}` },
        body: JSON.stringify({
          attempt_id: attemptId,
          question_id: essayQuestion?.id,
          essay_answer: testEssayText,
          marked_for_review: true
        })
      });
    }

    const answersSaved = saveMcRes.status === 200 && saveEssayRes.status === 200;
    addResult(
      'CBT-03',
      'Penyimpanan Jawaban Objektif & Esai',
      'CBT_LIFECYCLE',
      'Jawaban pilihan ganda dan uraian esai berhasil disimpan secara periodik ke server database.',
      answersSaved,
      'HTTP 200 untuk simpan pilihan ganda dan esai',
      `MC Save: HTTP ${saveMcRes.status}, Essay Save: HTTP ${saveEssayRes.status}`
    );

    // TEST CBT-04: Pemulihan Setelah Refresh / Koneksi Terputus
    const reloadQuestions = await req(`/api/student/exams/${examId}/questions`, {
      headers: { Authorization: `Bearer ${cbtStudentToken}` }
    });
    const reloadedMc = reloadQuestions.data.questions?.find((q: any) => q.id === mcQuestion?.id);
    const reloadedEssay = essayQuestion ? reloadQuestions.data.questions?.find((q: any) => q.id === essayQuestion?.id) : null;

    const recoveredCorrectly = reloadedMc?.saved_answer?.selected_option_id === chosenOptionId &&
      (!essayQuestion || (reloadedEssay?.saved_answer?.essay_answer === testEssayText && reloadedEssay?.saved_answer?.marked_for_review === true));

    addResult(
      'CBT-04',
      'Pemulihan Setelah Refresh / Koneksi Terputus',
      'CBT_LIFECYCLE',
      'Saat browser direfresh atau koneksi pulih, server mengembalikan seluruh jawaban dan timer asli secara utuh.',
      recoveredCorrectly,
      'Jawaban pilihan ganda, teks esai, dan flag ragu-ragu pulih 100%',
      recoveredCorrectly ? 'Data jawaban tersinkronisasi sempurna' : 'Jawaban gagal dipulihkan'
    );

    // TEST CBT-05: Penegakan Batas Waktu Ujian (Deadline Server)
    const expiredAttemptId = 'att_expired_test_' + Date.now();
    db.get('exam_attempts').push({
      id: expiredAttemptId,
      exam_id: examId,
      student_id: cbtStudentProf?.id || 'sp_001',
      attempt_number: 99,
      started_at: new Date(Date.now() - 7200000).toISOString(),
      deadline_at: new Date(Date.now() - 3600000).toISOString(),
      submitted_at: null,
      status: 'in_progress',
      objective_score: null,
      essay_score: null,
      final_score: null,
      created_at: new Date(Date.now() - 7200000).toISOString()
    });
    db.save();

    const lateAnswerRes = await req('/api/student/exams/save-answer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cbtStudentToken}` },
      body: JSON.stringify({
        attempt_id: expiredAttemptId,
        question_id: mcQuestion?.id,
        selected_option_id: chosenOptionId
      })
    });

    const deadlineEnforced = lateAnswerRes.status === 403;
    addResult(
      'CBT-05',
      'Penegakan Batas Waktu Ujian (Deadline Server)',
      'CBT_LIFECYCLE',
      'Pengiriman jawaban yang melebihi deadline waktu server wajib ditolak otomatis.',
      deadlineEnforced,
      'HTTP 403 Forbidden (Waktu ujian telah berakhir)',
      `HTTP ${lateAnswerRes.status} (${lateAnswerRes.data?.error || ''})`
    );

    // TEST CBT-06: Finalisasi Ujian & Perhitungan Nilai Otomatis di Server
    const submitRes = await req('/api/student/exams/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cbtStudentToken}` },
      body: JSON.stringify({ attempt_id: attemptId })
    });

    const finalizedAttempt = db.get('exam_attempts').find(a => a.id === attemptId);
    const finalizedResult = db.get('exam_results').find(r => r.attempt_id === attemptId);

    const submitSuccess = submitRes.status === 200 &&
      finalizedAttempt?.status === 'submitted' &&
      finalizedAttempt?.submitted_at !== null &&
      finalizedAttempt?.objective_score !== null &&
      finalizedResult !== undefined;

    addResult(
      'CBT-06',
      'Finalisasi Ujian & Perhitungan Nilai Server',
      'CBT_LIFECYCLE',
      'Ujian difinalisasi dengan aman, status berubah menjadi submitted, dan nilai objektif dihitung otomatis di backend.',
      submitSuccess,
      'HTTP 200, status submitted, nilai objektif terhitung',
      `HTTP ${submitRes.status}, status: ${finalizedAttempt?.status}, Skor Objektif: ${finalizedAttempt?.objective_score}`
    );

    // TEST CBT-07: Pencegahan Pengumpulan Ganda Permintaan Bersamaan
    const [doubleSubmitA, doubleSubmitB] = await Promise.all([
      req('/api/student/exams/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cbtStudentToken}` },
        body: JSON.stringify({ attempt_id: attemptId })
      }),
      req('/api/student/exams/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cbtStudentToken}` },
        body: JSON.stringify({ attempt_id: attemptId })
      })
    ]);

    const resultsInDb = db.get('exam_results').filter(r => r.attempt_id === attemptId);
    const doubleSubmitBlocked = doubleSubmitA.status === 400 &&
      doubleSubmitB.status === 400 &&
      resultsInDb.length === 1;

    addResult(
      'CBT-07',
      'Pencegahan Pengumpulan Ganda Permintaan Bersamaan',
      'CBT_LIFECYCLE',
      'Dua permintaan pengumpulan ujian paralel ditolak agar tidak memproses skor berulang atau menduplikasi hasil seleksi.',
      doubleSubmitBlocked,
      'HTTP 400 (Sudah dikumpulkan sebelumnya) & tepat 1 record hasil di database',
      `Req A: HTTP ${doubleSubmitA.status}, Req B: HTTP ${doubleSubmitB.status}, Total Hasil di DB: ${resultsInDb.length}`
    );

    // TEST CBT-08: Pencegahan Modifikasi Jawaban Pasca-Ujian Selesai
    const tamperAfterSubmit = await req('/api/student/exams/save-answer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cbtStudentToken}` },
      body: JSON.stringify({
        attempt_id: attemptId,
        question_id: mcQuestion?.id,
        selected_option_id: 'tampered_option'
      })
    });

    const postSubmitTamperBlocked = tamperAfterSubmit.status === 403;
    addResult(
      'CBT-08',
      'Pencegahan Modifikasi Jawaban Pasca-Ujian Selesai',
      'CBT_LIFECYCLE',
      'Peserta dilarang keras memodifikasi jawaban setelah sesi ujian berstatus submitted.',
      postSubmitTamperBlocked,
      'HTTP 403 Forbidden (Sesi ujian telah selesai atau tidak valid)',
      `HTTP ${tamperAfterSubmit.status} (${tamperAfterSubmit.data?.error || ''})`
    );

    // TEST CBT-09: Pencegahan Memulai Ulang Ujian yang Sudah Selesai
    const restartCompleted = await req(`/api/student/exams/${examId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cbtStudentToken}` }
    });

    const restartBlocked = restartCompleted.status === 400;
    addResult(
      'CBT-09',
      'Pencegahan Memulai Ulang Ujian yang Sudah Selesai',
      'CBT_LIFECYCLE',
      'Peserta yang telah menyelesaikan ujian ditolak untuk memulai sesi ujian baru pada mata uji yang sama.',
      restartBlocked,
      'HTTP 400 Bad Request (Pengulangan ujian tidak diizinkan)',
      `HTTP ${restartCompleted.status} (${restartCompleted.data?.error || ''})`
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
