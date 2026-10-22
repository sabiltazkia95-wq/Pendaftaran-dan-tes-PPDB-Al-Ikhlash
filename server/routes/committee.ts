import { Response } from 'express';
import crypto from 'crypto';
import { db, EssayGrade } from '../db.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from './auth.ts';

export function registerCommitteeRoutes(app: any) {
  // 1. Committee Dashboard Statistics
  app.get('/api/committee/stats', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    const registrations = db.get('registrations');
    const attempts = db.get('exam_attempts');
    const documents = db.get('documents');
    const essayAnswers = db.get('student_answers').filter(a => !!a.essay_answer);
    const essayGrades = db.get('essay_grades');

    const totalApplicants = registrations.length;
    const waitingVerification = registrations.filter(r => r.status === 'menunggu_verifikasi').length;
    const needsRevision = registrations.filter(r => r.status === 'perlu_perbaikan').length;
    const readyForExam = registrations.filter(r => ['terverifikasi', 'siap_ujian'].includes(r.status)).length;
    const examInProgress = attempts.filter(a => a.status === 'in_progress').length;
    const examCompleted = attempts.filter(a => a.status === 'submitted' || a.status === 'timed_out').length;
    
    // Ungraded essays count
    const ungradedEssays = essayAnswers.filter(ea => !essayGrades.some(eg => eg.attempt_id === ea.attempt_id && eg.question_id === ea.question_id)).length;

    res.json({
      totalApplicants,
      waitingVerification,
      needsRevision,
      readyForExam,
      examInProgress,
      examCompleted,
      ungradedEssays,
      pendingDocuments: documents.filter(d => d.verification_status === 'menunggu').length
    });
  });

  // 2. Applicants List
  app.get('/api/committee/applicants', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    const { search, status, education_level } = req.query;

    const registrations = db.get('registrations');
    const studentProfiles = db.get('student_profiles');
    const profiles = db.get('profiles');
    const documents = db.get('documents');
    const attempts = db.get('exam_attempts');

    let list = registrations.map(reg => {
      const student = studentProfiles.find(sp => sp.id === reg.student_id);
      const user = student ? profiles.find(p => p.id === student.user_id) : null;
      const docs = documents.filter(d => d.registration_id === reg.id);
      const studentAttempts = student ? attempts.filter(a => a.student_id === student.id) : [];
      const latestAttempt = studentAttempts[studentAttempts.length - 1];

      return {
        id: reg.id,
        student_id: student?.id,
        user_id: user?.id,
        registration_number: student?.registration_number || 'N/A',
        full_name: user?.full_name || 'N/A',
        email: user?.email || '',
        phone: user?.phone || '',
        education_level: student?.education_level || 'SMP',
        school_origin: student?.school_origin || '',
        status: reg.status,
        submitted_at: reg.submitted_at,
        created_at: reg.created_at,
        documents_count: docs.length,
        documents_approved: docs.filter(d => d.verification_status === 'disetujui').length,
        exam_status: latestAttempt ? latestAttempt.status : 'not_started',
        objective_score: latestAttempt?.objective_score ?? null
      };
    });

    if (status && status !== 'all') {
      list = list.filter(item => item.status === status);
    }

    if (education_level && education_level !== 'all') {
      list = list.filter(item => item.education_level === education_level);
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(item => 
        item.full_name.toLowerCase().includes(q) ||
        item.registration_number.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.school_origin.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  // 3. Applicant Details
  app.get('/api/committee/applicants/:id', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    const reg = db.get('registrations').find(r => r.id === req.params.id);
    if (!reg) return res.status(404).json({ error: 'Pendaftaran tidak ditemukan.' });

    const student = db.get('student_profiles').find(sp => sp.id === reg.student_id);
    const user = student ? db.get('profiles').find(p => p.id === student.user_id) : null;
    const documents = db.get('documents').filter(d => d.registration_id === reg.id);
    const attempts = student ? db.get('exam_attempts').filter(a => a.student_id === student.id) : [];

    res.json({
      registration: reg,
      student,
      user: {
        id: user?.id,
        full_name: user?.full_name,
        email: user?.email,
        phone: user?.phone
      },
      documents,
      attempts
    });
  });

  // 4. Verify Document (Approve / Reject with Notes)
  app.post('/api/committee/verify-document', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { document_id, verification_status, review_notes } = req.body;
      if (!document_id || !verification_status) {
        return res.status(400).json({ error: 'Parameter verifikasi tidak lengkap.' });
      }

      const doc = db.get('documents').find(d => d.id === document_id);
      if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });

      doc.verification_status = verification_status;
      doc.review_notes = review_notes || '';
      doc.reviewed_by = req.user!.id;
      db.save();

      db.logAudit(req.user!.id, 'VERIFY_DOCUMENT', 'DOCUMENT', doc.id, {
        doc_type: doc.document_type,
        status: verification_status,
        notes: review_notes
      }, req.user!.full_name);

      res.json({ message: 'Status verifikasi berkas berhasil diperbarui.', document: doc });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memperbarui verifikasi dokumen.' });
    }
  });

  // 5. Verify Registration Status (Approve into 'terverifikasi' or reject into 'perlu_perbaikan')
  app.post('/api/committee/verify-registration', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { registration_id, status, review_notes } = req.body;
      if (!registration_id || !status) {
        return res.status(400).json({ error: 'Data verifikasi tidak lengkap.' });
      }

      const reg = db.get('registrations').find(r => r.id === registration_id);
      if (!reg) return res.status(404).json({ error: 'Pendaftaran tidak ditemukan.' });

      reg.status = status;
      reg.review_notes = review_notes || '';
      reg.verified_by = req.user!.id;
      reg.verified_at = new Date().toISOString();
      db.save();

      db.logAudit(req.user!.id, 'VERIFY_REGISTRATION', 'REGISTRATION', reg.id, {
        new_status: status,
        notes: review_notes
      }, req.user!.full_name);

      res.json({ message: `Status pendaftaran berhasil diubah menjadi '${status}'.`, registration: reg });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memperbarui status pendaftaran.' });
    }
  });

  // 6. Exam Live Monitoring
  app.get('/api/committee/exams/monitoring', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    const attempts = db.get('exam_attempts');
    const students = db.get('student_profiles');
    const profiles = db.get('profiles');
    const exams = db.get('exams');

    const liveData = attempts.map(att => {
      const student = students.find(s => s.id === att.student_id);
      const user = student ? profiles.find(p => p.id === student.user_id) : null;
      const exam = exams.find(e => e.id === att.exam_id);
      const answers = db.get('student_answers').filter(a => a.attempt_id === att.id);

      const remainingSeconds = Math.max(0, Math.floor((new Date(att.deadline_at).getTime() - Date.now()) / 1000));

      return {
        id: att.id,
        student_id: att.student_id,
        student_name: user?.full_name || 'N/A',
        registration_number: student?.registration_number || 'N/A',
        exam_title: exam?.title || 'Ujian CBT',
        status: att.status,
        started_at: att.started_at,
        deadline_at: att.deadline_at,
        submitted_at: att.submitted_at,
        remaining_seconds: remainingSeconds,
        answered_count: answers.filter(a => a.selected_option_id || a.essay_answer).length,
        objective_score: att.objective_score
      };
    });

    res.json(liveData);
  });

  // 7. Get Essays Awaiting Grading
  app.get('/api/committee/exams/essays', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    const answers = db.get('student_answers').filter(a => !!a.essay_answer);
    const questions = db.get('questions');
    const attempts = db.get('exam_attempts');
    const students = db.get('student_profiles');
    const profiles = db.get('profiles');
    const grades = db.get('essay_grades');

    const list = answers.map(ans => {
      const question = questions.find(q => q.id === ans.question_id);
      const attempt = attempts.find(a => a.id === ans.attempt_id);
      const student = attempt ? students.find(s => s.id === attempt.student_id) : null;
      const user = student ? profiles.find(p => p.id === student.user_id) : null;
      const grade = grades.find(g => g.attempt_id === ans.attempt_id && g.question_id === ans.question_id);

      return {
        id: ans.id,
        attempt_id: ans.attempt_id,
        question_id: ans.question_id,
        question_text: question?.question_text || '',
        max_points: question?.points || 20,
        student_name: user?.full_name || 'N/A',
        registration_number: student?.registration_number || 'N/A',
        essay_answer: ans.essay_answer,
        saved_at: ans.saved_at,
        is_graded: !!grade,
        score: grade?.score ?? null,
        feedback: grade?.feedback || '',
        graded_by: grade?.graded_by || null,
        graded_at: grade?.graded_at || null
      };
    });

    res.json(list);
  });

  // 8. Grade Essay Answer
  app.post('/api/committee/exams/grade-essay', requireAuth, requireRole(['committee', 'admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { attempt_id, question_id, score, feedback } = req.body;
      if (!attempt_id || !question_id || score === undefined) {
        return res.status(400).json({ error: 'Parameter penilaian tidak lengkap.' });
      }

      const grades = db.get('essay_grades');
      let grade = grades.find(g => g.attempt_id === attempt_id && g.question_id === question_id);
      const now = new Date().toISOString();

      if (grade) {
        grade.score = Number(score);
        grade.feedback = feedback || '';
        grade.graded_by = req.user!.id;
        grade.graded_at = now;
      } else {
        grade = {
          id: 'eg_' + crypto.randomUUID(),
          attempt_id,
          question_id,
          graded_by: req.user!.id,
          score: Number(score),
          feedback: feedback || '',
          graded_at: now
        };
        grades.push(grade);
      }

      // Recalculate Attempt Final Score
      const attempt = db.get('exam_attempts').find(a => a.id === attempt_id);
      if (attempt) {
        const attemptGrades = grades.filter(g => g.attempt_id === attempt_id);
        const totalEssayScore = attemptGrades.reduce((sum, g) => sum + g.score, 0);
        attempt.essay_score = totalEssayScore;

        // Composite Final Score: 70% Objective + 30% Essay
        const objScore = attempt.objective_score || 0;
        const finalScore = Math.round((objScore * 0.7) + (totalEssayScore * 0.3));
        attempt.final_score = finalScore;

        // Update exam_results
        const resList = db.get('exam_results');
        let examRes = resList.find(r => r.attempt_id === attempt_id);
        const passingGrade = db.get('settings').passing_grade;

        if (examRes) {
          examRes.essay_score = totalEssayScore;
          examRes.final_score = finalScore;
          examRes.selection_status = finalScore >= passingGrade ? 'lulus' : 'tidak_lulus';
        }
      }

      db.save();
      db.logAudit(req.user!.id, 'GRADE_ESSAY', 'ESSAY_GRADE', grade.id, {
        attempt_id,
        score,
        feedback
      }, req.user!.full_name);

      res.json({ message: 'Nilai esai berhasil disimpan.', grade });
    } catch (err: any) {
      console.error('Grade essay error:', err);
      res.status(500).json({ error: 'Gagal menyimpan nilai esai.' });
    }
  });
}
