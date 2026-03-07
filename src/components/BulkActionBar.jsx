import { useState, useCallback, useRef, useEffect } from 'react';
import {
    X, FolderOpen, Tag, BarChart3, Trash2, Package, ChevronUp, Check, AlertTriangle,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Inject CSS
   ═══════════════════════════════════════════════════════════════ */
if (typeof document !== 'undefined') {
    const ID = 'ba-bar-styles';
    if (!document.getElementById(ID)) {
        const s = document.createElement('style');
        s.id = ID;
        s.textContent = `
      @keyframes ba-slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ba-fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes ba-scaleIn { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
    `;
        document.head.appendChild(s);
    }
}

/* ═══════════════════════════════════════════════════════════════
   Dropdown Picker (popover upward)
   ═══════════════════════════════════════════════════════════════ */
function DropdownPicker({ items, onSelect, onClose, labelKey = 'name', idKey = 'id', emptyText = 'Không có mục nào' }) {
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    return (
        <div ref={ref} style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
            background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', padding: 4, minWidth: 200,
            maxHeight: 240, overflowY: 'auto', animation: 'ba-scaleIn 150ms',
            zIndex: 10,
        }}>
            {items.length === 0 ? (
                <p style={{ padding: '12px 16px', fontSize: 11, color: '#6b7280', margin: 0 }}>{emptyText}</p>
            ) : items.map(item => (
                <button key={item[idKey]} onClick={() => { onSelect(item); onClose(); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '8px 12px', borderRadius: 6, border: 'none',
                        background: 'transparent', color: '#e0e0e0', fontSize: 12,
                        cursor: 'pointer', textAlign: 'left', transition: 'background 150ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a40'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item[labelKey]}
                    </span>
                </button>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Tag Input Popover
   ═══════════════════════════════════════════════════════════════ */
function TagInput({ onAdd, onClose }) {
    const [value, setValue] = useState('');
    const ref = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    const handleSubmit = () => {
        const tags = value.split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) { onAdd(tags); onClose(); }
    };

    return (
        <div ref={ref} style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
            background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', padding: 12, width: 240,
            animation: 'ba-scaleIn 150ms', zIndex: 10,
        }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: '#6b7280' }}>Nhập tags (phân tách bằng dấu phẩy)</p>
            <div style={{ display: 'flex', gap: 6 }}>
                <input ref={inputRef} value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose(); }}
                    placeholder="tag1, tag2..."
                    style={{
                        flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 6,
                        border: '1px solid #2a2a3e', background: '#12121f', color: '#e0e0e0',
                        outline: 'none', fontFamily: 'inherit',
                    }}
                />
                <button onClick={handleSubmit}
                    style={{
                        padding: '6px 10px', borderRadius: 6, border: 'none',
                        background: '#E8830C', color: '#1a1a1a', fontSize: 12,
                        fontWeight: 600, cursor: 'pointer',
                    }}>
                    <Check size={14} />
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Delete Confirmation
   ═══════════════════════════════════════════════════════════════ */
function DeleteConfirm({ count, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 120,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            animation: 'ba-fadeIn 200ms',
        }} onClick={onCancel}>
            <div style={{
                width: '100%', maxWidth: 380, padding: 24, borderRadius: 16,
                background: '#16213e', border: '1px solid #2a2a3e',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)', animation: 'ba-scaleIn 200ms',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'rgba(239,68,68,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AlertTriangle size={20} color="#ef4444" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>
                            Xóa {count} files?
                        </h3>
                        <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>Hành động không thể hoàn tác</p>
                    </div>
                </div>
                <p style={{
                    fontSize: 12, color: '#f59e0b', margin: '0 0 20px', lineHeight: 1.5,
                    background: 'rgba(245,158,11,0.06)', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid rgba(245,158,11,0.15)',
                }}>
                    ⚠️ Files cũng bị xóa khỏi Google Drive. Hành động không thể hoàn tác.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={onCancel}
                        style={{
                            padding: '8px 18px', borderRadius: 8, border: 'none',
                            background: 'transparent', color: '#9ca3af', fontSize: 12, cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >Hủy</button>
                    <button onClick={onConfirm}
                        style={{
                            padding: '8px 18px', borderRadius: 8, border: 'none',
                            background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >Xóa {count} files</button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   BulkActionBar
   ═══════════════════════════════════════════════════════════════ */
export default function BulkActionBar({
    selectedCount = 0,
    onBulkMove,
    onBulkAssignAsin,
    onBulkAddTags,
    onBulkChangeStatus,
    onBulkDelete,
    onClearSelection,
    folderList = [],
    asinList = [],
    kanbanColumns = [],
}) {
    const [activeDropdown, setActiveDropdown] = useState(null); // 'move'|'asin'|'tags'|'status'|null
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const closeAll = useCallback(() => setActiveDropdown(null), []);

    if (selectedCount === 0) return null;

    const actions = [
        {
            key: 'move', icon: FolderOpen, label: 'Di chuyển', color: '#3b82f6',
            onClick: () => setActiveDropdown(activeDropdown === 'move' ? null : 'move'),
        },
        {
            key: 'asin', icon: Package, label: 'Gán ASIN', color: '#E8830C',
            onClick: () => setActiveDropdown(activeDropdown === 'asin' ? null : 'asin'),
        },
        {
            key: 'tags', icon: Tag, label: 'Thêm tags', color: '#22c55e',
            onClick: () => setActiveDropdown(activeDropdown === 'tags' ? null : 'tags'),
        },
        {
            key: 'status', icon: BarChart3, label: 'Đổi trạng thái', color: '#a78bfa',
            onClick: () => setActiveDropdown(activeDropdown === 'status' ? null : 'status'),
        },
        {
            key: 'delete', icon: Trash2, label: 'Xóa', color: '#ef4444',
            onClick: () => setShowDeleteConfirm(true),
        },
    ];

    return (
        <>
            <div style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                zIndex: 90, display: 'flex', alignItems: 'center', gap: 16,
                background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 14,
                padding: '10px 20px', boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
                animation: 'ba-slideUp 300ms ease-out',
                maxWidth: 'calc(100vw - 32px)',
            }}>
                {/* Left: count + clear */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E8830C' }}>
                        Đã chọn {selectedCount} files
                    </span>
                    <button onClick={onClearSelection}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            border: 'none', background: 'transparent', color: '#6b7280',
                            fontSize: 11, cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                    >
                        <X size={10} /> Bỏ chọn
                    </button>
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 24, background: '#2a2a4a', flexShrink: 0 }} />

                {/* Right: action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
                    {actions.map(({ key, icon: Icon, label, color, onClick }) => (
                        <div key={key} style={{ position: 'relative' }}>
                            <button onClick={onClick}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '7px 12px', borderRadius: 8, border: 'none',
                                    background: activeDropdown === key ? `${color}15` : 'transparent',
                                    color: activeDropdown === key ? color : '#9ca3af',
                                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                    transition: 'all 150ms', whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.color = color; }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = activeDropdown === key ? `${color}15` : 'transparent';
                                    e.currentTarget.style.color = activeDropdown === key ? color : '#9ca3af';
                                }}
                            >
                                <Icon size={14} />
                                <span className="ba-label" style={{}}>{label}</span>
                            </button>

                            {/* Dropdowns */}
                            {activeDropdown === 'move' && key === 'move' && (
                                <DropdownPicker
                                    items={folderList}
                                    onSelect={(folder) => onBulkMove(folder.id)}
                                    onClose={closeAll}
                                    emptyText="Không có folder nào"
                                />
                            )}
                            {activeDropdown === 'asin' && key === 'asin' && (
                                <DropdownPicker
                                    items={asinList}
                                    labelKey="code"
                                    onSelect={(asin) => onBulkAssignAsin(asin.id)}
                                    onClose={closeAll}
                                    emptyText="Không có ASIN nào"
                                />
                            )}
                            {activeDropdown === 'tags' && key === 'tags' && (
                                <TagInput onAdd={onBulkAddTags} onClose={closeAll} />
                            )}
                            {activeDropdown === 'status' && key === 'status' && (
                                <DropdownPicker
                                    items={kanbanColumns}
                                    labelKey="title"
                                    onSelect={(col) => onBulkChangeStatus(col.id)}
                                    onClose={closeAll}
                                    emptyText="Chưa cấu hình Kanban"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete confirmation overlay */}
            {showDeleteConfirm && (
                <DeleteConfirm
                    count={selectedCount}
                    onConfirm={() => { onBulkDelete(); setShowDeleteConfirm(false); }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </>
    );
}
