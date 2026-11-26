import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Question,
  UserAnswers,
  isQuestionAnswered,
  checkQuestionCorrect,
} from '../data/questions';

export type RoundStatus = 'not_started' | 'in_progress' | 'paused' | 'submitted';

export interface ExamRoundConfig {
  id: string;
  roundNumber: number;
  title: string;
  levelLabel: string; // e.g., 'Cấp Trường', 'Thi Hương - Cấp Huyện', 'Thi Hội - Cấp Tỉnh'
  durationMinutes: number;
  passingScore: number;
  maxScore: number;
  totalQuestions: number;
  description: string;
  isLocked?: boolean;
}

export interface QuestionScoreBreakdown {
  questionId: number;
  questionNumber: number;
  typeLabel: string;
  prompt: string;
  isAnswered: boolean;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  userAnswerText: string;
  correctAnswerText: string;
  explanation: string;
}

export interface CategoryScoreSummary {
  typeLabel: string;
  totalQuestions: number;
  correctQuestions: number;
  earnedPoints: number;
  maxPoints: number;
}

export interface ExamResultSummary {
  roundId: string;
  roundTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  durationSeconds: number;
  passed: boolean;
  rankTitle: string; // 'Trạng Nguyên' | 'Bảng Nhãn' | 'Thám Hoa' | 'Hoàng Giáp' | 'Tiến Sĩ' | 'Cần Cố Gắng'
  submittedAt: string;
  autoSubmittedByTimeout: boolean;
  questionBreakdowns: QuestionScoreBreakdown[];
  categorySummaries: CategoryScoreSummary[];
}

export const EXAM_ROUNDS: ExamRoundConfig[] = [
  {
    id: 'round-school-1',
    roundNumber: 1,
    title: 'Vòng Sơ khảo - Cấp Trường (Đề chính thức)',
    levelLabel: 'Cấp Trường',
    durationMinutes: 30,
    passingScore: 150,
    maxScore: 300,
    totalQuestions: 30,
    description:
      'Gồm 30 câu hỏi toàn diện: Trắc nghiệm âm vần, Điền từ chính tả, Đố vui ô chữ, Nối cặp, Sắp xếp câu và Giải đố.',
  },
  {
    id: 'round-school-fast',
    roundNumber: 2,
    title: 'Vòng Tăng tốc - Thử tài 15 phút',
    levelLabel: 'Luyện phản xạ',
    durationMinutes: 15,
    passingScore: 200,
    maxScore: 300,
    totalQuestions: 30,
    description:
      'Rèn luyện tốc độ xử lý nhanh 30 câu hỏi Trạng Nguyên Tiếng Việt trong thời gian giới hạn 15 phút.',
  },
  {
    id: 'round-district-mock',
    roundNumber: 3,
    title: 'Vòng Thi Hương - Cấp Phường/Xã/Huyện (Mô phỏng)',
    levelLabel: 'Thi Hương',
    durationMinutes: 25,
    passingScore: 220,
    maxScore: 300,
    totalQuestions: 30,
    description:
      'Mô phỏng áp lực thời gian và chuẩn điểm xét giải của Vòng Thi Hương với yêu cầu đạt từ 220/300 điểm.',
  },
];

export function formatAnswerForDisplay(q: Question, ans: any): string {
  if (!isQuestionAnswered(q, ans)) return 'Chưa trả lời';
  switch (q.type) {
    case 'mcq': {
      const opt = q.mcqOptions?.find((o) => o.id === ans);
      return opt ? `${opt.id}. ${opt.text}` : String(ans);
    }
    case 'fill_text':
    case 'dropdown':
      return String(ans).trim();
    case 'matching': {
      if (typeof ans !== 'object' || !ans) return 'Chưa nối đủ';
      const pairs = Object.entries(ans).map(([lId, rId]) => {
        const lIdx = (q.leftItems?.findIndex((i) => i.id === lId) ?? -1) + 1;
        const rItem = q.rightItems?.find((i) => i.id === rId);
        return `#${lIdx} → ${rItem?.text || rId}`;
      });
      return pairs.join('; ');
    }
    case 'ordering':
      if (!Array.isArray(ans)) return '';
      return ans.join(q.orderingJoiner ?? ' ');
    case 'categorize': {
      if (typeof ans !== 'object' || !ans) return '';
      const count = Object.keys(ans).length;
      return `Đã xếp ${count}/${q.categorizeItems?.length || 0} từ`;
    }
    default:
      return String(ans);
  }
}

export function formatCorrectAnswerForDisplay(q: Question): string {
  switch (q.type) {
    case 'mcq': {
      const opt = q.mcqOptions?.find((o) => o.id === q.correctMcqId);
      return opt ? `${opt.id}. ${opt.text}` : String(q.correctMcqId);
    }
    case 'fill_text':
    case 'dropdown':
      return (q.correctTextAnswers || []).join(' / ');
    case 'matching': {
      const correct = q.correctPairs || {};
      return Object.entries(correct)
        .map(([lId, rId]) => {
          const lIdx = (q.leftItems?.findIndex((i) => i.id === lId) ?? -1) + 1;
          const rItem = q.rightItems?.find((i) => i.id === rId);
          return `#${lIdx} → ${rItem?.text || rId}`;
        })
        .join('; ');
    }
    case 'ordering':
      return (q.correctOrder || []).join(q.orderingJoiner ?? ' ');
    case 'categorize':
      return 'Xếp đúng 100% các nhóm âm/vần';
    default:
      return '';
  }
}

export function evaluateRankTitle(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio === 1) return 'Trạng Nguyên';
  if (ratio >= 0.9) return 'Bảng Nhãn';
  if (ratio >= 0.8) return 'Thám Hoa';
  if (ratio >= 0.7) return 'Hoàng Giáp';
  if (ratio >= 0.5) return 'Tiến Sĩ';
  return 'Cần Cố Gắng';
}

export function calculateExamResult(
  round: ExamRoundConfig,
  questions: Question[],
  answers: UserAnswers,
  secondsLeft: number,
  autoSubmittedByTimeout = false
): ExamResultSummary {
  const durationSeconds = round.durationMinutes * 60;
  const timeSpentSeconds = Math.max(1, durationSeconds - secondsLeft);

  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const categoryMap = new Map<string, CategoryScoreSummary>();

  const questionBreakdowns: QuestionScoreBreakdown[] = questions.map((q) => {
    const userAns = answers[q.id];
    const isAnswered = isQuestionAnswered(q, userAns);
    const isCorrect = checkQuestionCorrect(q, userAns);
    const earnedPoints = isCorrect ? q.points : 0;

    totalScore += earnedPoints;
    if (!isAnswered) {
      unansweredCount += 1;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    // Aggregate per question category/typeLabel
    const existingCat = categoryMap.get(q.typeLabel) || {
      typeLabel: q.typeLabel,
      totalQuestions: 0,
      correctQuestions: 0,
      earnedPoints: 0,
      maxPoints: 0,
    };
    existingCat.totalQuestions += 1;
    if (isCorrect) existingCat.correctQuestions += 1;
    existingCat.earnedPoints += earnedPoints;
    existingCat.maxPoints += q.points;
    categoryMap.set(q.typeLabel, existingCat);

    return {
      questionId: q.id,
      questionNumber: q.number,
      typeLabel: q.typeLabel,
      prompt: q.prompt,
      isAnswered,
      isCorrect,
      earnedPoints,
      maxPoints: q.points,
      userAnswerText: formatAnswerForDisplay(q, userAns),
      correctAnswerText: formatCorrectAnswerForDisplay(q),
      explanation: q.explanation,
    };
  });

  const percentage =
    round.maxScore > 0 ? Math.round((totalScore / round.maxScore) * 100) : 0;

  return {
    roundId: round.id,
    roundTitle: round.title,
    totalScore,
    maxScore: round.maxScore,
    percentage,
    correctCount,
    wrongCount,
    unansweredCount,
    totalQuestions: questions.length,
    timeSpentSeconds,
    durationSeconds,
    passed: totalScore >= round.passingScore,
    rankTitle: evaluateRankTitle(totalScore, round.maxScore),
    submittedAt: new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    autoSubmittedByTimeout,
    questionBreakdowns,
    categorySummaries: Array.from(categoryMap.values()),
  };
}

/**
 * Custom Hook `useExamRoundManager`
 * Quản lý toàn bộ vòng đời của một vòng thi:
 * - Chọn vòng thi & Cấu hình thời gian
 * - Đếm ngược thời gian (Start / Pause / Resume / Auto-submit khi hết giờ)
 * - Lưu đáp án & Tính điểm tự động dựa trên đáp án đúng
 * - Trả về đối tượng kết quả chi tiết (ExamResultSummary) khi nộp bài
 */
export function useExamRoundManager(
  questions: Question[],
  initialRound: ExamRoundConfig = EXAM_ROUNDS[0],
  onCompleteCallback?: (result: ExamResultSummary) => void
) {
  const [selectedRound, setSelectedRound] =
    useState<ExamRoundConfig>(initialRound);
  const [status, setStatus] = useState<RoundStatus>('in_progress');
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(
    initialRound.durationMinutes * 60
  );
  const [finalResult, setFinalResult] = useState<ExamResultSummary | null>(
    null
  );

  // Live preview of current score while taking the exam
  const liveResult = useMemo(() => {
    return calculateExamResult(selectedRound, questions, answers, secondsLeft);
  }, [selectedRound, questions, answers, secondsLeft]);

  // Submit handler
  const submitExam = useCallback(
    (autoByTimeout = false) => {
      if (status === 'submitted') return;
      const evaluated = calculateExamResult(
        selectedRound,
        questions,
        answers,
        secondsLeft,
        autoByTimeout
      );
      setFinalResult(evaluated);
      setStatus('submitted');
      if (onCompleteCallback) {
        onCompleteCallback(evaluated);
      }
    },
    [status, selectedRound, questions, answers, secondsLeft, onCompleteCallback]
  );

  // Countdown Timer Effect
  useEffect(() => {
    if (status !== 'in_progress') return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Trigger auto-submit when clock reaches 00:00
  useEffect(() => {
    if (secondsLeft === 0 && status === 'in_progress') {
      submitExam(true);
    }
  }, [secondsLeft, status, submitExam]);

  // Start or restart a specific round
  const startRound = useCallback((round: ExamRoundConfig = selectedRound) => {
    setSelectedRound(round);
    setAnswers({});
    setFinalResult(null);
    setSecondsLeft(round.durationMinutes * 60);
    setStatus('in_progress');
  }, [selectedRound]);

  const togglePause = useCallback(() => {
    setStatus((prev) =>
      prev === 'in_progress'
        ? 'paused'
        : prev === 'paused'
        ? 'in_progress'
        : prev
    );
  }, []);

  const updateAnswer = useCallback(
    (questionId: number, value: any) => {
      if (status === 'submitted') return;
      setAnswers((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    },
    [status]
  );

  return {
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
  };
}
