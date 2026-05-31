import { useState, useEffect } from 'react';
import { getAvailableCompetitions, getUserCompetitionHistory, type Competition } from '@/lib/competition';
import { supabase } from '@/lib/supabase';

interface CompetitionListUserProps {
    userId: string;
}

export default function CompetitionListUser({ userId }: CompetitionListUserProps) {
    const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
    const [availableCompetitions, setAvailableCompetitions] = useState<Competition[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();

        // Subscribe to changes if needed, but simple fetch is fine for now
        const subscription = supabase
            .channel('public:competitions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    const fetchData = async () => {
        setLoading(true);
        const [available, userHistory] = await Promise.all([
            getAvailableCompetitions(),
            getUserCompetitionHistory(userId)
        ]);
        setAvailableCompetitions(available);
        setHistory(userHistory);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (comp: Competition) => {
        let status = 'pending';
        let label = 'Sắp diễn ra';
        let color = 'bg-yellow-100 text-yellow-800';

        if (comp.status === 'completed') {
            status = 'completed';
            label = 'Đã kết thúc';
            color = 'bg-gray-100 text-gray-800';
        } else if (comp.actual_start_time) {
            const startTime = new Date(comp.actual_start_time).getTime();
            const durationMs = comp.questions.length * comp.time_limit_per_question * 1000;
            if (Date.now() > startTime + durationMs) {
                status = 'completed';
                label = 'Đã kết thúc';
                color = 'bg-gray-100 text-gray-800';
            } else {
                status = 'in_progress';
                label = 'Đang diễn ra';
                color = 'bg-green-100 text-green-800 animate-pulse';
            }
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
                {label}
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🏆 Khu vực Thi đấu</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'available'
                                ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        Đang diễn ra
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history'
                                ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        Lịch sử
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {activeTab === 'available' && (
                        <>
                            {availableCompetitions.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Hiện chưa có cuộc thi nào đang diễn ra.</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {availableCompetitions.map((comp) => (
                                        <div key={comp.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800/50">
                                            <div className="flex justify-between items-start mb-2">
                                                {getStatusBadge(comp)}
                                                <span className="text-xs text-gray-400 font-mono">#{comp.code}</span>
                                            </div>
                                            <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2" title={comp.title}>{comp.title}</h4>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                                                <p>🕒 {comp.time_limit_per_question}s / câu</p>
                                                <p>❓ {comp.questions.length} câu hỏi</p>
                                            </div>
                                            <a
                                                href={`/thi-dau?code=${comp.code}`}
                                                className="block w-full text-center py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                                            >
                                                Tham gia ngay 🚀
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'history' && (
                        <>
                            {history.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Bạn chưa tham gia cuộc thi nào.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 text-sm">
                                                <th className="pb-3 font-medium">Cuộc thi</th>
                                                <th className="pb-3 font-medium">Thời gian</th>
                                                <th className="pb-3 font-medium text-center">Điểm số</th>
                                                <th className="pb-3 font-medium text-right">Chi tiết</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {history.map((record) => (
                                                <tr key={record.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="py-3 pr-4">
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {record.competitions?.title || 'Cuộc thi không xác định'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Mã: {record.competitions?.code}</p>
                                                    </td>
                                                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {formatDate(record.joined_at)}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                                                            {record.score}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <a
                                                            href={`/thi-dau?code=${record.competitions?.code}`}
                                                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                                        >
                                                            Xem lại →
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
