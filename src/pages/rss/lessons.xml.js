import rss from '@astrojs/rss';
import { getAllLessons } from '../../lib/lessons';

export async function GET(context) {
  const lessons = getAllLessons();

  return rss({
    title: 'LMS Toán - Bài học mới',
    description: 'Các bài học Toán mới nhất từ lớp 10 đến 12 với nội dung chất lượng cao',
    site: context.site,
    items: lessons.map((lesson) => ({
      title: lesson.name,
      description: lesson.description,
      link: `/lessons/${lesson.id}`,
      pubDate: new Date(),
      categories: [lesson.chapter, lesson.difficulty_level],
      customData: `
        <chapter>${lesson.chapter}</chapter>
        <difficulty>${lesson.difficulty_level === 'easy' ? 'Dễ' : lesson.difficulty_level === 'medium' ? 'Trung bình' : 'Khó'}</difficulty>
        <duration>${lesson.duration_minutes} phút</duration>
      `,
    })),
    customData: `
      <language>vi-VN</language>
      <category>Education</category>
      <category>Mathematics</category>
    `,
  });
}
