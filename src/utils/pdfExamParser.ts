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

export interface PdfQuestionSegment {
  questionNumber: number;
  pageNumber: number;
  text: string;
  croppedImageUrl?: string;
  hasVisualArea?: boolean;
}

export interface PdfExtractionResult {
  pageCount: number;
  rawText: string;
  usedOcr: boolean;
  segments: PdfQuestionSegment[];
}

async function renderPdfPageToCanvas(
  page: any,
  scale = 1.8
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
  return canvas;
}

/**
 * Crop a vertical slice of a rendered PDF page canvas into a compact JPEG Data URL
 * so questions with illustrations/grids keep their exact visual from the PDF.
 */
function cropCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  yStart: number,
  yEnd: number,
  maxWidth = 640
): string {
  const safeY0 = Math.max(0, Math.floor(yStart));
  const safeY1 = Math.min(sourceCanvas.height, Math.ceil(yEnd));
  const cropH = safeY1 - safeY0;
  if (cropH < 30) return '';

  // Trim blank horizontal margins slightly (keep 92% center width)
  const marginX = Math.floor(sourceCanvas.width * 0.05);
  const cropW = sourceCanvas.width - marginX * 2;

  const scale = cropW > maxWidth ? maxWidth / cropW : 1;
  const outW = Math.max(1, Math.floor(cropW * scale));
  const outH = Math.max(1, Math.floor(cropH * scale));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(sourceCanvas, marginX, safeY0, cropW, cropH, 0, 0, outW, outH);
  return outCanvas.toDataURL('image/jpeg', 0.76);
}

const QUESTION_HEADER_LINE_REGEX =
  /^\s*(?:Câu\s+hỏi|Câu|Bài)\s*(\d{1,2})\s*[:.)\-]?(?:\s+|$)/i;

/**
 * Extract structured Vietnamese text + per-question cropped images from a PDF ArrayBuffer.
 * Automatically runs browser Vietnamese OCR (Tesseract.js) when the PDF is screenshot/image-based.
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

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Đang kiểm tra lớp chữ trang ${pageNum}/${pdf.numPages}...`);
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
  const avgCharsPerPage =
    pdf.numPages > 0 ? directText.length / pdf.numPages : 0;

  // Screenshot/Scan PDF path -> Render each page + Vietnamese OCR + Auto-crop question images!
  if (avgCharsPerPage < 60) {
    onProgress?.(
      'Phát hiện PDF ảnh chụp (giống đề gốc). Đang tải bộ nhận diện Tiếng Việt (OCR)...'
    );
    const Tesseract = await loadTesseract();
    const worker = await Tesseract.createWorker('vie', 1, {
      logger: (m: any) => {
        if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
          const pct = Math.round(m.progress * 100);
          onProgress?.(`Đang nhận diện chữ & cắt hình minh họa... ${pct}%`);
        }
      },
    });

    const ocrPageTexts: string[] = [];
    const segments: PdfQuestionSegment[] = [];

    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        onProgress?.(
          `Đang đọc & cắt hình từng câu trên trang ${pageNum}/${pdf.numPages}...`
        );
        const page = await pdf.getPage(pageNum);
        const canvas = await renderPdfPageToCanvas(page, 1.9);
        const result = await worker.recognize(canvas);
        const pageText = result?.data?.text?.trim() || '';
        if (pageText) ocrPageTexts.push(pageText);

        // Locate each "Câu hỏi N" line bounding box on this page to crop its visual region
        const ocrLines: any[] = result?.data?.lines || [];
        const headerIndices: {
          lineIdx: number;
          qNum: number;
          y0: number;
        }[] = [];

        ocrLines.forEach((ln: any, lIdx: number) => {
          const txt = String(ln?.text || '').trim();
          const match = txt.match(QUESTION_HEADER_LINE_REGEX);
          if (match) {
            headerIndices.push({
              lineIdx: lIdx,
              qNum: parseInt(match[1], 10),
              y0: ln?.bbox?.y0 ?? 0,
            });
          }
        });

        for (let h = 0; h < headerIndices.length; h++) {
          const cur = headerIndices[h];
          const next = headerIndices[h + 1];
          const sliceLines = ocrLines.slice(
            cur.lineIdx,
            next ? next.lineIdx : ocrLines.length
          );
          const segText = sliceLines
            .map((l: any) => String(l?.text || '').trim())
            .filter(Boolean)
            .join('\n');

          const lastLineBbox = sliceLines[sliceLines.length - 1]?.bbox;
          const yStart = Math.max(0, cur.y0 - 16);
          const yEnd = next
            ? Math.max(yStart + 100, next.y0 - 14)
            : Math.min(
                canvas.height,
                Math.max(
                  (lastLineBbox?.y1 ?? canvas.height) + 40,
                  yStart + Math.floor(canvas.height * 0.42)
                )
              );

          const sliceHeight = yEnd - yStart;
          const croppedImageUrl = cropCanvasRegion(canvas, yStart, yEnd, 620);

          segments.push({
            questionNumber: cur.qNum,
            pageNumber: pageNum,
            text: segText,
            croppedImageUrl: croppedImageUrl || undefined,
            hasVisualArea: sliceHeight > canvas.height * 0.24,
          });
        }
      }
    } finally {
      await worker.terminate();
    }

    return {
      pageCount: pdf.numPages,
      rawText: ocrPageTexts.join('\n\n'),
      usedOcr: true,
      segments,
    };
  }

  return {
    pageCount: pdf.numPages,
    rawText: directText,
    usedOcr: false,
    segments: [],
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
 * 6-type TNTV questions (matching the exact format of the uploaded PDF) + attach cropped page visuals.
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

  const instruction = `Bạn là chuyên gia giáo dục Tiểu học Việt Nam. Hãy đọc toàn bộ các trang trong file PDF đề thi Trạng Nguyên Tiếng Việt này (bao gồm cả văn bản, hình ảnh minh họa, bảng ô chữ, khung nối cặp, thẻ sắp xếp, hộp phân loại và ô chọn đáp án) và trích xuất CHÍNH XÁC từng câu hỏi sang mảng JSON theo đúng định dạng của đề gốc.

Quy tắc bắt buộc:
- Chỉ trả về JSON hợp lệ (mảng các đối tượng Question), KHÔNG kèm markdown \`\`\`json hay văn bản thừa.
- Mỗi phần tử phải có thêm "pageNumber" (số trang 1..N trong PDF) và "needsImage": true/false (true nếu câu hỏi gốc có hình minh họa hoặc bảng ô chữ).
- Giữ đúng 1 trong 6 dạng bài chuẩn Trạng Nguyên Tiếng Việt:
  1. "mcq" (Trắc nghiệm 4 đáp án A, B, C, D):
     { "number": 1, "pageNumber": 1, "needsImage": false, "type": "mcq", "typeLabel": "Trắc nghiệm", "points": 10, "prompt": "...", "subPrompt": "...", "mcqOptions": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}], "correctMcqId": "C", "explanation": "..." }
  2. "fill_text" (Điền chữ/tiếng/số vào chỗ trống, ô chữ):
     { "number": 11, "pageNumber": 3, "needsImage": true, "type": "fill_text", "typeLabel": "Điền chữ vào chỗ trống", "points": 10, "prompt": "...", "subPrompt": "...", "sentenceBefore": "...", "sentenceAfter": "...", "hintOptions": ["..."], "wordSearchGrid": [["N","H",...]], "correctTextAnswers": ["..."], "explanation": "..." }
  3. "matching" (Ghép hình với từ, ghép tiếng tạo từ, ghép vần, ghép câu):
     { "number": 16, "pageNumber": 5, "needsImage": true, "type": "matching", "typeLabel": "Ghép cặp tương ứng", "points": 10, "prompt": "...", "leftItems": [{"id":"L1","text":"..."},{"id":"L2","text":"..."},{"id":"L3","text":"..."}], "rightItems": [{"id":"R1","text":"..."},{"id":"R2","text":"..."},{"id":"R3","text":"..."}], "correctPairs": {"L1":"R2","L2":"R3","L3":"R1"}, "explanation": "..." }
  4. "ordering" (Sắp xếp bảng chữ cái, sắp xếp tiếng thành câu, sắp xếp chữ cái thành từ):
     { "number": 20, "pageNumber": 6, "needsImage": false, "type": "ordering", "typeLabel": "Sắp xếp", "points": 10, "prompt": "...", "orderingTokens": ["..."], "correctOrder": ["..."], "orderingJoiner": " ", "explanation": "..." }
  5. "categorize" (Phân loại tiếng/từ vào các nhóm hộp):
     { "number": 23, "pageNumber": 7, "needsImage": false, "type": "categorize", "typeLabel": "Phân loại nhóm từ", "points": 10, "prompt": "...", "categories": [{"id":"g1","title":"..."},{"id":"g2","title":"..."}], "categorizeItems": [{"id":"i1","text":"...","correctGroupId":"g1"}], "explanation": "..." }
  6. "dropdown" (Chọn đáp án trong danh sách / Giải câu đố có thơ):
     { "number": 25, "pageNumber": 8, "needsImage": true, "type": "dropdown", "typeLabel": "Chọn từ hoàn thành câu", "points": 10, "prompt": "...", "poemLines": ["..."], "sentenceBefore": "...", "sentenceAfter": "...", "dropdownOptions": ["đáp án đúng","phương án 2","phương án 3","phương án 4"], "correctTextAnswers": ["đáp án đúng"], "explanation": "..." }

Lưu ý quan trọng:
- Nếu là câu đố chữ 5x5, hãy trích xuất chính xác mảng 2 chiều "wordSearchGrid" và đếm đúng số từ xếp theo hàng ngang hoặc hàng dọc.
- Với dạng "dropdown" trong PDF chỉ hiện chữ "Chọn đáp án", hãy tự tạo 4 phương án hợp lý cho học sinh lớp 1 (gồm 1 đáp án đúng khớp với hình/câu và 3 phương án nhiễu).
- Tự giải chính xác 100% đáp án đúng và viết lời giải thích dễ hiểu cho học sinh lớp 1.`;

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

  // Render PDF pages to attach real cropped page visuals to questions marked needsImage
  const pageImageCache = new Map<number, string>();
  const needsAnyImage = parsedArray.some((it: any) => it?.needsImage);
  if (needsAnyImage) {
    try {
      onProgress?.('Đang cắt hình minh họa từ các trang PDF cho câu hỏi có ảnh...');
      const pdfjsLib = await loadPdfJs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
        .promise;
      const pageNums = Array.from(
        new Set(
          parsedArray
            .filter((it: any) => it?.needsImage && it?.pageNumber)
            .map((it: any) => Number(it.pageNumber))
            .filter((n: number) => n >= 1 && n <= pdf.numPages)
        )
      );
      for (const pNum of pageNums) {
        const page = await pdf.getPage(pNum);
        const canvas = await renderPdfPageToCanvas(page, 1.4);
        const dataUrl = cropCanvasRegion(canvas, 0, canvas.height, 640);
        if (dataUrl) pageImageCache.set(pNum, dataUrl);
      }
    } catch {
      // Non-fatal: continue without page visuals
    }
  }

  const baseId = Date.now() * 1000;
  return parsedArray.map((item: any, idx: number): Question => {
    const pNum = Number(item.pageNumber);
    const attachedImg =
      item.needsImage && !item.imageUrl && pageImageCache.has(pNum)
        ? pageImageCache.get(pNum)
        : item.imageUrl;

    const { pageNumber: _p, needsImage: _n, ...rest } = item;
    return {
      ...rest,
      id: baseId + idx,
      number: idx + 1,
      points: typeof item.points === 'number' ? item.points : 10,
      type: item.type || 'mcq',
      typeLabel: item.typeLabel || 'Câu hỏi (PDF AI)',
      prompt: String(item.prompt || `Câu hỏi số ${idx + 1}`),
      imageUrl: attachedImg,
      imageAlt: item.imageAlt || `Hình minh họa câu ${idx + 1} (trang ${pNum || 1})`,
      explanation: String(
        item.explanation || 'Đáp án được trích xuất và giải tự động từ PDF.'
      ),
    };
  });
}

function cleanLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function shouldAttachImageToQuestion(
  promptAndBody: string,
  hasVisualArea?: boolean
): boolean {
  const lower = promptAndBody.toLowerCase();
  if (
    lower.includes('hình ảnh') ||
    lower.includes('hình sau') ||
    lower.includes('hình trên') ||
    lower.includes('trong hình') ||
    lower.includes('ô chữ') ||
    lower.includes('quả trên') ||
    lower.includes('đây là quả') ||
    lower.includes('đây là hoa') ||
    lower.includes('đây là cái')
  ) {
    return true;
  }
  return Boolean(hasVisualArea);
}

/**
 * Parse a single question text block into one of the 6 TNTV Question formats
 */
function parseSingleBlockToQuestion(
  rawBlock: string,
  qNumber: number,
  baseId: number,
  croppedImageUrl?: string,
  hasVisualArea?: boolean
): Question {
  const block = rawBlock
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(QUESTION_HEADER_LINE_REGEX, '')
    .replace(/(?:^|\s)[○◯◎oO0©@\(\[]\s*([A-D])\s*[.)]/gm, ' $1. ')
    .trim();

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
    if (!cand.toLowerCase().includes('chọn đáp án')) {
      detectedAnswer = cand;
      workingBlock = workingBlock.replace(ansMatch[0], '').trim();
    }
  }

  const lowerBlock = workingBlock.toLowerCase();
  const attachImg =
    croppedImageUrl && shouldAttachImageToQuestion(workingBlock, hasVisualArea)
      ? croppedImageUrl
      : undefined;

  // 1. MCQ (A. B. C. D.)
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
    const promptLines = workingBlock
      .slice(0, firstOptIdx)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const promptPart = promptLines[0] || `Câu hỏi trắc nghiệm số ${qNumber}`;
    const subPromptPart =
      promptLines.length > 1 ? promptLines.slice(1).join(' ') : undefined;

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
      if (cur.isStarred) correctId = cur.id;
    }

    const orderMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    mcqOptions.sort((a, b) => (orderMap[a.id] ?? 9) - (orderMap[b.id] ?? 9));

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

    return {
      id: baseId + qNumber,
      number: qNumber,
      type: 'mcq',
      typeLabel: attachImg ? 'Trắc nghiệm hình ảnh' : 'Trắc nghiệm',
      points: 10,
      prompt: promptPart,
      subPrompt: subPromptPart,
      imageUrl: attachImg,
      imageAlt: attachImg ? `Hình minh họa câu ${qNumber}` : undefined,
      mcqOptions,
      correctMcqId: correctId,
      explanation:
        detectedExplanation ||
        `Đáp án đúng là phương án ${correctId}. (Giáo viên hãy kiểm tra lại đáp án chuẩn.)`,
    };
  }

  // 2. Categorize ("Hãy xếp các tiếng/từ ngữ vào nhóm...")
  if (
    (lowerBlock.includes('xếp') && lowerBlock.includes('nhóm')) ||
    lowerBlock.includes('phân loại')
  ) {
    const lines = workingBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const prompt = lines[0] || `Hãy xếp các từ vào nhóm thích hợp (Câu ${qNumber})`;
    const restLines = lines.slice(1);

    const groupTitles = restLines.filter(
      (l) =>
        /^(?:Tiếng có|Từ ngữ|Từ chỉ|Nhóm)/i.test(l) ||
        l.includes('"')
    );
    const categories =
      groupTitles.length >= 2
        ? groupTitles.slice(0, 4).map((t, i) => ({ id: `G${i + 1}`, title: t }))
        : [
            { id: 'G1', title: 'Nhóm 1' },
            { id: 'G2', title: 'Nhóm 2' },
          ];

    const wordLines = restLines.filter((l) => !groupTitles.includes(l));
    const rawWords = wordLines
      .join(' ')
      .split(/[,|]+|\s{2,}/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && w.length <= 24);
    const words =
      rawWords.length >= 2
        ? rawWords.slice(0, 12)
        : ['từ 1', 'từ 2', 'từ 3', 'từ 4'];

    const categorizeItems = words.map((w, i) => ({
      id: `item_${qNumber}_${i}`,
      text: w,
      correctGroupId: categories[i % categories.length].id,
    }));

    return {
      id: baseId + qNumber,
      number: qNumber,
      type: 'categorize',
      typeLabel: 'Phân loại nhóm từ',
      points: 10,
      prompt,
      imageUrl: croppedImageUrl,
      imageAlt: `Ảnh gốc câu ${qNumber} trong PDF`,
      categories,
      categorizeItems,
      explanation:
        detectedExplanation ||
        'Giáo viên hãy kiểm tra lại nhóm đúng của từng từ trước khi lưu đề.',
    };
  }

  // 3. Matching ("Hãy ghép..." / "Nối...")
  if (lowerBlock.includes('hãy ghép') || lowerBlock.startsWith('ghép ') || lowerBlock.includes('nối ')) {
    const lines = workingBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const prompt = lines[0] || `Hãy ghép cặp tương ứng (Câu ${qNumber})`;
    const bodyLines = lines.slice(1);

    const leftTexts: string[] = [];
    const rightTexts: string[] = [];
    bodyLines.forEach((line) => {
      const parts = line.split(/\s{2,}|\t|\s+[-–—→]\s+/);
      if (parts.length >= 2) {
        leftTexts.push(parts[0].trim());
        rightTexts.push(parts.slice(1).join(' ').trim());
      } else if (line.length > 0) {
        if (leftTexts.length <= rightTexts.length) leftTexts.push(line);
        else rightTexts.push(line);
      }
    });

    const pairCount = Math.max(3, Math.min(4, Math.max(leftTexts.length, rightTexts.length)));
    const leftItems = Array.from({ length: pairCount }, (_, i) => ({
      id: `L${i + 1}`,
      text: leftTexts[i] || `Mục trái ${i + 1}`,
    }));
    const rightItems = Array.from({ length: pairCount }, (_, i) => ({
      id: `R${i + 1}`,
      text: rightTexts[i] || `Mục phải ${i + 1}`,
    }));
    const correctPairs: Record<string, string> = {};
    leftItems.forEach((l, i) => {
      correctPairs[l.id] = rightItems[i].id;
    });

    return {
      id: baseId + qNumber,
      number: qNumber,
      type: 'matching',
      typeLabel: 'Ghép cặp tương ứng',
      points: 10,
      prompt,
      imageUrl: croppedImageUrl,
      imageAlt: `Ảnh gốc câu ${qNumber} trong PDF`,
      leftItems,
      rightItems,
      correctPairs,
      explanation:
        detectedExplanation ||
        'Giáo viên hãy đối chiếu ảnh gốc từ PDF để chỉnh đúng các cặp nối.',
    };
  }

  // 4. Ordering ("Sắp xếp...")
  if (lowerBlock.includes('sắp xếp')) {
    const lines = workingBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const prompt = lines[0] || `Sắp xếp theo thứ tự đúng (Câu ${qNumber})`;
    const tokenSource = lines.slice(1).join(' ');

    const isAlphabetical = lowerBlock.includes('bảng chữ cái');
    const isLetterWord = lowerBlock.includes('chữ sau') || lowerBlock.includes('chữ cái');

    let tokens = tokenSource
      .split(/[/|,|]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length < 3) {
      tokens = tokenSource
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && t.length <= 15);
    }
    if (tokens.length < 3 && detectedAnswer) {
      tokens = detectedAnswer.split(/\s+/).filter(Boolean);
    }
    if (tokens.length < 3) {
      tokens = ['Em', 'rất', 'yêu', 'trường', 'em.'];
    }

    const correctOrder = detectedAnswer
      ? detectedAnswer.split(/\s+/).filter(Boolean)
      : isAlphabetical
      ? [...tokens].sort((a, b) => a.localeCompare(b, 'vi'))
      : [...tokens];

    const shuffled = [...tokens];
    if (shuffled.length > 1) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }

    const joiner = isAlphabetical ? ' → ' : isLetterWord ? '' : ' ';

    return {
      id: baseId + qNumber,
      number: qNumber,
      type: 'ordering',
      typeLabel: isAlphabetical
        ? 'Sắp xếp bảng chữ cái'
        : isLetterWord
        ? 'Sắp xếp chữ cái thành từ'
        : 'Sắp xếp tiếng thành câu',
      points: 10,
      prompt,
      orderingTokens: shuffled,
      correctOrder:
        correctOrder.length === tokens.length ? correctOrder : tokens,
      orderingJoiner: joiner,
      explanation:
        detectedExplanation ||
        `Thứ tự đúng: "${(correctOrder.length === tokens.length
          ? correctOrder
          : tokens
        ).join(joiner)}"`,
    };
  }

  // 5. Dropdown / Riddle ("Chọn từ thích hợp...", "Chọn vần...", "Giải câu đố", "Chọn đáp án")
  if (
    lowerBlock.includes('chọn đáp án') ||
    lowerBlock.includes('giải câu đố') ||
    lowerBlock.includes('chọn từ thích hợp') ||
    lowerBlock.includes('chọn vần thích hợp')
  ) {
    const lines = workingBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const promptLine = lines[0] || `Chọn từ thích hợp điền vào chỗ trống (Câu ${qNumber})`;
    const isRiddle = lowerBlock.includes('câu đố');

    const sentenceLineIdx = lines.findIndex(
      (l, i) =>
        i > 0 &&
        (/chọn đáp án/i.test(l) ||
          /đáp án\s*:/i.test(l) ||
          /\.{3,}|_{2,}/.test(l))
    );

    const poemLines =
      isRiddle && sentenceLineIdx > 1
        ? lines.slice(1, sentenceLineIdx)
        : undefined;
    const targetSentence =
      sentenceLineIdx >= 0
        ? lines[sentenceLineIdx]
        : lines[lines.length - 1] || '';

    const blankRegex = /(?:\.{3,}|_{2,}|\[\s*\.{0,3}\s*\]|Chọn đáp án\s*[v∨]?)/i;
    const blankMatch = targetSentence.match(blankRegex);
    let sentenceBefore = targetSentence;
    let sentenceAfter = '.';
    if (blankMatch && blankMatch.index !== undefined) {
      sentenceBefore = targetSentence.slice(0, blankMatch.index);
      sentenceAfter = targetSentence.slice(
        blankMatch.index + blankMatch[0].length
      );
    }

    const defaultAns = detectedAnswer || 'đáp án 1';
    const dropdownOptions = [
      defaultAns,
      'lựa chọn 2',
      'lựa chọn 3',
      'lựa chọn 4',
    ];

    return {
      id: baseId + qNumber,
      number: qNumber,
      type: 'dropdown',
      typeLabel: isRiddle ? 'Giải câu đố' : 'Chọn từ hoàn thành câu',
      points: 10,
      prompt: promptLine,
      poemLines,
      imageUrl: attachImg,
      imageAlt: attachImg ? `Hình minh họa câu ${qNumber}` : undefined,
      sentenceBefore,
      sentenceAfter,
      dropdownOptions,
      correctTextAnswers: [defaultAns],
      explanation:
        detectedExplanation ||
        `Đáp án đúng là "${defaultAns}". (Giáo viên hãy nhập các lựa chọn và đáp án đúng khớp với hình.)`,
    };
  }

  // 6. Fill-in-the-blank ("Điền chữ/tiếng/số vào chỗ trống")
  const lines = workingBlock
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const promptLine = lines[0] || `Điền vào chỗ trống (Câu ${qNumber})`;
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
  } else {
    // Detect quoted options like: Điền "g" hoặc "gh"
    const quotedMatches = Array.from(
      promptLine.matchAll(/["“”]([^"“”]{1,6})["“”]/g)
    ).map((qm) => qm[1].trim());
    if (quotedMatches.length >= 2 && quotedMatches.length <= 4) {
      hintOptions = quotedMatches;
    }
  }

  const blankRegex = /(?:\.{3,}|_{2,}|\[\s*\.{0,3}\s*\]|\[\s+\])/;
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

  return {
    id: baseId + qNumber,
    number: qNumber,
    type: 'fill_text',
    typeLabel: 'Điền từ vào chỗ trống',
    points: 10,
    prompt: promptLine,
    imageUrl: attachImg,
    imageAlt: attachImg ? `Hình minh họa câu ${qNumber}` : undefined,
    sentenceBefore,
    sentenceAfter,
    hintOptions,
    correctTextAnswers: [defaultAns],
    explanation:
      detectedExplanation ||
      `Đáp án cần điền là "${defaultAns}". (Giáo viên hãy kiểm tra lại đáp án chuẩn trước khi lưu.)`,
  };
}

/**
 * Parse extracted PDF segments (with cropped images) or raw text into full 6-type TNTV questions
 */
export function parseVietnameseExamText(
  rawText: string,
  segments?: PdfQuestionSegment[]
): Question[] {
  const baseId = Date.now() * 1000;

  // Prefer structured per-question segments with cropped images when available from OCR
  if (segments && segments.length > 0) {
    return segments.map((seg, idx) =>
      parseSingleBlockToQuestion(
        seg.text,
        idx + 1,
        baseId,
        seg.croppedImageUrl,
        seg.hasVisualArea
      )
    );
  }

  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!normalized) return [];

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

  return blocks.map((block, idx) =>
    parseSingleBlockToQuestion(block, idx + 1, baseId)
  );
}
