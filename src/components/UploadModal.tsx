import { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    HiX, HiOutlineTag, HiOutlineUpload, HiCheck,
    HiOutlineCloudUpload, HiOutlinePhotograph, HiOutlineVideoCamera,
    HiOutlineDocumentText, HiOutlineDocument, HiOutlineClipboardCopy,
    HiOutlineSearch, HiOutlineChevronDown,
} from 'react-icons/hi';
import { detectFileType, formatFileSize, suggestFileName } from '../utils/fileUtils';
import type { FileType, Label, AsinItem } from '../types';

interface UploadModalProps {
    files: File[];
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: {
        file: File;
        name: string;
        tags: string[];
        asin: string | null;
        category: string;
    }) => void;
    uploadProgress: number;
    isUploading: boolean;
    uploadSuccess: boolean;
    onFilesSelected: (files: File[]) => void;
    appLabels: Label[];
    appAsins: AsinItem[];
    onManageAsins: () => void;
}

/* ── File Type helpers ───────────────────────────────────── */

const typeConfig: Record<FileType, { icon: typeof HiOutlinePhotograph; color: string; bg: string }> = {
    image: { icon: HiOutlinePhotograph, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    video: { icon: HiOutlineVideoCamera, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    text: { icon: HiOutlineDocumentText, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    pdf: { icon: HiOutlineDocument, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    xlsx: { icon: HiOutlineDocumentText, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    link: { icon: HiOutlineDocument, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
    other: { icon: HiOutlineDocument, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

/* ── File Thumbnail ──────────────────────────────────────── */

function FileThumbnail({ file }: { file: File }) {
    const [preview, setPreview] = useState<string | null>(null);
    const type = detectFileType(file);
    const Icon = typeConfig[type].icon;

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        return undefined;
    }, [file]);

    if (preview) {
        return (
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                <img src={preview} alt="" className="w-full h-full object-cover" />
            </div>
        );
    }
    return (
        <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: typeConfig[type].bg }}>
            <Icon size={20} color={typeConfig[type].color} />
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────── */

export default function UploadModal({
    files, isOpen, onClose, onUpload, uploadProgress, isUploading, uploadSuccess, onFilesSelected,
    appLabels, appAsins, onManageAsins,
}: UploadModalProps) {
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [fileName, setFileName] = useState('');
    const [selectedAsin, setSelectedAsin] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [showTagPicker, setShowTagPicker] = useState(false);
    const [showAsinPicker, setShowAsinPicker] = useState(false);
    const [asinSearch, setAsinSearch] = useState('');
    const asinSearchRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentFile = files[currentFileIndex] || null;

    // ── Update filename when file/ASIN change ──
    useEffect(() => {
        if (currentFile) {
            const type = detectFileType(currentFile);
            const ext = currentFile.name.split('.').pop() || '';
            let productName = null;
            if (selectedAsin) {
                const a = appAsins.find(p => (p.asin || p.code) === selectedAsin);
                if (a) productName = a.productName || a.name || null;
            }
            const nameBase = suggestFileName(type, selectedAsin || null, '', '', productName);
            setFileName(`${nameBase}.${ext}`.replace(/_+/g, '_').replace(/_\./g, '.'));
        }
    }, [currentFile, selectedAsin, appAsins]);

    // ── Reset state when files change ──
    useEffect(() => {
        setCurrentFileIndex(0);
        setTags([]);
    }, [files]);

    // ── Dropzone ──
    const handleDrop = useCallback((accepted: File[]) => {
        if (accepted.length > 0) onFilesSelected(accepted);
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        disabled: isUploading,
        noClick: files.length > 0,
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

    // ── Paste handler ──
    useEffect(() => {
        if (!isOpen) return;
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const pastedFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) pastedFiles.push(file);
                }
            }
            if (pastedFiles.length > 0) {
                e.preventDefault();
                onFilesSelected(pastedFiles);
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [isOpen, onFilesSelected]);

    // ── Tag management ──
    const toggleTag = (tagId: string) => {
        setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
    };

    const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

    // ── Submit ──
    const handleSubmit = () => {
        if (!currentFile) return;
        onUpload({
            file: currentFile,
            name: fileName,
            tags,
            asin: selectedAsin || null,
            category: selectedAsin ? `Products/${selectedAsin}/Images` : 'Learning/General',
        });
    };

    if (!isOpen) return null;

    const hasFiles = files.length > 0;
    const totalSize = files.reduce((s, f) => s + f.size, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                ref={containerRef}
                className="relative w-full max-w-xl bg-surface rounded-2xl border border-border overflow-hidden
                    shadow-[0_32px_128px_rgba(0,0,0,0.5)] animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600
                            flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <HiOutlineUpload size={20} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Upload Files</h2>
                            <p className="text-xs text-text-muted">
                                {hasFiles ? `${files.length} file · ${formatFileSize(totalSize)}` : 'Chọn file để upload'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-surface-3 transition-all">
                        <HiX size={18} />
                    </button>
                </div>

                {/* Success state */}
                {uploadSuccess ? (
                    <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
                        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                            <HiCheck size={32} className="text-success" />
                        </div>
                        <p className="text-lg font-semibold text-white">Upload thành công!</p>
                        <p className="text-sm text-text-muted mt-1">File đã được lưu vào Drive</p>
                        <button onClick={onClose}
                            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-surface-3 hover:bg-surface-2 transition-all">
                            Đóng
                        </button>
                    </div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto sidebar-scroll">
                        {/* Dropzone or file list */}
                        <div className="px-6 pt-4">
                            {!hasFiles ? (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-2xl py-16 text-center cursor-pointer transition-all duration-200
                                        ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border-light hover:border-primary/50 hover:bg-surface-3/50'}`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center">
                                            <HiOutlineCloudUpload size={28} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-secondary">
                                                {isDragActive ? 'Thả file ở đây' : 'Kéo thả file hoặc click để chọn'}
                                            </p>
                                            <p className="text-xs text-text-muted mt-1">
                                                Paste ảnh bằng ⌘V
                                            </p>
                                        </div>
                                        <p className="text-[10px] font-mono text-text-muted px-3 py-1 rounded-full bg-surface-3 border border-border">
                                            JPG · PNG · MP4 · PDF · XLSX · TXT
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* File list */
                                <div className="space-y-2">
                                    {files.map((file, i) => {
                                        const type = detectFileType(file);
                                        const isActive = i === currentFileIndex;
                                        return (
                                            <div
                                                key={`${file.name}-${i}`}
                                                onClick={() => setCurrentFileIndex(i)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150
                                                    ${isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-3 border border-transparent'}`}
                                            >
                                                <FileThumbnail file={file} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-text-muted mt-0.5">
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                                                            style={{ background: typeConfig[type].bg, color: typeConfig[type].color }}>
                                                            {type}
                                                        </span>
                                                        <span className="ml-2">{formatFileSize(file.size)}</span>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const updated = files.filter((_, idx) => idx !== i);
                                                        onFilesSelected(updated);
                                                        if (currentFileIndex >= updated.length) setCurrentFileIndex(Math.max(0, updated.length - 1));
                                                    }}
                                                    className="shrink-0 text-text-muted hover:text-error transition-colors p-1"
                                                >
                                                    <HiX size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {/* Add more files */}
                                    <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border-light
                                        text-xs font-medium text-text-muted hover:text-white hover:border-primary/50 cursor-pointer transition-all">
                                        <HiOutlineCloudUpload size={14} />
                                        Thêm file
                                        <input
                                            type="file" multiple className="hidden"
                                            onChange={(e) => {
                                                const newFiles = Array.from(e.target.files || []);
                                                if (newFiles.length > 0) onFilesSelected([...files, ...newFiles]);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* File details form */}
                        {hasFiles && currentFile && (
                            <div className="px-6 pb-4 pt-3 space-y-3.5 animate-fade-in">
                                <div className="flex items-center gap-2 text-xs text-text-muted pt-1 pb-0.5">
                                    <div className="flex-1 h-px bg-border" />
                                    <span>Chi tiết{files.length > 1 ? ` (${currentFileIndex + 1}/${files.length})` : ''}</span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>

                                {/* File name */}
                                <div>
                                    <label className="text-xs font-medium text-text-secondary mb-1 block">Tên file</label>
                                    <input
                                        type="text"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-3 border border-border
                                            text-white font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>

                                {/* ASIN selector */}
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-medium text-text-secondary">Product (ASIN)</label>
                                        <button onClick={onManageAsins}
                                            className="text-[10px] text-primary hover:text-primary/80 transition-colors font-medium">
                                            Quản lý ASIN
                                        </button>
                                    </div>

                                    {/* Custom searchable ASIN selector */}
                                    <button
                                        type="button"
                                        onClick={() => { setShowAsinPicker(!showAsinPicker); setAsinSearch(''); setTimeout(() => asinSearchRef.current?.focus(), 50); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm bg-surface-3 border
                                            text-white outline-none transition-all
                                            ${showAsinPicker ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}
                                    >
                                        <span className={selectedAsin ? 'text-white' : 'text-text-muted'}>
                                            {selectedAsin
                                                ? (() => { const a = appAsins.find(p => (p.asin || p.code) === selectedAsin); return a ? `${a.asin || a.code} — ${a.name || a.productName}` : selectedAsin; })()
                                                : '— Chọn ASIN —'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {selectedAsin && (
                                                <span onClick={(e) => { e.stopPropagation(); setSelectedAsin(''); }}
                                                    className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-all">
                                                    <HiX size={12} />
                                                </span>
                                            )}
                                            <HiOutlineChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${showAsinPicker ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {showAsinPicker && (
                                        <div className="absolute left-0 right-0 mt-1 bg-surface-2 border border-border rounded-xl
                                            shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20 animate-fade-in overflow-hidden">
                                            {/* Search input */}
                                            <div className="p-2 border-b border-border">
                                                <div className="relative">
                                                    <HiOutlineSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                                                    <input
                                                        ref={asinSearchRef}
                                                        type="text"
                                                        value={asinSearch}
                                                        onChange={(e) => setAsinSearch(e.target.value)}
                                                        placeholder="Tìm ASIN hoặc tên..."
                                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-surface-3 border border-border
                                                            text-white outline-none focus:border-primary transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Options */}
                                            <div className="max-h-[180px] overflow-y-auto sidebar-scroll p-1">
                                                {/* None option */}
                                                <button
                                                    onClick={() => { setSelectedAsin(''); setShowAsinPicker(false); }}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all
                                                        ${!selectedAsin ? 'bg-primary/10 text-white' : 'text-text-muted hover:bg-surface-3 hover:text-white'}`}
                                                >
                                                    — Không chọn —
                                                </button>

                                                {appAsins
                                                    .filter(p =>
                                                        (p.asin || p.code || '').toLowerCase().includes(asinSearch.toLowerCase()) ||
                                                        (p.name || p.productName || '').toLowerCase().includes(asinSearch.toLowerCase())
                                                    )
                                                    .map((p, idx) => {
                                                        const pCode = p.asin || p.code || `asin-${idx}`;
                                                        const pName = p.name || p.productName || '';
                                                        return (
                                                            <button key={pCode}
                                                                onClick={() => { setSelectedAsin(pCode); setShowAsinPicker(false); }}
                                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all
                                                                ${selectedAsin === pCode ? 'bg-primary/10' : 'hover:bg-surface-3'}`}
                                                            >
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono
                                                                bg-primary/15 text-primary border border-primary/20 shrink-0">
                                                                    {pCode}
                                                                </span>
                                                                <span className={`flex-1 text-left truncate ${selectedAsin === pCode ? 'text-white font-medium' : 'text-text-secondary'}`}>
                                                                    {pName}
                                                                </span>
                                                                {selectedAsin === pCode && <HiCheck size={14} className="text-primary shrink-0" />}
                                                            </button>
                                                        )
                                                    })}

                                                {appAsins.filter(p =>
                                                    (p.asin || p.code || '').toLowerCase().includes(asinSearch.toLowerCase()) ||
                                                    (p.name || p.productName || '').toLowerCase().includes(asinSearch.toLowerCase())
                                                ).length === 0 && asinSearch && (
                                                        <div className="px-3 py-4 text-center text-xs text-text-muted">
                                                            Không tìm thấy "{asinSearch}"
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tags — label picker */}
                                <div>
                                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">Tags</label>

                                    {/* Selected tags */}
                                    {tags.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                            {tags.map((tagId) => {
                                                const lbl = appLabels.find(l => l.id === tagId);
                                                return (
                                                    <span key={tagId}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                                                        style={lbl ? { backgroundColor: `${lbl.color}20`, color: lbl.color, border: `1px solid ${lbl.color}40` } : {
                                                            backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)'
                                                        }}>
                                                        {lbl ? lbl.name : `#${tagId}`}
                                                        <button onClick={() => removeTag(tagId)} className="hover:text-error transition-colors">
                                                            <HiX size={10} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Tag picker toggle */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowTagPicker(!showTagPicker)}
                                            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs bg-surface-3 border border-border
                                                text-text-muted hover:text-white hover:border-primary/30 transition-all"
                                        >
                                            <HiOutlineTag size={14} />
                                            Chọn tag...
                                        </button>

                                        {showTagPicker && (
                                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-2 border border-border rounded-xl
                                                shadow-[0_-8px_32px_rgba(0,0,0,0.4)] z-10 max-h-[200px] overflow-y-auto sidebar-scroll animate-fade-in">
                                                {appLabels.length === 0 ? (
                                                    <div className="px-3 py-4 text-center text-xs text-text-muted">
                                                        Chưa có tag. Tạo ở phần Nhãn.
                                                    </div>
                                                ) : (
                                                    <div className="p-2 space-y-0.5">
                                                        {appLabels.map(lbl => {
                                                            const isSelected = tags.includes(lbl.id);
                                                            return (
                                                                <button key={lbl.id} onClick={() => toggleTag(lbl.id)}
                                                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all
                                                                        ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-3'}`}>
                                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lbl.color }} />
                                                                    <span className={`flex-1 text-left ${isSelected ? 'text-white font-medium' : 'text-text-secondary'}`}>
                                                                        {lbl.name}
                                                                    </span>
                                                                    {isSelected && <HiCheck size={14} className="text-primary shrink-0" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress */}
                                {isUploading && (
                                    <div className="animate-fade-in">
                                        <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                                            <span>Đang upload lên Drive...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {!uploadSuccess && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                        <p className="text-[10px] text-text-muted flex items-center gap-1.5">
                            <HiOutlineClipboardCopy size={12} />
                            Tip: Paste ảnh bằng ⌘V
                        </p>
                        <div className="flex gap-3">
                            <button onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary
                                    hover:text-white hover:bg-surface-3 transition-all">
                                Huỷ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isUploading || !hasFiles || !fileName}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                                    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                style={{
                                    background: hasFiles ? 'linear-gradient(135deg, #FF9900, #E88B00)' : 'var(--color-surface-3)',
                                    color: hasFiles ? '#1a1a1a' : 'var(--color-text-muted)',
                                }}
                            >
                                <HiOutlineUpload size={16} />
                                {isUploading ? 'Đang upload...' : `Upload ${files.length > 1 ? `(${files.length})` : ''}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
