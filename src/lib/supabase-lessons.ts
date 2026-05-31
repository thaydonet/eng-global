import { supabase } from './supabase';

export interface DBLesson {
    id: string;
    title: string;
    slug: string;
    chapter_id: string;
    description: string;
    is_published: boolean;
    created_at: string;
}

/**
 * Lấy danh sách tất cả bài học từ Supabase.
 * Hàm này tương đương với getAllLessons() nhưng dùng DB thay vì file JSON.
 */
export async function getLessonsFromDB() {
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('is_published', true) // Chỉ lấy bài đã publish
            .order('chapter_id', { ascending: true }); // Sắp xếp theo chapter

        if (error) {
            console.error('Lỗi khi lấy lessons từ DB:', error.message);
            return [];
        }

        return data as DBLesson[];
    } catch (e) {
        console.error('Lỗi không mong muốn:', e);
        return [];
    }
}

/**
 * Lấy danh sách Users (Profiles) - Chỉ dành cho Admin
 */
export async function getProfilesFromDB() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10); // Lấy 10 người mới nhất

        if (error) {
            console.error('Lỗi khi lấy profiles:', error.message);
            return [];
        }

        return data;
    } catch (e) {
        return [];
    }
}

/**
 * Ví dụ insert một bài học mới (Demo)
 */
export async function createDemoLesson() {
    const newLesson = {
        id: `demo-${Date.now()}`,
        title: 'Bài học Demo từ Code',
        slug: 'bai-hoc-demo',
        chapter_id: 99,
        description: 'Được tạo từ hàm createDemoLesson',
        is_published: true
    };

    const { data, error } = await supabase
        .from('lessons')
        .insert([newLesson])
        .select();

    return { data, error };
}
