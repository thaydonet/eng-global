import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface SearchResult {
    type: 'lesson' | 'exam';
    id: string;
    title: string;
    description: string;
    url: string;
}

export default function AIChatBox() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const searchContent = async (query: string): Promise<SearchResult[]> => {
        const results: SearchResult[] = [];
        const searchTerm = query.toLowerCase();

        // Search lessons from Supabase
        try {
            const { data: lessons } = await supabase
                .from('lessons')
                .select('id, name, description, slug')
                .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .limit(5);

            if (lessons) {
                results.push(...lessons.map(l => ({
                    type: 'lesson' as const,
                    id: l.id,
                    title: l.name,
                    description: l.description || '',
                    url: `/lessons/${l.id}`
                })));
            }
        } catch (error) {
            console.error('Error searching lessons:', error);
        }

        // Search exams
        try {
            const { data: exams } = await supabase
                .from('exam_papers')
                .select('id, title, slug')
                .eq('is_published', true)
                .or(`title.ilike.%${searchTerm}%`)
                .limit(3);

            if (exams) {
                results.push(...exams.map(e => ({
                    type: 'exam' as const,
                    id: e.id,
                    title: e.title,
                    description: 'Đề thi trắc nghiệm',
                    url: `/de-thi/${e.slug}`
                })));
            }
        } catch (error) {
            console.error('Error searching exams:', error);
        }

        return results;
    };

    const callGeminiAPI = async (userMessage: string, searchResults: SearchResult[]): Promise<string> => {
        try {
            const apiKey = import.meta.env.PUBLIC_GEMINI_API_KEY;
            if (!apiKey) {
                return 'Xin lỗi, hệ thống AI chưa được cấu hình. Vui lòng thử lại sau.';
            }

            let context = '';
            if (searchResults.length > 0) {
                context = '\n\nThông tin liên quan:\n' + searchResults.map(r =>
                    `- ${r.title}: ${r.description} (${r.url})`
                ).join('\n');
            }

            const systemPrompt = `Bạn là trợ lý tìm kiếm cho nền tảng Hoc.io.vn - chỉ trả lời dựa trên nội dung có sẵn trong website.

QUY TẮC QUAN TRỌNG:
1. CHỈ TRẢ LỜI nếu có thông tin liên quan trong phần "Thông tin liên quan" bên dưới
2. Nếu KHÔNG CÓ thông tin liên quan, trả lời CHÍNH XÁC: "Không trả lời ngoài nội dung website này!"
3. KHÔNG tự sinh nội dung, KHÔNG trả lời từ kiến thức chung
4. Chỉ tóm tắt và giới thiệu nội dung từ kết quả tìm kiếm

Nhiệm vụ của bạn:
- Nếu có kết quả tìm kiếm: Giới thiệu ngắn gọn và gợi ý người dùng xem link
- Nếu không có kết quả: Trả lời "Không trả lời ngoài nội dung website này!"

${context}`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `${systemPrompt}\n\nCâu hỏi của người dùng: ${userMessage}`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 300,
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                'Không trả lời ngoài nội dung website này!';

            return aiResponse;
        } catch (error) {
            console.error('Gemini API error:', error);
            return 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const searchResults = await searchContent(userMessage);

            const aiResponse = await callGeminiAPI(userMessage, searchResults);

            let fullResponse = aiResponse;
            if (searchResults.length > 0) {
                fullResponse += '\n\n📚 **Nội dung liên quan:**\n';
                searchResults.forEach(r => {
                    const icon = r.type === 'lesson' ? '📖' : '📝';
                    fullResponse += `\n${icon} [${r.title}](${r.url})`;
                });
            }

            setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-4 mb-2 p-2 pr-6 bg-white rounded-full shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">AI Trợ lý học tập</h2>
                        <p className="text-xs text-gray-500">Thông minh - Nhanh chóng - Chính xác</p>
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-white/50 backdrop-blur-sm overflow-hidden ring-1 ring-gray-100">
                {/* Messages Area */}
                <div className="h-96 overflow-y-auto p-6 bg-gradient-to-b from-white to-gray-50/50 space-y-4 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/20 animate-float">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Xin chào! Bạn muốn học môn gì hôm nay?</h3>
                            <p className="text-gray-600 mb-8 max-w-md">
                                Chọn một môn học bên dưới để tôi giúp bạn tìm tài liệu và giải đáp thắc mắc nhé!
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                                {[
                                    { label: 'Toán học', icon: '📐', url: '/lessons/toan' },
                                    { label: 'Vật lý', icon: '⚡', url: '/lessons/vat-ly' },
                                    { label: 'Hóa học', icon: '🧪', url: '/lessons/hoa-hoc' },
                                    { label: 'Ngữ văn', icon: '📚', url: '/lessons/ngu-van' },
                                    { label: 'Tiếng Anh', icon: '🇬🇧', url: '/lessons/tieng-anh' },
                                    { label: 'Sinh học', icon: '🧬', url: '/lessons/sinh-hoc' },
                                    { label: 'Lịch sử', icon: '🏛️', url: '/lessons/lich-su' },
                                    { label: 'Địa lý', icon: '🌍', url: '/lessons/dia-ly' },
                                ].map((subject) => (
                                    <a
                                        key={subject.label}
                                        href={subject.url}
                                        className="group px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-green-500 hover:ring-2 hover:ring-green-100 hover:text-green-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                                    >
                                        <span className="text-lg group-hover:scale-110 transition-transform duration-200">{subject.icon}</span>
                                        {subject.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}                {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-100'
                                }`}>
                                <div
                                    className="text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: msg.content
                                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="underline hover:opacity-80 font-medium" target="_blank">$1</a>')
                                            .replace(/\n/g, '<br/>')
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-800 rounded-2xl px-5 py-3 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-sm text-gray-600">Đang tìm kiếm và phân tích...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Hỏi về bài học, khóa học, kiến thức..."
                                className="w-full px-5 py-4 pr-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm transition-all"
                                disabled={isLoading}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="px-6 py-4 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>

            {/* Helper Text */}
            <p className="text-center text-xs text-gray-500 mt-4">
                AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.
            </p>
        </div >
    );
}
