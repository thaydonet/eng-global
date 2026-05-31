import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureValidSession } from '@/lib/supabase';
import {
    deleteCompetition,
    toggleCompetitionStatus,
    resetCompetitionResults,
    reactivateCompetition,
    startCompetition,
    type Competition
} from '@/lib/competition';
import CompetitionEditor from './CompetitionEditor';

interface CompetitionWithStats extends Competition {
    participant_count?: number;
}

export default function CompetitionList() {
    const [competitions, setCompetitions] = useState<CompetitionWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null); // For delete/reset/restart actions

    // Config for editing
    const [editingComp, setEditingComp] = useState<Competition | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    // User ID for editor props - effectively we can get it from session, 
    // but CompetitionList is used in Dashboard where session is available.
    // For simplicity, we'll fetch session here if needed or assume this component is used correctly.
    // Ideally pass userId as prop, but keeping it simple for now.
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        fetchCompetitions();
        fetchUser();

        // Auto-refresh every 5s so participant counts stay live
        const interval = setInterval(() => {
            fetchCompetitions();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUserId(session.user.id);
        }
    };

    const fetchCompetitions = async () => {
        try {
            setLoading(true);

            // Fetch all competitions
            const { data: competitionsData, error: competitionsError } = await supabase
                .from('competitions')
                .select('*')
                .order('created_at', { ascending: false });

            if (competitionsError) throw competitionsError;

            if (!competitionsData) {
                setCompetitions([]);
                return;
            }

            // Fetch participant counts for each competition
            const competitionsWithCounts = await Promise.all(
                competitionsData.map(async (comp) => {
                    const { count } = await supabase
                        .from('competition_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('competition_id', comp.id);

                    return {
                        ...comp,
                        participant_count: count || 0
                    };
                })
            );

            setCompetitions(competitionsWithCounts);
        } catch (err: any) {
            if (err?.code !== 'PGRST303') {
                console.error('Error fetching competitions:', err);
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (competitionId: string, currentStatus: boolean) => {
        try {
            await ensureValidSession();
            const { error } = await toggleCompetitionStatus(competitionId, !currentStatus);
            if (error) throw error;

            // Update local state
            setCompetitions(competitions.map(comp =>
                comp.id === competitionId ? { ...comp, is_active: !currentStatus } : comp
            ));
        } catch (err: any) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleDelete = async (competitionId: string, title: string) => {
        if (!confirm(`Bạn có chắc muốn xóa cuộc thi "${title}"?\n\nThao tác này sẽ xóa tất cả dữ liệu liên quan và không thể hoàn tác.`)) {
            return;
        }

        try {
            await ensureValidSession();
            setProcessingId(competitionId);
            const { error } = await deleteCompetition(competitionId);
            if (error) throw error;

            // Remove from local state
            setCompetitions(competitions.filter(comp => comp.id !== competitionId));
        } catch (err: any) {
            alert('Lỗi khi xóa: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleResetResults = async (competitionId: string, title: string) => {
        if (!confirm(`Bạn có muốn XÓA TOÀN BỘ KẾT QUẢ của cuộc thi "${title}"?\n\nDữ liệu người tham gia và điểm số sẽ bị mất vĩnh viễn.`)) {
            return;
        }

        try {
            await ensureValidSession();
            setProcessingId(competitionId);
            const { error } = await resetCompetitionResults(competitionId);
            if (error) throw error;

            alert('Đã xóa kết quả thành công!');
            fetchCompetitions(); // Refresh counts
        } catch (err: any) {
            alert('Lỗi khi reset: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleStartNow = async (competitionId: string, title: string) => {
        if (!confirm(`Bắt đầu cuộc thi "${title}" ngay bây giờ?\n\nHọc sinh đang chờ trong phòng sẽ tự động vào thi.`)) {
            return;
        }

        try {
            await ensureValidSession();
            setProcessingId(competitionId);
            const { error } = await startCompetition(competitionId);
            if (error) throw error;

            alert('Đã bắt đầu cuộc thi! Học sinh đang thi.');
            fetchCompetitions();
        } catch (err: any) {
            alert('Lỗi khi bắt đầu: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRestart = async (competitionId: string, title: string) => {
        if (!confirm(`Bạn có muốn BẮT ĐẦU LẠI cuộc thi "${title}"?\n\nThao tác này sẽ tạo phiên thi đấu mới (session). Học sinh cần tham gia lại.`)) {
            return;
        }

        try {
            await ensureValidSession();
            setProcessingId(competitionId);
            const { error } = await reactivateCompetition(competitionId);
            if (error) throw error;

            alert('Đã bắt đầu phiên mới! Học sinh có thể vào thi ngay.');
            fetchCompetitions();
        } catch (err: any) {
            alert('Lỗi khi restart: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleEdit = (comp: Competition) => {
        setEditingComp(comp);
        setShowEditor(true);
    };

    const onEditorClose = () => {
        setShowEditor(false);
        setEditingComp(null);
    };

    const onEditorSuccess = () => {
        // Refresh list
        fetchCompetitions();
        // Don't close immediately to let user see success message, 
        // or close after a delay? The Editor handles its own success state UI.
        // But if user clicks "Close" in editor, onEditorClose is called.
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert(`Đã copy mã: ${code}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                Lỗi: {error}
            </div>
        );
    }

    if (competitions.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <div className="text-4xl mb-4">🏆</div>
                <p className="text-gray-600 font-semibold mb-2">Chưa có cuộc thi nào</p>
                <p className="text-sm text-gray-500">Tạo cuộc thi đầu tiên để bắt đầu!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showEditor && (
                <CompetitionEditor
                    onClose={onEditorClose}
                    userId={userId}
                    editingCompetition={editingComp}
                    onSuccess={onEditorSuccess}
                />
            )}

            {competitions.map((comp) => (
                <div
                    key={comp.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                >
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-800">{comp.title}</h3>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${comp.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {comp.is_active ? '🟢 Active' : '⚪ Inactive'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <button
                                    onClick={() => copyCode(comp.code)}
                                    className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-mono font-bold"
                                    title="Click để copy"
                                >
                                    📋 {comp.code}
                                </button>
                                <span>👥 {comp.participant_count} người tham gia</span>
                                <span>⏱️ {comp.time_limit_per_question}s/câu</span>
                                <span>📝 {comp.questions?.length || 0} câu hỏi</span>
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                Tạo: {new Date(comp.created_at).toLocaleString('vi-VN')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">

                            {/* START NOW — only when active + pending (not started yet) */}
                            {comp.is_active && !comp.actual_start_time && comp.status !== 'in_progress' && comp.status !== 'completed' && (
                                <button
                                    onClick={() => handleStartNow(comp.id, comp.title)}
                                    disabled={!!processingId}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all shadow-md disabled:opacity-50 animate-pulse"
                                    title="Bắt đầu trận thi cho học sinh đang chờ"
                                >
                                    {processingId === comp.id ? '⏳' : '🚀 Bắt đầu thi ngay'}
                                </button>
                            )}

                            {/* Status badge */}
                            {comp.is_active && (
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${comp.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                    comp.status === 'completed' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {comp.status === 'in_progress' ? '⚡ Đang thi' :
                                        comp.status === 'completed' ? '✅ Xong' :
                                            '⏳ Chờ bắt đầu'}
                                </span>
                            )}

                            {/* Toggle Active */}
                            <button
                                onClick={() => handleToggleActive(comp.id, comp.is_active)}
                                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all border ${comp.is_active
                                    ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    }`}
                                title={comp.is_active ? 'Tạm dừng/Ẩn' : 'Kích hoạt'}
                            >
                                {comp.is_active ? '⏸️ Tạm dừng' : '▶️ Kích hoạt'}
                            </button>

                            {/* Edit */}
                            <button
                                onClick={() => handleEdit(comp)}
                                className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-all"
                            >
                                ✏️ Sửa
                            </button>

                            {/* Restart */}
                            <button
                                onClick={() => handleRestart(comp.id, comp.title)}
                                disabled={!!processingId}
                                className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition-all disabled:opacity-50"
                                title="Tạo phiên thi đấu mới, học sinh làm lại từ đầu"
                            >
                                {processingId === comp.id ? '⏳' : '🔄 Bắt đầu lại'}
                            </button>

                            {/* Reset Stats */}
                            <button
                                onClick={() => handleResetResults(comp.id, comp.title)}
                                disabled={!!processingId}
                                className="px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-semibold text-sm hover:bg-orange-100 transition-all disabled:opacity-50"
                                title="Xóa toàn bộ điểm số cũ"
                            >
                                {processingId === comp.id ? '⏳' : '🧹 Reset điểm'}
                            </button>

                            {/* View */}
                            <a
                                href={`/test-competition?code=${comp.code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all"
                            >
                                👁️ Xem
                            </a>


                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(comp.id, comp.title)}
                                disabled={!!processingId}
                                className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold text-sm hover:bg-red-100 transition-all disabled:opacity-50"
                            >
                                {processingId === comp.id ? '⏳' : '🗑️'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
