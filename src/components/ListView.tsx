import { useState, useMemo } from 'react';
import {
    HiOutlineChevronDown, HiOutlineChevronRight,
    HiOutlinePhotograph, HiOutlineVideoCamera,
    HiOutlineDocumentText, HiOutlineDocument,
    HiOutlineExternalLink,
} from 'react-icons/hi';
import { formatFileSize } from '../utils/fileUtils';
import type { AssetFile, FileType, Label, FolderNode } from '../types';
import { HiOutlineFolder } from 'react-icons/hi';

interface ListViewProps {
    files: AssetFile[];
    subfolders?: FolderNode[];
    appLabels: Label[];
    onFileClick: (file: AssetFile) => void;
    onFolderClick: (folderId: string) => void;
    isLoading: boolean;
}

type SortKey = 'name' | 'type' | 'size' | 'date';
type SortDir = 'asc' | 'desc';

const typeIcons: Record<FileType, { icon: typeof HiOutlinePhotograph; color: string }> = {
    image: { icon: HiOutlinePhotograph, color: '#3B82F6' },
    video: { icon: HiOutlineVideoCamera, color: '#8B5CF6' },
    text: { icon: HiOutlineDocumentText, color: '#10B981' },
    pdf: { icon: HiOutlineDocument, color: '#EF4444' },
    xlsx: { icon: HiOutlineDocumentText, color: '#22C55E' },
    link: { icon: HiOutlineExternalLink, color: '#6366F1' },
    other: { icon: HiOutlineDocument, color: '#6B7280' },
};

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function ListView({ files, subfolders = [], appLabels, onFileClick, onFolderClick, isLoading }: ListViewProps) {
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = useMemo(() => {
        const arr = [...files];
        arr.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'name': cmp = a.name.localeCompare(b.name); break;
                case 'type': cmp = a.type.localeCompare(b.type); break;
                case 'size': cmp = a.size - b.size; break;
                case 'date': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [files, sortKey, sortDir]);

    // Group by folder path
    const grouped = useMemo(() => {
        const map = new Map<string, AssetFile[]>();
        sorted.forEach(f => {
            const folder = f.category || 'Chưa phân loại';
            if (!map.has(folder)) map.set(folder, []);
            map.get(folder)!.push(f);
        });
        return map;
    }, [sorted]);

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <HiOutlineChevronDown size={12} className="text-text-muted/30" />;
        return sortDir === 'asc'
            ? <HiOutlineChevronDown size={12} className="text-primary rotate-180 transition-transform" />
            : <HiOutlineChevronDown size={12} className="text-primary transition-transform" />;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (files.length === 0 && subfolders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <span className="text-4xl mb-3">📁</span>
                <p className="text-sm font-medium text-text-secondary">Chưa có file nào</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_90px_140px] gap-2 px-4 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border sticky top-0 bg-bg z-10">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-white transition-colors text-left">
                    Tên <SortIcon col="name" />
                </button>
                <button onClick={() => toggleSort('type')} className="flex items-center gap-1 hover:text-white transition-colors">
                    Loại <SortIcon col="type" />
                </button>
                <button onClick={() => toggleSort('size')} className="flex items-center gap-1 hover:text-white transition-colors justify-end">
                    Kích thước <SortIcon col="size" />
                </button>
                <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-white transition-colors justify-end">
                    Cập nhật <SortIcon col="date" />
                </button>
            </div>

            {/* Subfolders list */}
            {subfolders.length > 0 && (
                <div className="border-b border-border/30">
                    {subfolders.map(folder => (
                        <div
                            key={folder.id}
                            onClick={() => onFolderClick(folder.id)}
                            className="grid grid-cols-[1fr_80px_90px_140px] gap-2 px-4 py-2.5 
                                hover:bg-surface-3/50 cursor-pointer transition-all duration-100 group border-b border-border/10"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-primary/10">
                                    <HiOutlineFolder size={16} className="text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-text-secondary group-hover:text-white truncate transition-colors font-medium">
                                        {folder.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="text-[10px] text-text-muted uppercase font-semibold">Folder</span>
                            </div>
                            <div className="flex items-center justify-end">
                                <span className="text-xs text-text-muted font-mono">--</span>
                            </div>
                            <div className="flex items-center justify-end">
                                <span className="text-xs text-text-muted">--</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Grouped file list */}
            <div className="divide-y divide-border/30">
                {Array.from(grouped.entries()).map(([folder, folderFiles]) => (
                    <FolderGroup
                        key={folder}
                        folder={folder}
                        files={folderFiles}
                        appLabels={appLabels}
                        onFileClick={onFileClick}
                    />
                ))}
            </div>
        </div>
    );
}

/* ── Folder Group ────────────────────────────────────────── */

function FolderGroup({
    folder, files, appLabels, onFileClick,
}: {
    folder: string; files: AssetFile[]; appLabels: Label[]; onFileClick: (f: AssetFile) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div>
            {/* Folder header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-surface-3/50 transition-colors text-left group"
            >
                {isExpanded
                    ? <HiOutlineChevronDown size={14} className="text-text-muted transition-transform" />
                    : <HiOutlineChevronRight size={14} className="text-text-muted transition-transform" />
                }
                <span className="text-xs font-semibold text-text-secondary group-hover:text-white transition-colors">
                    📁 {folder}
                </span>
                <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded-full bg-surface-3">
                    {files.length}
                </span>
            </button>

            {/* Files */}
            {isExpanded && (
                <div>
                    {files.map(file => {
                        const tIcon = typeIcons[file.type] || typeIcons.other;
                        const Icon = tIcon.icon;
                        return (
                            <div
                                key={file.id}
                                onClick={() => onFileClick(file)}
                                className="grid grid-cols-[1fr_80px_90px_140px] gap-2 px-4 py-2.5 pl-9
                                    hover:bg-surface-3/50 cursor-pointer transition-all duration-100 group border-b border-border/10"
                            >
                                {/* Name + thumbnail + tags */}
                                <div className="flex items-center gap-3 min-w-0">
                                    {file.thumbnailUrl ? (
                                        <img src={file.thumbnailUrl} alt=""
                                            className="w-8 h-8 rounded-md object-cover shrink-0 border border-border/50" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center"
                                            style={{ backgroundColor: `${tIcon.color}15` }}>
                                            <Icon size={16} color={tIcon.color} />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-text-secondary group-hover:text-white truncate transition-colors font-medium">
                                            {file.name}
                                        </p>
                                        {file.tags.length > 0 && (
                                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                {file.tags.slice(0, 3).map(tagId => {
                                                    const lbl = appLabels.find(l => l.id === tagId);
                                                    return (
                                                        <span key={tagId}
                                                            className="inline-block px-1.5 py-0 rounded text-[9px] font-medium"
                                                            style={lbl ? { backgroundColor: `${lbl.color}20`, color: lbl.color } : {
                                                                backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-muted)'
                                                            }}>
                                                            {lbl ? lbl.name : `#${tagId}`}
                                                        </span>
                                                    );
                                                })}
                                                {file.tags.length > 3 && (
                                                    <span className="text-[9px] text-text-muted">+{file.tags.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Type badge */}
                                <div className="flex items-center">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                                        style={{ backgroundColor: `${tIcon.color}15`, color: tIcon.color }}>
                                        {file.type}
                                    </span>
                                </div>

                                {/* Size */}
                                <div className="flex items-center justify-end">
                                    <span className="text-xs text-text-muted font-mono">{formatFileSize(file.size)}</span>
                                </div>

                                {/* Date */}
                                <div className="flex items-center justify-end">
                                    <span className="text-xs text-text-muted">{formatDate(file.updatedAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
