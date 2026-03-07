import { useState, useCallback, useRef, useMemo } from 'react';
import { Check, CheckSquare, Square, Image as ImageIcon, FileText, Film, File } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Inject CSS
   ═══════════════════════════════════════════════════════════════ */
if (typeof document !== 'undefined') {
    const ID = 'sfg-styles';
    if (!document.getElementById(ID)) {
        const s = document.createElement('style');
        s.id = ID;
        s.textContent = `
      @keyframes sfg-pop { 0%{transform:scale(0.8)} 50%{transform:scale(1.1)} 100%{transform:scale(1)} }
    `;
        document.head.appendChild(s);
    }
}

/* ═══════════════════════════════════════════════════════════════
   Helper: detect file type icon
   ═══════════════════════════════════════════════════════════════ */
function getFileIcon(mimeType) {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Film;
    return FileText;
}

/* ═══════════════════════════════════════════════════════════════
   SelectableFileGrid
   ═══════════════════════════════════════════════════════════════ */
export default function SelectableFileGrid({
    files = [],
    selectedIds = new Set(),
    onSelectionChange,
    viewMode = 'grid',
    onFileClick,
}) {
    const [selectMode, setSelectMode] = useState(false);
    const lastClickedRef = useRef(null);

    /* Derived state */
    const allSelected = files.length > 0 && files.every(f => selectedIds.has(f.id));
    const someSelected = selectedIds.size > 0;

    /* Enter select mode when any file is selected */
    const isSelectMode = selectMode || someSelected;

    /* ── Select All / Deselect All toggle ── */
    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(files.map(f => f.id)));
        }
    }, [files, allSelected, onSelectionChange]);

    /* ── File click with Shift / Ctrl support ── */
    const handleFileInteraction = useCallback((file, e, isCheckbox) => {
        if (!isSelectMode && !isCheckbox) {
            // Normal click — open file
            if (onFileClick) onFileClick(file);
            return;
        }

        const next = new Set(selectedIds);

        if (e.shiftKey && lastClickedRef.current) {
            // Shift+Click: range select
            const startIdx = files.findIndex(f => f.id === lastClickedRef.current);
            const endIdx = files.findIndex(f => f.id === file.id);
            if (startIdx !== -1 && endIdx !== -1) {
                const [lo, hi] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
                for (let i = lo; i <= hi; i++) next.add(files[i].id);
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd+Click: toggle single
            if (next.has(file.id)) next.delete(file.id);
            else next.add(file.id);
        } else {
            // Normal checkbox toggle
            if (next.has(file.id)) next.delete(file.id);
            else next.add(file.id);
        }

        lastClickedRef.current = file.id;
        onSelectionChange(next);
        if (next.size > 0) setSelectMode(true);
        else setSelectMode(false);
    }, [files, selectedIds, isSelectMode, onFileClick, onSelectionChange]);

    /* ═══ Render ═══ */
    return (
        <div>
            {/* ── Header with Select All ── */}
            {files.length > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', marginBottom: 8,
                }}>
                    <button
                        onClick={handleSelectAll}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            color: allSelected ? '#E8830C' : '#6b7280', fontSize: 12,
                            padding: '4px 8px', borderRadius: 6, transition: 'all 150ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a40'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        {allSelected
                            ? <CheckSquare size={14} color="#E8830C" />
                            : <Square size={14} />}
                        <span>{allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
                    </button>
                    {someSelected && (
                        <span style={{ fontSize: 11, color: '#6b7280' }}>
                            {selectedIds.size} / {files.length} files
                        </span>
                    )}
                </div>
            )}

            {/* ── File Grid / List ── */}
            <div style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(180px, 1fr))' : undefined,
                gap: viewMode === 'grid' ? 12 : 4,
                flexDirection: viewMode === 'list' ? 'column' : undefined,
            }}>
                {files.map(file => {
                    const isSelected = selectedIds.has(file.id);
                    const FileIcon = getFileIcon(file.mimeType);

                    return viewMode === 'grid' ? (
                        /* ── Grid Card ── */
                        <div key={file.id}
                            style={{
                                position: 'relative', borderRadius: 10, overflow: 'hidden',
                                background: '#16213e',
                                border: `2px solid ${isSelected ? '#E8830C' : '#2a2a3e'}`,
                                transition: 'all 200ms', cursor: 'pointer',
                                boxShadow: isSelected ? '0 0 16px rgba(232,131,12,0.15)' : 'none',
                            }}
                            onClick={(e) => handleFileInteraction(file, e, false)}
                            onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = '#3a3a5a';
                                e.currentTarget.querySelector('.sfg-cb')?.style && (e.currentTarget.querySelector('.sfg-cb').style.opacity = '1');
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = '#2a2a3e';
                                if (!isSelectMode) e.currentTarget.querySelector('.sfg-cb')?.style && (e.currentTarget.querySelector('.sfg-cb').style.opacity = '0');
                            }}
                        >
                            {/* Thumbnail */}
                            <div style={{
                                width: '100%', aspectRatio: '4/3', background: '#12121f',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {file.thumbnailUrl ? (
                                    <img src={file.thumbnailUrl} alt={file.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <FileIcon size={32} color="#3a3a5a" />
                                )}

                                {/* Selected overlay */}
                                {isSelected && (
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(232,131,12,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: '#E8830C', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            animation: 'sfg-pop 200ms ease-out',
                                        }}>
                                            <Check size={18} color="#fff" strokeWidth={3} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Checkbox */}
                            <div className="sfg-cb"
                                style={{
                                    position: 'absolute', top: 8, left: 8, zIndex: 2,
                                    opacity: isSelectMode ? 1 : 0, transition: 'opacity 150ms',
                                }}
                                onClick={(e) => { e.stopPropagation(); handleFileInteraction(file, e, true); }}
                            >
                                <div style={{
                                    width: 22, height: 22, borderRadius: 6,
                                    border: `2px solid ${isSelected ? '#E8830C' : '#6b7280'}`,
                                    background: isSelected ? '#E8830C' : 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 150ms',
                                    backdropFilter: 'blur(4px)',
                                }}>
                                    {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                                </div>
                            </div>

                            {/* File info */}
                            <div style={{ padding: '8px 10px' }}>
                                <p style={{
                                    margin: 0, fontSize: 12, color: '#e0e0e0', fontWeight: 500,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{file.name}</p>
                            </div>
                        </div>
                    ) : (
                        /* ── List Row ── */
                        <div key={file.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 10px', borderRadius: 8,
                                background: isSelected ? 'rgba(232,131,12,0.06)' : 'transparent',
                                border: `1px solid ${isSelected ? '#E8830C' : 'transparent'}`,
                                transition: 'all 150ms', cursor: 'pointer',
                            }}
                            onClick={(e) => handleFileInteraction(file, e, false)}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#1a1a40'; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(232,131,12,0.06)' : 'transparent'; }}
                        >
                            {/* Checkbox */}
                            <div
                                style={{
                                    width: 20, height: 20, borderRadius: 4,
                                    border: `2px solid ${isSelected ? '#E8830C' : '#4a4a6a'}`,
                                    background: isSelected ? '#E8830C' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
                                }}
                                onClick={(e) => { e.stopPropagation(); handleFileInteraction(file, e, true); }}
                            >
                                {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                            </div>

                            {/* Thumbnail */}
                            <div style={{
                                width: 36, height: 36, borderRadius: 6, overflow: 'hidden',
                                background: '#12121f', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                {file.thumbnailUrl ? (
                                    <img src={file.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <FileIcon size={16} color="#3a3a5a" />
                                )}
                            </div>

                            {/* Name */}
                            <span style={{
                                flex: 1, fontSize: 12, color: '#e0e0e0',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {file.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
