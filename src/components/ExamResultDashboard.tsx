import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  Award,
  BarChart3,
  HelpCircle,
  FileCode2,
} from 'lucide-react';
import { ExamResultSummary } from '../hooks/useExamRoundManager';

interface ExamResultDashboardProps {
  result: ExamResultSummary;
  studentName: string;
  studentGrade: string;
  studentSchool: string;
  onRetryRound: () => void;
  onReviewQuestionInStage: (questionIndex: number) => void;
  onOpenCodeBlueprint: () => void;
}

export const ExamResultDashboard: React.FC<ExamResultDashboardProps> = ({
  result,
  studentName,
  studentGrade,
  studentSchool,
  onRetryRound,
  onReviewQuestionInStage,
  onOpenCodeBlueprint,
}) => {
  const [filterMode, setFilterMode] = useState<
    'all' | 'correct' | 'wrong' | 'unanswered'
  >('all');

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')} phút ${String(secs).padStart(
      2,
      '0'
    )} giây`;
  };

  const filteredBreakdowns = result.questionBreakdowns.filter((item) => {
    if (filterMode === 'correct') return item.isCorrect;
    if (filterMode === 'wrong') return item.isAnswered && !item.isCorrect;
    if (filterMode === 'unanswered') return !item.isAnswered;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Main Certificate / Final Score Hero Card */}
      <div className="bg-white rounded-2xl border-2 border-teal-600 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-teal-700">
              <Trophy className="w-4 h-4" />
              <span>KẾT QUẢ CHÍNH THỨC · {result.roundTitle.toUpperCase()}</span>
              {result.autoSubmittedByTimeout && (
                <span className="text-amber-700">
                  · Tự động nộp bài khi hết giờ
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
              Thí sinh: {studentName}
            </h2>
            <p className="text-sm text-slate-600">
              {studentGrade} · {studentSchool} · Hoàn thành lúc{' '}
              <span className="tabular-nums font-medium">
                {result.submittedAt}
              </span>
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenCodeBlueprint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileCode2 className="w-4 h-4 text-teal-700" />
              Xem mã nguồn khung
            </button>
            <button
              type="button"
              onClick={onRetryRound}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Thi lại vòng này
            </button>
          </div>
        </div>

        {/* 4-Column Score & Telemetry Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/80">
            <div className="text-xs font-semibold text-teal-800">
              Tổng điểm đạt được
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-teal-800 tabular-nums mt-1">
              {result.totalScore} / {result.maxScore}
            </div>
            <div className="text-xs text-teal-700 mt-1 tabular-nums">
              Đạt tỉ lệ chính xác {result.percentage}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="text-xs font-semibold text-amber-900">
              Danh hiệu & Kết quả
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-amber-800 mt-1 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-600 shrink-0" />
              <span>{result.rankTitle}</span>
            </div>
            <div className="text-xs font-medium text-amber-800 mt-1">
              {result.passed
                ? 'Đạt chuẩn vượt qua vòng thi'
                : 'Chưa đạt mức điểm chuẩn qua vòng'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-600">
              Thống kê câu trả lời
            </div>
            <div className="text-2xl font-display font-extrabold text-emerald-700 tabular-nums mt-1">
              {result.correctCount} / {result.totalQuestions} câu đúng
            </div>
            <div className="text-xs text-slate-600 mt-1 tabular-nums">
              Sai: {result.wrongCount} · Chưa làm: {result.unansweredCount}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-600">
              Thời gian hoàn thành
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tabular-nums mt-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-700 shrink-0" />
              <span>{formatTime(result.timeSpentSeconds)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              Tổng thời gian quy định: {result.durationSeconds / 60} phút
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Question Category */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-teal-700" />
          <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
            Phân tích kết quả theo từng dạng bài
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {result.categorySummaries.map((cat) => {
            const pct =
              cat.maxPoints > 0
                ? Math.round((cat.earnedPoints / cat.maxPoints) * 100)
                : 0;
            return (
              <div
                key={cat.typeLabel}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {cat.typeLabel}
                  </span>
                  <span className="text-xs font-bold text-teal-800 tabular-nums">
                    {cat.earnedPoints}/{cat.maxPoints} đ
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct === 100
                        ? 'bg-emerald-600'
                        : pct >= 50
                        ? 'bg-teal-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>
                    Đúng {cat.correctQuestions}/{cat.totalQuestions} câu
                  </span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed 30-Question Answer & Explanation Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
              Bảng đối chiếu đáp án chi tiết ({result.totalQuestions} câu)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Xem câu trả lời của học sinh, đáp án đúng của hệ thống và lời giải chi tiết.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {[
              {
                id: 'all',
                label: `Tất cả (${result.totalQuestions})`,
              },
              {
                id: 'correct',
                label: `Câu đúng (${result.correctCount})`,
              },
              {
                id: 'wrong',
                label: `Câu sai (${result.wrongCount})`,
              },
              {
                id: 'unanswered',
                label: `Chưa làm (${result.unansweredCount})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  filterMode === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredBreakdowns.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Không có câu hỏi nào trong bộ lọc này.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBreakdowns.map((item) => (
              <div
                key={item.questionId}
                className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display font-bold text-sm text-slate-900 tabular-nums">
                      Câu {item.questionNumber}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-500">
                      {item.typeLabel}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đúng (+{item.earnedPoints} đ)
                      </span>
                    ) : item.isAnswered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        <XCircle className="w-3.5 h-3.5" />
                        Chưa chính xác (0 đ)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Chưa trả lời (0 đ)
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    {item.prompt}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs sm:text-sm">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        item.isCorrect
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/60 border-rose-200 text-rose-950'
                      }`}
                    >
                      <span className="font-semibold">Bài làm của em: </span>
                      <span>{item.userAnswerText}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border bg-slate-50 border-slate-200 text-slate-800">
                      <span className="font-semibold text-teal-800">
                        Đáp án chuẩn:{' '}
                      </span>
                      <span>{item.correctAnswerText}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                    <strong>Giải thích: </strong>
                    {item.explanation}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const qIdx = result.questionBreakdowns.findIndex(
                        (b) => b.questionId === item.questionId
                      );
                      onReviewQuestionInStage(
                        qIdx >= 0 ? qIdx : item.questionNumber - 1
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-600 text-xs font-semibold text-teal-800 bg-white hover:bg-teal-50/40 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem lại câu {item.questionNumber}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
