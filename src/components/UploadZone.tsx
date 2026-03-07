import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { HiOutlineCloudUpload } from 'react-icons/hi';

interface UploadZoneProps {
    onDrop: (files: File[]) => void;
    isUploading: boolean;
}

export default function UploadZone({ onDrop, isUploading }: UploadZoneProps) {
    const handleDrop = useCallback((accepted: File[]) => {
        if (accepted.length > 0) onDrop(accepted);
    }, [onDrop]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        disabled: isUploading,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            'video/*': ['.mp4', '.mov', '.webm'],
            'text/*': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        },
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
        transition-all duration-200 ${isDragActive
                    ? 'dropzone-active'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
          ${isDragActive ? 'bg-primary/20 text-primary' : 'bg-surface-3 text-text-muted'} transition-colors`}>
                    <HiOutlineCloudUpload size={28} />
                </div>
                <div>
                    <p className="text-sm font-medium text-white">
                        {isDragActive ? 'Drop files here!' : 'Drag & drop files here'}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        or click to browse · JPG, PNG, MP4, PDF, XLSX, TXT
                    </p>
                </div>
            </div>
        </div>
    );
}
