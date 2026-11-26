import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Lock,
  GraduationCap,
  School,
  LogIn,
  UserPlus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Users,
  Search,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Play,
  BarChart3,
  Clock,
  Trophy,
  Eye,
  EyeOff,
  X,
  FilePlus2,
} from 'lucide-react';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  defaultPlainPassword?: string;
  fullName: string;
  birthDate?: string;
  grade: string;
  school: string;
  role: 'student' | 'teacher';
  studentCode: string; // Số báo danh Trạng Nguyên, ví dụ: SBD-2601 hoặc GV-1A2
  createdAt: string;
}

export interface StudentAttemptRecord {
  id: string;
  accountId?: string;
  studentCode?: string;
  roundTitle: string;
  rankTitle: string;
  studentName: string;
  grade: string;
  score: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
  mode: 'exam' | 'practice';
}

export const ACCOUNTS_STORAGE_KEY = 'tntv_user_accounts_v2';
export const ACTIVE_SESSION_KEY = 'tntv_active_session_v2';

// Simple deterministic hash for local password verification
export function hashCredential(raw: string): string {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h_${(h >>> 0).toString(16)}`;
}

// Helper to convert Vietnamese full name into suggested username (e.g., "Lò Văn Minh" -> "vanminhtuachua")
export function suggestUsernameFromFullName(fullName: string): string {
  const normalized = fullName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '');

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return `${parts[0]}tuachua`;
  const lastTwo = parts.slice(-2).join('');
  return `${lastTwo}tuachua`;
}

// Tài khoản Giáo viên chủ nhiệm: hienlinh / 14082008
export const TEACHER_ACCOUNT: UserAccount = {
  id: 'gv-hienlinh',
  username: 'hienlinh',
  passwordHash: hashCredential('14082008'),
  defaultPlainPassword: '14082008',
  fullName: 'Cô giáo Hiền Linh',
  birthDate: '14/08/2008',
  grade: 'GVCN Lớp 1A2',
  school: 'Trường Tiểu học Tủa Chùa',
  role: 'teacher',
  studentCode: 'GV-1A2',
  createdAt: '25/11/2026',
};

// Danh sách 20 học sinh theo đúng bảng danh sách Tủa Chùa + Tài khoản Giáo viên hienlinh
export const DEFAULT_ACCOUNTS: UserAccount[] = [
  TEACHER_ACCOUNT,
  {
    id: 'hs-01',
    username: 'hoaiantuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Tòng Hoài An',
    birthDate: '09/07/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2601',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-02',
    username: 'huyenanhtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Lò Huyền Anh',
    birthDate: '15/07/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2602',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-03',
    username: 'hoanganhtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Nguyễn Hoàng Tú Anh',
    birthDate: '23/10/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2603',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-04',
    username: 'phuonganhtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Nguyễn Phương Anh',
    birthDate: '14/08/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2604',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-05',
    username: 'todangtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Tô Hải Đăng',
    birthDate: '08/03/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2605',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-06',
    username: 'huonggiangtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Giàng Hương Giang',
    birthDate: '11/03/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2606',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-07',
    username: 'lohantuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Lò Thị Ngọc Hân',
    birthDate: '16/01/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2607',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-08',
    username: 'anhkhoituachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Đặng Anh Khôi',
    birthDate: '31/10/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2608',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-09',
    username: 'trangletuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Khoàng Trang Lê',
    birthDate: '31/07/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2609',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-10',
    username: 'khanhlinhtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Đoàn Khánh Linh',
    birthDate: '06/06/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2610',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-11',
    username: 'hoanglongtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Nguyễn Hoàng Long',
    birthDate: '14/03/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2611',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-12',
    username: 'khaiminhtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Nông Ngọc Khải Minh',
    birthDate: '25/10/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2612',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-13',
    username: 'hainamtuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Phạm Hải Nam',
    birthDate: '11/08/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2613',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-14',
    username: 'kimngantuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Tòng Thị Kim Ngân',
    birthDate: '07/01/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2614',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-15',
    username: 'baongantuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Trần Bảo Ngân',
    birthDate: '19/11/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2615',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-16',
    username: 'anhtutuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Nguyễn Ngọc Anh Tú',
    birthDate: '13/07/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2616',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-17',
    username: 'chithientuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Vừ Chí Thiện',
    birthDate: '09/04/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2617',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-18',
    username: 'minhthutuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Sùng Minh Thư',
    birthDate: '18/09/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2618',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-19',
    username: 'nhauyentuachua',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Lò Nhã Uyên',
    birthDate: '16/11/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2619',
    createdAt: '25/11/2026',
  },
  {
    id: 'hs-20',
    username: 'tongkhoi1a2',
    passwordHash: hashCredential('Tuachua2026'),
    defaultPlainPassword: 'Tuachua2026',
    fullName: 'Tòng Minh Khôi',
    birthDate: '23/05/2020',
    grade: 'Lớp 1A2',
    school: 'Trường Tiểu học Tủa Chùa',
    role: 'student',
    studentCode: 'SBD-2620',
    createdAt: '25/11/2026',
  },
];

export function loadStoredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed: UserAccount[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const withUpdatedTeacher = parsed.map((a) =>
          a.username.toLowerCase() === 'hienlinh' ? TEACHER_ACCOUNT : a
        );
        const existingUsernames = new Set(
          withUpdatedTeacher.map((a) => a.username.toLowerCase())
        );
        const missingDefaults = DEFAULT_ACCOUNTS.filter(
          (d) => !existingUsernames.has(d.username.toLowerCase())
        );
        const merged = [
          ...missingDefaults.filter((d) => d.role === 'teacher'),
          ...withUpdatedTeacher,
          ...missingDefaults.filter((d) => d.role !== 'teacher'),
        ];
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(
      ACCOUNTS_STORAGE_KEY,
      JSON.stringify(DEFAULT_ACCOUNTS)
    );
  } catch {
    // ignore
  }
  return DEFAULT_ACCOUNTS;
}

export function loadActiveSession(): UserAccount | null {
  try {
    const raw =
      localStorage.getItem(ACTIVE_SESSION_KEY) ||
      sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function saveActiveSession(
  account: UserAccount | null,
  remember = true
) {
  try {
    if (account) {
      if (remember) {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(account));
        sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      } else {
        sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(account));
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export type AccountTabType =
  | 'teacher_monitor'
  | 'teacher_create_exam'
  | 'roster'
  | 'profile'
  | 'login'
  | 'register';

interface AccountCenterProps {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  examHistory: StudentAttemptRecord[];
  examBuilderNode?: React.ReactNode;
  initialTab?: AccountTabType;
  onLoginSuccess: (account: UserAccount, remember?: boolean) => void;
  onRegisterSuccess: (
    account: UserAccount,
    keepCurrentSession?: boolean
  ) => void;
  onUpdateProfile: (updated: UserAccount) => void;
  onLogout: () => void;
  onGoToExam: () => void;
}

export const AccountCenter: React.FC<AccountCenterProps> = ({
  currentUser,
  accounts,
  examHistory,
  examBuilderNode,
  initialTab = 'profile',
  onLoginSuccess,
  onRegisterSuccess,
  onUpdateProfile,
  onLogout,
  onGoToExam,
}) => {
  // Determine appropriate active tab based on who is logged in:
  // - Student: ALWAYS 'profile' (only sees their own account)
  // - Teacher: 'teacher_monitor' | 'teacher_create_exam' | 'roster' | 'register' | 'profile'
  // - Logged out (!currentUser): 'login' | 'register'
  const [authTab, setAuthTab] = useState<AccountTabType>(() => {
    if (!currentUser) {
      return initialTab === 'register' ? 'register' : 'login';
    }
    if (currentUser.role === 'student') {
      return 'profile';
    }
    // Teacher
    if (
      initialTab === 'teacher_monitor' ||
      initialTab === 'teacher_create_exam' ||
      initialTab === 'roster' ||
      initialTab === 'register' ||
      initialTab === 'profile'
    ) {
      return initialTab;
    }
    return 'teacher_monitor';
  });

  // Roster Search State (Teacher only)
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Teacher Monitor Filter & Selected Student Modal State
  const [monitorSearch, setMonitorSearch] = useState<string>('');
  const [monitorFilter, setMonitorFilter] = useState<
    'all' | 'practiced' | 'not_practiced' | 'passed' | 'needs_help'
  >('all');
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(
    null
  );

  // Login Form State
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [notFoundUserQuery, setNotFoundUserQuery] = useState<string | null>(
    null
  );

  // Register Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [usernameManuallyEdited, setUsernameManuallyEdited] =
    useState<boolean>(false);
  const [regPassword, setRegPassword] = useState<string>('Tuachua2026');
  const [regConfirmPassword, setRegConfirmPassword] =
    useState<string>('Tuachua2026');
  const [regBirthDate, setRegBirthDate] = useState<string>('');
  const [regGrade, setRegGrade] = useState<string>('Lớp 1A2');
  const [regSchool, setRegSchool] = useState<string>(
    'Trường Tiểu học Tủa Chùa'
  );

  // Edit Profile State
  const [editFullName, setEditFullName] = useState<string>(
    currentUser?.fullName || ''
  );
  const [editBirthDate, setEditBirthDate] = useState<string>(
    currentUser?.birthDate || ''
  );
  const [editGrade, setEditGrade] = useState<string>(
    currentUser?.grade || 'Lớp 1A2'
  );
  const [editSchool, setEditSchool] = useState<string>(
    currentUser?.school || 'Trường Tiểu học Tủa Chùa'
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync active tab and profile fields when user or requested initialTab changes without remounting
  useEffect(() => {
    if (!currentUser) {
      setAuthTab(initialTab === 'register' ? 'register' : 'login');
    } else if (currentUser.role === 'student') {
      setAuthTab('profile');
    } else if (
      initialTab === 'teacher_monitor' ||
      initialTab === 'teacher_create_exam' ||
      initialTab === 'roster' ||
      initialTab === 'register' ||
      initialTab === 'profile'
    ) {
      setAuthTab(initialTab);
    } else {
      setAuthTab('teacher_monitor');
    }
  }, [currentUser?.id, currentUser?.role, initialTab]);

  useEffect(() => {
    setEditFullName(currentUser?.fullName || '');
    setEditBirthDate(currentUser?.birthDate || '');
    setEditGrade(currentUser?.grade || 'Lớp 1A2');
    setEditSchool(currentUser?.school || 'Trường Tiểu học Tủa Chùa');
  }, [currentUser]);

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setNotFoundUserQuery(null);
  };

  const studentAccounts = useMemo(
    () => accounts.filter((a) => a.role === 'student'),
    [accounts]
  );

  const nextStudentCodeNumber = useMemo(() => {
    const maxNum = studentAccounts.reduce((max, acc) => {
      const m = acc.studentCode.match(/(\d+)$/);
      const num = m ? parseInt(m[1], 10) : 0;
      return num > max ? num : max;
    }, 2600);
    return maxNum + 1;
  }, [studentAccounts]);

  // Logged-in student's own personal exam attempts
  const myPersonalAttempts = useMemo(() => {
    if (!currentUser) return [];
    return examHistory.filter(
      (h) =>
        h.accountId === currentUser.id ||
        h.studentCode === currentUser.studentCode ||
        h.studentName.trim().toLowerCase() ===
          currentUser.fullName.trim().toLowerCase()
    );
  }, [currentUser, examHistory]);

  // Teacher-only roster filter (only shows students to teacher)
  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return studentAccounts;
    return studentAccounts.filter(
      (acc) =>
        acc.fullName.toLowerCase().includes(q) ||
        acc.username.toLowerCase().includes(q) ||
        (acc.birthDate && acc.birthDate.includes(q)) ||
        acc.studentCode.toLowerCase().includes(q)
    );
  }, [studentAccounts, rosterSearch]);

  // Compute per-student practice analytics for Teacher Dashboard
  const studentProgressRows = useMemo(() => {
    return studentAccounts.map((stu) => {
      const stuAttempts = examHistory.filter(
        (h) =>
          h.accountId === stu.id ||
          h.studentCode === stu.studentCode ||
          h.studentName.trim().toLowerCase() ===
            stu.fullName.trim().toLowerCase()
      );
      const attemptCount = stuAttempts.length;
      const bestAttempt =
        attemptCount > 0
          ? stuAttempts.reduce((best, cur) => {
              const curRatio = cur.maxScore > 0 ? cur.score / cur.maxScore : 0;
              const bestRatio =
                best.maxScore > 0 ? best.score / best.maxScore : 0;
              if (curRatio !== bestRatio) return curRatio > bestRatio ? cur : best;
              return cur.score > best.score ? cur : best;
            })
          : null;
      const highestScore = bestAttempt ? bestAttempt.score : 0;
      const bestMaxScore = bestAttempt ? bestAttempt.maxScore : 300;
      const bestRatio =
        bestAttempt && bestAttempt.maxScore > 0
          ? bestAttempt.score / bestAttempt.maxScore
          : 0;
      const avgScore =
        attemptCount > 0
          ? Math.round(
              stuAttempts.reduce((sum, a) => sum + a.score, 0) / attemptCount
            )
          : 0;
      const latestAttempt = attemptCount > 0 ? stuAttempts[0] : null;

      return {
        student: stu,
        attempts: stuAttempts,
        attemptCount,
        highestScore,
        bestMaxScore,
        bestRatio,
        avgScore,
        bestRank: bestAttempt?.rankTitle || '—',
        latestCompletedAt: latestAttempt?.completedAt || 'Chưa làm bài',
        latestScore: latestAttempt ? latestAttempt.score : null,
      };
    });
  }, [studentAccounts, examHistory]);

  const teacherStats = useMemo(() => {
    const totalStudents = studentProgressRows.length;
    const practicedStudents = studentProgressRows.filter(
      (r) => r.attemptCount > 0
    ).length;
    const notPracticedStudents = totalStudents - practicedStudents;
    const totalAttempts = studentProgressRows.reduce(
      (sum, r) => sum + r.attemptCount,
      0
    );
    const allScores = studentProgressRows
      .filter((r) => r.attemptCount > 0)
      .map((r) => r.highestScore);
    const classAvgBestScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;
    const classMaxScore = allScores.length > 0 ? Math.max(...allScores) : 0;

    return {
      totalStudents,
      practicedStudents,
      notPracticedStudents,
      totalAttempts,
      classAvgBestScore,
      classMaxScore,
    };
  }, [studentProgressRows]);

  const filteredMonitorRows = useMemo(() => {
    const q = monitorSearch.trim().toLowerCase();
    return studentProgressRows.filter((row) => {
      if (monitorFilter === 'practiced' && row.attemptCount === 0) return false;
      if (monitorFilter === 'not_practiced' && row.attemptCount > 0)
        return false;
      if (
        monitorFilter === 'passed' &&
        (row.attemptCount === 0 || row.bestRatio < 2 / 3)
      )
        return false;
      if (
        monitorFilter === 'needs_help' &&
        (row.attemptCount === 0 || row.bestRatio >= 2 / 3)
      )
        return false;

      if (!q) return true;
      return (
        row.student.fullName.toLowerCase().includes(q) ||
        row.student.username.toLowerCase().includes(q) ||
        row.student.studentCode.toLowerCase().includes(q)
      );
    });
  }, [studentProgressRows, monitorSearch, monitorFilter]);

  const inspectedStudentRow = useMemo(() => {
    if (!inspectedStudentId) return null;
    return (
      studentProgressRows.find((r) => r.student.id === inspectedStudentId) ||
      null
    );
  }, [studentProgressRows, inspectedStudentId]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartRegisterFromQuery = (rawQuery: string) => {
    clearFeedback();
    const cleaned = rawQuery.trim();
    if (cleaned.includes(' ')) {
      setRegFullName(cleaned);
      const suggested = suggestUsernameFromFullName(cleaned);
      setRegUsername(suggested);
      setUsernameManuallyEdited(false);
    } else if (cleaned) {
      setRegUsername(cleaned.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      setUsernameManuallyEdited(true);
    }
    setAuthTab('register');
  };

  const handleFullNameChangeInRegister = (val: string) => {
    setRegFullName(val);
    if (!usernameManuallyEdited) {
      const baseSuggestion = suggestUsernameFromFullName(val);
      if (!baseSuggestion) {
        setRegUsername('');
        return;
      }
      let candidate = baseSuggestion;
      let suffix = 1;
      while (accounts.some((a) => a.username.toLowerCase() === candidate)) {
        candidate = `${baseSuggestion}${suffix}`;
        suffix += 1;
      }
      setRegUsername(candidate);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const cleanUser = loginUsername.trim().toLowerCase();
    if (!cleanUser || !loginPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.');
      return;
    }

    const found = accounts.find(
      (acc) => acc.username.toLowerCase() === cleanUser
    );
    if (!found) {
      setNotFoundUserQuery(cleanUser);
      setErrorMsg(
        `Tài khoản "${cleanUser}" chưa tồn tại. Em có thể nhấn nút Tạo tài khoản mới ngay bên dưới!`
      );
      return;
    }

    const exactMatch = found.passwordHash === hashCredential(loginPassword);
    const trimmedMatch =
      found.passwordHash === hashCredential(loginPassword.trim());
    if (!exactMatch && !trimmedMatch) {
      setErrorMsg('Mật khẩu chưa chính xác. Vui lòng kiểm tra lại.');
      return;
    }

    onLoginSuccess(found, rememberMe);
    setEditFullName(found.fullName);
    setEditBirthDate(found.birthDate || '');
    setEditGrade(found.grade);
    setEditSchool(found.school);
    setLoginPassword('');

    if (found.role === 'teacher') {
      setAuthTab('teacher_monitor');
      setSuccessMsg(
        `Đăng nhập tài khoản Giáo viên thành công! Chào mừng ${found.fullName}.`
      );
    } else {
      setAuthTab('profile');
      setSuccessMsg(`Đăng nhập thành công! Xin chào em ${found.fullName}.`);
    }
  };

  const handleRegisterSubmit = (
    e: React.FormEvent,
    startExamImmediately = false
  ) => {
    e.preventDefault();
    clearFeedback();

    if (!regFullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên học sinh.');
      return;
    }

    const cleanUser = regUsername.trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 3) {
      setErrorMsg('Tên đăng nhập cần có ít nhất 3 ký tự (viết liền không dấu).');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUser)) {
      setErrorMsg(
        'Tên đăng nhập chỉ được chứa chữ cái không dấu, chữ số hoặc dấu gạch dưới (_).'
      );
      return;
    }
    if (accounts.some((acc) => acc.username.toLowerCase() === cleanUser)) {
      setErrorMsg('Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg('Mật khẩu cần có ít nhất 4 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    const newAccount: UserAccount = {
      id: `acc-${Date.now()}`,
      username: cleanUser,
      passwordHash: hashCredential(regPassword),
      defaultPlainPassword: regPassword,
      fullName: regFullName.trim(),
      birthDate: regBirthDate.trim() || '2020',
      grade: regGrade.trim() || 'Lớp 1A2',
      school: regSchool.trim() || 'Trường Tiểu học Tủa Chùa',
      role: 'student',
      studentCode: `SBD-${nextStudentCodeNumber}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    // If teacher is logged in and adding a student, keep teacher session active
    if (currentUser?.role === 'teacher' && !startExamImmediately) {
      onRegisterSuccess(newAccount, true);
      setRegFullName('');
      setRegUsername('');
      setRegBirthDate('');
      setAuthTab('roster');
      setSuccessMsg(
        `Đã thêm tài khoản học sinh ${newAccount.fullName} (Tên đăng nhập: ${newAccount.username} · SBD: ${newAccount.studentCode}) vào danh sách lớp!`
      );
      return;
    }

    onRegisterSuccess(newAccount, false);
    setEditFullName(newAccount.fullName);
    setEditBirthDate(newAccount.birthDate || '');
    setEditGrade(newAccount.grade);
    setEditSchool(newAccount.school);
    setRegFullName('');
    setRegUsername('');
    setRegBirthDate('');

    if (startExamImmediately) {
      onGoToExam();
    } else {
      setAuthTab('profile');
      setSuccessMsg(
        `Đã tạo tài khoản thành công cho em ${newAccount.fullName} (Tên đăng nhập: ${newAccount.username} · Số báo danh: ${newAccount.studentCode})!`
      );
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!currentUser) return;
    if (!editFullName.trim()) {
      setErrorMsg('Họ và tên không được để trống.');
      return;
    }
    const updated: UserAccount = {
      ...currentUser,
      fullName: editFullName.trim(),
      birthDate: editBirthDate.trim() || currentUser.birthDate,
      grade: editGrade.trim() || currentUser.grade,
      school: editSchool.trim() || currentUser.school,
    };
    onUpdateProfile(updated);
    setSuccessMsg('Đã cập nhật thông tin tài khoản của em thành công!');
  };

  const handleLogoutClick = () => {
    clearFeedback();
    onLogout();
    setLoginUsername('');
    setLoginPassword('');
    setAuthTab('login');
    setSuccessMsg(
      'Đã đăng xuất thành công! Vui lòng nhập Tên đăng nhập và Mật khẩu để đăng nhập tài khoản khác.'
    );
  };

  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `Họ tên: ${acc.fullName} | Tên đăng nhập: ${acc.username} | Mật khẩu: ${
      acc.defaultPlainPassword || 'Tuachua2026'
    }`;
    try {
      navigator.clipboard?.writeText(text)?.catch(() => {});
    } catch {
      // ignore clipboard errors on non-HTTPS contexts
    }
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ============================================================================
  // CASE 1: STUDENT VIEW (CHỈ HIỂN THỊ TÀI KHOẢN CỦA BẢN THÂN HỌC SINH + NÚT ĐĂNG XUẤT)
  // ============================================================================
  if (currentUser && currentUser.role === 'student') {
    const bestMyAttempt =
      myPersonalAttempts.length > 0
        ? myPersonalAttempts.reduce((best, cur) => {
            const curRatio = cur.maxScore > 0 ? cur.score / cur.maxScore : 0;
            const bestRatio =
              best.maxScore > 0 ? best.score / best.maxScore : 0;
            return curRatio > bestRatio ? cur : best;
          })
        : null;
    const highestMyScore = bestMyAttempt ? bestMyAttempt.score : 0;
    const highestMyMaxScore = bestMyAttempt ? bestMyAttempt.maxScore : 300;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header with Prominent Logout Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>TÀI KHOẢN CÁ NHÂN HỌC SINH · {currentUser.grade}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                Xin chào em {currentUser.fullName}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Số báo danh:{' '}
                <strong className="text-teal-800 font-mono">
                  {currentUser.studentCode}
                </strong>{' '}
                · Tên đăng nhập:{' '}
                <code className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {currentUser.username}
                </code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGoToExam}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4" />
                Vào làm bài thi
              </button>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất tài khoản
              </button>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-medium flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Student Personal Profile Card & Edit Form (No other students or teacher shown) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Personal Student ID Card */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white font-display font-extrabold text-xl flex items-center justify-center shrink-0">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-teal-700">
                    THẺ THÍ SINH TRẠNG NGUYÊN
                  </div>
                  <h2 className="text-lg font-display font-extrabold text-slate-900">
                    {currentUser.fullName}
                  </h2>
                  <div className="text-xs text-slate-500 tabular-nums">
                    Tài khoản: <strong>{currentUser.username}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-200/80 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số báo danh:</span>
                  <strong className="font-mono text-teal-800 tabular-nums">
                    {currentUser.studentCode}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày sinh:</span>
                  <strong className="text-slate-800 tabular-nums">
                    {currentUser.birthDate || '—'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khối / Lớp:</span>
                  <strong className="text-slate-800">{currentUser.grade}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trường:</span>
                  <strong className="text-slate-800 text-right">
                    {currentUser.school}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số lần đã luyện thi:</span>
                  <strong className="text-teal-800 tabular-nums">
                    {myPersonalAttempts.length} lượt
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Điểm cao nhất của em:</span>
                  <strong className="text-amber-700 tabular-nums">
                    {highestMyScore} / {highestMyMaxScore} điểm
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onGoToExam}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Vào phòng làm bài thi
                </button>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-rose-600 bg-white hover:bg-rose-50 text-rose-700 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất khỏi tài khoản này
                </button>
              </div>
            </div>

            {/* Personal Profile Update Form */}
            <form
              onSubmit={handleProfileSave}
              className="md:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                Thông tin cá nhân của em
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên học sinh
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ngày sinh (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      placeholder="Ví dụ: 09/07/2020"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Khối / Lớp
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Trường Tiểu học
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={editSchool}
                      onChange={(e) => setEditSchool(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Lưu thông tin cá nhân
                </button>
              </div>
            </form>
          </div>

          {/* Student's Own Personal Exam Attempts */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Kết quả các lần làm bài của riêng em ({myPersonalAttempts.length}{' '}
              lượt)
            </h3>
            {myPersonalAttempts.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
                Em chưa có lượt nộp bài nào. Hãy nhấn{' '}
                <strong>"Vào làm bài thi"</strong> để bắt đầu luyện tập nhé!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {myPersonalAttempts.map((att, idx) => (
                  <div
                    key={att.id}
                    className="p-4 bg-white hover:bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        Lần #{myPersonalAttempts.length - idx}: {att.roundTitle}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Thời gian làm: {formatDuration(att.timeSpentSeconds)} ·
                        Ngày nộp: {att.completedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                        {att.rankTitle}
                      </span>
                      <div className="text-right tabular-nums">
                        <div className="font-display font-extrabold text-teal-800">
                          {att.score} / {att.maxScore} điểm
                        </div>
                        <div className="text-xs font-semibold text-emerald-700">
                          Đúng {att.correctCount}/{att.totalQuestions} câu
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CASE 2: LOGGED OUT VIEW (!currentUser) -> GIAO DIỆN ĐĂNG NHẬP TRẠNG NGUYÊN
  // ============================================================================
  if (!currentUser) {
    const activeGuestTab = authTab === 'register' ? 'register' : 'login';

    return (
      <div className="w-full flex items-center justify-center py-4 sm:py-8 px-3 sm:px-6">
        <div className="relative w-full max-w-[980px] bg-white rounded-[28px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/90">
          {/* Subtle traditional corner flourishes */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 w-12 h-12 text-rose-300/80 z-20"
            viewBox="0 0 48 48"
            fill="none"
          >
            <path
              d="M2 46V18C2 9.163 9.163 2 18 2H46"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M8 38V18C8 12.477 12.477 8 18 8H38"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 w-12 h-12 text-rose-300/80 z-20 scale-x-[-1]"
            viewBox="0 0 48 48"
            fill="none"
          >
            <path
              d="M2 46V18C2 9.163 9.163 2 18 2H46"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M8 38V18C8 12.477 12.477 8 18 8H38"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 w-12 h-12 text-rose-300/80 z-20 scale-y-[-1]"
            viewBox="0 0 48 48"
            fill="none"
          >
            <path
              d="M2 46V18C2 9.163 9.163 2 18 2H46"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M8 38V18C8 12.477 12.477 8 18 8H38"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 w-12 h-12 text-rose-300/80 z-20 scale-[-1]"
            viewBox="0 0 48 48"
            fill="none"
          >
            <path
              d="M2 46V18C2 9.163 9.163 2 18 2H46"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M8 38V18C8 12.477 12.477 8 18 8H38"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>

          {/* Left Column: Trạng Nguyên Illustrated Scene + Welcome Bubble */}
          <div className="relative bg-[#FBE1B2] min-h-[300px] sm:min-h-[380px] md:min-h-[580px] flex items-end justify-center overflow-hidden">
            <img
              src="/assets/login_illustration.jpg"
              alt="Minh họa Trạng Nguyên Tiếng Việt"
              className="w-full h-full object-cover object-bottom select-none"
            />

            {/* Speech Bubble above Mascot */}
            <div className="absolute top-6 left-5 sm:top-9 sm:left-6 max-w-[205px] sm:max-w-[225px] bg-white/95 backdrop-blur-xs rounded-2xl px-4 py-3 shadow-md border border-amber-100 text-center z-10">
              <p className="text-xs sm:text-[13px] font-semibold text-slate-700 leading-snug">
                Chào mừng bạn đến với cổng đăng nhập của{' '}
                <strong className="text-[#B8252A]">
                  Trạng Nguyên Tiếng Việt
                </strong>{' '}
                - Lớp 1A2
              </p>
              <span
                aria-hidden="true"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-amber-100"
              />
            </div>
          </div>

          {/* Right Column: Clean Login / Register Form */}
          <div className="bg-white px-6 py-8 sm:px-11 sm:py-12 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 text-center mb-6">
              {activeGuestTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h1>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-medium space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                {notFoundUserQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStartRegisterFromQuery(notFoundUserQuery)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B8252A] hover:bg-[#9E1D22] text-white text-xs font-bold cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Tạo tài khoản &quot;{notFoundUserQuery}&quot; ngay →
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {activeGuestTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="rounded-full bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-5 py-2">
                  <label className="block text-[11px] font-medium text-slate-500 leading-tight">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div className="rounded-full bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-5 py-3 flex items-center gap-2">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-500 placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
                    aria-label={
                      showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                    }
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="pt-0.5 pb-1">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#4B5563] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Ghi nhớ đăng nhập
                    </span>
                  </label>
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#B8252A] hover:bg-[#9E1D22] text-white text-base font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Đăng nhập
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartRegisterFromQuery(loginUsername)}
                    className="w-full py-3 rounded-full bg-white hover:bg-rose-50 text-[#B8252A] border-2 border-[#B8252A] text-base font-bold transition-colors cursor-pointer"
                  >
                    Tạo tài khoản
                  </button>
                </div>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200" />
                  <span className="px-3 bg-white text-xs font-medium text-slate-500 whitespace-nowrap">
                    Hoặc
                  </span>
                  <div className="w-full border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={onGoToExam}
                  className="w-full py-2 inline-flex items-center justify-center gap-2 text-sm font-bold text-[#B8252A] hover:underline cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Vào luyện thi ngay (Chế độ Khách)
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => handleRegisterSubmit(e, false)}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-4 py-2">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Họ và tên học sinh *
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) =>
                        handleFullNameChangeInRegister(e.target.value)
                      }
                      placeholder="VD: Lò Văn Minh"
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-4 py-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-medium text-slate-500">
                        Tên đăng nhập *
                      </label>
                      {regFullName.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setUsernameManuallyEdited(false);
                            setRegUsername(
                              suggestUsernameFromFullName(regFullName)
                            );
                          }}
                          className="text-[10px] font-bold text-[#B8252A] hover:underline cursor-pointer"
                        >
                          Gợi ý
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => {
                        setUsernameManuallyEdited(true);
                        setRegUsername(e.target.value);
                      }}
                      placeholder="vanminhtuachua"
                      className="w-full bg-transparent text-sm font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-4 py-2">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Ngày sinh (DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      placeholder="15/08/2020"
                      className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-4 py-2">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Khối / Lớp *
                    </label>
                    <input
                      type="text"
                      value={regGrade}
                      onChange={(e) => setRegGrade(e.target.value)}
                      placeholder="Lớp 1A2"
                      className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-4 py-2">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Mật khẩu *
                    </label>
                    <input
                      type="text"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setRegConfirmPassword(e.target.value);
                      }}
                      className="w-full bg-transparent text-sm font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#EBEBEB] border border-[#CECECE] focus-within:border-[#B8252A] focus-within:bg-white transition-colors px-4 py-2">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Trường Tiểu học
                    </label>
                    <input
                      type="text"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={(e) => handleRegisterSubmit(e as any, true)}
                    className="w-full py-3 rounded-full bg-[#B8252A] hover:bg-[#9E1D22] text-white text-sm sm:text-base font-bold transition-colors cursor-pointer"
                  >
                    Tạo tài khoản &amp; Vào thi ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearFeedback();
                      setAuthTab('login');
                    }}
                    className="w-full py-2.5 rounded-full bg-white hover:bg-rose-50 text-[#B8252A] border-2 border-[#B8252A] text-sm font-bold transition-colors cursor-pointer"
                  >
                    Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CASE 3: TEACHER VIEW (currentUser.role === 'teacher')
  // Giáo viên có toàn quyền theo dõi tiến độ học sinh, xem danh sách lớp, tạo đề mới, tạo TK HS mới và Đăng xuất
  // ============================================================================
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Teacher Header & Navigation Tabs + Prominent Logout Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>TRANG QUẢN LÝ CỦA GIÁO VIÊN CHỦ NHIỆM · LỚP 1A2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
              {currentUser.fullName} ({currentUser.username})
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Quản lý <strong>{studentAccounts.length} học sinh</strong> · Theo
              dõi kết quả luyện thi và tạo đề thi mới cho lớp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setAuthTab('teacher_monitor');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  authTab === 'teacher_monitor'
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'text-teal-900 hover:bg-white/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Theo dõi HS ({studentAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setAuthTab('teacher_create_exam');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  authTab === 'teacher_create_exam'
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'text-teal-900 hover:bg-white/60'
                }`}
              >
                <FilePlus2 className="w-4 h-4" />
                + Tạo đề mới
              </button>
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setAuthTab('roster');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  authTab === 'roster'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Danh sách TK lớp
              </button>
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setAuthTab('register');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  authTab === 'register'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                + Cấp TK Học sinh
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-medium flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1 (TEACHER): STUDENT PROGRESS MONITORING */}
        {authTab === 'teacher_monitor' && (
          <div className="space-y-6">
            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold text-slate-500">
                  Tổng sĩ số lớp 1A2
                </div>
                <div className="text-2xl font-display font-extrabold text-slate-900 tabular-nums mt-1">
                  {teacherStats.totalStudents} học sinh
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Trường Tiểu học Tủa Chùa
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-xs font-semibold text-emerald-800">
                  Đã tham gia luyện thi
                </div>
                <div className="text-2xl font-display font-extrabold text-emerald-800 tabular-nums mt-1">
                  {teacherStats.practicedStudents} / {teacherStats.totalStudents}{' '}
                  HS
                </div>
                <div className="text-xs text-emerald-700 mt-1 tabular-nums">
                  Còn {teacherStats.notPracticedStudents} HS chưa làm bài
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
                <div className="text-xs font-semibold text-teal-800">
                  Tổng số lượt nộp bài
                </div>
                <div className="text-2xl font-display font-extrabold text-teal-900 tabular-nums mt-1">
                  {teacherStats.totalAttempts} lượt thi
                </div>
                <div className="text-xs text-teal-700 mt-1">
                  Lưu tự động khi học sinh nộp bài
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-xs font-semibold text-amber-900">
                  Điểm TB / Điểm cao nhất
                </div>
                <div className="text-2xl font-display font-extrabold text-amber-900 tabular-nums mt-1">
                  {teacherStats.classAvgBestScore}đ /{' '}
                  {teacherStats.classMaxScore}đ
                </div>
                <div className="text-xs text-amber-800 mt-1">
                  Thang điểm chuẩn 300 điểm
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="relative flex-1 min-w-[230px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={monitorSearch}
                  onChange={(e) => setMonitorSearch(e.target.value)}
                  placeholder="Tìm học sinh theo họ tên, SBD hoặc tên đăng nhập..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    id: 'all',
                    label: `Tất cả (${teacherStats.totalStudents})`,
                  },
                  {
                    id: 'practiced',
                    label: `Đã luyện thi (${teacherStats.practicedStudents})`,
                  },
                  {
                    id: 'not_practiced',
                    label: `Chưa làm bài (${teacherStats.notPracticedStudents})`,
                  },
                  {
                    id: 'passed',
                    label: 'Đạt tốt (>= 67%)',
                  },
                  {
                    id: 'needs_help',
                    label: 'Cần rèn thêm (< 67%)',
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMonitorFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      monitorFilter === f.id
                        ? 'bg-teal-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Student Monitoring Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                    <th className="py-3 px-4">STT</th>
                    <th className="py-3 px-4">Học sinh & Tên đăng nhập</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Số lượt thi</th>
                    <th className="py-3 px-4">Điểm cao nhất</th>
                    <th className="py-3 px-4">Điểm TB</th>
                    <th className="py-3 px-4">Danh hiệu đạt được</th>
                    <th className="py-3 px-4">Lần nộp gần nhất</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredMonitorRows.map((row, idx) => {
                    const hasPracticed = row.attemptCount > 0;
                    return (
                      <tr
                        key={row.student.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-500 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {row.student.fullName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono tabular-nums">
                            {row.student.username} · {row.student.studentCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {hasPracticed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              Đã luyện thi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                              Chưa làm bài
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 tabular-nums">
                          {row.attemptCount} lượt
                        </td>
                        <td className="py-3.5 px-4 tabular-nums">
                          {hasPracticed ? (
                            <span
                              className={`font-display font-extrabold ${
                                row.bestRatio >= 2 / 3
                                  ? 'text-teal-800'
                                  : 'text-rose-600'
                              }`}
                            >
                              {row.highestScore} / {row.bestMaxScore}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 tabular-nums">
                          {hasPracticed ? `${row.avgScore} đ` : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {hasPracticed ? (
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                              {row.bestRank}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums">
                          {row.latestCompletedAt}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setInspectedStudentId(row.student.id)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-teal-600 text-slate-700 text-xs font-bold cursor-pointer whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-700" />
                            Xem lịch sử ({row.attemptCount})
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2 (TEACHER): CREATE NEW EXAM (CHỈ HIỂN THỊ Ở TRANG GIÁO VIÊN) */}
        {authTab === 'teacher_create_exam' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-teal-800 uppercase">
                  Chức năng tạo đề dành riêng cho Giáo viên
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                  Tạo bộ đề ngẫu nhiên hoặc tự soạn câu hỏi mới để giao cho học
                  sinh lớp 1A2 luyện thi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthTab('teacher_monitor')}
                className="px-3.5 py-2 rounded-lg bg-white border border-teal-600 text-teal-800 text-xs font-bold hover:bg-teal-100 cursor-pointer whitespace-nowrap shrink-0"
              >
                ← Quay lại Bảng theo dõi học sinh
              </button>
            </div>
            {examBuilderNode}
          </div>
        )}

        {/* TAB 3 (TEACHER): CLASS ROSTER CREDENTIALS */}
        {authTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Tìm kiếm tên học sinh, tên đăng nhập hoặc ngày sinh..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-teal-600"
                />
              </div>
              <button
                type="button"
                onClick={() => handleStartRegisterFromQuery(rosterSearch)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Cấp tài khoản học sinh mới
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                    <th className="py-3 px-4">STT</th>
                    <th className="py-3 px-4">Họ và tên học sinh</th>
                    <th className="py-3 px-4">Ngày sinh</th>
                    <th className="py-3 px-4">Tên đăng nhập</th>
                    <th className="py-3 px-4">Mật khẩu</th>
                    <th className="py-3 px-4 text-right">Sao chép TK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRoster.map((acc, index) => (
                    <tr key={acc.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-500 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {acc.fullName}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {acc.studentCode} · {acc.grade}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 tabular-nums">
                        {acc.birthDate || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <code className="font-mono font-bold text-teal-800 bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm">
                          {acc.username}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <code className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm">
                          {acc.defaultPlainPassword || 'Tuachua2026'}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(acc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer"
                        >
                          {copiedId === acc.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Đã chép
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Sao chép
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4 (TEACHER): ADD NEW STUDENT ACCOUNT */}
        {authTab === 'register' && (
          <form
            onSubmit={(e) => handleRegisterSubmit(e, false)}
            className="p-6 rounded-2xl border-2 border-teal-600/80 bg-white space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">
                  Cấp Tài khoản Học sinh Mới vào Danh sách Lớp 1A2
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập Họ và tên học sinh, hệ thống tự động tạo Tên đăng nhập
                  theo mẫu <em>...tuachua</em>.
                </p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg tabular-nums">
                SBD dự kiến: SBD-{nextStudentCodeNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) =>
                    handleFullNameChangeInRegister(e.target.value)
                  }
                  placeholder="Ví dụ: Lò Văn Minh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Tên đăng nhập *
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => {
                    setUsernameManuallyEdited(true);
                    setRegUsername(e.target.value);
                  }}
                  placeholder="Ví dụ: vanminhtuachua"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-teal-900 bg-teal-50/40 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Ngày sinh (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={regBirthDate}
                  onChange={(e) => setRegBirthDate(e.target.value)}
                  placeholder="Ví dụ: 15/08/2020"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Mật khẩu mặc định *
                </label>
                <input
                  type="text"
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setRegConfirmPassword(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Thêm học sinh vào danh sách lớp
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal: Chi tiết lịch sử làm bài của 1 học sinh dành cho Giáo viên */}
      {inspectedStudentRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold text-teal-700 uppercase">
                  Hồ sơ luyện thi chi tiết · {inspectedStudentRow.student.grade}
                </div>
                <h3 className="text-xl font-display font-extrabold text-slate-900 mt-0.5">
                  {inspectedStudentRow.student.fullName} (
                  {inspectedStudentRow.student.studentCode})
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Tên đăng nhập: {inspectedStudentRow.student.username} · Ngày
                  sinh: {inspectedStudentRow.student.birthDate || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedStudentId(null)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Số lần làm bài</div>
                <div className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {inspectedStudentRow.attemptCount} lượt
                </div>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                <div className="text-xs text-teal-800">Điểm cao nhất</div>
                <div className="text-lg font-extrabold text-teal-900 tabular-nums mt-0.5">
                  {inspectedStudentRow.highestScore} /{' '}
                  {inspectedStudentRow.bestMaxScore}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-xs text-amber-900">Danh hiệu</div>
                <div className="text-base font-extrabold text-amber-900 mt-0.5">
                  {inspectedStudentRow.bestRank}
                </div>
              </div>
            </div>

            {inspectedStudentRow.attempts.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">
                  Học sinh này chưa có lượt nộp bài nào.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase">
                  Lịch sử các lần nộp bài ({inspectedStudentRow.attempts.length}{' '}
                  lượt):
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {inspectedStudentRow.attempts.map((att, i) => (
                    <div
                      key={att.id}
                      className="p-3.5 bg-white hover:bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">
                          Lần #{inspectedStudentRow.attempts.length - i}:{' '}
                          {att.roundTitle}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Thời gian: {formatDuration(att.timeSpentSeconds)}
                          </span>
                          <span>·</span>
                          <span>Nộp lúc: {att.completedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                          <Trophy className="w-3.5 h-3.5 inline mr-1" />
                          {att.rankTitle}
                        </span>
                        <div className="text-right tabular-nums">
                          <div className="font-display font-extrabold text-teal-800">
                            {att.score} / {att.maxScore} đ
                          </div>
                          <div className="text-xs text-emerald-700 font-semibold">
                            Đúng {att.correctCount}/{att.totalQuestions} câu
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectedStudentId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
