/**
 * Hệ thống Đề thi — Types & Supabase CRUD
 */
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────
export type ExamType = 'bai' | 'lop' | 'hoc-ky' | 'thpt' | 'ma-tran';
export type DifficultyLevel = 'nhan-biet' | 'thong-hieu' | 'van-dung' | 'van-dung-cao';
export type QuestionType = 'mcq' | 'msq' | 'sa' | 'reading' | 'listening' | 'essay';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  question?: string;
  question_text?: string;
  options?: string[];
  correct?: number | number[] | string;
  explanation?: string;
  difficulty?: DifficultyLevel;
  skill?: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking';
  // Reading specific
  passage?: string;
  questions?: Array<{
    question: string;
    options: string[];
    correct: number;
    explanation?: string;
  }>;
  // Listening specific
  audio_url?: string;
  transcript?: string;
  // Essay specific
  answer_guide?: string;
}

export interface MatrixRow {
  skill: string;
  topic: string;
  nhan_biet: number;
  thong_hieu: number;
  van_dung: number;
  van_dung_cao: number;
}

export interface MatrixConfig {
  grade: string;
  semester?: number;
  total_questions: number;
  duration_minutes: number;
  rows: MatrixRow[];
}

export interface AIConfig {
  grade: string;
  lesson_id?: string;
  num_questions: number;
  difficulty_mix: {
    nhan_biet: number;
    thong_hieu: number;
    van_dung: number;
    van_dung_cao: number;
  };
  skills: string[];
  custom_prompt?: string;
}

export interface ExamPaper {
  id: string;
  title: string;
  slug: string;
  exam_type: ExamType;
  grade?: string;
  subject: string;
  lesson_id?: string;
  semester?: number;
  duration_minutes: number;
  questions: ExamQuestion[];
  matrix_config?: MatrixConfig;
  ai_config?: AIConfig;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamResult {
  id?: string;
  exam_id: string;
  user_id?: string;
  student_name?: string;
  answers: any[];
  score: number;
  max_score: number;
  time_taken: number;
  completed_at?: string;
}

// ─── Slug helper ────────────────────────────────────────────
export function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${slug}-${timestamp}`;
}

// ─── CRUD Functions ─────────────────────────────────────────

/**
 * Get list of published exams
 */
export async function getPublishedExams(options?: {
  grade?: string;
  exam_type?: ExamType;
  semester?: number;
  limit?: number;
}): Promise<ExamPaper[]> {
  let query = supabase
    .from('exam_papers')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (options?.grade) query = query.eq('grade', options.grade);
  if (options?.exam_type) query = query.eq('exam_type', options.exam_type);
  if (options?.semester) query = query.eq('semester', options.semester);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching exams:', error);
    return [];
  }
  return (data || []) as ExamPaper[];
}

/**
 * Get all exams by current user
 */
export async function getMyExams(): Promise<ExamPaper[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('exam_papers')
    .select('*')
    .eq('created_by', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my exams:', error);
    return [];
  }
  return (data || []) as ExamPaper[];
}

/**
 * Get single exam by slug
 */
export async function getExamBySlug(slug: string): Promise<ExamPaper | null> {
  const { data, error } = await supabase
    .from('exam_papers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching exam:', error);
    return null;
  }
  return data as ExamPaper;
}

/**
 * Get exam by ID
 */
export async function getExamById(id: string): Promise<ExamPaper | null> {
  const { data, error } = await supabase
    .from('exam_papers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as ExamPaper;
}

/**
 * Create new exam
 */
export async function createExam(exam: Omit<ExamPaper, 'id' | 'created_at' | 'updated_at'>): Promise<ExamPaper | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Chưa đăng nhập');

  const { data, error } = await supabase
    .from('exam_papers')
    .insert({
      ...exam,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ExamPaper;
}

/**
 * Update exam
 */
export async function updateExam(id: string, updates: Partial<ExamPaper>): Promise<ExamPaper | null> {
  const { data, error } = await supabase
    .from('exam_papers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ExamPaper;
}

/**
 * Delete exam
 */
export async function deleteExam(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('exam_papers')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Publish/Unpublish exam
 */
export async function toggleExamPublish(id: string, publish: boolean): Promise<void> {
  const { error } = await supabase
    .from('exam_papers')
    .update({ is_published: publish })
    .eq('id', id);
  if (error) throw error;
}

// ─── Results ────────────────────────────────────────────────

/**
 * Submit exam result
 */
export async function submitExamResult(result: Omit<ExamResult, 'id' | 'completed_at'>): Promise<ExamResult | null> {
  const { data: { session } } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from('exam_results')
    .insert({
      ...result,
      user_id: session?.user.id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ExamResult;
}

/**
 * Get results for an exam (admin/teacher)
 */
export async function getExamResults(examId: string): Promise<ExamResult[]> {
  const { data, error } = await supabase
    .from('exam_results')
    .select('*')
    .eq('exam_id', examId)
    .order('score', { ascending: false });

  if (error) return [];
  return (data || []) as ExamResult[];
}

/**
 * Get my result for an exam
 */
export async function getMyExamResult(examId: string): Promise<ExamResult | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('exam_results')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', session.user.id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as ExamResult;
}

// ─── Helpers ────────────────────────────────────────────────

export function getExamTypeLabel(type: ExamType): string {
  const labels: Record<ExamType, string> = {
    'bai': 'Theo bài học',
    'lop': 'Tổng hợp theo lớp',
    'hoc-ky': 'Kiểm tra học kỳ',
    'thpt': 'Thi TN THPT 2026',
    'ma-tran': 'Theo ma trận',
  };
  return labels[type] || type;
}

export function getExamTypeColor(type: ExamType): string {
  const colors: Record<ExamType, string> = {
    'bai': 'blue',
    'lop': 'green',
    'hoc-ky': 'orange',
    'thpt': 'red',
    'ma-tran': 'purple',
  };
  return colors[type] || 'gray';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}p` : `${h} giờ`;
}

export function countScoredQuestions(questions: ExamQuestion[]): number {
  return questions.reduce((total, q) => {
    if (q.type === 'reading' && q.questions) return total + q.questions.length;
    if (q.type === 'listening' && q.questions) return total + q.questions.length;
    if (q.type === 'essay') return total; // not auto-scored
    return total + 1;
  }, 0);
}
