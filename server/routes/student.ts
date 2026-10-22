import { Response } from 'express';
import crypto from 'crypto';
import { db, Document, StudentAnswer, ExamAttempt, ExamResult } from '../db.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from './auth.ts';

export function registerStudentRoutes(app: any) {
  // Helper to get student profile for authenticated user
  const getStudentProfile = (userId: string) => {
    return db.get('student_profiles').find(sp => sp.user_id === userId);
  };

  // 1. Get Profile
  app.get('/api/student/profile', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    const student = getStudentProfile(req.user!.id);
    if (!student) {
      return res.status(404).json({ error: 'Data calon santri belum ditemukan.' });
    }
    const profile = db.get('profiles').find(p => p.id === req.user!.id);
    res.json({
      ...student,
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
  });

  // 2. Update Profile (Data Pribadi & Orang Tua)
  app.put('/api/student/profile', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) {
        return res.status(404).json({ error: 'Data calon santri belum ditemukan.' });
      }

      const {
        birth_place,
        birth_date,
        gender,
        nik,
        address,
        school_origin,
        education_level,
        parent_name,
        parent_phone
      } = req.body;

      student.birth_place = birth_place ?? student.birth_place;
      student.birth_date = birth_date ?? student.birth_date;
      student.gender = gender ?? student.gender;
      student.nik = nik ?? student.nik;
      student.address = address ?? student.address;
      student.school_origin = school_origin ?? student.school_origin;
      student.education_level = education_level ?? student.education_level;
      student.parent_name = parent_name ?? student.parent_name;
      student.parent_phone = parent_phone ?? student.parent_phone;
      student.updated_at = new Date().toISOString();

      db.save();
      db.logAudit(req.user!.id, 'UPDATE_STUDENT_PROFILE', 'STUDENT_PROFILE', student.id, {}, req.user!.full_name);

      res.json({ message: 'Data formulir berhasil disimpan.', student });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memperbarui profil.' });
    }
  });

  // 3. Get Registration Info
  app.get('/api/student/registration', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    const student = getStudentProfile(req.user!.id);
    if (!student) {
      return res.status(404).json({ error: 'Data profil belum ditemukan.' });
    }
    const registration = db.get('registrations').find(r => r.student_id === student.id);
    const documents = db.get('documents').filter(d => d.registration_id === registration?.id);
    res.json({ registration, documents, student });
  });

  // 4. Submit Registration (Lock into 'menunggu_verifikasi')
  app.post('/api/student/registration/submit', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(404).json({ error: 'Data belum ditemukan.' });

      const registration = db.get('registrations').find(r => r.student_id === student.id);
      if (!registration) return res.status(404).json({ error: 'Pendaftaran belum ditemukan.' });

      // Validation
      if (!student.nik || !student.birth_place || !student.birth_date || !student.address || !student.school_origin || !student.parent_name) {
        return res.status(400).json({ error: 'Mohon lengkapi seluruh Data Pribadi dan Data Orang Tua sebelum mengirimkan formulir.' });
      }

      const docs = db.get('documents').filter(d => d.registration_id === registration.id);
      const hasPhoto = docs.some(d => d.document_type === 'pas_foto');
      const hasKK = docs.some(d => d.document_type === 'kartu_keluarga');
      if (!hasPhoto || !hasKK) {
        return res.status(400).json({ error: 'Mohon unggah minimal Pas Foto dan Kartu Keluarga (KK) sebelum mengajukan verifikasi.' });
      }

      registration.status = 'menunggu_verifikasi';
      registration.submitted_at = new Date().toISOString();
      db.save();

      db.logAudit(req.user!.id, 'SUBMIT_REGISTRATION', 'REGISTRATION', registration.id, {
        reg_number: student.registration_number
      }, req.user!.full_name);

      res.json({ message: 'Formulir pendaftaran berhasil dikirim untuk proses verifikasi panitia!', registration });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal mengirim pendaftaran.' });
    }
  });

  // 5. Upload Document
  app.post('/api/student/documents', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(404).json({ error: 'Data tidak ditemukan.' });

      const registration = db.get('registrations').find(r => r.student_id === student.id);
      if (!registration) return res.status(404).json({ error: 'Pendaftaran tidak ditemukan.' });

      const { document_type, file_name, mime_type, file_size, data_base64 } = req.body;

      if (!document_type || !file_name || !data_base64) {
        return res.status(400).json({ error: 'Berkas dan tipe dokumen wajib disertakan.' });
      }

      // Check max size: 5MB
      if (file_size && file_size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Ukuran berkas maksimal 5MB.' });
      }

      // Validate allowed mime types
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (mime_type && !allowedMimes.includes(mime_type)) {
        return res.status(400).json({ error: 'Format berkas harus berupa JPG, PNG, atau PDF.' });
      }

      // If document already exists for this type, update it
      const existing = db.get('documents').find(
        d => d.registration_id === registration.id && d.document_type === document_type
      );

      const now = new Date().toISOString();
      if (existing) {
        existing.file_name = file_name;
        existing.mime_type = mime_type || 'application/octet-stream';
        existing.file_size = file_size || data_base64.length;
        existing.data_base64 = data_base64;
        existing.verification_status = 'menunggu';
        existing.review_notes = '';
        existing.created_at = now;
      } else {
        const newDoc: Document = {
          id: 'doc_' + crypto.randomUUID(),
          registration_id: registration.id,
          document_type,
          storage_path: `/private/documents/${registration.id}/${document_type}_${Date.now()}`,
          file_name,
          mime_type: mime_type || 'application/octet-stream',
          file_size: file_size || data_base64.length,
          data_base64,
          verification_status: 'menunggu',
          review_notes: '',
          reviewed_by: null,
          created_at: now
        };
        db.get('documents').push(newDoc);
      }

      db.save();
      db.logAudit(req.user!.id, 'UPLOAD_DOCUMENT', 'DOCUMENT', registration.id, { document_type, file_name }, req.user!.full_name);

      res.status(201).json({ message: 'Dokumen berhasil diunggah.' });
    } catch (err: any) {
      console.error('Doc upload error:', err);
      res.status(500).json({ error: 'Gagal mengunggah dokumen.' });
    }
  });

  // 6. Delete Document
  app.delete('/api/student/documents/:id', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(404).json({ error: 'Data tidak ditemukan.' });
      const registration = db.get('registrations').find(r => r.student_id === student.id);
      if (!registration) return res.status(404).json({ error: 'Pendaftaran tidak ditemukan.' });

      const docs = db.get('documents');
      const idx = docs.findIndex(d => d.id === req.params.id && d.registration_id === registration.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Dokumen tidak ditemukan atau bukan milik Anda.' });
      }

      if (docs[idx].verification_status === 'disetujui') {
        return res.status(400).json({ error: 'Dokumen yang telah disetujui panitia tidak dapat dihapus.' });
      }

      docs.splice(idx, 1);
      db.save();
      res.json({ message: 'Dokumen berhasil dihapus.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal menghapus berkas.' });
    }
  });

  // Secure Document Access with strict RLS (student can only access own document; committee/admin can access any)
  app.get('/api/documents/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const doc = db.get('documents').find(d => d.id === req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
    }

    if (req.user!.role === 'student') {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(403).json({ error: 'Akses ditolak.' });
      const registration = db.get('registrations').find(r => r.student_id === student.id);
      if (!registration || doc.registration_id !== registration.id) {
        return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat berkas milik peserta lain.' });
      }
    }

    res.json(doc);
  });

  // 7. Exam Card
  app.get('/api/student/exam-card', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    const student = getStudentProfile(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Data tidak ditemukan.' });
    const profile = db.get('profiles').find(p => p.id === req.user!.id);
    const registration = db.get('registrations').find(r => r.student_id === student.id);
    const photoDoc = db.get('documents').find(d => d.registration_id === registration?.id && d.document_type === 'pas_foto');
    const settings = db.get('settings');

    const activeExam = db.get('exams').find(e => e.status === 'aktif');

    res.json({
      registration_number: student.registration_number,
      full_name: profile?.full_name || '',
      education_level: student.education_level,
      school_origin: student.school_origin,
      academic_year: registration?.academic_year || settings.academic_year,
      status: registration?.status || 'draft',
      is_verified: ['terverifikasi', 'siap_ujian', 'sedang_ujian', 'ujian_selesai', 'menunggu_pengumuman', 'lulus', 'tidak_lulus'].includes(registration?.status || ''),
      exam_name: activeExam?.title || 'Ujian Seleksi CBT Masuk Santri Baru',
      exam_duration: activeExam?.duration_minutes || 60,
      exam_date: settings.cbt_exam_date,
      photo_url: photoDoc?.data_base64 || null,
      pesantren_name: settings.pesantren_name,
      qr_code_data: `AL-IKHLASH:${student.registration_number}:${student.user_id}:${registration?.academic_year}`
    });
  });

  // 8. Student Exams list & Eligibility
  app.get('/api/student/exams', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    const student = getStudentProfile(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    const registration = db.get('registrations').find(r => r.student_id === student.id);
    const isEligible = ['terverifikasi', 'siap_ujian', 'sedang_ujian', 'ujian_selesai'].includes(registration?.status || '');

    const assignments = db.get('exam_assignments').filter(a => a.student_id === student.id);
    const exams = db.get('exams').filter(e => assignments.some(a => a.exam_id === e.id));

    const attempts = db.get('exam_attempts').filter(att => att.student_id === student.id);

    const examList = exams.map(e => {
      const myAttempts = attempts.filter(att => att.exam_id === e.id);
      const activeAttempt = myAttempts.find(att => att.status === 'in_progress');
      const completedAttempt = myAttempts.find(att => att.status === 'submitted' || att.status === 'timed_out');
      const categories = db.get('exam_categories').filter(c => c.exam_id === e.id);
      const questionCount = db.get('questions').filter(q => categories.some(c => c.id === q.category_id) && q.is_active).length;

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        duration_minutes: e.duration_minutes,
        question_count: questionCount,
        categories: categories.map(c => ({ name: c.name, weight: c.weight })),
        is_eligible: isEligible,
        registration_status: registration?.status || 'draft',
        has_active_attempt: !!activeAttempt,
        active_attempt_id: activeAttempt?.id || null,
        is_completed: !!completedAttempt,
        completed_at: completedAttempt?.submitted_at || null,
        status: e.status
      };
    });

    res.json({ exams: examList, is_eligible: isEligible, registration_status: registration?.status });
  });

  // 9. Start / Resume Exam Attempt (SERVER-AUTHORITATIVE TIMER & DEADLINE)
  app.post('/api/student/exams/:id/start', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(404).json({ error: 'Data santri tidak ditemukan.' });

      const exam = db.get('exams').find(e => e.id === req.params.id && e.status === 'aktif');
      if (!exam) {
        return res.status(404).json({ error: 'Ujian tidak aktif atau tidak ditemukan.' });
      }

      // Check existing attempts: if already completed, reject with 400 Bad Request
      const attempts = db.get('exam_attempts').filter(a => a.student_id === student.id && a.exam_id === exam.id);
      const completed = attempts.find(a => a.status === 'submitted' || a.status === 'timed_out');
      if (completed) {
        return res.status(400).json({ error: 'Anda telah menyelesaikan ujian ini. Pengulangan ujian tidak diizinkan.' });
      }

      const registration = db.get('registrations').find(r => r.student_id === student.id);
      if (!['terverifikasi', 'siap_ujian', 'sedang_ujian'].includes(registration?.status || '')) {
        return res.status(403).json({ error: 'Pendaftaran Anda belum terverifikasi oleh panitia untuk mengikuti ujian CBT.' });
      }

      const now = new Date();
      // Check if there is already an in_progress attempt
      let active = attempts.find(a => a.status === 'in_progress');

      if (active) {
        // Check if deadline expired
        const deadline = new Date(active.deadline_at);
        if (now > deadline) {
          active.status = 'timed_out';
          active.submitted_at = active.deadline_at;
          db.save();
          return res.status(400).json({ error: 'Waktu ujian telah berakhir.' });
        }
      } else {
        // Double-check race condition in db
        const raceCheck = db.get('exam_attempts').find(a => a.student_id === student.id && a.exam_id === exam.id && a.status === 'in_progress');
        if (raceCheck) {
          active = raceCheck;
        } else {
          // Create new session
          const durationMs = exam.duration_minutes * 60 * 1000;
          const deadline = new Date(now.getTime() + durationMs);

          active = {
            id: 'att_' + crypto.randomUUID(),
            exam_id: exam.id,
            student_id: student.id,
            attempt_number: attempts.length + 1,
            started_at: now.toISOString(),
            deadline_at: deadline.toISOString(),
            submitted_at: null,
            status: 'in_progress',
            objective_score: null,
            essay_score: null,
            final_score: null,
            created_at: now.toISOString()
          };

          db.get('exam_attempts').push(active);
          if (registration) {
            registration.status = 'sedang_ujian';
          }
          db.save();

          db.logAudit(req.user!.id, 'START_EXAM', 'EXAM_ATTEMPT', active.id, {
            exam_id: exam.id,
            reg_number: student.registration_number
          }, req.user!.full_name);
        }
      }

      const remainingSeconds = Math.max(0, Math.floor((new Date(active.deadline_at).getTime() - Date.now()) / 1000));

      res.json({
        attempt_id: active.id,
        exam_id: exam.id,
        started_at: active.started_at,
        deadline_at: active.deadline_at,
        remaining_seconds: remainingSeconds,
        duration_minutes: exam.duration_minutes,
        server_now: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Start exam error:', err);
      res.status(500).json({ error: 'Gagal memulai sesi ujian.' });
    }
  });

  // 10. Get Exam Questions (SANITIZED - NO ANSWER KEYS EVER)
  app.get('/api/student/exams/:id/questions', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(404).json({ error: 'Data santri tidak ditemukan.' });

      const attempt = db.get('exam_attempts').find(a => a.student_id === student.id && a.exam_id === req.params.id && a.status === 'in_progress');
      if (!attempt) {
        return res.status(403).json({ error: 'Tidak ada sesi ujian aktif yang valid.' });
      }

      // Verify not expired
      if (Date.now() > new Date(attempt.deadline_at).getTime() + 5000) {
        attempt.status = 'timed_out';
        attempt.submitted_at = attempt.deadline_at;
        db.save();
        return res.status(403).json({ error: 'Waktu ujian telah berakhir.' });
      }

      const categories = db.get('exam_categories').filter(c => c.exam_id === req.params.id);
      const catMap = new Map(categories.map(c => [c.id, c.name]));

      const questions = db.get('questions').filter(q => catMap.has(q.category_id) && q.is_active);
      const options = db.get('question_options');
      const savedAnswers = db.get('student_answers').filter(a => a.attempt_id === attempt.id);

      // Build sanitized questions array (NO CORRECT ANSWER KEYS!)
      const sanitized = questions.map(q => {
        const qOptions = options
          .filter(opt => opt.question_id === q.id)
          .sort((a, b) => a.option_order - b.option_order)
          .map(opt => ({
            id: opt.id,
            option_text: opt.option_text,
            option_order: opt.option_order
          }));

        const existingAnswer = savedAnswers.find(sa => sa.question_id === q.id);

        return {
          id: q.id,
          category_id: q.category_id,
          category_name: catMap.get(q.category_id) || 'Umum',
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          image_path: q.image_path,
          options: qOptions,
          saved_answer: existingAnswer ? {
            selected_option_id: existingAnswer.selected_option_id,
            essay_answer: existingAnswer.essay_answer,
            marked_for_review: existingAnswer.marked_for_review
          } : null
        };
      });

      const remainingSeconds = Math.max(0, Math.floor((new Date(attempt.deadline_at).getTime() - Date.now()) / 1000));

      res.json({
        attempt_id: attempt.id,
        deadline_at: attempt.deadline_at,
        remaining_seconds: remainingSeconds,
        server_now: new Date().toISOString(),
        questions: sanitized
      });
    } catch (err: any) {
      console.error('Fetch questions error:', err);
      res.status(500).json({ error: 'Gagal memuat soal ujian.' });
    }
  });

  // 11. Save Answer (Single / Periodic)
  app.post('/api/student/exams/save-answer', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(404).json({ error: 'Data tidak ditemukan.' });

      const { attempt_id, question_id, selected_option_id, essay_answer, marked_for_review } = req.body;

      const attempt = db.get('exam_attempts').find(a => a.id === attempt_id && a.student_id === student.id);
      if (!attempt || attempt.status !== 'in_progress') {
        return res.status(403).json({ error: 'Sesi ujian telah selesai atau tidak valid.' });
      }

      // Check deadline with 10s grace period for network latency
      if (Date.now() > new Date(attempt.deadline_at).getTime() + 10000) {
        attempt.status = 'timed_out';
        attempt.submitted_at = attempt.deadline_at;
        db.save();
        return res.status(403).json({ error: 'Waktu ujian telah berakhir.' });
      }

      const answers = db.get('student_answers');
      let answer = answers.find(a => a.attempt_id === attempt_id && a.question_id === question_id);

      const now = new Date().toISOString();
      if (answer) {
        if (selected_option_id !== undefined) answer.selected_option_id = selected_option_id;
        if (essay_answer !== undefined) answer.essay_answer = essay_answer;
        if (marked_for_review !== undefined) answer.marked_for_review = marked_for_review;
        answer.saved_at = now;
      } else {
        answer = {
          id: 'ans_' + crypto.randomUUID(),
          attempt_id,
          question_id,
          selected_option_id: selected_option_id || null,
          essay_answer: essay_answer || null,
          marked_for_review: marked_for_review || false,
          saved_at: now
        };
        answers.push(answer);
      }

      db.save();
      res.json({ success: true, saved_at: now });
    } catch (err: any) {
      console.error('Save answer error:', err);
      res.status(500).json({ error: 'Gagal menyimpan jawaban.' });
    }
  });

  // 12. Submit Exam (Finalize & Server-side Auto Grading)
  app.post('/api/student/exams/submit', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = getStudentProfile(req.user!.id);
      if (!student) return res.status(404).json({ error: 'Data tidak ditemukan.' });

      const { attempt_id } = req.body;
      const attempt = db.get('exam_attempts').find(a => a.id === attempt_id && a.student_id === student.id);
      if (!attempt) {
        return res.status(404).json({ error: 'Sesi ujian tidak ditemukan.' });
      }

      if (attempt.status !== 'in_progress' && attempt.status !== 'timed_out') {
        return res.status(400).json({ error: 'Ujian ini sudah pernah dikumpulkan sebelumnya.' });
      }

      const now = new Date().toISOString();
      attempt.status = 'submitted';
      attempt.submitted_at = now;

      // Calculate Objective Score from multiple choice questions
      const answerKeys = db.get('question_answer_keys');
      const studentAnswers = db.get('student_answers').filter(a => a.attempt_id === attempt_id);
      const questions = db.get('questions');

      let correctCount = 0;
      let totalObjQuestions = 0;

      answerKeys.forEach(ak => {
        totalObjQuestions++;
        const studentAns = studentAnswers.find(sa => sa.question_id === ak.question_id);
        if (studentAns && studentAns.selected_option_id === ak.correct_option_id) {
          correctCount++;
        }
      });

      const objectivePercentage = totalObjQuestions > 0 ? Math.round((correctCount / totalObjQuestions) * 100) : 0;
      attempt.objective_score = objectivePercentage;

      // Update registration status
      const registration = db.get('registrations').find(r => r.student_id === student.id);
      if (registration) {
        registration.status = 'ujian_selesai';
      }

      // Check if essay exists
      const essayQuestions = questions.filter(q => q.question_type === 'essay' && q.is_active);
      const hasEssays = essayQuestions.length > 0;

      // Create initial exam result record
      const existingResult = db.get('exam_results').find(r => r.attempt_id === attempt.id);
      if (!existingResult) {
        db.get('exam_results').push({
          id: 'res_' + crypto.randomUUID(),
          attempt_id: attempt.id,
          objective_score: objectivePercentage,
          essay_score: 0,
          final_score: hasEssays ? 0 : objectivePercentage, // Wait for essay grading if essays exist
          selection_status: objectivePercentage >= db.get('settings').passing_grade ? 'lulus' : 'tidak_lulus',
          is_published: false,
          published_by: null,
          published_at: null,
          created_at: now
        });
      }

      db.save();

      db.logAudit(req.user!.id, 'SUBMIT_EXAM', 'EXAM_ATTEMPT', attempt.id, {
        exam_id: attempt.exam_id,
        correct_count: correctCount,
        total_mc: totalObjQuestions,
        objective_score: objectivePercentage
      }, req.user!.full_name);

      res.json({
        message: 'Alhamdulillah, ujian seleksi Anda telah berhasil dikumpulkan!',
        submitted_at: now,
        status: 'submitted'
      });
    } catch (err: any) {
      console.error('Submit exam error:', err);
      res.status(500).json({ error: 'Gagal mengumpulkan ujian.' });
    }
  });

  // 13. Student Results (Only returns if published)
  app.get('/api/student/results', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
    const student = getStudentProfile(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    const attempts = db.get('exam_attempts').filter(a => a.student_id === student.id && (a.status === 'submitted' || a.status === 'timed_out'));
    if (attempts.length === 0) {
      return res.json({ has_result: false, message: 'Anda belum menyelesaikan ujian seleksi.' });
    }

    const latestAttempt = attempts[attempts.length - 1];
    const result = db.get('exam_results').find(r => r.attempt_id === latestAttempt.id);

    if (!result || !result.is_published) {
      return res.json({
        has_result: false,
        status: 'menunggu_pengumuman',
        message: 'Hasil seleksi sedang dalam proses penilaian panitia dan akan diumumkan sesuai jadwal resmi.'
      });
    }

    const settings = db.get('settings');
    const profile = db.get('profiles').find(p => p.id === req.user!.id);

    res.json({
      has_result: true,
      selection_status: result.selection_status,
      objective_score: result.objective_score,
      essay_score: result.essay_score,
      final_score: result.final_score,
      passing_grade: settings.passing_grade,
      published_at: result.published_at,
      student: {
        registration_number: student.registration_number,
        full_name: profile?.full_name || '',
        education_level: student.education_level
      }
    });
  });
}
