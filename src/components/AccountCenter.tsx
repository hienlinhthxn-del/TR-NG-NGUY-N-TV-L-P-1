import React, { useState, useMemo } from 'react';
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
  KeyRound,
  ShieldCheck,
  Users,
  Search,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Play,
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
  studentCode: string; // Số báo danh Trạng Nguyên, ví dụ: SBD-2601
  createdAt: string;
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
  // Lấy chữ đệm + tên ghép với tuachua (hoặc họ + tên như mẫu danh sách)
  const lastTwo = parts.slice(-2).join('');
  return `${lastTwo}tuachua`;
}

// Danh sách 20 học sinh theo đúng bảng danh sách Tủa Chùa gửi kèm
export const DEFAULT_ACCOUNTS: UserAccount[] = [
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
        const existingUsernames = new Set(
          parsed.map((a) => a.username.toLowerCase())
        );
        const missingDefaults = DEFAULT_ACCOUNTS.filter(
          (d) => !existingUsernames.has(d.username.toLowerCase())
        );
        const merged = [...parsed, ...missingDefaults];
        if (missingDefaults.length > 0) {
          localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(merged));
        }
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
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_ACCOUNTS[0];
}

export function saveActiveSession(account: UserAccount | null) {
  try {
    if (account) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

interface AccountCenterProps {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  initialTab?: 'roster' | 'profile' | 'login' | 'register';
  onLoginSuccess: (account: UserAccount) => void;
  onRegisterSuccess: (account: UserAccount) => void;
  onUpdateProfile: (updated: UserAccount) => void;
  onLogout: () => void;
  onGoToExam: () => void;
}

export const AccountCenter: React.FC<AccountCenterProps> = ({
  currentUser,
  accounts,
  initialTab = 'roster',
  onLoginSuccess,
  onRegisterSuccess,
  onUpdateProfile,
  onLogout,
  onGoToExam,
}) => {
  const [authTab, setAuthTab] = useState<
    'roster' | 'profile' | 'login' | 'register'
  >(initialTab);

  // Roster Search State
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
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
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');

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

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setNotFoundUserQuery(null);
  };

  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (acc) =>
        acc.fullName.toLowerCase().includes(q) ||
        acc.username.toLowerCase().includes(q) ||
        (acc.birthDate && acc.birthDate.includes(q)) ||
        acc.studentCode.toLowerCase().includes(q)
    );
  }, [accounts, rosterSearch]);

  // Open Register Tab and pre-fill name or username from search/login query
  const handleStartRegisterFromQuery = (rawQuery: string) => {
    clearFeedback();
    const cleaned = rawQuery.trim();
    if (cleaned.includes(' ')) {
      // Likely a full name like "Lò Văn Nam"
      setRegFullName(cleaned);
      const suggested = suggestUsernameFromFullName(cleaned);
      setRegUsername(suggested);
      setUsernameManuallyEdited(false);
    } else if (cleaned) {
      // Likely a username like "vannamtuachua"
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
      // Avoid collision with existing accounts
      let candidate = baseSuggestion;
      let suffix = 1;
      while (
        accounts.some((a) => a.username.toLowerCase() === candidate)
      ) {
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
        `Tài khoản "${cleanUser}" chưa có trong danh sách. Em có thể tạo tài khoản mới ngay bên dưới!`
      );
      return;
    }

    const exactMatch = found.passwordHash === hashCredential(loginPassword);
    const trimmedMatch =
      found.passwordHash === hashCredential(loginPassword.trim());
    if (!exactMatch && !trimmedMatch) {
      setErrorMsg(
        'Mật khẩu chưa chính xác (Mật khẩu chuẩn của lớp là: Tuachua2026).'
      );
      return;
    }

    onLoginSuccess(found);
    setEditFullName(found.fullName);
    setEditBirthDate(found.birthDate || '');
    setEditGrade(found.grade);
    setEditSchool(found.school);
    setAuthTab('profile');
    setSuccessMsg(`Đăng nhập thành công! Xin chào em ${found.fullName}.`);
  };

  const handleRegisterSubmit = (
    e: React.FormEvent,
    startExamImmediately = false
  ) => {
    e.preventDefault();
    clearFeedback();

    if (!regFullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên học sinh hoặc giáo viên.');
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

    const nextNum = accounts.length + 1;
    const newAccount: UserAccount = {
      id: `acc-${Date.now()}`,
      username: cleanUser,
      passwordHash: hashCredential(regPassword),
      defaultPlainPassword: regPassword,
      fullName: regFullName.trim(),
      birthDate: regBirthDate.trim() || '2020',
      grade: regGrade.trim() || 'Lớp 1A2',
      school: regSchool.trim() || 'Trường Tiểu học Tủa Chùa',
      role: regRole,
      studentCode:
        regRole === 'teacher'
          ? `GV-${2600 + nextNum}`
          : `SBD-${2600 + nextNum}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    onRegisterSuccess(newAccount);
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
        `Đã tạo tài khoản thành công cho ${newAccount.fullName} (Tên đăng nhập: ${newAccount.username} · Số báo danh: ${newAccount.studentCode})!`
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
    setSuccessMsg('Đã cập nhật thông tin tài khoản thành công!');
  };

  const handleQuickSwitchAccount = (acc: UserAccount, startExamNow = false) => {
    clearFeedback();
    onLoginSuccess(acc);
    setEditFullName(acc.fullName);
    setEditBirthDate(acc.birthDate || '');
    setEditGrade(acc.grade);
    setEditSchool(acc.school);
    if (startExamNow) {
      onGoToExam();
    } else {
      setSuccessMsg(
        `Đã đăng nhập tài khoản học sinh: ${acc.fullName} (${acc.username}).`
      );
    }
  };

  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `Họ tên: ${acc.fullName} | Tên đăng nhập: ${acc.username} | Mật khẩu: ${
      acc.defaultPlainPassword || 'Tuachua2026'
    }`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Callout Banner for Students Without an Account */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-amber-800 uppercase">
            Dành cho học sinh chưa có tên trong danh sách lớp
          </div>
          <p className="text-sm text-slate-700">
            Nếu em chưa có tài khoản hoặc không tìm thấy tên mình trong danh sách 20 bạn bên dưới, hãy nhấn nút <strong>"Tạo tài khoản mới"</strong> để đăng ký và nhận Số báo danh ngay!
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearFeedback();
            setAuthTab('register');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
        >
          <UserPlus className="w-4 h-4" />
          Chưa có tài khoản? Tạo tài khoản ngay
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header & Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>DANH SÁCH TÀI KHOẢN HỌC SINH LỚP 1A2 · TỦA CHÙA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
              {currentUser
                ? `Đang đăng nhập: ${currentUser.fullName}`
                : 'Quản lý Tài khoản & Đăng ký Mới'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Hiện có <strong>{accounts.length} tài khoản học sinh</strong> trong hệ thống (mật khẩu mặc định:{' '}
              <code className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                Tuachua2026
              </code>
              ).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
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
              Danh sách lớp ({accounts.length} HS)
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
              + Tạo tài khoản mới
            </button>
            <button
              type="button"
              onClick={() => {
                clearFeedback();
                setAuthTab('login');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                authTab === 'login'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </button>
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setAuthTab('profile');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  authTab === 'profile'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                Thẻ thí sinh
              </button>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-medium flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {notFoundUserQuery && (
              <button
                type="button"
                onClick={() => handleStartRegisterFromQuery(notFoundUserQuery)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tạo tài khoản "{notFoundUserQuery}" ngay →
              </button>
            )}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-semibold flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={onGoToExam}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              Bắt đầu làm bài thi ngay →
            </button>
          </div>
        )}

        {/* ==================== TAB 0: CLASS ROSTER (20+ STUDENTS) ==================== */}
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
                + Tạo tài khoản học sinh mới
              </button>
            </div>

            {filteredRoster.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
                <p className="text-base font-bold text-slate-800">
                  Không tìm thấy học sinh "{rosterSearch}" trong danh sách lớp!
                </p>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Em chưa có tài khoản? Hãy nhấn nút bên dưới để tạo tài khoản mới với tên <strong>"{rosterSearch}"</strong> ngay lập tức.
                </p>
                <button
                  type="button"
                  onClick={() => handleStartRegisterFromQuery(rosterSearch)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Tạo tài khoản cho "{rosterSearch}"
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                      <th className="py-3 px-4">STT</th>
                      <th className="py-3 px-4">Họ và tên học sinh</th>
                      <th className="py-3 px-4">Ngày sinh</th>
                      <th className="py-3 px-4">Tên đăng nhập</th>
                      <th className="py-3 px-4">Mật khẩu</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRoster.map((acc, index) => {
                      const isCurrent = currentUser?.id === acc.id;
                      return (
                        <tr
                          key={acc.id}
                          className={`transition-colors ${
                            isCurrent
                              ? 'bg-teal-50/70'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-500 tabular-nums">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{acc.fullName}</span>
                              {isCurrent && (
                                <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                                  Đang chọn
                                </span>
                              )}
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
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(acc)}
                                title="Sao chép tài khoản & mật khẩu"
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer"
                              >
                                {copiedId === acc.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickSwitchAccount(acc, false)
                                }
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer whitespace-nowrap ${
                                  isCurrent
                                    ? 'border-teal-600 text-teal-800 bg-white'
                                    : 'border-slate-300 text-slate-700 hover:border-teal-600 bg-white'
                                }`}
                              >
                                {isCurrent ? 'Đã đăng nhập' : 'Chọn HS'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickSwitchAccount(acc, true)
                                }
                                className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                              >
                                Vào thi ngay
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 1: CURRENT USER PROFILE & LOGOUT ==================== */}
        {authTab === 'profile' && currentUser && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Student ID Card */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white font-display font-extrabold text-xl flex items-center justify-center shrink-0">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-teal-700">
                    {currentUser.role === 'teacher'
                      ? 'TÀI KHOẢN GIÁO VIÊN'
                      : 'THẺ THÍ SINH TRẠNG NGUYÊN'}
                  </div>
                  <h2 className="text-lg font-display font-extrabold text-slate-900">
                    {currentUser.fullName}
                  </h2>
                  <div className="text-xs text-slate-500 tabular-nums">
                    Tên đăng nhập: <strong>{currentUser.username}</strong>
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
                  <span className="text-slate-500">Mật khẩu:</span>
                  <code className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                    {currentUser.defaultPlainPassword || 'Tuachua2026'}
                  </code>
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
                  onClick={() => {
                    onLogout();
                    setAuthTab('login');
                    setSuccessMsg('Đã đăng xuất khỏi tài khoản.');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>

            {/* Edit Profile Form */}
            <form
              onSubmit={handleProfileSave}
              className="md:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                Cập nhật thông tin học sinh
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên đầy đủ
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
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== TAB 2: LOGIN FORM ==================== */}
        {authTab === 'login' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleLoginSubmit}
              className="md:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <h2 className="text-lg font-display font-bold text-slate-900">
                  Đăng nhập bằng Tên đăng nhập & Mật khẩu
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setAuthTab('register');
                  }}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  + Tạo tài khoản mới
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Ví dụ: hoaiantuachua, tongkhoi1a2..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Mật khẩu mặc định: Tuachua2026"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLoginPassword('Tuachua2026')}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Điền nhanh mật khẩu: Tuachua2026
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </button>
              </div>

              {/* Box for users who don't have an account yet */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl">
                <span className="text-xs text-slate-600">
                  Em chưa có tài khoản trong danh sách lớp?
                </span>
                <button
                  type="button"
                  onClick={() => handleStartRegisterFromQuery(loginUsername)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-teal-600 text-teal-800 text-xs font-bold hover:bg-teal-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Đăng ký tài khoản mới
                </button>
              </div>
            </form>

            {/* Quick Switch 20 Students */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <KeyRound className="w-4 h-4 text-teal-700" />
                <span>CHỌN NHANH HỌC SINH TRONG DANH SÁCH</span>
              </div>
              <p className="text-xs text-slate-500">
                Nhấn vào tên học sinh dưới đây để đăng nhập ngay (Mật khẩu:{' '}
                <code className="font-mono bg-white px-1 py-0.5 rounded border">
                  Tuachua2026
                </code>
                ):
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {accounts.map((acc, idx) => {
                  const isCurrent = currentUser?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickSwitchAccount(acc, false)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-50 border-teal-600'
                          : 'bg-white border-slate-200 hover:border-teal-500'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {idx + 1}. {acc.fullName}
                        </div>
                        <div className="text-xs text-slate-500 truncate font-mono">
                          {acc.username} · {acc.birthDate}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-teal-700 shrink-0">
                        {isCurrent ? 'Đang dùng' : 'Chọn →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: REGISTER NEW ACCOUNT FORM ==================== */}
        {authTab === 'register' && (
          <form
            onSubmit={(e) => handleRegisterSubmit(e, false)}
            className="p-6 rounded-2xl border-2 border-teal-600/80 bg-white space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">
                  Tạo Tài khoản Học sinh Mới (Khi chưa có tài khoản)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ cần nhập Họ và tên, hệ thống sẽ tự động gợi ý Tên đăng nhập chuẩn (theo mẫu <em>...tuachua</em>) và cấp Số báo danh riêng.
                </p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg tabular-nums">
                SBD dự kiến: SBD-{2600 + accounts.length + 1}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Họ và tên học sinh *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) =>
                      handleFullNameChangeInRegister(e.target.value)
                    }
                    placeholder="Ví dụ: Lò Văn Minh"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-teal-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nhập họ và tên có dấu tiếng Việt đầy đủ.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Tên đăng nhập (tự động tạo hoặc tự sửa) *
                  </label>
                  {regFullName.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameManuallyEdited(false);
                        const s = suggestUsernameFromFullName(regFullName);
                        setRegUsername(s);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Gợi ý tự động
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
                  placeholder="Ví dụ: vanminhtuachua"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-teal-900 bg-teal-50/40 focus:outline-none focus:border-teal-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Viết liền không dấu, dễ nhớ để đăng nhập lần sau.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Ngày sinh (DD/MM/YYYY)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regBirthDate}
                    onChange={(e) => setRegBirthDate(e.target.value)}
                    placeholder="Ví dụ: 15/08/2020"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Khối / Lớp *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value)}
                    placeholder="Ví dụ: Lớp 1A2"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  5. Mật khẩu đăng nhập *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setRegConfirmPassword(e.target.value);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:border-teal-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mặc định để <strong>Tuachua2026</strong> cho giống cả lớp hoặc tự đặt mật khẩu riêng.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  6. Trường Tiểu học
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regSchool}
                    onChange={(e) => setRegSchool(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setAuthTab('roster');
                }}
                className="text-xs font-bold text-slate-600 hover:text-teal-700 hover:underline cursor-pointer"
              >
                ← Quay lại Danh sách lớp ({accounts.length} HS)
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-teal-700 text-teal-800 hover:bg-teal-50 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Tạo tài khoản & Lưu vào lớp
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRegisterSubmit(e as any, true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Tạo tài khoản & Vào thi ngay
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
