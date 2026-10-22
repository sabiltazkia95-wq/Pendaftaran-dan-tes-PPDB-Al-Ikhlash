import { Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, Question, QuestionOption, QuestionAnswerKey, Announcement } from '../db.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from './auth.ts';
import { runSecurityAuditSuite } from '../security_test.ts';

export function registerAdminRoutes(app: any) {
  // 1. Admin System Statistics
  app.get('/api/admin/stats', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const profiles = db.get('profiles');
    const registrations = db.get('registrations');
    const questions = db.get('questions');
    const attempts = db.get('exam_attempts');
    const results = db.get('exam_results');

    res.json({
      totalUsers: profiles.length,
      studentsCount: profiles.filter(p => p.role === 'student').length,
      committeeCount: profiles.filter(p => p.role === 'committee').length,
      adminCount: profiles.filter(p => p.role === 'admin').length,
      registrationsCount: registrations.length,
      verifiedCount: registrations.filter(r => ['terverifikasi', 'siap_ujian', 'sedang_ujian', 'ujian_selesai'].includes(r.status)).length,
      totalQuestions: questions.length,
      activeQuestions: questions.filter(q => q.is_active).length,
      completedExams: attempts.filter(a => a.status === 'submitted' || a.status === 'timed_out').length,
      passedCount: results.filter(r => r.selection_status === 'lulus').length,
      publishedResults: results.filter(r => r.is_published).length
    });
  });

  // 2. User Management
  app.get('/api/admin/users', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const users = db.get('profiles').map(p => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      role: p.role,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));
    res.json(users);
  });

  app.post('/api/admin/users', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { full_name, email, phone, role, password } = req.body;
      if (!full_name || !email || !role || !password) {
        return res.status(400).json({ error: 'Data staf tidak lengkap.' });
      }

      const emailTrimmed = email.trim().toLowerCase();
      if (db.get('profiles').some(p => p.email.toLowerCase() === emailTrimmed)) {
        return res.status(400).json({ error: 'Email sudah digunakan.' });
      }

      const now = new Date().toISOString();
      const newStaff = {
        id: 'u_' + crypto.randomUUID(),
        full_name: full_name.trim(),
        email: emailTrimmed,
        phone: phone ? phone.trim() : '',
        role: role as 'committee' | 'admin',
        password_hash: hashPassword(password),
        created_at: now,
        updated_at: now
      };

      db.get('profiles').push(newStaff);
      db.save();
      db.logAudit(req.user!.id, 'CREATE_STAFF_USER', 'PROFILE', newStaff.id, { role, email: emailTrimmed }, req.user!.full_name);

      res.status(201).json({ message: 'Pengguna staf berhasil ditambahkan.', user: newStaff });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal membuat pengguna.' });
    }
  });

  app.put('/api/admin/users/:id/role', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { role } = req.body;
      const user = db.get('profiles').find(p => p.id === req.params.id);
      if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

      if (user.id === req.user!.id && role !== 'admin') {
        return res.status(400).json({ error: 'Anda tidak dapat menurunkan hak akses akun admin Anda sendiri.' });
      }

      const oldRole = user.role;
      user.role = role;
      user.updated_at = new Date().toISOString();
      db.save();

      db.logAudit(req.user!.id, 'CHANGE_USER_ROLE', 'PROFILE', user.id, { old_role: oldRole, new_role: role }, req.user!.full_name);
      res.json({ message: 'Peran pengguna berhasil diperbarui.', user });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal mengubah peran.' });
    }
  });

  // 3. Question Bank Management
  app.get('/api/admin/questions', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const questions = db.get('questions');
    const categories = db.get('exam_categories');
    const options = db.get('question_options');
    const answerKeys = db.get('question_answer_keys');

    const catMap = new Map(categories.map(c => [c.id, c.name]));

    const list = questions.map(q => {
      const qOpts = options.filter(o => o.question_id === q.id);
      const correct = answerKeys.find(ak => ak.question_id === q.id);

      return {
        ...q,
        category_name: catMap.get(q.category_id) || 'Umum',
        options: qOpts,
        correct_option_id: correct?.correct_option_id || null
      };
    });

    res.json({ questions: list, categories });
  });

  app.post('/api/admin/questions', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category_id, question_text, question_type, points, difficulty, options, correct_option_index } = req.body;

      if (!category_id || !question_text || !question_type) {
        return res.status(400).json({ error: 'Informasi soal wajib diisi.' });
      }

      const now = new Date().toISOString();
      const qId = 'q_' + crypto.randomUUID();

      const newQ: Question = {
        id: qId,
        category_id,
        question_text: question_text.trim(),
        question_type,
        points: Number(points) || 10,
        difficulty: difficulty || 'sedang',
        image_path: null,
        is_active: true,
        created_at: now
      };
      db.get('questions').push(newQ);

      if (question_type === 'multiple_choice' && Array.isArray(options)) {
        options.forEach((optText: string, idx: number) => {
          const optId = `${qId}_opt_${idx}`;
          db.get('question_options').push({
            id: optId,
            question_id: qId,
            option_text: optText,
            option_order: idx + 1
          });

          if (idx === Number(correct_option_index)) {
            db.get('question_answer_keys').push({
              question_id: qId,
              correct_option_id: optId,
              created_at: now
            });
          }
        });
      }

      db.save();
      db.logAudit(req.user!.id, 'CREATE_QUESTION', 'QUESTION', qId, { question_type, points }, req.user!.full_name);

      res.status(201).json({ message: 'Soal berhasil ditambahkan ke bank soal.', question: newQ });
    } catch (err: any) {
      console.error('Create question error:', err);
      res.status(500).json({ error: 'Gagal membuat soal.' });
    }
  });

  app.put('/api/admin/questions/:id/toggle', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const q = db.get('questions').find(item => item.id === req.params.id);
    if (!q) return res.status(404).json({ error: 'Soal tidak ditemukan.' });
    q.is_active = !q.is_active;
    db.save();
    res.json({ message: `Status soal kini ${q.is_active ? 'Aktif' : 'Nonaktif'}.`, is_active: q.is_active });
  });

  app.delete('/api/admin/questions/:id', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const qIndex = db.get('questions').findIndex(item => item.id === req.params.id);
    if (qIndex === -1) return res.status(404).json({ error: 'Soal tidak ditemukan.' });

    db.get('questions').splice(qIndex, 1);
    // remove options & answer keys
    db.data.question_options = db.get('question_options').filter(o => o.question_id !== req.params.id);
    db.data.question_answer_keys = db.get('question_answer_keys').filter(ak => ak.question_id !== req.params.id);
    db.save();

    db.logAudit(req.user!.id, 'DELETE_QUESTION', 'QUESTION', req.params.id, {}, req.user!.full_name);
    res.json({ message: 'Soal berhasil dihapus.' });
  });

  // 4. Exam Schedules & Configuration
  app.get('/api/admin/exams', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const exams = db.get('exams');
    const categories = db.get('exam_categories');
    const questions = db.get('questions');

    const result = exams.map(e => {
      const cats = categories.filter(c => c.exam_id === e.id);
      const totalWeight = cats.reduce((sum, c) => sum + c.weight, 0);
      const qCount = questions.filter(q => cats.some(c => c.id === q.category_id)).length;

      return {
        ...e,
        categories: cats,
        total_weight: totalWeight,
        question_count: qCount
      };
    });

    res.json(result);
  });

  app.put('/api/admin/exams/:id', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const exam = db.get('exams').find(e => e.id === req.params.id);
      if (!exam) return res.status(404).json({ error: 'Ujian tidak ditemukan.' });

      const { title, description, duration_minutes, start_at, end_at, status, categories } = req.body;

      exam.title = title ?? exam.title;
      exam.description = description ?? exam.description;
      exam.duration_minutes = Number(duration_minutes) ?? exam.duration_minutes;
      exam.start_at = start_at ?? exam.start_at;
      exam.end_at = end_at ?? exam.end_at;
      exam.status = status ?? exam.status;

      // Update categories weights if provided
      if (Array.isArray(categories)) {
        const sumWeights = categories.reduce((sum: number, c: any) => sum + Number(c.weight || 0), 0);
        if (sumWeights !== 100) {
          return res.status(400).json({ error: `Total bobot kategori harus tepat 100%. Saat ini: ${sumWeights}%.` });
        }
        categories.forEach((catItem: any) => {
          const existing = db.get('exam_categories').find(c => c.id === catItem.id);
          if (existing) {
            existing.weight = Number(catItem.weight);
            if (catItem.name) existing.name = catItem.name;
          }
        });
      }

      db.save();
      db.logAudit(req.user!.id, 'UPDATE_EXAM_CONFIG', 'EXAM', exam.id, { title: exam.title, status: exam.status }, req.user!.full_name);

      res.json({ message: 'Pengaturan ujian berhasil disimpan.', exam });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memperbarui ujian.' });
    }
  });

  // 5. Results & Selection Decision
  app.get('/api/admin/results', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const results = db.get('exam_results');
    const attempts = db.get('exam_attempts');
    const students = db.get('student_profiles');
    const profiles = db.get('profiles');

    const list = results.map(r => {
      const attempt = attempts.find(a => a.id === r.attempt_id);
      const student = attempt ? students.find(s => s.id === attempt.student_id) : null;
      const user = student ? profiles.find(p => p.id === student.user_id) : null;

      return {
        id: r.id,
        attempt_id: r.attempt_id,
        student_id: student?.id,
        registration_number: student?.registration_number || 'N/A',
        student_name: user?.full_name || 'N/A',
        education_level: student?.education_level || 'SMP',
        objective_score: r.objective_score,
        essay_score: r.essay_score,
        final_score: r.final_score,
        selection_status: r.selection_status,
        is_published: r.is_published,
        published_at: r.published_at,
        created_at: r.created_at
      };
    });

    res.json(list);
  });

  app.put('/api/admin/results/:id/status', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const { selection_status } = req.body;
    const resItem = db.get('exam_results').find(r => r.id === req.params.id);
    if (!resItem) return res.status(404).json({ error: 'Hasil ujian tidak ditemukan.' });

    resItem.selection_status = selection_status;
    db.save();
    db.logAudit(req.user!.id, 'CHANGE_SELECTION_STATUS', 'EXAM_RESULT', resItem.id, { selection_status }, req.user!.full_name);

    res.json({ message: 'Status kelulusan berhasil diperbarui.', result: resItem });
  });

  app.post('/api/admin/results/publish', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const { is_published } = req.body;
    const now = new Date().toISOString();
    const results = db.get('exam_results');

    results.forEach(r => {
      r.is_published = !!is_published;
      if (is_published) {
        r.published_by = req.user!.id;
        r.published_at = now;
      }
    });

    db.save();
    db.logAudit(req.user!.id, is_published ? 'PUBLISH_RESULTS' : 'UNPUBLISH_RESULTS', 'EXAM_RESULTS', null, {
      count: results.length,
      published: is_published
    }, req.user!.full_name);

    res.json({
      message: is_published ? 'Hasil seleksi resmi telah dipublikasikan ke peserta.' : 'Publikasi hasil seleksi telah ditarik kembali.',
      published_count: results.length
    });
  });

  // 6. Application Settings
  app.get('/api/admin/settings', (req: AuthenticatedRequest, res: Response) => {
    res.json(db.get('settings'));
  });

  app.put('/api/admin/settings', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const current = db.get('settings');
      const updated = {
        ...current,
        ...req.body
      };
      db.data.settings = updated;
      db.save();

      db.logAudit(req.user!.id, 'UPDATE_SETTINGS', 'SETTINGS', null, req.body, req.user!.full_name);
      res.json({ message: 'Pengaturan sistem berhasil disimpan.', settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memperbarui pengaturan sistem.' });
    }
  });

  // 7. Audit Logs (Immutable History)
  app.get('/api/admin/audit-logs', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    res.json(db.get('audit_logs'));
  });

  // 8. Announcements Management
  app.get('/api/announcements', (req: AuthenticatedRequest, res: Response) => {
    const publicOnly = req.query.public === 'true';
    let list = db.get('announcements');
    if (publicOnly) {
      list = list.filter(a => a.is_published && a.audience === 'public');
    }
    res.json(list);
  });

  app.post('/api/admin/announcements', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const { title, content, audience, is_published } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });

    const now = new Date().toISOString();
    const newAnn: Announcement = {
      id: 'ann_' + crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      audience: audience || 'public',
      is_published: is_published ?? true,
      published_at: is_published ? now : null,
      created_by: req.user!.id,
      created_at: now
    };

    db.get('announcements').unshift(newAnn);
    db.save();
    db.logAudit(req.user!.id, 'CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', newAnn.id, { title }, req.user!.full_name);

    res.status(201).json({ message: 'Pengumuman berhasil diterbitkan.', announcement: newAnn });
  });

  app.delete('/api/admin/announcements/:id', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const list = db.get('announcements');
    const idx = list.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Pengumuman tidak ditemukan.' });

    list.splice(idx, 1);
    db.save();
    res.json({ message: 'Pengumuman berhasil dihapus.' });
  });

  // 9. Automated Security & RLS Audit Runner
  app.get('/api/admin/security-tests', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const suiteResults = await runSecurityAuditSuite();
      res.json(suiteResults);
    } catch (err: any) {
      console.error('Security audit error:', err);
      res.status(500).json({ error: 'Gagal menjalankan audit keamanan: ' + err.message });
    }
  });
}
