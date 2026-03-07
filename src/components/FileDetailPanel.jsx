import { useState, useEffect, useRef, useCallback } from 'react';
import {
    X, ExternalLink, Download, Copy, Trash2, FolderInput,
    Image, FileText, FileSpreadsheet, Link as LinkIcon,
    ChevronDown, Plus, Check, AlertTriangle
} from 'lucide-react';
import { formatFileSize } from '../utils/fileUtils';

/* ─── Constants ─── */
const KANBAN_OPTIONS = [
    { value: 'todo', label: 'Todo', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
    { value: 'in_progress', label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { value: 'review', label: 'Review', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { value: 'approved', label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
];

const TYPE_BADGE = {
    image: { label: 'IMAGE', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    video: { label: 'VIDEO', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    text: { label: 'TEXT', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    pdf: { label: 'PDF', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    xlsx: { label: 'XLSX', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    link: { label: 'LINK', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    other: { label: 'FILE', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

/* ─── Inject keyframes ─── */
if (typeof document !== 'undefined') {
    const STYLE_ID = 'file-detail-panel-keyframes';
    if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
      @keyframes fdp-slideIn {
        from { transform: translateX(100%); }
        to   { transform: translateX(0); }
      }
      @keyframes fdp-slideOut {
        from { transform: translateX(0); }
        to   { transform: translateX(100%); }
      }
      @keyframes fdp-fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes fdp-fadeOut {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
      @keyframes fdp-toast {
        0%   { opacity: 0; transform: translateY(8px); }
        15%  { opacity: 1; transform: translateY(0); }
        85%  { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-8px); }
      }
      @media (max-width: 768px) {
        .fdp-panel { width: 100% !important; }
      }
    `;
        document.head.appendChild(s);
    }
}

/* ─── Helpers ─── */
function getFileType(mimeType) {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'xlsx';
    if (mimeType.startsWith('text/') || mimeType.includes('word')) return 'text';
    return 'other';
}

function formatDate(d) {
    if (!d) return '';
    const date = d?.toDate ? d.toDate() : d instanceof Date ? d : new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function isImageMime(mimeType) {
    return mimeType?.startsWith('image/');
}

/* ─── Styles ─── */
const S = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.4)',
        animation: 'fdp-fadeIn 200ms ease-out forwards',
    },
    overlayClosing: {
        animation: 'fdp-fadeOut 200ms ease-in forwards',
    },
    panel: {
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 51,
        background: '#1a1a2e',
        borderLeft: '1px solid #2a2a3e',
        display: 'flex', flexDirection: 'column',
        animation: 'fdp-slideIn 250ms ease-out forwards',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
    },
    panelClosing: {
        animation: 'fdp-slideOut 200ms ease-in forwards',
    },
    closeBtn: {
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        width: 32, height: 32, borderRadius: 8,
        border: 'none', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        color: '#e0e0e0', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 200ms',
    },
    thumbContainer: {
        width: '100%', maxHeight: 220, overflow: 'hidden',
        borderRadius: '0 0 8px 8px', flexShrink: 0,
    },
    thumbImg: {
        width: '100%', height: 220, objectFit: 'cover', display: 'block',
    },
    iconPlaceholder: {
        width: '100%', height: 180,
        background: '#16213e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    body: {
        flex: 1, overflowY: 'auto', padding: '20px 20px 0',
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 11, fontWeight: 600, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 8,
    },
    row: {
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap',
    },
    badge: (color, bg) => ({
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 6,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        color, background: bg,
    }),
    metaText: {
        fontSize: 13, color: '#9ca3af',
    },
    // Inline rename
    fileName: {
        fontSize: 16, fontWeight: 700, color: '#e0e0e0',
        margin: 0, cursor: 'pointer',
        padding: '4px 0',
        wordBreak: 'break-word',
        lineHeight: 1.4,
        transition: 'color 200ms',
    },
    fileNameInput: {
        width: '100%', fontSize: 16, fontWeight: 700,
        color: '#e0e0e0', background: '#16213e',
        border: '1px solid #E8830C', borderRadius: 8,
        padding: '6px 10px', outline: 'none',
        fontFamily: 'inherit',
    },
    // Tags
    chip: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 20,
        fontSize: 12, fontWeight: 500,
        color: '#e0e0e0', background: '#2a2a3e',
        border: '1px solid #3a3a5a',
    },
    chipX: {
        cursor: 'pointer', color: '#6b7280',
        display: 'inline-flex', padding: 0, border: 'none', background: 'none',
        transition: 'color 200ms',
    },
    addTagBtn: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 20,
        fontSize: 12, color: '#6b7280',
        background: 'transparent', border: '1px dashed #4a4a6a',
        cursor: 'pointer', transition: 'all 200ms',
    },
    tagInput: {
        width: 100, fontSize: 12, padding: '4px 10px',
        borderRadius: 20, border: '1px solid #E8830C',
        background: '#16213e', color: '#e0e0e0',
        outline: 'none', fontFamily: 'inherit',
    },
    // Dropdown
    select: {
        width: '100%', fontSize: 13, padding: '8px 12px',
        borderRadius: 8, border: '1px solid #3a3a5a',
        background: '#16213e', color: '#e0e0e0',
        cursor: 'pointer', outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        transition: 'border-color 200ms',
    },
    // Links section
    linkBtn: {
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid #2a2a3e', background: 'transparent',
        color: '#e0e0e0', fontSize: 13, cursor: 'pointer',
        transition: 'all 200ms', textAlign: 'left',
    },
    // Bottom action bar
    actionBar: {
        display: 'flex', gap: 8, padding: '16px 20px',
        borderTop: '1px solid #2a2a3e', background: '#1a1a2e',
        flexShrink: 0,
    },
    actionBtn: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '10px 0', borderRadius: 10,
        border: '1px solid #3a3a5a', background: 'transparent',
        color: '#e0e0e0', fontSize: 12, fontWeight: 600,
        cursor: 'pointer', transition: 'all 200ms',
    },
    deleteBtn: {
        border: '1px solid rgba(239,68,68,0.3)',
        color: '#ef4444',
    },
    // Confirm dialog
    confirmOverlay: {
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
    },
    confirmBox: {
        width: '100%', maxWidth: 360, padding: 24, borderRadius: 16,
        background: '#1e1e36', border: '1px solid #2a2a3e',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    },
    // Toast
    toast: {
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 70, padding: '10px 20px', borderRadius: 10,
        background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600,
        animation: 'fdp-toast 2s ease-in-out forwards',
        boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
    },
};

/* ─── Component ─── */
export default function FileDetailPanel({
    file,
    isOpen,
    onClose,
    onUpdateFile,
    onDeleteFile,
    onMoveFile,
    asinList = [],
    currentUser,
}) {
    // Animation
    const [isClosing, setIsClosing] = useState(false);
    // Rename
    const [isRenaming, setIsRenaming] = useState(false);
    const [editName, setEditName] = useState('');
    const renameRef = useRef(null);
    // Tag add
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');
    const tagInputRef = useRef(null);
    // Delete confirm
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    // Kanban dropdown
    const [kanbanOpen, setKanbanOpen] = useState(false);
    // ASIN dropdown
    const [asinOpen, setAsinOpen] = useState(false);
    // Toast
    const [toast, setToast] = useState(null);
    // Hover states
    const [hovered, setHovered] = useState(null);

    // Reset state when file changes
    useEffect(() => {
        setIsRenaming(false);
        setIsAddingTag(false);
        setShowDeleteConfirm(false);
        setKanbanOpen(false);
        setAsinOpen(false);
        setIsClosing(false);
    }, [file?.id]);

    // Esc to close
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                if (isRenaming) { setIsRenaming(false); return; }
                if (showDeleteConfirm) { setShowDeleteConfirm(false); return; }
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, isRenaming, showDeleteConfirm]);

    // Focus rename input
    useEffect(() => {
        if (isRenaming && renameRef.current) {
            renameRef.current.focus();
            renameRef.current.select();
        }
    }, [isRenaming]);

    // Focus tag input
    useEffect(() => {
        if (isAddingTag && tagInputRef.current) {
            tagInputRef.current.focus();
        }
    }, [isAddingTag]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    }, [onClose]);

    if (!isOpen || !file) return null;

    const fileType = file.type || getFileType(file.mimeType);
    const badge = TYPE_BADGE[fileType] || TYPE_BADGE.other;
    const isImg = isImageMime(file.mimeType);
    const thumbnailSrc = file.thumbnailUrl
        || (file.driveFileId ? `https://drive.google.com/thumbnail?id=${file.driveFileId}&sz=w400` : null)
        || (file.driveId ? `https://drive.google.com/thumbnail?id=${file.driveId}&sz=w400` : null);
    const driveUrl = file.driveUrl || file.webViewLink || (file.driveFileId
        ? `https://drive.google.com/file/d/${file.driveFileId}/view`
        : file.driveId ? `https://drive.google.com/file/d/${file.driveId}/view` : '');
    const downloadLink = file.downloadUrl
        || (file.driveFileId ? `https://drive.google.com/uc?export=download&id=${file.driveFileId}` : '')
        || (file.driveId ? `https://drive.google.com/uc?export=download&id=${file.driveId}` : '');

    const currentKanban = KANBAN_OPTIONS.find(k => k.value === file.kanbanStatus) || KANBAN_OPTIONS[0];

    // Handlers
    const handleRenameSubmit = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== file.name && onUpdateFile) {
            onUpdateFile(file.id, { name: trimmed });
        }
        setIsRenaming(false);
    };

    const handleTagRemove = (tag) => {
        if (!onUpdateFile) return;
        const newTags = (file.tags || []).filter(t => t !== tag);
        onUpdateFile(file.id, { tags: newTags });
    };

    const handleTagAdd = () => {
        const trimmed = newTag.trim();
        if (!trimmed || !onUpdateFile) { setIsAddingTag(false); setNewTag(''); return; }
        const exists = (file.tags || []).includes(trimmed);
        if (!exists) {
            onUpdateFile(file.id, { tags: [...(file.tags || []), trimmed] });
        }
        setNewTag('');
        setIsAddingTag(false);
    };

    const handleKanbanChange = (value) => {
        if (onUpdateFile) onUpdateFile(file.id, { kanbanStatus: value });
        setKanbanOpen(false);
    };

    const handleAsinChange = (asinId) => {
        if (onUpdateFile) onUpdateFile(file.id, { asinId });
        setAsinOpen(false);
    };

    const handleCopyLink = () => {
        if (!driveUrl) return;
        navigator.clipboard.writeText(driveUrl);
        setToast('Đã copy!');
        setTimeout(() => setToast(null), 2000);
    };

    const handleDelete = () => {
        setShowDeleteConfirm(false);
        if (onDeleteFile) onDeleteFile(file.id);
        handleClose();
    };

    const hoverStyle = (key, base, extra = {}) => ({
        ...base,
        ...(hovered === key ? extra : {}),
    });

    const selectedAsin = asinList.find(a => a.id === file.asinId);

    return (
        <>
            {/* Backdrop */}
            <div
                style={{ ...S.overlay, ...(isClosing ? S.overlayClosing : {}) }}
                onClick={handleClose}
            />

            {/* Panel */}
            <div
                className="fdp-panel"
                style={{ ...S.panel, ...(isClosing ? S.panelClosing : {}) }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    style={hoverStyle('close', S.closeBtn, { background: 'rgba(255,255,255,0.15)', color: '#fff' })}
                    onMouseEnter={() => setHovered('close')}
                    onMouseLeave={() => setHovered(null)}
                    onClick={handleClose}
                >
                    <X size={18} />
                </button>

                {/* Header — Thumbnail or Icon */}
                {isImg && thumbnailSrc ? (
                    <div style={S.thumbContainer}>
                        <img
                            src={thumbnailSrc}
                            alt={file.name}
                            style={S.thumbImg}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                ) : (
                    <div style={S.iconPlaceholder}>
                        {fileType === 'pdf' && <FileText size={64} strokeWidth={1} color="#ef4444" />}
                        {fileType === 'xlsx' && <FileSpreadsheet size={64} strokeWidth={1} color="#f59e0b" />}
                        {fileType === 'text' && <FileText size={64} strokeWidth={1} color="#8b5cf6" />}
                        {fileType === 'video' && <FileText size={64} strokeWidth={1} color="#8b5cf6" />}
                        {fileType === 'link' && <LinkIcon size={64} strokeWidth={1} color="#f59e0b" />}
                        {(fileType === 'other' || fileType === 'image') && <Image size={64} strokeWidth={1} color="#6b7280" />}
                    </div>
                )}

                {/* Scrollable body */}
                <div style={S.body}>
                    {/* ── File name (click-to-edit) ── */}
                    <div style={S.section}>
                        {isRenaming ? (
                            <input
                                ref={renameRef}
                                style={S.fileNameInput}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit();
                                    if (e.key === 'Escape') setIsRenaming(false);
                                }}
                                onBlur={handleRenameSubmit}
                            />
                        ) : (
                            <h2
                                style={hoverStyle('filename', S.fileName, { color: '#E8830C' })}
                                onMouseEnter={() => setHovered('filename')}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => { setEditName(file.name); setIsRenaming(true); }}
                                title="Click để đổi tên"
                            >
                                {file.name}
                            </h2>
                        )}

                        {/* Type badge + size + date */}
                        <div style={{ ...S.row, marginTop: 10 }}>
                            <span style={S.badge(badge.color, badge.bg)}>{badge.label}</span>
                            <span style={S.metaText}>{formatFileSize(file.size || 0)}</span>
                            <span style={{ ...S.metaText, color: '#4a4a6a' }}>·</span>
                            <span style={S.metaText}>{formatDate(file.uploadedAt || file.createdAt)}</span>
                        </div>

                        {/* Uploaded by */}
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                            Uploaded bởi {file.uploadedBy?.displayName || file.uploadedBy || 'Unknown'}
                        </p>
                    </div>

                    {/* ── ASIN ── */}
                    <div style={S.section}>
                        <div style={S.sectionLabel}>ASIN</div>
                        <div style={{ position: 'relative' }}>
                            <button
                                style={{
                                    ...S.select,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    textAlign: 'left',
                                    borderColor: asinOpen ? '#E8830C' : '#3a3a5a',
                                }}
                                onClick={() => { setAsinOpen(!asinOpen); setKanbanOpen(false); }}
                            >
                                <span>
                                    {selectedAsin ? (
                                        <span>
                                            <span style={{ color: '#E8830C', fontWeight: 700, fontFamily: 'monospace', marginRight: 8 }}>
                                                {selectedAsin.code || selectedAsin.asin}
                                            </span>
                                            {selectedAsin.productName || selectedAsin.name}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#6b7280' }}>Chưa gán ASIN</span>
                                    )}
                                </span>
                                <ChevronDown size={14} color="#6b7280" />
                            </button>

                            {asinOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    marginTop: 4, borderRadius: 10, background: '#16213e',
                                    border: '1px solid #3a3a5a', maxHeight: 200, overflowY: 'auto', zIndex: 10,
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                                }}>
                                    <button
                                        style={{
                                            width: '100%', padding: '8px 14px', border: 'none', background: 'transparent',
                                            color: '#6b7280', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                                            borderBottom: '1px solid #2a2a3e',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3e'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        onClick={() => handleAsinChange(null)}
                                    >
                                        — Bỏ gán ASIN
                                    </button>
                                    {asinList.map((a) => (
                                        <button
                                            key={a.id}
                                            style={{
                                                width: '100%', padding: '8px 14px', border: 'none',
                                                background: file.asinId === a.id ? 'rgba(232,131,12,0.1)' : 'transparent',
                                                color: '#e0e0e0', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3e'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = file.asinId === a.id ? 'rgba(232,131,12,0.1)' : 'transparent'; }}
                                            onClick={() => handleAsinChange(a.id)}
                                        >
                                            <span style={{ color: '#E8830C', fontWeight: 700, fontFamily: 'monospace', minWidth: 80 }}>
                                                {a.code || a.asin}
                                            </span>
                                            <span style={{ color: '#9ca3af', fontSize: 12 }}>{a.productName || a.name}</span>
                                            {file.asinId === a.id && <Check size={14} color="#10b981" style={{ marginLeft: 'auto' }} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Tags ── */}
                    <div style={S.section}>
                        <div style={S.sectionLabel}>Tags</div>
                        <div style={{ ...S.row, gap: 6 }}>
                            {(file.tags || []).map((tag) => (
                                <span key={tag} style={S.chip}>
                                    #{tag}
                                    <button
                                        style={S.chipX}
                                        onClick={() => handleTagRemove(tag)}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            {isAddingTag ? (
                                <input
                                    ref={tagInputRef}
                                    style={S.tagInput}
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTagAdd();
                                        if (e.key === 'Escape') { setIsAddingTag(false); setNewTag(''); }
                                    }}
                                    onBlur={handleTagAdd}
                                    placeholder="Tag mới..."
                                />
                            ) : (
                                <button
                                    style={hoverStyle('addtag', S.addTagBtn, { borderColor: '#E8830C', color: '#E8830C' })}
                                    onMouseEnter={() => setHovered('addtag')}
                                    onMouseLeave={() => setHovered(null)}
                                    onClick={() => setIsAddingTag(true)}
                                >
                                    <Plus size={12} /> Thêm
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Kanban Status ── */}
                    <div style={S.section}>
                        <div style={S.sectionLabel}>Trạng thái</div>
                        <div style={{ position: 'relative' }}>
                            <button
                                style={{
                                    ...S.select,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    borderColor: kanbanOpen ? '#E8830C' : '#3a3a5a',
                                }}
                                onClick={() => { setKanbanOpen(!kanbanOpen); setAsinOpen(false); }}
                            >
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: currentKanban.color, flexShrink: 0,
                                }} />
                                <span>{currentKanban.label}</span>
                                <ChevronDown size={14} color="#6b7280" style={{ marginLeft: 'auto' }} />
                            </button>

                            {kanbanOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    marginTop: 4, borderRadius: 10, background: '#16213e',
                                    border: '1px solid #3a3a5a', overflow: 'hidden', zIndex: 10,
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                                }}>
                                    {KANBAN_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            style={{
                                                width: '100%', padding: '10px 14px', border: 'none',
                                                background: file.kanbanStatus === opt.value ? opt.bg : 'transparent',
                                                color: '#e0e0e0', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = opt.bg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = file.kanbanStatus === opt.value ? opt.bg : 'transparent'; }}
                                            onClick={() => handleKanbanChange(opt.value)}
                                        >
                                            <span style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: opt.color, flexShrink: 0,
                                            }} />
                                            <span>{opt.label}</span>
                                            {file.kanbanStatus === opt.value && (
                                                <Check size={14} color={opt.color} style={{ marginLeft: 'auto' }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Links ── */}
                    <div style={S.section}>
                        <div style={S.sectionLabel}>Links</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button
                                style={hoverStyle('drive', S.linkBtn, { borderColor: '#E8830C', color: '#E8830C' })}
                                onMouseEnter={() => setHovered('drive')}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => driveUrl && window.open(driveUrl, '_blank', 'noopener')}
                            >
                                <ExternalLink size={16} />
                                <span>Mở trong Google Drive</span>
                            </button>
                            <button
                                style={hoverStyle('copy', S.linkBtn, { borderColor: '#E8830C', color: '#E8830C' })}
                                onMouseEnter={() => setHovered('copy')}
                                onMouseLeave={() => setHovered(null)}
                                onClick={handleCopyLink}
                            >
                                <Copy size={16} />
                                <span>Copy link</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Bottom action bar ── */}
                <div style={S.actionBar}>
                    <a
                        href={downloadLink}
                        download
                        style={hoverStyle('dl', S.actionBtn, { borderColor: '#E8830C', color: '#E8830C' })}
                        onMouseEnter={() => setHovered('dl')}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <Download size={14} /> Tải xuống
                    </a>
                    {onMoveFile && (
                        <button
                            style={hoverStyle('move', S.actionBtn, { borderColor: '#E8830C', color: '#E8830C' })}
                            onMouseEnter={() => setHovered('move')}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => onMoveFile(file.id)}
                        >
                            <FolderInput size={14} /> Di chuyển
                        </button>
                    )}
                    <button
                        style={hoverStyle('del', { ...S.actionBtn, ...S.deleteBtn }, {
                            background: 'rgba(239,68,68,0.15)', borderColor: '#ef4444',
                        })}
                        onMouseEnter={() => setHovered('del')}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 size={14} /> Xóa
                    </button>
                </div>
            </div>

            {/* ── Delete confirmation ── */}
            {showDeleteConfirm && (
                <div style={S.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div style={S.confirmBox} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: 'rgba(239,68,68,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <AlertTriangle size={20} color="#ef4444" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>Xóa file này?</h3>
                                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Hành động không thể hoàn tác</p>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
                            File <strong style={{ color: '#e0e0e0' }}>"{file.name}"</strong> cũng sẽ bị xóa khỏi Google Drive.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                style={{
                                    padding: '8px 18px', borderRadius: 10, border: 'none',
                                    background: 'transparent', color: '#9ca3af', fontSize: 13,
                                    fontWeight: 500, cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3e'; e.currentTarget.style.color = '#e0e0e0'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                style={{
                                    padding: '8px 18px', borderRadius: 10, border: 'none',
                                    background: '#ef4444', color: '#fff', fontSize: 13,
                                    fontWeight: 600, cursor: 'pointer', transition: 'background 200ms',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
                                onClick={handleDelete}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <div style={S.toast}>{toast}</div>}
        </>
    );
}
