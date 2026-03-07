import { useState, useMemo, useRef, useEffect } from 'react';
import {
    HiOutlinePhotograph, HiOutlineVideoCamera, HiOutlineDocumentText,
    HiOutlineCollection, HiOutlineExternalLink, HiOutlineFilter,
    HiOutlineCalendar, HiOutlineDatabase, HiX, HiOutlineChevronDown,
} from 'react-icons/hi';
import type { FileType, Label, AsinItem } from '../types';

interface FilterBarProps {
    appLabels: Label[];
    appAsins: AsinItem[];
    activeType: FileType | 'all';
    activeTags: string[];
    activeAsin: string;
    activeDateRange: string;
    activeSizeRange: string;
    allTags: string[];
    onTypeChange: (type: FileType | 'all') => void;
    onTagToggle: (tag: string) => void;
    onAsinChange: (asin: string) => void;
    onDateRangeChange: (range: string) => void;
    onSizeRangeChange: (range: string) => void;
    onClearAll: () => void;
    fileCount: number;
    totalCount: number;
}

const TYPE_FILTERS: { value: FileType | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'all', label: 'Tất cả', icon: <HiOutlineCollection size={14} />, color: '#8899AA' },
    { value: 'image', label: 'Ảnh', icon: <HiOutlinePhotograph size={14} />, color: '#10B981' },
    { value: 'video', label: 'Video', icon: <HiOutlineVideoCamera size={14} />, color: '#8B5CF6' },
    { value: 'text', label: 'Text', icon: <HiOutlineDocumentText size={14} />, color: '#3B82F6' },
    { value: 'pdf', label: 'PDF', icon: <HiOutlineDocumentText size={14} />, color: '#EF4444' },
    { value: 'xlsx', label: 'Sheets', icon: <HiOutlineCollection size={14} />, color: '#F59E0B' },
    { value: 'link', label: 'Links', icon: <HiOutlineExternalLink size={14} />, color: '#60A5FA' },
];

const DATE_RANGES = [
    { value: '', label: 'Mọi lúc' },
    { value: 'today', label: 'Hôm nay' },
    { value: '7d', label: '7 ngày' },
    { value: '30d', label: '30 ngày' },
    { value: '90d', label: '3 tháng' },
];

const SIZE_RANGES = [
    { value: '', label: 'Mọi kích thước' },
    { value: 'small', label: '< 1 MB' },
    { value: 'medium', label: '1 – 10 MB' },
    { value: 'large', label: '10 – 100 MB' },
    { value: 'xlarge', label: '> 100 MB' },
];

export default function FilterBar({
    appLabels, appAsins, activeType, activeTags, activeAsin, activeDateRange, activeSizeRange,
    allTags, onTypeChange, onTagToggle, onAsinChange, onDateRangeChange, onSizeRangeChange,
    onClearAll, fileCount, totalCount,
}: FilterBarProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isOpenAsin, setIsOpenAsin] = useState(false);
    const asinRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (asinRef.current && !asinRef.current.contains(e.target as Node)) {
                setIsOpenAsin(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasActiveFilters = activeType !== 'all' || activeTags.length > 0 || activeAsin || activeDateRange || activeSizeRange;
    const activeFilterCount = (activeType !== 'all' ? 1 : 0) + activeTags.length + (activeAsin ? 1 : 0) + (activeDateRange ? 1 : 0) + (activeSizeRange ? 1 : 0);

    // Unique ASIN values from props
    const asinOptions = useMemo(() => appAsins || [], [appAsins]);

    return (
        <div className="animate-fade-in space-y-2">
            {/* Row 1: Type + meta */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Type pills */}
                <div className="flex items-center gap-1 flex-wrap">
                    {TYPE_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => onTypeChange(f.value)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                                transition-all duration-150 ${activeType === f.value
                                    ? 'text-white shadow-lg'
                                    : 'text-text-secondary hover:text-white hover:bg-surface-3'
                                }`}
                            style={activeType === f.value ? {
                                background: `${f.color}20`,
                                color: f.color,
                                border: `1px solid ${f.color}40`,
                            } : { border: '1px solid transparent' }}
                        >
                            {f.icon}
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="hidden sm:block w-px h-5 bg-border" />

                {/* Tags inline */}
                {allTags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                        {allTags.slice(0, 6).map((tagId) => {
                            const lbl = appLabels.find(l => l.id === tagId);
                            const isActive = activeTags.includes(tagId);
                            if (lbl) {
                                return (
                                    <button
                                        key={tagId}
                                        onClick={() => onTagToggle(tagId)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-150 ${isActive ? 'shadow-md scale-105' : 'hover:scale-105'}`}
                                        style={isActive ? {
                                            backgroundColor: lbl.color,
                                            color: '#fff',
                                            boxShadow: `0 0 8px ${lbl.color}60`
                                        } : {
                                            backgroundColor: `${lbl.color}15`,
                                            color: lbl.color,
                                            border: `1px solid ${lbl.color}40`
                                        }}
                                    >
                                        {lbl.name}
                                    </button>
                                );
                            }
                            return (
                                <button key={tagId} onClick={() => onTagToggle(tagId)}
                                    className={`tag-chip cursor-pointer ${isActive ? 'active' : ''}`}>
                                    #{tagId}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Spacer + Advanced toggle + Count */}
                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200
                            ${showAdvanced || hasActiveFilters
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : 'text-text-muted hover:text-white hover:bg-surface-3 border border-transparent'}`}
                    >
                        <HiOutlineFilter size={13} />
                        Bộ lọc
                        {activeFilterCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-black flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                        <HiOutlineChevronDown size={12} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    <span className="text-[11px] text-text-muted tabular-nums">
                        {fileCount === totalCount ? `${fileCount} file` : `${fileCount} / ${totalCount}`}
                    </span>
                </div>
            </div>

            {/* Row 2: Advanced filters (collapsible) */}
            {showAdvanced && (
                <div className="relative z-40 bg-surface-3/30 rounded-xl border border-border/50 animate-fade-in">
                    <div className="flex items-center gap-2 flex-wrap px-1 py-2">
                        {/* ASIN filter (Searchable Dropdown) */}
                        <div className="flex items-center gap-1.5 relative">
                            <HiOutlineDatabase size={13} className="text-text-muted shrink-0" />

                            <div className="relative" ref={asinRef}>
                                <button
                                    onClick={() => setIsOpenAsin(!isOpenAsin)}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] bg-surface-3 border
                                        min-w-[140px] text-left transition-all ${isOpenAsin ? 'border-primary text-white shadow-[0_0_12px_rgba(255,153,0,0.15)]' : 'border-border text-white hover:border-primary/50'}`}
                                >
                                    <span className="flex-1 truncate">
                                        {activeAsin ? (() => {
                                            const a = asinOptions.find(opt => (opt.asin || opt.code) === activeAsin);
                                            return a ? (a.asin || a.code) : activeAsin;
                                        })() : 'Tất cả ASIN'}
                                    </span>
                                    <HiOutlineChevronDown size={12} className={`text-text-muted shrink-0 transition-transform ${isOpenAsin ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isOpenAsin && (
                                    <div className="absolute left-0 top-full mt-1 w-64 bg-surface-2 border border-border rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] z-50 animate-fade-in">
                                        <div className="p-2 border-b border-border/50">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Tìm ASIN hoặc Tên..."
                                                className="w-full bg-surface-3 border border-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-text-muted outline-none focus:border-primary"
                                                onChange={(e) => {
                                                    const v = e.target.value.toLowerCase();
                                                    const items = e.target.parentElement?.nextElementSibling?.children;
                                                    if (items) {
                                                        for (let i = 0; i < items.length; i++) {
                                                            const item = items[i] as HTMLElement;
                                                            item.style.display = item.textContent?.toLowerCase().includes(v) ? 'flex' : 'none';
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') setIsOpenAsin(false);
                                                }}
                                            />
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto sidebar-scroll p-1">
                                            <button
                                                onClick={() => { onAsinChange(''); setIsOpenAsin(false); }}
                                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors
                                                ${!activeAsin ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-surface-3 hover:text-white'}`}
                                            >
                                                <span>Tất cả ASIN</span>
                                                {!activeAsin && <span className="font-bold">✓</span>}
                                            </button>

                                            {asinOptions.map((a, idx) => {
                                                const aCode = a.asin || a.code || `asin-${idx}`;
                                                const aName = a.name || a.productName || '';
                                                return (
                                                    <button
                                                        key={aCode}
                                                        onClick={() => { onAsinChange(aCode); setIsOpenAsin(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors text-left
                                                    ${activeAsin === aCode ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-surface-3 hover:text-white'}`}
                                                    >
                                                        <span className="truncate pr-2">{aCode} {aName ? `— ${aName}` : ''}</span>
                                                        {activeAsin === aCode && <span className="font-bold shrink-0">✓</span>}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-px h-5 bg-border/50" />

                        {/* Date range */}
                        <div className="flex items-center gap-1.5">
                            <HiOutlineCalendar size={13} className="text-text-muted shrink-0" />
                            <div className="flex gap-0.5">
                                {DATE_RANGES.map(r => (
                                    <button key={r.value}
                                        onClick={() => onDateRangeChange(r.value)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all
                                        ${activeDateRange === r.value
                                                ? 'bg-primary/20 text-primary border border-primary/30'
                                                : 'text-text-muted hover:text-white hover:bg-surface-3 border border-transparent'}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-5 bg-border/50" />

                        {/* Size range */}
                        <div className="flex items-center gap-1.5">
                            <select
                                value={activeSizeRange}
                                onChange={(e) => onSizeRangeChange(e.target.value)}
                                className="px-2 py-1 rounded-lg text-[11px] bg-surface-3 border border-border text-white
                                outline-none focus:border-primary transition-all"
                            >
                                {SIZE_RANGES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Clear all */}
                        {hasActiveFilters && (
                            <>
                                <div className="w-px h-5 bg-border/50" />
                                <button onClick={onClearAll}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
                                        text-error hover:bg-error/10 transition-all">
                                    <HiX size={12} />
                                    Xoá bộ lọc
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Active filter summary chips */}
            {hasActiveFilters && !showAdvanced && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {activeAsin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            ASIN: {activeAsin}
                            <button onClick={() => onAsinChange('')} className="hover:text-error"><HiX size={10} /></button>
                        </span>
                    )}
                    {activeDateRange && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            {DATE_RANGES.find(r => r.value === activeDateRange)?.label}
                            <button onClick={() => onDateRangeChange('')} className="hover:text-error"><HiX size={10} /></button>
                        </span>
                    )}
                    {activeSizeRange && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            {SIZE_RANGES.find(r => r.value === activeSizeRange)?.label}
                            <button onClick={() => onSizeRangeChange('')} className="hover:text-error"><HiX size={10} /></button>
                        </span>
                    )}
                    <button onClick={onClearAll}
                        className="text-[10px] text-text-muted hover:text-error transition-colors">
                        Xoá tất cả
                    </button>
                </div>
            )}
        </div>
    );
}
