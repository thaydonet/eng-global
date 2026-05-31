/**
 * Cloudinary Upload Utility
 * Handles image uploads to Cloudinary for blog comments
 */

const CLOUD_NAME = 'dp8hyy2nh';
const UPLOAD_PRESET = 'TDupsave';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadImage(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
    };
}

/**
 * Upload from a Data URL (base64)
 * Useful for pasted images from clipboard
 */
export async function uploadFromDataUrl(dataUrl: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
    };
}

/**
 * Convert a blob to data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Get optimized URL with transformations
 * Uses c_limit to only shrink images larger than maxWidth, keeps smaller images at original size
 */
export function getOptimizedUrl(url: string, options?: { maxWidth?: number; maxHeight?: number }): string {
    if (!url.includes('cloudinary.com')) return url;

    const transformations: string[] = ['f_auto', 'q_auto'];

    // Use c_limit to only shrink if larger, not enlarge small images
    if (options?.maxWidth || options?.maxHeight) {
        transformations.push('c_limit');
        if (options?.maxWidth) transformations.push(`w_${options.maxWidth}`);
        if (options?.maxHeight) transformations.push(`h_${options.maxHeight}`);
    }

    // Insert transformations into URL
    return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
}
