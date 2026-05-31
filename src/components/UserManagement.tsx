import React, { useState, useEffect } from 'react';
import { getAllTeachers, updateUserStatus, getStatusDisplayName, type UserProfile } from '@/lib/auth';

interface UserManagementProps {
    onClose: () => void;
}

export default function UserManagement({ onClose }: UserManagementProps) {
    const [teachers, setTeachers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadTeachers();
    }, []);

    // Handle ESC key press
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [onClose]);

    const loadTeachers = async () => {
        try {
            setLoading(true);
            const data = await getAllTeachers();
            setTeachers(data);
        } catch (error) {
            console.error('Error loading teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId: string, newStatus: 'active' | 'pending' | 'suspended') => {
        const statusText = getStatusDisplayName(newStatus);

        if (!confirm(`Bạn có chắc chắn muốn thay đổi trạng thái thành "${statusText}"?`)) {
            return;
        }

        try {
            setActionLoading(userId);
            await updateUserStatus(userId, newStatus);
            await loadTeachers(); // Reload list
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredTeachers = teachers.filter(teacher => {
        if (filter === 'all') return true;
        return teacher.status === filter;
    });

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Đã kích hoạt</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Chờ duyệt</span>;
            case 'suspended':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Đã vô hiệu hóa</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">Không xác định</span>;
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in relative">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Giáo viên</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            aria-label="Đóng"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex gap-2 overflow-x-auto">
                        {[
                            { key: 'all', label: 'Tất cả', count: teachers.length },
                            { key: 'pending', label: 'Chờ duyệt', count: teachers.filter(t => t.status === 'pending').length },
                            { key: 'active', label: 'Đã kích hoạt', count: teachers.filter(t => t.status === 'active').length },
                            { key: 'suspended', label: 'Đã vô hiệu hóa', count: teachers.filter(t => t.status === 'suspended').length },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => setFilter(btn.key as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === btn.key
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {btn.label} ({btn.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : filteredTeachers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">Không có giáo viên nào</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTeachers.map((teacher) => (
                                <div
                                    key={teacher.id}
                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {teacher.display_name || 'Chưa đặt tên'}
                                                </h3>
                                                {getStatusBadge(teacher.status)}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                                                📧 {teacher.email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Đăng ký: {new Date(teacher.created_at).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2 flex-shrink-0">
                                            {teacher.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChange(teacher.id, 'active')}
                                                    disabled={actionLoading === teacher.id}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === teacher.id ? '...' : '✓ Kích hoạt'}
                                                </button>
                                            )}
                                            {teacher.status === 'active' && (
                                                <button
                                                    onClick={() => handleStatusChange(teacher.id, 'suspended')}
                                                    disabled={actionLoading === teacher.id}
                                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === teacher.id ? '...' : '✕ Vô hiệu hóa'}
                                                </button>
                                            )}
                                            {teacher.status === 'suspended' && (
                                                <button
                                                    onClick={() => handleStatusChange(teacher.id, 'active')}
                                                    disabled={actionLoading === teacher.id}
                                                    className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === teacher.id ? '...' : '↻ Kích hoạt lại'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
