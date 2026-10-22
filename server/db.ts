import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'student' | 'committee' | 'admin';
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  registration_number: string;
  birth_place: string;
  birth_date: string;
  gender: 'L' | 'P';
  nik: string;
  address: string;
  school_origin: string;
  education_level: 'SMP' | 'SMA' | 'KMI';
  parent_name: string;
  parent_phone: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  student_id: string;
  academic_year: string;
  status: 'draft' | 'menunggu_verifikasi' | 'perlu_perbaikan' | 'terverifikasi' | 'siap_ujian' | 'sedang_ujian' | 'ujian_selesai' | 'menunggu_pengumuman' | 'lulus' | 'tidak_lulus';
  submitted_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  registration_id: string;
  document_type: 'pas_foto' | 'kartu_keluarga' | 'ijazah' | 'akta_kelahiran';
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  data_base64?: string;
  verification_status: 'menunggu' | 'disetujui' | 'ditolak';
  review_notes: string;
  reviewed_by: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  academic_year: string;
  duration_minutes: number;
  start_at: string;
  end_at: string;
  max_attempts: number;
  status: 'draft' | 'aktif' | 'selesai';
  published_at: string | null;
  created_by: string;
  created_at: string;
}

export interface ExamCategory {
  id: string;
  exam_id: string;
  name: string;
  weight: number; // percentage (e.g. 30)
  created_at: string;
}

export interface Question {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay';
  points: number;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  image_path: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
}

export interface QuestionAnswerKey {
  question_id: string;
  correct_option_id: string;
  created_at: string;
}

export interface ExamAssignment {
  id: string;
  exam_id: string;
  student_id: string;
  status: 'assigned' | 'completed';
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  status: 'in_progress' | 'submitted' | 'timed_out';
  objective_score: number | null;
  essay_score: number | null;
  final_score: number | null;
  created_at: string;
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  essay_answer: string | null;
  marked_for_review: boolean;
  saved_at: string;
}

export interface EssayGrade {
  id: string;
  attempt_id: string;
  question_id: string;
  graded_by: string;
  score: number;
  feedback: string;
  graded_at: string;
}

export interface ExamResult {
  id: string;
  attempt_id: string;
  objective_score: number;
  essay_score: number;
  final_score: number;
  selection_status: 'lulus' | 'tidak_lulus' | 'cadangan';
  is_published: boolean;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: 'public' | 'student' | 'committee';
  is_published: boolean;
  published_at: string | null;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AppSettings {
  pesantren_name: string;
  pesantren_address: string;
  academic_year: string;
  logo_url: string;
  passing_grade: number;
  registration_start: string;
  registration_end: string;
  cbt_exam_date: string;
  announcement_date: string;
  whatsapp_center: string;
  email_center: string;
}

export interface PasswordResetToken {
  email: string;
  token: string;
  expires_at: number;
}

export interface DatabaseSchema {
  profiles: Profile[];
  student_profiles: StudentProfile[];
  registrations: Registration[];
  documents: Document[];
  exams: Exam[];
  exam_categories: ExamCategory[];
  questions: Question[];
  question_options: QuestionOption[];
  question_answer_keys: QuestionAnswerKey[];
  exam_assignments: ExamAssignment[];
  exam_attempts: ExamAttempt[];
  student_answers: StudentAnswer[];
  essay_grades: EssayGrade[];
  exam_results: ExamResult[];
  announcements: Announcement[];
  audit_logs: AuditLog[];
  settings: AppSettings;
  password_reset_tokens: PasswordResetToken[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_ppdb_salt_2027').digest('hex');
}

export class Database {
  public data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        parsed.password_reset_tokens = parsed.password_reset_tokens || [];
        return parsed;
      } catch (err) {
        console.error('Error reading db.json, generating initial database:', err);
      }
    }

    const initial = this.generateInitialSeed();
    this.saveData(initial);
    return initial;
  }

  public save() {
    this.saveData(this.data);
  }

  private saveData(data: DatabaseSchema) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public get<T extends keyof DatabaseSchema>(table: T): DatabaseSchema[T] {
    return this.data[table];
  }

  public logAudit(actor_id: string | null, action: string, entity_type: string, entity_id: string | null, metadata: Record<string, any> = {}, actor_name?: string) {
    const entry: AuditLog = {
      id: crypto.randomUUID(),
      actor_id,
      actor_name,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString()
    };
    this.data.audit_logs.unshift(entry);
    // keep max 500 logs
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
    this.save();
    return entry;
  }

  private generateInitialSeed(): DatabaseSchema {
    const now = new Date().toISOString();

    const adminId = 'u_admin_001';
    const committeeId = 'u_committee_001';
    const studentId = 'u_student_001';
    const studentProfileId = 'sp_001';
    const registrationId = 'reg_001';

    const examId = 'exam_cbt_001';
    const catAgama = 'cat_agama';
    const catUmum = 'cat_umum';
    const catIndo = 'cat_indo';
    const catMtk = 'cat_mtk';
    const catArab = 'cat_arab';

    const profiles: Profile[] = [
      {
        id: adminId,
        full_name: 'Ustadz Abdullah Faqih, M.Pd.',
        email: 'admin@alikhlash.sch.id',
        phone: '081234567890',
        role: 'admin',
        password_hash: hashPassword('admin123'),
        created_at: now,
        updated_at: now
      },
      {
        id: committeeId,
        full_name: 'Ustadzah Nurul Hidayah, S.Pd.I.',
        email: 'panitia@alikhlash.sch.id',
        phone: '081298765432',
        role: 'committee',
        password_hash: hashPassword('panitia123'),
        created_at: now,
        updated_at: now
      },
      {
        id: studentId,
        full_name: 'Ahmad Fauzi Al-Ghifari',
        email: 'santri@alikhlash.sch.id',
        phone: '085711223344',
        role: 'student',
        password_hash: hashPassword('santri123'),
        created_at: now,
        updated_at: now
      }
    ];

    const student_profiles: StudentProfile[] = [
      {
        id: studentProfileId,
        user_id: studentId,
        registration_number: 'PPDB-2027-0001',
        birth_place: 'Surabaya',
        birth_date: '2014-05-12',
        gender: 'L',
        nik: '3578011205140003',
        address: 'Jl. Rungkut Asri No. 45, Rungkut Kidul, Surabaya',
        school_origin: 'SDIT Al-Uswah Surabaya',
        education_level: 'SMP',
        parent_name: 'Bambang Supriyanto & Siti Aminah',
        parent_phone: '081233445566',
        created_at: now,
        updated_at: now
      }
    ];

    const registrations: Registration[] = [
      {
        id: registrationId,
        student_id: studentProfileId,
        academic_year: '2027/2028',
        status: 'terverifikasi',
        submitted_at: now,
        verified_by: committeeId,
        verified_at: now,
        review_notes: 'Berkas lengkap dan sesuai ketentuan. Calon santri berhak mengikuti ujian CBT.',
        created_at: now
      }
    ];

    const documents: Document[] = [
      {
        id: 'doc_001',
        registration_id: registrationId,
        document_type: 'pas_foto',
        storage_path: '/uploads/doc_001_foto.jpg',
        file_name: 'pas_foto_ahmad_fauzi.jpg',
        mime_type: 'image/jpeg',
        file_size: 450200,
        verification_status: 'disetujui',
        review_notes: 'Foto resmi latar biru memenuhi syarat.',
        reviewed_by: committeeId,
        created_at: now
      },
      {
        id: 'doc_002',
        registration_id: registrationId,
        document_type: 'kartu_keluarga',
        storage_path: '/uploads/doc_002_kk.pdf',
        file_name: 'kartu_keluarga.pdf',
        mime_type: 'application/pdf',
        file_size: 890100,
        verification_status: 'disetujui',
        review_notes: 'KK terbaca jelas.',
        reviewed_by: committeeId,
        created_at: now
      },
      {
        id: 'doc_003',
        registration_id: registrationId,
        document_type: 'akta_kelahiran',
        storage_path: '/uploads/doc_003_akta.pdf',
        file_name: 'akta_kelahiran_ahmad.pdf',
        mime_type: 'application/pdf',
        file_size: 672000,
        verification_status: 'disetujui',
        review_notes: 'Akta kelahiran sah.',
        reviewed_by: committeeId,
        created_at: now
      }
    ];

    const exams: Exam[] = [
      {
        id: examId,
        title: 'Ujian Seleksi CBT Masuk Santri Baru 2027/2028',
        description: 'Ujian seleksi akademik dan diniyah terintegrasi mencakup Aqidah Fiqih, Pengetahuan Umum, Bahasa Indonesia, Matematika Dasar, dan Bahasa Arab Dasar.',
        academic_year: '2027/2028',
        duration_minutes: 60,
        start_at: new Date(Date.now() - 3600000).toISOString(),
        end_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        max_attempts: 1,
        status: 'aktif',
        published_at: now,
        created_by: adminId,
        created_at: now
      }
    ];

    const exam_categories: ExamCategory[] = [
      { id: catAgama, exam_id: examId, name: 'Pengetahuan Agama Islam', weight: 30, created_at: now },
      { id: catUmum, exam_id: examId, name: 'Pengetahuan Umum', weight: 20, created_at: now },
      { id: catIndo, exam_id: examId, name: 'Bahasa Indonesia', weight: 15, created_at: now },
      { id: catMtk, exam_id: examId, name: 'Matematika Dasar', weight: 15, created_at: now },
      { id: catArab, exam_id: examId, name: 'Bahasa Arab Dasar', weight: 20, created_at: now }
    ];

    // Questions, Options & Protected Answer Keys
    const questions: Question[] = [];
    const question_options: QuestionOption[] = [];
    const question_answer_keys: QuestionAnswerKey[] = [];

    // Helper to add question
    const addQ = (
      id: string,
      catId: string,
      text: string,
      type: 'multiple_choice' | 'essay',
      points: number,
      difficulty: 'mudah' | 'sedang' | 'sulit',
      opts?: string[],
      correctIdx?: number
    ) => {
      questions.push({
        id,
        category_id: catId,
        question_text: text,
        question_type: type,
        points,
        difficulty,
        image_path: null,
        is_active: true,
        created_at: now
      });

      if (type === 'multiple_choice' && opts && correctIdx !== undefined) {
        opts.forEach((optText, idx) => {
          const optId = `${id}_opt_${idx}`;
          question_options.push({
            id: optId,
            question_id: id,
            option_text: optText,
            option_order: idx + 1
          });
          if (idx === correctIdx) {
            question_answer_keys.push({
              question_id: id,
              correct_option_id: optId,
              created_at: now
            });
          }
        });
      }
    };

    // Category 1: Agama Islam (30%)
    addQ('q_ag_01', catAgama, 'Rukun Islam yang ketiga adalah kewajiban untuk menunaikan...', 'multiple_choice', 10, 'mudah', [
      'Shalat lima waktu',
      'Membayar Zakat',
      'Puasa di bulan Ramadhan',
      'Menunaikan Ibadah Haji'
    ], 1);

    addQ('q_ag_02', catAgama, 'Nabi Muhammad SAW menerima wahyu Al-Qur\'an pertama kali di Gua Hira, yaitu surat...', 'multiple_choice', 10, 'mudah', [
      'Al-Fatihah ayat 1-7',
      'Al-Baqarah ayat 1-5',
      'Al-Alaq ayat 1-5',
      'Al-Ikhlash ayat 1-4'
    ], 2);

    addQ('q_ag_03', catAgama, 'Hukum bacaan nun mati atau tanwin bertemu dengan huruf Ba (ب) disebut...', 'multiple_choice', 10, 'sedang', [
      'Izhar Halqi',
      'Idgham Bighunnah',
      'Iqlab',
      'Ikhfa Haqiqi'
    ], 2);

    // Category 2: Pengetahuan Umum (20%)
    addQ('q_um_01', catUmum, 'Sumpah Pemuda pertama kali diikrarkan oleh para pemuda Indonesia pada tanggal...', 'multiple_choice', 10, 'mudah', [
      '17 Agustus 1945',
      '28 Oktober 1928',
      '20 Mei 1908',
      '10 November 1945'
    ], 1);

    addQ('q_um_02', catUmum, 'Planet dalam tata surya yang dikenal dengan julukan "Planet Merah" adalah...', 'multiple_choice', 10, 'mudah', [
      'Venus',
      'Mars',
      'Jupiter',
      'Merkurius'
    ], 1);

    // Category 3: Bahasa Indonesia (15%)
    addQ('q_bi_01', catIndo, 'Kalimat di bawah ini yang menggunakan ejaan baku bahasa Indonesia adalah...', 'multiple_choice', 10, 'sedang', [
      'Pondok pesantren itu memiliki sistim pendidikan yang moderen.',
      'Pondok pesantren itu memiliki sistem pendidikan yang modern.',
      'Pondok pesantren itu mempunyai sistim pandidikan moderen.',
      'Pondok pesantren itu ada sistem pandidikan yang moderen.'
    ], 1);

    addQ('q_bi_02', catIndo, 'Ide pokok atau gagasan utama dalam sebuah paragraf biasanya tertuang dalam...', 'multiple_choice', 10, 'mudah', [
      'Kalimat penjelas',
      'Kalimat utama',
      'Kata sambung',
      'Judul karangan'
    ], 1);

    // Category 4: Matematika Dasar (15%)
    addQ('q_mt_01', catMtk, 'Hasil dari perhitungan 145 + 320 - 75 adalah...', 'multiple_choice', 10, 'mudah', [
      '380',
      '390',
      '400',
      '410'
    ], 1); // 145+320=465, 465-75=390

    addQ('q_mt_02', catMtk, 'Sebuah persegi memiliki keliling 36 cm. Maka luas persegi tersebut adalah...', 'multiple_choice', 10, 'sedang', [
      '81 cm²',
      '72 cm²',
      '64 cm²',
      '144 cm²'
    ], 0); // sisi = 36/4 = 9, luas = 9*9 = 81

    // Category 5: Bahasa Arab Dasar (20%)
    addQ('q_ar_01', catArab, 'Arti kosakata bahasa Arab "كِتَابٌ" (Kitaabun) dalam bahasa Indonesia adalah...', 'multiple_choice', 10, 'mudah', [
      'Pena / Pulpen',
      'Buku / Kitab',
      'Meja Tulis',
      'Papan Tulis'
    ], 1);

    addQ('q_ar_02', catArab, 'Dhamir (kata ganti) untuk "Dia seorang laki-laki" dalam bahasa Arab adalah...', 'multiple_choice', 10, 'sedang', [
      'أَنْتَ (Anta)',
      'هُوَ (Huwa)',
      'هِيَ (Hiya)',
      'نَحْنُ (Nahnu)'
    ], 1);

    // Essay questions
    addQ('q_es_01', catAgama, 'Jelaskan motivasi dan niat ananda ingin menuntut ilmu di Pondok Pesantren Al-Ikhlash serta bagaimana rencana ananda dalam menjaga adab kepada guru dan teman!', 'essay', 20, 'sedang');
    addQ('q_es_02', catArab, 'Sebutkan 3 macam fi\'il (kata kerja) dalam bahasa Arab beserta masing-masing contohnya!', 'essay', 20, 'sulit');

    const exam_assignments: ExamAssignment[] = [
      {
        id: 'asg_001',
        exam_id: examId,
        student_id: studentProfileId,
        status: 'assigned',
        created_at: now
      }
    ];

    const announcements: Announcement[] = [
      {
        id: 'ann_001',
        title: 'Pembukaan Pendaftaran Santri Baru (PPDB) Gelombang 1 TA 2027/2028',
        content: 'Pondok Pesantren Al-Ikhlash secara resmi membuka pendaftaran santri baru jenjang SMP dan SMA/KMI untuk Tahun Ajaran 2027/2028. Pendaftaran dilakukan secara daring melalui portal PPDB resmi ini. Pastikan seluruh berkas persyaratan telah disiapkan dalam format digital.',
        audience: 'public',
        is_published: true,
        published_at: now,
        created_by: adminId,
        created_at: now
      },
      {
        id: 'ann_002',
        title: 'Petunjuk Teknis dan Tata Tertib Ujian CBT Online 2027',
        content: 'Bagi calon santri yang berkas pendaftarannya telah dinyatakan Terverifikasi, silakan mengunduh Kartu Peserta Ujian dan membaca tata tertib ujian daring. Ujian Computer Based Test (CBT) berlangsung selama 60 menit dengan pengawasan sistem terpusat.',
        audience: 'student',
        is_published: true,
        published_at: now,
        created_by: adminId,
        created_at: now
      },
      {
        id: 'ann_003',
        title: 'Panduan Verifikasi Berkas bagi Tim Panitia PPDB 2027/2028',
        content: 'Seluruh panitia verifikator berkas dimohon memeriksa keabsahan NIK, Kartu Keluarga, dan Pas Foto calon santri paling lambat 2x24 jam setelah pengajuan masuk. Pastikan memberikan catatan perbaikan yang jelas jika terdapat dokumen yang belum memenuhi standar.',
        audience: 'committee',
        is_published: true,
        published_at: now,
        created_by: adminId,
        created_at: now
      }
    ];

    const audit_logs: AuditLog[] = [
      {
        id: 'log_001',
        actor_id: adminId,
        actor_name: 'Ustadz Abdullah Faqih, M.Pd.',
        action: 'INITIALIZE_SYSTEM',
        entity_type: 'SYSTEM',
        entity_id: null,
        metadata: { message: 'Inisialisasi sistem PPDB Pondok Pesantren Al-Ikhlash TA 2027/2028' },
        created_at: now
      },
      {
        id: 'log_002',
        actor_id: committeeId,
        actor_name: 'Ustadzah Nurul Hidayah, S.Pd.I.',
        action: 'VERIFY_REGISTRATION',
        entity_type: 'REGISTRATION',
        entity_id: registrationId,
        metadata: { student: 'Ahmad Fauzi Al-Ghifari', reg_number: 'PPDB-2027-0001', status: 'terverifikasi' },
        created_at: now
      }
    ];

    const settings: AppSettings = {
      pesantren_name: 'Pondok Pesantren Al-Ikhlash',
      pesantren_address: 'Kecamatan Ciawi, Kabupaten Tasikmalaya, Jawa Barat, Indonesia',
      academic_year: '2027/2028',
      logo_url: '/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg',
      passing_grade: 70,
      registration_start: '2027-01-01',
      registration_end: '2027-04-30',
      cbt_exam_date: '2027-05-15',
      announcement_date: '2027-05-25',
      whatsapp_center: '+62 812-3456-7890',
      email_center: 'ppdb@alikhlash.sch.id'
    };

    return {
      profiles,
      student_profiles,
      registrations,
      documents,
      exams,
      exam_categories,
      questions,
      question_options,
      question_answer_keys,
      exam_assignments,
      exam_attempts: [],
      student_answers: [],
      essay_grades: [],
      exam_results: [],
      announcements,
      audit_logs,
      settings,
      password_reset_tokens: []
    };
  }
}

export const db = new Database();
export { hashPassword };
