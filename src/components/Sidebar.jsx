import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    Search, X, ChevronRight, ChevronDown, Folder, FolderPlus, FolderOpen,
    MoreHorizontal, Pencil, Trash2, Move, Link, Plus, Home,
    RefreshCw, Check, ChevronsDownUp, ChevronsUpDown,
    Briefcase, GraduationCap, Archive, Image as ImageIcon,
    Video, FileText, Key, Layout, Users, BarChart3, Camera,
    Palette, Truck, ExternalLink, Star
} from 'lucide-react';

/* ═════════════════════════════════════════════════════════════
   Inject CSS
   ═════════════════════════════════════════════════════════════ */

if (typeof document !== 'undefined') {
    const STYLE_ID = 'sidebar-v3-styles';
    if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
      @keyframes sb-fadeIn  { from { opacity:0; } to { opacity:1; } }
      @keyframes sb-scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      @keyframes sb-slideDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:600px; } }
      @keyframes sb-spin { to { transform:rotate(360deg); } }
      .sb-scroll::-webkit-scrollbar { width:3px; }
      .sb-scroll::-webkit-scrollbar-track { background:transparent; }
      .sb-scroll::-webkit-scrollbar-thumb { background:#3a3a5a; border-radius:3px; }
      .sb-scroll::-webkit-scrollbar-thumb:hover { background:#5a5a7a; }
      .sb-folder-row .sb-drive-link { opacity: 0 !important; transform: scale(0.8) !important; transition: all 200ms ease !important; visibility: hidden !important; }
      .sb-folder-row:hover .sb-drive-link { opacity: 1 !important; transform: scale(1) !important; visibility: visible !important; }
    `;
        document.head.appendChild(s);
    }
}

/* ═════════════════════════════════════════════════════════════
   Constants & Helpers
   ═════════════════════════════════════════════════════════════ */

const FOLDER_ICONS = {
    product: Briefcase, learning: GraduationCap, archive: Archive,
    images: ImageIcon, videos: Video, copywriting: FileText,
    keywords: Key, templates: Layout, template: Layout,
    supplier: Users, suppliers: Users, ppc: BarChart3,
    photography: Camera, psd: Palette, fba_logistics: Truck,
    seo: Search, seo_listing: Search,
};

const FOLDER_COLORS = {
    product: '#FF9900',
    learning: '#A78BFA',
    archive: '#9CA3AF',
};

function getFolderIcon(folder) {
    const name = (folder.name || '').toLowerCase();
    const type = folder.type || '';
    if (type === 'product' || name.startsWith('b0') || name === 'products' || name === 'product')
        return { Icon: Briefcase, color: '#FF9900' };
    if (type === 'learning' || name === 'learning' || name === 'tài liệu')
        return { Icon: GraduationCap, color: '#A78BFA' };
    if (type === 'archive' || name === 'archive' || name.startsWith('_archive'))
        return { Icon: Archive, color: '#9CA3AF' };
    if (FOLDER_ICONS[name])
        return { Icon: FOLDER_ICONS[name], color: '#60A5FA' };
    return { Icon: Folder, color: '#60A5FA' };
}

/* ── Build tree from flat list ── */
function buildTree(flatFolders) {
    const map = {};
    const roots = [];
    flatFolders.forEach(f => { map[f.id] = { ...f, children: [] }; });
    flatFolders.forEach(f => {
        if (f.parentId && map[f.parentId]) {
            map[f.parentId].children.push(map[f.id]);
        } else {
            roots.push(map[f.id]);
        }
    });
    // Sort children alphabetically
    const sortChildren = (nodes) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name));
        nodes.forEach(n => sortChildren(n.children));
    };
    sortChildren(roots);
    return roots;
}

/* ── Time ago ── */
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

/* ═════════════════════════════════════════════════════════════
   Styles
   ═════════════════════════════════════════════════════════════ */

const S = {
    sidebar: {
        width: 220, background: '#1a1a2e',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
        borderRight: '1px solid #2a2a3e',
        position: 'relative',
    },
    header: {
        padding: '14px 14px 8px', flexShrink: 0,
    },
    searchWrap: {
        position: 'relative', marginBottom: 8,
    },
    searchInput: {
        width: '100%', fontSize: 12, padding: '7px 30px 7px 32px',
        borderRadius: 8, border: '1px solid #2a2a3e',
        background: '#12121f', color: '#e0e0e0', outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 200ms',
    },
    syncRow: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', fontSize: 10, color: '#6b7280',
        borderBottom: '1px solid #2a2a3e',
    },
    treeBody: {
        flex: 1, overflowY: 'auto', padding: '6px 6px 6px 2px',
    },
    // Folder row
    folderRow: (isActive, depth) => ({
        display: 'flex', alignItems: 'center', gap: 6,
        padding: `6px 8px 6px ${8 + depth * 16}px`,
        borderRadius: 6, cursor: 'pointer',
        transition: 'all 150ms', position: 'relative',
        background: isActive ? '#16213e' : 'transparent',
        borderLeft: isActive ? '3px solid #E8830C' : '3px solid transparent',
        marginBottom: 1,
    }),
    folderName: (isActive) => ({
        flex: 1, fontSize: 12, fontWeight: isActive ? 600 : 400,
        color: isActive ? '#e0e0e0' : '#9ca3af',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        margin: 0, transition: 'color 150ms',
    }),
    badge: {
        fontSize: 11, fontWeight: 700, color: '#fff',
        background: '#E8830C', borderRadius: 10,
        padding: '0 6px', minWidth: 20, textAlign: 'center',
        lineHeight: '18px', flexShrink: 0,
    },
    chevron: {
        width: 14, height: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 200ms',
    },
    // Context menu
    ctxMenu: {
        position: 'fixed', zIndex: 100,
        background: '#16213e', border: '1px solid #2a2a4a',
        borderRadius: 8, padding: 4, minWidth: 180,
        boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        animation: 'sb-scaleIn 150ms ease-out',
    },
    ctxItem: (isDanger) => ({
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 12px', borderRadius: 6,
        border: 'none', background: 'transparent',
        color: isDanger ? '#ef4444' : '#e0e0e0',
        fontSize: 12, cursor: 'pointer', textAlign: 'left',
        transition: 'background 150ms',
    }),
    ctxDivider: {
        margin: '4px 8px', borderTop: '1px solid #2a2a4a',
    },
    // Footer
    footer: {
        padding: 10, borderTop: '1px solid #2a2a3e', flexShrink: 0,
    },
    addBtn: {
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '8px 0', borderRadius: 8,
        border: '1px dashed #3a3a5a', background: 'transparent',
        color: '#6b7280', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', transition: 'all 200ms',
    },
    // Confirm overlay
    confirmOverlay: {
        position: 'fixed', inset: 0, zIndex: 110,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        animation: 'sb-fadeIn 200ms',
    },
    confirmBox: {
        width: '100%', maxWidth: 360, padding: 24, borderRadius: 16,
        background: '#16213e', border: '1px solid #2a2a3e',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        animation: 'sb-scaleIn 200ms',
    },
    // Move dialog
    moveOverlay: {
        position: 'fixed', inset: 0, zIndex: 110,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        animation: 'sb-fadeIn 200ms',
    },
    moveBox: {
        width: '100%', maxWidth: 360, maxHeight: '60vh',
        borderRadius: 16, background: '#16213e', border: '1px solid #2a2a3e',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden',
        animation: 'sb-scaleIn 200ms',
        display: 'flex', flexDirection: 'column',
    },
    // Highlight match
    highlight: {
        background: 'rgba(232,131,12,0.3)', color: '#E8830C',
        borderRadius: 2, padding: '0 1px',
    },
};

/* ═════════════════════════════════════════════════════════════
   HighlightText — highlights search match
   ═════════════════════════════════════════════════════════════ */

function HighlightText({ text, query }) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <span style={S.highlight}>{text.slice(idx, idx + query.length)}</span>
            {text.slice(idx + query.length)}
        </>
    );
}

/* ═════════════════════════════════════════════════════════════
   FolderItem — recursive tree item
   ═════════════════════════════════════════════════════════════ */

function FolderItem({
    node, depth, activeFolderId, expandedSet, searchQuery, appAsins,
    onSelect, onToggle, onContextMenu, editingId, onRenameSubmit, onRenameCancel,
    onKeyNav, flatIndex, focusedIndex,
}) {
    const isActive = activeFolderId === node.id;
    const isExpanded = expandedSet.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isEditing = editingId === node.id;
    const isFocused = flatIndex === focusedIndex;
    const { Icon, color } = getFolderIcon(node);

    const [editName, setEditName] = useState(node.name);
    const editRef = useRef(null);
    const rowRef = useRef(null);

    useEffect(() => {
        if (isEditing) {
            setEditName(node.name);
            setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 50);
        }
    }, [isEditing, node.name]);

    // Focus the row when keyboard-navigated
    useEffect(() => {
        if (isFocused && rowRef.current) {
            rowRef.current.focus({ preventScroll: false });
        }
    }, [isFocused]);

    const handleRename = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== node.name) onRenameSubmit(node.id, trimmed);
        else onRenameCancel();
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (hasChildren) onToggle(node.id);
        onSelect(node.id);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); onKeyNav(1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); onKeyNav(-1); }
        if (e.key === 'ArrowRight' && hasChildren && !isExpanded) { e.preventDefault(); onToggle(node.id); }
        if (e.key === 'ArrowLeft' && hasChildren && isExpanded) { e.preventDefault(); onToggle(node.id); }
        if (e.key === 'Enter') { e.preventDefault(); onSelect(node.id); }
    };

    return (
        <>
            <div
                ref={rowRef}
                tabIndex={0}
                role="treeitem"
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-selected={isActive}
                className="sb-folder-row"
                style={S.folderRow(isActive, depth)}
                onClick={handleClick}
                onContextMenu={(e) => onContextMenu(e, node)}
                onKeyDown={handleKeyDown}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#1a1a40'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                onFocus={(e) => { e.currentTarget.style.outline = '1px solid rgba(232,131,12,0.3)'; e.currentTarget.style.outlineOffset = '-1px'; }}
                onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
            >
                {/* Chevron */}
                {hasChildren ? (
                    <span style={S.chevron}>
                        {isExpanded
                            ? <ChevronDown size={12} color="#6b7280" />
                            : <ChevronRight size={12} color="#6b7280" />}
                    </span>
                ) : (
                    <span style={{ width: 14, flexShrink: 0 }} />
                )}

                {/* Icon */}
                <Icon size={14} color={isActive ? color : '#6b7280'} style={{ flexShrink: 0 }} />

                {/* Name / Edit */}
                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0, paddingRight: 4 }}
                        onClick={(e) => e.stopPropagation()}>
                        {appAsins?.length > 0 && (
                            <select
                                onClick={e => e.stopPropagation()}
                                onMouseDown={e => e.stopPropagation()}
                                onChange={(e) => {
                                    if (!e.target.value) return;
                                    const asin = appAsins.find(a => (a.id || a.code) === e.target.value);
                                    if (asin) {
                                        const catPrefix = asin.category ? `[${asin.category}] ` : '';
                                        setEditName(`${catPrefix}${asin.code} - ${asin.productName || ''}`.trim());
                                        setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 50);
                                    }
                                }}
                                style={{ width: '100%', fontSize: 10, padding: '2px 4px', borderRadius: 4, background: '#12121f', color: '#9ca3af', border: '1px solid #2a2a3e', outline: 'none' }}
                            >
                                <option value="">Chọn ASIN...</option>
                                {appAsins.map(a => <option key={a.id || a.code} value={a.id || a.code}>{a.code} - {a.productName || ''}</option>)}
                            </select>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
                            <input
                                ref={editRef}
                                value={editName}
                                title={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename();
                                    if (e.key === 'Escape') onRenameCancel();
                                    e.stopPropagation();
                                }}
                                style={{
                                    flex: 1, minWidth: 0, width: '100%', fontSize: 12, padding: '2px 6px',
                                    borderRadius: 4, border: '1px solid #E8830C',
                                    background: '#12121f', color: '#e0e0e0', outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <button onMouseDown={(e) => { e.preventDefault(); handleRename(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#22c55e', display: 'flex', padding: 0 }}>
                                <Check size={12} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRenameCancel(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}>
                                <X size={10} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <span style={S.folderName(isActive)}>
                        <HighlightText text={node.name} query={searchQuery} />
                    </span>
                )}

                {/* File count badge */}
                {!isEditing && node.fileCount > 0 && (
                    <span style={S.badge}>{node.fileCount}</span>
                )}

                {/* External Link to Drive */}
                {!isEditing && (node.driveId || node.id) && (
                    <a
                        href={`https://drive.google.com/drive/folders/${node.driveId || node.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="sb-drive-link"
                        onClick={(e) => { e.stopPropagation(); }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#6b7280',
                            marginLeft: '4px', flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                        title="Mở thư mục này trên Google Drive"
                    >
                        <ExternalLink size={11} />
                    </a>
                )}
            </div>

            {/* Children */}
            {isExpanded && hasChildren && !searchQuery && (
                <div style={{ overflow: 'hidden', animation: 'sb-slideDown 200ms ease-out' }}>
                    {node.children.map((child, i) => (
                        <FolderItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            activeFolderId={activeFolderId}
                            expandedSet={expandedSet}
                            searchQuery={searchQuery}
                            appAsins={appAsins}
                            onSelect={onSelect}
                            onToggle={onToggle}
                            onContextMenu={onContextMenu}
                            editingId={editingId}
                            onRenameSubmit={onRenameSubmit}
                            onRenameCancel={onRenameCancel}
                            onKeyNav={onKeyNav}
                            flatIndex={-1}
                            focusedIndex={-1}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

/* ═════════════════════════════════════════════════════════════
   MoveDialog — tree picker for folder destination
   ═════════════════════════════════════════════════════════════ */

function MoveDialog({ folders, currentId, onMove, onClose }) {
    const tree = useMemo(() => buildTree(folders), [folders]);
    const [selected, setSelected] = useState(null);

    const renderPicker = (nodes, depth = 0) =>
        nodes.filter(n => n.id !== currentId).map(n => {
            const { Icon, color } = getFolderIcon(n);
            return (
                <div key={n.id}>
                    <button
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: `6px 12px 6px ${12 + depth * 16}px`,
                            borderRadius: 6, border: 'none',
                            background: selected === n.id ? 'rgba(232,131,12,0.08)' : 'transparent',
                            color: selected === n.id ? '#E8830C' : '#e0e0e0',
                            fontSize: 12, cursor: 'pointer', textAlign: 'left',
                            transition: 'background 150ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = selected === n.id ? 'rgba(232,131,12,0.08)' : 'transparent'; }}
                        onClick={() => setSelected(n.id)}
                    >
                        <Icon size={14} color={color} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                        {selected === n.id && <Check size={14} color="#E8830C" />}
                    </button>
                    {n.children && n.children.length > 0 && renderPicker(n.children, depth + 1)}
                </div>
            );
        });

    return (
        <div style={S.moveOverlay} onClick={onClose}>
            <div style={S.moveBox} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a3e' }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>Di chuyển đến...</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>Chọn folder đích</p>
                </div>
                <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                    {renderPicker(tree)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #2a2a3e' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'transparent', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.style.color = '#e0e0e0'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    >Hủy</button>
                    <button
                        onClick={() => { if (selected) { onMove(selected); onClose(); } }}
                        disabled={!selected}
                        style={{
                            padding: '6px 16px', borderRadius: 8, border: 'none',
                            background: selected ? '#E8830C' : '#2a2a3e',
                            color: selected ? '#1a1a1a' : '#6b7280',
                            fontSize: 12, fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed',
                        }}
                    >Di chuyển</button>
                </div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════
   Main Sidebar Component
   ═════════════════════════════════════════════════════════════ */

export default function Sidebar({
    folders = [],
    appAsins = [],
    activeFolderId,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onMoveFolder,
    onDeleteFolder,
    syncStatus = 'synced',
    lastSyncTime,
}) {
    /* ── State ── */
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSet, setExpandedSet] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null); // { x, y, node }
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
    const [moveTarget, setMoveTarget] = useState(null); // folder id
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [allExpanded, setAllExpanded] = useState(false);
    const [syncTooltip, setSyncTooltip] = useState(false);

    const searchRef = useRef(null);
    const newFolderRef = useRef(null);

    /* ── Build tree from flat folders ── */
    const tree = useMemo(() => buildTree(folders), [folders]);

    /* ── Flatten for search results ── */
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        return folders.filter(f => f.name.toLowerCase().includes(q));
    }, [folders, searchQuery]);

    /* ── Collect all folder IDs for expand-all ── */
    const allFolderIds = useMemo(() => {
        const ids = new Set();
        const collect = (nodes) => {
            nodes.forEach(n => {
                if (n.children && n.children.length > 0) {
                    ids.add(n.id);
                    collect(n.children);
                }
            });
        };
        collect(tree);
        return ids;
    }, [tree]);

    /* ── Auto-expand first 2 depth levels on mount ── */
    useEffect(() => {
        const initial = new Set();
        const expand = (nodes, depth) => {
            if (depth > 1) return;
            nodes.forEach(n => {
                if (n.children && n.children.length > 0) {
                    initial.add(n.id);
                    expand(n.children, depth + 1);
                }
            });
        };
        expand(tree, 0);
        setExpandedSet(initial);
    }, []);

    /* ── Focus new folder input ── */
    useEffect(() => {
        if (isCreatingFolder) setTimeout(() => newFolderRef.current?.focus(), 50);
    }, [isCreatingFolder]);

    /* ── Close context menu on click outside / Esc ── */
    useEffect(() => {
        if (!contextMenu) return;
        const handleClick = () => setContextMenu(null);
        const handleKey = (e) => { if (e.key === 'Escape') setContextMenu(null); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [contextMenu]);

    /* ── Search Esc to clear ── */
    useEffect(() => {
        if (!searchQuery) return;
        const handler = (e) => {
            if (e.key === 'Escape' && document.activeElement === searchRef.current) {
                setSearchQuery('');
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [searchQuery]);

    /* ── Handlers ── */
    const handleToggle = useCallback((folderId) => {
        setExpandedSet(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
            return next;
        });
    }, []);

    const handleSelect = useCallback((folderId) => {
        if (onSelectFolder) onSelectFolder(folderId);
    }, [onSelectFolder]);

    const handleContextMenu = useCallback((e, node) => {
        e.preventDefault(); e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    }, []);

    const handleRenameStart = useCallback(() => {
        if (contextMenu) { setEditingId(contextMenu.node.id); setContextMenu(null); }
    }, [contextMenu]);

    const handleRenameSubmit = useCallback((id, name) => {
        if (onRenameFolder) onRenameFolder(id, name);
        setEditingId(null);
    }, [onRenameFolder]);

    const handleRenameCancel = useCallback(() => setEditingId(null), []);

    const handleCreateSub = useCallback(() => {
        if (!contextMenu) return;
        if (onCreateFolder) onCreateFolder(contextMenu.node.id, 'New Folder');
        setContextMenu(null);
    }, [contextMenu, onCreateFolder]);

    const handleDelete = useCallback(() => {
        if (contextMenu) {
            setDeleteTarget({ id: contextMenu.node.id, name: contextMenu.node.name });
            setContextMenu(null);
        }
    }, [contextMenu]);

    const confirmDelete = useCallback(() => {
        if (deleteTarget && onDeleteFolder) onDeleteFolder(deleteTarget.id);
        setDeleteTarget(null);
    }, [deleteTarget, onDeleteFolder]);

    const handleMoveStart = useCallback(() => {
        if (contextMenu) { setMoveTarget(contextMenu.node.id); setContextMenu(null); }
    }, [contextMenu]);

    const handleMove = useCallback((newParentId) => {
        if (moveTarget && onMoveFolder) onMoveFolder(moveTarget, newParentId);
        setMoveTarget(null);
    }, [moveTarget, onMoveFolder]);

    const handleCopyLink = useCallback(() => {
        if (contextMenu?.node?.driveId) {
            navigator.clipboard?.writeText(`https://drive.google.com/drive/folders/${contextMenu.node.driveId}`);
        }
        setContextMenu(null);
    }, [contextMenu]);

    const handleToggleAll = useCallback(() => {
        if (allExpanded) {
            setExpandedSet(new Set());
            setAllExpanded(false);
        } else {
            setExpandedSet(new Set(allFolderIds));
            setAllExpanded(true);
        }
    }, [allExpanded, allFolderIds]);

    const handleKeyNav = useCallback((dir) => {
        setFocusedIndex(prev => Math.max(0, prev + dir));
    }, []);

    const handleNewFolder = useCallback(() => {
        const trimmed = newFolderName.trim();
        if (trimmed && onCreateFolder) {
            onCreateFolder(null, trimmed);
        }
        setNewFolderName('');
        setIsCreatingFolder(false);
    }, [newFolderName, onCreateFolder]);

    /* ── Sync label ── */
    const syncLabel = syncStatus === 'syncing' ? 'Đang đồng bộ...'
        : syncStatus === 'error' ? 'Lỗi đồng bộ'
            : 'Đã đồng bộ';
    const syncDot = syncStatus === 'syncing' ? '#f59e0b'
        : syncStatus === 'error' ? '#ef4444' : '#22c55e';

    /* ═══ RENDER ═══ */
    return (
        <>
            <aside style={S.sidebar}>

                {/* ── Header ── */}
                <div style={S.header}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14 }}>🗂️</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#e0e0e0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Folders
                            </span>
                            {folders.length > 0 && folders[0].driveId && (
                                <a
                                    href={`https://drive.google.com/drive/folders/${folders[0].driveId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Mở thư mục gốc trên Google Drive"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: 20, height: 20, borderRadius: 4, background: 'transparent',
                                        color: '#6b7280', transition: 'all 150ms', textDecoration: 'none'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3e'; e.currentTarget.style.color = '#60A5FA'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                                >
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                        <button
                            onClick={handleToggleAll}
                            title={allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                            style={{
                                width: 24, height: 24, borderRadius: 6, border: 'none',
                                background: 'transparent', color: '#6b7280', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 150ms',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3e'; e.currentTarget.style.color = '#e0e0e0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                        >
                            {allExpanded
                                ? <ChevronsDownUp size={14} />
                                : <ChevronsUpDown size={14} />}
                        </button>
                    </div>

                    {/* ── Search ── */}
                    <div style={S.searchWrap}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        <input
                            ref={searchRef}
                            style={S.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm folder..."
                            onFocus={(e) => { e.target.style.borderColor = '#E8830C'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#2a2a3e'; }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                                    width: 18, height: 18, borderRadius: 4, border: 'none',
                                    background: 'transparent', color: '#6b7280', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Sync Status ── */}
                <div
                    style={S.syncRow}
                    onMouseEnter={() => setSyncTooltip(true)}
                    onMouseLeave={() => setSyncTooltip(false)}
                    onClick={() => { if (syncStatus === 'error') { /* parent handles retry via callback */ } }}
                    title={
                        syncStatus === 'synced' && lastSyncTime ? `Lần cuối: ${timeAgo(lastSyncTime)}`
                            : syncStatus === 'error' ? 'Nhấn để thử lại' : ''
                    }
                >
                    {syncStatus === 'syncing' ? (
                        <RefreshCw size={10} color={syncDot} style={{ animation: 'sb-spin 1s linear infinite' }} />
                    ) : (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: syncDot, flexShrink: 0 }} />
                    )}
                    <span style={S.syncLabel}>
                        {syncLabel}
                    </span>
                </div>

                <div style={{ padding: '6px 6px 2px' }}>
                    {/* ── Dashboard button ── */}
                    <div
                        onClick={() => handleSelect('dashboard')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            background: activeFolderId === 'dashboard' ? '#16213e' : 'transparent',
                            borderLeft: activeFolderId === 'dashboard' ? '3px solid #E8830C' : '3px solid transparent',
                            transition: 'all 150ms',
                        }}
                        onMouseEnter={(e) => { if (activeFolderId !== 'dashboard') e.currentTarget.style.background = '#1a1a40'; }}
                        onMouseLeave={(e) => { if (activeFolderId !== 'dashboard') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <Layout size={14} color={activeFolderId === 'dashboard' ? '#E8830C' : '#6b7280'} />
                        <span style={{ fontSize: 12, fontWeight: activeFolderId === 'dashboard' ? 600 : 400, color: activeFolderId === 'dashboard' ? '#e0e0e0' : '#9ca3af' }}>
                            Trang chủ
                        </span>
                    </div>

                    {/* ── All files button ── */}
                    <div
                        onClick={() => handleSelect(null)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            marginTop: 4,
                            background: activeFolderId === null ? '#16213e' : 'transparent',
                            borderLeft: activeFolderId === null ? '3px solid #E8830C' : '3px solid transparent',
                            transition: 'all 150ms',
                        }}
                        onMouseEnter={(e) => { if (activeFolderId !== null) e.currentTarget.style.background = '#1a1a40'; }}
                        onMouseLeave={(e) => { if (activeFolderId !== null) e.currentTarget.style.background = 'transparent'; }}
                    >
                        <Home size={14} color={activeFolderId === null ? '#E8830C' : '#6b7280'} />
                        <span style={{ fontSize: 12, fontWeight: activeFolderId === null ? 600 : 400, color: activeFolderId === null ? '#e0e0e0' : '#9ca3af' }}>
                            Tất cả file
                        </span>
                    </div>

                    <div
                        onClick={() => handleSelect('starred')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            marginTop: 4,
                            background: activeFolderId === 'starred' ? '#16213e' : 'transparent',
                            borderLeft: activeFolderId === 'starred' ? '3px solid #E8830C' : '3px solid transparent',
                            transition: 'all 150ms',
                        }}
                        onMouseEnter={(e) => { if (activeFolderId !== 'starred') e.currentTarget.style.background = '#1a1a40'; }}
                        onMouseLeave={(e) => { if (activeFolderId !== 'starred') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <Star size={14} color={activeFolderId === 'starred' ? '#E8830C' : '#6b7280'} fill={activeFolderId === 'starred' ? '#E8830C' : 'none'} />
                        <span style={{ fontSize: 12, fontWeight: activeFolderId === 'starred' ? 600 : 400, color: activeFolderId === 'starred' ? '#e0e0e0' : '#9ca3af' }}>
                            Quan trọng
                        </span>
                    </div>
                </div>

                <div style={{ margin: '4px 10px', borderTop: '1px solid #2a2a3e' }} />

                {/* ── Tree Body ── */}
                <div className="sb-scroll" style={S.treeBody} role="tree">
                    {searchResults ? (
                        /* ── Search results: flat list ── */
                        searchResults.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Không tìm thấy "{searchQuery}"</p>
                            </div>
                        ) : (
                            searchResults.map((folder, i) => {
                                const { Icon, color } = getFolderIcon(folder);
                                const isActive = activeFolderId === folder.id;
                                return (
                                    <div
                                        key={folder.id}
                                        className="sb-folder-row"
                                        style={S.folderRow(isActive, 0)}
                                        onClick={() => { handleSelect(folder.id); setSearchQuery(''); }}
                                        onContextMenu={(e) => handleContextMenu(e, folder)}
                                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#1a1a40'; }}
                                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Icon size={14} color={isActive ? color : '#6b7280'} style={{ flexShrink: 0 }} />
                                        <span style={S.folderName(isActive)}>
                                            <HighlightText text={folder.name} query={searchQuery} />
                                        </span>
                                        {folder.fileCount > 0 && <span style={S.badge}>{folder.fileCount}</span>}

                                        {(folder.driveId || folder.id) && (
                                            <a
                                                href={`https://drive.google.com/drive/folders/${folder.driveId || folder.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="sb-drive-link"
                                                onClick={(e) => { e.stopPropagation(); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#6b7280',
                                                    marginLeft: '4px', flexShrink: 0,
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                                                title="Mở thư mục này trên Google Drive"
                                            >
                                                <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                );
                            })
                        )
                    ) : (
                        /* ── Normal tree view ── */
                        tree.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 12px' }}>
                                <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>📂</span>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Chưa có folder nào</p>
                                <p style={{ fontSize: 10, color: '#4a4a6a', margin: '4px 0 0' }}>Tạo folder đầu tiên để bắt đầu</p>
                            </div>
                        ) : (
                            tree.map((node, i) => (
                                <FolderItem
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                    activeFolderId={activeFolderId}
                                    expandedSet={expandedSet}
                                    searchQuery=""
                                    appAsins={appAsins}
                                    onSelect={handleSelect}
                                    onToggle={handleToggle}
                                    onContextMenu={handleContextMenu}
                                    editingId={editingId}
                                    onRenameSubmit={handleRenameSubmit}
                                    onRenameCancel={handleRenameCancel}
                                    onKeyNav={handleKeyNav}
                                    flatIndex={i}
                                    focusedIndex={focusedIndex}
                                />
                            ))
                        )
                    )}
                </div>

                {/* ── Footer: Create Folder ── */}
                <div style={S.footer}>
                    {isCreatingFolder ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {appAsins?.length > 0 && (
                                <select
                                    onClick={e => e.stopPropagation()}
                                    onMouseDown={e => e.stopPropagation()}
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const asin = appAsins.find(a => (a.id || a.code) === e.target.value);
                                        if (asin) {
                                            const catPrefix = asin.category ? `[${asin.category}] ` : '';
                                            setNewFolderName(`${catPrefix}${asin.code} - ${asin.productName || ''}`.trim());
                                            setTimeout(() => newFolderRef.current?.focus(), 50);
                                        }
                                    }}
                                    style={{ width: '100%', fontSize: 11, padding: '4px 8px', borderRadius: 4, background: '#12121f', color: '#9ca3af', border: '1px solid #2a2a3e', outline: 'none' }}
                                >
                                    <option value="">Chọn tên ASIN...</option>
                                    {appAsins.map(a => <option key={a.id || a.code} value={a.id || a.code}>{a.code} - {a.productName || ''}</option>)}
                                </select>
                            )}
                            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                                <input
                                    ref={newFolderRef}
                                    value={newFolderName}
                                    title={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleNewFolder();
                                        if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
                                    }}
                                    placeholder="Tên folder..."
                                    style={{
                                        flex: 1, minWidth: 0, width: '100%', fontSize: 12, padding: '6px 10px',
                                        borderRadius: 6, border: '1px solid #E8830C',
                                        background: '#12121f', color: '#e0e0e0', outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                <button
                                    onClick={handleNewFolder}
                                    style={{
                                        padding: '6px 10px', borderRadius: 6, border: 'none',
                                        background: '#E8830C', color: '#1a1a1a', fontSize: 12,
                                        fontWeight: 600, cursor: 'pointer', flexShrink: 0
                                    }}
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            style={S.addBtn}
                            onClick={() => setIsCreatingFolder(true)}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8830C'; e.currentTarget.style.color = '#E8830C'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3a3a5a'; e.currentTarget.style.color = '#6b7280'; }}
                        >
                            <Plus size={14} /> Tạo folder mới
                        </button>
                    )}
                </div>
            </aside>

            {/* ── Context Menu ── */}
            {contextMenu && (
                <div
                    style={{ ...S.ctxMenu, left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button
                        style={S.ctxItem(false)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={handleRenameStart}
                    >
                        <Pencil size={13} /> Đổi tên
                    </button>
                    <button
                        style={S.ctxItem(false)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={handleCreateSub}
                    >
                        <FolderPlus size={13} /> Tạo subfolder
                    </button>
                    <button
                        style={S.ctxItem(false)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={handleMoveStart}
                    >
                        <Move size={13} /> Di chuyển đến...
                    </button>
                    <div style={S.ctxDivider} />
                    <button
                        style={S.ctxItem(false)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={handleCopyLink}
                    >
                        <Link size={13} /> Copy link Drive
                    </button>
                    <div style={S.ctxDivider} />
                    <button
                        style={S.ctxItem(true)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={handleDelete}
                    >
                        <Trash2 size={13} /> Xóa
                    </button>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteTarget && (
                <div style={S.confirmOverlay} onClick={() => setDeleteTarget(null)}>
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
                                    Xóa folder "{deleteTarget.name}"?
                                </h3>
                                <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>Hành động không thể hoàn tác</p>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
                            Các file bên trong folder sẽ bị xóa.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    padding: '8px 18px', borderRadius: 10, border: 'none',
                                    background: 'transparent', color: '#9ca3af', fontSize: 13,
                                    fontWeight: 500, cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.style.color = '#e0e0e0'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                            >Hủy</button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '8px 18px', borderRadius: 10, border: 'none',
                                    background: '#ef4444', color: '#fff', fontSize: 13,
                                    fontWeight: 600, cursor: 'pointer', transition: 'background 200ms',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
                            >Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Move Dialog ── */}
            {moveTarget && (
                <MoveDialog
                    folders={folders}
                    currentId={moveTarget}
                    onMove={handleMove}
                    onClose={() => setMoveTarget(null)}
                />
            )}
        </>
    );
}
