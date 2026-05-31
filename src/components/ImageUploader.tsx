import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadImage, getOptimizedUrl } from '@/lib/cloudinary';

interface ImageUploaderProps {
    onImageUploaded: (url: string) => void;
    disabled?: boolean;
}

interface UploadedImage {
    url: string;
    uploading: boolean;
    error?: string;
}

export default function ImageUploader({ onImageUploaded, disabled }: ImageUploaderProps) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleUpload = useCallback(async (file: File) => {
        const placeholderIndex = images.length;
        setImages(prev => [...prev, { url: '', uploading: true }]);

        try {
            const result = await uploadImage(file);
            const optimizedUrl = getOptimizedUrl(result.url, { maxWidth: 800 });

            setImages(prev => prev.map((img, i) =>
                i === placeholderIndex ? { url: optimizedUrl, uploading: false } : img
            ));

            onImageUploaded(optimizedUrl);
        } catch (error) {
            setImages(prev => prev.map((img, i) =>
                i === placeholderIndex ? { url: '', uploading: false, error: (error as Error).message } : img
            ));
        }
    }, [images.length, onImageUploaded]);

    // Handle paste from clipboard - listen on document level
    useEffect(() => {
        const handleGlobalPaste = async (e: ClipboardEvent) => {
            if (disabled) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    if (blob) {
                        await handleUpload(blob);
                    }
                    return;
                }
            }
        };

        document.addEventListener('paste', handleGlobalPaste);
        return () => document.removeEventListener('paste', handleGlobalPaste);
    }, [handleUpload, disabled]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                await handleUpload(file);
            }
        }
    }, [handleUpload]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                handleUpload(file);
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="mt-2" ref={containerRef}>
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled}
                />

                <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-blue-600 dark:text-blue-400">Chọn ảnh</span> hoặc kéo thả vào đây
                    </div>
                    <div className="text-xs text-gray-500">
                        Hoặc <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+V</kbd> để dán ảnh từ clipboard
                    </div>
                </div>
            </div>

            {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {images.map((img, index) => (
                        <div key={index} className="relative group">
                            {img.uploading ? (
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : img.error ? (
                                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 border border-red-300 rounded-lg flex items-center justify-center" title={img.error}>
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={img.url}
                                        alt="Uploaded"
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
