import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, hashPassword, Profile } from '../db.ts';

const TOKEN_SECRET = 'ppdb_alikhlash_super_secret_jwt_key_2027';

export interface AuthUser {
  id: string;
  email: string;
  role: 'student' | 'committee' | 'admin';
  full_name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(str).digest('base64url');
  return `${str}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return null;
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name
    };
  } catch (err) {
    return null;
  }
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }

  // Ensure user still exists in DB
  const profile = db.get('profiles').find(p => p.id === user.id);
  if (!profile) {
    return res.status(401).json({ error: 'Pengguna tidak ditemukan dalam sistem.' });
  }

  req.user = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    full_name: profile.full_name
  };
  next();
};

export const requireRole = (allowedRoles: Array<'student' | 'committee' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Akses ditolak. Peran '${req.user.role}' tidak memiliki wewenang untuk tindakan ini.` });
    }
    next();
  };
};

export function registerAuthRoutes(app: any) {
  // Public Register (Calon Santri only, never allows admin/committee creation!)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { full_name, email, phone, password, confirm_password, terms_accepted } = req.body;

      if (!full_name || !email || !phone || !password) {
        return res.status(400).json({ error: 'Mohon lengkapi seluruh kolom formulir registrasi.' });
      }

      if (password !== confirm_password) {
        return res.status(400).json({ error: 'Konfirmasi kata sandi tidak cocok.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Kata sandi minimal 6 karakter demi keamanan akun.' });
      }

      if (!terms_accepted) {
        return res.status(400).json({ error: 'Anda harus menyetujui ketentuan dan kebijakan privasi PPDB.' });
      }

      const emailTrimmed = email.trim().toLowerCase();
      const existing = db.get('profiles').find(p => p.email.toLowerCase() === emailTrimmed);
      if (existing) {
        return res.status(400).json({ error: 'Alamat email ini sudah terdaftar. Silakan gunakan menu Masuk / Lupa Password.' });
      }

      const now = new Date().toISOString();
      const userId = 'u_' + crypto.randomUUID();

      // STRICT ROLE: Only 'student' can be created from registration
      const newProfile: Profile = {
        id: userId,
        full_name: full_name.trim(),
        email: emailTrimmed,
        phone: phone.trim(),
        role: 'student',
        password_hash: hashPassword(password),
        created_at: now,
        updated_at: now
      };
      db.get('profiles').push(newProfile);

      // Generate next sequential registration number: PPDB-2027-XXXX
      const studentProfiles = db.get('student_profiles');
      const nextSeq = studentProfiles.length + 1;
      const regNumber = `PPDB-2027-${String(nextSeq).padStart(4, '0')}`;

      const studentProfileId = 'sp_' + crypto.randomUUID();
      studentProfiles.push({
        id: studentProfileId,
        user_id: userId,
        registration_number: regNumber,
        birth_place: '',
        birth_date: '',
        gender: 'L',
        nik: '',
        address: '',
        school_origin: '',
        education_level: 'SMP',
        parent_name: '',
        parent_phone: phone.trim(),
        created_at: now,
        updated_at: now
      });

      // Create initial registration record
      const regId = 'reg_' + crypto.randomUUID();
      db.get('registrations').push({
        id: regId,
        student_id: studentProfileId,
        academic_year: '2027/2028',
        status: 'draft',
        submitted_at: null,
        verified_by: null,
        verified_at: null,
        review_notes: null,
        created_at: now
      });

      // Auto-assign to active exam
      const activeExam = db.get('exams').find(e => e.status === 'aktif');
      if (activeExam) {
        db.get('exam_assignments').push({
          id: 'asg_' + crypto.randomUUID(),
          exam_id: activeExam.id,
          student_id: studentProfileId,
          status: 'assigned',
          created_at: now
        });
      }

      db.logAudit(userId, 'REGISTER_STUDENT', 'PROFILE', userId, {
        email: emailTrimmed,
        registration_number: regNumber
      }, full_name);

      const tokenUser: AuthUser = {
        id: userId,
        email: emailTrimmed,
        role: 'student',
        full_name: newProfile.full_name
      };
      const token = generateToken(tokenUser);

      res.status(201).json({
        message: 'Registrasi berhasil! Akun calon santri Anda telah dibuat.',
        token,
        user: tokenUser,
        registration_number: regNumber
      });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan sistem saat registrasi. Silakan coba kembali.' });
    }
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      }

      const emailTrimmed = email.trim().toLowerCase();
      const profile = db.get('profiles').find(p => p.email.toLowerCase() === emailTrimmed);
      if (!profile) {
        return res.status(401).json({ error: 'Email atau kata sandi yang Anda masukkan salah.' });
      }

      const hash = hashPassword(password);
      if (profile.password_hash !== hash) {
        return res.status(401).json({ error: 'Email atau kata sandi yang Anda masukkan salah.' });
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      };

      const token = generateToken(authUser);

      db.logAudit(profile.id, 'LOGIN', 'PROFILE', profile.id, {
        role: profile.role
      }, profile.full_name);

      res.json({
        message: 'Login berhasil.',
        token,
        user: authUser
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan sistem saat login.' });
    }
  });

  // Get current user profile & student data
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const profile = db.get('profiles').find(p => p.id === user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profil tidak ditemukan.' });
    }

    let studentProfile: any = null;
    let registration: any = null;

    if (profile.role === 'student') {
      studentProfile = db.get('student_profiles').find(sp => sp.user_id === user.id) || null;
      if (studentProfile) {
        registration = db.get('registrations').find(r => r.student_id === studentProfile.id) || null;
      }
    }

    res.json({
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role
      },
      student_profile: studentProfile,
      registration
    });
  });

  // Forgot password (Generates cryptographic token with 15min expiry)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Alamat email wajib diisi.' });
    }
    const emailTrimmed = email.trim().toLowerCase();
    const profile = db.get('profiles').find(p => p.email.toLowerCase() === emailTrimmed);
    let resetToken = null;
    if (profile) {
      resetToken = crypto.randomBytes(24).toString('hex');
      db.data.password_reset_tokens = db.data.password_reset_tokens.filter(t => t.email !== emailTrimmed && t.expires_at > Date.now());
      db.data.password_reset_tokens.push({
        email: emailTrimmed,
        token: resetToken,
        expires_at: Date.now() + 15 * 60 * 1000 // 15 minutes
      });
      db.save();
      db.logAudit(profile.id, 'REQUEST_PASSWORD_RESET', 'PROFILE', profile.id, {}, profile.full_name);
    }
    res.json({
      message: 'Jika alamat email terdaftar di sistem PPDB kami, tautan instruksi pemulihan kata sandi telah dikirimkan ke kotak masuk email Anda.',
      reset_token: resetToken
    });
  });

  // Secure Reset password (Requires valid reset_token)
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { reset_token, new_password, confirm_password } = req.body;
    if (!reset_token || !new_password) {
      return res.status(400).json({ error: 'Token pemulihan dan kata sandi baru wajib diisi.' });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Konfirmasi kata sandi tidak cocok.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
    }

    const tokenEntry = db.data.password_reset_tokens.find(t => t.token === reset_token && t.expires_at > Date.now());
    if (!tokenEntry) {
      return res.status(400).json({ error: 'Token pemulihan tidak valid atau telah kedaluwarsa. Silakan ajukan ulang.' });
    }

    const profile = db.get('profiles').find(p => p.email.toLowerCase() === tokenEntry.email);
    if (!profile) {
      return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    }

    profile.password_hash = hashPassword(new_password);
    profile.updated_at = new Date().toISOString();
    // remove token once used
    db.data.password_reset_tokens = db.data.password_reset_tokens.filter(t => t.token !== reset_token);
    db.save();
    db.logAudit(profile.id, 'RESET_PASSWORD_WITH_TOKEN', 'PROFILE', profile.id, {}, profile.full_name);

    res.json({ message: 'Kata sandi berhasil diperbarui. Silakan login dengan kata sandi baru Anda.' });
  });

  // Authenticated Change Password
  app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { old_password, new_password, confirm_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Konfirmasi kata sandi tidak cocok.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
    }

    const profile = db.get('profiles').find(p => p.id === req.user!.id);
    if (!profile) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    if (profile.password_hash !== hashPassword(old_password)) {
      return res.status(400).json({ error: 'Kata sandi saat ini yang Anda masukkan salah.' });
    }

    profile.password_hash = hashPassword(new_password);
    profile.updated_at = new Date().toISOString();
    db.save();
    db.logAudit(profile.id, 'CHANGE_PASSWORD', 'PROFILE', profile.id, {}, profile.full_name);

    res.json({ message: 'Kata sandi berhasil diperbarui.' });
  });
}
