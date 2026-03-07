import { useState, useRef, useEffect, useMemo } from 'react';
import {
    HiOutlineSearch, HiOutlineCloudUpload, HiOutlineLogout, HiOutlineMenu, HiX,
    HiOutlineLink, HiOutlineTag, HiOutlineViewGrid, HiOutlineViewBoards,
    HiOutlineCube, HiOutlineViewList, HiOutlineFolder, HiOutlinePhotograph,
    HiOutlineVideoCamera, HiOutlineDocumentText, HiOutlineDocument, HiOutlineExternalLink,
} from 'react-icons/hi';
import type { UserProfile, ViewMode, AssetFile, FolderNode, FileType } from '../types';

interface SearchResultItem {
    type: 'folder' | 'file';
    id: string;
    name: string;
    fileType?: FileType;
    date?: Date;
    parentName?: string;
}

interface HeaderProps {
    user: UserProfile;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onUploadClick: () => void;
    onAddLinkClick: () => void;
    onManageLabelsClick: () => void;
    onManageAsinsClick: () => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onLogout: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
    allFiles: AssetFile[];
    folderTree: FolderNode[];
    onFolderClick: (folderId: string) => void;
    onFileClick: (file: AssetFile) => void;
    gridSize?: number;
    onGridSizeChange?: (size: number) => void;
}

const fileTypeIcons: Record<FileType, typeof HiOutlineDocument> = {
    image: HiOutlinePhotograph,
    video: HiOutlineVideoCamera,
    text: HiOutlineDocumentText,
    pdf: HiOutlineDocument,
    xlsx: HiOutlineDocumentText,
    link: HiOutlineExternalLink,
    other: HiOutlineDocument,
};

const fileTypeColors: Record<FileType, string> = {
    image: '#3B82F6', video: '#8B5CF6', text: '#10B981',
    pdf: '#EF4444', xlsx: '#22C55E', link: '#6366F1', other: '#6B7280',
};

function flattenFolders(nodes: FolderNode[], parent?: string): { id: string; name: string; parentName?: string }[] {
    const result: { id: string; name: string; parentName?: string }[] = [];
    for (const node of nodes) {
        result.push({ id: node.id, name: node.name, parentName: parent });
        if (node.children.length > 0) {
            result.push(...flattenFolders(node.children, node.name));
        }
    }
    return result;
}

function formatSearchDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 24 * 60 * 60 * 1000) {
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Header({
    user, searchQuery, onSearchChange, onUploadClick, onAddLinkClick,
    onManageLabelsClick, onManageAsinsClick, viewMode, onViewModeChange,
    onLogout, onToggleSidebar, isSidebarOpen,
    allFiles, folderTree, onFolderClick, onFileClick,
    gridSize = 5, onGridSizeChange
}: HeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Keyboard shortcut
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
                setIsFocused(true);
            }
            if (e.key === 'Escape') {
                setIsFocused(false);
                searchRef.current?.blur();
            }
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    // Search results
    const allFolders = useMemo(() => flattenFolders(folderTree), [folderTree]);

    const searchResults = useMemo((): SearchResultItem[] => {
        if (!searchQuery || searchQuery.length < 1) return [];
        const q = searchQuery.toLowerCase();
        const results: SearchResultItem[] = [];

        // Match folders
        allFolders.filter(f => f.name.toLowerCase().includes(q)).slice(0, 4).forEach(f => {
            results.push({ type: 'folder', id: f.id, name: f.name, parentName: f.parentName });
        });

        // Match files
        allFiles.filter(f =>
            f.status === 'active' && (
                f.name.toLowerCase().includes(q) ||
                (f.originalName && f.originalName.toLowerCase().includes(q)) ||
                (f.asin && f.asin.toLowerCase().includes(q))
            )
        ).slice(0, 6).forEach(f => {
            results.push({
                type: 'file', id: f.id, name: f.name,
                fileType: f.type, date: f.updatedAt,
            });
        });

        return results;
    }, [searchQuery, allFolders, allFiles]);

    const showDropdown = isFocused && searchQuery.length > 0;

    return (
        <header className="glass-strong sticky top-0 z-50 flex items-center gap-4 px-4 py-3 h-16"
            style={{ borderBottom: '1px solid var(--color-border)' }}>

            {/* Mobile menu toggle */}
            <button onClick={onToggleSidebar}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-3 transition-colors text-text-secondary">
                {isSidebarOpen ? <HiX size={20} /> : <HiOutlineMenu size={20} />}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: 'linear-gradient(135deg, #FF9900, #E88B00)' }}>
                    🗂️
                </div>
                <span className="font-bold text-sm hidden sm:block">
                    <span className="text-white">Asset</span>
                    <span style={{ color: '#FF9900' }}> Manager</span>
                </span>
            </div>

            {/* Search bar with dropdown */}
            <div className="flex-1 max-w-xl mx-4 relative" ref={searchContainerRef}>
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        placeholder="Tìm file, thư mục, ASIN..."
                        className={`w-full pl-10 pr-20 py-2.5 rounded-xl text-sm bg-surface-3 border
                            text-white placeholder-text-muted outline-none transition-all duration-200
                            ${showDropdown ? 'border-primary ring-2 ring-primary/20 rounded-b-none' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {searchQuery && (
                            <button onClick={() => { onSearchChange(''); setIsFocused(false); }}
                                className="text-text-muted hover:text-white transition-colors">
                                <HiX size={16} />
                            </button>
                        )}
                        {!searchQuery && (
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono text-text-muted bg-surface-2 border border-border">
                                ⌘K
                            </kbd>
                        )}
                    </div>
                </div>

                {/* Search results dropdown */}
                {showDropdown && (
                    <div className="absolute left-0 right-0 top-full bg-surface-2 border border-t-0 border-border rounded-b-xl
                        shadow-[0_12px_48px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-fade-in">
                        {searchResults.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-text-muted">
                                Không tìm thấy "{searchQuery}"
                            </div>
                        ) : (
                            <div className="max-h-[320px] overflow-y-auto sidebar-scroll">
                                {/* Folders */}
                                {searchResults.filter(r => r.type === 'folder').length > 0 && (
                                    <div>
                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-surface-3/50">
                                            Thư mục
                                        </div>
                                        {searchResults.filter(r => r.type === 'folder').map(r => (
                                            <button key={r.id}
                                                onClick={() => { onFolderClick(r.id); setIsFocused(false); onSearchChange(''); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-3 transition-colors text-left group">
                                                <HiOutlineFolder size={18} className="text-amber-400 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-text-secondary group-hover:text-white truncate">{r.name}</p>
                                                    {r.parentName && (
                                                        <p className="text-[10px] text-text-muted truncate">trong {r.parentName}</p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Files */}
                                {searchResults.filter(r => r.type === 'file').length > 0 && (
                                    <div>
                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-surface-3/50">
                                            File
                                        </div>
                                        {searchResults.filter(r => r.type === 'file').map(r => {
                                            const ft = r.fileType || 'other';
                                            const Icon = fileTypeIcons[ft];
                                            const color = fileTypeColors[ft];
                                            const file = allFiles.find(f => f.id === r.id);
                                            return (
                                                <button key={r.id}
                                                    onClick={() => { if (file) onFileClick(file); setIsFocused(false); onSearchChange(''); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-3 transition-colors text-left group">
                                                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                                                        style={{ backgroundColor: `${color}15` }}>
                                                        <Icon size={16} color={color} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-text-secondary group-hover:text-white truncate">{r.name}</p>
                                                        {file?.asin && (
                                                            <p className="text-[10px] text-text-muted">ASIN: {file.asin}</p>
                                                        )}
                                                    </div>
                                                    {r.date && (
                                                        <span className="text-[10px] text-text-muted shrink-0">{formatSearchDate(r.date)}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Manage Labels button */}
                <button onClick={onManageLabelsClick}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
                  bg-surface-3 border border-border hover:border-primary/40 text-text-secondary hover:text-white"
                >
                    <HiOutlineTag size={16} />
                    <span className="hidden sm:inline">Nhãn</span>
                </button>

                {/* Manage ASINs button */}
                <button onClick={onManageAsinsClick}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
                  bg-surface-3 border border-border hover:border-primary/40 text-text-secondary hover:text-white"
                >
                    <HiOutlineCube size={16} />
                    <span className="hidden sm:inline">ASIN</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-surface-3 border border-border rounded-xl p-0.5">
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                            ${viewMode === 'grid'
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-text-muted hover:text-white'}`}
                        title="Grid View"
                    >
                        <HiOutlineViewGrid size={15} />
                    </button>
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                            ${viewMode === 'list'
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-text-muted hover:text-white'}`}
                        title="List View"
                    >
                        <HiOutlineViewList size={15} />
                    </button>
                    <button
                        onClick={() => onViewModeChange('kanban')}
                        className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                            ${viewMode === 'kanban'
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-text-muted hover:text-white'}`}
                        title="Kanban View"
                    >
                        <HiOutlineViewBoards size={15} />
                    </button>
                </div>

                {/* Grid Size Slider (only visible in grid mode) */}
                {viewMode === 'grid' && onGridSizeChange && (
                    <div className="flex items-center gap-2 bg-surface-3 border border-border rounded-xl px-3 py-2 shrink-0 pr-4">
                        <span className="text-xs text-text-muted hidden sm:inline">Cols: {gridSize}</span>
                        <input
                            type="range"
                            min="2" max="10" step="1"
                            title="Chỉnh số lượng cột Grid"
                            value={gridSize}
                            onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
                            className="w-16 sm:w-24 h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                )}

                {/* Add Link button */}
                <button onClick={onAddLinkClick}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
                  bg-surface-3 border border-border hover:border-primary/40 text-text-secondary hover:text-white"
                >
                    <HiOutlineLink size={16} />
                    <span className="hidden sm:inline">Link</span>
                </button>

                {/* Upload button */}
                <button onClick={onUploadClick}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-primary/20"
                    style={{ background: 'linear-gradient(135deg, #FF9900, #E88B00)', color: '#1a1a1a' }}
                >
                    <HiOutlineCloudUpload size={16} />
                    Upload
                </button>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-9 h-9 rounded-full overflow-hidden border-2 border-border hover:border-primary/60 transition-all duration-200 hover:scale-105">
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=FF9900&color=fff&size=36`}
                            alt="" className="w-full h-full object-cover" />
                    </button>
                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-2 border border-border rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden animate-scale-in z-50">
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                                <p className="text-xs text-text-muted truncate">{user.email}</p>
                            </div>
                            <button onClick={onLogout}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-error hover:bg-error/5 transition-colors">
                                <HiOutlineLogout size={16} />
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
