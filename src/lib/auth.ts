/**
 * Auth Utilities for Supabase Authentication
 */

import { supabase } from './supabase';

export interface UserProfile {
    id: string;
    email: string;
    role: 'admin' | 'teacher' | 'student' | 'user';
    created_at: string;
    display_name?: string;
    avatar_url?: string;
    is_active?: boolean;
    status?: 'active' | 'pending' | 'suspended';
}


/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;

    // Check if user is active
    if (data.user) {
        const profile = await getProfile(data.user.id);
        if (profile && (!profile.is_active || profile.status !== 'active')) {
            await signOut();
            throw new Error('Tài khoản chưa được kích hoạt. Vui lòng liên hệ admin.');
        }
    }

    return data;
}

/**
 * Sign up with email and password
 * Default role is 'student', can be changed to 'teacher' during registration
 * Teachers will have status 'pending' until admin activates them
 */
export async function signUp(
    email: string,
    password: string,
    role: 'teacher' | 'student' = 'student',
    displayName?: string
) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role,
                display_name: displayName
            }
        }
    });

    if (error) throw error;

    // Create/update profile with role and status
    if (data.user) {
        const status = role === 'teacher' ? 'pending' : 'active';
        const isActive = role === 'student'; // Students are active by default, teachers need activation

        await supabase
            .from('profiles')
            .upsert({
                id: data.user.id,
                email: email,
                role,
                display_name: displayName,
                status,
                is_active: isActive
            });
    }

    return data;
}


/**
 * Sign out
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear any cached data in localStorage
    if (typeof window !== 'undefined') {
        // Clear Supabase session from storage
        window.localStorage.removeItem('hoc-io-auth');
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (error) throw error;
}

/**
 * Get current user session
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

/**
 * Get user profile from profiles table
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        // Ignored expired JWT or unauthorized if user was logged out
        if (error.code !== 'PGRST303') {
            console.error('Error fetching profile:', error);
        }
        return null;
    }

    if (!data) {
        // Silent failing when no profile found, often harmless during auth transitions
        return null;
    }

    return {
        id: data.id,
        email: data.email,
        role: data.role || 'user',
        created_at: data.created_at,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        is_active: data.is_active,
        status: data.status,
    };
}


/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at'>>) {
    const dbUpdates: any = {};
    if (updates.display_name !== undefined) dbUpdates.display_name = updates.display_name;
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
    // Role can only be changed by admin

    const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

/**
 * Get role display name in Vietnamese
 */
export function getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
        admin: 'Quản trị viên',
        teacher: 'Giáo viên',
        student: 'Học sinh',
        user: 'Thành viên',
    };
    return roleNames[role] || 'Thành viên';
}

/**
 * Get status display name in Vietnamese
 */
export function getStatusDisplayName(status: string): string {
    const statusNames: Record<string, string> = {
        active: 'Đã kích hoạt',
        pending: 'Chờ duyệt',
        suspended: 'Đã vô hiệu hóa',
    };
    return statusNames[status] || status;
}

/**
 * ADMIN ONLY: Get all teachers for management
 */
export async function getAllTeachers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching teachers:', error);
        throw error;
    }

    return data.map(profile => ({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
        status: profile.status,
    }));
}

/**
 * ADMIN ONLY: Activate or deactivate a user
 */
export async function updateUserStatus(userId: string, status: 'active' | 'pending' | 'suspended') {
    const isActive = status === 'active';

    const { error } = await supabase
        .from('profiles')
        .update({
            status,
            is_active: isActive
        })
        .eq('id', userId);

    if (error) throw error;
}
