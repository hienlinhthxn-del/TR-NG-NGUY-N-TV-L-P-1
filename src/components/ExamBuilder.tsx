import React, { useState } from 'react';
import {
  PlusCircle,
  Shuffle,
  Play,
  Trash2,
  CheckCircle2,
  FilePlus2,
  Layers,
  Clock,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { Question, QuestionType, QUESTIONS } from '../data/questions';
import {
  ExamDeck,
  DECK_2_QUESTIONS,
  generateRandomizedDeck,
} from '../data/examDecks';

interface ExamBuilderProps {
  allDecks: ExamDeck[];
  activeDeckId: string;
  onSelectAndStartDeck: (deck: ExamDeck, mode: 'exam' | 'practice') => void;
  onSaveNewDeck: (deck: ExamDeck, startImmediately: boolean) => void;
  onDeleteCustomDeck: (deckId: string) => void;
}

const QUESTION_TYPE_OPTIONS: { type: QuestionType; label: string }[] = [
  { type: 'mcq', label: 'Trắc nghiệm 4 đáp án (A, B, C, D)' },
  { type: 'fill_text', label: 'Điền âm / vần / chữ vào chỗ trống' },
  { type: 'matching', label: 'Ghép cặp tương ứng 2 cột' },
  { type: 'ordering', label: 'Sắp xếp chữ / tiếng thành câu' },
  { type: 'categorize', label: 'Phân loại từ vào nhóm chủ điểm' },
  { type: 'dropdown', label: 'Chọn từ trong danh sách & Giải đố' },
];

export const ExamBuilder: React.FC<ExamBuilderProps> = ({
  allDecks,
  activeDeckId,
  onSelectAndStartDeck,
  onSaveNewDeck,
  onDeleteCustomDeck,
}) => {
  const [builderMode, setBuilderMode] = useState<'auto' | 'manual' | 'list'>(
    'auto'
  );

  // --- Mode 1: Auto Generator State ---
  const [autoTitle, setAutoTitle] = useState<string>(
    'Đề Luyện Thi Trạng Nguyên Mới'
  );
  const [autoCount, setAutoCount] = useState<number>(30);
  const [autoDuration, setAutoDuration] = useState<number>(30);
  const [autoTypes, setAutoTypes] = useState<QuestionType[]>([
    'mcq',
    'fill_text',
    'matching',
    'ordering',
    'categorize',
    'dropdown',
  ]);
  const [shuffleTokens, setShuffleTokens] = useState<boolean>(true);

  // --- Mode 2: Manual Custom Deck State ---
  const [manualTitle, setManualTitle] = useState<string>(
    'Đề Tự Soạn Cấp Trường'
  );
  const [manualSubtitle, setManualSubtitle] = useState<string>(
    'Đề ôn tập do giáo viên / phụ huynh biên soạn'
  );
  const [manualDuration, setManualDuration] = useState<number>(30);
  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);

  // New single question form state
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qPrompt, setQPrompt] = useState<string>('');
  const [qExplanation, setQExplanation] = useState<string>('');
  // MCQ fields
  const [optA, setOptA] = useState<string>('');
  const [optB, setOptB] = useState<string>('');
  const [optC, setOptC] = useState<string>('');
  const [optD, setOptD] = useState<string>('');
  const [correctOpt, setCorrectOpt] = useState<string>('A');
  // Fill text & Dropdown fields
  const [sentBefore, setSentBefore] = useState<string>('Đây là ');
  const [sentAfter, setSentAfter] = useState<string>('.');
  const [correctText, setCorrectText] = useState<string>('');
  const [hintListText, setHintListText] = useState<string>('');
  // Matching fields (3 pairs)
  const [pair1L, setPair1L] = useState<string>('thật');
  const [pair1R, setPair1R] = useState<string>('thà');
  const [pair2L, setPair2L] = useState<string>('chăm');
  const [pair2R, setPair2R] = useState<string>('chỉ');
  const [pair3L, setPair3L] = useState<string>('dũng');
  const [pair3R, setPair3R] = useState<string>('cảm');
  // Ordering fields
  const [orderSentence, setOrderSentence] = useState<string>(
    'Em rất yêu trường em.'
  );
  // Categorize fields (2 groups)
  const [group1Title, setGroup1Title] = useState<string>('Tiếng có âm "ch"');
  const [group1Words, setGroup1Words] = useState<string>('chợ, chị, chú');
  const [group2Title, setGroup2Title] = useState<string>('Tiếng có âm "tr"');
  const [group2Words, setGroup2Words] = useState<string>('tre, trúc, trăng');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const toggleQuestionType = (t: QuestionType) => {
    setAutoTypes((prev) => {
      if (prev.includes(t)) {
        if (prev.length === 1) return prev; // Keep at least 1 type selected
        return prev.filter((item) => item !== t);
      }
      return [...prev, t];
    });
  };

  const handleGenerateAutoDeck = (startNow: boolean) => {
    const newDeck = generateRandomizedDeck({
      title: autoTitle,
      questionCount: autoCount,
      durationMinutes: autoDuration,
      includedTypes: autoTypes,
      shuffleOptions: shuffleTokens,
    });
    onSaveNewDeck(newDeck, startNow);
    if (!startNow) {
      setStatusMessage(
        `Đã tạo thành công "${newDeck.title}" với ${newDeck.questions.length} câu hỏi!`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleAddQuestionToManualDeck = () => {
    if (!qPrompt.trim()) {
      setStatusMessage('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    const nextNum = manualQuestions.length + 1;
    const baseId = Date.now();
    let newQ: Question | null = null;

    if (qType === 'mcq') {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        setStatusMessage('Vui lòng nhập đầy đủ 4 đáp án A, B, C, D.');
        return;
      }
      newQ = {
        id: baseId,
        number: nextNum,
        type: 'mcq',
        typeLabel: 'Trắc nghiệm',
        points: 10,
        prompt: qPrompt.trim(),
        mcqOptions: [
          { id: 'A', text: optA.trim() },
          { id: 'B', text: optB.trim() },
          { id: 'C', text: optC.trim() },
          { id: 'D', text: optD.trim() },
        ],
        correctMcqId: correctOpt,
        explanation:
          qExplanation.trim() || `Đáp án đúng là phương án ${correctOpt}.`,
      };
    } else if (qType === 'fill_text') {
      if (!correctText.trim()) {
        setStatusMessage('Vui lòng nhập từ/chữ đúng cần điền vào chỗ trống.');
        return;
      }
      const hints = hintListText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      newQ = {
        id: baseId,
        number: nextNum,
        type: 'fill_text',
        typeLabel: 'Điền từ vào chỗ trống',
        points: 10,
        prompt: qPrompt.trim(),
        sentenceBefore: sentBefore,
        sentenceAfter: sentAfter,
        hintOptions: hints.length > 0 ? hints : undefined,
        correctTextAnswers: [correctText.trim()],
        explanation:
          qExplanation.trim() ||
          `Điền "${correctText.trim()}" để hoàn thành câu: "${sentBefore}${correctText.trim()}${sentAfter}"`,
      };
    } else if (qType === 'dropdown') {
      const opts = hintListText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!correctText.trim() || opts.length < 2) {
        setStatusMessage(
          'Vui lòng nhập đáp án đúng và ít nhất 2 lựa chọn (ngăn cách bằng dấu phẩy).'
        );
        return;
      }
      if (!opts.includes(correctText.trim())) {
        opts.unshift(correctText.trim());
      }
      newQ = {
        id: baseId,
        number: nextNum,
        type: 'dropdown',
        typeLabel: 'Chọn từ hoàn thành câu',
        points: 10,
        prompt: qPrompt.trim(),
        sentenceBefore: sentBefore,
        sentenceAfter: sentAfter,
        dropdownOptions: opts,
        correctTextAnswers: [correctText.trim()],
        explanation:
          qExplanation.trim() || `Đáp án chính xác là "${correctText.trim()}".`,
      };
    } else if (qType === 'matching') {
      if (
        !pair1L.trim() ||
        !pair1R.trim() ||
        !pair2L.trim() ||
        !pair2R.trim() ||
        !pair3L.trim() ||
        !pair3R.trim()
      ) {
        setStatusMessage('Vui lòng nhập đủ 3 cặp nối ở Cột A và Cột B.');
        return;
      }
      newQ = {
        id: baseId,
        number: nextNum,
        type: 'matching',
        typeLabel: 'Ghép cặp tương ứng',
        points: 10,
        prompt: qPrompt.trim(),
        leftItems: [
          { id: 'L1', text: pair1L.trim() },
          { id: 'L2', text: pair2L.trim() },
          { id: 'L3', text: pair3L.trim() },
        ],
        // Đảo vị trí cột phải để học sinh nối
        rightItems: [
          { id: 'R2', text: pair2R.trim() },
          { id: 'R3', text: pair3R.trim() },
          { id: 'R1', text: pair1R.trim() },
        ],
        correctPairs: {
          L1: 'R1',
          L2: 'R2',
          L3: 'R3',
        },
        explanation:
          qExplanation.trim() ||
          `Các cặp đúng: ${pair1L} - ${pair1R}; ${pair2L} - ${pair2R}; ${pair3L} - ${pair3R}.`,
      };
    } else if (qType === 'ordering') {
      const words = orderSentence
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length < 3) {
        setStatusMessage('Câu sắp xếp cần có ít nhất 3 tiếng.');
        return;
      }
      const shuffled = [...words].reverse();
      newQ = {
        id: baseId,
        number: nextNum,
        type: 'ordering',
        typeLabel: 'Sắp xếp tiếng thành câu',
        points: 10,
        prompt: qPrompt.trim(),
        orderingTokens: shuffled,
        correctOrder: words,
        orderingJoiner: ' ',
        explanation:
          qExplanation.trim() || `Câu hoàn chỉnh: "${words.join(' ')}"`,
      };
    } else if (qType === 'categorize') {
      const g1List = group1Words
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const g2List = group2Words
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (g1List.length === 0 || g2List.length === 0) {
        setStatusMessage('Vui lòng nhập các từ cho cả 2 nhóm.');
        return;
      }
      const catItems = [
        ...g1List.map((w, i) => ({
          id: `g1_${i}`,
          text: w,
          correctGroupId: 'G1',
        })),
        ...g2List.map((w, i) => ({
          id: `g2_${i}`,
          text: w,
          correctGroupId: 'G2',
        })),
      ];
      newQ = {
        id: baseId,
        number: nextNum,
        type: 'categorize',
        typeLabel: 'Phân loại nhóm từ',
        points: 10,
        prompt: qPrompt.trim(),
        categories: [
          { id: 'G1', title: group1Title.trim() || 'Nhóm 1' },
          { id: 'G2', title: group2Title.trim() || 'Nhóm 2' },
        ],
        categorizeItems: catItems,
        explanation:
          qExplanation.trim() ||
          `• ${group1Title}: ${g1List.join(', ')}\n• ${group2Title}: ${g2List.join(', ')}`,
      };
    }

    if (newQ) {
      setManualQuestions((prev) => [...prev, newQ!]);
      setQPrompt('');
      setQExplanation('');
      setStatusMessage(
        `Đã thêm Câu ${nextNum} (${newQ.typeLabel}) vào đề đang soạn!`
      );
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleLoadTemplateQuestions = (count: number) => {
    const pool = [...QUESTIONS, ...DECK_2_QUESTIONS];
    const picked = pool.slice(0, count).map((q, idx) => ({
      ...q,
      id: Date.now() + idx,
      number: manualQuestions.length + idx + 1,
    }));
    setManualQuestions((prev) => [...prev, ...picked]);
    setStatusMessage(
      `Đã nạp thêm ${count} câu hỏi mẫu vào danh sách đề đang soạn.`
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveManualDeck = (startNow: boolean) => {
    if (manualQuestions.length === 0) {
      setStatusMessage('Đề thi cần có ít nhất 1 câu hỏi trước khi lưu.');
      return;
    }
    const numbered = manualQuestions.map((q, i) => ({
      ...q,
      number: i + 1,
    }));
    const newDeck: ExamDeck = {
      id: `deck-manual-${Date.now()}`,
      title:
        manualTitle.trim() || `Đề Tự Soạn (${numbered.length} câu hỏi)`,
      subtitle:
        manualSubtitle.trim() ||
        `${numbered.length} câu hỏi · Thời gian ${manualDuration} phút`,
      durationMinutes: manualDuration,
      passingScore: Math.round(numbered.length * 10 * 0.6),
      createdAt: new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
      isCustom: true,
      questions: numbered,
    };
    onSaveNewDeck(newDeck, startNow);
    if (!startNow) {
      setStatusMessage(`Đã lưu đề "${newDeck.title}" vào Kho đề thi!`);
      setBuilderMode('list');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 mb-1">
              <FilePlus2 className="w-4 h-4" />
              <span>HỆ THỐNG TẠO ĐỀ & QUẢN LÝ KHO ĐỀ THI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
              Tạo Đề Thi Trạng Nguyên Tiếng Việt Mới
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Sinh đề ngẫu nhiên từ ngân hàng 60 câu hỏi chuẩn hoặc tự biên soạn câu hỏi mới theo đúng 6 dạng bài tương tác.
            </p>
          </div>

          {/* 3-Tab Mode Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setBuilderMode('auto')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                builderMode === 'auto'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              Tạo đề ngẫu nhiên
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('manual')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                builderMode === 'manual'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Tự soạn câu hỏi ({manualQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('list')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                builderMode === 'list'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Kho đề thi ({allDecks.length})
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm font-semibold flex items-center justify-between">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs text-teal-700 hover:underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* ==================== TAB 1: AUTO RANDOM DECK GENERATOR ==================== */}
        {builderMode === 'auto' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên đề thi mới
                </label>
                <input
                  type="text"
                  value={autoTitle}
                  onChange={(e) => setAutoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-teal-600"
                  placeholder="Nhập tên đề thi..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số lượng câu hỏi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAutoCount(cnt)}
                      className={`py-2.5 rounded-xl border text-sm font-bold tabular-nums cursor-pointer transition-colors ${
                        autoCount === cnt
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-teal-500'
                      }`}
                    >
                      {cnt} câu
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Thời gian làm bài (phút)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAutoDuration(mins)}
                      className={`py-2.5 rounded-xl border text-sm font-bold tabular-nums cursor-pointer transition-colors ${
                        autoDuration === mins
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-teal-500'
                      }`}
                    >
                      {mins}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question Types Checklist */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Chọn các dạng bài muốn đưa vào đề thi ({autoTypes.length}/6 dạng):
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAutoTypes(QUESTION_TYPE_OPTIONS.map((o) => o.type))
                  }
                  className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                >
                  Chọn tất cả 6 dạng
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {QUESTION_TYPE_OPTIONS.map((item) => {
                  const checked = autoTypes.includes(item.type);
                  return (
                    <div
                      key={item.type}
                      onClick={() => toggleQuestionType(item.type)}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-white border-teal-600 text-slate-900 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-teal-700"
                      />
                      <span className="text-xs sm:text-sm font-semibold">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shuffleTokens}
                  onChange={(e) => setShuffleTokens(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700"
                />
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Tự động xáo trộn vị trí câu hỏi và đảo ngẫu nhiên các thẻ từ trong bài Sắp xếp
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleGenerateAutoDeck(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-teal-700 text-teal-800 font-bold text-sm hover:bg-teal-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Tạo & Lưu vào Kho đề
              </button>
              <button
                type="button"
                onClick={() => handleGenerateAutoDeck(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4" />
                Tạo đề mới & Vào thi ngay ({autoCount} câu)
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MANUAL CUSTOM QUESTION AUTHORING ==================== */}
        {builderMode === 'manual' && (
          <div className="space-y-6">
            {/* Deck Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên bộ đề tự soạn
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={manualSubtitle}
                  onChange={(e) => setManualSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời gian làm bài (phút)
                </label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={manualDuration}
                  onChange={(e) =>
                    setManualDuration(Math.max(5, Number(e.target.value) || 30))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold tabular-nums"
                />
              </div>
            </div>

            {/* Add New Question Card */}
            <div className="p-5 rounded-xl border-2 border-teal-600/70 bg-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Thêm câu hỏi mới (Câu số {manualQuestions.length + 1})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadTemplateQuestions(10)}
                    className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    + Nạp nhanh 10 câu mẫu từ ngân hàng
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn dạng câu hỏi
                  </label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold bg-white"
                  >
                    {QUESTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yêu cầu / Đề bài câu hỏi
                  </label>
                  <input
                    type="text"
                    value={qPrompt}
                    onChange={(e) => setQPrompt(e.target.value)}
                    placeholder="Ví dụ: Tiếng nào dưới đây mang thanh hỏi?"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Type-Specific Form Inputs */}
              {qType === 'mcq' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  {[
                    { id: 'A', val: optA, setVal: setOptA },
                    { id: 'B', val: optB, setVal: setOptB },
                    { id: 'C', val: optC, setVal: setOptC },
                    { id: 'D', val: optD, setVal: setOptD },
                  ].map((o) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOpt(o.id)}
                        title="Nhấn để chọn làm đáp án đúng"
                        className={`w-8 h-8 rounded-full font-bold text-xs shrink-0 cursor-pointer ${
                          correctOpt === o.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        {o.id}
                      </button>
                      <input
                        type="text"
                        value={o.val}
                        onChange={(e) => o.setVal(e.target.value)}
                        placeholder={`Nhập phương án ${o.id}...`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 sm:col-span-2">
                    * Nhấn vào chữ cái tròn (A, B, C, D) để đánh dấu đáp án đúng (Đang chọn: <strong>{correctOpt}</strong>).
                  </p>
                </div>
              )}

              {(qType === 'fill_text' || qType === 'dropdown') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Vế câu trước ô trống
                    </label>
                    <input
                      type="text"
                      value={sentBefore}
                      onChange={(e) => setSentBefore(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">
                      Đáp án đúng cần điền
                    </label>
                    <input
                      type="text"
                      value={correctText}
                      onChange={(e) => setCorrectText(e.target.value)}
                      placeholder="Ví dụ: dừa"
                      className="w-full px-3 py-2 rounded-lg border-2 border-emerald-600 bg-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Vế câu sau ô trống
                    </label>
                    <input
                      type="text"
                      value={sentAfter}
                      onChange={(e) => setSentAfter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Các từ gợi ý / lựa chọn (ngăn cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={hintListText}
                      onChange={(e) => setHintListText(e.target.value)}
                      placeholder="Ví dụ: dừa, dưa, cam, bưởi"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                </div>
              )}

              {qType === 'matching' && (
                <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-600">
                    Nhập 3 cặp tương ứng (Hệ thống sẽ tự động xáo trộn Cột B khi học sinh làm bài):
                  </div>
                  {[
                    {
                      idx: 1,
                      l: pair1L,
                      setL: setPair1L,
                      r: pair1R,
                      setR: setPair1R,
                    },
                    {
                      idx: 2,
                      l: pair2L,
                      setL: setPair2L,
                      r: pair2R,
                      setR: setPair2R,
                    },
                    {
                      idx: 3,
                      l: pair3L,
                      setL: setPair3L,
                      r: pair3R,
                      setR: setPair3R,
                    },
                  ].map((p) => (
                    <div
                      key={p.idx}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <input
                        type="text"
                        value={p.l}
                        onChange={(e) => p.setL(e.target.value)}
                        placeholder={`Cột A - Ô ${p.idx}`}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={p.r}
                        onChange={(e) => p.setR(e.target.value)}
                        placeholder={`Cột B tương ứng - Ô ${p.idx}`}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {qType === 'ordering' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Nhập câu hoàn chỉnh đúng thứ tự (Hệ thống sẽ tự tách thành các thẻ từ xáo trộn):
                  </label>
                  <input
                    type="text"
                    value={orderSentence}
                    onChange={(e) => setOrderSentence(e.target.value)}
                    placeholder="Ví dụ: Hà chờ mẹ ở bến đò."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold"
                  />
                </div>
              )}

              {qType === 'categorize' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tên Nhóm 1 & Các từ thuộc Nhóm 1 (cách nhau dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={group1Title}
                      onChange={(e) => setGroup1Title(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold"
                    />
                    <input
                      type="text"
                      value={group1Words}
                      onChange={(e) => setGroup1Words(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tên Nhóm 2 & Các từ thuộc Nhóm 2 (cách nhau dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={group2Title}
                      onChange={(e) => setGroup2Title(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold"
                    />
                    <input
                      type="text"
                      value={group2Words}
                      onChange={(e) => setGroup2Words(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Lời giải thích đáp án (không bắt buộc)..."
                  className="flex-1 min-w-[240px] px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddQuestionToManualDeck}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  Thêm câu hỏi này vào đề
                </button>
              </div>
            </div>

            {/* List of Questions Added to Current Manual Deck */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Danh sách câu hỏi trong đề đang soạn ({manualQuestions.length}{' '}
                  câu · {manualQuestions.length * 10} điểm)
                </h4>
                {manualQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setManualQuestions([])}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Xóa toàn bộ danh sách
                  </button>
                )}
              </div>

              {manualQuestions.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-500">
                  Chưa có câu hỏi nào. Hãy thêm câu hỏi ở biểu mẫu trên hoặc nhấn{' '}
                  <button
                    type="button"
                    onClick={() => handleLoadTemplateQuestions(10)}
                    className="text-teal-700 font-bold underline cursor-pointer"
                  >
                    Nạp nhanh 10 câu mẫu
                  </button>
                  .
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 max-h-80 overflow-y-auto">
                  {manualQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-bold text-teal-800">
                            Câu {idx + 1}
                          </span>
                          <span>·</span>
                          <span>{q.typeLabel}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {q.prompt}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setManualQuestions((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleSaveManualDeck(false)}
                  className="px-5 py-2.5 rounded-xl border-2 border-teal-700 text-teal-800 font-bold text-sm hover:bg-teal-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Lưu bộ đề vào Kho
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveManualDeck(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4" />
                  Lưu & Làm bộ đề này ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: SAVED EXAM DECKS LIBRARY ==================== */}
        {builderMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDecks.map((deck) => {
              const isCurrent = deck.id === activeDeckId;
              return (
                <div
                  key={deck.id}
                  className={`p-5 rounded-xl border-2 flex flex-col justify-between gap-4 transition-all ${
                    isCurrent
                      ? 'border-teal-600 bg-teal-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-teal-800">
                        {deck.isCustom ? 'Đề tự tạo' : 'Đề chuẩn hệ thống'} ·{' '}
                        {deck.createdAt}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 font-bold text-teal-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
                      {deck.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {deck.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                        {deck.questions.length} câu (
                        {deck.questions.length * 10} đ)
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-700" />
                        {deck.durationMinutes} phút
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {deck.isCustom && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomDeck(deck.id)}
                          title="Xóa đề tự tạo này"
                          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectAndStartDeck(deck, 'practice')}
                        className="px-3 py-1.5 rounded-lg border border-teal-700 text-teal-800 text-xs font-bold hover:bg-teal-50 cursor-pointer whitespace-nowrap"
                      >
                        Ôn luyện
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectAndStartDeck(deck, 'exam')}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 cursor-pointer whitespace-nowrap"
                      >
                        Vào thi
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
