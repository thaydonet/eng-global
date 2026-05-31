-- ==============================================================================
-- CHÚ Ý QUAN TRỌNG: 
-- Chạy toàn bộ file SQL này trong Supabase SQL Editor.
-- Nó sẽ tự động tạo bảng profiles (quản lý user), exam_papers (đề thi), 
-- exam_results (kết quả điểm số) và thiết lập bảo mật RLS đầy đủ.
-- ==============================================================================

-- Bật extension nếu chưa có
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. BẢNG PROFILES (Quản lý User & Phân quyền)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('admin', 'teacher', 'student')) default 'student',
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Mọi người đều có thể xem profiles" on public.profiles
  for select using (true);

create policy "Người dùng có thể tự cập nhật profile của mình" on public.profiles
  for update using (auth.uid() = id);

-- Trigger tự động tạo profile khi user đăng ký (từ Auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    coalesce(new.raw_user_meta_data->>'role', 'student') -- mặc định là student nếu không truyền
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==============================================================================
-- 2. BẢNG EXAM_PAPERS (Lưu trữ Đề thi)
-- ==============================================================================
create table if not exists public.exam_papers (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  grade integer,
  duration_minutes integer not null,
  exam_type text not null, -- 'bai', 'lop', 'hoc-ky', 'thpt', 'ma-tran'
  subject text default 'tieng-anh',
  semester integer,
  questions jsonb not null, -- Mảng chứa danh sách câu hỏi
  is_published boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index tìm kiếm
create index if not exists exam_papers_slug_idx on public.exam_papers (slug);
create index if not exists exam_papers_type_idx on public.exam_papers (exam_type);

-- Bật RLS
alter table public.exam_papers enable row level security;

-- Policies
create policy "Ai cũng xem được đề thi đã xuất bản" on public.exam_papers
  for select using (is_published = true);

create policy "Admin/Giáo viên xem được mọi đề thi" on public.exam_papers
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher'))
  );

create policy "Admin/Giáo viên được tạo đề thi mới" on public.exam_papers
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher'))
  );

create policy "Người tạo hoặc Admin có quyền sửa đề thi" on public.exam_papers
  for update using (
    auth.uid() = created_by or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Người tạo hoặc Admin có quyền xóa đề thi" on public.exam_papers
  for delete using (
    auth.uid() = created_by or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ==============================================================================
-- 3. BẢNG EXAM_RESULTS (Lưu trữ Kết quả / Điểm số làm bài)
-- ==============================================================================
create table if not exists public.exam_results (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid not null references public.exam_papers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null, -- Chi tiết câu trả lời
  score numeric not null, -- Điểm số (VD: 8.5)
  time_spent integer not null, -- Thời gian làm bài (giây)
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index tìm kiếm nhanh
create index if not exists exam_results_exam_id_idx on public.exam_results (exam_id);
create index if not exists exam_results_user_id_idx on public.exam_results (user_id);

-- Bật RLS
alter table public.exam_results enable row level security;

-- Policies
create policy "Người dùng có thể nộp bài (lưu kết quả) của chính mình" on public.exam_results
  for insert with check (auth.uid() = user_id);

create policy "Người dùng chỉ xem được điểm của bản thân" on public.exam_results
  for select using (auth.uid() = user_id);

create policy "Admin/Giáo viên xem được điểm của tất cả học sinh" on public.exam_results
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher'))
  );
