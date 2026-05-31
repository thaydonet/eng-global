import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLeaderboardBySession, type Competition, type Participant } from '@/lib/competition';

type LiveParticipant = Participant;

interface CompWithLeaderboard {
    competition: Competition;
    participants: Participant[];
}

export default function CompetitionMonitor() {
    const [activeComps, setActiveComps] = useState<CompWithLeaderboard[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActiveCompetitions = async () => {
        try {
            const { data: comps, error } = await supabase
                .from('competitions')
                .select('*')
                .eq('is_active', true)
                .eq('status', 'in_progress')
                .order('created_at', { ascending: false });

            // Ignore JWT expired silently
            if (error && error.code === 'PGRST303') {
                return;
            }

            if (!comps || comps.length === 0) {
                setActiveComps([]);
                setLoading(false);
                return;
            }

            const withLeaderboards = await Promise.all(
                comps.map(async (comp) => {
                    const participants = await getLeaderboardBySession(comp.id, comp.session_number);
                    return { competition: comp as Competition, participants };
                })
            );

            setActiveComps(withLeaderboards);
            setLoading(false);
        } catch (err: any) {
            // Only log if it's not a JWT expired error
            if (err?.code !== 'PGRST303') {
                console.error("fetchActiveCompetitions error:", err);
            }
        }
    };

    useEffect(() => {
        fetchActiveCompetitions();

        // Refresh every 3s for live updates
        const interval = setInterval(fetchActiveCompetitions, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                Đang kiểm tra cuộc thi đang diễn ra...
            </div>
        );
    }

    if (activeComps.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-2">⚡</div>
                <p className="text-gray-500 font-medium">Chưa có cuộc thi nào đang diễn ra</p>
                <p className="text-xs text-gray-400 mt-1">Khi giáo viên bắt đầu thi, bảng xếp hạng live sẽ hiện ở đây</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activeComps.map(({ competition: comp, participants }) => (
                <div key={comp.id} className="bg-white rounded-2xl shadow-md border border-purple-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-lg">{comp.title}</h3>
                            <p className="text-purple-200 text-sm">Mã: {comp.code} · {comp.questions?.length || 0} câu · {comp.time_limit_per_question}s/câu</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                            <div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
                            <span className="text-white font-bold text-xl">{participants.length}</span>
                            <span className="text-purple-200 text-sm">người</span>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="p-4">
                        {participants.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4">Chưa có học sinh nào trả lời...</p>
                        ) : (
                            <div className="space-y-2">
                                {participants.map((p, index) => {
                                    const answeredCount = Array.isArray(p.answers) ? p.answers.length : 0;
                                    const totalQ = comp.questions?.length || 1;
                                    const progress = Math.round((answeredCount / totalQ) * 100);
                                    const isCompleted = !!p.completed_at;

                                    return (
                                        <div
                                            key={p.id}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' :
                                                index === 1 ? 'bg-gray-50 border-2 border-gray-300' :
                                                    index === 2 ? 'bg-orange-50 border-2 border-orange-300' :
                                                        'bg-white border border-gray-200'
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                            </div>

                                            {/* Name + progress bar */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-semibold text-sm text-gray-800 truncate">{p.user_name}</p>
                                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                        {answeredCount}/{totalQ} câu {isCompleted ? '✅' : ''}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className="text-right flex-shrink-0 w-16">
                                                <p className={`font-black text-lg ${index === 0 ? 'text-yellow-600' :
                                                    index === 1 ? 'text-gray-600' :
                                                        index === 2 ? 'text-orange-600' : 'text-purple-600'
                                                    }`}>{p.score}</p>
                                                <p className="text-xs text-gray-400">điểm</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
