/**
 * Gemini AI — Sinh đề thi Tiếng Anh
 * Hỗ trợ: theo bài, theo ma trận, đề THPT 2026
 */

export type GeminiExamConfig = {
  grade: string;           // '6'-'12'
  lesson_id?: string;      // e.g. 'anh12-unit-1-p1'
  lesson_name?: string;    // display name
  unit?: string;           // 'Unit 1: Life Stories'
  topic?: string;          // topic context
  num_questions?: number;  // default 40
  duration?: number;       // minutes
  difficulty_mix?: {
    nhan_biet: number;     // % Nhận biết
    thong_hieu: number;    // % Thông hiểu
    van_dung: number;      // % Vận dụng
    van_dung_cao: number;  // % Vận dụng cao
  };
  exam_type: 'bai' | 'lop' | 'hoc-ky' | 'thpt' | 'ma-tran';
  semester?: 1 | 2;
  custom_instruction?: string;
};

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey(): string {
  const key = import.meta.env.PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('Chưa cấu hình Gemini API Key. Vui lòng thêm PUBLIC_GEMINI_API_KEY vào file .env');
  return key;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Gemini API lỗi: ${err?.error?.message || response.statusText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini không trả về nội dung');
  return text;
}

function parseJsonFromResponse(text: string): any {
  // Extract JSON block from markdown code fence if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;
  try {
    return JSON.parse(jsonStr.trim());
  } catch {
    // Try to find JSON array/object
    const arrMatch = jsonStr.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (arrMatch) return JSON.parse(arrMatch[1]);
    throw new Error('Không thể parse JSON từ phản hồi Gemini');
  }
}

// ─── Prompt builders ─────────────────────────────────────────

function buildMCQPrompt(config: GeminiExamConfig, count: number): string {
  const diffStr = config.difficulty_mix
    ? `- Nhận biết: ${config.difficulty_mix.nhan_biet}%
- Thông hiểu: ${config.difficulty_mix.thong_hieu}%
- Vận dụng: ${config.difficulty_mix.van_dung}%
- Vận dụng cao: ${config.difficulty_mix.van_dung_cao}%`
    : '- Phân phối đều 4 mức độ';

  const contextStr = config.lesson_name
    ? `Bài học: ${config.lesson_name}${config.unit ? ` (${config.unit})` : ''}`
    : `Lớp ${config.grade} Tiếng Anh Global Success`;

  return `Bạn là giáo viên Tiếng Anh THPT Việt Nam. Tạo ${count} câu hỏi trắc nghiệm (MCQ) cho:
${contextStr}
${config.topic ? `Chủ đề: ${config.topic}` : ''}
${config.custom_instruction || ''}

Phân phối mức độ:
${diffStr}

YÊU CẦU QUAN TRỌNG:
1. Câu hỏi bằng Tiếng Anh, giải thích có thể bằng tiếng Việt
2. 4 đáp án A/B/C/D, chỉ 1 đúng
3. Đáp án đúng phân phối đều A/B/C/D
4. Bám sát chương trình SGK Global Success lớp ${config.grade}
5. Đa dạng: từ vựng, ngữ pháp, đọc hiểu ngữ cảnh

Trả về JSON array: 
[{
  "id": "q1",
  "type": "mcq",
  "question": "câu hỏi",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct": 0,
  "explanation": "giải thích chi tiết",
  "difficulty": "nhan-biet|thong-hieu|van-dung|van-dung-cao",
  "skill": "vocabulary|grammar|reading"
}, ...]

CHỈ trả về JSON, không có text khác.`;
}

function buildReadingPrompt(grade: string, count: number): string {
  return `Bạn là giáo viên Tiếng Anh THPT. Tạo ${count} đoạn đọc hiểu phù hợp lớp ${grade} Global Success.

Mỗi đoạn: 150-250 từ, 4-5 câu hỏi MCQ phía sau.

Trả về JSON array:
[{
  "id": "r1",
  "type": "reading",
  "passage": "đoạn văn...",
  "questions": [{
    "question": "câu hỏi",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": 0,
    "explanation": "..."
  }]
}]

CHỈ trả về JSON.`;
}

function buildListeningPrompt(grade: string, count: number): string {
  return `Bạn là giáo viên Tiếng Anh THPT. Tạo ${count} bài nghe phù hợp lớp ${grade}.

Mỗi bài: script tiếng Anh ngắn (100-150 từ), 4-5 câu hỏi MCQ.

Trả về JSON array:
[{
  "id": "l1",
  "type": "listening",
  "transcript": "script tiếng Anh...",
  "audio_url": null,
  "questions": [{
    "question": "câu hỏi",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": 0,
    "explanation": "..."
  }]
}]

CHỈ trả về JSON.`;
}

function buildThptPrompt(year: number = 2026): string {
  return `Bạn là chuyên gia đề thi THPT quốc gia Tiếng Anh Việt Nam. Tạo bộ đề thi theo cấu trúc đề thi TN THPT ${year}.

Cấu trúc đề (100 câu trắc nghiệm, 120 phút):
PHẦN I - LISTENING (35 câu, 8.75 điểm):
- 5 phần, mỗi phần 7 câu MCQ
- Dựa trên script/transcript

PHẦN II - READING (35 câu, 8.75 điểm):
- Phần 1: Cloze test 7 câu (điền từ vào đoạn văn)
- Phần 2: Reading comprehension 7 câu (đoạn 1)
- Phần 3: Reading comprehension 7 câu (đoạn 2)
- Phần 4: Sentence matching 7 câu
- Phần 5: Gapped text 7 câu

PHẦN III - LANGUAGE FOCUS (30 câu, 7.5 điểm):
- Từ vựng: 10 câu
- Ngữ pháp (cấu trúc câu, thì, mệnh đề): 20 câu

Tổng 10 điểm = Phần I (35 × 0.25) + Phần II (35 × 0.25) + Phần III (30 × 0.25)

Trả về JSON:
{
  "sections": [
    {
      "name": "Phần I: Listening",
      "questions": [...]
    },
    {
      "name": "Phần II: Reading",
      "questions": [...]
    },
    {
      "name": "Phần III: Language Focus",
      "questions": [...]
    }
  ]
}

Mỗi câu MCQ: {"id": "...", "type": "mcq", "question": "...", "options": ["A...","B...","C...","D..."], "correct": 0, "explanation": "..."}
Câu listening: {"id": "...", "type": "listening", "transcript": "...", "questions": [...]}
Câu reading: {"id": "...", "type": "reading", "passage": "...", "questions": [...]}

CHỈ trả về JSON, không thêm text. Tạo đề chất lượng cao.`;
}

function buildMatrixPrompt(matrix: any, grade: string): string {
  const rows = matrix.rows || [];
  const rowsStr = rows.map((r: any) =>
    `  ${r.topic}: NB=${r.nhan_biet}, TH=${r.thong_hieu}, VD=${r.van_dung}, VDC=${r.van_dung_cao}`
  ).join('\n');

  return `Bạn là giáo viên Tiếng Anh lớp ${grade}. Tạo đề thi theo ma trận sau:

Lớp: ${grade}${matrix.semester ? ` - Học kỳ ${matrix.semester}` : ''}
Tổng số câu: ${matrix.total_questions || 40}
Thời gian: ${matrix.duration_minutes || 45} phút

Ma trận (NB=Nhận biết, TH=Thông hiểu, VD=Vận dụng, VDC=Vận dụng cao):
${rowsStr}

Tạo đúng số câu theo từng ô ma trận. Tất cả MCQ 4 lựa chọn.

Trả về JSON array:
[{"id": "q1", "type": "mcq", "question": "...", "options": ["A...","B...","C...","D..."], "correct": 0, "explanation": "...", "difficulty": "nhan-biet|thong-hieu|van-dung|van-dung-cao", "skill": "vocabulary|grammar|reading|listening"}]

CHỈ trả về JSON.`;
}

// ─── Main Generation Functions ─────────────────────────────

/**
 * Generate exam by lesson / grade / topic
 */
export async function generateExamQuestions(config: GeminiExamConfig): Promise<any[]> {
  const numQ = config.num_questions || 20;
  const mcqCount = Math.ceil(numQ * 0.7);
  const readingCount = Math.ceil(numQ * 0.2);
  const listeningCount = numQ - mcqCount - readingCount;

  const tasks: Promise<any[]>[] = [];

  // MCQ block
  tasks.push(
    callGemini(buildMCQPrompt(config, mcqCount))
      .then(text => parseJsonFromResponse(text))
      .catch(e => { console.warn('MCQ gen failed:', e); return []; })
  );

  // Reading block (if lop/hoc-ky/thpt)
  if (['lop', 'hoc-ky', 'ma-tran'].includes(config.exam_type) && readingCount > 0) {
    tasks.push(
      callGemini(buildReadingPrompt(config.grade, Math.max(1, Math.floor(readingCount / 5))))
        .then(text => parseJsonFromResponse(text))
        .catch(e => { console.warn('Reading gen failed:', e); return []; })
    );
  }

  const results = await Promise.all(tasks);

  // Flatten and re-index
  const allQuestions = results.flat().map((q, i) => ({
    ...q,
    id: `q${i + 1}`,
  }));

  return allQuestions;
}

/**
 * Generate exam following ma trận
 */
export async function generateExamByMatrix(matrix: any, grade: string): Promise<any[]> {
  const text = await callGemini(buildMatrixPrompt(matrix, grade));
  const questions = parseJsonFromResponse(text);
  return questions.map((q: any, i: number) => ({ ...q, id: `q${i + 1}` }));
}

/**
 * Generate THPT 2026 full exam
 */
export async function generateThptExam(year: number = 2026): Promise<{ sections: any[]; questions: any[] }> {
  const text = await callGemini(buildThptPrompt(year));
  const parsed = parseJsonFromResponse(text);

  const sections = parsed.sections || [];
  const allQuestions: any[] = [];
  let idx = 1;

  sections.forEach((sec: any) => {
    (sec.questions || []).forEach((q: any) => {
      allQuestions.push({ ...q, id: `q${idx++}`, section: sec.name });
    });
  });

  return { sections, questions: allQuestions };
}

/**
 * Generate single-lesson exam (quick)
 */
export async function generateLessonExam(
  lessonId: string,
  lessonName: string,
  grade: string,
  numQuestions: number = 15
): Promise<any[]> {
  return generateExamQuestions({
    grade,
    lesson_id: lessonId,
    lesson_name: lessonName,
    num_questions: numQuestions,
    exam_type: 'bai',
    difficulty_mix: { nhan_biet: 30, thong_hieu: 40, van_dung: 20, van_dung_cao: 10 }
  });
}
