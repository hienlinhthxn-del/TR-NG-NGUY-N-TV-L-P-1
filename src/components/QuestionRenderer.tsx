import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Link2,
  ArrowUpDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  Question,
  checkQuestionCorrect,
  isQuestionAnswered,
} from '../data/questions';

interface QuestionRendererProps {
  question: Question;
  answer: any;
  onChange: (value: any) => void;
  isSubmitted: boolean;
  instantFeedback: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onChange,
  isSubmitted,
  instantFeedback,
}) => {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const answered = isQuestionAnswered(question, answer);
  const isCorrect = checkQuestionCorrect(question, answer);
  const showFeedback = isSubmitted || (instantFeedback && answered);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const handleImageError = (key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  // --- 1. MCQ Renderer (Q1 - Q10) ---
  const renderMcq = () => {
    const options = question.mcqOptions || [];
    return (
      <div className="space-y-5">
        {question.subPrompt && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-lg font-medium text-slate-800">
            {question.subPrompt}
          </div>
        )}

        {question.imageUrl && (
          <div className="my-4">
            {!imageErrors['main'] ? (
              <img
                src={question.imageUrl}
                alt={question.imageAlt || question.prompt}
                referrerPolicy="no-referrer"
                onError={() => handleImageError('main')}
                className="max-h-72 rounded-xl border border-slate-200 object-contain bg-white p-2 shadow-xs"
              />
            ) : (
              <div className="h-48 w-64 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-600 p-4 text-center">
                {question.imageAlt || 'Hình minh họa câu hỏi'}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {options.map((opt) => {
            const isSelected = answer === opt.id;
            const isOptCorrect = opt.id === question.correctMcqId;

            let cardStyle =
              'border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/30 text-slate-800';
            if (isSelected) {
              cardStyle =
                'border-teal-600 bg-teal-50/60 text-slate-900 ring-2 ring-teal-600/20';
            }
            if (showFeedback) {
              if (isOptCorrect) {
                cardStyle =
                  'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-600/20';
              } else if (isSelected && !isOptCorrect) {
                cardStyle =
                  'border-rose-600 bg-rose-50/80 text-rose-950 ring-2 ring-rose-600/20';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isSubmitted}
                onClick={() => onChange(opt.id)}
                className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer disabled:cursor-default ${cardStyle}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border transition-colors ${
                      showFeedback && isOptCorrect
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : showFeedback && isSelected && !isOptCorrect
                        ? 'bg-rose-600 text-white border-rose-600'
                        : isSelected
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="text-base sm:text-lg font-medium leading-snug">
                    {opt.text}
                  </span>
                </div>
                {showFeedback && isOptCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {showFeedback && isSelected && !isOptCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --- 2. Fill in the Blank Text Renderer (Q11 - Q15) ---
  const renderFillText = () => {
    const currentVal = typeof answer === 'string' ? answer : '';

    return (
      <div className="space-y-5">
        {question.imageUrl && (
          <div className="flex flex-wrap items-start gap-6 my-2">
            {!imageErrors['main'] ? (
              <img
                src={question.imageUrl}
                alt={question.imageAlt || question.prompt}
                referrerPolicy="no-referrer"
                onError={() => handleImageError('main')}
                className="max-h-64 rounded-xl border border-slate-200 object-contain bg-white p-3 shadow-xs"
              />
            ) : (
              <div className="h-48 w-64 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-600 p-4">
                {question.imageAlt}
              </div>
            )}

            {question.wordSearchGrid && (
              <div className="bg-teal-600 p-3 rounded-xl shadow-xs">
                <div className="bg-white p-3 rounded-lg grid grid-cols-5 gap-2">
                  {question.wordSearchGrid.flat().map((letter, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-base sm:text-lg font-bold text-slate-900 tabular-nums"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-teal-50 mt-2 text-center">
                  Bảng ô chữ tương tác rõ nét
                </p>
              </div>
            )}
          </div>
        )}

        {question.subPrompt && (
          <p className="text-base font-medium text-slate-700 italic">
            {question.subPrompt}
          </p>
        )}

        {question.hintOptions && question.hintOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">
              Chọn nhanh hoặc tự gõ:
            </span>
            {question.hintOptions.map((hint) => {
              const active =
                currentVal.trim().toLowerCase() === hint.toLowerCase();
              return (
                <button
                  key={hint}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => onChange(hint)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-teal-500 hover:bg-teal-50/40'
                  }`}
                >
                  {hint}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-lg sm:text-xl font-medium text-slate-900">
          <span>{question.sentenceBefore}</span>
          <input
            type="text"
            disabled={isSubmitted}
            value={currentVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder="..."
            aria-label="Nhập đáp án vào chỗ trống"
            className={`w-28 sm:w-36 px-3 py-1.5 text-center font-bold rounded-lg border-2 bg-white transition-colors focus:outline-none ${
              showFeedback
                ? isCorrect
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50'
                  : 'border-rose-600 text-rose-900 bg-rose-50/50'
                : 'border-teal-600 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
            }`}
          />
          <span>{question.sentenceAfter}</span>
        </div>
      </div>
    );
  };

  // --- 3. Matching Pairs Renderer (Q16 - Q19) ---
  const renderMatching = () => {
    const leftItems = question.leftItems || [];
    const rightItems = question.rightItems || [];
    const currentPairs: Record<string, string> =
      typeof answer === 'object' && answer !== null ? answer : {};

    const pairBadgeNumbers: Record<string, number> = {};
    leftItems.forEach((item, index) => {
      pairBadgeNumbers[item.id] = index + 1;
    });

    const handleLeftClick = (leftId: string) => {
      if (isSubmitted) return;
      if (selectedLeftId === leftId) {
        setSelectedLeftId(null);
      } else {
        setSelectedLeftId(leftId);
      }
    };

    const handleRightClick = (rightId: string) => {
      if (isSubmitted) return;
      if (!selectedLeftId) {
        // Find first unpaired left item
        const firstUnpaired = leftItems.find((l) => !currentPairs[l.id]);
        if (firstUnpaired) {
          const next = { ...currentPairs };
          // Remove existing mapping to this rightId
          Object.keys(next).forEach((k) => {
            if (next[k] === rightId) delete next[k];
          });
          next[firstUnpaired.id] = rightId;
          onChange(next);
        }
        return;
      }
      const next = { ...currentPairs };
      Object.keys(next).forEach((k) => {
        if (next[k] === rightId) delete next[k];
      });
      next[selectedLeftId] = rightId;
      onChange(next);
      setSelectedLeftId(null);
    };

    const handleUnpair = (leftId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSubmitted) return;
      const next = { ...currentPairs };
      delete next[leftId];
      onChange(next);
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
          <span>
            Hướng dẫn: Nhấn chọn một ô ở <strong>Cột A (trái)</strong>, sau đó nhấn vào ô tương ứng ở <strong>Cột B (phải)</strong> để nối cặp.
          </span>
          {!isSubmitted && Object.keys(currentPairs).length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange({});
                setSelectedLeftId(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Làm lại câu này
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 px-1">
              Cột A (Nhấn để chọn)
            </div>
            {leftItems.map((left, idx) => {
              const pairedRightId = currentPairs[left.id];
              const isSelecting = selectedLeftId === left.id;
              const isPairCorrect =
                question.correctPairs?.[left.id] === pairedRightId;

              let borderClass = 'border-slate-200 bg-teal-50/30 hover:border-teal-500';
              if (isSelecting) {
                borderClass = 'border-teal-600 bg-teal-50 ring-2 ring-teal-500/30';
              } else if (pairedRightId) {
                borderClass = 'border-teal-600 bg-teal-50/70';
              }
              if (showFeedback && pairedRightId) {
                borderClass = isPairCorrect
                  ? 'border-emerald-600 bg-emerald-50/70'
                  : 'border-rose-600 bg-rose-50/70';
              }

              return (
                <div
                  key={left.id}
                  onClick={() => handleLeftClick(left.id)}
                  className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border-2 transition-all min-h-24 cursor-pointer ${borderClass}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    {left.imageUrl && !imageErrors[left.id] ? (
                      <img
                        src={left.imageUrl}
                        alt={left.imageAlt || left.text || ''}
                        referrerPolicy="no-referrer"
                        onError={() => handleImageError(left.id)}
                        className="w-24 h-20 object-contain rounded-lg bg-white border border-slate-200 p-1 shrink-0"
                      />
                    ) : null}
                    {(!left.imageUrl || imageErrors[left.id]) && left.text && (
                      <span className="text-lg font-semibold text-slate-900">
                        {left.text}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {pairedRightId ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-700 text-white text-xs font-semibold whitespace-nowrap">
                          <Link2 className="w-3.5 h-3.5" />
                          Đã nối #{idx + 1}
                        </span>
                        {!isSubmitted && (
                          <button
                            type="button"
                            onClick={(e) => handleUnpair(left.id, e)}
                            title="Hủy nối"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        {isSelecting ? 'Đang chọn...' : 'Chưa nối'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 px-1">
              Cột B (Nhấn để ghép cặp)
            </div>
            {rightItems.map((right) => {
              const matchedLeftId = Object.keys(currentPairs).find(
                (lId) => currentPairs[lId] === right.id
              );
              const badgeNum = matchedLeftId
                ? pairBadgeNumbers[matchedLeftId]
                : null;
              const isPairCorrect =
                matchedLeftId &&
                question.correctPairs?.[matchedLeftId] === right.id;

              let borderClass =
                'border-slate-200 bg-teal-50/30 hover:border-teal-500';
              if (matchedLeftId) {
                borderClass = 'border-teal-600 bg-teal-50/70';
              }
              if (showFeedback && matchedLeftId) {
                borderClass = isPairCorrect
                  ? 'border-emerald-600 bg-emerald-50/70'
                  : 'border-rose-600 bg-rose-50/70';
              }

              return (
                <div
                  key={right.id}
                  onClick={() => handleRightClick(right.id)}
                  className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border-2 transition-all min-h-24 cursor-pointer ${borderClass}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {right.imageUrl && !imageErrors[right.id] ? (
                      <img
                        src={right.imageUrl}
                        alt={right.imageAlt || right.text || ''}
                        referrerPolicy="no-referrer"
                        onError={() => handleImageError(right.id)}
                        className="w-24 h-20 object-contain rounded-lg bg-white border border-slate-200 p-1 shrink-0"
                      />
                    ) : null}
                    {(!right.imageUrl || imageErrors[right.id]) &&
                      right.text && (
                        <span className="text-base sm:text-lg font-medium text-slate-900">
                          {right.text}
                        </span>
                      )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {badgeNum ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-white text-xs font-bold whitespace-nowrap tabular-nums">
                        Ghép với #{badgeNum}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        Nhấn để ghép
                      </span>
                    )}
                    {showFeedback && matchedLeftId && (
                      isPairCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- 4. Ordering Tokens Renderer (Q20 - Q22) ---
  const renderOrdering = () => {
    const allTokens = question.orderingTokens || [];
    const currentOrder: string[] = Array.isArray(answer) ? answer : [];

    // Remaining tokens (handle duplicates gracefully by index if ever needed, here all tokens are unique)
    const remainingTokens = allTokens.filter(
      (token) => !currentOrder.includes(token)
    );

    const handleAddToken = (token: string) => {
      if (isSubmitted) return;
      onChange([...currentOrder, token]);
    };

    const handleRemoveToken = (token: string) => {
      if (isSubmitted) return;
      onChange(currentOrder.filter((t) => t !== token));
    };

    const handleSwap = (idxA: number, idxB: number) => {
      if (isSubmitted) return;
      if (idxB < 0 || idxB >= currentOrder.length) return;
      const copy = [...currentOrder];
      const temp = copy[idxA];
      copy[idxA] = copy[idxB];
      copy[idxB] = temp;
      onChange(copy);
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
          <span>
            Hướng dẫn: Nhấn lần lượt vào các thẻ bên dưới để sắp xếp theo đúng thứ tự. Nhấn vào thẻ đã xếp để đưa về kho.
          </span>
          {!isSubmitted && currentOrder.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xếp lại từ đầu
            </button>
          )}
        </div>

        {/* Source Token Pool */}
        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300">
          <div className="text-xs font-semibold text-slate-500 mb-3">
            Các thẻ cần sắp xếp ({remainingTokens.length} thẻ còn lại):
          </div>
          <div className="flex flex-wrap gap-2.5 min-h-12 items-center">
            {remainingTokens.length === 0 ? (
              <span className="text-sm text-slate-400 italic">
                Đã đưa hết thẻ xuống khay kết quả bên dưới.
              </span>
            ) : (
              remainingTokens.map((token) => (
                <button
                  key={token}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleAddToken(token)}
                  className="px-4 py-2.5 rounded-lg bg-white border-2 border-slate-300 hover:border-teal-600 hover:bg-teal-50/40 text-base sm:text-lg font-bold text-slate-900 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {token}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ordered Result Tray */}
        <div
          className={`p-5 rounded-xl border-2 transition-colors ${
            showFeedback
              ? isCorrect
                ? 'border-emerald-600 bg-emerald-50/50'
                : 'border-rose-600 bg-rose-50/50'
              : 'border-teal-600/70 bg-teal-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600">
              Thứ tự của em ({currentOrder.length}/{allTokens.length}):
            </span>
            {currentOrder.length > 0 && (
              <span className="text-sm font-semibold text-teal-900">
                Kết quả ghép:{' '}
                <strong className="underline decoration-teal-500/50">
                  {question.id === 22
                    ? currentOrder.join('') === 'Bànghế'
                      ? 'Bàn ghế'
                      : currentOrder.join('')
                    : currentOrder.join(question.orderingJoiner ?? ' ')}
                </strong>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 min-h-14 items-center">
            {currentOrder.length === 0 ? (
              <span className="text-sm text-slate-400">
                Nhấn vào các thẻ ở khung trên để xếp vào đây...
              </span>
            ) : (
              currentOrder.map((token, idx) => (
                <div
                  key={token}
                  className="inline-flex items-center bg-white border-2 border-teal-600 rounded-lg shadow-2xs overflow-hidden"
                >
                  {!isSubmitted && idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSwap(idx, idx - 1)}
                      title="Đổi sang trái"
                      className="px-1.5 py-2 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      ←
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleRemoveToken(token)}
                    title="Nhấn để bỏ thẻ này ra"
                    className="px-3.5 py-2 text-base sm:text-lg font-bold text-slate-900 hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {token}
                  </button>
                  {!isSubmitted && idx < currentOrder.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleSwap(idx, idx + 1)}
                      title="Đổi sang phải"
                      className="px-1.5 py-2 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- 5. Categorize into Groups Renderer (Q23 - Q24) ---
  const renderCategorize = () => {
    const categories = question.categories || [];
    const items = question.categorizeItems || [];
    const assignments: Record<string, string> =
      typeof answer === 'object' && answer !== null ? answer : {};

    const unassignedItems = items.filter((item) => !assignments[item.id]);

    const handleAssignToGroup = (groupId: string) => {
      if (isSubmitted) return;
      const targetWordId =
        selectedWordId || (unassignedItems[0] ? unassignedItems[0].id : null);
      if (!targetWordId) return;
      onChange({
        ...assignments,
        [targetWordId]: groupId,
      });
      setSelectedWordId(null);
    };

    const handleDirectAssign = (wordId: string, groupId: string) => {
      if (isSubmitted) return;
      onChange({
        ...assignments,
        [wordId]: groupId,
      });
      if (selectedWordId === wordId) setSelectedWordId(null);
    };

    const handleUnassign = (wordId: string) => {
      if (isSubmitted) return;
      const copy = { ...assignments };
      delete copy[wordId];
      onChange(copy);
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
          <span>
            Hướng dẫn: Nhấn chọn một từ ở kho bên dưới rồi nhấn vào hộp nhóm thích hợp (hoặc kéo thả từ vào nhóm).
          </span>
          {!isSubmitted && Object.keys(assignments).length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange({});
                setSelectedWordId(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xếp lại tất cả
            </button>
          )}
        </div>

        {/* Word Bank */}
        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300">
          <div className="text-xs font-semibold text-slate-500 mb-3">
            Kho từ cần phân loại ({unassignedItems.length}/{items.length} từ chưa xếp):
          </div>
          <div className="flex flex-wrap gap-2.5 min-h-12 items-center">
            {unassignedItems.length === 0 ? (
              <span className="text-sm text-emerald-700 font-medium">
                Tất cả các từ đã được xếp vào các nhóm bên dưới!
              </span>
            ) : (
              unassignedItems.map((item) => {
                const isSelected = selectedWordId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    draggable={!isSubmitted}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id);
                      setSelectedWordId(item.id);
                    }}
                    disabled={isSubmitted}
                    onClick={() =>
                      setSelectedWordId(isSelected ? null : item.id)
                    }
                    className={`px-3.5 py-2 rounded-lg text-base font-semibold border-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-500/30'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-teal-500'
                    }`}
                  >
                    {item.text}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Category Buckets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const groupItems = items.filter(
              (it) => assignments[it.id] === cat.id
            );

            return (
              <div
                key={cat.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const wordId = e.dataTransfer.getData('text/plain');
                  if (wordId) handleDirectAssign(wordId, cat.id);
                }}
                onClick={() => handleAssignToGroup(cat.id)}
                className={`p-4 rounded-xl border-2 transition-all min-h-36 flex flex-col justify-between ${
                  selectedWordId
                    ? 'border-teal-500 bg-teal-50/30 cursor-pointer hover:bg-teal-50/60'
                    : 'border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200">
                    <span className="text-sm font-bold text-teal-900 bg-teal-100/80 px-3 py-1 rounded-md">
                      {cat.title}
                    </span>
                    <span className="text-xs font-medium text-slate-500 tabular-nums">
                      {groupItems.length} từ
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {groupItems.length === 0 ? (
                      <span className="text-xs text-slate-400 italic py-4">
                        {selectedWordId
                          ? 'Nhấn vào đây để đặt từ đang chọn vào nhóm này'
                          : 'Chưa có từ nào trong nhóm này'}
                      </span>
                    ) : (
                      groupItems.map((item) => {
                        const itemCorrect = item.correctGroupId === cat.id;
                        let chipStyle =
                          'bg-teal-50 border-teal-600 text-slate-900';
                        if (showFeedback) {
                          chipStyle = itemCorrect
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                            : 'bg-rose-50 border-rose-600 text-rose-950';
                        }

                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={isSubmitted}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassign(item.id);
                            }}
                            title="Nhấn để đưa từ này trở lại kho"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${chipStyle}`}
                          >
                            <span>{item.text}</span>
                            {showFeedback ? (
                              itemCorrect ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              )
                            ) : (
                              <span className="text-xs text-slate-400 hover:text-rose-600">
                                ×
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- 6. Dropdown Fill Renderer (Q25 - Q30) ---
  const renderDropdown = () => {
    const currentVal = typeof answer === 'string' ? answer : '';
    const options = question.dropdownOptions || [];

    return (
      <div className="space-y-5">
        {question.imageUrl && (
          <div className="my-2">
            {!imageErrors['main'] ? (
              <img
                src={question.imageUrl}
                alt={question.imageAlt || question.prompt}
                referrerPolicy="no-referrer"
                onError={() => handleImageError('main')}
                className="max-h-64 rounded-xl border border-slate-200 object-contain bg-white p-3 shadow-xs"
              />
            ) : (
              <div className="h-44 w-64 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-600 p-4">
                {question.imageAlt}
              </div>
            )}
          </div>
        )}

        {question.poemLines && (
          <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5 max-w-md">
            {question.poemLines.map((line, i) => (
              <p
                key={i}
                className="text-lg font-medium text-slate-800 leading-relaxed"
              >
                {line}
              </p>
            ))}
          </div>
        )}

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2.5 text-lg sm:text-xl font-medium text-slate-900">
          <span>{question.sentenceBefore}</span>
          <select
            disabled={isSubmitted}
            value={currentVal}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Chọn đáp án đúng"
            className={`px-4 py-2 rounded-lg border-2 font-bold text-base sm:text-lg bg-white cursor-pointer transition-colors focus:outline-none ${
              showFeedback
                ? isCorrect
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50'
                  : 'border-rose-600 text-rose-900 bg-rose-50'
                : currentVal
                ? 'border-teal-600 text-teal-950'
                : 'border-slate-300 text-slate-600'
            }`}
          >
            <option value="">Chọn đáp án</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>{question.sentenceAfter}</span>
        </div>

        {/* Quick-select pill buttons for easier touch interaction for elementary kids */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Hoặc nhấn chọn nhanh:
          </span>
          {options.map((opt) => {
            const active = currentVal === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={isSubmitted}
                onClick={() => onChange(opt)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-teal-500'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 transition-all">
      {/* Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-lg bg-teal-700 text-white font-display font-bold text-sm sm:text-base tabular-nums">
            Câu hỏi {question.number}
          </span>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span>{question.typeLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-medium">
              {question.points} điểm
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            speakText(
              `Câu hỏi ${question.number}. ${question.prompt} ${
                question.subPrompt || ''
              } ${question.poemLines ? question.poemLines.join('. ') : ''}`
            )
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Đọc câu hỏi bằng giọng nói tiếng Việt"
        >
          <Volume2 className="w-4 h-4" />
          Đọc câu hỏi
        </button>
      </div>

      {/* Prompt */}
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 leading-snug">
        {question.prompt}
      </h2>

      {/* Dynamic Interaction Body */}
      <div>
        {question.type === 'mcq' && renderMcq()}
        {question.type === 'fill_text' && renderFillText()}
        {question.type === 'matching' && renderMatching()}
        {question.type === 'ordering' && renderOrdering()}
        {question.type === 'categorize' && renderCategorize()}
        {question.type === 'dropdown' && renderDropdown()}
      </div>

      {/* Explanation & Grading Feedback Banner */}
      {showFeedback && (
        <div
          className={`mt-6 p-4 rounded-xl border ${
            isCorrect
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base mb-1.5">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Chính xác! (+{question.points} điểm)</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  {answered ? 'Chưa chính xác' : 'Chưa trả lời câu hỏi này'}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            <strong>Giải thích: </strong>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
