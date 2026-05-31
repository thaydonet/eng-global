# Học Tiếng Anh - Global Success

Ứng dụng web học tập trực tuyến cho môn Tiếng Anh từ lớp 6 đến lớp 12 (chương trình Global Success), được xây dựng bằng Astro và Supabase.

## Tính năng

- 📚 **Bài học Tiếng Anh**: Nội dung từ vựng, ngữ pháp, và bài tập theo chương trình Global Success
- ✍️ **Hệ thống Quiz**: Bài tập trắc nghiệm để kiểm tra kiến thức Tiếng Anh
- 📝 **Blog**: Chia sẻ kiến thức, kinh nghiệm học Tiếng Anh
- 💾 **Quản lý Database**: Sử dụng Supabase để lưu trữ dữ liệu
- 🎨 **Giao diện đẹp**: Thiết kế responsive với Tailwind CSS, màu xanh dương chủ đạo

## Công nghệ sử dụng

- **Framework**: Astro
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Cài đặt

1. Clone repository:
\`\`\`bash
git clone <repository-url>
cd lms-astro
\`\`\`

2. Cài đặt dependencies:
\`\`\`bash
npm install
\`\`\`

3. Cấu hình Supabase:
   - Tạo project trên [Supabase](https://supabase.com)
   - Copy file \`.env.example\` thành \`.env\`
   - Điền thông tin Supabase vào file \`.env\`:
     \`\`\`
     PUBLIC_SUPABASE_URL=your_supabase_url
     PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     \`\`\`

4. Tạo database schema:
   - Mở Supabase SQL Editor
   - Chạy script trong file \`supabase-schema.sql\`

5. Chạy development server:
\`\`\`bash
npm run dev
\`\`\`

6. Mở trình duyệt tại \`http://localhost:4321\`

## Cấu trúc thư mục

\`\`\`
lms-astro/
├── src/
│   ├── components/        # Components tái sử dụng
│   ├── data/             # Dữ liệu JSON
│   │   ├── lessons.json  # Nội dung bài học
│   │   ├── quizzes.json  # Câu hỏi quiz
│   │   └── blog.json     # Bài viết blog
│   ├── layouts/          # Layout templates
│   ├── lib/              # Utilities và helpers
│   │   ├── supabase.ts   # Supabase client
│   │   └── types.ts      # TypeScript types
│   └── pages/            # Các trang của website
│       ├── index.astro        # Trang chủ
│       ├── lessons/           # Danh sách và chi tiết bài học
│       ├── quiz/              # Các trang quiz
│       └── blog/              # Blog
├── supabase-schema.sql   # Database schema
└── package.json
\`\`\`

## Scripts

- \`npm run dev\`: Chạy development server
- \`npm run build\`: Build cho production
- \`npm run preview\`: Preview production build

## Nội dung học

### Lớp 6-12: Chương trình Global Success
- Từ vựng theo chủ đề
- Ngữ pháp cơ bản đến nâng cao
- Kỹ năng nghe, nói, đọc, viết
- Bài tập trắc nghiệm và tự luận

## Tùy chỉnh nội dung

### Thêm bài học mới
Chỉnh sửa file \`src/data/lessons.json\`:

\`\`\`json
{
  "id": "lesson-id",
  "title": "Tên bài học",
  "chapter": 1,
  "description": "Mô tả",
  "duration": 45,
  "difficulty": "medium",
  "content": {
    "theory": ["..."],
    "formulas": [...],
    "examples": [...]
  }
}
\`\`\`

### Thêm quiz
Chỉnh sửa file \`src/data/quizzes.json\`:

\`\`\`json
{
  "id": "quiz-id",
  "lessonId": "lesson-id",
  "title": "Tên quiz",
  "questions": [...]
}
\`\`\`

### Thêm blog post
Chỉnh sửa file \`src/data/blog.json\`:

\`\`\`json
{
  "id": "blog-id",
  "title": "Tiêu đề",
  "slug": "url-slug",
  "excerpt": "Tóm tắt",
  "content": "Nội dung...",
  "author": "Tác giả",
  "publishedAt": "2024-01-01T00:00:00Z",
  "tags": ["tag1", "tag2"]
}
\`\`\`

## Deploy

Bạn có thể deploy lên:
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

## License

MIT

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo pull request hoặc issue nếu bạn có ý tưởng cải thiện.
