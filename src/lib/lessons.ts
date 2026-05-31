import * as fs from 'fs';
import * as path from 'path';

export interface LessonExample {
  question: string;
  answer: string; // Changed from 'solution' to 'answer'
}

export interface ProblemType {
  id: string;
  name: string;
  method: string;
  examples: LessonExample[];
}

export interface TheorySection {
  heading: string;
  content: string;
}

// Exercise types
export interface MCQExercise {
  id: string;
  type: 'mcq';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface EssayExercise {
  id: string;
  type: 'essay';
  question: string;
  answer_guide: string;
  explanation: string;
}

export type Exercise = MCQExercise | EssayExercise;

export interface LessonContent {
  theory: {
    title: string;
    sections: TheorySection[];
  };
  problemTypes?: ProblemType[];
  exercises?: Exercise[];
}

export interface SubLesson {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  order: number;
  file?: string; // Optional: path to separate JSON file
  content?: LessonContent; // Optional: inline content or loaded from file
}

export interface Lesson {
  id: string;
  name: string;
  slug: string;
  chapter: string;
  chapter_id: string;
  lesson_id: number;
  description: string;
  duration_minutes: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  thumbnail_url?: string;
  has_sub_lessons?: boolean;
  sub_lessons?: SubLesson[];
  content?: LessonContent;
  // Added fields for context
  conf_subject?: string;
  conf_grade?: number;
  subject_slug?: string;
  lastModified?: string; // ISO string
}

export interface LessonFile {
  subject: string;
  subject_id: number;
  lessons: Lesson[];
}

export interface LessonsByGrade {
  grade: string;
  gradeId: number;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
}

export interface Grade {
  id: string;
  name: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');

export function getSubjects(): Subject[] {
  try {
    const data = fs.readFileSync(path.join(CONTENT_DIR, 'subjects.json'), 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function getGrades(): Grade[] {
  try {
    const data = fs.readFileSync(path.join(CONTENT_DIR, 'grades.json'), 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  try {
    if (!fs.existsSync(dir)) return [];

    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursively(filePath));
      } else {
        if (file.endsWith('.json') && !file.includes('subjects.json') && !file.includes('grades.json') && !file.includes('index') && !file.includes('TEMPLATE')) {
          results.push(filePath);
        }
      }
    });
  } catch (e) {
    console.warn(`Error reading directory ${dir}:`, e);
  }
  return results;
}

export function getAllLessons(): Lesson[] {
  const files = getFilesRecursively(CONTENT_DIR);
  const allLessons: Lesson[] = [];
  const subjects = getSubjects();

  files.forEach(filePath => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lessonFile: LessonFile = JSON.parse(fileContent);

      if (lessonFile.lessons && Array.isArray(lessonFile.lessons)) {
        // Extract subject id from path (e.g. .../content/ly/10/...)
        // Assumes structure src/content/{subject_id}/{grade}/file.json
        const relativePath = path.relative(CONTENT_DIR, filePath);
        const pathParts = relativePath.split(path.sep);

        let subjectSlug = '';
        let subjectName = '';

        if (pathParts.length >= 2) {
          const subjectId = pathParts[0];
          const subject = subjects.find(s => s.id === subjectId);
          if (subject) {
            subjectSlug = subject.slug;
            subjectName = subject.name;
          }
        }

        const enrichedLessons = lessonFile.lessons
          .filter(l => l.is_published)
          .map(l => {
            // Load sub-lesson content from separate files if specified
            if (l.has_sub_lessons && l.sub_lessons) {
              l.sub_lessons = l.sub_lessons.map(sl => {
                if (sl.file && !sl.content) {
                  // Load content from separate file
                  const subLessonPath = path.join(path.dirname(filePath), sl.file);
                  try {
                    if (fs.existsSync(subLessonPath)) {
                      const subLessonContent = fs.readFileSync(subLessonPath, 'utf-8');
                      const subLessonData = JSON.parse(subLessonContent);
                      return { ...sl, content: subLessonData.content };
                    }
                  } catch (error) {
                    console.warn(`Error loading sub-lesson file ${subLessonPath}:`, error);
                  }
                }
                return sl;
              });
            }

            return {
              ...l,
              // Inject context
              conf_subject: subjectName || lessonFile.subject, // Fallback to file's subject string
              slug: subjectSlug,
              subject_slug: subjectSlug,
              lastModified: fs.statSync(filePath).mtime.toISOString()
            };
          });

        allLessons.push(...enrichedLessons);
      }
    } catch (error) {
      console.warn(`Lỗi khi đọc file ${filePath}:`, error instanceof Error ? error.message : error);
    }
  });

  return allLessons.sort((a, b) => a.lesson_id - b.lesson_id);
}

export function getLatestLessons(limit: number = 5): Lesson[] {
  const allLessons = getAllLessons();
  return allLessons
    .sort((a, b) => {
      const timeA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const timeB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, limit);
}

export function getLessonsByGrade(): LessonsByGrade[] {
  const files = getFilesRecursively(CONTENT_DIR);
  const gradeMap = new Map<string, LessonsByGrade>();

  files.forEach(filePath => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lessonFile: LessonFile = JSON.parse(fileContent);

      if (!gradeMap.has(lessonFile.subject)) {
        gradeMap.set(lessonFile.subject, {
          grade: lessonFile.subject,
          gradeId: lessonFile.subject_id,
          lessons: []
        });
      }

      const grade = gradeMap.get(lessonFile.subject)!;
      if (lessonFile.lessons && Array.isArray(lessonFile.lessons)) {
        grade.lessons.push(...lessonFile.lessons.filter(l => l.is_published));
      }
    } catch (error) {
      console.warn(`Error reading file ${filePath}:`, error instanceof Error ? error.message : error);
    }
  });

  const result = Array.from(gradeMap.values());

  // Sort lessons within each grade
  result.forEach(grade => {
    grade.lessons.sort((a, b) => a.lesson_id - b.lesson_id);
  });

  // Sort grades
  return result.sort((a, b) => a.gradeId - b.gradeId);
}

export function getLessonById(id: string): Lesson | undefined {
  const lessons = getAllLessons();
  return lessons.find(lesson => lesson.id === id);
}

export interface AdjacentLessons {
  previous: Lesson | null;
  next: Lesson | null;
}

export function getAdjacentLessons(lessonId: string): AdjacentLessons {
  const allLessons = getAllLessons();
  const currentLesson = allLessons.find(l => l.id === lessonId);

  if (!currentLesson) {
    return { previous: null, next: null };
  }

  // Get all lessons from the same chapter (same chapter_id)
  // And ideally same subject/grade, but relying on unique chapter keys/ids for now
  // Or better, filter by same subject_id available in the parent file context, 
  // but since we flatten, we check chapter_id.
  const sameChapterLessons = allLessons.filter(l =>
    l.chapter_id === currentLesson.chapter_id
  );

  // Sort by lesson_id to maintain order within the chapter
  const sortedLessons = sameChapterLessons.sort((a, b) => a.lesson_id - b.lesson_id);

  const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);

  return {
    previous: currentIndex > 0 ? sortedLessons[currentIndex - 1] : null,
    next: currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null,
  };
}

export function getLessonsByChapter(chapterId: string): Lesson[] {
  const allLessons = getAllLessons();
  return allLessons
    .filter(l => l.chapter_id === chapterId)
    .sort((a, b) => a.lesson_id - b.lesson_id);
}

export interface SubjectGradeCombination {
  slug: string;
  subject: Subject;
  grade: Grade;
  lessonCount: number;
}

export function parseSubjectGrade(slug: string): { subjectId: string; gradeId: string } | null {
  // Parse slugs like "toan-10", "vat-ly-11", "tieng-anh-12"
  const subjects = getSubjects();
  const grades = getGrades();

  // Try to match against known subjects
  for (const subject of subjects) {
    // Check if slug starts with subject slug
    if (slug.startsWith(subject.slug + '-')) {
      const gradeId = slug.substring(subject.slug.length + 1);
      const grade = grades.find(g => g.id === gradeId);

      if (grade) {
        return { subjectId: subject.id, gradeId: grade.id };
      }
    }
  }

  return null;
}

export function getSubjectGradeCombinations(): SubjectGradeCombination[] {
  const subjects = getSubjects();
  const grades = getGrades();
  const allLessons = getAllLessons();
  const combinations: SubjectGradeCombination[] = [];

  subjects.forEach(subject => {
    grades.forEach(grade => {
      // Count lessons for this subject-grade combination
      // Lesson IDs follow pattern: subjectId + gradeId + "-bai-..." (e.g., "toan10-bai-01")
      const prefix = subject.id + grade.id;
      const lessonCount = allLessons.filter(lesson =>
        lesson.id.startsWith(prefix)
      ).length;

      if (lessonCount > 0) {
        combinations.push({
          slug: `${subject.slug}-${grade.id}`,
          subject,
          grade,
          lessonCount
        });
      }
    });
  });

  return combinations;
}

export function getLessonsBySubjectAndGrade(subjectId: string, gradeId: string): Lesson[] {
  const allLessons = getAllLessons();

  // Lesson IDs follow pattern: subjectId + gradeId + "-bai-..." (e.g., "toan10-bai-01")
  const prefix = subjectId + gradeId;

  return allLessons.filter(lesson =>
    lesson.id.startsWith(prefix)
  ).sort((a, b) => a.lesson_id - b.lesson_id);
}
