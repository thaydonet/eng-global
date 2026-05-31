import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureValidSession } from '@/lib/supabase';
import { createCompetition, updateCompetition, type Question, type Competition } from '@/lib/competition';

interface CompetitionEditorProps {
    onClose: () => void;
    userId: string;
    editingCompetition?: Competition | null;
    onSuccess?: () => void;
}

// Sample JSON template with 10 MCQ questions
const SAMPLE_QUESTIONS_JSON = `[
  {
    "type": "mcq",
    "question": "Tính giá trị của biểu thức: $2^3 + 3^2$",
    "option_a": "15",
    "option_b": "17",
    "option_c": "18",
    "option_d": "19",
    "correct_option": "B",
    "explanation": "$2^3 + 3^2 = 8 + 9 = 17$"
  },
  {
    "type": "mcq",
    "question": "Phương trình $x^2 - 5x + 6 = 0$ có nghiệm là:",
    "option_a": "$x = 1$ hoặc $x = 6$",
    "option_b": "$x = 2$ hoặc $x = 3$",
    "option_c": "$x = -2$ hoặc $x = -3$",
    "option_d": "$x = 1$ hoặc $x = -6$",
    "correct_option": "B",
    "explanation": "Phân tích: $(x-2)(x-3) = 0$ nên $x = 2$ hoặc $x = 3$"
  },
  {
    "type": "mcq",
    "question": "Kết quả của phép tính $\\\\frac{3}{4} + \\\\frac{1}{2}$ là:",
    "option_a": "$\\\\frac{4}{6}$",
    "option_b": "$\\\\frac{5}{4}$",
    "option_c": "$\\\\frac{5}{6}$",
    "option_d": "$1$",
    "correct_option": "B",
    "explanation": "$\\\\frac{3}{4} + \\\\frac{2}{4} = \\\\frac{5}{4}$"
  },
  {
    "type": "mcq",
    "question": "Trong tam giác vuông, nếu hai cạnh góc vuông là 3 và 4 thì cạnh huyền bằng:",
    "option_a": "5",
    "option_b": "6",
    "option_c": "7",
    "option_d": "8",
    "correct_option": "A",
    "explanation": "Theo định lý Pythagore: $c = \\\\sqrt{3^2 + 4^2} = \\\\sqrt{25} = 5$"
  },
  {
    "type": "mcq",
    "question": "Số nào sau đây là số nguyên tố?",
    "option_a": "15",
    "option_b": "21",
    "option_c": "23",
    "option_d": "25",
    "correct_option": "C",
    "explanation": "23 chỉ chia hết cho 1 và 23, nên là số nguyên tố"
  },
  {
    "type": "mcq",
    "question": "Diện tích hình tròn có bán kính $r = 5$ là:",
    "option_a": "$10\\\\pi$",
    "option_b": "$25\\\\pi$",
    "option_c": "$50\\\\pi$",
    "option_d": "$100\\\\pi$",
    "correct_option": "B",
    "explanation": "Diện tích = $\\\\pi r^2 = \\\\pi \\\\times 5^2 = 25\\\\pi$"
  },
  {
    "type": "mcq",
    "question": "Đạo hàm của hàm số $f(x) = x^3$ tại $x = 2$ là:",
    "option_a": "6",
    "option_b": "8",
    "option_c": "12",
    "option_d": "24",
    "correct_option": "C",
    "explanation": "$f'(x) = 3x^2$, nên $f'(2) = 3 \\\\times 2^2 = 12$"
  },
  {
    "type": "mcq",
    "question": "Giá trị của $\\\\sin(30°)$ là:",
    "option_a": "$\\\\frac{1}{2}$",
    "option_b": "$\\\\frac{\\\\sqrt{2}}{2}$",
    "option_c": "$\\\\frac{\\\\sqrt{3}}{2}$",
    "option_d": "$1$",
    "correct_option": "A",
    "explanation": "$\\\\sin(30°) = \\\\frac{1}{2}$"
  },
  {
    "type": "mcq",
    "question": "Tập nghiệm của bất phương trình $2x + 3 > 7$ là:",
    "option_a": "$x > 2$",
    "option_b": "$x > 3$",
    "option_c": "$x > 4$",
    "option_d": "$x > 5$",
    "correct_option": "A",
    "explanation": "$2x > 4 \\\\Rightarrow x > 2$"
  },
  {
    "type": "mcq",
    "question": "Chu vi hình vuông có cạnh $a = 6$ là:",
    "option_a": "12",
    "option_b": "18",
    "option_c": "24",
    "option_d": "36",
    "correct_option": "C",
    "explanation": "Chu vi = $4a = 4 \\\\times 6 = 24$"
  }
]`;

export default function CompetitionEditor({ onClose, userId, editingCompetition, onSuccess }: CompetitionEditorProps) {
    const [title, setTitle] = useState(editingCompetition?.title || 'Cuộc Thi Toán Học');
    const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState(editingCompetition?.time_limit_per_question || 30);
    const [questionsJson, setQuestionsJson] = useState(
        editingCompetition
            ? JSON.stringify(editingCompetition.questions, null, 2)
            : SAMPLE_QUESTIONS_JSON
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [competitionCode, setCompetitionCode] = useState('');

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // ── Ensure valid session before any authenticated API call ──
            await ensureValidSession();

            // Parse JSON
            const questions: Question[] = JSON.parse(questionsJson);

            // Validate questions
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error('Phải có ít nhất 1 câu hỏi');
            }

            // Validate each question
            questions.forEach((q, index) => {
                if (q.type !== 'mcq') {
                    throw new Error(`Câu ${index + 1}: Chỉ hỗ trợ câu hỏi MCQ (type: "mcq")`);
                }
                if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
                    throw new Error(`Câu ${index + 1}: Thiếu câu hỏi hoặc đáp án`);
                }
                if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) {
                    throw new Error(`Câu ${index + 1}: correct_option phải là A, B, C hoặc D`);
                }
            });

            // Create or Update competition
            let resultData;

            if (editingCompetition) {
                const { data, error: updateError } = await updateCompetition(
                    editingCompetition.id,
                    title,
                    questions,
                    timeLimitPerQuestion
                );
                if (updateError) throw updateError;
                resultData = data;
            } else {
                const { data, error: createError } = await createCompetition(
                    title,
                    questions,
                    userId,
                    timeLimitPerQuestion,
                    'anytime'
                );
                if (createError) throw createError;
                resultData = data;
            }

            if (!resultData) throw new Error('Không thể lưu cuộc thi');

            setCompetitionCode(resultData.code);
            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('Error creating competition:', err);
            if (err instanceof SyntaxError) {
                setError('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.');
            } else {
                setError(err.message || 'Có lỗi xảy ra khi tạo cuộc thi');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStartNow = () => {
        window.open(`/test-competition?code=${competitionCode}`, '_blank');
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
                    <div className="text-center mb-6">
                        <div className="inline-block p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                            {editingCompetition ? 'Cập nhật thành công! 🎉' : 'Tạo thành công! 🎉'}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {editingCompetition ? 'Thông tin cuộc thi đã được cập nhật.' : 'Cuộc thi đã được tạo và sẵn sàng'}
                        </p>

                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-purple-200 mb-6">
                            <p className="text-sm text-gray-600 mb-2">Mã cuộc thi</p>
                            <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wider">
                                {competitionCode}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleStartNow}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                            🚀 Thi đấu ngay
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-100 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {editingCompetition ? 'Chỉnh Sửa Cuộc Thi' : 'Tạo Cuộc Thi Mới'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingCompetition ? 'Cập nhật thông tin và câu hỏi' : 'Tạo cuộc thi trắc nghiệm với câu hỏi từ JSON'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tên cuộc thi
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                                placeholder="Cuộc Thi Toán Học"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Thời gian/câu (giây)
                            </label>
                            <input
                                type="number"
                                value={timeLimitPerQuestion}
                                onChange={(e) => setTimeLimitPerQuestion(Number(e.target.value))}
                                min="10"
                                max="120"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Câu hỏi (JSON) - <span className="text-purple-600">Đã có 10 câu mẫu</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={questionsJson}
                                onChange={(e) => setQuestionsJson(e.target.value)}
                                className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all font-mono text-sm"
                                placeholder="Nhập JSON câu hỏi..."
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Định dạng: Array của objects với các trường: type, question, option_a, option_b, option_c, option_d, correct_option, explanation (optional)
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'Đang xử lý...' : (editingCompetition ? '💾 Lưu thay đổi' : '🎯 Tạo cuộc thi')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
