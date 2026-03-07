import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    X, Search, Plus, MoreHorizontal, Pencil, Trash2, Upload, Check,
    AlertTriangle, FileText, Package,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Inject CSS
   ═══════════════════════════════════════════════════════════════ */
if (typeof document !== 'undefined') {
    const ID = 'asin-mgr-styles';
    if (!document.getElementById(ID)) {
        const s = document.createElement('style');
        s.id = ID;
        s.textContent = `
      @keyframes am-fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes am-fadeOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(8px)} }
      @keyframes am-scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      @keyframes am-slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      .am-scroll::-webkit-scrollbar{width:3px}
      .am-scroll::-webkit-scrollbar-track{background:transparent}
      .am-scroll::-webkit-scrollbar-thumb{background:#3a3a5a;border-radius:3px}
    `;
        document.head.appendChild(s);
    }
}

/* ═══════════════════════════════════════════════════════════════
   ASIN Validation
   ═══════════════════════════════════════════════════════════════ */
function validateAsin(code, existingCodes = []) {
    if (!code) return { valid: false, error: null }; // Empty = no error shown
    const c = code.toUpperCase();
    if (!/^[A-Z0-9]*$/.test(c)) return { valid: false, error: 'ASIN chỉ gồm chữ và số' };
    if (c.length < 10) return { valid: false, error: `ASIN phải đúng 10 ký tự (hiện ${c.length}/10)` };
    if (c.length > 10) return { valid: false, error: 'ASIN tối đa 10 ký tự' };
    if (existingCodes.includes(c)) return { valid: false, error: 'ASIN này đã tồn tại' };
    return { valid: true, error: null };
}

/* ═══════════════════════════════════════════════════════════════
   CSV Parsing
   ═══════════════════════════════════════════════════════════════ */
function parseCsvLine(line) {
    const parts = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            parts.push(current);
            current = '';
        } else {
            current += line[i];
        }
    }
    parts.push(current);
    return parts.map(s => s.trim().replace(/^"|"$/g, ''));
}

function parseCsv(text, existingCodes) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];

    let hasHeader = false;
    const firstLine = lines[0].toLowerCase();

    if (firstLine.includes('asin') || firstLine.includes('parent') || firstLine.includes('child') || firstLine.includes('title')) {
        hasHeader = true;
    }

    let asinIndex = 0;
    let nameIndex = 1;
    let categoryIndex = -1;

    if (hasHeader) {
        const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());

        const childAsinIdx = headers.findIndex(h => h.includes('child'));
        const parentAsinIdx = headers.findIndex(h => h.includes('parent'));
        const anyAsinIdx = headers.findIndex(h => h.includes('asin') && !h.includes('parent'));

        if (childAsinIdx !== -1) {
            asinIndex = childAsinIdx;
        } else if (anyAsinIdx !== -1) {
            asinIndex = anyAsinIdx;
        } else if (parentAsinIdx === 0 && headers.length > 1) {
            asinIndex = 1;
        }

        const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name') || h.includes('tên') || h.includes('sản phẩm') || h.includes('item'));
        if (titleIdx !== -1) {
            nameIndex = titleIdx;
        } else {
            let found = false;
            for (let i = 0; i < headers.length; i++) {
                if (i !== asinIndex && i !== parentAsinIdx) {
                    nameIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) nameIndex = asinIndex + 1;
        }

        const catIdx = headers.findIndex(h => h.includes('category') || h.includes('ngách') || h.includes('loại') || h.includes('label'));
        if (catIdx !== -1) categoryIndex = catIdx;

    } else {
        const firstRowCols = parseCsvLine(lines[0]);
        const isAsin = (s) => /^[A-Z0-9]{10}$/i.test(s.trim());
        if (firstRowCols.length >= 2 && isAsin(firstRowCols[0]) && isAsin(firstRowCols[1])) {
            asinIndex = 1;
            nameIndex = 2; // Assuming Parent, Child, Name
        }
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const seenCodes = new Set(existingCodes);

    return dataLines.map(line => {
        const parts = parseCsvLine(line);
        const code = (parts[asinIndex] || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        let productName = parts[nameIndex] || '';
        if (productName) {
            productName = productName.split(/\s+/).slice(0, 4).join(' ');
        }
        const category = categoryIndex !== -1 ? (parts[categoryIndex] || '').trim() : '';

        if (!code) return null;

        const v = validateAsin(code, Array.from(seenCodes));
        const isDuplicate = seenCodes.has(code);

        if (v.valid && !isDuplicate) {
            seenCodes.add(code);
        }

        return {
            code,
            productName,
            category,
            valid: v.valid && !isDuplicate,
            error: isDuplicate ? 'Đã tồn tại' : v.valid ? null : 'Không đúng format',
            status: isDuplicate ? 'duplicate' : v.valid ? 'valid' : 'invalid',
        };
    }).filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════ */
const S = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16, animation: 'am-scaleIn 200ms',
    },
    dialog: {
        width: '100%', maxWidth: 520, maxHeight: '70vh', borderRadius: 16, background: '#16213e',
        border: '1px solid #2a2a3e', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'am-slideUp 300ms ease-out',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
        borderBottom: '1px solid #2a2a3e', flexShrink: 0,
    },
    searchWrap: { position: 'relative', padding: '0 16px 12px', flexShrink: 0 },
    searchInput: {
        width: '100%', fontSize: 12, padding: '8px 12px 8px 34px', borderRadius: 8,
        border: '1px solid #2a2a3e', background: '#12121f', color: '#e0e0e0', outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 200ms',
    },
    list: { flex: 1, overflowY: 'auto', padding: '0 16px' },
    item: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8,
        transition: 'background 150ms', marginBottom: 2,
    },
    badge: {
        fontFamily: '"SF Mono","Fira Code",monospace', fontSize: 11, fontWeight: 700,
        background: '#E8830C', color: '#fff', padding: '3px 8px', borderRadius: 4,
        letterSpacing: '0.5px', flexShrink: 0, userSelect: 'all',
    },
    fileBadge: {
        fontSize: 10, color: '#6b7280', background: '#2a2a3e', padding: '2px 6px', borderRadius: 10,
        flexShrink: 0, whiteSpace: 'nowrap',
    },
    addRow: {
        padding: '12px 16px', borderTop: '1px solid #2a2a3e', flexShrink: 0,
    },
    input: (borderColor) => ({
        flex: 1, fontSize: 12, padding: '8px 10px', borderRadius: 6, border: `1px solid ${borderColor}`,
        background: '#12121f', color: '#e0e0e0', outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 200ms',
    }),
    codeInput: (borderColor) => ({
        width: 120, fontSize: 12, padding: '8px 10px', borderRadius: 6, border: `1px solid ${borderColor}`,
        background: '#12121f', color: '#e0e0e0', outline: 'none',
        fontFamily: '"SF Mono","Fira Code",monospace', letterSpacing: '0.5px', textTransform: 'uppercase',
        transition: 'border-color 200ms',
    }),
    btn: (bg, color) => ({
        padding: '8px 14px', borderRadius: 6, border: 'none', background: bg, color, fontSize: 12,
        fontWeight: 600, cursor: 'pointer', transition: 'opacity 200ms', display: 'flex', alignItems: 'center', gap: 4,
    }),
    ctxMenu: {
        position: 'absolute', right: 0, top: '100%', zIndex: 10, background: '#16213e', border: '1px solid #2a2a4a',
        borderRadius: 8, padding: 4, minWidth: 140, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        animation: 'am-scaleIn 150ms',
    },
    ctxItem: (danger) => ({
        display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 4,
        border: 'none', background: 'transparent', color: danger ? '#ef4444' : '#e0e0e0', fontSize: 12,
        cursor: 'pointer', textAlign: 'left', transition: 'background 150ms',
    }),
    csvPreview: {
        padding: '12px 16px', borderTop: '1px solid #2a2a3e', maxHeight: 200, overflowY: 'auto',
    },
};

/* ═══════════════════════════════════════════════════════════════
   AsinItem — single row in the list
   ═══════════════════════════════════════════════════════════════ */
function AsinItem({ asin, onUpdate, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(asin.productName || '');
    const [editCategory, setEditCategory] = useState(asin.category || '');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const editRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (isEditing) {
            setEditName(asin.productName || '');
            setEditCategory(asin.category || '');
            setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 50);
        }
    }, [isEditing, asin.productName, asin.category]);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [menuOpen]);

    const handleSave = () => {
        const trimmedName = editName.trim();
        const trimmedCat = editCategory.trim();
        if (trimmedName !== (asin.productName || '') || trimmedCat !== (asin.category || '')) {
            onUpdate(asin.id, { productName: trimmedName, category: trimmedCat });
        }
        setIsEditing(false);
    };

    return (
        <div style={S.item}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a40'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
            {/* ASIN badge */}
            <span style={S.badge}>{asin.code}</span>

            {/* Product name & Category — editable */}
            {isEditing ? (
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}
                    onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                            handleSave();
                        }
                    }}
                >
                    <input value={editCategory}
                        list="category-options"
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="Ngách (vd: Jar)"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
                        style={{ ...S.input('#E8830C'), width: 90, flex: 'none', fontSize: 12 }}
                    />
                    <input ref={editRef} value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Tên sản phẩm"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
                        style={{ ...S.input('#E8830C'), flex: 1, fontSize: 12 }}
                    />
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => setIsEditing(true)}
                    title="Click để sửa"
                >
                    {asin.category && (
                        <span style={{
                            fontSize: 10, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
                            padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', border: '1px solid rgba(245,158,11,0.2)'
                        }}>
                            {asin.category}
                        </span>
                    )}
                    <span style={{
                        fontSize: 12, color: asin.productName ? '#e0e0e0' : '#6b7280',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {asin.productName || 'Chưa đặt tên'}
                    </span>
                </div>
            )}

            {/* File count badge */}
            {asin.fileCount > 0 && (
                <span style={S.fileBadge}>{asin.fileCount} files</span>
            )}

            {/* Menu trigger */}
            <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                        width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent',
                        color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3e'; e.currentTarget.style.color = '#e0e0e0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                >
                    <MoreHorizontal size={14} />
                </button>

                {menuOpen && (
                    <div style={S.ctxMenu}>
                        <button style={S.ctxItem(false)}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            onClick={() => { setMenuOpen(false); setIsEditing(true); }}
                        ><Pencil size={12} /> Đổi tên</button>
                        <button style={S.ctxItem(true)}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                        ><Trash2 size={12} /> Xóa</button>
                    </div>
                )}
            </div>

            {/* Delete confirmation */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)'
                }}
                    onClick={() => setConfirmDelete(false)}>
                    <div style={{
                        width: '100%', maxWidth: 360, padding: 24, borderRadius: 16, background: '#16213e',
                        border: '1px solid #2a2a3e', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', animation: 'am-scaleIn 200ms'
                    }}
                        onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <AlertTriangle size={18} color="#ef4444" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e0e0e0' }}>Xóa ASIN {asin.code}?</p>
                            </div>
                        </div>
                        {asin.fileCount > 0 && (
                            <p style={{
                                fontSize: 12, color: '#f59e0b', margin: '0 0 16px', lineHeight: 1.5,
                                background: 'rgba(245,158,11,0.06)', padding: '8px 12px', borderRadius: 8,
                                border: '1px solid rgba(245,158,11,0.15)'
                            }}>
                                ⚠️ ASIN này đang được gán cho <strong>{asin.fileCount} files</strong>. Xóa sẽ bỏ gán khỏi tất cả files.
                            </p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setConfirmDelete(false)}
                                style={{ ...S.btn('transparent', '#9ca3af'), padding: '6px 14px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >Hủy</button>
                            <button onClick={() => { onDelete(asin.id); setConfirmDelete(false); }}
                                style={{ ...S.btn('#ef4444', '#fff'), padding: '6px 14px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                            >Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   CSV Import Preview
   ═══════════════════════════════════════════════════════════════ */
function CsvPreview({ rows, onImport, onCancel }) {
    const validCount = rows.filter(r => r.valid).length;
    return (
        <div style={S.csvPreview}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>Preview CSV ({rows.length} dòng)</span>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={onCancel}
                        style={{ ...S.btn('transparent', '#6b7280'), padding: '4px 10px', fontSize: 11 }}
                    >Hủy</button>
                    <button onClick={() => onImport(rows.filter(r => r.valid))} disabled={validCount === 0}
                        style={{
                            ...S.btn(validCount > 0 ? '#E8830C' : '#2a2a3e', validCount > 0 ? '#1a1a1a' : '#6b7280'),
                            padding: '4px 10px', fontSize: 11, cursor: validCount ? 'pointer' : 'not-allowed'
                        }}
                    >Import {validCount} ASIN</button>
                </div>
            </div>
            {rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11 }}>
                    <span style={{ width: 16, textAlign: 'center' }}>
                        {row.status === 'valid' ? '✅' : row.status === 'duplicate' ? '⚠️' : '❌'}
                    </span>
                    <span style={{ fontFamily: 'monospace', color: row.valid ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                        {row.code || '—'}
                    </span>
                    <span style={{ color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.category ? `[${row.category}] ` : ''}{row.productName || ''}
                    </span>
                    {row.error && <span style={{ color: '#ef4444', fontSize: 10, flexShrink: 0 }}>{row.error}</span>}
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Main AsinManager Component
   ═══════════════════════════════════════════════════════════════ */
export default function AsinManager({ isOpen, onClose, asins = [], onCreateAsin, onImportAsins, onUpdateAsin, onDeleteAsin, onClearAllAsins }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [newCode, setNewCode] = useState('');
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [csvRows, setCsvRows] = useState(null);
    const [confirmClearAll, setConfirmClearAll] = useState(false);
    const csvInputRef = useRef(null);

    const existingCodes = useMemo(() => asins.map(a => a.code.toUpperCase()), [asins]);
    const existingCategories = useMemo(() => {
        const cats = new Set(asins.map(a => (a.category || '').trim()).filter(Boolean));
        return Array.from(cats).sort();
    }, [asins]);
    const validation = useMemo(() => validateAsin(newCode, existingCodes), [newCode, existingCodes]);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return asins;
        const q = searchQuery.toLowerCase();
        return asins.filter(a =>
            a.code.toLowerCase().includes(q) ||
            (a.productName || '').toLowerCase().includes(q) ||
            (a.category || '').toLowerCase().includes(q)
        );
    }, [asins, searchQuery]);

    const handleAdd = useCallback(() => {
        if (!validation.valid) return;
        const code = newCode.toUpperCase().trim();
        onCreateAsin(code, newName.trim(), newCategory.trim());
        setNewCode('');
        setNewName('');
        setNewCategory('');
    }, [newCode, newName, newCategory, validation, onCreateAsin]);

    const handleCodeInput = (e) => {
        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
        setNewCode(val);
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result;
            if (typeof text === 'string') {
                setCsvRows(parseCsv(text, existingCodes));
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleCsvImport = useCallback((validRows) => {
        if (onImportAsins) {
            onImportAsins(validRows);
        } else {
            validRows.forEach(row => onCreateAsin(row.code, row.productName, row.category));
        }
        setCsvRows(null);
    }, [onCreateAsin, onImportAsins]);

    // Border color for code input
    const codeBorder = !newCode ? '#2a2a3e' : validation.valid ? '#22c55e' : '#ef4444';

    if (!isOpen) return null;

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.dialog} onClick={(e) => e.stopPropagation()}>

                {/* ── Header ── */}
                <div style={S.header}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e0e0e0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package size={18} color="#E8830C" /> Quản lý ASIN
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                                {asins.length} sản phẩm
                            </p>
                            {asins.length > 0 && onClearAllAsins && (
                                <>
                                    <span style={{ color: '#2a2a3e' }}>•</span>
                                    <button
                                        onClick={() => setConfirmClearAll(true)}
                                        style={{ background: 'none', border: 'none', padding: 0, color: '#ef4444', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Xóa tất cả
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* CSV Import button */}
                        <button onClick={() => csvInputRef.current?.click()}
                            style={{ ...S.btn('transparent', '#6b7280'), padding: '6px 10px', fontSize: 11, border: '1px solid #2a2a3e', borderRadius: 6 }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8830C'; e.currentTarget.style.color = '#E8830C'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.color = '#6b7280'; }}
                            title="Import ASIN từ file CSV"
                        >
                            <Upload size={12} /> Import CSV
                        </button>
                        <input ref={csvInputRef} type="file" accept=".csv,.txt"
                            style={{ display: 'none' }} onChange={handleCsvUpload} />
                        {/* Close button */}
                        <button onClick={onClose}
                            style={{
                                width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
                                color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3e'; e.currentTarget.style.color = '#e0e0e0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Search ── */}
                <div style={S.searchWrap}>
                    <Search size={13} style={{ position: 'absolute', left: 28, top: 10, color: '#6b7280' }} />
                    <input
                        style={S.searchInput}
                        placeholder="Tìm ASIN hoặc tên sản phẩm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={(e) => { e.target.style.borderColor = '#E8830C'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#2a2a3e'; }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute', right: 28, top: 8, width: 18, height: 18, borderRadius: 4,
                                border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* ── CSV Preview ── */}
                {csvRows && (
                    <CsvPreview rows={csvRows} onImport={handleCsvImport} onCancel={() => setCsvRows(null)} />
                )}

                {/* ── ASIN List ── */}
                <div className="am-scroll" style={S.list}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                            <Package size={32} color="#3a3a5a" style={{ marginBottom: 8 }} />
                            <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                                {asins.length === 0
                                    ? 'Chưa có ASIN nào. Thêm ASIN sản phẩm Amazon để quản lý file theo sản phẩm.'
                                    : `Không tìm thấy "${searchQuery}"`}
                            </p>
                        </div>
                    ) : (
                        filtered.map(asin => (
                            <AsinItem key={asin.id} asin={asin}
                                onUpdate={onUpdateAsin} onDelete={onDeleteAsin} />
                        ))
                    )}
                </div>

                {/* ── Add New ASIN ── */}
                <div style={S.addRow}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <input
                                value={newCode}
                                onChange={handleCodeInput}
                                placeholder="VD: B0D1234567"
                                maxLength={10}
                                style={S.codeInput(codeBorder)}
                                onFocus={(e) => { if (!newCode) e.target.style.borderColor = '#E8830C'; }}
                                onBlur={(e) => { if (!newCode) e.target.style.borderColor = '#2a2a3e'; }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                            />
                            {/* Validation message */}
                            {newCode && !validation.valid && validation.error && (
                                <span style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>{validation.error}</span>
                            )}
                            {newCode && validation.valid && (
                                <span style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                                    <Check size={10} /> Hợp lệ
                                </span>
                            )}
                        </div>
                        <input
                            list="category-options"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Ngách (vd: Jar)"
                            style={{ ...S.input('#2a2a3e'), width: 100, flex: 'none' }}
                            onFocus={(e) => { e.target.style.borderColor = '#E8830C'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#2a2a3e'; }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                        />
                        <datalist id="category-options">
                            {existingCategories.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Tên sản phẩm (tùy chọn)"
                            style={S.input('#2a2a3e')}
                            onFocus={(e) => { e.target.style.borderColor = '#E8830C'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#2a2a3e'; }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                        />
                        <button onClick={handleAdd} disabled={!validation.valid}
                            style={{
                                ...S.btn(validation.valid ? '#E8830C' : '#2a2a3e', validation.valid ? '#1a1a1a' : '#6b7280'),
                                cursor: validation.valid ? 'pointer' : 'not-allowed',
                                flexShrink: 0,
                            }}
                        >
                            <Plus size={14} /> Thêm
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete All confirmation */}
            {confirmClearAll && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)'
                }}
                    onClick={() => setConfirmClearAll(false)}>
                    <div style={{
                        width: '100%', maxWidth: 360, padding: 24, borderRadius: 16, background: '#16213e',
                        border: '1px solid #2a2a3e', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', animation: 'am-scaleIn 200ms'
                    }}
                        onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <AlertTriangle size={18} color="#ef4444" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e0e0e0' }}>Xóa TẤT CẢ ASIN?</p>
                            </div>
                        </div>
                        <p style={{
                            fontSize: 12, color: '#f59e0b', margin: '0 0 16px', lineHeight: 1.5,
                            background: 'rgba(245,158,11,0.06)', padding: '8px 12px', borderRadius: 8,
                            border: '1px solid rgba(245,158,11,0.15)'
                        }}>
                            ⚠️ Thao tác này sẽ xóa toàn bộ <strong>{asins.length}</strong> ASIN khỏi hệ thống. Những file đang được gán ASIN sẽ mất liên kết. Bạn có chắc chắn không?
                        </p>
                        <div style={{ display: 'flex', justifyItems: 'flex-end', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmClearAll(false)}
                                style={{ ...S.btn('transparent', '#9ca3af'), padding: '6px 14px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >Hủy</button>
                            <button onClick={() => { onClearAllAsins(); setConfirmClearAll(false); }}
                                style={{ ...S.btn('#ef4444', '#fff'), padding: '6px 14px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                            >Xóa tất cả</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
