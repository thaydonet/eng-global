import rss from '@astrojs/rss';
import { getAllLessons } from '../lib/lessons';

export async function GET(context) {
  const lessons = getAllLessons();

  // Combine lessons
  const items = [
    // Lessons
    ...lessons.map((lesson) => ({
      title: lesson.name,
      description: lesson.description,
      link: `/lessons/${lesson.id}`,
      pubDate: new Date(),
      categories: [lesson.chapter, lesson.difficulty_level],
      customData: `
        <difficulty>${lesson.difficulty_level}</difficulty>
        <duration>${lesson.duration_minutes} phút</duration>
      `,
    })),
  ];

  // Sort by date (newest first)
  items.sort((a, b) => b.pubDate - a.pubDate);

  return rss({
    title: 'Học Tâp AI - Học tập thông minh',
    description: 'Hệ thống học tập trực tuyến với hàng trăm bài học chất lượng cao về Toán học từ lớp 10 đến 12',
    site: context.site,
    items: items,
    customData: `
      <language>vi-VN</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>Astro RSS Feed</generator>
      <webMaster>admin@hoc.io.vn (Học Tập AI)</webMaster>
      <copyright>Copyright ${new Date().getFullYear()} Học Tập AI. All rights reserved.</copyright>
      <image>
        <url>https://hoc.io.vn/logo.png</url>
        <title>Học Tập AI</title>
        <link>https://hoc.io.vn</link>
      </image>
    `,
    stylesheet: '/rss-styles.xsl',
  });
}
