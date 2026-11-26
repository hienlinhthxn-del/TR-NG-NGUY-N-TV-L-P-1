export type QuestionType =
  | 'mcq'
  | 'fill_text'
  | 'matching'
  | 'ordering'
  | 'categorize'
  | 'dropdown';

export interface McqOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface MatchingItem {
  id: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface CategorizeGroup {
  id: string;
  title: string;
}

export interface CategorizeItem {
  id: string;
  text: string;
  correctGroupId: string;
}

export interface Question {
  id: number;
  number: number;
  type: QuestionType;
  typeLabel: string;
  points: number;
  prompt: string;
  subPrompt?: string;
  poemLines?: string[];
  imageUrl?: string;
  imageAlt?: string;
  // For MCQ
  mcqOptions?: McqOption[];
  correctMcqId?: string;
  // For Fill Text & Dropdown
  sentenceBefore?: string;
  sentenceAfter?: string;
  hintOptions?: string[]; // e.g., ['thi', 'bi', 'vi'] or ['g', 'gh']
  dropdownOptions?: string[];
  correctTextAnswers?: string[]; // case-insensitive trimmed matches
  // For Word Search grid (Q15)
  wordSearchGrid?: string[][];
  // For Matching (Q16, Q17, Q18, Q19)
  leftItems?: MatchingItem[];
  rightItems?: MatchingItem[];
  correctPairs?: Record<string, string>; // leftId -> rightId
  // For Ordering (Q20, Q21, Q22)
  orderingTokens?: string[];
  correctOrder?: string[];
  alternativeOrders?: string[][];
  orderingDisplayOverrides?: Record<string, string>;
  orderingJoiner?: string; // ' ' or '' or ' → '
  // For Categorize (Q23, Q24)
  categories?: CategorizeGroup[];
  categorizeItems?: CategorizeItem[];
  // Detailed explanation
  explanation: string;
}

export type UserAnswers = Record<number, any>;

export const EXAM_INFO = {
  title: 'ĐỀ ÔN LUYỆN TRẠNG NGUYÊN TIẾNG VIỆT CẤP TRƯỜNG',
  roundName: 'Vòng Sơ khảo - Cấp Trường (Khối Tiểu học)',
  durationMinutes: 30,
  totalQuestions: 30,
  totalPoints: 300,
  packageCode: 'TNTV-112e22ac-094c-42f9-9662-e70dbee8be2f',
  sourceUrl: 'https://thi.trangnguyen.edu.vn/thu-tai/?package_type=TNTV&package_subType=undefined-112e22ac-094c-42f9-9662-e70dbee8be2f',
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    number: 1,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Tiếng nào mang thanh huyền (`) ?',
    mcqOptions: [
      { id: 'A', text: 'ghế' },
      { id: 'B', text: 'tủ' },
      { id: 'C', text: 'bàn' },
      { id: 'D', text: 'đĩa' },
    ],
    correctMcqId: 'C',
    explanation:
      'Tiếng "bàn" có dấu huyền (`) đặt trên âm chính "a". Tiếng "ghế" mang thanh sắc, "tủ" mang thanh hỏi, "đĩa" mang thanh ngã.',
  },
  {
    id: 2,
    number: 2,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Tiếng nào có vần "et"?',
    mcqOptions: [
      { id: 'A', text: 'sên' },
      { id: 'B', text: 'nhện' },
      { id: 'C', text: 'vẹt' },
      { id: 'D', text: 'ngựa' },
    ],
    correctMcqId: 'C',
    explanation:
      'Tiếng "vẹt" gồm âm đầu "v", vần "et" và thanh nặng (.). Các tiếng còn lại có vần "ên" (sên, nhện) và vần "ưa" (ngựa).',
  },
  {
    id: 3,
    number: 3,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Đâu là tên một con vật?',
    mcqOptions: [
      { id: 'A', text: 'lan' },
      { id: 'B', text: 'nhãn' },
      { id: 'C', text: 'sen' },
      { id: 'D', text: 'rùa' },
    ],
    correctMcqId: 'D',
    explanation:
      '"Rùa" là tên một loài động vật (con rùa). "Lan", "nhãn", "sen" là tên các loài cây, hoa và quả.',
  },
  {
    id: 4,
    number: 4,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Tiếng nào có vần "an"?',
    mcqOptions: [
      { id: 'A', text: 'bát' },
      { id: 'B', text: 'chăn' },
      { id: 'C', text: 'than' },
      { id: 'D', text: 'quạt' },
    ],
    correctMcqId: 'C',
    explanation:
      'Tiếng "than" gồm âm đầu "th" ghép với vần "an". Tiếng "bát" và "quạt" có vần "at", tiếng "chăn" có vần "ăn".',
  },
  {
    id: 5,
    number: 5,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Đâu là tên một đồ vật?',
    mcqOptions: [
      { id: 'A', text: 'hổ' },
      { id: 'B', text: 'cá' },
      { id: 'C', text: 'cua' },
      { id: 'D', text: 'thìa' },
    ],
    correctMcqId: 'D',
    explanation:
      '"Thìa" (muỗng) là đồ vật dùng trong bữa ăn hằng ngày. "Hổ", "cá", "cua" là tên các con vật.',
  },
  {
    id: 6,
    number: 6,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Từ nào thích hợp điền vào chỗ trống trong câu sau?',
    subPrompt: 'Bé [...] cho bố mẹ nghe.',
    mcqOptions: [
      { id: 'A', text: 'dắt' },
      { id: 'B', text: 'đua' },
      { id: 'C', text: 'gặt' },
      { id: 'D', text: 'hát' },
    ],
    correctMcqId: 'D',
    explanation:
      'Điền từ "hát" tạo thành câu có nghĩa đúng và trọn vẹn: "Bé hát cho bố mẹ nghe."',
  },
  {
    id: 7,
    number: 7,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Câu nào chứa tiếng có vần "ăt"?',
    mcqOptions: [
      { id: 'A', text: 'Chị đi cắt cỏ cho bê ăn.' },
      { id: 'B', text: 'Bé quét lá trên sân.' },
      { id: 'C', text: 'Bà cho bé bát chè hạt sen.' },
      { id: 'D', text: 'Má mua cho bé lá cờ.' },
    ],
    correctMcqId: 'A',
    explanation:
      'Trong câu "Chị đi cắt cỏ cho bê ăn.", tiếng "cắt" chứa vần "ăt" (c - ăt - sắc - cắt).',
  },
  {
    id: 8,
    number: 8,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Câu nào có từ viết sai chính tả?',
    mcqOptions: [
      { id: 'A', text: 'Quả na đã mở mắt.' },
      { id: 'B', text: 'Bố và mẹ đi gặt lúa.' },
      { id: 'C', text: 'Cơn gió lùa qua khe cửa sổ.' },
      { id: 'D', text: 'Bà đan khăn nen bên cửa sổ.' },
    ],
    correctMcqId: 'D',
    explanation:
      'Câu D viết sai chính tả ở từ "khăn nen" (phân biệt l/n). Cách viết đúng phải là "khăn len": "Bà đan khăn len bên cửa sổ."',
  },
  {
    id: 9,
    number: 9,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: '"Chú chó nhỏ" có thể ghép với đáp án nào để tạo thành câu đúng?',
    mcqOptions: [
      { id: 'A', text: 'nô đùa với bé ở trên sân' },
      { id: 'B', text: 'che mát sân nhà bà' },
      { id: 'C', text: 'dặn bé ở nhà khi có mưa to' },
      { id: 'D', text: 'dệt khăn lụa cho bà' },
    ],
    correctMcqId: 'A',
    explanation:
      'Ghép với đáp án A ta được câu đúng về hoạt động của con vật: "Chú chó nhỏ nô đùa với bé ở trên sân."',
  },
  {
    id: 10,
    number: 10,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm hình ảnh',
    points: 10,
    prompt: 'Câu nào mô tả đúng hình ảnh sau?',
    imageUrl: '/assets/q_images/q10_mother_bow.jpg',
    imageAlt: 'Mẹ cài chiếc nơ màu xanh cho bé gái',
    mcqOptions: [
      { id: 'A', text: 'Mẹ mua sữa chua rất ngon.' },
      { id: 'B', text: 'Mẹ mua vở vẽ cho bé Na.' },
      { id: 'C', text: 'Mẹ mua khăn lụa cho bà.' },
      { id: 'D', text: 'Mẹ mua nơ cho bé Na.' },
    ],
    correctMcqId: 'D',
    explanation:
      'Trong hình ảnh, người mẹ đang ướm thử chiếc nơ màu xanh lên tóc cho bé gái nên câu mô tả đúng là "Mẹ mua nơ cho bé Na."',
  },
  {
    id: 11,
    number: 11,
    type: 'fill_text',
    typeLabel: 'Điền chữ vào chỗ trống',
    points: 10,
    prompt: 'Điền chữ thích hợp vào chỗ trống:',
    imageUrl: '/assets/q_images/q11_coconut.png',
    imageAlt: 'Hình ảnh quả dừa xanh',
    sentenceBefore: 'Đây là quả ',
    sentenceAfter: 'ừa.',
    hintOptions: ['d', 'đ', 'gi', 'r'],
    correctTextAnswers: ['d'],
    explanation:
      'Hình ảnh là quả dừa. Điền âm đầu "d" vào trước vần "ừa" để tạo thành tiếng "dừa": "Đây là quả dừa."',
  },
  {
    id: 12,
    number: 12,
    type: 'fill_text',
    typeLabel: 'Điền tiếng trong ngoặc',
    points: 10,
    prompt: 'Chọn tiếng thích hợp trong ngoặc điền vào chỗ trống:',
    subPrompt: '(thi, bi, vi)',
    imageUrl: '/assets/q_images/q12_marbles.jpg',
    imageAlt: 'Bạn nhỏ cầm lọ bi ve nhiều màu sắc',
    sentenceBefore: 'Bạn Nhân có lọ ',
    sentenceAfter: ' ve.',
    hintOptions: ['thi', 'bi', 'vi'],
    correctTextAnswers: ['bi'],
    explanation:
      'Trong hình, bạn nhỏ đang cầm một lọ đựng những viên bi nhiều màu sắc. Ta điền tiếng "bi" để được từ "bi ve": "Bạn Nhân có lọ bi ve."',
  },
  {
    id: 13,
    number: 13,
    type: 'fill_text',
    typeLabel: 'Chính tả g / gh',
    points: 10,
    prompt: 'Điền "g" hoặc "gh" thích hợp vào chỗ trống:',
    imageUrl: '/assets/q_images/q13_chickens.jpg',
    imageAlt: 'Cô Hà đang rải thóc cho đàn gà ăn',
    sentenceBefore: 'Cô Hà cho đàn ',
    sentenceAfter: 'à ăn.',
    hintOptions: ['g', 'gh'],
    correctTextAnswers: ['g'],
    explanation:
      'Theo quy tắc chính tả, âm "gh" chỉ đứng trước các nguyên âm e, ê, i. Trước nguyên âm "a" (à), ta dùng chữ "g": "Cô Hà cho đàn gà ăn."',
  },
  {
    id: 14,
    number: 14,
    type: 'fill_text',
    typeLabel: 'Chính tả l / n',
    points: 10,
    prompt: 'Điền "l" hoặc "n" thích hợp vào chỗ trống:',
    imageUrl: '/assets/q_images/q14_clay.png',
    imageAlt: 'Bé Lê đang chơi đất nặn',
    sentenceBefore: 'Bé Lê có đất ',
    sentenceAfter: 'ặn.',
    hintOptions: ['l', 'n'],
    correctTextAnswers: ['n'],
    explanation:
      'Từ đúng chính tả chỉ đồ chơi nhào nặn bằng đất dẻo là "đất nặn" (âm đầu "n"). Câu hoàn chỉnh: "Bé Lê có đất nặn."',
  },
  {
    id: 15,
    number: 15,
    type: 'fill_text',
    typeLabel: 'Đố vui ô chữ',
    points: 10,
    prompt: 'Điền số thích hợp vào chỗ trống:',
    subPrompt: '(Lưu ý: Tên loại quả xếp theo hàng ngang hoặc hàng dọc.)',
    imageUrl: '/assets/q_images/q15_grid.jpg',
    imageAlt: 'Bảng ô chữ tìm tên các loại quả',
    wordSearchGrid: [
      ['N', 'H', 'Ã', 'N', 'H'],
      ['S', 'L', 'O', 'H', 'W'],
      ['M', 'Ậ', 'N', 'V', 'B'],
      ['G', 'R', 'E', 'K', 'B'],
      ['G', 'W', 'K', 'H', 'Ế'],
    ],
    sentenceBefore: 'Ô chữ trên có tất cả ',
    sentenceAfter: ' từ chỉ quả.',
    hintOptions: ['2', '3', '4', '5'],
    correctTextAnswers: ['3'],
    explanation:
      'Trong bảng ô chữ có tất cả 3 từ chỉ tên các loại quả xếp theo hàng ngang: 1. NHÃN (hàng 1), 2. MẬN (hàng 3), 3. KHẾ (hàng 5). Không có tên loại quả nào ở hàng dọc. Đáp án đúng là 3 từ chỉ quả.',
  },
  {
    id: 16,
    number: 16,
    type: 'matching',
    typeLabel: 'Ghép hình với từ',
    points: 10,
    prompt: 'Hãy ghép hình ảnh với từ thích hợp.',
    leftItems: [
      { id: 'L1', imageUrl: '/assets/q_images/q16_pear.png', imageAlt: 'Quả lê', text: 'Hình 1 (Quả màu vàng xanh)' },
      { id: 'L2', imageUrl: '/assets/q_images/q16_grapes.png', imageAlt: 'Chùm nho', text: 'Hình 2 (Chùm quả tím)' },
      { id: 'L3', imageUrl: '/assets/q_images/q16_tamarind.png', imageAlt: 'Quả me', text: 'Hình 3 (Quả vỏ nâu cong)' },
    ],
    rightItems: [
      { id: 'R1', text: 'me' },
      { id: 'R2', text: 'lê' },
      { id: 'R3', text: 'nho' },
    ],
    correctPairs: {
      L1: 'R2',
      L2: 'R3',
      L3: 'R1',
    },
    explanation:
      'Hình 1 là quả lê (nối với "lê"); Hình 2 là chùm nho (nối với "nho"); Hình 3 là quả me (nối với "me").',
  },
  {
    id: 17,
    number: 17,
    type: 'matching',
    typeLabel: 'Ghép tiếng tạo từ',
    points: 10,
    prompt: 'Hãy ghép các tiếng ở hai vế để tạo thành từ đúng.',
    leftItems: [
      { id: 'L1', text: 'thật' },
      { id: 'L2', text: 'ân' },
      { id: 'L3', text: 'cẩn' },
    ],
    rightItems: [
      { id: 'R1', text: 'thận' },
      { id: 'R2', text: 'cần' },
      { id: 'R3', text: 'thà' },
    ],
    correctPairs: {
      L1: 'R3',
      L2: 'R2',
      L3: 'R1',
    },
    explanation:
      'Ghép các tiếng tạo thành từ phức có nghĩa: "thật" + "thà" → "thật thà"; "ân" + "cần" → "ân cần"; "cẩn" + "thận" → "cẩn thận".',
  },
  {
    id: 18,
    number: 18,
    type: 'matching',
    typeLabel: 'Ghép vần với đồ vật',
    points: 10,
    prompt: 'Hãy ghép vần với tên đồ vật trong hình chứa vần tương ứng.',
    leftItems: [
      { id: 'L1', imageUrl: '/assets/q_images/q18_cloud_an.jpg', imageAlt: 'Vần ân', text: 'Vần "ân"' },
      { id: 'L2', imageUrl: '/assets/q_images/q18_cloud_at.jpg', imageAlt: 'Vần at', text: 'Vần "at"' },
      { id: 'L3', imageUrl: '/assets/q_images/q18_cloud_en.jpg', imageAlt: 'Vần en', text: 'Vần "en"' },
    ],
    rightItems: [
      { id: 'R1', imageUrl: '/assets/q_images/q18_bowl.jpg', imageAlt: 'Cái bát', text: 'Cái bát' },
      { id: 'R2', imageUrl: '/assets/q_images/q18_lamp.jpg', imageAlt: 'Cái đèn bàn', text: 'Cái đèn' },
      { id: 'R3', imageUrl: '/assets/q_images/q18_scale.jpg', imageAlt: 'Cái cân', text: 'Cái cân' },
    ],
    correctPairs: {
      L1: 'R3',
      L2: 'R1',
      L3: 'R2',
    },
    explanation:
      'Vần "ân" ghép với hình cái cân (tiếng "cân" có vần "ân"); Vần "at" ghép với hình cái bát (tiếng "bát" có vần "at"); Vần "en" ghép với hình cái đèn (tiếng "đèn" có vần "en").',
  },
  {
    id: 19,
    number: 19,
    type: 'matching',
    typeLabel: 'Ghép hình với câu',
    points: 10,
    prompt: 'Hãy ghép hình ảnh với câu mô tả tương ứng.',
    leftItems: [
      { id: 'L1', imageUrl: '/assets/q_images/q19_washing.png', imageAlt: 'Bạn gái đang rửa bát', text: 'Hình 1: Rửa bát' },
      { id: 'L2', imageUrl: '/assets/q_images/q19_light.png', imageAlt: 'Bạn trai bật tắt công tắc đèn', text: 'Hình 2: Công tắc đèn' },
      { id: 'L3', imageUrl: '/assets/q_images/q19_writing.png', imageAlt: 'Bạn gái đang ngồi bàn học viết vở', text: 'Hình 3: Viết bài vào vở' },
    ],
    rightItems: [
      { id: 'R1', text: 'Thu rửa bát sau bữa trưa.' },
      { id: 'R2', text: 'Vũ tắt đèn khi đi ngủ.' },
      { id: 'R3', text: 'Hà ghi chữ và số ra vở.' },
    ],
    correctPairs: {
      L1: 'R1',
      L2: 'R2',
      L3: 'R3',
    },
    explanation:
      'Hình 1 bạn gái đang rửa bát nối với câu "Thu rửa bát sau bữa trưa."; Hình 2 bạn trai tắt công tắc điện nối với câu "Vũ tắt đèn khi đi ngủ."; Hình 3 bạn gái đang viết bài nối với câu "Hà ghi chữ và số ra vở."',
  },
  {
    id: 20,
    number: 20,
    type: 'ordering',
    typeLabel: 'Sắp xếp thứ tự bảng chữ cái',
    points: 10,
    prompt: 'Sắp xếp tên các bạn sau theo đúng thứ tự trong bảng chữ cái.',
    orderingTokens: ['Nhi', 'Vũ', 'Tú', 'Hân'],
    correctOrder: ['Hân', 'Nhi', 'Tú', 'Vũ'],
    orderingJoiner: ' → ',
    explanation:
      'Dựa theo chữ cái đầu của tên trong bảng chữ cái tiếng Việt (A, Ă, Â, B, C, D, Đ, E, Ê, G, H, I, K, L, M, N, O, Ô, Ơ, P, Q, R, S, T, U, Ư, V, X, Y): H (Hân) đứng trước N (Nhi), tiếp theo là T (Tú) và cuối cùng là V (Vũ). Thứ tự đúng: Hân → Nhi → Tú → Vũ.',
  },
  {
    id: 21,
    number: 21,
    type: 'ordering',
    typeLabel: 'Sắp xếp tiếng thành câu',
    points: 10,
    prompt: 'Sắp xếp các tiếng sau để tạo thành câu hoàn chỉnh.',
    orderingTokens: ['ở', 'chờ', 'đò.', 'bến', 'mẹ', 'Hà'],
    correctOrder: ['Hà', 'chờ', 'mẹ', 'ở', 'bến', 'đò.'],
    alternativeOrders: [['Mẹ', 'Hà', 'chờ', 'ở', 'bến', 'đò.']],
    orderingJoiner: ' ',
    explanation:
      'Tiếng viết hoa "Hà" đứng đầu câu, tiếng có dấu chấm "đò." đứng cuối câu. Sắp xếp các tiếng theo đúng ngữ pháp ta được câu: "Hà chờ mẹ ở bến đò." (hoặc "Mẹ Hà chờ ở bến đò." - chuẩn SGK Tiếng Việt 1: "Hà chờ mẹ ở bến đò.").',
  },
  {
    id: 22,
    number: 22,
    type: 'ordering',
    typeLabel: 'Sắp xếp chữ cái thành từ',
    points: 10,
    prompt: 'Sắp xếp các chữ sau để tạo thành từ chỉ đồ vật.',
    orderingTokens: ['B', 'ế', 'à', 'g', 'n', 'h'],
    correctOrder: ['B', 'à', 'n', 'g', 'h', 'ế'],
    orderingDisplayOverrides: { Bànghế: 'Bàn ghế' },
    orderingJoiner: '',
    explanation:
      'Ghép các chữ cái B, à, n, g, h, ế theo đúng thứ tự ta được từ chỉ đồ vật quen thuộc là "Bàn ghế" (B-à-n g-h-ế).',
  },
  {
    id: 23,
    number: 23,
    type: 'categorize',
    typeLabel: 'Phân loại âm đầu',
    points: 10,
    prompt: 'Hãy xếp các tiếng vào nhóm thích hợp.',
    categories: [
      { id: 'ch', title: 'Tiếng có âm "ch"' },
      { id: 'kh', title: 'Tiếng có âm "kh"' },
      { id: 'nh', title: 'Tiếng có âm "nh"' },
      { id: 'ph', title: 'Tiếng có âm "ph"' },
    ],
    categorizeItems: [
      { id: 'i1', text: 'phở', correctGroupId: 'ph' },
      { id: 'i2', text: 'khế', correctGroupId: 'kh' },
      { id: 'i3', text: 'chợ', correctGroupId: 'ch' },
      { id: 'i4', text: 'phà', correctGroupId: 'ph' },
      { id: 'i5', text: 'phi', correctGroupId: 'ph' },
      { id: 'i6', text: 'kho', correctGroupId: 'kh' },
      { id: 'i7', text: 'nhẹ', correctGroupId: 'nh' },
      { id: 'i8', text: 'chị', correctGroupId: 'ch' },
      { id: 'i9', text: 'nhà', correctGroupId: 'nh' },
      { id: 'i10', text: 'khi', correctGroupId: 'kh' },
      { id: 'i11', text: 'chú', correctGroupId: 'ch' },
      { id: 'i12', text: 'nhỏ', correctGroupId: 'nh' },
    ],
    explanation:
      '• Tiếng có âm "ch": chợ, chị, chú.\n• Tiếng có âm "kh": khế, kho, khi.\n• Tiếng có âm "nh": nhẹ, nhà, nhỏ.\n• Tiếng có âm "ph": phở, phà, phi.',
  },
  {
    id: 24,
    number: 24,
    type: 'categorize',
    typeLabel: 'Phân loại vần an / ăn / ân',
    points: 10,
    prompt: 'Hãy xếp các từ ngữ vào nhóm thích hợp.',
    categories: [
      { id: 'an', title: 'Từ ngữ chứa tiếng có vần "an"' },
      { id: 'awn', title: 'Từ ngữ chứa tiếng có vần "ăn"' },
      { id: 'aan', title: 'Từ ngữ chứa tiếng có vần "ân"' },
    ],
    categorizeItems: [
      { id: 'w1', text: 'khăn lụa', correctGroupId: 'awn' },
      { id: 'w2', text: 'quả mận', correctGroupId: 'aan' },
      { id: 'w3', text: 'ân cần', correctGroupId: 'aan' },
      { id: 'w4', text: 'gắn bó', correctGroupId: 'awn' },
      { id: 'w5', text: 'la bàn', correctGroupId: 'an' },
      { id: 'w6', text: 'đan xen', correctGroupId: 'an' },
      { id: 'w7', text: 'san sát', correctGroupId: 'an' },
      { id: 'w8', text: 'củ sắn', correctGroupId: 'awn' },
      { id: 'w9', text: 'múa lân', correctGroupId: 'aan' },
    ],
    explanation:
      '• Từ ngữ chứa tiếng có vần "an": la bàn (bàn), đan xen (đan), san sát (san).\n• Từ ngữ chứa tiếng có vần "ăn": khăn lụa (khăn), gắn bó (gắn), củ sắn (sắn).\n• Từ ngữ chứa tiếng có vần "ân": quả mận (mận), ân cần (ân, cần), múa lân (lân).',
  },
  {
    id: 25,
    number: 25,
    type: 'dropdown',
    typeLabel: 'Chọn từ hoàn thành câu',
    points: 10,
    prompt: 'Chọn từ thích hợp điền vào chỗ trống.',
    imageUrl: '/assets/q_images/q25_hoasua.jpg',
    imageAlt: 'Chùm hoa sữa trắng xanh',
    sentenceBefore: 'Đây là hoa ',
    sentenceAfter: '.',
    dropdownOptions: ['sữa', 'sen', 'hồng', 'đào'],
    correctTextAnswers: ['sữa'],
    explanation:
      'Hình ảnh là chùm hoa sữa mọc thành từng chùm nhỏ màu trắng xanh đặc trưng của mùa thu. Đáp án đúng: "Đây là hoa sữa."',
  },
  {
    id: 26,
    number: 26,
    type: 'dropdown',
    typeLabel: 'Chọn từ hoàn thành câu',
    points: 10,
    prompt: 'Chọn từ thích hợp điền vào chỗ trống.',
    imageUrl: '/assets/q_images/q26_hat.png',
    imageAlt: 'Chiếc mũ màu hồng có đính hoa',
    sentenceBefore: 'Đây là cái ',
    sentenceAfter: '.',
    dropdownOptions: ['mũ', 'áo', 'khăn', 'túi'],
    correctTextAnswers: ['mũ'],
    explanation:
      'Hình ảnh là chiếc mũ (nón) rộng vành màu hồng có gắn bông hoa đỏ. Đáp án đúng: "Đây là cái mũ."',
  },
  {
    id: 27,
    number: 27,
    type: 'dropdown',
    typeLabel: 'Nhận diện vần chung',
    points: 10,
    prompt: 'Chọn vần thích hợp điền vào chỗ trống.',
    sentenceBefore: 'Các từ ngữ "san sẻ", "bạn bè", "gan dạ" có chung vần ',
    sentenceAfter: '.',
    dropdownOptions: ['an', 'ăn', 'ân', 'at'],
    correctTextAnswers: ['an'],
    explanation:
      'Tiếng "san" (trong "san sẻ"), tiếng "bạn" (trong "bạn bè") và tiếng "gan" (trong "gan dạ") đều có chung vần "an".',
  },
  {
    id: 28,
    number: 28,
    type: 'dropdown',
    typeLabel: 'Nhận diện âm đầu chung',
    points: 10,
    prompt: 'Chọn đáp án thích hợp điền vào chỗ trống.',
    imageUrl: '/assets/q_images/q28_fruits.jpg',
    imageAlt: 'Chùm nhãn và chùm nho',
    sentenceBefore: 'Tên hai loại quả trên có chung âm ',
    sentenceAfter: '.',
    dropdownOptions: ['nh', 'ch', 'kh', 'ph'],
    correctTextAnswers: ['nh'],
    explanation:
      'Hai loại quả trong hình là quả "nhãn" và quả "nho". Cả hai tiếng "nhãn" và "nho" đều bắt đầu bằng âm đầu "nh".',
  },
  {
    id: 29,
    number: 29,
    type: 'dropdown',
    typeLabel: 'Chọn từ chỉ hoạt động',
    points: 10,
    prompt: 'Chọn từ thích hợp điền vào chỗ trống.',
    imageUrl: '/assets/q_images/q29_washhands.png',
    imageAlt: 'Bạn Nam đang rửa tay với xà phòng dưới vòi nước',
    sentenceBefore: 'Nam ',
    sentenceAfter: ' tay để ăn trưa.',
    dropdownOptions: ['rửa', 'vỗ', 'nắm', 'xoa'],
    correctTextAnswers: ['rửa'],
    explanation:
      'Trong hình, bạn Nam đang rửa tay bằng xà phòng dưới vòi nước sạch trước bữa ăn. Câu hoàn chỉnh: "Nam rửa tay để ăn trưa."',
  },
  {
    id: 30,
    number: 30,
    type: 'dropdown',
    typeLabel: 'Giải câu đố',
    points: 10,
    prompt: 'Giải câu đố sau:',
    poemLines: [
      'Chú ta có bốn chân',
      'Giữ nhà cho chủ đó',
      'Khi cần sẽ sủa to',
      'Đố bé là con gì?',
    ],
    sentenceBefore: 'Đáp án: con ',
    sentenceAfter: '.',
    dropdownOptions: ['chó', 'mèo', 'gà', 'lợn'],
    correctTextAnswers: ['chó'],
    explanation:
      'Con vật có bốn chân, biết sủa "gâu gâu" và trông giữ nhà cho chủ chính là con chó. Đáp án đúng: "con chó".',
  },
];

export function isQuestionAnswered(q: Question, ans: any): boolean {
  if (ans === undefined || ans === null) return false;
  switch (q.type) {
    case 'mcq':
      return typeof ans === 'string' && ans.length > 0;
    case 'fill_text':
    case 'dropdown':
      return typeof ans === 'string' && ans.trim().length > 0;
    case 'matching': {
      if (typeof ans !== 'object') return false;
      const leftCount = q.leftItems?.length || 0;
      return Object.keys(ans).length === leftCount && leftCount > 0;
    }
    case 'ordering': {
      if (!Array.isArray(ans)) return false;
      return ans.length === (q.orderingTokens?.length || 0);
    }
    case 'categorize': {
      if (typeof ans !== 'object') return false;
      const totalItems = q.categorizeItems?.length || 0;
      return Object.keys(ans).length === totalItems && totalItems > 0;
    }
    default:
      return false;
  }
}

export function checkQuestionCorrect(q: Question, ans: any): boolean {
  if (!isQuestionAnswered(q, ans)) return false;
  switch (q.type) {
    case 'mcq':
      return ans === q.correctMcqId;
    case 'fill_text':
    case 'dropdown': {
      const normalized = String(ans).trim().toLowerCase();
      return (q.correctTextAnswers || []).some(
        (valid) => valid.trim().toLowerCase() === normalized
      );
    }
    case 'matching': {
      const correct = q.correctPairs || {};
      return Object.entries(correct).every(([lId, rId]) => ans[lId] === rId);
    }
    case 'ordering': {
      const expected = q.correctOrder || [];
      if (!Array.isArray(ans) || ans.length !== expected.length) return false;
      const matchesExpected = expected.every((val, idx) => ans[idx] === val);
      if (matchesExpected) return true;
      if (q.alternativeOrders && q.alternativeOrders.length > 0) {
        return q.alternativeOrders.some(
          (alt) =>
            alt.length === ans.length &&
            alt.every((val, idx) => ans[idx] === val)
        );
      }
      return false;
    }
    case 'categorize': {
      const items = q.categorizeItems || [];
      return items.every((item) => ans[item.id] === item.correctGroupId);
    }
    default:
      return false;
  }
}
