// API Client for PPDB Online Pondok Pesantren Al-Ikhlash

export interface User {
  id: string;
  email: string;
  role: 'student' | 'committee' | 'admin';
  full_name: string;
  phone?: string;
}

export interface StudentProfileData {
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
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface RegistrationData {
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

export interface DocumentData {
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

const TOKEN_KEY = 'ppdb_alikhlash_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Terjadi kesalahan pada sistem.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => apiFetch<{ message: string; token: string; user: User; registration_number: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (payload: any) => apiFetch<{ message: string; token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getMe: () => apiFetch<{ user: User; student_profile: StudentProfileData | null; registration: RegistrationData | null }>('/api/auth/me'),
  forgotPassword: (email: string) => apiFetch<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (payload: any) => apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  changePassword: (payload: any) => apiFetch<{ message: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Student
  getStudentProfile: () => apiFetch<StudentProfileData>('/api/student/profile'),
  updateStudentProfile: (payload: any) => apiFetch<{ message: string; student: StudentProfileData }>('/api/student/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getRegistration: () => apiFetch<{ registration: RegistrationData; documents: DocumentData[]; student: StudentProfileData }>('/api/student/registration'),
  submitRegistration: () => apiFetch<{ message: string; registration: RegistrationData }>('/api/student/registration/submit', {
    method: 'POST',
  }),
  uploadDocument: (payload: { document_type: string; file_name: string; mime_type: string; file_size: number; data_base64: string }) =>
    apiFetch<{ message: string }>('/api/student/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteDocument: (id: string) => apiFetch<{ message: string }>(`/api/student/documents/${id}`, {
    method: 'DELETE',
  }),
  getExamCard: () => apiFetch<any>('/api/student/exam-card'),
  getStudentExams: () => apiFetch<{ exams: any[]; is_eligible: boolean; registration_status: string }>('/api/student/exams'),
  startExam: (examId: string) => apiFetch<{ attempt_id: string; deadline_at: string; remaining_seconds: number; duration_minutes: number }>('/api/student/exams/' + examId + '/start', {
    method: 'POST',
  }),
  getExamQuestions: (examId: string) => apiFetch<{ attempt_id: string; deadline_at: string; remaining_seconds: number; questions: any[] }>('/api/student/exams/' + examId + '/questions'),
  saveExamAnswer: (payload: { attempt_id: string; question_id: string; selected_option_id?: string | null; essay_answer?: string | null; marked_for_review?: boolean }) =>
    apiFetch<{ success: boolean; saved_at: string }>('/api/student/exams/save-answer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitExam: (attemptId: string) => apiFetch<{ message: string; status: string; submitted_at: string }>('/api/student/exams/submit', {
    method: 'POST',
    body: JSON.stringify({ attempt_id: attemptId }),
  }),
  getStudentResult: () => apiFetch<any>('/api/student/results'),

  // Committee
  getCommitteeStats: () => apiFetch<any>('/api/committee/stats'),
  getApplicants: (params: { search?: string; status?: string; education_level?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.status) q.append('status', params.status);
    if (params.education_level) q.append('education_level', params.education_level);
    return apiFetch<any[]>(`/api/committee/applicants?${q.toString()}`);
  },
  getApplicantDetails: (id: string) => apiFetch<any>(`/api/committee/applicants/${id}`),
  verifyDocument: (payload: { document_id: string; verification_status: 'disetujui' | 'ditolak'; review_notes: string }) =>
    apiFetch<any>('/api/committee/verify-document', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyRegistration: (payload: { registration_id: string; status: string; review_notes: string }) =>
    apiFetch<any>('/api/committee/verify-registration', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getExamMonitoring: () => apiFetch<any[]>('/api/committee/exams/monitoring'),
  getEssaysForGrading: () => apiFetch<any[]>('/api/committee/exams/essays'),
  gradeEssay: (payload: { attempt_id: string; question_id: string; score: number; feedback: string }) =>
    apiFetch<any>('/api/committee/exams/grade-essay', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin
  getAdminStats: () => apiFetch<any>('/api/admin/stats'),
  getUsers: () => apiFetch<any[]>('/api/admin/users'),
  createUser: (payload: any) => apiFetch<any>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUserRole: (id: string, role: string) => apiFetch<any>(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  getQuestions: () => apiFetch<{ questions: any[]; categories: any[] }>('/api/admin/questions'),
  createQuestion: (payload: any) => apiFetch<any>('/api/admin/questions', { method: 'POST', body: JSON.stringify(payload) }),
  toggleQuestion: (id: string) => apiFetch<any>(`/api/admin/questions/${id}/toggle`, { method: 'PUT' }),
  deleteQuestion: (id: string) => apiFetch<any>(`/api/admin/questions/${id}`, { method: 'DELETE' }),
  getExamsConfig: () => apiFetch<any[]>('/api/admin/exams'),
  updateExamConfig: (id: string, payload: any) => apiFetch<any>(`/api/admin/exams/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getAdminResults: () => apiFetch<any[]>('/api/admin/results'),
  updateResultStatus: (id: string, selection_status: string) => apiFetch<any>(`/api/admin/results/${id}/status`, { method: 'PUT', body: JSON.stringify({ selection_status }) }),
  publishResults: (is_published: boolean) => apiFetch<any>('/api/admin/results/publish', { method: 'POST', body: JSON.stringify({ is_published }) }),
  getSettings: () => apiFetch<any>('/api/admin/settings'),
  updateSettings: (payload: any) => apiFetch<any>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  getAuditLogs: () => apiFetch<any[]>('/api/admin/audit-logs'),
  getAnnouncements: (publicOnly = false) => apiFetch<any[]>(`/api/announcements?public=${publicOnly}`),
  createAnnouncement: (payload: any) => apiFetch<any>('/api/admin/announcements', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAnnouncement: (id: string) => apiFetch<any>(`/api/admin/announcements/${id}`, { method: 'DELETE' }),
  runSecurityTests: () => apiFetch<any>('/api/admin/security-tests'),
  getDocument: (id: string) => apiFetch<DocumentData>(`/api/documents/${id}`),
};
