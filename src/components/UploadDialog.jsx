import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    X, Upload, CloudUpload, Plus, ChevronDown, Check,
    Image as ImageIcon, FileText, FileSpreadsheet, Film,
    File as FileIcon, Search, FolderPlus, AlertTriangle, RefreshCw,
    ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { formatFileSize, detectFileType } from '../utils/fileUtils';

/* ═════════════════════════════════════════════════════════════
   Constants & Helpers
   ═════════════════════════════════════════════════════════════ */

const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.png', '.mp4', '.pdf', '.xlsx', '.xls', '.txt'];
const MAX_SIZE = 200 * 1024 * 1024;       // 200 MB hard block
const WARN_SIZE = 50 * 1024 * 1024;        // 50 MB warning

const IMAGE_TYPES = ['GENERAL', 'MAIN', 'LIFESTYLE', 'DETAIL', 'SWATCH', 'VARIANT', 'CUSTOM'];

const TYPE_ICONS = {
    image: { Icon: ImageIcon, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    video: { Icon: Film, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    text: { Icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    pdf: { Icon: FileText, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    xlsx: { Icon: FileSpreadsheet, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    other: { Icon: FileIcon, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
    link: { Icon: FileIcon, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

function getFileExt(name) {
    return (name || '').split('.').pop()?.toLowerCase() || '';
}

function isAcceptedFile(file) {
    const ext = '.' + getFileExt(file.name);
    return ACCEPTED_EXTS.includes(ext);
}

function getTypePrefixFromFile(file) {
    const t = detectFileType(file);
    const map = { image: 'IMG', video: 'VID', text: 'TXT', pdf: 'PDF', xlsx: 'XLS' };
    return map[t] || 'FILE';
}

function generateFileName(file, asinCode, imageType, customText, index, totalFiles) {
    const ext = getFileExt(file.name);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = getTypePrefixFromFile(file);
    const isImg = prefix === 'IMG';

    // suffix for multiple files (only if bulk apply is used or total > 1 but we want distinct names)
    // Actually the logic: if totalFiles > 1, add _01, _02
    const suffix = totalFiles > 1 ? `_${String(index + 1).padStart(2, '0')}` : '';

    if (!isImg) {
        return `FILE_${date}${suffix}.${ext}`;
    }

    const typeStr = imageType === 'CUSTOM' ? (customText || 'CUSTOM') : imageType;
    if (asinCode) {
        return `${asinCode}_${typeStr}_V1_${date}${suffix}.${ext}`;
    }
    return `IMG_${typeStr}_${date}${suffix}.${ext}`;
}

/* ═════════════════════════════════════════════════════════════
   Inject CSS
   ═════════════════════════════════════════════════════════════ */

if (typeof document !== 'undefined') {
    const STYLE_ID = 'upload-dialog-styles';
    if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
      @keyframes ud-scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes ud-fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes ud-spin {
        to { transform: rotate(360deg); }
      }
      .ud-scroll::-webkit-scrollbar { width: 4px; }
      .ud-scroll::-webkit-scrollbar-track { background: transparent; }
      .ud-scroll::-webkit-scrollbar-thumb { background: #3a3a5a; border-radius: 4px; }
      .ud-scroll::-webkit-scrollbar-thumb:hover { background: #5a5a7a; }
      
      .gradient-progress-bar {
          background: linear-gradient(90deg, #E8830C, #f59e0b);
          background-size: 200% 100%;
          animation: gradient-move 2s linear infinite;
      }
      @keyframes gradient-move {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
      }
    `;
        document.head.appendChild(s);
    }
}

/* ═════════════════════════════════════════════════════════════
   FileThumbnail (small sub-component)
   ═════════════════════════════════════════════════════════════ */

function FileThumbnail({ file, size = 60 }) {
    const [preview, setPreview] = useState(null);
    const type = detectFileType(file);
    const cfg = TYPE_ICONS[type] || TYPE_ICONS.other;

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    if (preview) {
        return (
            <div style={{
                width: size, height: size, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                border: '1px solid #2a2a3e', background: '#0d1117'
            }}>
                <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            </div>
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: cfg.bg, border: '1px solid #2a2a3e',
        }}>
            <cfg.Icon size={size * 0.4} color={cfg.color} />
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════
   Big Image Preview Area (New UI)
   ═════════════════════════════════════════════════════════════ */

function BigImagePreview({ ObjectUrls }) {
    if (!ObjectUrls || ObjectUrls.length === 0) return null;

    if (ObjectUrls.length === 1) {
        return (
            <div style={{ width: '100%', maxHeight: 250, borderRadius: 8, background: '#0d1117', border: '1px solid #2a2a3e', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <img src={ObjectUrls[0]} style={{ width: '100%', height: 250, objectFit: 'contain' }} />
            </div>
        );
    }

    // Grid 2x2 for multiple
    const displayUrls = ObjectUrls.slice(0, 4);
    const extra = ObjectUrls.length > 4 ? ObjectUrls.length - 4 : 0;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {displayUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: '100%', height: 120, borderRadius: 8, background: '#0d1117', border: '1px solid #2a2a3e', overflow: 'hidden' }}>
                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    {i === 3 && extra > 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                            +{extra}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════
   Styles
   ═════════════════════════════════════════════════════════════ */

const S = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(26,26,46,0.85)', backdropFilter: 'blur(4px)',
        animation: 'ud-fadeIn 200ms ease-out',
    },
    dialog: {
        position: 'relative', width: '100%', maxWidth: 580,
        maxHeight: '85vh', background: '#16213e',
        borderRadius: 16, border: '1px solid #2a2a3e',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'ud-scaleIn 200ms ease-out',
        boxShadow: '0 32px 128px rgba(0,0,0,0.5)',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #2a2a3e', flexShrink: 0,
    },
    headerLeft: {
        display: 'flex', alignItems: 'center', gap: 12,
    },
    headerIcon: {
        width: 40, height: 40, borderRadius: 12,
        background: 'linear-gradient(135deg, #E8830C, #f59e0b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(232,131,12,0.25)',
    },
    closeBtn: {
        width: 32, height: 32, borderRadius: 8, border: 'none',
        background: 'transparent', color: '#6b7280', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 200ms',
    },
    body: {
        flex: 1, overflowY: 'auto', padding: '0 24px 24px',
    },
    dropzone: (active) => ({
        border: `2px dashed ${active ? '#E8830C' : '#3a3a5a'}`,
        borderRadius: 12, padding: '48px 24px',
        textAlign: 'center', cursor: 'pointer',
        transition: 'all 200ms', marginTop: 20,
        background: active ? 'rgba(232,131,12,0.05)' : 'transparent',
    }),
    sectionTitle: {
        fontSize: 11, fontWeight: 600, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 10, marginTop: 20,
        display: 'flex', alignItems: 'center', gap: 6,
    },
    fileRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 12, transition: 'background 150ms',
        border: '1px solid #2a2a3e', background: 'rgba(26,26,46,0.5)',
    },
    input: {
        width: '100%', fontSize: 13, padding: '10px 14px',
        borderRadius: 8, border: '1px solid #3a3a5a',
        background: '#1a1a2e', color: '#e0e0e0', outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 200ms',
    },
    select: {
        width: '100%', fontSize: 13, padding: '10px 14px',
        borderRadius: 8, border: '1px solid #3a3a5a',
        background: '#1a1a2e', color: '#e0e0e0', cursor: 'pointer',
        appearance: 'none', outline: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        transition: 'border-color 200ms',
    },
    label: {
        fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 6, display: 'block',
    },
    chip: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
        color: '#e0e0e0', background: '#1a1a2e', border: '1px solid #3a3a5a',
    },
    primaryBtn: (disabled) => ({
        padding: '12px 24px', borderRadius: 10, minWidth: 120,
        border: 'none', fontSize: 14, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#2a2a3e' : '#E8830C',
        color: disabled ? '#6b7280' : '#1a1a1a',
        transition: 'all 200ms', opacity: disabled ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }),
    secondaryBtn: {
        padding: '8px 16px', borderRadius: 8, border: '1px solid #3a3a5a',
        background: 'transparent', color: '#e0e0e0', fontSize: 12,
        fontWeight: 500, cursor: 'pointer', transition: 'all 200ms',
        display: 'inline-flex', alignItems: 'center', gap: 6,
    },
    statusIcon: {
        width: 24, height: 24, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 14,
    },
    footer: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderTop: '1px solid #2a2a3e', flexShrink: 0, background: '#16213e'
    },
};

/* ═════════════════════════════════════════════════════════════
   UploadDialog Component
   ═════════════════════════════════════════════════════════════ */

export default function UploadDialog({
    isOpen,
    onClose,
    currentFolderId,
    currentFolderName,
    folderList = [],
    asinList = [],
    onUploadFiles,
}) {
    /* ── State: file selection ── */
    const [files, setFiles] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [imageUrls, setImageUrls] = useState([]);

    /* ── State: target folder ── */
    const [targetFolderId, setTargetFolderId] = useState(currentFolderId || '');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    /* ── State: Settings & Bulk Apply ── */
    const [isBulkApply, setIsBulkApply] = useState(true);

    // Global settings (used if isBulkApply is true)
    const [globalAsin, setGlobalAsin] = useState('');
    const [globalImageType, setGlobalImageType] = useState('GENERAL');
    const [globalCustomType, setGlobalCustomType] = useState('');
    const [globalTags, setGlobalTags] = useState([]);

    // Per-file settings (used if isBulkApply is false)
    // Structure: { [fileIndex]: { asin, imageType, customText, tags } }
    const [perFileSettings, setPerFileSettings] = useState({});

    // UI States
    const [showAsinPicker, setShowAsinPicker] = useState(false);
    const [asinSearch, setAsinSearch] = useState('');
    const asinSearchRef = useRef(null);
    const [tagInput, setTagInput] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const tagInputRef = useRef(null);

    // Per-file UI states
    const [expandedFileIndex, setExpandedFileIndex] = useState(0);

    /* ── State: upload progress ── */
    const [isUploading, setIsUploading] = useState(false);
    const [fileStatuses, setFileStatuses] = useState({});
    const [uploadComplete, setUploadComplete] = useState(false);

    /* ── Drag & Drop refs ── */
    const dropRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isDragActive, setIsDragActive] = useState(false);

    /* ── Lifecycle ── */
    useEffect(() => {
        setTargetFolderId(currentFolderId || '');
    }, [currentFolderId]);

    useEffect(() => {
        if (isOpen) {
            setFiles([]);
            setValidationErrors({});
            setImageUrls([]);
            setTargetFolderId(currentFolderId || '');
            setGlobalAsin('');
            setGlobalImageType('GENERAL');
            setGlobalCustomType('');
            setGlobalTags([]);
            setPerFileSettings({});
            setIsBulkApply(true);
            setExpandedFileIndex(0);
            setIsUploading(false);
            setFileStatuses({});
            setUploadComplete(false);
        } else {
            imageUrls.forEach(url => URL.revokeObjectURL(url));
        }
    }, [isOpen]);

    useEffect(() => {
        if (showAsinPicker) setTimeout(() => asinSearchRef.current?.focus(), 50);
    }, [showAsinPicker]);

    useEffect(() => {
        if (isAddingTag) setTimeout(() => tagInputRef.current?.focus(), 50);
    }, [isAddingTag]);

    /* ── Handlers: File selection ── */
    const addFiles = useCallback((newFiles) => {
        const errors = {};
        const valid = [];
        const newUrls = [];
        newFiles.forEach((file) => {
            if (!isAcceptedFile(file)) {
                errors[file.name] = 'Loại file không được hỗ trợ';
            } else if (file.size > MAX_SIZE) {
                errors[file.name] = `File quá lớn (>${formatFileSize(MAX_SIZE)})`;
            } else {
                valid.push(file);
                if (file.size > WARN_SIZE) {
                    errors[file.name] = `⚠️ File lớn: ${formatFileSize(file.size)}`;
                }
                if (file.type.startsWith('image/')) {
                    newUrls.push(URL.createObjectURL(file));
                }
            }
        });
        setFiles(prev => [...prev, ...valid]);
        setImageUrls(prev => [...prev, ...newUrls]);
        setValidationErrors(prev => ({ ...prev, ...errors }));

        // initialize per-file metadata
        setPerFileSettings(prev => {
            const next = { ...prev };
            for (let i = Object.keys(prev).length; i < Object.keys(prev).length + valid.length; i++) {
                next[i] = { asin: '', imageType: 'GENERAL', customText: '', tags: [] };
            }
            return next;
        });
    }, []);

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setImageUrls(prev => {
            // Need to map the valid URLs to indices... it's a bit complex. For simplicity:
            // Revoke all and regenerate is safer, but just removing from array might misalign if not all are images.
            // Let's just revoke all and regenerate them.
            prev.forEach(u => URL.revokeObjectURL(u));
            return [];
        });
        // We defer regenerate imageUrls to useEffect
    };

    // Auto-regenerate imageUrls when files change (handle removal)
    useEffect(() => {
        const urls = [];
        files.forEach(f => {
            if (f.type.startsWith('image/')) {
                urls.push(URL.createObjectURL(f));
            }
        });
        setImageUrls(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [files]);

    /* ── Esc & Paste ── */
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape' && !isUploading) onClose(); };
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const pasted = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const f = items[i].getAsFile();
                    if (f) pasted.push(f);
                }
            }
            if (pasted.length) { e.preventDefault(); addFiles(pasted); }
        };
        document.addEventListener('keydown', handleKey);
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('paste', handlePaste);
        };
    }, [isOpen, isUploading, files]);

    const handleDragEnter = useCallback((e) => { e.preventDefault(); setIsDragActive(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragActive(false); }, []);
    const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault(); setIsDragActive(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length) addFiles(dropped);
    }, [addFiles]);

    /* ── Upload ── */
    const buildPayload = () => {
        return files.map((file, i) => {
            const settings = isBulkApply ? {
                asin: globalAsin, imageType: globalImageType, customText: globalCustomType, tags: globalTags
            } : (perFileSettings[i] || { asin: '', imageType: 'GENERAL', customText: '', tags: [] });

            const asinCode = settings.asin ? asinList.find(a => a.id === settings.asin)?.code : null;
            const name = generateFileName(file, asinCode, settings.imageType, settings.customText, i, files.length);

            return {
                file,
                name,
                folderId: targetFolderId,
                asinId: settings.asin || null,
                tags: [...settings.tags],
            };
        });
    };

    const handleUpload = async () => {
        if (files.length === 0 || isUploading) return;
        setIsUploading(true); setUploadComplete(false);

        const payload = buildPayload();
        const initialStatuses = {};
        payload.forEach((_, i) => { initialStatuses[i] = 'pending'; });
        setFileStatuses(initialStatuses);

        try {
            for (let i = 0; i < payload.length; i++) {
                setFileStatuses(prev => ({ ...prev, [i]: 'uploading' }));
                try {
                    if (onUploadFiles) await onUploadFiles([payload[i]]);
                    setFileStatuses(prev => ({ ...prev, [i]: 'syncing' }));
                    await new Promise(r => setTimeout(r, 200));
                    setFileStatuses(prev => ({ ...prev, [i]: 'done' }));
                } catch {
                    setFileStatuses(prev => ({ ...prev, [i]: 'error' }));
                }
            }
        } catch { } // fallback

        setUploadComplete(true);
    };

    /* ── Progress Variables ── */
    const doneCount = Object.values(fileStatuses).filter(s => s === 'done').length;
    const errorCount = Object.values(fileStatuses).filter(s => s === 'error').length;
    const totalProgress = files.length > 0 ? Math.round(((Object.values(fileStatuses).filter(s => s === 'done' || s === 'syncing').length + doneCount) / (files.length * 2)) * 100) : 0;
    const allDone = uploadComplete && doneCount === files.length;
    const hasErrors = errorCount > 0;
    const totalSize = files.reduce((s, f) => s + f.size, 0);

    /* ── Render ── */
    if (!isOpen) return null;

    const filteredAsins = asinSearch ? asinList.filter(a =>
        (a.code || a.asin || '').toLowerCase().includes(asinSearch.toLowerCase()) ||
        (a.productName || a.name || '').toLowerCase().includes(asinSearch.toLowerCase())
    ) : asinList;

    const renderStatusIcon = (status) => {
        switch (status) {
            case 'uploading':
                return <div style={{ ...S.statusIcon, background: 'rgba(232,131,12,0.15)' }}><Loader2 size={12} color="#E8830C" style={{ animation: 'ud-spin 1s linear infinite' }} /></div>;
            case 'syncing':
                return <div style={{ ...S.statusIcon, background: 'rgba(59,130,246,0.15)' }}><CloudUpload size={12} color="#3b82f6" /></div>;
            case 'done':
                return <div style={{ ...S.statusIcon, background: 'rgba(16,185,129,0.15)' }}>✅</div>;
            case 'error':
                return <div style={{ ...S.statusIcon, background: 'rgba(239,68,68,0.15)' }}>❌</div>;
            default:
                return <div style={{ ...S.statusIcon, background: 'rgba(107,114,128,0.1)' }}>⏳</div>;
        }
    };

    return (
        <div style={S.overlay} onClick={isUploading ? undefined : onClose}>
            <div style={S.dialog} onClick={e => e.stopPropagation()}>
                {/* ── Header ── */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <div style={S.headerIcon}>
                            <Upload size={20} color="#1a1a1a" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e0e0e0' }}>Upload Files</h2>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                                {files.length > 0 ? `${files.length} file(s) · ${formatFileSize(totalSize)}` : `Upload vào ${currentFolderName || 'folder'}`}
                            </p>
                        </div>
                    </div>
                    <button style={S.closeBtn} onClick={isUploading ? undefined : onClose} disabled={isUploading}>
                        <X size={18} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="ud-scroll" style={{ ...S.body, padding: '24px' }}>

                    {!isUploading && !uploadComplete && files.length === 0 && (
                        <div
                            ref={dropRef} style={S.dropzone(isDragActive)}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver} onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef} type="file" multiple accept={ACCEPTED_EXTS.join(',')}
                                style={{ display: 'none' }} onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CloudUpload size={28} color="#E8830C" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>{isDragActive ? 'Thả file ở đây' : 'Kéo thả file hoặc click để chọn'}</p>
                                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6b7280' }}>Paste ảnh bằng ⌘V · Hỗ trợ chọn nhiều file</p>
                                </div>
                                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', padding: '4px 12px', borderRadius: 20, background: '#1a1a2e', border: '1px solid #2a2a3e' }}>
                                    JPG · PNG · MP4 · PDF · XLSX · TXT
                                </span>
                            </div>
                        </div>
                    )}

                    {!isUploading && !uploadComplete && files.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* File List & Big Preview */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Danh sách file ({files.length})</span>
                                    <label style={{ cursor: 'pointer', color: '#E8830C', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Plus size={14} /> Thêm file
                                        <input type="file" multiple accept={ACCEPTED_EXTS.join(',')} style={{ display: 'none' }}
                                            onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
                                    </label>
                                </div>

                                {files.slice(0, isBulkApply ? files.length : 1).map((file, i) => (
                                    <div key={i} style={{ ...S.fileRow, marginBottom: 8 }}>
                                        <FileThumbnail file={file} size={40} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{formatFileSize(file.size)}</p>
                                        </div>
                                        <button style={{ ...S.closeBtn, width: 24, height: 24 }} onClick={() => removeFile(i)}><X size={14} /></button>
                                    </div>
                                ))}

                                {/* Large Image Preview */}
                                {imageUrls.length > 0 && (
                                    <BigImagePreview ObjectUrls={imageUrls} />
                                )}
                            </div>

                            <div style={{ height: 1, background: '#2a2a3e', margin: '8px 0' }} />

                            {/* Section: Upload Target */}
                            <div>
                                <label style={S.label}>Upload vào thư mục</label>
                                <select style={S.select} value={targetFolderId} onChange={e => setTargetFolderId(e.target.value)}>
                                    {folderList.map(f => <option key={f.id} value={f.id}>{f.path || f.name}</option>)}
                                    <option value="_new">+ Tạo folder mới</option>
                                </select>
                            </div>

                            {/* Section: Metadata & Auto-naming */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>Cấu hình Metadata</span>
                                    {files.length > 1 && (
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: isBulkApply ? '#E8830C' : '#6b7280', fontSize: 12 }}
                                            onClick={() => setIsBulkApply(!isBulkApply)}
                                        >
                                            <span>Áp dụng chung tất cả</span>
                                            {isBulkApply ? <ToggleRight size={20} color="#E8830C" /> : <ToggleLeft size={20} />}
                                        </div>
                                    )}
                                </div>

                                {isBulkApply ? (
                                    /* Bulk Apply UI */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(26,26,46,0.5)', padding: 16, borderRadius: 12, border: '1px solid #2a2a3e' }}>
                                        <div>
                                            <label style={S.label}>Product (ASIN)</label>
                                            <div style={{ position: 'relative' }}>
                                                <button type="button" style={{ ...S.select, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: showAsinPicker ? '#E8830C' : '#3a3a5a' }} onClick={() => setShowAsinPicker(!showAsinPicker)}>
                                                    <span style={{ color: globalAsin ? '#e0e0e0' : '#6b7280' }}>
                                                        {globalAsin ? (() => { const a = asinList.find(x => x.id === globalAsin); return a ? `${a.code || a.asin}` : globalAsin; })() : '— Chọn ASIN —'}
                                                    </span>
                                                    <ChevronDown size={14} color="#6b7280" />
                                                </button>
                                                {showAsinPicker && (
                                                    <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, zIndex: 20, background: '#16213e', border: '1px solid #3a3a5a', borderRadius: 8, maxHeight: 180, overflowY: 'auto' }}>
                                                        <button style={{ width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', color: '#9ca3af', textAlign: 'left', cursor: 'pointer' }} onClick={() => { setGlobalAsin(''); setShowAsinPicker(false); }}>— Không chọn —</button>
                                                        {asinList.map(a => (
                                                            <button key={a.id} style={{ width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', color: '#e0e0e0', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 8 }} onClick={() => { setGlobalAsin(a.id); setShowAsinPicker(false); }}>
                                                                <span style={{ color: '#E8830C', fontFamily: 'monospace' }}>{a.code || a.asin}</span>
                                                                <span style={{ color: '#9ca3af' }}>{a.productName || a.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={S.label}>Loại ảnh / Phân loại</label>
                                                <select style={S.select} value={globalImageType} onChange={e => setGlobalImageType(e.target.value)}>
                                                    {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            {globalImageType === 'CUSTOM' && (
                                                <div style={{ flex: 1 }}>
                                                    <label style={S.label}>Loại custom</label>
                                                    <input style={S.input} value={globalCustomType} onChange={e => setGlobalCustomType(e.target.value)} placeholder="Nhập tên..." />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label style={S.label}>Tên file sau upload (Auto-generated)</label>
                                            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(232,131,12,0.08)', border: '1px solid rgba(232,131,12,0.2)', fontSize: 13, fontFamily: 'monospace', color: '#E8830C', wordBreak: 'break-all' }}>
                                                {generateFileName(files[0], globalAsin ? asinList.find(a => a.id === globalAsin)?.code : null, globalImageType, globalCustomType, 0, files.length)}
                                            </div>
                                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>Tên gốc: {files[0].name}</p>
                                        </div>

                                        <div>
                                            <label style={S.label}>Tags</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                {globalTags.map(tag => (
                                                    <span key={tag} style={S.chip}>
                                                        #{tag}
                                                        <button style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', padding: 0 }} onClick={() => setGlobalTags(prev => prev.filter(t => t !== tag))}><X size={12} /></button>
                                                    </span>
                                                ))}
                                                {isAddingTag ? (
                                                    <input ref={tagInputRef} style={{ ...S.input, width: 120, padding: '4px 10px', fontSize: 12, borderRadius: 20 }} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setGlobalTags(prev => [...prev.filter(t => t !== tagInput.trim()), tagInput.trim()]); setIsAddingTag(false); setTagInput(''); } if (e.key === 'Escape') setIsAddingTag(false); }} onBlur={() => { if (tagInput.trim()) { setGlobalTags(prev => [...prev.filter(t => t !== tagInput.trim()), tagInput.trim()]); } setIsAddingTag(false); setTagInput(''); }} placeholder="Tag mới..." />
                                                ) : (
                                                    <button style={S.secondaryBtn} onClick={() => setIsAddingTag(true)}><Plus size={12} /> Thêm tag</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Individual File Settings */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {files.map((file, i) => {
                                            const settings = perFileSettings[i] || { asin: '', imageType: 'GENERAL', customText: '', tags: [] };
                                            return (
                                                <div key={i} style={{ borderRadius: 12, border: '1px solid #2a2a3e', background: 'rgba(26,26,46,0.5)', overflow: 'hidden' }}>
                                                    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedFileIndex === i ? '#1a1a2e' : 'transparent' }} onClick={() => setExpandedFileIndex(i)}>
                                                        <span style={{ fontSize: 13, fontWeight: expandedFileIndex === i ? 600 : 500, color: expandedFileIndex === i ? '#E8830C' : '#e0e0e0' }}>File {i + 1}: {file.name}</span>
                                                        <ChevronDown size={14} color="#6b7280" style={{ transform: expandedFileIndex === i ? 'rotate(180deg)' : 'none' }} />
                                                    </div>

                                                    {expandedFileIndex === i && (
                                                        <div style={{ padding: 16, borderTop: '1px solid #2a2a3e', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            <div style={{ display: 'flex', gap: 12 }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <label style={S.label}>ASIN</label>
                                                                    <select style={S.select} value={settings.asin} onChange={e => setPerFileSettings(prev => ({ ...prev, [i]: { ...prev[i], asin: e.target.value } }))}>
                                                                        <option value="">— Không chọn —</option>
                                                                        {asinList.map(a => <option key={a.id} value={a.id}>{a.code || a.asin}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <label style={S.label}>Loại ảnh</label>
                                                                    <select style={S.select} value={settings.imageType} onChange={e => setPerFileSettings(prev => ({ ...prev, [i]: { ...prev[i], imageType: e.target.value } }))}>
                                                                        {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={S.label}>Tên auto-generated</label>
                                                                <div style={{ padding: '8px 12px', borderRadius: 6, background: '#12121f', border: '1px solid #3a3a5a', fontSize: 12, fontFamily: 'monospace', color: '#9ca3af' }}>
                                                                    {generateFileName(file, settings.asin ? asinList.find(a => a.id === settings.asin)?.code : null, settings.imageType, settings.customText, i, files.length)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ Progress & Result ═══ */}
                    {(isUploading || uploadComplete) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
                            {!allDone && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0' }}>Đang xử lý tải lên...</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#E8830C' }}>{totalProgress}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#1a1a2e', overflow: 'hidden' }}>
                                        <div className="gradient-progress-bar" style={{ width: `${totalProgress}%`, height: '100%', borderRadius: 4, transition: 'width 300ms ease-out' }} />
                                    </div>
                                </div>
                            )}

                            {allDone && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Check size={32} color="#10b981" />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e0e0e0' }}>✅ Đã upload {files.length} files thành công!</h3>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {files.map((file, i) => {
                                    const status = fileStatuses[i] || 'pending';
                                    return (
                                        <div key={i} style={{ ...S.fileRow, justifyContent: 'space-between', background: status === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(26,26,46,0.6)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                                {renderStatusIcon(status)}
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>
                                                        {status === 'pending' ? 'Chờ upload...' : status === 'uploading' ? 'Đang upload lên Drive...' : status === 'syncing' ? 'Đang lưu metadata...' : status === 'done' ? 'Thành công' : 'Lỗi'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={S.footer}>
                    <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>📋 Tip: Paste ảnh bằng ⌘V</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {(!isUploading && !uploadComplete) && (
                            <button style={{ ...S.secondaryBtn, border: 'none' }} onClick={onClose}>Huỷ</button>
                        )}
                        {uploadComplete && allDone ? (
                            <button style={S.primaryBtn(false)} onClick={onClose}>Đóng</button>
                        ) : !isUploading ? (
                            <button style={S.primaryBtn(files.length === 0)} disabled={files.length === 0} onClick={handleUpload}>
                                <Upload size={16} /> Upload
                            </button>
                        ) : (
                            <button style={S.primaryBtn(true)} disabled>
                                Đang xử lý...
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
