import React, { useEffect, useState } from 'react';
import type { Lesson } from '@/lib/lessons';
import { supabase } from '@/lib/supabase';
import { getExamTypeLabel, getExamTypeColor, type ExamPaper } from '@/lib/de-thi';

interface NewInfoSectionProps {
    latestLessons: Lesson[];
}

export default function NewInfoSection({ latestLessons }: NewInfoSectionProps) {
    const [latestExams, setLatestExams] = useState<ExamPaper[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const { data, error } = await supabase
                    .from('exam_papers')
                    .select('*')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (!error && data) {
                    setLatestExams(data as ExamPaper[]);
                }
            } catch (error) {
                console.error('Error fetching exams:', error);
            } finally {
                setLoadingExams(false);
            }
        };
        fetchExams();
    }, []);

    const typeColorMap: Record<string, string> = {
        blue:   'linear-gradient(135deg,#3b82f6,#06b6d4)',
        green:  'linear-gradient(135deg,#10b981,#34d399)',
        orange: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
        red:    'linear-gradient(135deg,#ef4444,#f87171)',
        purple: 'linear-gradient(135deg,#8b5cf6,#c084fc)',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold mb-4">
                    📰 Hệ thống học tập
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 dark:text-white mb-4">
                    Nội dung{' '}
                    <span style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        mới nhất
                    </span>
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Kiểm tra trình độ với Đề thi mới nhất và học tập cùng bài học từ C3 Global Success.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Exams */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-7 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Đề thi mới cập nhật
                            </h3>
                        </div>
                        <a
                            href="/de-thi"
                            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                        >
                            Xem tất cả đề
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>

                    <div className="space-y-4">
                        {loadingExams ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl animate-pulse">
                                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : latestExams.length > 0 ? (
                            latestExams.map((exam, idx) => {
                                const qCount = exam.questions?.length || 0;
                                const colorKey = getExamTypeColor(exam.exam_type);
                                return (
                                <a
                                    key={exam.id}
                                    href={`/de-thi/${exam.slug}`}
                                    className="group flex gap-4 items-start p-4 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white font-black shadow-sm"
                                         style={{ background: typeColorMap[colorKey] || typeColorMap.purple }}>
                                        <span className="text-xl">📝</span>
                                        <span className="text-[10px] uppercase opacity-90 tracking-wider">THI</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-1.5 text-sm leading-snug">
                                            {exam.title}
                                        </h4>
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
                                            <span className="font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                                {getExamTypeLabel(exam.exam_type)}
                                            </span>
                                            <span className="flex items-center gap-1">⏱ {exam.duration_minutes} phút</span>
                                            <span className="flex items-center gap-1">🎯 {qCount} câu</span>
                                        </div>
                                    </div>
                                </a>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <div className="text-4xl mb-3">📝</div>
                                <p className="font-medium text-sm">Chưa có đề thi nào trên hệ thống.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Latest lessons */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-7 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Bài học mới cập nhật
                            </h3>
                        </div>
                        <a
                            href="/lessons"
                            className="flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors group"
                        >
                            Xem bài học
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>

                    <div className="space-y-4">
                        {latestLessons.map((lesson, idx) => (
                            <a
                                key={lesson.id}
                                href={`/lessons/${lesson.id}`}
                                className="group flex gap-4 items-start p-4 bg-white dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                {lesson.thumbnail_url ? (
                                    <img
                                        src={lesson.thumbnail_url}
                                        alt={lesson.name}
                                        className="w-16 h-16 object-cover rounded-xl shadow-sm flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white font-black shadow-sm"
                                        style={{ background: idx % 3 === 0 ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : idx % 3 === 1 ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
                                        <span className="text-xl">📚</span>
                                        <span className="text-[10px] uppercase opacity-90 tracking-wider">HỌC</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2 mb-1.5 text-sm leading-snug">
                                        {lesson.name}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-medium">
                                            {lesson.conf_subject}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            lesson.difficulty_level === 'easy'
                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                : lesson.difficulty_level === 'medium'
                                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                        }`}>
                                            {lesson.difficulty_level === 'easy' ? '🟢 Cơ bản'
                                                : lesson.difficulty_level === 'medium' ? '🟡 Vận dụng'
                                                : '🔴 Nâng cao'}
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
