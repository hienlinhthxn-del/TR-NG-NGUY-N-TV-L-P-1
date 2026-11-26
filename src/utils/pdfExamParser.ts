import { Question } from '../data/questions';

const PDFJS_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfJsLoadPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ đọc PDF.'));
  }
  const win = window as any;
  if (win.pdfjsLib) {
    win.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
    return Promise.resolve(win.pdfjsLib);
  }
  if (!pdfJsLoadPromise) {
    pdfJsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PDFJS_CDN;
      script.async = true;
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (!lib) {
          reject(new Error('Không thể khởi tạo thư viện đọc PDF.'));
          return;
        }
        lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        resolve(lib);
      };
      script.onerror = () => {
        pdfJsLoadPromise = null;
        reject(
          new Error(
            'Không thể tải thư viện đọc PDF. Vui lòng kiểm tra kết nối mạng.'
          )
        );
      };
      document.head.appendChild(script);
    });
  }
  return pdfJsLoadPromise;
}

export interface PdfExtractionResult {
  pageCount: number;
  rawText: string;
}

/**
 * Extract structured line-by-line Vietnamese text from a PDF ArrayBuffer in browser
 */
export async function extractTextFromPdfBuffer(
  buffer: ArrayBuffer
): Promise<PdfExtractionResult> {
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = (content.items || []) as any[];

    // Group text runs into visual lines using Y-coordinate tolerance
    const lines: { y: number; runs: { x: number; str: string }[] }[] = [];
    for (const item of items) {
      const str = typeof item.str === 'string' ? item.str : '';
      if (!str.trim()) continue;
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;

      let line = lines.find((l) => Math.abs(l.y - y) <= 4);
      if (!line) {
        line = { y, runs: [] };
        lines.push(line);
      }
      line.runs.push({ x, str });
    }

    // Sort top-to-bottom (higher Y first in PDF coordinates)
    lines.sort((a, b) => b.y - a.y);

    const formattedLines = lines.map((line) => {
      line.runs.sort((a, b) => a.x - b.x);
      return line.runs
        .map((r) => r.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    });

    pageTexts.push(formattedLines.filter(Boolean).join('\n'));
  }

  return {
    pageCount: pdf.numPages,
    rawText: pageTexts.join('\n\n'),
  };
}

function cleanLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Parse extracted Vietnamese exam text (TNTV style) into structured Question objects
 */
export function parseVietnameseExamText(rawText: string): Question[] {
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!normalized) return [];

  // Split blocks by question headers: "Câu 1.", "Câu 1:", "Câu hỏi 1", "Bài 1."
  const questionHeaderRegex =
    /(?:^|\n)\s*(?:Câu(?:\s+hỏi)?|Bài)\s*(\d+)\s*[:.)\-]?\s*/gi;

  const matches: { index: number; headerLen: number; num: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = questionHeaderRegex.exec(normalized)) !== null) {
    matches.push({
      index: m.index,
      headerLen: m[0].length,
      num: parseInt(m[1], 10),
    });
  }

  const blocks: string[] = [];
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i].headerLen;
      const end =
        i + 1 < matches.length ? matches[i + 1].index : normalized.length;
      const content = normalized.slice(start, end).trim();
      if (content) blocks.push(content);
    }
  } else {
    // Fallback: split by double newlines if no "Câu X" prefix found
    normalized
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 8)
      .forEach((b) => blocks.push(b));
  }

  const baseId = Date.now() * 1000;
  const parsed: Question[] = [];

  blocks.forEach((block, idx) => {
    const qNumber = idx + 1;

    // Extract optional explicit answer line: "Đáp án: B" or "Đáp án đúng: ..."
    let detectedAnswer = '';
    let detectedExplanation = '';

    const expMatch = block.match(/(?:Giải thích|Hướng dẫn)\s*[:\-]\s*([\s\S]+)$/i);
    let workingBlock = block;
    if (expMatch) {
      detectedExplanation = cleanLine(expMatch[1]);
      workingBlock = workingBlock.slice(0, expMatch.index).trim();
    }

    const ansMatch = workingBlock.match(
      /(?:Đáp án(?:\s+đúng)?|Trả lời)\s*[:\-]\s*([^\n]+)/i
    );
    if (ansMatch) {
      detectedAnswer = cleanLine(ansMatch[1]);
      workingBlock = workingBlock.replace(ansMatch[0], '').trim();
    }

    // 1. Try detecting MCQ options (A. / B. / C. / D.)
    const optRegex = /(?:^|\s|\n)(\*?[A-D])\s*[.)]\s+/g;
    const optPositions: { id: string; isStarred: boolean; index: number; len: number }[] = [];
    let om: RegExpExecArray | null;
    while ((om = optRegex.exec(workingBlock)) !== null) {
      const rawId = om[1];
      const id = rawId.replace('*', '').toUpperCase();
      optPositions.push({
        id,
        isStarred: rawId.startsWith('*'),
        index: om.index,
        len: om[0].length,
      });
    }

    const hasABCD =
      optPositions.length >= 2 &&
      optPositions.some((o) => o.id === 'A') &&
      optPositions.some((o) => o.id === 'B');

    if (hasABCD) {
      const firstOptIdx = optPositions[0].index;
      const promptPart = cleanLine(workingBlock.slice(0, firstOptIdx));
      const mcqOptions: { id: string; text: string }[] = [];
      let correctId = 'A';

      for (let i = 0; i < optPositions.length; i++) {
        const cur = optPositions[i];
        const nextIdx =
          i + 1 < optPositions.length
            ? optPositions[i + 1].index
            : workingBlock.length;
        const optText = cleanLine(
          workingBlock.slice(cur.index + cur.len, nextIdx)
        );
        if (!mcqOptions.some((o) => o.id === cur.id)) {
          mcqOptions.push({ id: cur.id, text: optText || `Phương án ${cur.id}` });
        }
        if (cur.isStarred) {
          correctId = cur.id;
        }
      }

      if (detectedAnswer) {
        const letterMatch = detectedAnswer.match(/^([A-D])\b/i);
        if (letterMatch) {
          correctId = letterMatch[1].toUpperCase();
        } else {
          const matchedOpt = mcqOptions.find(
            (o) => o.text.toLowerCase() === detectedAnswer.toLowerCase()
          );
          if (matchedOpt) correctId = matchedOpt.id;
        }
      }

      parsed.push({
        id: baseId + idx,
        number: qNumber,
        type: 'mcq',
        typeLabel: 'Trắc nghiệm (PDF)',
        points: 10,
        prompt: promptPart || `Câu hỏi trắc nghiệm số ${qNumber}`,
        mcqOptions,
        correctMcqId: correctId,
        explanation:
          detectedExplanation ||
          `Đáp án đúng là phương án ${correctId}. (Giáo viên có thể chỉnh lại đáp án đúng nếu cần.)`,
      });
      return;
    }

    // 2. Try detecting Ordering question ("Sắp xếp...")
    const lowerBlock = workingBlock.toLowerCase();
    if (lowerBlock.includes('sắp xếp')) {
      const lines = workingBlock
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const prompt = lines[0] || `Sắp xếp câu ${qNumber}`;
      const tokenSource = lines.slice(1).join(' ');
      let tokens = tokenSource
        .split(/[/|,]/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (tokens.length < 3 && detectedAnswer) {
        tokens = detectedAnswer.split(/\s+/).filter(Boolean);
      }
      if (tokens.length < 3) {
        tokens = ['Em', 'rất', 'yêu', 'trường', 'em.'];
      }

      const correctOrder = detectedAnswer
        ? detectedAnswer.split(/\s+/).filter(Boolean)
        : [...tokens];

      const shuffled = [...tokens];
      if (shuffled.length > 1) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
      }

      parsed.push({
        id: baseId + idx,
        number: qNumber,
        type: 'ordering',
        typeLabel: 'Sắp xếp (PDF)',
        points: 10,
        prompt,
        orderingTokens: shuffled,
        correctOrder:
          correctOrder.length === tokens.length ? correctOrder : tokens,
        orderingJoiner: ' ',
        explanation:
          detectedExplanation ||
          `Thứ tự đúng: "${(correctOrder.length === tokens.length
            ? correctOrder
            : tokens
          ).join(' ')}"`,
      });
      return;
    }

    // 3. Default / Fill-in-the-blank ("Điền...", "...", "___", "[...]")
    const lines = workingBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const promptLine = lines[0] || `Câu hỏi số ${qNumber}`;
    const bodyText = lines.slice(1).join(' ') || promptLine;

    // Detect hint options in parentheses like "(thi, bi, vi)"
    let hintOptions: string[] | undefined;
    const parenMatch = workingBlock.match(/\(([^()]{2,60})\)/);
    if (parenMatch && parenMatch[1].includes(',')) {
      const hints = parenMatch[1]
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
      if (hints.length >= 2 && hints.length <= 6) {
        hintOptions = hints;
      }
    }

    // Split around blank marker (..., ___, [ ])
    const blankRegex = /(?:\.{3,}|_{2,}|\[\s*\.{0,3}\s*\])/;
    const blankMatch = bodyText.match(blankRegex);
    let sentenceBefore = '';
    let sentenceAfter = '';
    if (blankMatch && blankMatch.index !== undefined) {
      sentenceBefore = bodyText.slice(0, blankMatch.index);
      sentenceAfter = bodyText.slice(blankMatch.index + blankMatch[0].length);
    } else {
      sentenceBefore = `${bodyText} `;
      sentenceAfter = '.';
    }

    const defaultAns =
      detectedAnswer || (hintOptions && hintOptions[0]) || 'đáp án';

    parsed.push({
      id: baseId + idx,
      number: qNumber,
      type: 'fill_text',
      typeLabel: 'Điền từ vào chỗ trống (PDF)',
      points: 10,
      prompt: promptLine,
      sentenceBefore,
      sentenceAfter,
      hintOptions,
      correctTextAnswers: [defaultAns],
      explanation:
        detectedExplanation ||
        `Đáp án cần điền là "${defaultAns}". (Giáo viên hãy kiểm tra lại đáp án chuẩn trước khi lưu.)`,
    });
  });

  return parsed;
}
