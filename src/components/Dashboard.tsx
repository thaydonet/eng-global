import React, { useState, useEffect } from 'react';
import { getSession, signOut, type UserProfile, getProfile } from '@/lib/auth';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import UserManagement from './UserManagement';
import CompetitionEditor from './CompetitionEditor';
import CompetitionList from './CompetitionList';
import CompetitionMonitor from './CompetitionMonitor';


interface DashboardProps {
    allLessons: any[];
}

export default function Dashboard({ allLessons }: DashboardProps) {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Editor States
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [showCompetitionEditor, setShowCompetitionEditor] = useState(false);
    const [contentTab, setContentTab] = useState<'competitions'>('competitions');

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const currentSession = await getSession();
            setSession(currentSession);

            if (currentSession?.user) {
                const userProfile = await getProfile(currentSession.user.id);
                setProfile(userProfile);
            } else {
                setShowLoginModal(true);
            }
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = async () => {
        setShowLoginModal(false);
        setLoading(true);
        await checkSession();
    };

    const handleLogout = async () => {
        await signOut();
        setSession(null);
        setProfile(null);
        setShowLoginModal(true);
    };

    const handleCreateCourse = () => {
        // Create draft course logic or redirect
        window.location.href = '/courses/new'; // Assuming we'll make a route or handle differently
        // For now, let's alert
        alert('Tính năng tạo khóa học đang phát triển. Vui lòng tạo trong Supabase trước.');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Truy cập Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Vui lòng đăng nhập để tiếp tục</p>
                </div>
                <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-8 py-3 bg-primary-600 text-white rounded-lg font-bold shadow-lg hover:bg-primary-700 transition"
                >
                    Đăng nhập
                </button>
                {showLoginModal && (
                    <LoginModal
                        onLoginSuccess={handleLoginSuccess}
                        onClose={() => setShowLoginModal(false)}
                        onSwitchToRegister={() => {
                            setShowLoginModal(false);
                            setShowRegisterModal(true);
                        }}
                    />
                )}
                {showRegisterModal && (
                    <RegisterModal
                        onRegisterSuccess={() => {
                            setShowRegisterModal(false);
                            setShowLoginModal(true);
                        }}
                        onClose={() => setShowRegisterModal(false)}
                        onSwitchToLogin={() => {
                            setShowRegisterModal(false);
                            setShowLoginModal(true);
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Xin chào, <span className="font-semibold text-primary-600">{profile?.display_name || session.user.email}</span>
                        {profile?.role && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full uppercase">{profile.role}</span>}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                    Đăng xuất
                </button>
            </header>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* User Management - Admin only */}
                {profile?.role === 'admin' && (
                    <button
                        onClick={() => setShowUserManagement(true)}
                        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-green-100 dark:border-green-900 hover:shadow-xl hover:border-green-300 transition-all group text-left"
                    >
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            👥
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quản lý người dùng</h3>
                        <p className="text-gray-500 text-sm">Kích hoạt tài khoản giáo viên, quản lý người dùng.</p>
                    </button>
                )}

                <button
                    onClick={() => setShowCompetitionEditor(true)}
                    className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-orange-100 dark:border-orange-900 hover:shadow-xl hover:border-orange-300 transition-all group text-left"
                >
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        🏆
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tạo Cuộc thi</h3>
                    <p className="text-gray-500 text-sm">Tạo cuộc thi trắc nghiệm với JSON, thi đấu ngay.</p>
                </button>
            </div>

            {/* Modals */}
            {
                showUserManagement && (
                    <UserManagement
                        onClose={() => setShowUserManagement(false)}
                    />
                )
            }

            {
                showCompetitionEditor && session?.user && (
                    <CompetitionEditor
                        userId={session.user.id}
                        onClose={() => setShowCompetitionEditor(false)}
                    />
                )
            }

            {/* ⚡ Khu vực Thi đấu - Live monitor for ALL logged-in teachers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-purple-100 dark:border-purple-900 p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse inline-block" />
                            ⚡ Khu vực Thi đấu
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Bảng xếp hạng live — cập nhật mỗi 3 giây</p>
                    </div>
                </div>
                <CompetitionMonitor />
            </div>

            {/* Content Management - Admin Only */}
            {
                profile?.role === 'admin' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-8 mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📋 Quản lý nội dung</h3>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setContentTab('competitions')}
                                className={`px-6 py-3 font-semibold transition-all border-b-2 ${contentTab === 'competitions'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                🏆 Cuộc thi
                            </button>
                        </div>

                        {/* Content */}
                        {contentTab === 'competitions' && <CompetitionList />}
                    </div>
                )
            }

            {/* Stats Area (Placeholder) */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thống kê nhanh</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-500">Tổng bài học</p>
                        <p className="text-2xl font-bold text-primary-600">{allLessons.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-500">Người dùng</p>
                        <p className="text-2xl font-bold text-gray-400">---</p>
                    </div>
                </div>
            </div>

        </div >
    );
}
