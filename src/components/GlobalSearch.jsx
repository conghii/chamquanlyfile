import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Search, X, ChevronDown, ChevronUp, Image as ImageIcon, Film, FileText,
    FileSpreadsheet, File, Calendar, User, Package, Tag, Filter,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Inject CSS
   ═══════════════════════════════════════════════════════════════ */
if (typeof document !== 'undefined') {
    const ID = 'gs-styles';
    if (!document.getElementById(ID)) {
        const s = document.createElement('style');
        s.id = ID;
        s.textContent = `
      @keyframes gs-fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      .gs-scroll::-webkit-scrollbar{width:3px}
      .gs-scroll::-webkit-scrollbar-track{background:transparent}
      .gs-scroll::-webkit-scrollbar-thumb{background:#3a3a5a;border-radius:3px}
    `;
        document.head.appendChild(s);
    }
}

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const FILE_TYPE_CHIPS = [
    { label: 'Ảnh', mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], icon: ImageIcon, color: '#3b82f6' },
    { label: 'Video', mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'], icon: Film, color: '#a78bfa' },
    { label: 'PDF', mimeTypes: ['application/pdf'], icon: FileText, color: '#ef4444' },
    { label: 'Text', mimeTypes: ['text/plain', 'text/csv'], icon: File, color: '#6b7280' },
    { label: 'Sheets', mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], icon: FileSpreadsheet, color: '#22c55e' },
];

const DATE_PRESETS = [
    { label: 'Hôm nay', days: 0 },
    { label: '7 ngày', days: 7 },
    { label: '30 ngày', days: 30 },
    { label: 'Tùy chỉnh...', days: -1 },
];

/* ═══════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════ */
const S = {
    wrap: { position: 'relative', width: '100%' },
    inputWrap: { position: 'relative' },
    input: {
        width: '100%', height: 40, fontSize: 13, padding: '0 36px 0 40px',
        borderRadius: 10, border: '1px solid #2a2a4a', background: '#16213e',
        color: '#e0e0e0', outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 200ms',
    },
    panel: {
        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
        background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10,
        boxShadow: '0 12px 48px rgba(0,0,0,0.6)', zIndex: 50,
        maxHeight: 400, overflowY: 'auto', animation: 'gs-fadeIn 150ms',
    },
    section: { padding: '10px 14px', borderBottom: '1px solid #2a2a3e' },
    sectionTitle: {
        fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
        letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
    },
    chip: (active, color) => ({
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
        border: `1px solid ${active ? color : '#2a2a4a'}`,
        background: active ? `${color}15` : '#2a2a3e',
        color: active ? color : '#9ca3af',
        cursor: 'pointer', transition: 'all 150ms', marginRight: 6, marginBottom: 4,
    }),
    activeChip: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 500,
        background: 'rgba(232,131,12,0.1)', border: '1px solid rgba(232,131,12,0.3)',
        color: '#E8830C', marginRight: 4, marginTop: 4,
    },
    dropdown: {
        width: '100%', fontSize: 12, padding: '7px 10px', borderRadius: 6,
        border: '1px solid #2a2a3e', background: '#12121f', color: '#e0e0e0',
        outline: 'none', fontFamily: 'inherit', appearance: 'none',
        cursor: 'pointer',
    },
    previewItem: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
        cursor: 'pointer', transition: 'background 150ms', borderRadius: 6, margin: '0 4px',
    },
};

/* ═══════════════════════════════════════════════════════════════
   HighlightText
   ═══════════════════════════════════════════════════════════════ */
function HighlightText({ text, query }) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <span style={{ background: 'rgba(232,131,12,0.3)', color: '#E8830C', borderRadius: 2, padding: '0 1px' }}>
                {text.slice(idx, idx + query.length)}
            </span>
            {text.slice(idx + query.length)}
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   GlobalSearch Component
   ═══════════════════════════════════════════════════════════════ */
export default function GlobalSearch({
    onSearch,
    asinList = [],
    memberList = [],
    kanbanColumns = [],
    previewResults = [],    // optional: parent passes preview results
    totalResults = 0,
}) {
    /* ── State ── */
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Filters
    const [activeTypes, setActiveTypes] = useState(new Set());       // Set of FILE_TYPE_CHIPS indices
    const [activeStatuses, setActiveStatuses] = useState(new Set()); // Set of column.id
    const [selectedAsin, setSelectedAsin] = useState(null);          // asinId | 'unassigned' | null
    const [selectedMember, setSelectedMember] = useState(null);      // uid | null
    const [datePreset, setDatePreset] = useState(null);              // days | null
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [activeTags, setActiveTags] = useState([]);

    const wrapRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    /* ── Close panel on outside click ── */
    useEffect(() => {
        if (!isOpen) return;
        const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [isOpen]);

    /* ── Build filter object ── */
    const buildFilters = useCallback(() => {
        const mimeTypes = [];
        activeTypes.forEach(idx => {
            mimeTypes.push(...FILE_TYPE_CHIPS[idx].mimeTypes);
        });

        let dateRange = null;
        if (datePreset !== null && datePreset >= 0) {
            const to = new Date();
            const from = new Date();
            if (datePreset === 0) from.setHours(0, 0, 0, 0);
            else from.setDate(from.getDate() - datePreset);
            dateRange = { from, to };
        } else if (datePreset === -1 && customDateFrom && customDateTo) {
            dateRange = { from: new Date(customDateFrom), to: new Date(customDateTo) };
        }

        const statuses = [...activeStatuses];

        return {
            query: query.trim(),
            mimeTypes: mimeTypes.length > 0 ? mimeTypes : undefined,
            asinId: selectedAsin,
            uploadedBy: selectedMember,
            kanbanStatus: statuses.length === 1 ? statuses[0] : statuses.length > 0 ? statuses : null,
            tags: activeTags.length > 0 ? activeTags : undefined,
            dateRange,
        };
    }, [query, activeTypes, activeStatuses, selectedAsin, selectedMember, datePreset, customDateFrom, customDateTo, activeTags]);

    /* ── Debounced search ── */
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (onSearch) onSearch(buildFilters());
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query]); // Only debounce text

    /* ── Immediate filter apply (no debounce) ── */
    const applyFiltersNow = useCallback(() => {
        if (onSearch) onSearch(buildFilters());
    }, [onSearch, buildFilters]);

    /* ── Toggle type chip ── */
    const toggleType = (idx) => {
        setActiveTypes(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
        setTimeout(applyFiltersNow, 0);
    };

    /* ── Toggle status chip ── */
    const toggleStatus = (colId) => {
        setActiveStatuses(prev => {
            const next = new Set(prev);
            if (next.has(colId)) next.delete(colId); else next.add(colId);
            return next;
        });
        setTimeout(applyFiltersNow, 0);
    };

    /* ── Clear all filters ── */
    const clearAll = () => {
        setQuery('');
        setActiveTypes(new Set());
        setActiveStatuses(new Set());
        setSelectedAsin(null);
        setSelectedMember(null);
        setDatePreset(null);
        setCustomDateFrom('');
        setCustomDateTo('');
        setActiveTags([]);
        if (onSearch) onSearch({ query: '' });
    };

    /* ── Add tag ── */
    const addTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            const tag = tagInput.trim();
            if (!activeTags.includes(tag)) {
                setActiveTags(prev => [...prev, tag]);
                setTimeout(applyFiltersNow, 0);
            }
            setTagInput('');
        }
    };

    /* ── Remove tag ── */
    const removeTag = (tag) => {
        setActiveTags(prev => prev.filter(t => t !== tag));
        setTimeout(applyFiltersNow, 0);
    };

    /* ── Has any active filter? ── */
    const hasFilters = activeTypes.size > 0 || activeStatuses.size > 0 || selectedAsin || selectedMember || datePreset !== null || activeTags.length > 0;

    /* ── Active filter chips (shown below search bar) ── */
    const filterChips = useMemo(() => {
        const chips = [];
        if (activeTypes.size > 0) {
            const labels = [...activeTypes].map(i => FILE_TYPE_CHIPS[i].label).join(', ');
            chips.push({ key: 'types', label: `Loại: ${labels}`, onRemove: () => { setActiveTypes(new Set()); setTimeout(applyFiltersNow, 0); } });
        }
        if (selectedAsin) {
            const asin = asinList.find(a => a.id === selectedAsin);
            const label = selectedAsin === 'unassigned' ? 'Chưa gán ASIN' : `ASIN: ${asin?.code || selectedAsin}`;
            chips.push({ key: 'asin', label, onRemove: () => { setSelectedAsin(null); setTimeout(applyFiltersNow, 0); } });
        }
        if (selectedMember) {
            const member = memberList.find(m => m.uid === selectedMember);
            chips.push({ key: 'member', label: `Upload bởi: ${member?.displayName || selectedMember}`, onRemove: () => { setSelectedMember(null); setTimeout(applyFiltersNow, 0); } });
        }
        if (datePreset !== null) {
            const preset = DATE_PRESETS.find(p => p.days === datePreset);
            chips.push({ key: 'date', label: preset ? preset.label : 'Tùy chỉnh', onRemove: () => { setDatePreset(null); setTimeout(applyFiltersNow, 0); } });
        }
        if (activeStatuses.size > 0) {
            const labels = [...activeStatuses].map(id => kanbanColumns.find(c => c.id === id)?.title || id).join(', ');
            chips.push({ key: 'status', label: `Trạng thái: ${labels}`, onRemove: () => { setActiveStatuses(new Set()); setTimeout(applyFiltersNow, 0); } });
        }
        activeTags.forEach(tag => {
            chips.push({ key: `tag-${tag}`, label: `#${tag}`, onRemove: () => removeTag(tag) });
        });
        return chips;
    }, [activeTypes, selectedAsin, selectedMember, datePreset, activeStatuses, activeTags, asinList, memberList, kanbanColumns, applyFiltersNow]);

    /* ── Handle Enter ── */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { applyFiltersNow(); setIsOpen(false); }
        if (e.key === 'Escape') setIsOpen(false);
    };

    /* ═══ RENDER ═══ */
    return (
        <div ref={wrapRef} style={S.wrap}>

            {/* ── Search Input ── */}
            <div style={S.inputWrap}>
                <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                    ref={inputRef}
                    style={S.input}
                    placeholder="Tìm file, ASIN, tags..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />
                {(query || hasFilters) && (
                    <button onClick={clearAll}
                        style={{
                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                            width: 20, height: 20, borderRadius: 4, border: 'none',
                            background: 'transparent', color: '#6b7280', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* ── Active Filter Chips (below search bar) ── */}
            {filterChips.length > 0 && !isOpen && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, marginTop: 4 }}>
                    {filterChips.map(chip => (
                        <span key={chip.key} style={S.activeChip}>
                            {chip.label}
                            <X size={10} style={{ cursor: 'pointer', marginLeft: 2 }}
                                onClick={() => chip.onRemove()} />
                        </span>
                    ))}
                </div>
            )}

            {/* ── Dropdown Panel ── */}
            {isOpen && (
                <div className="gs-scroll" style={S.panel}>

                    {/* Section 1: Quick Filters */}
                    <div style={S.section}>
                        <div style={{ ...S.sectionTitle, justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Filter size={10} /> Bộ lọc nhanh
                            </span>
                            {hasFilters && (
                                <button onClick={clearAll}
                                    style={{
                                        border: 'none', background: 'transparent', color: '#E8830C',
                                        fontSize: 10, cursor: 'pointer', fontWeight: 600
                                    }}>
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        {/* File type chips */}
                        <div style={{ marginBottom: 8 }}>
                            {FILE_TYPE_CHIPS.map((chip, i) => {
                                const active = activeTypes.has(i);
                                const Icon = chip.icon;
                                return (
                                    <button key={i} style={S.chip(active, chip.color)} onClick={() => toggleType(i)}>
                                        <Icon size={12} /> {chip.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Status chips */}
                        {kanbanColumns.length > 0 && (
                            <div>
                                {kanbanColumns.map(col => {
                                    const active = activeStatuses.has(col.id);
                                    return (
                                        <button key={col.id}
                                            style={S.chip(active, col.color || '#6b7280')}
                                            onClick={() => toggleStatus(col.id)}>
                                            {col.title}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Advanced Filters */}
                    <div style={S.section}>
                        <button onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{
                                ...S.sectionTitle, cursor: 'pointer', border: 'none',
                                background: 'transparent', width: '100%', justifyContent: 'space-between',
                                padding: 0, marginBottom: showAdvanced ? 10 : 0,
                            }}>
                            <span>Bộ lọc nâng cao</span>
                            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {showAdvanced && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {/* ASIN */}
                                <div>
                                    <label style={{ fontSize: 10, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <Package size={10} /> ASIN
                                    </label>
                                    <select style={S.dropdown}
                                        value={selectedAsin || ''}
                                        onChange={(e) => { setSelectedAsin(e.target.value || null); setTimeout(applyFiltersNow, 0); }}>
                                        <option value="">Tất cả</option>
                                        <option value="unassigned">Chưa gán ASIN</option>
                                        {asinList.map(a => (
                                            <option key={a.id} value={a.id}>{a.code} — {a.productName || 'N/A'}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Member */}
                                <div>
                                    <label style={{ fontSize: 10, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <User size={10} /> Người upload
                                    </label>
                                    <select style={S.dropdown}
                                        value={selectedMember || ''}
                                        onChange={(e) => { setSelectedMember(e.target.value || null); setTimeout(applyFiltersNow, 0); }}>
                                        <option value="">Tất cả</option>
                                        {memberList.map(m => (
                                            <option key={m.uid} value={m.uid}>{m.displayName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: 10, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <Calendar size={10} /> Thời gian
                                    </label>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {DATE_PRESETS.map(preset => (
                                            <button key={preset.days}
                                                style={S.chip(datePreset === preset.days, '#E8830C')}
                                                onClick={() => {
                                                    setDatePreset(datePreset === preset.days ? null : preset.days);
                                                    setTimeout(applyFiltersNow, 0);
                                                }}>
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                    {datePreset === -1 && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                            <input type="date" value={customDateFrom}
                                                onChange={(e) => { setCustomDateFrom(e.target.value); setTimeout(applyFiltersNow, 0); }}
                                                style={{ ...S.dropdown, flex: 1, fontSize: 11 }} />
                                            <span style={{ color: '#6b7280', fontSize: 12, display: 'flex', alignItems: 'center' }}>→</span>
                                            <input type="date" value={customDateTo}
                                                onChange={(e) => { setCustomDateTo(e.target.value); setTimeout(applyFiltersNow, 0); }}
                                                style={{ ...S.dropdown, flex: 1, fontSize: 11 }} />
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: 10, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <Tag size={10} /> Tags
                                    </label>
                                    <input value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={addTag}
                                        placeholder="Nhập tag rồi nhấn Enter..."
                                        style={{ ...S.dropdown, cursor: 'text' }} />
                                    {activeTags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 6 }}>
                                            {activeTags.map(tag => (
                                                <span key={tag} style={S.activeChip}>
                                                    #{tag}
                                                    <X size={10} style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => removeTag(tag)} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Search Results Preview */}
                    {query.trim() && previewResults.length > 0 && (
                        <div style={{ padding: '6px 0' }}>
                            <div style={{ ...S.sectionTitle, padding: '0 14px', marginBottom: 4 }}>
                                <Search size={10} /> Kết quả
                            </div>
                            {previewResults.slice(0, 5).map(file => {
                                const Icon = file.mimeType?.startsWith('image/') ? ImageIcon
                                    : file.mimeType?.startsWith('video/') ? Film : FileText;
                                return (
                                    <div key={file.id} style={S.previewItem}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a40'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        onClick={() => { setIsOpen(false); /* parent should handle navigation */ }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 6, overflow: 'hidden',
                                            background: '#12121f', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            {file.thumbnailUrl ? (
                                                <img src={file.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Icon size={14} color="#3a3a5a" />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 12, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <HighlightText text={file.name || ''} query={query} />
                                            </p>
                                            {file.folderPath && (
                                                <p style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>{file.folderPath}</p>
                                            )}
                                        </div>
                                        {file.asinCode && (
                                            <span style={{
                                                fontSize: 10, fontFamily: 'monospace', background: '#E8830C',
                                                color: '#fff', padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                                            }}>{file.asinCode}</span>
                                        )}
                                    </div>
                                );
                            })}
                            {totalResults > 5 && (
                                <button onClick={() => { applyFiltersNow(); setIsOpen(false); }}
                                    style={{
                                        display: 'block', width: '100%', padding: '8px 14px',
                                        border: 'none', background: 'transparent', color: '#E8830C',
                                        fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a40'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    Xem tất cả {totalResults} kết quả →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
