import React, { useState, useEffect } from 'react';
import { signUp } from '@/lib/auth';

interface RegisterModalProps {
    onRegisterSuccess: () => void;
    onClose?: () => void;
    onSwitchToLogin?: () => void;
}

export default function RegisterModal({ onRegisterSuccess, onClose, onSwitchToLogin }: RegisterModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Handle ESC key press
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [onClose]);

    const validateForm = () => {
        if (!email || !password || !confirmPassword || !displayName) {
            setError('Vui lòng điền đầy đủ thông tin');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ');
            return false;
        }

        // Password validation
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        // Password match
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            await signUp(email, password, role, displayName);

            const successMessage = role === 'teacher'
                ? 'Đăng ký thành công! Tài khoản đang chờ admin kích hoạt. Bạn sẽ nhận được thông báo khi tài khoản được kích hoạt.'
                : 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.';

            setSuccess(successMessage);

            // Auto switch to login after 3 seconds for students
            if (role === 'student') {
                setTimeout(() => {
                    onRegisterSuccess();
                }, 3000);
            } else {
                // For teachers, just show success message
                setTimeout(() => {
                    if (onSwitchToLogin) {
                        onSwitchToLogin();
                    }
                }, 4000);
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.message?.includes('already registered')) {
                setError('Email đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.');
            } else {
                setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 animate-fade-in relative max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Đóng"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đăng ký tài khoản</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Tạo tài khoản mới để sử dụng hệ thống</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="email@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Ít nhất 6 ký tự"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Nhập lại mật khẩu"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Vai trò
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('student')}
                                className={`p-3 rounded-lg border-2 transition-all ${role === 'student'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                <div className="text-2xl mb-1">🎓</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Học sinh</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('teacher')}
                                className={`p-3 rounded-lg border-2 transition-all ${role === 'teacher'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                <div className="text-2xl mb-1">👨‍🏫</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Giáo viên</div>
                            </button>
                        </div>
                        {role === 'teacher' && (
                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                ℹ️ Tài khoản giáo viên cần được admin kích hoạt trước khi sử dụng
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            'Đăng ký'
                        )}
                    </button>

                    {onSwitchToLogin && (
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
                            Đã có tài khoản?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToLogin}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Đăng nhập ngay
                            </button>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
