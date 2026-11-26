import { Question } from '../data/questions';

const PDFJS_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESSERACT_CDN =
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

let pdfJsLoadPromise: Promise<any> | null = null;
let tesseractLoadPromise: Promise<any> | null = null;

function loadScriptOnce(src: string, globalName: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ tính năng này.'));
  }
  const win = window as any;
  if (win[globalName]) return Promise.resolve(win[globalName]);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      const lib = (window as any)[globalName];
      if (!lib) {
        reject(new Error(`Không thể khởi tạo thư viện ${globalName}.`));
        return;
      }
      resolve(lib);
    };
    script.onerror = () => {
      reject(
        new Error(
          `Không thể tải thư viện ${globalName}. Vui lòng kiểm tra kết nối mạng.`
        )
      );
    };
    document.head.appendChild(script);
  });
}

function loadPdfJs(): Promise<any> {
  if (!pdfJsLoadPromise) {
    pdfJsLoadPromise = loadScriptOnce(PDFJS_CDN, 'pdfjsLib')
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        return lib;
      })
      .catch((err) => {
        pdfJsLoadPromise = null;
        throw err;
      });
  }
  return pdfJsLoadPromise;
}

function loadTesseract(): Promise<any> {
  if (!tesseractLoadPromise) {
    tesseractLoadPromise = loadScriptOnce(TESSERACT_CDN, 'Tesseract').catch(
      (err) => {
        tesseractLoadPromise = null;
        throw err;
      }
    );
  }
  return tesseractLoadPromise;
}

export interface PdfExtractionResult {
  pageCount: number;
  rawText: string;
  usedOcr: boolean;
  pageImages: string[];
}

/**
 * Render a single PDF page to a JPEG Data URL for OCR or preview
 */
async function renderPdfPageToDataUrl(
  page: any,
  scale = 1.8
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * Extract structured Vietnamese text from a PDF ArrayBuffer.
 * Automatically falls back to browser Vietnamese OCR (Tesseract.js) when the PDF
 * is made of screenshots or scanned pages (like the original TNTV PDF).
 */
export async function extractTextFromPdfBuffer(
  buffer: ArrayBuffer,
  onProgress?: (message: string) => void
): Promise<PdfExtractionResult> {
  onProgress?.('Đang mở file PDF...');
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  const pageImages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Đang đọc lớp chữ trang ${pageNum}/${pdf.numPages}...`);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = (content.items || []) as any[];

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

  const directText = pageTexts.join('\n\n').trim();
  const avgCharsPerPage = pdf.numPages > 0 ? directText.length / pdf.numPages : 0;

  // If the PDF is mostly screenshots/images (< 60 chars/page), run Vietnamese OCR!
  if (avgCharsPerPage < 60) {
    onProgress?.(
      'Phát hiện PDF dạng ảnh chụp/scan. Đang tải bộ nhận diện chữ Tiếng Việt (OCR)...'
    );
    const Tesseract = await loadTesseract();
    const worker = await Tesseract.createWorker('vie', 1, {
      logger: (m: any) => {
        if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
          const pct = Math.round(m.progress * 100);
          onProgress?.(`Đang nhận diện chữ (OCR)... ${pct}%`);
        }
      },
    });

    const ocrPageTexts: string[] = [];
    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        onProgress?.(
          `Đang nhận diện chữ Tiếng Việt trang ${pageNum}/${pdf.numPages}...`
        );
        const page = await pdf.getPage(pageNum);
        const dataUrl = await renderPdfPageToDataUrl(page, 2.0);
        pageImages.push(dataUrl);
        if (dataUrl) {
          const result = await worker.recognize(dataUrl);
          const text = result?.data?.text?.trim() || '';
          if (text) ocrPageTexts.push(text);
        }
      }
    } finally {
      await worker.terminate();
    }

    return {
      pageCount: pdf.numPages,
      rawText: ocrPageTexts.join('\n\n'),
      usedOcr: true,
      pageImages,
    };
  }

  return {
    pageCount: pdf.numPages,
    rawText: directText,
    usedOcr: false,
    pageImages,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Use Gemini 2.5 Flash Vision API directly from browser to extract 100% accurate
 * TNTV questions (text + images + answers + explanations) from any PDF file.
 */
export async function extractExamWithGeminiAI(
  buffer: ArrayBuffer,
  apiKey: string,
  onProgress?: (message: string) => void
): Promise<Question[]> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Vui lòng nhập Gemini API Key để sử dụng chế độ AI.');
  }

  onProgress?.('Đang gửi file PDF lên Gemini AI để đọc cả chữ và hình ảnh...');
  const pdfBase64 = arrayBufferToBase64(buffer);

  const instruction = `Bạn là chuyên gia giáo dục Tiểu học Việt Nam. Hãy đọc toàn bộ các trang trong file PDF đề thi Trạng Nguyên Tiếng Việt này (bao gồm cả văn bản và hình ảnh chụp màn hình) và trích xuất CHÍNH XÁC từng câu hỏi sang mảng JSON.

Quy tắc bắt buộc:
- Chỉ trả về JSON hợp lệ (mảng các đối tượng Question), KHÔNG kèm markdown \`\`\`json hay giải thích thừa.
- Mỗi phần tử trong mảng phải có cấu trúc đúng theo một trong các dạng:
  1. Dạng trắc nghiệm ("mcq"):
     { "number": 1, "type": "mcq", "typeLabel": "Trắc nghiệm", "points": 10, "prompt": "...", "subPrompt": "...", "mcqOptions": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}], "correctMcqId": "C", "explanation": "..." }
  2. Dạng điền từ vào chỗ trống ("fill_text"):
     { "number": 11, "type": "fill_text", "typeLabel": "Điền chữ vào chỗ trống", "points": 10, "prompt": "...", "subPrompt": "...", "sentenceBefore": "...", "sentenceAfter": "...", "hintOptions": ["..."], "correctTextAnswers": ["..."], "explanation": "..." }
  3. Dạng nối cặp ("matching"):
     { "number": 16, "type": "matching", "typeLabel": "Ghép cặp tương ứng", "points": 10, "prompt": "...", "leftItems": [{"id":"L1","text":"..."},{"id":"L2","text":"..."},{"id":"L3","text":"..."}], "rightItems": [{"id":"R1","text":"..."},{"id":"R2","text":"..."},{"id":"R3","text":"..."}], "correctPairs": {"L1":"R2","L2":"R3","L3":"R1"}, "explanation": "..." }
  4. Dạng sắp xếp ("ordering"):
     { "number": 20, "type": "ordering", "typeLabel": "Sắp xếp", "points": 10, "prompt": "...", "orderingTokens": ["..."], "correctOrder": ["..."], "orderingJoiner": " ", "explanation": "..." }
  5. Dạng phân loại nhóm ("categorize"):
     { "number": 23, "type": "categorize", "typeLabel": "Phân loại từ", "points": 10, "prompt": "...", "categories": [{"id":"g1","title":"..."},{"id":"g2","title":"..."}], "categorizeItems": [{"id":"i1","text":"...","correctGroupId":"g1"}], "explanation": "..." }
  6. Dạng chọn từ trong danh sách / Giải câu đố ("dropdown"):
     { "number": 25, "type": "dropdown", "typeLabel": "Chọn từ hoàn thành câu", "points": 10, "prompt": "...", "poemLines": ["..."], "sentenceBefore": "...", "sentenceAfter": "...", "dropdownOptions": ["...","...","...","..."], "correctTextAnswers": ["..."], "explanation": "..." }

Lưu ý:
- Giữ nguyên 100% nội dung đề bài tiếng Việt trong file PDF.
- Nếu câu hỏi có hình ảnh (ví dụ hình quả dừa, hoa sữa, cái mũ, con gà...), hãy mô tả ngắn gọn nội dung hình vào prompt hoặc subPrompt để học sinh vẫn làm được, đồng thời tự giải chính xác đáp án đúng và viết lời giải thích ngắn gọn, chuẩn Tiếng Việt lớp 1.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    cleanKey
  )}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: instruction },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `Gemini API báo lỗi (${response.status}). Hãy kiểm tra lại API Key.${
        errText ? ` Chi tiết: ${errText.slice(0, 180)}` : ''
      }`
    );
  }

  const data = await response.json();
  const rawJsonText: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text || '')
      .join('')
      .trim() || '';

  if (!rawJsonText) {
    throw new Error('Gemini AI không trả về dữ liệu câu hỏi.');
  }

  const cleanedJson = rawJsonText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const parsedArray = JSON.parse(cleanedJson);
  if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
    throw new Error('Dữ liệu AI trả về không phải danh sách câu hỏi hợp lệ.');
  }

  const baseId = Date.now() * 1000;
  return parsedArray.map((item: any, idx: number): Question => ({
    ...item,
    id: baseId + idx,
    number: idx + 1,
    points: typeof item.points === 'number' ? item.points : 10,
    type: item.type || 'mcq',
    typeLabel: item.typeLabel || 'Câu hỏi (PDF AI)',
    prompt: String(item.prompt || `Câu hỏi số ${idx + 1}`),
    explanation: String(
      item.explanation || 'Đáp án được trích xuất và giải tự động từ PDF.'
    ),
  }));
}

function cleanLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Parse extracted Vietnamese exam text (including OCR output from TNTV screenshots)
 * into structured Question objects.
 */
export function parseVietnameseExamText(rawText: string): Question[] {
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Clean common OCR artifacts for radio buttons before A./B./C./D.
    .replace(/(?:^|\s)[○◯◎oO0©@\(\[]\s*([A-D])\s*[.)]/gm, ' $1. ')
    .trim();

  if (!normalized) return [];

  // Split blocks by question headers: "Câu hỏi 1", "Câu 1.", "Câu 1:", "Bài 1."
  const questionHeaderRegex =
    /(?:^|\n)\s*(?:Câu\s+hỏi|Câu|Bài)\s*(\d{1,2})\s*[:.)\-]?(?:\s+|\n)/gi;

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

    let detectedAnswer = '';
    let detectedExplanation = '';

    const expMatch = block.match(
      /(?:Giải thích|Hướng dẫn)\s*[:\-]\s*([\s\S]+)$/i
    );
    let workingBlock = block;
    if (expMatch) {
      detectedExplanation = cleanLine(expMatch[1]);
      workingBlock = workingBlock.slice(0, expMatch.index).trim();
    }

    const ansMatch = workingBlock.match(
      /(?:Đáp án(?:\s+đúng)?|Trả lời)\s*[:\-]\s*([^\n]+)/i
    );
    if (ansMatch) {
      const cand = cleanLine(ansMatch[1]);
      // Ignore TNTV UI placeholder "Chọn đáp án"
      if (!cand.toLowerCase().includes('chọn đáp án')) {
        detectedAnswer = cand;
        workingBlock = workingBlock.replace(ansMatch[0], '').trim();
      }
    }

    // 1. Detect MCQ options (A. / B. / C. / D.)
    const optRegex = /(?:^|\s|\n)(\*?[A-D])\s*[.)]\s+/g;
    const optPositions: {
      id: string;
      isStarred: boolean;
      index: number;
      len: number;
    }[] = [];
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

      // Ensure consistent A, B, C, D ordering
      const orderMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      mcqOptions.sort(
        (a, b) => (orderMap[a.id] ?? 9) - (orderMap[b.id] ?? 9)
      );

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
          `Đáp án đúng là phương án ${correctId}. (Giáo viên hãy kiểm tra lại đáp án đúng trước khi lưu.)`,
      });
      return;
    }

    // 2. Detect Ordering question ("Sắp xếp...")
    const lowerBlock = workingBlock.toLowerCase();
    if (lowerBlock.includes('sắp xếp')) {
      const lines = workingBlock
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const prompt = lines[0] || `Sắp xếp câu ${qNumber}`;
      const tokenSource = lines.slice(1).join(' ');
      let tokens = tokenSource
        .split(/[/|,|]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (tokens.length < 3) {
        tokens = tokenSource
          .split(/\s+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && t.length <= 12);
      }
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

    // 3. Default / Fill-in-the-blank ("Điền...", "Chọn đáp án", "...", "___", "[...]")
    const lines = workingBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const promptLine = lines[0] || `Câu hỏi số ${qNumber}`;
    const bodyText = lines.slice(1).join(' ') || promptLine;

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

    const blankRegex = /(?:\.{3,}|_{2,}|\[\s*\.{0,3}\s*\]|Chọn đáp án\s*[v∨]?)/i;
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
