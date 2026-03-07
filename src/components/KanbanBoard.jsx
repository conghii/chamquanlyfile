import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Camera, Paintbrush, CheckCircle, Upload, Globe,
    FileText, Eye, Send, BookOpen, ListTodo, Loader, Check as CheckIcon,
    Plus, MoreHorizontal, X, Pencil, Palette, Trash2, ChevronDown, GripVertical,
} from 'lucide-react';
import { formatFileSize } from '../utils/fileUtils';

/* ═════════════════════════════════════════════════════════════
   Constants
   ═════════════════════════════════════════════════════════════ */

const ICON_MAP = {
    Camera, Paintbrush, CheckCircle, Upload, Globe,
    FileText, Eye, Send, BookOpen, ListTodo, Loader,
    Check: CheckIcon, GripVertical,
};

const PRESET_COLORS = [
    '#6366f1', '#f59e0b', '#3b82f6', '#E8830C', '#22c55e', '#ef4444',
];

const COLOR_NAMES = {
    '#6366f1': 'Tím',
    '#f59e0b': 'Vàng',
    '#3b82f6': 'Xanh dương',
    '#E8830C': 'Cam',
    '#22c55e': 'Xanh lá',
    '#ef4444': 'Đỏ',
};

const PRESETS = [
    {
        id: 'amazon',
        title: 'Amazon Product Images',
        desc: 'Chụp ảnh → Chỉnh sửa → QC → Upload → Live',
        columns: [
            { id: 'chup_anh', title: 'Chụp ảnh', icon: 'Camera', color: '#6366f1' },
            { id: 'chinh_sua', title: 'Chỉnh sửa', icon: 'Paintbrush', color: '#f59e0b' },
            { id: 'qc', title: 'QC', icon: 'CheckCircle', color: '#3b82f6' },
            { id: 'upload_amazon', title: 'Upload Amazon', icon: 'Upload', color: '#E8830C' },
            { id: 'da_live', title: 'Đã Live', icon: 'Globe', color: '#22c55e' },
        ],
    },
    {
        id: 'content',
        title: 'Content Review',
        desc: 'Draft → Review → Approved → Published',
        columns: [
            { id: 'draft', title: 'Draft', icon: 'FileText', color: '#6366f1' },
            { id: 'review', title: 'Review', icon: 'Eye', color: '#f59e0b' },
            { id: 'approved', title: 'Approved', icon: 'CheckCircle', color: '#22c55e' },
            { id: 'published', title: 'Published', icon: 'Send', color: '#3b82f6' },
        ],
    },
    {
        id: 'general',
        title: 'Tổng quát',
        desc: 'To Do → In Progress → Done',
        columns: [
            { id: 'todo', title: 'To Do', icon: 'ListTodo', color: '#6366f1' },
            { id: 'in_progress', title: 'In Progress', icon: 'Loader', color: '#f59e0b' },
            { id: 'done', title: 'Done', icon: 'CheckCircle', color: '#22c55e' },
        ],
    },
    {
        id: 'custom',
        title: 'Tùy chỉnh',
        desc: 'Bắt đầu với 1 cột To Do',
        columns: [
            { id: 'todo', title: 'To Do', icon: 'ListTodo', color: '#6366f1' },
        ],
    },
];

const MAX_COLUMNS = 7;

/* ═════════════════════════════════════════════════════════════
   Inject CSS
   ═════════════════════════════════════════════════════════════ */

if (typeof document !== 'undefined') {
    const STYLE_ID = 'kanban-board-styles';
    if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
      @keyframes kb-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes kb-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      @keyframes kb-slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      .kb-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
      .kb-scroll::-webkit-scrollbar-track { background: transparent; }
      .kb-scroll::-webkit-scrollbar-thumb { background: #3a3a5a; border-radius: 3px; }
      .kb-scroll::-webkit-scrollbar-thumb:hover { background: #5a5a7a; }
      @media (max-width: 768px) {
        .kb-columns { flex-direction: column !important; overflow-x: visible !important; }
        .kb-column  { min-width: 100% !important; max-width: 100% !important; }
      }
    `;
        document.head.appendChild(s);
    }
}

/* ═════════════════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════════════════ */

function timeAgo(date) {
    if (!date) return '';
    const d = date?.toDate ? date.toDate() : date instanceof Date ? date : new Date(date);
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 60) return 'vừa xong';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} ngày trước`;
    return d.toLocaleDateString('vi-VN');
}

function getIcon(name) {
    return ICON_MAP[name] || ListTodo;
}

function generateId(title) {
    return title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || `col_${Date.now()}`;
}

/* ═════════════════════════════════════════════════════════════
   Styles
   ═════════════════════════════════════════════════════════════ */

const S = {
    board: {
        display: 'flex', gap: 12, overflowX: 'auto',
        paddingBottom: 8, minHeight: 300,
    },
    column: (color, isOver) => ({
        display: 'flex', flexDirection: 'column',
        minWidth: 250, maxWidth: 300, flex: '1 0 250px',
        borderRadius: 16, overflow: 'hidden',
        background: isOver ? 'rgba(232,131,12,0.04)' : '#12121f',
        border: `1px solid ${isOver ? '#E8830C' : '#2a2a3e'}`,
        transition: 'all 250ms ease',
        borderTop: `3px solid ${color}`,
    }),
    colHeader: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px 10px', position: 'relative',
    },
    colTitle: {
        fontSize: 13, fontWeight: 600, color: '#e0e0e0', flex: 1,
        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    colBadge: {
        fontSize: 10, fontWeight: 700, padding: '2px 7px',
        borderRadius: 10, background: '#1a1a2e', color: '#6b7280',
    },
    colBody: {
        flex: 1, overflowY: 'auto', padding: '8px 10px 12px',
        minHeight: 120,
    },
    // File card
    card: (isDragging) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        background: '#16213e', border: '1px solid #2a2a3e',
        marginBottom: 8, cursor: 'grab',
        transition: 'all 200ms ease',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.96)' : 'none',
    }),
    cardThumb: {
        width: 40, height: 40, borderRadius: 8,
        overflow: 'hidden', flexShrink: 0,
        objectFit: 'cover', display: 'block',
    },
    cardPlaceholder: (color) => ({
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}15`,
    }),
    // Empty column
    emptyCol: (isOver) => ({
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 12px', borderRadius: 10,
        border: `2px dashed ${isOver ? '#E8830C' : '#2a2a3e'}`,
        background: isOver ? 'rgba(232,131,12,0.04)' : 'transparent',
        transition: 'all 200ms',
    }),
    // Add column button
    addCol: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minWidth: 200, borderRadius: 16, padding: 24,
        border: '2px dashed #2a2a3e', cursor: 'pointer',
        transition: 'all 200ms', background: 'transparent',
    },
    // Menu
    menu: {
        position: 'absolute', top: '100%', right: 8, marginTop: 4,
        zIndex: 30, background: '#16213e', border: '1px solid #3a3a5a',
        borderRadius: 12, padding: 4, minWidth: 160,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        animation: 'kb-scaleIn 150ms ease-out',
    },
    menuItem: {
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: 'none', background: 'transparent',
        color: '#e0e0e0', fontSize: 12, cursor: 'pointer',
        textAlign: 'left', transition: 'background 150ms',
    },
    // Confirm dialog
    confirmOverlay: {
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        animation: 'kb-fadeIn 200ms ease-out',
    },
    confirmBox: {
        width: '100%', maxWidth: 380, padding: 24, borderRadius: 16,
        background: '#16213e', border: '1px solid #2a2a3e',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        animation: 'kb-scaleIn 200ms ease-out',
    },
    // Template dialog
    templateOverlay: {
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(26,26,46,0.9)', backdropFilter: 'blur(4px)',
        animation: 'kb-fadeIn 200ms ease-out',
    },
    templateDialog: {
        width: '100%', maxWidth: 520, padding: 32, borderRadius: 20,
        background: '#16213e', border: '1px solid #2a2a3e',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        animation: 'kb-scaleIn 200ms ease-out',
    },
    // Mobile dropdown
    mobileSelect: {
        fontSize: 11, padding: '4px 8px', borderRadius: 6,
        border: '1px solid #3a3a5a', background: '#1a1a2e',
        color: '#e0e0e0', cursor: 'pointer', outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
        paddingRight: 20,
    },
};

/* ═════════════════════════════════════════════════════════════
   KanbanCard sub-component
   ═════════════════════════════════════════════════════════════ */

function KanbanCard({ file, columns, onFileClick, onMoveFile }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
    const hasThumb = file.thumbnailUrl && (file.type === 'image' || file.mimeType?.startsWith('image/'));

    const typeColors = {
        image: '#10b981', video: '#8b5cf6', text: '#3b82f6',
        pdf: '#ef4444', xlsx: '#f59e0b', other: '#6b7280', link: '#06b6d4',
    };
    const typeColor = typeColors[file.type] || '#6b7280';

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', file.id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
    };
    const handleDragEnd = () => setIsDragging(false);

    const handleMobileMove = (e) => {
        const newStatus = e.target.value;
        if (newStatus && newStatus !== file.kanbanStatus) {
            onMoveFile(file.id, newStatus);
        }
    };

    return (
        <div
            draggable={!isMobile}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => onFileClick(file)}
            style={{
                ...S.card(isDragging),
                animation: 'kb-slideUp 200ms ease-out',
            }}
            onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.borderColor = '#4a4a6a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3e'; }}
        >
            {/* Thumbnail */}
            {hasThumb ? (
                <img src={file.thumbnailUrl} alt="" style={S.cardThumb} draggable={false} />
            ) : (
                <div style={S.cardPlaceholder(typeColor)}>
                    <FileText size={18} color={typeColor} />
                </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: 12, fontWeight: 500, color: '#e0e0e0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={file.name}>
                    {file.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    {(file.asin || file.asinId) && (
                        <span style={{
                            fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
                            padding: '1px 5px', borderRadius: 4,
                            background: 'rgba(232,131,12,0.12)', color: '#E8830C',
                            border: '1px solid rgba(232,131,12,0.2)',
                        }}>
                            {file.asin || file.asinId}
                        </span>
                    )}
                    <span style={{ fontSize: 10, color: '#6b7280' }}>
                        {timeAgo(file.updatedAt || file.createdAt)}
                    </span>
                </div>
            </div>

            {/* Mobile: dropdown to move */}
            {isMobile && (
                <select
                    value={file.kanbanStatus || ''}
                    onChange={handleMobileMove}
                    onClick={(e) => e.stopPropagation()}
                    style={S.mobileSelect}
                >
                    {columns.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════
   KanbanColumn sub-component
   ═════════════════════════════════════════════════════════════ */

function KanbanColumn({
    column, files, allColumns, isFirst,
    onMoveFile, onFileClick, onRename, onChangeColor, onDelete,
}) {
    const [isOver, setIsOver] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [editTitle, setEditTitle] = useState(column.title);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const menuRef = useRef(null);
    const renameRef = useRef(null);

    const IconComp = getIcon(column.icon);

    // Close menu on outside click
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    // Focus rename input
    useEffect(() => {
        if (isRenaming) setTimeout(() => renameRef.current?.focus(), 50);
    }, [isRenaming]);

    // Drag handlers
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsOver(true); };
    const handleDragLeave = () => setIsOver(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsOver(false);
        const fileId = e.dataTransfer.getData('text/plain');
        if (fileId) onMoveFile(fileId, column.id);
    };

    const handleRenameSubmit = () => {
        const trimmed = editTitle.trim();
        if (trimmed && trimmed !== column.title) onRename(column.id, trimmed);
        setIsRenaming(false);
    };

    return (
        <div
            className="kb-column"
            style={S.column(column.color, isOver)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div style={S.colHeader}>
                <IconComp size={16} color={column.color} />
                {isRenaming ? (
                    <input
                        ref={renameRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit();
                            if (e.key === 'Escape') setIsRenaming(false);
                        }}
                        onBlur={handleRenameSubmit}
                        style={{
                            flex: 1, fontSize: 13, fontWeight: 600,
                            background: '#1a1a2e', border: '1px solid #E8830C',
                            borderRadius: 6, padding: '2px 8px', color: '#e0e0e0',
                            outline: 'none', fontFamily: 'inherit',
                        }}
                    />
                ) : (
                    <h3 style={S.colTitle}>{column.title}</h3>
                )}
                <span style={S.colBadge}>{files.length}</span>

                {/* Menu button */}
                <button
                    onClick={() => { setShowMenu(!showMenu); setShowColorPicker(false); }}
                    style={{
                        width: 24, height: 24, borderRadius: 6, border: 'none',
                        background: 'transparent', color: '#6b7280', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.style.color = '#e0e0e0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                >
                    <MoreHorizontal size={14} />
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                    <div ref={menuRef} style={S.menu}>
                        <button
                            style={S.menuItem}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            onClick={() => {
                                setShowMenu(false);
                                setEditTitle(column.title);
                                setIsRenaming(true);
                            }}
                        >
                            <Pencil size={13} /> Đổi tên
                        </button>
                        <button
                            style={S.menuItem}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                        >
                            <Palette size={13} /> Đổi màu
                        </button>
                        {showColorPicker && (
                            <div style={{ display: 'flex', gap: 6, padding: '6px 12px', flexWrap: 'wrap' }}>
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { onChangeColor(column.id, c); setShowMenu(false); setShowColorPicker(false); }}
                                        title={COLOR_NAMES[c]}
                                        style={{
                                            width: 24, height: 24, borderRadius: '50%', border: 'none',
                                            background: c, cursor: 'pointer',
                                            outline: column.color === c ? '2px solid #fff' : 'none',
                                            outlineOffset: 2, transition: 'transform 150ms',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                    />
                                ))}
                            </div>
                        )}
                        {!isFirst && (
                            <>
                                <div style={{ margin: '4px 8px', borderTop: '1px solid #2a2a3e' }} />
                                <button
                                    style={{ ...S.menuItem, color: '#ef4444' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    onClick={() => { setShowMenu(false); onDelete(column.id); }}
                                >
                                    <Trash2 size={13} /> Xóa cột
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Body — cards */}
            <div className="kb-scroll" style={S.colBody}>
                {files.length === 0 ? (
                    <div style={S.emptyCol(isOver)}>
                        <IconComp size={24} color={isOver ? '#E8830C' : '#3a3a5a'} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: 12, color: isOver ? '#E8830C' : '#6b7280' }}>
                            {isOver ? 'Thả vào đây!' : 'Kéo file vào đây'}
                        </p>
                    </div>
                ) : (
                    files.map(file => (
                        <KanbanCard
                            key={file.id}
                            file={file}
                            columns={allColumns}
                            onFileClick={onFileClick}
                            onMoveFile={onMoveFile}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════
   Template Picker Dialog
   ═════════════════════════════════════════════════════════════ */

function TemplatePicker({ onSelect }) {
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <div style={S.templateOverlay}>
            <div style={S.templateDialog}>
                <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#e0e0e0' }}>
                    Chọn template Kanban
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>
                    Chọn workflow phù hợp với team. Bạn có thể chỉnh sửa sau.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PRESETS.map(preset => (
                        <button
                            key={preset.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '16px 18px', borderRadius: 14,
                                border: `1px solid ${hoveredId === preset.id ? '#E8830C' : '#2a2a3e'}`,
                                background: hoveredId === preset.id ? 'rgba(232,131,12,0.04)' : 'transparent',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all 200ms',
                            }}
                            onMouseEnter={() => setHoveredId(preset.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => onSelect(preset.columns)}
                        >
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>
                                    {preset.title}
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{preset.desc}</p>
                                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                    {preset.columns.map(col => (
                                        <span key={col.id} style={{
                                            width: 8, height: 8, borderRadius: '50%', background: col.color,
                                        }} />
                                    ))}
                                </div>
                            </div>
                            <ChevronDown size={16} color="#6b7280" style={{ transform: 'rotate(-90deg)' }} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════
   Main KanbanBoard Component
   ═════════════════════════════════════════════════════════════ */

export default function KanbanBoard({
    files = [],
    columns = [],
    onMoveFile,
    onUpdateColumns,
    onFileClick,
}) {
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); // column id
    const [addingColumn, setAddingColumn] = useState(false);
    const [newColTitle, setNewColTitle] = useState('');
    const newColRef = useRef(null);

    // Show template picker if no columns configured
    useEffect(() => {
        if (!columns || columns.length === 0) {
            setShowTemplatePicker(true);
        }
    }, []);

    // Focus new column input
    useEffect(() => {
        if (addingColumn) setTimeout(() => newColRef.current?.focus(), 50);
    }, [addingColumn]);

    // Group files by kanbanStatus — files with unmatched status go to first column
    const filesByColumn = useMemo(() => {
        const result = {};
        columns.forEach(col => { result[col.id] = []; });

        const validIds = new Set(columns.map(c => c.id));
        const firstId = columns[0]?.id;

        files.forEach(file => {
            const status = file.kanbanStatus;
            if (status && validIds.has(status)) {
                result[status].push(file);
            } else if (firstId) {
                result[firstId].push(file);
            }
        });
        return result;
    }, [files, columns]);

    // Template select
    const handleTemplateSelect = useCallback((templateColumns) => {
        setShowTemplatePicker(false);
        if (onUpdateColumns) onUpdateColumns(templateColumns);
    }, [onUpdateColumns]);

    // Column management
    const handleRenameColumn = useCallback((colId, newTitle) => {
        const updated = columns.map(c => c.id === colId ? { ...c, title: newTitle } : c);
        if (onUpdateColumns) onUpdateColumns(updated);
    }, [columns, onUpdateColumns]);

    const handleChangeColor = useCallback((colId, newColor) => {
        const updated = columns.map(c => c.id === colId ? { ...c, color: newColor } : c);
        if (onUpdateColumns) onUpdateColumns(updated);
    }, [columns, onUpdateColumns]);

    const handleDeleteColumn = useCallback((colId) => {
        setConfirmDelete(colId);
    }, []);

    const confirmDeleteColumn = useCallback(() => {
        if (!confirmDelete) return;
        // Move files from deleted column to first column
        const firstCol = columns.find(c => c.id !== confirmDelete);
        if (firstCol && onMoveFile) {
            const affectedFiles = filesByColumn[confirmDelete] || [];
            affectedFiles.forEach(f => onMoveFile(f.id, firstCol.id));
        }
        const updated = columns.filter(c => c.id !== confirmDelete);
        if (onUpdateColumns) onUpdateColumns(updated);
        setConfirmDelete(null);
    }, [confirmDelete, columns, filesByColumn, onMoveFile, onUpdateColumns]);

    const handleAddColumn = useCallback(() => {
        const trimmed = newColTitle.trim();
        if (!trimmed || columns.length >= MAX_COLUMNS) return;
        const newCol = {
            id: generateId(trimmed),
            title: trimmed,
            icon: 'ListTodo',
            color: PRESET_COLORS[columns.length % PRESET_COLORS.length],
        };
        if (onUpdateColumns) onUpdateColumns([...columns, newCol]);
        setNewColTitle('');
        setAddingColumn(false);
    }, [newColTitle, columns, onUpdateColumns]);

    // handle file move (via drag-drop or mobile dropdown)
    const handleMoveFile = useCallback((fileId, newStatus) => {
        const file = files.find(f => f.id === fileId);
        if (file && (file.kanbanStatus || columns[0]?.id) !== newStatus) {
            if (onMoveFile) onMoveFile(fileId, newStatus);
        }
    }, [files, columns, onMoveFile]);

    /* ─── Template Picker ─── */
    if (showTemplatePicker) {
        return <TemplatePicker onSelect={handleTemplateSelect} />;
    }

    /* ─── Empty files state ─── */
    if (files.length === 0 && columns.length > 0) {
        return (
            <div>
                <div className="kb-columns kb-scroll" style={S.board}>
                    {columns.map((col, i) => (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            files={[]}
                            allColumns={columns}
                            isFirst={i === 0}
                            onMoveFile={handleMoveFile}
                            onFileClick={onFileClick}
                            onRename={handleRenameColumn}
                            onChangeColor={handleChangeColor}
                            onDelete={handleDeleteColumn}
                        />
                    ))}
                    {/* Add column */}
                    {columns.length < MAX_COLUMNS && (
                        <div
                            style={S.addCol}
                            onClick={() => setAddingColumn(true)}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8830C'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3e'; }}
                        >
                            <Plus size={20} color="#6b7280" />
                            <span style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Thêm cột</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Main board ─── */
    return (
        <>
            <div className="kb-columns kb-scroll" style={S.board}>
                {columns.map((col, i) => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        files={filesByColumn[col.id] || []}
                        allColumns={columns}
                        isFirst={i === 0}
                        onMoveFile={handleMoveFile}
                        onFileClick={onFileClick}
                        onRename={handleRenameColumn}
                        onChangeColor={handleChangeColor}
                        onDelete={handleDeleteColumn}
                    />
                ))}

                {/* Add column */}
                {columns.length < MAX_COLUMNS && (
                    <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                        {addingColumn ? (
                            <div style={{
                                padding: 16, borderRadius: 16, border: '1px solid #E8830C',
                                background: '#12121f',
                            }}>
                                <input
                                    ref={newColRef}
                                    value={newColTitle}
                                    onChange={(e) => setNewColTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddColumn();
                                        if (e.key === 'Escape') { setAddingColumn(false); setNewColTitle(''); }
                                    }}
                                    placeholder="Tên cột..."
                                    style={{
                                        width: '100%', fontSize: 13, padding: '8px 12px',
                                        borderRadius: 8, border: '1px solid #3a3a5a',
                                        background: '#1a1a2e', color: '#e0e0e0', outline: 'none',
                                        fontFamily: 'inherit', marginBottom: 8,
                                    }}
                                />
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={handleAddColumn}
                                        style={{
                                            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                                            background: '#E8830C', color: '#1a1a1a', fontSize: 12,
                                            fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        Thêm
                                    </button>
                                    <button
                                        onClick={() => { setAddingColumn(false); setNewColTitle(''); }}
                                        style={{
                                            padding: '8px 12px', borderRadius: 8, border: '1px solid #3a3a5a',
                                            background: 'transparent', color: '#6b7280', fontSize: 12,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={S.addCol}
                                onClick={() => setAddingColumn(true)}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8830C'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3e'; }}
                            >
                                <Plus size={20} color="#6b7280" />
                                <span style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Thêm cột</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete confirm dialog */}
            {confirmDelete && (
                <div style={S.confirmOverlay} onClick={() => setConfirmDelete(null)}>
                    <div style={S.confirmBox} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: 'rgba(239,68,68,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Trash2 size={20} color="#ef4444" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>
                                    Xóa cột "{columns.find(c => c.id === confirmDelete)?.title}"?
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Hành động không thể hoàn tác</p>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
                            Các file trong cột sẽ được tự động chuyển về cột đầu tiên.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                style={{
                                    padding: '8px 18px', borderRadius: 10, border: 'none',
                                    background: 'transparent', color: '#9ca3af', fontSize: 13,
                                    fontWeight: 500, cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.style.color = '#e0e0e0'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeleteColumn}
                                style={{
                                    padding: '8px 18px', borderRadius: 10, border: 'none',
                                    background: '#ef4444', color: '#fff', fontSize: 13,
                                    fontWeight: 600, cursor: 'pointer', transition: 'background 200ms',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
