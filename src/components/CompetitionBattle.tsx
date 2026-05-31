import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


// Define local User interface compatible with what we need
interface User {
    id: string;
    email?: string;
    fullname?: string;
    role?: string;
}

import {
    getCompetitionByCode,
    joinCompetition,
    getParticipant,
    updateParticipantProgress,
    completeCompetition,
    getLeaderboard,
    subscribeToLeaderboard,
    calculateScore,
    getQuestionOptions,
    getCorrectOptionIndex,
    startCompetition,
    getLeaderboardBySession,
    getCompetitionSessions,
    type Competition,
    type Participant,
    type Question,
} from '@/lib/competition';

type Screen = 'enter-code' | 'enter-name' | 'waiting-room' | 'quiz' | 'results';

// Helper to determine competition status client-side
const getCompetitionStatus = (comp: Competition) => {
    // If it has an explicit status from DB, use it
    if (comp.status) return comp.status;

    // If not started yet
    if (!comp.actual_start_time) return 'pending';

    // Calculate end time
    const startTime = new Date(comp.actual_start_time).getTime();
    const durationMs = comp.questions.length * comp.time_limit_per_question * 1000;
    const endTime = startTime + durationMs;

    if (Date.now() > endTime) return 'completed';
    return 'in_progress';
};

export default function CompetitionBattle() {
    const [screen, setScreen] = useState<Screen>('enter-code');
    const [code, setCode] = useState('');
    const [guestName, setGuestName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<User | null>(null);

    // Competition state
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());

    // Leaderboard state
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [isCreator, setIsCreator] = useState(false);
    const [selectedSession, setSelectedSession] = useState<number>(1);
    const [availableSessions, setAvailableSessions] = useState<number[]>([]);

    // Check Auth (Supabase)
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    fullname: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    role: session.user.user_metadata?.role || 'student'
                });
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    fullname: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    role: session.user.user_metadata?.role || 'student'
                });
            } else {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Timer countdown
    useEffect(() => {
        if (screen === 'quiz' && !showFeedback && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !showFeedback) {
            handleNextQuestion();
        }
    }, [timeLeft, screen, showFeedback]);

    // React to competition status changes (e.g. Host starts game)
    useEffect(() => {
        if (!competition) return;

        const status = getCompetitionStatus(competition);

        // Transition from waiting-room to quiz
        if (screen === 'waiting-room' && status === 'in_progress') {
            setTimeLeft(competition.time_limit_per_question);
            setStartTime(Date.now());
            setScreen('quiz');
        }
    }, [competition, screen]);

    // ── Single subscription: leaderboard + competition status ──
    useEffect(() => {
        if (!competition) return;

        fetchLeaderboard();
        fetchSessions();

        if (user?.id) {
            setIsCreator(String(user.id) === String(competition.created_by));
        }

        // Subscribe to participant changes (leaderboard updates)
        const participantSub = subscribeToLeaderboard(competition.id, () => {
            fetchLeaderboard();
            fetchSessions();
        });

        // Subscribe to competition row changes (status, session_number)
        const competitionSub = supabase
            .channel(`comp_watch_${competition.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'competitions',
                    filter: `id=eq.${competition.id}`,
                },
                (payload) => {
                    const newComp = payload.new as Competition;
                    setCompetition(newComp);

                    const status = getCompetitionStatus(newComp);

                    // Auto-start quiz when host triggers start
                    if (status === 'in_progress') {
                        setTimeLeft(newComp.time_limit_per_question);
                        setStartTime(Date.now());
                        setScreen('quiz');
                        return;
                    }

                    // Handle new session (restart)
                    if (newComp.session_number > competition.session_number) {
                        alert('Giáo viên đã bắt đầu phiên đấu mới!');
                        window.location.reload();
                    }
                }
            )
            .subscribe();

        return () => {
            participantSub.unsubscribe();
            competitionSub.unsubscribe();
        };
    }, [competition?.id, user?.id]);

    // ── Polling fallback: check status every 3s while in waiting-room ──
    useEffect(() => {
        if (screen !== 'waiting-room' || !competition) return;

        const poll = setInterval(async () => {
            try {
                const { data, error } = await supabase
                    .from('competitions')
                    .select('*')
                    .eq('id', competition.id)
                    .single();

                if (error && error.code === 'PGRST303') {
                    return; // Ignore expired JWT
                }

                if (!data) return;

                // Refresh participant count
                const participants = await getLeaderboardBySession(data.id, data.session_number);
                setLeaderboard(participants);

                const status = getCompetitionStatus(data);
                if (status === 'in_progress') {
                    clearInterval(poll);
                    setCompetition(data);
                    setTimeLeft(data.time_limit_per_question);
                    setStartTime(Date.now());
                    setScreen('quiz');
                }
            } catch (err: any) {
                if (err?.code !== 'PGRST303') {
                    console.error("Polling error:", err);
                }
            }
        }, 3000);

        return () => clearInterval(poll);
    }, [screen, competition?.id]);

    // ── Leaderboard refresh every 4s during quiz ──
    useEffect(() => {
        if (screen !== 'quiz' || !competition) return;

        // Initial fetch
        fetchLeaderboard(competition.id, competition.session_number);

        const interval = setInterval(() => {
            fetchLeaderboard(competition.id, competition.session_number);
        }, 4000);

        return () => clearInterval(interval);
    }, [screen, competition?.id, competition?.session_number]);

    const fetchLeaderboard = async (compId?: string, session?: number) => {
        try {
            const id = compId || competition?.id;
            const sess = session ?? competition?.session_number;
            if (!id) return;
            const data = await getLeaderboardBySession(id, sess);
            setLeaderboard(data);
        } catch (err: any) {
            if (err?.code !== 'PGRST303') {
                console.error("Error fetching leaderboard:", err);
            }
        }
    };

    const fetchSessions = async () => {
        if (competition) {
            const sessions = await getCompetitionSessions(competition.id);
            setAvailableSessions(sessions.length > 0 ? sessions : [1]);
        }
    };

    const renderKaTeX = () => {
        if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
            try {
                // First, remove katex-rendered class from elements whose content changed
                const allElements = document.querySelectorAll('.math-content');
                allElements.forEach((element) => {
                    // if it has katex-html inside, it was already rendered, but if content changed it might need re-render.
                    // React will replace the innerHTML, destroying the katex-html on next question.
                    // So we just re-run renderMathInElement on it, it doesn't hurt, 
                    // or we check if it doesn't contain .katex element
                    if (!element.querySelector('.katex')) {
                        element.classList.remove('katex-rendered');
                    }
                });

                const elementsToRender = document.querySelectorAll('.math-content:not(.katex-rendered)');
                elementsToRender.forEach((element) => {
                    (window as any).renderMathInElement(element, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false
                    });
                    // Mark as rendered to prevent re-rendering
                    element.classList.add('katex-rendered');
                });
            } catch (error) {
                console.error('KaTeX rendering error:', error);
            }
        }
    };

    // Render KaTeX when content changes
    useEffect(() => {
        // Wait for KaTeX library to load
        const checkAndRender = () => {
            if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
                renderKaTeX();
            } else {
                // Retry after a short delay
                setTimeout(checkAndRender, 100);
            }
        };

        // Delay to ensure DOM is ready
        const timer = setTimeout(checkAndRender, 100);
        return () => clearTimeout(timer);
    }, [screen, currentQuestionIndex, competition]);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return '🥇';
            case 1:
                return '🥈';
            case 2:
                return '🥉';
            default:
                return `#${index + 1}`;
        }
    };

    const handleCheckCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const comp = await getCompetitionByCode(code.trim());
            if (!comp) {
                setError('Không tìm thấy cuộc thi với mã này');
                setLoading(false);
                return;
            }

            setCompetition(comp);

            // If logged in, join directly as "Named Guest"
            if (user) {
                await handleJoinWithUser(comp, user);
            } else {
                setScreen('enter-name');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinWithUser = async (comp: Competition, currentUser: User) => {
        try {
            const { data, error } = await joinCompetition(
                comp.id,
                currentUser.id,
                currentUser.email || 'user@temp.com',
                currentUser.fullname || currentUser.email?.split('@')[0] || 'User',
                comp.session_number,
                false // Use real user ID from Supabase Auth
            );

            if (error) throw error;

            setParticipant(data);

            // Check competition status
            const status = getCompetitionStatus(comp);
            if (status === 'pending' || status === 'completed') {
                setScreen('waiting-room');
            } else if (status === 'in_progress') {
                setTimeLeft(comp.time_limit_per_question);
                setStartTime(Date.now());
                setScreen('quiz');
            } else {
                setError('Trạng thái cuộc thi không hợp lệ');
            }
        } catch (e: any) {
            console.error("Join error", e);
            setError(e.message || "Lỗi khi tham gia");
        }
    };

    const handleJoinAsGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!competition || !guestName.trim()) return;

        setLoading(true);
        try {
            // Create a temporary guest user ID (UUID format)
            const guestId = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

            const { data, error } = await joinCompetition(
                competition.id,
                guestId,
                'guest@temp.com',
                guestName.trim(),
                competition.session_number,
                true // isGuestUser
            );

            if (error) throw error;

            setParticipant(data);

            // Check competition status
            const status = getCompetitionStatus(competition);
            if (status === 'pending' || status === 'completed') {
                setScreen('waiting-room');
            } else if (status === 'in_progress') {
                setTimeLeft(competition.time_limit_per_question);
                setStartTime(Date.now());
                setScreen('quiz');
            } else {
                setError('Trạng thái cuộc thi không hợp lệ');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = async (optionLetter: string) => {
        if (showFeedback || !competition || !participant) return;

        setSelectedOption(optionLetter);
        const currentQuestion = competition.questions[currentQuestionIndex];
        const correct = optionLetter === currentQuestion.correct_option;
        setIsCorrect(correct);
        setShowFeedback(true);

        const newAnswer = {
            questionIndex: currentQuestionIndex,
            selectedOption: optionLetter,
            correct,
            timeSpent: competition.time_limit_per_question - timeLeft,
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        const newScore = calculateScore(newAnswers, competition.questions);
        setScore(newScore);

        // Update progress in real-time
        await updateParticipantProgress(
            participant.id,
            newAnswers,
            newScore,
            Math.floor((Date.now() - startTime) / 1000)
        );

        // Fetch leaderboard immediately to show updated scores
        await fetchLeaderboard();

        // Auto advance after 2 seconds
        setTimeout(() => {
            handleNextQuestion();
        }, 2000);
    };

    const handleNextQuestion = async () => {
        if (!competition || !participant) return;

        setShowFeedback(false);
        setSelectedOption(null);

        if (currentQuestionIndex < competition.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setTimeLeft(competition.time_limit_per_question);
        } else {
            // Complete competition
            const totalTime = Math.floor((Date.now() - startTime) / 1000);
            await completeCompetition(participant.id, answers, score, totalTime);
            setScreen('results');
        }
    };

    const getLeaderboardPosition = () => {
        if (!participant) return 0;
        return leaderboard.findIndex(p => p.id === participant.id) + 1;
    };

    const handleStartCompetition = async () => {
        if (!competition || !isCreator) return;

        setLoading(true);
        try {
            const { error } = await startCompetition(competition.id);
            if (error) throw error;

            // Update local competition state
            setCompetition({ ...competition, status: 'in_progress' });
            setTimeLeft(competition.time_limit_per_question);
            setStartTime(Date.now());
            setScreen('quiz');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // (waiting-room polling is handled above — no duplicate subscription needed)


    if (screen === 'enter-code') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Thi Đấu Trực Tuyến
                        </h1>
                        <p className="text-gray-600 mt-2">Nhập mã thi đấu để bắt đầu</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCheckCode} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mã thi đấu (4 chữ số)</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={4}
                                pattern="[0-9]{4}"
                                className="w-full px-6 py-4 text-center text-3xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all tracking-widest"
                                placeholder="0000"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || code.length !== 4}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'Đang tải...' : 'Tiếp tục 🚀'}
                        </button>
                    </form>

                    {!user && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Hoặc <a href="/dashboard" className="text-purple-600 hover:underline font-semibold">đăng nhập</a> để lưu kết quả
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (screen === 'enter-name') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Nhập tên của bạn
                        </h1>
                        <p className="text-gray-600 text-sm">Tên sẽ hiển thị trên bảng xếp hạng</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleJoinAsGuest} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                maxLength={30}
                                className="w-full px-6 py-4 text-center text-xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                                placeholder="Tên của bạn"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !guestName.trim()}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'Đang tham gia...' : 'Bắt đầu thi đấu 🎯'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setScreen('enter-code')}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            ← Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (screen === 'waiting-room' && competition) {
        const compStatus = getCompetitionStatus(competition);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-white/20">
                    <div className="text-center mb-6">
                        <div className={`inline-block p-4 rounded-2xl mb-4 ${compStatus === 'completed' ? 'bg-gray-400' :
                            'bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse'
                            }`}>
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            {competition.title}
                        </h1>

                        {compStatus === 'completed' ? (
                            <div className="mt-2 px-4 py-2 bg-gray-100 rounded-xl text-gray-600">
                                ✅ Cuộc thi đã kết thúc
                            </div>
                        ) : (
                            <div className="mt-2 space-y-1">
                                <p className="text-gray-600 font-medium">⏳ Đang chờ giáo viên bắt đầu...</p>
                                <p className="text-xs text-gray-400">Màn hình sẽ tự động chuyển khi bắt đầu</p>
                            </div>
                        )}
                    </div>

                    {/* Live participant counter — prominent */}
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-5 mb-6 text-white text-center shadow-lg">
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-4xl font-black">{leaderboard.length}</span>
                            <div className="text-left">
                                <p className="font-bold text-lg">người đã vào</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                    <p className="text-xs text-purple-200">Cập nhật real-time</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Competition Info */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-2xl text-center">
                            <p className="text-sm text-blue-600 font-semibold mb-1">📝 Câu hỏi</p>
                            <p className="text-2xl font-bold text-blue-700">{competition.questions.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-2xl text-center">
                            <p className="text-sm text-purple-600 font-semibold mb-1">⏱️ Thời gian/câu</p>
                            <p className="text-2xl font-bold text-purple-700">{competition.time_limit_per_question}s</p>
                        </div>
                    </div>

                    {/* Participants list */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-5 max-h-48 overflow-y-auto">
                        <h3 className="font-bold text-gray-700 mb-3 text-sm">👥 Danh sách tham gia:</h3>
                        {leaderboard.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-3">Chưa có ai tham gia...</p>
                        ) : (
                            <div className="space-y-1.5">
                                {leaderboard.map((p, i) => {
                                    const isCurrentUser = p.id === participant?.id;
                                    return (
                                        <div
                                            key={p.id}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isCurrentUser
                                                ? 'bg-purple-100 border border-purple-400 font-semibold text-purple-900'
                                                : 'bg-white border border-gray-200 text-gray-700'
                                                }`}
                                        >
                                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <span className="flex-1">{p.user_name}</span>
                                            {isCurrentUser && <span className="text-xs text-purple-500">← Bạn</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Start button for creator (also in thi-dau screen) */}
                    {isCreator && compStatus !== 'completed' && compStatus !== 'in_progress' && (
                        <button
                            onClick={handleStartCompetition}
                            disabled={loading || leaderboard.length === 0}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-3"
                        >
                            {loading ? 'Đang bắt đầu...' : `🚀 Bắt đầu thi ngay (${leaderboard.length} người)`}
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setScreen('enter-code');
                            setCompetition(null);
                            setParticipant(null);
                        }}
                        className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all"
                    >
                        Rời phòng chờ
                    </button>
                </div>
            </div>
        );
    }

    if (screen === 'quiz' && competition) {
        const currentQuestion = competition.questions[currentQuestionIndex];
        const options = getQuestionOptions(currentQuestion);
        const correctIndex = getCorrectOptionIndex(currentQuestion.correct_option);
        const progress = ((currentQuestionIndex + 1) / competition.questions.length) * 100;

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 mb-6 border border-white/20">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{competition.title}</h2>
                                <p className="text-sm text-gray-600">Câu {currentQuestionIndex + 1}/{competition.questions.length}</p>
                            </div>
                            <div className="text-right">
                                <div className={`text-4xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-purple-600'}`}>
                                    {timeLeft}s
                                </div>
                                <p className="text-sm text-gray-600">Điểm: {score}</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-white/20 animate-slide-in">
                                <div className="mb-8">
                                    <div className="prose max-w-none">
                                        {/* Force re-render key based on question index */}
                                        <div key={`q-${currentQuestionIndex}`} className="text-xl font-semibold text-gray-800 math-content" dangerouslySetInnerHTML={{ __html: currentQuestion.question }} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {options.map((option, index) => {
                                        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                                        const isSelected = selectedOption === optionLetter;
                                        const isCorrectOption = index === correctIndex;
                                        let className = 'w-full p-6 text-left rounded-xl border-2 transition-all transform hover:scale-105 hover:shadow-lg font-medium';

                                        if (showFeedback) {
                                            if (isCorrectOption) {
                                                className += ' bg-green-100 border-green-500 text-green-800 animate-pulse-success';
                                            } else if (isSelected && !isCorrect) {
                                                className += ' bg-red-100 border-red-500 text-red-800 animate-shake';
                                            } else {
                                                className += ' bg-gray-100 border-gray-300 text-gray-500';
                                            }
                                        } else {
                                            className += ' bg-white border-gray-300 hover:border-purple-500 text-gray-800';
                                        }

                                        return (
                                            <button
                                                key={`opt-${currentQuestionIndex}-${index}`}
                                                onClick={() => handleSelectOption(optionLetter)}
                                                disabled={showFeedback}
                                                className={className}
                                            >
                                                <div className="flex items-center">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold mr-4">
                                                        {optionLetter}
                                                    </span>
                                                    <span className="math-content" dangerouslySetInnerHTML={{ __html: option }} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {showFeedback && currentQuestion.explanation && (
                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-sm font-semibold text-blue-800 mb-1">💡 Giải thích:</p>
                                        <p key={`exp-${currentQuestionIndex}`} className="text-sm text-blue-700 math-content" dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Leaderboard Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 sticky top-4">
                                <div className="mb-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-bold text-gray-800">🏆 Bảng xếp hạng</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-gray-500">{leaderboard.length} người</span>
                                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" title="Live" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 max-h-[580px] overflow-y-auto">
                                    {leaderboard.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <p className="text-sm">⏳ Chưa có dữ liệu...</p>
                                        </div>
                                    ) : (
                                        leaderboard.map((p, index) => {
                                            const isCurrentUser = p.id === participant?.id;
                                            const answeredCount = Array.isArray(p.answers) ? p.answers.length : 0;
                                            return (
                                                <div
                                                    key={p.id}
                                                    className={`px-3 py-2.5 rounded-xl transition-all ${isCurrentUser
                                                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-purple-400 shadow-md'
                                                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {/* Rank badge */}
                                                        <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md' :
                                                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                                                    isCurrentUser ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                        </div>
                                                        {/* Name + answered */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-purple-900' : 'text-gray-800'
                                                                }`}>
                                                                {p.user_name}{isCurrentUser ? ' ★' : ''}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {answeredCount}/{competition?.questions?.length || '?'} câu
                                                            </p>
                                                        </div>
                                                        {/* Score */}
                                                        <div className="text-right flex-shrink-0">
                                                            <p className={`font-black text-base ${isCurrentUser ? 'text-purple-600' : 'text-gray-700'
                                                                }`}>
                                                                {p.score}
                                                            </p>
                                                            <p className="text-xs text-gray-400">điểm</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (screen === 'results' && competition) {
        const position = getLeaderboardPosition();
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-white/20">
                    <div className="text-center">
                        <div className="mb-6 animate-bounce text-6xl">
                            {position === 1 ? '🏆' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🎉'}
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                            Hoàn thành!
                        </h1>
                        <p className="text-gray-600 mb-8">Bạn đã hoàn thành cuộc thi</p>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-2xl">
                                <p className="text-sm text-blue-600 font-semibold mb-1">Điểm số</p>
                                <p className="text-4xl font-bold text-blue-700">{score}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-2xl">
                                <p className="text-sm text-purple-600 font-semibold mb-1">Xếp hạng</p>
                                <p className="text-4xl font-bold text-purple-700">#{position}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    setScreen('enter-code');
                                    setCompetition(null);
                                    setParticipant(null);
                                    setAnswers([]);
                                    setScore(0);
                                    setCurrentQuestionIndex(0);
                                }}
                                className="bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-300 transition-all"
                            >
                                Thi tiếp
                            </button>
                            <a
                                href="/dashboard"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                            >
                                Về trang chủ
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
