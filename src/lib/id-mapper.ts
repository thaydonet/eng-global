/**
 * ID Mapper - Chuyển đổi giữa PHP Auth ID (số) và Supabase UUID
 * Giải pháp: Tạo UUID cố định từ ID số để tương thích với Supabase
 */

import { v5 as uuidv5 } from 'uuid';

// Namespace UUID cố định cho hệ thống (có thể thay đổi)
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Chuyển đổi ID số (từ PHP) thành UUID cố định
 * Ví dụ: "14" -> "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 */
export function phpIdToUuid(phpId: string | number): string {
    const idString = String(phpId);

    // Nếu đã là UUID, trả về nguyên bản
    if (isUuid(idString)) {
        return idString;
    }

    // Tạo UUID từ ID số (deterministic - luôn cho cùng kết quả)
    return uuidv5(idString, NAMESPACE);
}

/**
 * Kiểm tra xem một string có phải UUID không
 */
function isUuid(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}
