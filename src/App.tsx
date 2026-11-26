import React, { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Trophy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Send,
  LayoutGrid,
  List,
  User,
  GraduationCap,
  School,
  AlertTriangle,
  Pause,
  Play,
  FileCode2,
  CheckCircle2,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import {
  EXAM_INFO,
  isQuestionAnswered,
  checkQuestionCorrect,
} from './data/questions';
import {
  ExamDeck,
  BUILTIN_EXAM_DECKS,
} from './data/examDecks';
import { QuestionRenderer } from './components/QuestionRenderer';
import {
  EXAM_ROUNDS,
  ExamRoundConfig,
  ExamResultSummary,
  useExamRoundManager,
} from './hooks/useExamRoundManager';
import { ExamResultDashboard } from './components/ExamResultDashboard';
import { ExamRoundCodeBlueprint } from './components/ExamRoundCodeBlueprint';
import { ExamBuilder } from './components/ExamBuilder';
import {
  UserAccount,
  AccountTabType,
  AccountCenter,
  ACCOUNTS_STORAGE_KEY,
  loadStoredAccounts,
  loadActiveSession,
  saveActiveSession,
} from './components/AccountCenter';

type ActiveSection =
  | 'lobby'
  | 'exam'
  | 'guide'
  | 'pdf_source'
  | 'history'
  | 'code_blueprint'
  | 'account';
type ExamViewMode = 'single' | 'all';

interface StudentProfile {
  fullName: string;
  grade: string;
  school: string;
  studentCode?: string;
}

interface ExamAttempt {
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

const STORAGE_HISTORY_KEY = 'tntv_exam_history_v2';
const STORAGE_CUSTOM_DECKS_KEY = 'tntv_custom_decks_v1';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('account');

  // Authentication & Accounts State
  const [accounts, setAccounts] = useState<UserAccount[]>(() =>
    loadStoredAccounts()
  );
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    loadActiveSession()
  );

  const [student, setStudent] = useState<StudentProfile>(() => {
    const initial = loadActiveSession();
    return {
      fullName: initial?.fullName || 'Thí sinh Tự do',
      grade: initial?.grade || 'Lớp 1A2',
      school: initial?.school || 'Trường Tiểu học Tủa Chùa',
      studentCode: initial?.studentCode || 'KHÁCH',
    };
  });

  const [agreedRules, setAgreedRules] = useState<boolean>(true);
  const [examMode, setExamMode] = useState<'exam' | 'practice'>('practice');
  const [viewMode, setViewMode] = useState<ExamViewMode>('single');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showResultDashboard, setShowResultDashboard] = useState<boolean>(true);
  const [filterMyHistoryOnly, setFilterMyHistoryOnly] =
    useState<boolean>(false);
  const [accountInitialTab, setAccountInitialTab] =
    useState<AccountTabType>('teacher_monitor');

  const openAccountSection = (tab: AccountTabType = 'roster') => {
    setAccountInitialTab(tab);
    setActiveSection('account');
  };

  const navigateSection = (section: ActiveSection) => {
    if (!currentUser && section !== 'account') {
      setAccountInitialTab('login');
      setActiveSection('account');
      return;
    }
    setActiveSection(section);
  };

  // Sync student profile when user logs in, registers, or updates profile
  const handleLoginSuccess = (acc: UserAccount, remember = true) => {
    setCurrentUser(acc);
    saveActiveSession(acc, remember);
    setStudent({
      fullName: acc.fullName,
      grade: acc.grade,
      school: acc.school,
      studentCode: acc.studentCode,
    });
  };

  const handleRegisterSuccess = (
    newAcc: UserAccount,
    keepCurrentSession = false
  ) => {
    const updatedList = [newAcc, ...accounts];
    setAccounts(updatedList);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }
    if (!keepCurrentSession) {
      handleLoginSuccess(newAcc);
    }
  };

  const handleUpdateProfile = (updatedAcc: UserAccount) => {
    const updatedList = accounts.map((a) =>
      a.id === updatedAcc.id ? updatedAcc : a
    );
    setAccounts(updatedList);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }
    handleLoginSuccess(updatedAcc);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveActiveSession(null);
    setStudent({
      fullName: 'Thí sinh Tự do',
      grade: 'Lớp 1A2',
      school: 'Trường Tiểu học Tủa Chùa',
      studentCode: 'KHÁCH',
    });
    setAccountInitialTab('login');
    setActiveSection('account');
  };

  // Saved Custom Decks + Builtin Decks
  const [customDecks, setCustomDecks] = useState<ExamDeck[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_DECKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const allDecks = useMemo(
    () => [...BUILTIN_EXAM_DECKS, ...customDecks],
    [customDecks]
  );

  const [activeDeck, setActiveDeck] = useState<ExamDeck>(BUILTIN_EXAM_DECKS[0]);
  const activeQuestions = activeDeck.questions;

  const [history, setHistory] = useState<ExamAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (saved) {
        const parsed: ExamAttempt[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (item) => !String(item?.id || '').startsWith('sample-hs-')
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  // Callback invoked automatically when student submits or timer expires
  const handleRoundCompleted = useCallback(
    (evaluatedResult: ExamResultSummary) => {
      setShowConfirmModal(false);
      setShowResultDashboard(true);

      const newAttempt: ExamAttempt = {
        id: `attempt-${Date.now()}`,
        accountId: currentUser?.id,
        studentCode: currentUser?.studentCode || student.studentCode,
        roundTitle: `${activeDeck.title}`,
        rankTitle: evaluatedResult.rankTitle,
        studentName: student.fullName.trim() || 'Học sinh Tiểu học',
        grade: student.grade,
        score: evaluatedResult.totalScore,
        maxScore: evaluatedResult.maxScore,
        correctCount: evaluatedResult.correctCount,
        totalQuestions: evaluatedResult.totalQuestions,
        timeSpentSeconds: evaluatedResult.timeSpentSeconds,
        completedAt: evaluatedResult.submittedAt,
        mode: examMode,
      };

      setHistory((prev) => {
        const updated = [newAttempt, ...prev].slice(0, 200);
        try {
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [
      currentUser?.id,
      currentUser?.studentCode,
      student.fullName,
      student.grade,
      student.studentCode,
      examMode,
      activeDeck.title,
    ]
  );

  const {
    selectedRound,
    status,
    answers,
    secondsLeft,
    liveResult,
    finalResult,
    startRound,
    togglePause,
    updateAnswer,
    submitExam,
  } = useExamRoundManager(
    activeQuestions,
    EXAM_ROUNDS[0],
    handleRoundCompleted,
    Boolean(currentUser) && activeSection === 'exam'
  );

  const isSubmitted = status === 'submitted';

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const answeredCount = useMemo(() => {
    return activeQuestions.filter((q) => isQuestionAnswered(q, answers[q.id]))
      .length;
  }, [activeQuestions, answers]);

  const handleResetExam = (
    newMode?: 'exam' | 'practice',
    customRound?: ExamRoundConfig,
    deckToUse?: ExamDeck,
    useRoundDuration = false
  ) => {
    if (newMode) setExamMode(newMode);
    const targetDeck = deckToUse || activeDeck;
    if (deckToUse) {
      setActiveDeck(deckToUse);
    }
    const baseRound = customRound || selectedRound;
    const syncedRound: ExamRoundConfig = {
      ...baseRound,
      durationMinutes: useRoundDuration
        ? baseRound.durationMinutes
        : deckToUse
        ? targetDeck.durationMinutes
        : baseRound.durationMinutes,
      maxScore: targetDeck.questions.length * 10,
      passingScore: targetDeck.passingScore,
      totalQuestions: targetDeck.questions.length,
    };
    startRound(syncedRound);
    setShowConfirmModal(false);
    setShowResultDashboard(false);
    setCurrentIndex(0);
    setActiveSection('exam');
  };

  const handleSaveNewDeck = (newDeck: ExamDeck, startImmediately: boolean) => {
    const updated = [newDeck, ...customDecks];
    setCustomDecks(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_DECKS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (startImmediately) {
      handleResetExam('practice', selectedRound, newDeck);
    }
  };

  const handleDeleteCustomDeck = (deckId: string) => {
    const updated = customDecks.filter((d) => d.id !== deckId);
    setCustomDecks(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_DECKS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (activeDeck.id === deckId) {
      handleResetExam(examMode, selectedRound, BUILTIN_EXAM_DECKS[0]);
    }
  };

  const currentQuestion =
    activeQuestions[Math.min(currentIndex, activeQuestions.length - 1)] ||
    activeQuestions[0];

  const displayedHistory = useMemo(() => {
    const filtered =
      !filterMyHistoryOnly || !currentUser
        ? history
        : history.filter(
            (item) =>
              item.accountId === currentUser.id ||
              item.studentName.toLowerCase() ===
                currentUser.fullName.toLowerCase()
          );
    return [...filtered].sort((a, b) => {
      const ratioA = a.maxScore > 0 ? a.score / a.maxScore : 0;
      const ratioB = b.maxScore > 0 ? b.score / b.maxScore : 0;
      if (ratioB !== ratioA) return ratioB - ratioA;
      if (b.score !== a.score) return b.score - a.score;
      return a.timeSpentSeconds - b.timeSpentSeconds;
    });
  }, [history, filterMyHistoryOnly, currentUser]);

  const effectiveSection: ActiveSection = currentUser
    ? activeSection
    : 'account';
  const isLoginPortalView = !currentUser && effectiveSection === 'account';

  return (
    <div
      className={`min-h-screen flex flex-col text-slate-900 ${
        isLoginPortalView ? 'tn-pattern-bg' : 'bg-[#F8FAFC]'
      }`}
    >
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#exam"
            onClick={(e) => {
              e.preventDefault();
              navigateSection('exam');
            }}
            className="text-lg sm:text-xl font-display font-extrabold tracking-tight text-teal-800 whitespace-nowrap shrink-0"
          >
            Trạng Nguyên Tiếng Việt
          </a>

          {/* Zone 2: Navigation links (only enabled after login) */}
          {currentUser ? (
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
              <a
                href="#lobby"
                onClick={(e) => {
                  e.preventDefault();
                  navigateSection('lobby');
                }}
                className={`hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  effectiveSection === 'lobby'
                    ? 'text-teal-800 font-bold underline underline-offset-8 decoration-2 decoration-teal-700'
                    : ''
                }`}
              >
                Chọn vòng thi
              </a>
              <a
                href="#exam"
                onClick={(e) => {
                  e.preventDefault();
                  navigateSection('exam');
                }}
                className={`hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  effectiveSection === 'exam'
                    ? 'text-teal-800 font-bold underline underline-offset-8 decoration-2 decoration-teal-700'
                    : ''
                }`}
              >
                Làm bài thi
              </a>
              <a
                href="#guide"
                onClick={(e) => {
                  e.preventDefault();
                  navigateSection('guide');
                }}
                className={`hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  effectiveSection === 'guide'
                    ? 'text-teal-800 font-bold underline underline-offset-8 decoration-2 decoration-teal-700'
                    : ''
                }`}
              >
                Ôn kiến thức
              </a>
              <a
                href="#history"
                onClick={(e) => {
                  e.preventDefault();
                  navigateSection('history');
                }}
                className={`hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  effectiveSection === 'history'
                    ? 'text-teal-800 font-bold underline underline-offset-8 decoration-2 decoration-teal-700'
                    : ''
                }`}
              >
                Bảng vàng
              </a>
              <a
                href="#account"
                onClick={(e) => {
                  e.preventDefault();
                  navigateSection('account');
                }}
                className={`hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  effectiveSection === 'account'
                    ? 'text-teal-800 font-bold underline underline-offset-8 decoration-2 decoration-teal-700'
                    : ''
                }`}
              >
                Tài khoản
              </a>
            </nav>
          ) : (
            <div className="hidden md:flex items-center text-xs font-semibold text-slate-500">
              Vui lòng đăng nhập tài khoản để bắt đầu ôn luyện &amp; làm bài thi
            </div>
          )}

          {/* Zone 3: User Profile & Direct Logout Button */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openAccountSection(
                      currentUser.role === 'teacher'
                        ? 'teacher_monitor'
                        : 'profile'
                    )
                  }
                  className="px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {currentUser.fullName} ({currentUser.studentCode})
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openAccountSection('login')}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Đăng nhập / Tạo tài khoản
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Strip (only shown after login) */}
      {currentUser && (
        <div className="md:hidden flex items-center gap-2 overflow-x-auto bg-white border-b border-slate-200 px-4 py-2">
          {[
            { id: 'lobby', label: 'Chọn vòng thi' },
            { id: 'exam', label: `Làm bài (${activeQuestions.length} câu)` },
            { id: 'guide', label: 'Ôn kiến thức' },
            { id: 'history', label: 'Bảng vàng' },
            {
              id: 'account',
              label:
                currentUser.role === 'teacher'
                  ? 'Trang Giáo viên'
                  : 'Hồ sơ Tài khoản',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateSection(tab.id as ActiveSection)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                effectiveSection === tab.id
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Container */}
      <main
        className={
          isLoginPortalView
            ? 'flex-1 w-full flex items-center justify-center'
            : 'flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-6'
        }
      >
        {/* ==================== SECTION: ACCOUNT CENTER (ĐĂNG NHẬP / ĐĂNG KÝ / TRANG GIÁO VIÊN) ==================== */}
        {effectiveSection === 'account' && (
          <AccountCenter
            currentUser={currentUser}
            accounts={accounts}
            examHistory={history}
            examBuilderNode={
              <ExamBuilder
                allDecks={allDecks}
                activeDeckId={activeDeck.id}
                onSelectAndStartDeck={(deck, mode) =>
                  handleResetExam(mode, selectedRound, deck)
                }
                onSaveNewDeck={handleSaveNewDeck}
                onDeleteCustomDeck={handleDeleteCustomDeck}
              />
            }
            initialTab={accountInitialTab}
            onLoginSuccess={handleLoginSuccess}
            onRegisterSuccess={handleRegisterSuccess}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            onGoToExam={() => setActiveSection('exam')}
          />
        )}

        {/* ==================== SECTION 1: LOBBY & ROUND MANAGEMENT ==================== */}
        {effectiveSection === 'lobby' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span>Quản lý Vòng thi & Bộ đề</span>
                    <span aria-hidden="true">·</span>
                    <span>Cấp Trường & Thi Hương</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {currentUser
                        ? `SBD: ${currentUser.studentCode}`
                        : 'Chế độ Khách'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                    {EXAM_INFO.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentUser ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          openAccountSection(
                            currentUser.role === 'teacher'
                              ? 'teacher_monitor'
                              : 'profile'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <User className="w-3.5 h-3.5 text-teal-700" />
                        Tài khoản của tôi
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openAccountSection('login')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <LogIn className="w-3.5 h-3.5 text-teal-700" />
                        Đăng nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => openAccountSection('register')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                        Tạo tài khoản mới
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Student Profile Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Họ và tên thí sinh
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={student.fullName}
                      onChange={(e) =>
                        setStudent({ ...student, fullName: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Khối / Lớp
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={student.grade}
                      onChange={(e) =>
                        setStudent({ ...student, grade: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                      placeholder="Ví dụ: Lớp 1A"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Trường Tiểu học
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={student.school}
                      onChange={(e) =>
                        setStudent({ ...student, school: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:border-teal-600"
                      placeholder="Tên trường..."
                    />
                  </div>
                </div>
              </div>

              {/* Deck Selector in Lobby */}
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">
                    1. Chọn Bộ đề thi ({allDecks.length} bộ đề hiện có):
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allDecks.map((d) => {
                    const active = activeDeck.id === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setActiveDeck(d)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          active
                            ? 'border-teal-600 bg-teal-50/50'
                            : 'border-slate-200 bg-white hover:border-teal-400'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-teal-800">
                            {d.questions.length} câu hỏi · {d.durationMinutes}{' '}
                            phút
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {d.title}
                          </div>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exam Rounds Selector */}
              <div className="space-y-3 mb-6">
                <h2 className="text-sm font-bold text-slate-800">
                  2. Chọn Cấp độ / Vòng thi muốn tham gia:
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {EXAM_ROUNDS.map((round) => {
                    const isSelected = selectedRound.id === round.id;
                    return (
                      <div
                        key={round.id}
                        onClick={() => startRound(round)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50'
                            : 'border-slate-200 bg-white hover:border-teal-400'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold text-teal-800">
                              Vòng {round.roundNumber} · {round.levelLabel}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-teal-700" />
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {round.title}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {round.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                          <span>Thời gian: {round.durationMinutes} phút</span>
                          <span>Điểm đạt: {round.passingScore}/300</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quy chế khảo thí */}
              <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3 mb-6">
                <h2 className="text-base font-bold text-slate-900">
                  Quy chế Khảo thí & Hướng dẫn làm bài Trạng Nguyên Tiếng Việt
                </h2>
                <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5 leading-relaxed">
                  <li>
                    Đề đang chọn: <strong>{activeDeck.title}</strong> ({activeQuestions.length} câu hỏi) — Vòng thi: <strong>{selectedRound.title}</strong>.
                  </li>
                  <li>
                    Hệ thống tự động đếm ngược thời gian và tự động thu bài khi hết giờ. Ngay sau khi nhấn <strong>Nộp bài</strong>, hệ thống sẽ chấm điểm tự động và lưu kết quả vào Bảng vàng của tài khoản <strong>{student.fullName}</strong>.
                  </li>
                </ul>

                <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedRules}
                    onChange={(e) => setAgreedRules(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span className="text-sm font-semibold text-slate-900">
                    Tôi đã đọc và đồng ý với Quy chế Khảo thí Trạng Nguyên Tiếng Việt
                  </span>
                </label>
              </div>

              {/* Start Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={!agreedRules}
                  onClick={() =>
                    handleResetExam('practice', selectedRound, activeDeck, true)
                  }
                  className="px-5 py-2.5 rounded-xl border-2 border-teal-700 text-teal-800 font-bold text-sm hover:bg-teal-50 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  Vào chế độ Ôn luyện (Chấm từng câu)
                </button>
                <button
                  type="button"
                  disabled={!agreedRules}
                  onClick={() =>
                    handleResetExam('exam', selectedRound, activeDeck, true)
                  }
                  className="px-6 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  Tôi đồng ý - Bắt đầu Vòng thi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 2: EXAM WORKSPACE & FINAL RESULT DASHBOARD ==================== */}
        {effectiveSection === 'exam' && (
          <div className="space-y-6">
            {/* Final Result Dashboard Screen after student clicks Submit */}
            {isSubmitted && finalResult && showResultDashboard ? (
              <ExamResultDashboard
                result={finalResult}
                studentName={student.fullName}
                studentGrade={student.grade}
                studentSchool={student.school}
                onRetryRound={() =>
                  handleResetExam(examMode, selectedRound, activeDeck)
                }
                onReviewQuestionInStage={(qIndex) => {
                  setCurrentIndex(qIndex);
                  setViewMode('single');
                  setShowResultDashboard(false);
                }}
                onOpenCodeBlueprint={() => setActiveSection('code_blueprint')}
              />
            ) : (
              <>
                {/* Banner when submitted but reviewing individual question cards */}
                {isSubmitted && finalResult && !showResultDashboard && (
                  <div className="bg-teal-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="text-sm font-medium">
                        Đang xem lại bài thi đã nộp · Tổng điểm:{' '}
                        <strong className="tabular-nums">
                          {finalResult.totalScore}/{finalResult.maxScore}
                        </strong>{' '}
                        ({finalResult.rankTitle})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResultDashboard(true)}
                      className="px-4 py-1.5 rounded-lg bg-white text-teal-900 text-xs font-bold hover:bg-teal-50 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Quay lại Bảng tổng kết kết quả
                    </button>
                  </div>
                )}

                {/* Top Workspace Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
                  {/* Deck Selector, Quick Randomize & Mode selector */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        Bộ đề:
                      </span>
                      <select
                        value={activeDeck.id}
                        onChange={(e) => {
                          const found = allDecks.find(
                            (d) => d.id === e.target.value
                          );
                          if (found)
                            handleResetExam(examMode, selectedRound, found);
                        }}
                        className="text-xs font-bold text-teal-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none max-w-[260px] truncate"
                      >
                        {allDecks.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title} ({d.questions.length} câu)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        disabled={examMode === 'exam' && !isSubmitted}
                        title={
                          examMode === 'exam' && !isSubmitted
                            ? 'Không thể xem đáp án khi đang trong chế độ Thi thử. Hãy nộp bài trước.'
                            : undefined
                        }
                        onClick={() => setExamMode('practice')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
                          examMode === 'practice'
                            ? 'bg-white text-teal-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Ôn luyện (Xem giải ngay)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamMode('exam')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          examMode === 'exam'
                            ? 'bg-white text-teal-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Thi thử (Nộp bài mới chấm)
                      </button>
                    </div>
                  </div>

                  {/* View mode toggle: Single question vs Full list */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Hiển thị:
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setViewMode('single')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          viewMode === 'single'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Từng câu
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('all')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          viewMode === 'all'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        Tất cả ({activeQuestions.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Two-Zone Sandbox Layout: Left Interactive Stage (68%) + Right Control & Navigation Deck (32%) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Zone: Question Interactive Stage */}
                  <div className="lg:col-span-8 space-y-5">
                    {viewMode === 'single' ? (
                      <>
                        <QuestionRenderer
                          key={currentQuestion.id}
                          question={currentQuestion}
                          answer={answers[currentQuestion.id]}
                          onChange={(val) =>
                            updateAnswer(currentQuestion.id, val)
                          }
                          isSubmitted={isSubmitted}
                          instantFeedback={examMode === 'practice'}
                        />

                        {/* Previous / Next Navigation Bar */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                          <button
                            type="button"
                            disabled={currentIndex === 0}
                            onClick={() =>
                              setCurrentIndex((prev) => Math.max(0, prev - 1))
                            }
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-default whitespace-nowrap shrink-0"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Câu trước
                          </button>

                          <span className="text-sm font-semibold text-slate-600 tabular-nums">
                            Câu {currentIndex + 1} / {activeQuestions.length}
                          </span>

                          {currentIndex < activeQuestions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentIndex((prev) =>
                                  Math.min(activeQuestions.length - 1, prev + 1)
                                )
                              }
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Câu tiếp theo
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : !isSubmitted ? (
                            <button
                              type="button"
                              onClick={() => setShowConfirmModal(true)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Send className="w-4 h-4" />
                              Hoàn thành & Nộp bài
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowResultDashboard(true)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Xem Bảng kết quả
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-6">
                        {activeQuestions.map((q) => (
                          <div key={q.id} id={`q-card-${q.id}`}>
                            <QuestionRenderer
                              question={q}
                              answer={answers[q.id]}
                              onChange={(val) => updateAnswer(q.id, val)}
                              isSubmitted={isSubmitted}
                              instantFeedback={examMode === 'practice'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Zone: Control & Question Navigator Deck */}
                  <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
                    {/* Timer & Candidate Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-semibold text-teal-800 truncate">
                            {activeDeck.title}
                          </div>
                          <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                            <span>{student.fullName}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {student.studentCode && `${student.studentCode} · `}
                            {student.grade} · {student.school}
                          </div>
                        </div>

                        {currentUser ? (
                          <button
                            type="button"
                            onClick={handleLogout}
                            title="Đăng xuất khỏi tài khoản hiện tại"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Đăng xuất
                          </button>
                        ) : (
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openAccountSection('login')}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline cursor-pointer whitespace-nowrap"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              Đăng nhập
                            </button>
                            <button
                              type="button"
                              onClick={() => openAccountSection('register')}
                              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline cursor-pointer whitespace-nowrap"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Tạo tài khoản
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Countdown Clock with Pause/Resume button */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-5 h-5 text-teal-700 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-slate-600">
                              Thời gian còn lại
                            </div>
                            {status === 'paused' && (
                              <span className="text-[11px] font-bold text-amber-700">
                                Đang tạm dừng
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xl font-display font-extrabold tabular-nums ${
                              secondsLeft < 180
                                ? 'text-rose-600'
                                : 'text-teal-800'
                            }`}
                          >
                            {formatTime(secondsLeft)}
                          </span>
                          {!isSubmitted && (
                            <button
                              type="button"
                              onClick={togglePause}
                              title={
                                status === 'paused'
                                  ? 'Tiếp tục tính giờ'
                                  : 'Tạm dừng đồng hồ'
                              }
                              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              {status === 'paused' ? (
                                <Play className="w-3.5 h-3.5" />
                              ) : (
                                <Pause className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Stats */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-500">Đã làm</div>
                          <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                            {answeredCount} / {activeQuestions.length}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-xs text-slate-500">
                            {isSubmitted || examMode === 'practice'
                              ? 'Điểm hiện tại'
                              : 'Chưa làm'}
                          </div>
                          <div className="text-lg font-bold text-teal-700 tabular-nums mt-0.5">
                            {isSubmitted || examMode === 'practice'
                              ? `${liveResult.totalScore} đ`
                              : `${activeQuestions.length - answeredCount} câu`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Question Navigation Palette */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          Danh sách {activeQuestions.length} câu hỏi
                        </h3>
                        <span className="text-xs text-slate-500">
                          Nhấn số để chuyển câu
                        </span>
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                        {activeQuestions.map((q, idx) => {
                          const answered = isQuestionAnswered(q, answers[q.id]);
                          const correct = checkQuestionCorrect(
                            q,
                            answers[q.id]
                          );
                          const isCurrent =
                            viewMode === 'single' && currentIndex === idx;
                          const showGraded =
                            isSubmitted ||
                            (examMode === 'practice' && answered);

                          let btnClass =
                            'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-500';
                          if (showGraded) {
                            btnClass = correct
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-rose-600 text-white border-rose-600 font-bold';
                          } else if (answered) {
                            btnClass =
                              'bg-teal-600 text-white border-teal-600 font-bold';
                          }

                          if (isCurrent) {
                            btnClass += ' ring-2 ring-offset-1 ring-amber-500';
                          }

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => {
                                setCurrentIndex(idx);
                                if (viewMode === 'all') {
                                  const el = document.getElementById(
                                    `q-card-${q.id}`
                                  );
                                  el?.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className={`h-10 rounded-lg border text-xs sm:text-sm tabular-nums flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                            >
                              {q.number}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend with explicit text labels */}
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-xs bg-slate-100 border border-slate-300 inline-block shrink-0" />
                          <span>Chưa trả lời</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-xs bg-teal-600 inline-block shrink-0" />
                          <span>Đã trả lời</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-xs bg-emerald-600 inline-block shrink-0" />
                          <span>Trả lời đúng</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-xs bg-rose-600 inline-block shrink-0" />
                          <span>Chưa chính xác</span>
                        </div>
                      </div>

                      {/* Submit / View Results Action Button */}
                      <div className="pt-2 space-y-2">
                        {!isSubmitted ? (
                          <button
                            type="button"
                            onClick={() => setShowConfirmModal(true)}
                            className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            Nộp bài & Xem điểm ({answeredCount}/
                            {activeQuestions.length})
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowResultDashboard(true)}
                              className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <Trophy className="w-4 h-4" />
                              Xem Bảng tổng kết kết quả
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleResetExam(
                                  examMode,
                                  selectedRound,
                                  activeDeck
                                )
                              }
                              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Làm lại đề thi này
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== SECTION 4: STUDY GUIDE (ÔN KIẾN THỨC TIẾNG VIỆT) ==================== */}
        {effectiveSection === 'guide' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-display font-extrabold text-slate-900">
                    Cẩm nang Ôn tập Trạng Nguyên Tiếng Việt Cấp Trường
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Tổng hợp toàn bộ kiến thức trọng tâm xuất hiện trong ngân hàng 60 câu hỏi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('exam')}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs sm:text-sm font-bold hover:bg-teal-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Quay lại làm bài
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="text-base font-bold text-teal-900">
                    01. Quy tắc Chính tả: g/gh, ng/ngh, c/k và l/n
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    • <strong>Quy tắc g / gh & ng / ngh & c / k:</strong> Chữ <strong>gh, ngh, k</strong> chỉ kết hợp với 3 nguyên âm <strong>e, ê, i</strong> (ví dụ: <em>ghế gỗ, ghi chép, nghé con, cái kéo</em>). Chữ <strong>g, ng, c</strong> đứng trước các nguyên âm còn lại như <strong>a, ă, â, o, ô, ơ, u, ư</strong> (ví dụ: <em>đàn gà, con cá, con ngựa</em>).
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    • <strong>Phân biệt l / n & tr / ch:</strong> Chú ý các từ dễ nhầm lẫn như <em>khăn len</em> (không viết <em>khăn nen</em>), <em>đất nặn</em>, <em>bầu trời</em>, <em>cây tre</em>.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="text-base font-bold text-teal-900">
                    02. Nhận diện Vần: an / ăn / ân & at / ăt / ât / ông
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    • <strong>Nhóm vần kết thúc bằng "n":</strong>
                    <br />- Vần <strong>an</strong>: <em>bàn, than, la bàn, đan xen, san sát, san sẻ, bạn bè, gan dạ</em>.
                    <br />- Vần <strong>ăn</strong>: <em>chăn, khăn lụa, gắn bó, củ sắn</em>.
                    <br />- Vần <strong>ân</strong>: <em>cái cân, quả mận, ân cần, múa lân</em>.
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    • <strong>Nhóm vần khác:</strong> Vần <strong>et</strong> (<em>con vẹt</em>), vần <strong>ăt</strong> (<em>cắt cỏ</em>), vần <strong>ât</strong> (<em>lật đật</em>), vần <strong>ông</strong> (<em>bông hồng, đồng ruộng, cầu vồng</em>).
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="text-base font-bold text-teal-900">
                    03. Thứ tự Bảng chữ cái Tiếng Việt (29 chữ cái)
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Bảng chữ cái dùng để sắp xếp tên riêng học sinh:
                  </p>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-sm font-bold text-teal-800 tracking-wide leading-relaxed">
                    A, Ă, Â, B, C, D, Đ, E, Ê, G, H, I, K, L, M, N, O, Ô, Ơ, P, Q, R, S, T, U, Ư, V, X, Y
                  </div>
                  <p className="text-xs text-slate-600">
                    Ví dụ: Xếp tên <strong>Nhi, Vũ, Tú, Hân</strong> → <strong>Hân → Nhi → Tú → Vũ</strong>; Xếp tên <strong>Lan, An, Mai, Bình</strong> → <strong>An → Bình → Lan → Mai</strong>.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="text-base font-bold text-teal-900">
                    04. Tục ngữ & Câu đố Dân gian Tiểu học
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    • <strong>Tục ngữ:</strong> <em>"Học thầy không tày học bạn."</em>, <em>"Đi một ngày đàng, học một sàng khôn."</em>
                    <br />• <strong>Câu đố con vật:</strong> Con chó (<em>bốn chân, giữ nhà, sủa to</em>), Con thỏ (<em>đuôi ngắn tai dài, mắt hồng lông mượt, ăn cà rốt</em>).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 5: SKELETON CODE BLUEPRINT VIEWER ==================== */}
        {effectiveSection === 'code_blueprint' && (
          <ExamRoundCodeBlueprint
            onBackToExam={() => setActiveSection('exam')}
          />
        )}

        {/* ==================== SECTION 6: ORIGINAL PDF VIEWER (ĐỀ GỐC PDF) ==================== */}
        {effectiveSection === 'pdf_source' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900">
                    Tài liệu Đề Ôn Luyện TNTV Cấp Trường (File PDF gốc)
                  </h1>
                  <p className="text-sm text-slate-600">
                    Xem trực tiếp hoặc tải xuống tệp PDF đề ôn luyện gốc gồm 10 trang (30 câu hỏi).
                  </p>
                </div>
                <a
                  href="/assets/aistudio/____N_LUY_N_TNTV_C_P_TR__NG_b154e10e.pdf"
                  download="DE_ON_LUYEN_TNTV_CAP_TRUONG.pdf"
                  className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs sm:text-sm font-bold hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Tải file PDF về máy
                </a>
              </div>

              <div className="w-full h-[760px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <iframe
                  src="/assets/aistudio/____N_LUY_N_TNTV_C_P_TR__NG_b154e10e.pdf"
                  title="Đề ôn luyện Trạng Nguyên Tiếng Việt cấp trường PDF"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 7: LEADERBOARD / HISTORY (BẢNG VÀNG THÀNH TÍCH) ==================== */}
        {effectiveSection === 'history' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-display font-extrabold text-slate-900">
                    Bảng vàng Thành tích Luyện thi
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Lịch sử các lần nộp bài, Số báo danh, danh hiệu và điểm số của học sinh.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentUser && (
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mr-2">
                      <button
                        type="button"
                        onClick={() => setFilterMyHistoryOnly(false)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                          !filterMyHistoryOnly
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Tất cả học sinh
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMyHistoryOnly(true)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                          filterMyHistoryOnly
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Của riêng tôi ({currentUser.fullName})
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleResetExam('exam')}
                    className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs sm:text-sm font-bold hover:bg-teal-800 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Làm bài thi mới
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                      <th className="py-3 px-4">Hạng</th>
                      <th className="py-3 px-4">Học sinh / SBD</th>
                      <th className="py-3 px-4">Bộ đề thi</th>
                      <th className="py-3 px-4">Danh hiệu</th>
                      <th className="py-3 px-4">Số câu đúng</th>
                      <th className="py-3 px-4">Điểm số</th>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Ngày làm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {displayedHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-10 px-4 text-center text-sm text-slate-500"
                        >
                          Chưa có học sinh nào nộp bài. Bảng vàng sẽ tự động cập nhật ngay khi có học sinh hoàn thành bài thi.
                        </td>
                      </tr>
                    ) : (
                      displayedHistory.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-700 tabular-nums">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {item.studentName}
                          </div>
                          <div className="text-xs text-slate-500 tabular-nums">
                            {item.studentCode ? `${item.studentCode} · ` : ''}
                            {item.grade}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {item.roundTitle || 'Đề số 1: Cấp Trường'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-800">
                          {item.rankTitle || 'Bảng Nhãn'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700 tabular-nums">
                          {item.correctCount}/{item.totalQuestions} câu
                        </td>
                        <td className="py-3.5 px-4 font-display font-extrabold text-teal-800 tabular-nums">
                          {item.score} / {item.maxScore}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                          {formatTime(item.timeSpentSeconds)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums">
                          {item.completedAt}
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-900">
                  Xác nhận nộp bài thi
                </h3>
                <p className="text-xs text-slate-500">{activeDeck.title}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span>Thí sinh:</span>
                <strong>
                  {student.fullName} ({student.studentCode || 'Khách'})
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Số câu đã hoàn thành:</span>
                <strong className="tabular-nums text-teal-800">
                  {answeredCount} / {activeQuestions.length} câu
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Số câu chưa làm:</span>
                <strong className="tabular-nums text-rose-600">
                  {activeQuestions.length - answeredCount} câu
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Thời gian còn lại:</span>
                <strong className="tabular-nums">
                  {formatTime(secondsLeft)}
                </strong>
              </div>
            </div>

            {answeredCount < activeQuestions.length && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Lưu ý: Em vẫn còn{' '}
                <strong>{activeQuestions.length - answeredCount} câu hỏi</strong>{' '}
                chưa hoàn thành. Em có chắc chắn muốn nộp bài ngay không?
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Kiểm tra lại bài
              </button>
              <button
                type="button"
                onClick={() => submitExam(false)}
                className="px-5 py-2 rounded-lg bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 cursor-pointer"
              >
                Tôi đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <footer
        className={`bg-white/95 border-t border-slate-200 py-4 px-4 sm:px-8 ${
          isLoginPortalView ? '' : 'mt-10'
        }`}
      >
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            Hệ thống Ôn luyện Trạng Nguyên Tiếng Việt Cấp Trường · Quản lý Tài khoản, Tạo đề mới & Chấm thi
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateSection('account')}
              className="hover:text-slate-800 cursor-pointer font-medium"
            >
              {currentUser ? `Tài khoản (${currentUser.username})` : 'Đăng nhập'}
            </button>
            {currentUser && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => navigateSection('guide')}
                  className="hover:text-slate-800 cursor-pointer font-medium"
                >
                  Ôn kiến thức
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => navigateSection('code_blueprint')}
                  className="inline-flex items-center gap-1 hover:text-slate-800 cursor-pointer font-medium"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  Mã nguồn khung
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => navigateSection('pdf_source')}
                  className="hover:text-slate-800 cursor-pointer"
                >
                  Xem đề PDF gốc
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
