/**
 * Competition/Quiz Battle Utilities
 */

import { supabase } from './supabase';
import { phpIdToUuid } from './id-mapper';

export interface Question {
    type: 'mcq';
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
    difficulty_level?: 'easy' | 'medium' | 'hard';
    is_dynamic?: boolean;
}

export interface Competition {
    id: string;
    code: string;
    title: string;
    questions: Question[];
    created_by: string;
    created_at: string;
    is_active: boolean;
    time_limit_per_question: number;
    scheduled_start_time?: string | null;
    actual_start_time?: string | null;
    status?: 'pending' | 'in_progress' | 'completed'; // Optional - may not exist in schema
    session_number: number;
    type: 'anytime' | 'scheduled';
}

export interface Participant {
    id: string;
    competition_id: string;
    user_id: string | null;
    guest_id?: string | null;
    user_email: string;
    user_name: string;
    answers: any[];
    score: number;
    completed_at?: string;
    time_taken: number;
    joined_at: string;
    session_number: number;
}

/**
 * Generate a random 4-digit competition code
 */
export function generateCompetitionCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Create a new competition
 */
export async function createCompetition(
    title: string,
    questions: Question[],
    userId: string,
    timeLimitPerQuestion: number = 30,
    type: 'anytime' | 'scheduled' = 'scheduled'
): Promise<{ data: Competition | null; error: any }> {
    // Generate unique code
    let code = generateCompetitionCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
        const { data: existing } = await supabase
            .from('competitions')
            .select('code')
            .eq('code', code)
            .single();

        if (!existing) {
            isUnique = true;
        } else {
            code = generateCompetitionCode();
            attempts++;
        }
    }

    const { data: newCompetition, error } = await supabase
        .from('competitions')
        .insert({
            code,
            title,
            questions, // JSONB column supports array of objects directly
            created_by: userId, // Assuming userId is already a UUID or handled by RLS
            time_limit_per_question: timeLimitPerQuestion,
            type,
            is_active: false, // Default to inactive until started
            session_number: 1
        })
        .select()
        .single();

    if (error) {
        console.error('[createCompetition] Supabase Error:', error);
        return { data: null, error };
    }

    return { data: newCompetition, error: null };
}

/**
 * Update a competition
 */
export async function updateCompetition(
    competitionId: string,
    title: string,
    questions: Question[],
    timeLimitPerQuestion: number = 30
): Promise<{ data: Competition | null; error: any }> {
    const { data, error } = await supabase
        .from('competitions')
        .update({
            title,
            questions,
            time_limit_per_question: timeLimitPerQuestion,
        })
        .eq('id', competitionId)
        .select()
        .single();

    return { data, error };
}

/**
 * Get competition by code
 */
export async function getCompetitionByCode(code: string): Promise<Competition | null> {
    const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching competition:', error);
        return null;
    }

    return data;
}

/**
 * Get all competitions created by a user
 */
export async function getUserCompetitions(userId: string): Promise<Competition[]> {
    const convertedId = phpIdToUuid(userId);
    console.log('[getUserCompetitions] Original userId:', userId);
    console.log('[getUserCompetitions] Converted UUID:', convertedId);

    const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('created_by', convertedId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user competitions:', error);
        return [];
    }

    console.log('[getUserCompetitions] Found competitions:', data?.length || 0);
    if (data && data.length > 0) {
        console.log('[getUserCompetitions] First competition created_by:', data[0].created_by);
    }

    return data || [];
}

/**
 * Join a competition
 */
/**
 * Join a competition
 */
export async function joinCompetition(
    competitionId: string,
    userId: string,
    userEmail: string,
    userName: string,
    sessionNumber: number = 1,
    isGuestUser: boolean = false
): Promise<{ data: Participant | null; error: any }> {
    const isGuest = isGuestUser || userId.startsWith('guest_');

    // Prepare payload based on user type
    const payload: any = {
        competition_id: competitionId,
        user_email: userEmail,
        user_name: userName,
        session_number: sessionNumber,
    };

    if (isGuest) {
        payload.guest_id = userId; // Assuming userId is now a valid UUID if calling as guest
        payload.user_id = null;
    } else {
        payload.user_id = phpIdToUuid(userId);
    }

    const { data, error } = await supabase
        .from('competition_participants')
        .insert(payload)
        .select()
        .single();

    return { data, error };
}

/**
 * Update participant answers and score
 */
export async function updateParticipantProgress(
    participantId: string,
    answers: any[],
    score: number,
    timeTaken: number
): Promise<{ error: any }> {
    const { error } = await supabase
        .from('competition_participants')
        .update({
            answers,
            score,
            time_taken: timeTaken,
        })
        .eq('id', participantId);

    return { error };
}

/**
 * Complete competition
 */
export async function completeCompetition(
    participantId: string,
    answers: any[],
    score: number,
    timeTaken: number
): Promise<{ error: any }> {
    const { error } = await supabase
        .from('competition_participants')
        .update({
            answers,
            score,
            time_taken: timeTaken,
            completed_at: new Date().toISOString(),
        })
        .eq('id', participantId);

    return { error };
}

/**
 * Get leaderboard for a competition (real-time)
 */
export async function getLeaderboard(competitionId: string): Promise<Participant[]> {
    const { data, error } = await supabase
        .from('competition_participants')
        .select('*')
        .eq('competition_id', competitionId)
        .order('score', { ascending: false })
        .order('time_taken', { ascending: true });

    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }

    return data || [];
}

/**
 * Subscribe to leaderboard changes (real-time)
 */
export function subscribeToLeaderboard(
    competitionId: string,
    callback: (payload: any) => void
) {
    return supabase
        .channel(`competition:${competitionId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'competition_participants',
                filter: `competition_id=eq.${competitionId}`,
            },
            callback
        )
        .subscribe();
}

/**
 * Calculate score based on answers
 */
export function calculateScore(answers: any[], questions: Question[]): number {
    let score = 0;
    answers.forEach((answer, index) => {
        if (questions[index] && answer.selectedOption === questions[index].correct_option) {
            score += 10; // 10 points per correct answer
        }
    });
    return score;
}

/**
 * Get options array from question
 */
export function getQuestionOptions(question: Question): string[] {
    return [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d
    ];
}

/**
 * Get correct option index (0-based) from correct_option letter
 */
export function getCorrectOptionIndex(correctOption: 'A' | 'B' | 'C' | 'D'): number {
    return correctOption.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
}

/**
 * Delete a competition
 */
export async function deleteCompetition(competitionId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', competitionId);

    return { error };
}

/**
 * Toggle competition active status
 */
export async function toggleCompetitionStatus(
    competitionId: string,
    isActive: boolean
): Promise<{ error: any }> {
    const { error } = await supabase
        .from('competitions')
        .update({ is_active: isActive })
        .eq('id', competitionId);

    return { error };
}

/**
 * Get participant by user and competition
 */
/**
 * Get participant by user and competition
 */
export async function getParticipant(
    competitionId: string,
    userId: string
): Promise<Participant | null> {
    const isGuest = userId.startsWith('guest_');

    let query = supabase
        .from('competition_participants')
        .select('*')
        .eq('competition_id', competitionId);

    if (isGuest) {
        query = query.eq('guest_id', userId);
    } else {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
        // Only log real errors, not "no rows found"
        if (error.code !== 'PGRST116') {
            console.error('Error fetching participant:', error);
        }
        return null;
    }

    return data;
}

/**
 * Start a scheduled competition (teacher action)
 */
export async function startCompetition(competitionId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('competitions')
        .update({
            actual_start_time: new Date().toISOString(),
            status: 'in_progress',
        })
        .eq('id', competitionId);

    return { error };
}

/**
 * Get leaderboard grouped by session
 */
export async function getLeaderboardBySession(
    competitionId: string,
    sessionNumber?: number
): Promise<Participant[]> {
    let query = supabase
        .from('competition_participants')
        .select('*')
        .eq('competition_id', competitionId);

    if (sessionNumber !== undefined) {
        query = query.eq('session_number', sessionNumber);
    }
    // If no session specified, could default to latest? 
    // For now, if undefined, it fetches all history which might be messy.
    // Ideally Dashboard should request specific session. 

    query = query
        .order('score', { ascending: false })
        .order('time_taken', { ascending: true });

    const { data, error } = await query;

    if (error) {
        if (error.code !== 'PGRST303') {
            console.error('Error fetching leaderboard:', error);
        }
        return [];
    }

    return data || [];
}

/**
 * Reactivate a finished competition (start new session)
 */
export async function reactivateCompetition(competitionId: string): Promise<{ error: any }> {
    // 1. Get current session number
    const { data: comp, error: fetchError } = await supabase
        .from('competitions')
        .select('session_number, type')
        .eq('id', competitionId)
        .single();

    if (fetchError || !comp) return { error: fetchError || new Error('Competition not found') };

    const newSession = (comp.session_number || 0) + 1;

    // 2. Reset competition to pending state with new session
    const { error: updateError } = await supabase
        .from('competitions')
        .update({
            session_number: newSession,
            is_active: true,
            status: 'pending',           // Reset to pending so students can see waiting room
            actual_start_time: null,      // Clear start time so it's not calculated as completed
            completed_at: null,
        })
        .eq('id', competitionId);

    return { error: updateError };
}

/**
 * Get all sessions for a competition
 */
export async function getCompetitionSessions(competitionId: string): Promise<number[]> {
    const { data, error } = await supabase
        .from('competition_participants')
        .select('session_number')
        .eq('competition_id', competitionId)
        .order('session_number', { ascending: true });

    if (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }

    // Get unique session numbers
    const sessions = Array.from(new Set(data?.map(p => p.session_number) || []));
    return sessions;
}

/**
 * Create a scheduled competition
 */
export async function createScheduledCompetition(
    title: string,
    questions: Question[],
    userId: string,
    scheduledStartTime: string,
    timeLimitPerQuestion: number = 30
): Promise<{ data: Competition | null; error: any }> {
    // Generate unique code
    let code = generateCompetitionCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
        const { data: existing } = await supabase
            .from('competitions')
            .select('code')
            .eq('code', code)
            .single();

        if (!existing) {
            isUnique = true;
        } else {
            code = generateCompetitionCode();
            attempts++;
        }
    }

    const { data, error } = await supabase
        .from('competitions')
        .insert({
            code,
            title,
            questions,
            created_by: userId,
            time_limit_per_question: timeLimitPerQuestion,
            scheduled_start_time: scheduledStartTime,
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Get available competitions (active or upcoming)
 */
export async function getAvailableCompetitions(): Promise<Competition[]> {
    const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching available competitions:', error);
        return [];
    }

    return data || [];
}

/**
 * Get user's competition history
 */
export async function getUserCompetitionHistory(userId: string): Promise<any[]> {
    // Determine if userId is UUID or PHP ID
    let query = supabase
        .from('competition_participants')
        .select('*, competitions(*)')
        .order('joined_at', { ascending: false });

    if (userId.includes('-')) {
        query = query.eq('user_id', userId);
    } else {
        // Fallback for old PHP IDs if needed, assuming user_id column handles it or we convert
        query = query.eq('user_id', phpIdToUuid(userId));
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching user history:', error);
        return [];
    }

    return data || [];
}

/**
 * Reset competition results (delete all participants)
 */
export async function resetCompetitionResults(competitionId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('competition_participants')
        .delete()
        .eq('competition_id', competitionId);

    return { error };
}
