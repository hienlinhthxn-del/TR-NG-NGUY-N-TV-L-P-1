import React, { useState } from 'react';
import { Copy, Check, FileCode2, Play, Terminal } from 'lucide-react';

export const ExamRoundCodeBlueprint: React.FC<{
  onBackToExam: () => void;
}> = ({ onBackToExam }) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'full' | 'timer' | 'scoring'>(
    'full'
  );

  const fullSkeletonCode = `import React, { useState, useEffect, useMemo, useCallback } from 'react';

// 1. Định nghĩa cấu trúc Câu hỏi & Vòng thi Trạng Nguyên Tiếng Việt
export type QuestionType = 'mcq' | 'fill_text' | 'matching' | 'ordering' | 'categorize';

export interface Question {
  id: number;
  type: QuestionType;
  prompt: string;
  points: number; // Mặc định 10 điểm / câu (30 câu = 300 điểm)
  correctAnswer: any;
  options?: { id: string; text: string }[];
  explanation?: string;
}

export interface ExamRoundResult {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  rankTitle: string;
  autoSubmitted: boolean;
}

// 2. Hàm kiểm tra đáp án đúng cho từng dạng bài
export function checkIsCorrect(question: Question, userAnswer: any): boolean {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false;
  }

  switch (question.type) {
    case 'mcq':
      return userAnswer === question.correctAnswer;

    case 'fill_text':
      return (
        String(userAnswer).trim().toLowerCase() ===
        String(question.correctAnswer).trim().toLowerCase()
      );

    case 'ordering':
      return (
        Array.isArray(userAnswer) &&
        Array.isArray(question.correctAnswer) &&
        userAnswer.length === question.correctAnswer.length &&
        userAnswer.every((val, index) => val === question.correctAnswer[index])
      );

    case 'matching':
    case 'categorize':
      if (typeof userAnswer !== 'object' || typeof question.correctAnswer !== 'object') {
        return false;
      }
      const keys = Object.keys(question.correctAnswer);
      return (
        keys.length > 0 &&
        keys.every((k) => userAnswer[k] === question.correctAnswer[k])
      );

    default:
      return false;
  }
}

// 3. Component Khung Quản Lý Vòng Thi (Timer + Chấm Điểm + Màn Hình Kết Quả)
export const ExamRoundManager: React.FC<{
  roundTitle: string;
  durationMinutes: number;
  questions: Question[];
}> = ({ roundTitle, durationMinutes = 30, questions }) => {
  const totalDurationSeconds = durationMinutes * 60;

  // Trạng thái vòng thi: 'in_progress' | 'submitted'
  const [status, setStatus] = useState<'in_progress' | 'submitted'>('in_progress');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(totalDurationSeconds);
  const [result, setResult] = useState<ExamRoundResult | null>(null);

  // Bộ đếm ngược thời gian (Countdown Timer)
  useEffect(() => {
    if (status !== 'in_progress') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Hàm tính điểm và chốt kết quả khi nộp bài
  const handleSubmitExam = useCallback(
    (autoSubmitted = false) => {
      if (status === 'submitted') return;

      let totalScore = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

      questions.forEach((q) => {
        const userAns = answers[q.id];
        const hasAnswered =
          userAns !== undefined && userAns !== null && userAns !== '';

        if (!hasAnswered) {
          unansweredCount += 1;
        } else if (checkIsCorrect(q, userAns)) {
          correctCount += 1;
          totalScore += q.points;
        } else {
          wrongCount += 1;
        }
      });

      // Xếp hạng danh hiệu Trạng Nguyên
      const ratio = maxScore > 0 ? totalScore / maxScore : 0;
      const rankTitle =
        ratio === 1
          ? 'Trạng Nguyên'
          : ratio >= 0.9
          ? 'Bảng Nhãn'
          : ratio >= 0.8
          ? 'Thám Hoa'
          : ratio >= 0.5
          ? 'Tiến Sĩ'
          : 'Cần Cố Gắng';

      setResult({
        totalScore,
        maxScore,
        correctCount,
        wrongCount,
        unansweredCount,
        timeSpentSeconds: totalDurationSeconds - secondsLeft,
        rankTitle,
        autoSubmitted,
      });
      setStatus('submitted');
    },
    [status, questions, answers, secondsLeft, totalDurationSeconds]
  );

  // Tự động nộp bài khi hết thời gian (00:00)
  useEffect(() => {
    if (secondsLeft === 0 && status === 'in_progress') {
      handleSubmitExam(true);
    }
  }, [secondsLeft, status, handleSubmitExam]);

  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return \`\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
  };

  // --- A. GIAO DIỆN KẾT QUẢ CUỐI CÙNG SAU KHI NỘP BÀI ---
  if (status === 'submitted' && result) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl border border-slate-200 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold text-teal-700 uppercase">Kết quả hoàn thành vòng thi</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{roundTitle}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <span className="text-xs text-teal-800">Điểm số</span>
            <p className="text-2xl font-extrabold text-teal-800">{result.totalScore} / {result.maxScore}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs text-amber-800">Danh hiệu</span>
            <p className="text-xl font-bold text-amber-900">{result.rankTitle}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-600">Số câu đúng</span>
            <p className="text-xl font-bold text-emerald-700">{result.correctCount} / {questions.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-600">Thời gian làm</span>
            <p className="text-xl font-bold text-slate-800">{formatMMSS(result.timeSpentSeconds)}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setAnswers({});
            setSecondsLeft(totalDurationSeconds);
            setResult(null);
            setCurrentIndex(0);
            setStatus('in_progress');
          }}
          className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-sm"
        >
          Làm lại vòng thi
        </button>
      </div>
    );
  }

  // --- B. GIAO DIỆN ĐANG LÀM BÀI THI ---
  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-slate-200">
        <span className="text-xs font-bold text-teal-700">Câu {currentIndex + 1} / {questions.length}</span>
        <h3 className="text-lg font-bold text-slate-900 mt-2 mb-4">{currentQ.prompt}</h3>
        {/* Render lựa chọn đáp án tại đây */}
      </div>

      <aside className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
        <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Thời gian</span>
          <span className="text-xl font-extrabold text-teal-800">{formatMMSS(secondsLeft)}</span>
        </div>

        <button
          onClick={() => handleSubmitExam(false)}
          className="w-full py-3 rounded-xl bg-teal-700 text-white font-bold text-sm"
        >
          Nộp bài thi
        </button>
      </aside>
    </div>
  );
};`;

  const timerModuleCode = `// Hook đếm ngược thời gian vòng thi có hỗ trợ Tạm dừng & Tự động nộp bài khi hết giờ
export function useExamCountdown(
  durationMinutes: number,
  isRunning: boolean,
  onTimeout: () => void
) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (!isRunning) return;

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      onTimeout();
    }
  }, [secondsLeft, isRunning, onTimeout]);

  return {
    secondsLeft,
    formattedTime: \`\${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:\${String(secondsLeft % 60).padStart(2, '0')}\`,
    resetTimer: (newMinutes = durationMinutes) => setSecondsLeft(newMinutes * 60),
  };
}`;

  const scoringModuleCode = `// Engine chấm điểm tự động cho 6 dạng câu hỏi Trạng Nguyên Tiếng Việt
export function calculateRoundScore(questions: Question[], answers: Record<number, any>) {
  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const details = questions.map((q) => {
    const userAns = answers[q.id];
    const isAnswered = isQuestionAnswered(q, userAns);
    const isCorrect = checkQuestionCorrect(q, userAns);
    const earnedPoints = isCorrect ? q.points : 0;

    totalScore += earnedPoints;
    if (!isAnswered) unansweredCount++;
    else if (isCorrect) correctCount++;
    else wrongCount++;

    return {
      questionId: q.id,
      isAnswered,
      isCorrect,
      earnedPoints,
      maxPoints: q.points,
    };
  });

  return {
    totalScore,
    maxScore: questions.length * 10, // 300 điểm cho 30 câu
    correctCount,
    wrongCount,
    unansweredCount,
    details,
  };
}`;

  const currentCode =
    activeTab === 'full'
      ? fullSkeletonCode
      : activeTab === 'timer'
      ? timerModuleCode
      : scoringModuleCode;

  const handleCopy = () => {
    try {
      navigator.clipboard?.writeText(currentCode)?.catch(() => {});
    } catch {
      // ignore clipboard errors on non-HTTPS contexts
    }
    setCopiedTab(activeTab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 mb-1">
              <FileCode2 className="w-4 h-4" />
              <span>KIẾN TRÚC & MÃ NGUỒN KHUNG (REACT + TYPESCRIPT)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900">
              Mã nguồn khung Quản lý Vòng thi, Đếm giờ & Chấm điểm
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Toàn bộ logic dưới đây đã được tích hợp trực tiếp vào hệ thống thi thực tế trong ứng dụng này (file <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/hooks/useExamRoundManager.ts</code> và <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/components/ExamResultDashboard.tsx</code>).
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToExam}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4" />
            Chạy thử Vòng thi ngay
          </button>
        </div>

        {/* Architecture Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-xs font-bold text-teal-800">
              01. Quản lý Thời gian (Countdown)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Đếm ngược từng giây theo cấu hình vòng thi (15, 25 hoặc 30 phút), hỗ trợ tạm dừng, cảnh báo đỏ khi còn dưới 3 phút và tự động thu bài khi đồng hồ chạm 00:00.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-xs font-bold text-teal-800">
              02. Bộ máy Chấm điểm 6 dạng bài
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chấm điểm chính xác 10 điểm/câu cho cả 6 dạng: Trắc nghiệm, Điền âm/vần, Nối cặp 2 cột, Sắp xếp từ/câu, Phân loại nhóm và Chọn từ trong danh sách.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-xs font-bold text-teal-800">
              03. Giao diện Kết quả & Xếp hạng
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sau khi nộp bài, hiển thị Tổng điểm (/300), Danh hiệu (Trạng Nguyên, Bảng Nhãn, Thám Hoa...), biểu đồ tỉ lệ đúng theo từng dạng bài và bảng đối chiếu đáp án 30 câu.
            </p>
          </div>
        </div>

        {/* Code Selector Tabs & Copy Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {[
              { id: 'full', label: '1. Mã nguồn khung đầy đủ (All-in-One)' },
              { id: 'timer', label: '2. Module Đếm ngược (Timer Hook)' },
              { id: 'scoring', label: '3. Module Tính điểm (Scoring Engine)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedTab === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép mã nguồn</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép mã nguồn</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block Viewer */}
        <div className="rounded-xl bg-slate-900 text-slate-100 p-5 overflow-x-auto border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              ExamRoundManager.tsx
            </span>
            <span>TypeScript · React 19</span>
          </div>
          <pre className="text-xs sm:text-sm font-mono leading-relaxed">
            <code>{currentCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
