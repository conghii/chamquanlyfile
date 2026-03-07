import { useState, useRef, useEffect } from 'react';
import {
    HiOutlinePhotograph, HiOutlineVideoCamera, HiOutlineDocumentText,
    HiOutlineTable, HiOutlineExternalLink, HiOutlinePencil, HiOutlineTrash,
    HiOutlineDownload, HiOutlineCheck, HiOutlineTag,
    HiStar, HiOutlineStar
} from 'react-icons/hi';
import type { AssetFile, FileType, Label } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import { detectLinkType } from './AddLinkModal';
import FileLabelPicker from './FileLabelPicker';
import ContextMenu from './ContextMenu';

interface FileCardProps {
    file: AssetFile;
    appLabels: Label[];
    onClick: (file: AssetFile) => void;
    onRename?: (file: AssetFile, newName: string) => void;
    onDelete?: (file: AssetFile) => void;
    onUpdateTags?: (fileId: string, tags: string[]) => void;
    onManageLabels?: () => void;
    isSelected?: boolean;
    onToggleSelect?: (fileId: string) => void;
    onToggleStar?: (fileId: string) => void;
}

function TypeBadge({ type, linkUrl }: { type: FileType; linkUrl?: string }) {
    if (type === 'link' && linkUrl) {
        const meta = detectLinkType(linkUrl);
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                style={{ background: meta.bgColor, color: meta.color }}>
                {meta.emoji} {meta.label.toUpperCase().slice(0, 6)}
            </span>
        );
    }

    const config: Record<FileType, { icon: React.ReactNode; className: string; label: string }> = {
        image: { icon: <HiOutlinePhotograph size={11} />, className: 'badge-image', label: 'IMG' },
        video: { icon: <HiOutlineVideoCamera size={11} />, className: 'badge-video', label: 'VID' },
        text: { icon: <HiOutlineDocumentText size={11} />, className: 'badge-text', label: 'TXT' },
        pdf: { icon: <HiOutlineDocumentText size={11} />, className: 'badge-pdf', label: 'PDF' },
        xlsx: { icon: <HiOutlineTable size={11} />, className: 'badge-xlsx', label: 'XLS' },
        link: { icon: <HiOutlineExternalLink size={11} />, className: 'badge-other', label: 'LINK' },
        other: { icon: <HiOutlineDocumentText size={11} />, className: 'badge-other', label: 'FILE' },
    };
    const c = config[type];
    return (
        <span className={`${c.className} inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase`}>
            {c.icon} {c.label}
        </span>
    );
}

export default function FileCard({
    file, appLabels, onClick, onRename, onDelete,
    onUpdateTags, onManageLabels, isSelected, onToggleSelect, onToggleStar
}: FileCardProps) {
    const hasThumb = file.thumbnailUrl && (file.type === 'image' || file.type === 'video');
    const isLink = file.type === 'link';
    const linkMeta = isLink ? detectLinkType(file.webViewLink || file.downloadUrl || '') : null;

    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
    const [labelPickerPos, setLabelPickerPos] = useState<{ x: number; y: number } | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(file.name);
    const editRef = useRef<HTMLInputElement>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        if (isRenaming) {
            setNewName(file.name);
            setTimeout(() => {
                editRef.current?.focus();
                editRef.current?.select();
            }, 50);
        }
    }, [isRenaming, file.name]);

    const handleRenameSubmit = () => {
        const trimmed = newName.trim();
        if (trimmed && trimmed !== file.name && onRename) {
            onRename(file, trimmed);
        }
        setIsRenaming(false);
    };

    return (
        <div
            className={`group relative flex flex-col p-2 rounded-xl transition-all duration-300 premium-card ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''
                }`}
            onClick={() => onClick(file)}
            onContextMenu={handleContextMenu}
        >
            {/* Quick Actions overlay */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onToggleStar && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleStar(file.id); }}
                        className={`w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${file.isStarred ? 'text-yellow-500 opacity-100 scale-100' : 'text-white hover:text-yellow-500'}`}
                    >
                        {file.isStarred ? <HiStar size={16} /> : <HiOutlineStar size={16} />}
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect?.(file.id); }}
                    className={`w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${isSelected ? 'text-primary' : 'text-white'}`}
                >
                    <HiOutlineCheck size={16} />
                </button>
            </div>

            {/* Thumbnail/Icon Area */}
            <div className="aspect-square rounded-lg overflow-hidden bg-surface-dark/50 relative mb-2 flex items-center justify-center group/thumb">
                {hasThumb ? (
                    <img
                        src={file.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                    />
                ) : (
                    <div className="text-text-muted transition-transform duration-500 group-hover/thumb:scale-110">
                        {file.type === 'image' && <HiOutlinePhotograph size={32} />}
                        {file.type === 'video' && <HiOutlineVideoCamera size={32} />}
                        {file.type === 'pdf' && <HiOutlineDocumentText size={32} />}
                        {file.type === 'xlsx' && <HiOutlineTable size={32} />}
                        {file.type === 'link' && <HiOutlineExternalLink size={32} />}
                        {file.type === 'text' && <HiOutlineDocumentText size={32} />}
                        {file.type === 'other' && <HiOutlineDocumentText size={32} />}
                    </div>
                )}
                {isLink && linkMeta && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <span className="text-2xl">{linkMeta.emoji}</span>
                    </div>
                )}
                {/* Glassy hover overlay */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none" />
            </div>

            {/* Content Info */}
            <div className="px-1 py-0.5">
                {isRenaming ? (
                    <input
                        ref={editRef}
                        type="text"
                        className="w-full bg-surface text-xs text-white px-2 py-1 rounded border border-primary outline-none"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit();
                            if (e.key === 'Escape') setIsRenaming(false);
                            e.stopPropagation();
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                        {file.name}
                    </h3>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                    <TypeBadge type={file.type} linkUrl={file.type === 'link' ? file.webViewLink : undefined} />
                    <span className="text-[10px] text-text-muted">
                        {formatFileSize(file.size)}
                    </span>
                </div>
            </div>

            {/* Context menu */}
            {ctxMenu && (
                <ContextMenu
                    position={ctxMenu}
                    onClose={() => setCtxMenu(null)}
                    items={[
                        {
                            label: 'Mở',
                            icon: <HiOutlineExternalLink size={14} />,
                            onClick: () => { window.open(file.webViewLink, '_blank'); }
                        },
                        ...(onToggleStar ? [{
                            label: file.isStarred ? 'Bỏ đánh dấu' : 'Đánh dấu sao',
                            icon: file.isStarred ? <HiStar size={14} className="text-yellow-500" /> : <HiOutlineStar size={14} />,
                            onClick: () => { onToggleStar(file.id); }
                        }] : []),
                        ...(onRename ? [{
                            label: 'Đổi tên',
                            icon: <HiOutlinePencil size={14} />,
                            onClick: () => { setIsRenaming(true); }
                        }] : []),
                        ...(onUpdateTags && onManageLabels ? [{
                            label: 'Quản lý Label',
                            icon: <HiOutlineTag size={14} />,
                            onClick: () => {
                                // Simplified for now - assuming label picker can be placed relatively
                                setLabelPickerPos({ x: ctxMenu.x, y: ctxMenu.y });
                            }
                        }] : []),
                        {
                            label: 'Tải xuống',
                            icon: <HiOutlineDownload size={14} />,
                            onClick: () => { window.open(file.downloadUrl, '_blank'); }
                        },
                        ...(onDelete ? [{
                            label: 'Xóa',
                            icon: <HiOutlineTrash size={14} />,
                            onClick: () => { setShowDeleteConfirm(true); },
                            variant: 'error' as const
                        }] : [])
                    ]}
                />
            )}

            {/* Label Picker */}
            {labelPickerPos && onUpdateTags && onManageLabels && (
                <FileLabelPicker
                    file={file}
                    appLabels={appLabels}
                    position={labelPickerPos}
                    onUpdateFileTags={(_, tags) => {
                        onUpdateTags(file.id, tags);
                        setLabelPickerPos(null);
                    }}
                    onClose={() => setLabelPickerPos(null)}
                    onManageLabels={onManageLabels}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-light border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
                        <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center text-error mb-4">
                            <HiOutlineTrash size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa?</h3>
                        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa <span className="text-white font-medium">{file.name}</span>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    onDelete?.(file);
                                    setShowDeleteConfirm(false);
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-error hover:bg-error-dark text-white text-sm font-semibold transition-colors shadow-lg shadow-error/20"
                            >
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
