import { Question, QUESTIONS } from './questions';

export interface ExamDeck {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  passingScore: number;
  createdAt: string;
  isCustom?: boolean;
  questions: Question[];
}

// Đề số 2: Đề Luyện Tập Cấp Trường Số 2 (30 câu hỏi mới 100%, bám sát cấu trúc 6 dạng bài TNTV)
export const DECK_2_QUESTIONS: Question[] = [
  {
    id: 201,
    number: 1,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Tiếng nào mang thanh sắc (´) ?',
    mcqOptions: [
      { id: 'A', text: 'bàn' },
      { id: 'B', text: 'cá' },
      { id: 'C', text: 'cỏ' },
      { id: 'D', text: 'mũ' },
    ],
    correctMcqId: 'B',
    explanation:
      'Tiếng "cá" mang thanh sắc (´) đặt trên âm "a". Tiếng "bàn" mang thanh huyền, "cỏ" mang thanh hỏi, "mũ" mang thanh ngã.',
  },
  {
    id: 202,
    number: 2,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Tiếng nào có vần "om"?',
    mcqOptions: [
      { id: 'A', text: 'đom' },
      { id: 'B', text: 'cơm' },
      { id: 'C', text: 'tôm' },
      { id: 'D', text: 'cam' },
    ],
    correctMcqId: 'A',
    explanation:
      'Tiếng "đom" (trong "đom đóm") gồm âm đầu "đ" ghép với vần "om". Tiếng "cơm" có vần "ơm", "tôm" có vần "ôm", "cam" có vần "am".',
  },
  {
    id: 203,
    number: 3,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Đâu là tên một loài hoa?',
    mcqOptions: [
      { id: 'A', text: 'cúc' },
      { id: 'B', text: 'mèo' },
      { id: 'C', text: 'bút' },
      { id: 'D', text: 'thước' },
    ],
    correctMcqId: 'A',
    explanation:
      '"Cúc" (hoa cúc) là tên một loài hoa quen thuộc. "Mèo" là con vật, "bút" và "thước" là đồ dùng học tập.',
  },
  {
    id: 204,
    number: 4,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Tiếng nào có vần "ap"?',
    mcqOptions: [
      { id: 'A', text: 'bắp' },
      { id: 'B', text: 'tập' },
      { id: 'C', text: 'tháp' },
      { id: 'D', text: 'hộp' },
    ],
    correctMcqId: 'C',
    explanation:
      'Tiếng "tháp" có âm đầu "th" ghép với vần "ap" và thanh sắc. Tiếng "bắp" có vần "ăp", "tập" có vần "âp", "hộp" có vần "ôp".',
  },
  {
    id: 205,
    number: 5,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Đâu là tên một đồ dùng học tập?',
    mcqOptions: [
      { id: 'A', text: 'thước kẻ' },
      { id: 'B', text: 'con gà' },
      { id: 'C', text: 'cây đa' },
      { id: 'D', text: 'bông lúa' },
    ],
    correctMcqId: 'A',
    explanation:
      '"Thước kẻ" là đồ dùng học tập của học sinh dùng để kẻ đường thẳng.',
  },
  {
    id: 206,
    number: 6,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Từ nào thích hợp điền vào chỗ trống trong câu sau?',
    subPrompt: 'Em [...] bài thật cẩn thận.',
    mcqOptions: [
      { id: 'A', text: 'viết' },
      { id: 'B', text: 'bay' },
      { id: 'C', text: 'bơi' },
      { id: 'D', text: 'hót' },
    ],
    correctMcqId: 'A',
    explanation:
      'Điền từ "viết" tạo thành câu có nghĩa phù hợp: "Em viết bài thật cẩn thận."',
  },
  {
    id: 207,
    number: 7,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Câu nào chứa tiếng có vần "ât"?',
    mcqOptions: [
      { id: 'A', text: 'Bé lật đật chạy ra đón mẹ.' },
      { id: 'B', text: 'Đàn chim hót líu lo trên cành.' },
      { id: 'C', text: 'Mẹ mua cho bé hộp bút chì.' },
      { id: 'D', text: 'Bố trồng cây cam ở góc vườn.' },
    ],
    correctMcqId: 'A',
    explanation:
      'Trong câu A, cả hai tiếng "lật" và "đật" đều chứa vần "ât".',
  },
  {
    id: 208,
    number: 8,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: 'Câu nào có từ viết sai chính tả?',
    mcqOptions: [
      { id: 'A', text: 'Mẹ nấu canh cua đồng rất ngon.' },
      { id: 'B', text: 'Em ngồi nghe bà kể chuyện cổ tích.' },
      { id: 'C', text: 'Các bạn nhỏ chơi kéo co trên sân.' },
      { id: 'D', text: 'Bé xếp gọn gàng sách vở lên gế gỗ.' },
    ],
    correctMcqId: 'D',
    explanation:
      'Câu D viết sai chính tả ở chữ "gế gỗ" (quy tắc g/gh: đứng trước "ê" phải viết là "gh"). Cách viết đúng là "ghế gỗ".',
  },
  {
    id: 209,
    number: 9,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm',
    points: 10,
    prompt: '"Đàn chim nhỏ" có thể ghép với đáp án nào để tạo thành câu đúng?',
    mcqOptions: [
      { id: 'A', text: 'hót líu lo trên vòm cây xanh' },
      { id: 'B', text: 'lặn sâu dưới đáy biển xanh' },
      { id: 'C', text: 'kéo cày trên cánh đồng làng' },
      { id: 'D', text: 'nấu cơm giúp mẹ mỗi chiều' },
    ],
    correctMcqId: 'A',
    explanation:
      'Ghép với đáp án A ta được câu đúng miêu tả hoạt động của loài chim: "Đàn chim nhỏ hót líu lo trên vòm cây xanh."',
  },
  {
    id: 210,
    number: 10,
    type: 'mcq',
    typeLabel: 'Trắc nghiệm hình ảnh',
    points: 10,
    prompt: 'Câu nào mô tả đúng hình ảnh sau?',
    imageUrl: '/assets/q_images/q13_chickens.jpg',
    imageAlt: 'Cô Hà đang cho đàn gà ăn thóc',
    mcqOptions: [
      { id: 'A', text: 'Cô Hà đang tưới hoa trong công viên.' },
      { id: 'B', text: 'Cô Hà đang cho đàn gà ăn ở sân vườn.' },
      { id: 'C', text: 'Cô Hà đang chèo thuyền trên dòng sông.' },
      { id: 'D', text: 'Cô Hà đang dạy học ở trên lớp.' },
    ],
    correctMcqId: 'B',
    explanation:
      'Hình ảnh mô tả cô Hà đang đứng trong sân vườn rải thóc cho đàn gà ăn.',
  },
  {
    id: 211,
    number: 11,
    type: 'fill_text',
    typeLabel: 'Chính tả c / k',
    points: 10,
    prompt: 'Điền "c" hoặc "k" thích hợp vào chỗ trống:',
    sentenceBefore: 'Mẹ dùng ',
    sentenceAfter: 'éo cắt vải may áo mới cho bé.',
    hintOptions: ['c', 'k', 'q'],
    correctTextAnswers: ['k'],
    explanation:
      'Theo quy tắc chính tả, đứng trước các nguyên âm e, ê, i ta viết âm "k". Vậy điền "k" để được từ "kéo".',
  },
  {
    id: 212,
    number: 12,
    type: 'fill_text',
    typeLabel: 'Điền tiếng trong ngoặc',
    points: 10,
    prompt: 'Chọn tiếng thích hợp trong ngoặc điền vào chỗ trống:',
    subPrompt: '(dừa, dưa, lựu)',
    imageUrl: '/assets/q_images/q11_coconut.png',
    imageAlt: 'Quả dừa xanh',
    sentenceBefore: 'Nước ',
    sentenceAfter: ' tươi uống rất mát và ngọt.',
    hintOptions: ['dừa', 'dưa', 'lựu'],
    correctTextAnswers: ['dừa'],
    explanation:
      'Hình minh họa là quả dừa. Điền tiếng "dừa" ta được câu: "Nước dừa tươi uống rất mát và ngọt."',
  },
  {
    id: 213,
    number: 13,
    type: 'fill_text',
    typeLabel: 'Chính tả ng / ngh',
    points: 10,
    prompt: 'Điền "ng" hoặc "ngh" thích hợp vào chỗ trống:',
    sentenceBefore: 'Chú ',
    sentenceAfter: 'é con lon ton theo mẹ ra đồng.',
    hintOptions: ['ng', 'ngh'],
    correctTextAnswers: ['ngh'],
    explanation:
      'Quy tắc ng / ngh: Chữ "ngh" đứng trước các nguyên âm e, ê, i. Trước chữ "é" ta điền "ngh" để được từ "nghé con".',
  },
  {
    id: 214,
    number: 14,
    type: 'fill_text',
    typeLabel: 'Chính tả tr / ch',
    points: 10,
    prompt: 'Điền "tr" hoặc "ch" thích hợp vào chỗ trống:',
    sentenceBefore: 'Bầu ',
    sentenceAfter: 'ời mùa thu trong xanh và cao vời vợi.',
    hintOptions: ['tr', 'ch'],
    correctTextAnswers: ['tr'],
    explanation:
      'Từ đúng chính tả là "bầu trời" (âm đầu "tr").',
  },
  {
    id: 215,
    number: 15,
    type: 'fill_text',
    typeLabel: 'Đố vui ô chữ',
    points: 10,
    prompt: 'Điền số thích hợp vào chỗ trống:',
    subPrompt: '(Lưu ý: Tìm các từ chỉ con vật theo hàng ngang trong bảng ô chữ.)',
    wordSearchGrid: [
      ['M', 'È', 'O', 'K', 'L'],
      ['A', 'B', 'C', 'Á', 'V'],
      ['G', 'À', 'T', 'H', 'Ỏ'],
      ['S', 'U', 'V', 'I', 'T'],
      ['C', 'U', 'A', 'N', 'P'],
    ],
    sentenceBefore: 'Ô chữ trên có tất cả ',
    sentenceAfter: ' từ chỉ tên con vật ở hàng ngang.',
    hintOptions: ['3', '4', '5', '6'],
    correctTextAnswers: ['5'],
    explanation:
      'Xét theo hàng ngang, ta tìm được 5 tên con vật: Hàng 1 có "MÈO", Hàng 2 có "CÁ", Hàng 3 có "GÀ" và "THỎ", Hàng 5 có "CUA". Tổng cộng có 5 từ chỉ con vật.',
  },
  {
    id: 216,
    number: 16,
    type: 'matching',
    typeLabel: 'Ghép tiếng tạo từ',
    points: 10,
    prompt: 'Hãy ghép các tiếng ở hai vế để tạo thành từ ngữ đúng.',
    leftItems: [
      { id: 'L1', text: 'chăm' },
      { id: 'L2', text: 'ngoan' },
      { id: 'L3', text: 'dũng' },
    ],
    rightItems: [
      { id: 'R1', text: 'ngoãn' },
      { id: 'R2', text: 'cảm' },
      { id: 'R3', text: 'chỉ' },
    ],
    correctPairs: {
      L1: 'R3',
      L2: 'R1',
      L3: 'R2',
    },
    explanation:
      'Ghép hai cột ta được các từ chỉ phẩm chất tốt đẹp của học sinh: "chăm chỉ", "ngoan ngoãn", "dũng cảm".',
  },
  {
    id: 217,
    number: 17,
    type: 'matching',
    typeLabel: 'Ghép con vật với tiếng kêu',
    points: 10,
    prompt: 'Hãy ghép tên con vật với tiếng kêu hoặc hoạt động đặc trưng.',
    leftItems: [
      { id: 'L1', text: 'Con gà trống' },
      { id: 'L2', text: 'Con mèo mướp' },
      { id: 'L3', text: 'Con chó mực' },
    ],
    rightItems: [
      { id: 'R1', text: 'kêu meo meo bên bếp lửa' },
      { id: 'R2', text: 'gáy ò ó o gọi mặt trời dậy' },
      { id: 'R3', text: 'sủa gâu gâu trông giữ nhà' },
    ],
    correctPairs: {
      L1: 'R2',
      L2: 'R1',
      L3: 'R3',
    },
    explanation:
      'Con gà trống gáy ò ó o; Con mèo mướp kêu meo meo; Con chó mực sủa gâu gâu trông giữ nhà.',
  },
  {
    id: 218,
    number: 18,
    type: 'matching',
    typeLabel: 'Ghép từ trái nghĩa',
    points: 10,
    prompt: 'Hãy ghép các tiếng có nghĩa trái ngược nhau ở hai cột.',
    leftItems: [
      { id: 'L1', text: 'cao' },
      { id: 'L2', text: 'nhanh' },
      { id: 'L3', text: 'sáng' },
    ],
    rightItems: [
      { id: 'R1', text: 'chậm' },
      { id: 'R2', text: 'tối' },
      { id: 'R3', text: 'thấp' },
    ],
    correctPairs: {
      L1: 'R3',
      L2: 'R1',
      L3: 'R2',
    },
    explanation:
      'Các cặp từ trái nghĩa: cao ↔ thấp; nhanh ↔ chậm; sáng ↔ tối.',
  },
  {
    id: 219,
    number: 19,
    type: 'matching',
    typeLabel: 'Ghép hình với tên quả',
    points: 10,
    prompt: 'Hãy ghép hình ảnh với câu miêu tả loại quả tương ứng.',
    leftItems: [
      { id: 'L1', imageUrl: '/assets/q_images/q16_pear.png', imageAlt: 'Quả lê', text: 'Hình 1' },
      { id: 'L2', imageUrl: '/assets/q_images/q16_grapes.png', imageAlt: 'Chùm nho', text: 'Hình 2' },
      { id: 'L3', imageUrl: '/assets/q_images/q16_tamarind.png', imageAlt: 'Quả me', text: 'Hình 3' },
    ],
    rightItems: [
      { id: 'R1', text: 'Chùm nho chín mọng màu tím.' },
      { id: 'R2', text: 'Quả me có vị chua dùng nấu canh.' },
      { id: 'R3', text: 'Quả lê giòn ngọt, ruột trắng.' },
    ],
    correctPairs: {
      L1: 'R3',
      L2: 'R1',
      L3: 'R2',
    },
    explanation:
      'Hình 1 là quả lê giòn ngọt; Hình 2 là chùm nho chín tím; Hình 3 là quả me vỏ nâu vị chua.',
  },
  {
    id: 220,
    number: 20,
    type: 'ordering',
    typeLabel: 'Sắp xếp thứ tự bảng chữ cái',
    points: 10,
    prompt: 'Sắp xếp tên các bạn sau theo đúng thứ tự trong bảng chữ cái.',
    orderingTokens: ['Lan', 'An', 'Mai', 'Bình'],
    correctOrder: ['An', 'Bình', 'Lan', 'Mai'],
    orderingJoiner: ' → ',
    explanation:
      'Theo thứ tự bảng chữ cái tiếng Việt (A → B → L → M): An đứng đầu, tiếp theo là Bình, Lan và cuối cùng là Mai.',
  },
  {
    id: 221,
    number: 21,
    type: 'ordering',
    typeLabel: 'Sắp xếp tiếng thành câu',
    points: 10,
    prompt: 'Sắp xếp các tiếng sau để tạo thành câu hoàn chỉnh.',
    orderingTokens: ['trường.', 'đến', 'Em', 'vui', 'rất', 'khi'],
    correctOrder: ['Em', 'rất', 'vui', 'khi', 'đến', 'trường.'],
    orderingJoiner: ' ',
    explanation:
      'Ghép các tiếng theo đúng ngữ pháp ta được câu: "Em rất vui khi đến trường."',
  },
  {
    id: 222,
    number: 22,
    type: 'ordering',
    typeLabel: 'Sắp xếp chữ cái thành từ',
    points: 10,
    prompt: 'Sắp xếp các chữ sau để tạo thành từ chỉ người thân trong gia đình.',
    orderingTokens: ['Ô', 'b', 'n', 'à', 'g'],
    correctOrder: ['Ô', 'n', 'g', 'b', 'à'],
    orderingJoiner: '',
    explanation:
      'Ghép các chữ cái Ô, n, g, b, à theo đúng thứ tự ta được từ "Ông bà".',
  },
  {
    id: 223,
    number: 23,
    type: 'categorize',
    typeLabel: 'Phân loại âm đầu',
    points: 10,
    prompt: 'Hãy xếp các tiếng vào nhóm âm đầu thích hợp.',
    categories: [
      { id: 'tr', title: 'Tiếng có âm "tr"' },
      { id: 'th', title: 'Tiếng có âm "th"' },
      { id: 'ng', title: 'Tiếng có âm "ng"' },
    ],
    categorizeItems: [
      { id: 'c1', text: 'tre', correctGroupId: 'tr' },
      { id: 'c2', text: 'thỏ', correctGroupId: 'th' },
      { id: 'c3', text: 'ngựa', correctGroupId: 'ng' },
      { id: 'c4', text: 'trăng', correctGroupId: 'tr' },
      { id: 'c5', text: 'thư', correctGroupId: 'th' },
      { id: 'c6', text: 'ngỗng', correctGroupId: 'ng' },
      { id: 'c7', text: 'trống', correctGroupId: 'tr' },
      { id: 'c8', text: 'thuyền', correctGroupId: 'th' },
      { id: 'c9', text: 'ngọc', correctGroupId: 'ng' },
    ],
    explanation:
      '• Âm "tr": tre, trăng, trống.\n• Âm "th": thỏ, thư, thuyền.\n• Âm "ng": ngựa, ngỗng, ngọc.',
  },
  {
    id: 224,
    number: 24,
    type: 'categorize',
    typeLabel: 'Phân loại chủ điểm từ vựng',
    points: 10,
    prompt: 'Hãy xếp các từ ngữ sau vào nhóm chủ điểm thích hợp.',
    categories: [
      { id: 'animals', title: 'Từ chỉ con vật' },
      { id: 'plants', title: 'Từ chỉ cây cối, hoa quả' },
      { id: 'objects', title: 'Từ chỉ đồ vật' },
    ],
    categorizeItems: [
      { id: 'p1', text: 'chim sẻ', correctGroupId: 'animals' },
      { id: 'p2', text: 'hoa sen', correctGroupId: 'plants' },
      { id: 'p3', text: 'cặp sách', correctGroupId: 'objects' },
      { id: 'p4', text: 'cá chép', correctGroupId: 'animals' },
      { id: 'p5', text: 'quả cam', correctGroupId: 'plants' },
      { id: 'p6', text: 'đồng hồ', correctGroupId: 'objects' },
      { id: 'p7', text: 'thỏ trắng', correctGroupId: 'animals' },
      { id: 'p8', text: 'cây bàng', correctGroupId: 'plants' },
      { id: 'p9', text: 'bút mực', correctGroupId: 'objects' },
    ],
    explanation:
      '• Từ chỉ con vật: chim sẻ, cá chép, thỏ trắng.\n• Từ chỉ cây cối, hoa quả: hoa sen, quả cam, cây bàng.\n• Từ chỉ đồ vật: cặp sách, đồng hồ, bút mực.',
  },
  {
    id: 225,
    number: 25,
    type: 'dropdown',
    typeLabel: 'Chọn từ hoàn thành câu',
    points: 10,
    prompt: 'Chọn từ thích hợp điền vào chỗ trống.',
    sentenceBefore: 'Mặt trời mọc ở hướng ',
    sentenceAfter: '.',
    dropdownOptions: ['đông', 'tây', 'nam', 'bắc'],
    correctTextAnswers: ['đông'],
    explanation:
      'Theo quy luật tự nhiên, mỗi buổi sáng mặt trời mọc ở hướng đông và lặn ở hướng tây.',
  },
  {
    id: 226,
    number: 26,
    type: 'dropdown',
    typeLabel: 'Chọn từ hoàn thành câu',
    points: 10,
    prompt: 'Chọn từ thích hợp điền vào chỗ trống.',
    sentenceBefore: 'Học thầy không tày học ',
    sentenceAfter: '.',
    dropdownOptions: ['bạn', 'trò', 'em', 'anh'],
    correctTextAnswers: ['bạn'],
    explanation:
      'Câu tục ngữ quen thuộc khuyên học sinh biết học hỏi từ bạn bè: "Học thầy không tày học bạn."',
  },
  {
    id: 227,
    number: 27,
    type: 'dropdown',
    typeLabel: 'Nhận diện vần chung',
    points: 10,
    prompt: 'Chọn vần thích hợp điền vào chỗ trống.',
    sentenceBefore: 'Các từ ngữ "bông hồng", "đồng ruộng", "cầu vồng" có chung vần ',
    sentenceAfter: '.',
    dropdownOptions: ['ông', 'ong', 'ung', 'ăng'],
    correctTextAnswers: ['ông'],
    explanation:
      'Các tiếng "bông", "hồng", "đồng", "vồng" đều có chung vần "ông".',
  },
  {
    id: 228,
    number: 28,
    type: 'dropdown',
    typeLabel: 'Nhận diện âm đầu chung',
    points: 10,
    prompt: 'Chọn đáp án thích hợp điền vào chỗ trống.',
    sentenceBefore: 'Tên các con vật "gà", "ghẹ", "gấu" đều ghi bằng chữ bắt đầu có âm ',
    sentenceAfter: '.',
    dropdownOptions: ['g / gh', 'c / k', 'ng / ngh', 'ch / tr'],
    correctTextAnswers: ['g / gh'],
    explanation:
      'Các tiếng "gà", "gấu" viết bằng chữ "g", tiếng "ghẹ" viết bằng chữ "gh" (đứng trước "e").',
  },
  {
    id: 229,
    number: 29,
    type: 'dropdown',
    typeLabel: 'Chọn từ chỉ hoạt động',
    points: 10,
    prompt: 'Chọn từ thích hợp điền vào chỗ trống.',
    imageUrl: '/assets/q_images/q19_writing.png',
    imageAlt: 'Bạn nhỏ đang ngồi học bài',
    sentenceBefore: 'Bạn Hà chăm chỉ ',
    sentenceAfter: ' bài dưới ánh đèn bàn.',
    dropdownOptions: ['viết', 'chạy', 'nhảy', 'bơi'],
    correctTextAnswers: ['viết'],
    explanation:
      'Hình ảnh bạn Hà đang cầm bút ngồi ngay ngắn viết bài vào vở.',
  },
  {
    id: 230,
    number: 30,
    type: 'dropdown',
    typeLabel: 'Giải câu đố',
    points: 10,
    prompt: 'Giải câu đố sau:',
    poemLines: [
      'Con gì đuôi ngắn tai dài',
      'Mắt hồng lông mượt có tài chạy nhanh',
      'Ăn cà rốt, lá rau xanh',
      'Đố bé biết được tên anh là gì?',
    ],
    sentenceBefore: 'Đáp án: con ',
    sentenceAfter: '.',
    dropdownOptions: ['thỏ', 'mèo', 'sóc', 'nhím'],
    correctTextAnswers: ['thỏ'],
    explanation:
      'Con vật có đôi tai dài, đuôi ngắn, mắt hồng, thích ăn củ cà rốt chính là con thỏ.',
  },
];

export const BUILTIN_EXAM_DECKS: ExamDeck[] = [
  {
    id: 'deck-official-pdf',
    title: 'Đề số 1: Đề Ôn Luyện TNTV Cấp Trường (Đề gốc PDF)',
    subtitle: 'Bộ đề chuẩn 30 câu hỏi trích xuất từ tài liệu PDF đính kèm',
    durationMinutes: 30,
    passingScore: 150,
    createdAt: 'Đề chuẩn hệ thống',
    questions: QUESTIONS,
  },
  {
    id: 'deck-school-2',
    title: 'Đề số 2: Đề Thi Thử Cấp Trường Mở Rộng',
    subtitle: '30 câu hỏi mới luyện âm vần, chính tả c/k, ng/ngh, tục ngữ & câu đố',
    durationMinutes: 30,
    passingScore: 180,
    createdAt: 'Đề chuẩn hệ thống',
    questions: DECK_2_QUESTIONS,
  },
];

/**
 * Hàm sinh đề thi mới tự động từ Ngân hàng 60 câu hỏi chuẩn
 * Cho phép lọc theo các dạng bài, chọn số lượng câu (10, 15, 20, 30 câu),
 * xáo trộn thứ tự câu hỏi và đánh lại số thứ tự từ Câu 1 -> Câu N.
 */
export function generateRandomizedDeck(options: {
  title: string;
  questionCount: number;
  durationMinutes: number;
  includedTypes: string[];
  shuffleOptions: boolean;
}): ExamDeck {
  const allPool = [...QUESTIONS, ...DECK_2_QUESTIONS];
  const filteredPool = allPool.filter((q) =>
    options.includedTypes.includes(q.type)
  );

  const sourcePool = filteredPool.length > 0 ? filteredPool : allPool;

  // Fisher-Yates shuffle
  const shuffled = [...sourcePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  const selected = shuffled
    .slice(0, Math.min(options.questionCount, shuffled.length))
    .map((q, idx) => {
      const cloned: Question = {
        ...q,
        id: Date.now() + idx,
        number: idx + 1,
      };
      // Nếu bật đảo thứ tự các thẻ trong bài Sắp xếp
      if (
        options.shuffleOptions &&
        cloned.type === 'ordering' &&
        cloned.orderingTokens
      ) {
        const tokens = [...cloned.orderingTokens];
        for (let i = tokens.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
        }
        cloned.orderingTokens = tokens;
      }
      return cloned;
    });

  const maxScore = selected.length * 10;

  return {
    id: `deck-custom-${Date.now()}`,
    title: options.title.trim() || `Đề luyện tập tự tạo (${selected.length} câu)`,
    subtitle: `${selected.length} câu hỏi · Thời gian ${options.durationMinutes} phút`,
    durationMinutes: options.durationMinutes,
    passingScore: Math.round(maxScore * 0.6),
    createdAt: new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }),
    isCustom: true,
    questions: selected,
  };
}
