import { HiOutlineFolder, HiOutlineExternalLink, HiOutlinePencil, HiOutlineTrash, HiStar, HiOutlineStar } from 'react-icons/hi';
import type { FolderNode } from '../types';
import { useState } from 'react';
import ContextMenu from './ContextMenu';

interface FolderCardProps {
    folder: FolderNode;
    onClick: (folderId: string) => void;
    onRename?: (folderId: string, name: string) => void;
    onDelete?: (folderId: string) => void;
    onToggleStar?: (folderId: string) => void;
}

export default function FolderCard({ folder, onClick, onRename, onDelete, onToggleStar }: FolderCardProps) {
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    };
    return (
        <div
            onClick={() => onClick(folder.id)}
            onContextMenu={handleContextMenu}
            className="group premium-card flex items-center gap-3 p-3 rounded-xl cursor-pointer"
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 ${folder.type === 'product' ? 'bg-orange-500/10 text-orange-500' :
                folder.type === 'learning' ? 'bg-blue-500/10 text-blue-500' :
                    folder.type === 'archive' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-primary/10 text-primary'
                }`}>
                <HiOutlineFolder size={20} />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                    {folder.name}
                </h3>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onToggleStar && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleStar(folder.id); }}
                        className={`w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors ${folder.isStarred ? 'text-yellow-500 opacity-100' : 'text-text-secondary hover:text-white'}`}
                    >
                        {folder.isStarred ? <HiStar size={14} /> : <HiOutlineStar size={14} />}
                    </button>
                )}
                <a
                    href={`https://drive.google.com/drive/folders/${folder.driveId || folder.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                >
                    <HiOutlineExternalLink size={14} />
                </a>
            </div>

            <ContextMenu
                position={ctxMenu}
                onClose={() => setCtxMenu(null)}
                items={[
                    {
                        label: 'Mở thư mục',
                        icon: <HiOutlineFolder size={14} />,
                        onClick: () => onClick(folder.id)
                    },
                    {
                        label: 'Mở trên Drive',
                        icon: <HiOutlineExternalLink size={14} />,
                        onClick: () => window.open(`https://drive.google.com/drive/folders/${folder.driveId || folder.id}`, '_blank')
                    },
                    ...(onToggleStar ? [{
                        label: folder.isStarred ? 'Bỏ đánh dấu' : 'Đánh dấu sao',
                        icon: folder.isStarred ? <HiStar size={14} className="text-yellow-500" /> : <HiOutlineStar size={14} />,
                        onClick: () => onToggleStar(folder.id)
                    }] : []),
                    ...(onRename ? [{
                        label: 'Đổi tên',
                        icon: <HiOutlinePencil size={14} />,
                        onClick: () => {/* Logic đổi tên thư mục sẽ thêm sau */ }
                    }] : []),
                    ...(onDelete ? [{
                        label: 'Xóa thư mục',
                        icon: <HiOutlineTrash size={14} />,
                        variant: 'error' as const,
                        divider: true,
                        onClick: () => onDelete(folder.id)
                    }] : [])
                ]}
            />
        </div>
    );
}
