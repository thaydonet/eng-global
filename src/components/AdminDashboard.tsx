import React from 'react';

export default function AdminDashboard() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
            <p className="text-gray-600">
                Tính năng quản lý người dùng và nội dung đã bị vô hiệu hóa theo yêu cầu.
            </p>
            <div className="mt-8">
                <a href="/" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Về trang chủ
                </a>
            </div>
        </div>
    );
}
