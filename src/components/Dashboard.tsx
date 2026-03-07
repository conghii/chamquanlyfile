import { useMemo } from 'react';
import type { AssetFile, FolderNode } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import {
    HiOutlineClock,
    HiOutlineChartBar,
    HiOutlinePhotograph,
    HiOutlineVideoCamera,
    HiOutlineDocumentText,
    HiOutlineTable
} from 'react-icons/hi';

interface DashboardProps {
    files: AssetFile[];
    folders: FolderNode[];
    onFileClick: (file: AssetFile) => void;
    onFolderClick: (folderId: string) => void;
}

export default function Dashboard({ files, folders, onFileClick, onFolderClick }: DashboardProps) {
    const recentFiles = useMemo(() => {
        return [...files]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 8);
    }, [files]);

    const stats = useMemo(() => {
        const counts = {
            image: 0,
            video: 0,
            pdf: 0,
            xlsx: 0,
            other: 0,
            totalSize: 0
        };
        files.forEach(f => {
            if (f.type === 'image') counts.image++;
            else if (f.type === 'video') counts.video++;
            else if (f.type === 'pdf') counts.pdf++;
            else if (f.type === 'xlsx') counts.xlsx++;
            else counts.other++;
            counts.totalSize += f.size;
        });
        return counts;
    }, [files]);

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Chào buổi sáng!</h1>
                <p className="text-text-secondary text-sm">Đây là tổng quan về kho lưu trữ của bạn.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Hình ảnh"
                    value={stats.image}
                    icon={<HiOutlinePhotograph size={20} />}
                    color="#3b82f6"
                />
                <StatCard
                    label="Video"
                    value={stats.video}
                    icon={<HiOutlineVideoCamera size={20} />}
                    color="#ef4444"
                />
                <StatCard
                    label="Tài liệu"
                    value={stats.pdf + stats.xlsx + stats.other}
                    icon={<HiOutlineDocumentText size={20} />}
                    color="#10b981"
                />
                <StatCard
                    label="Tổng dung lượng"
                    value={formatFileSize(stats.totalSize)}
                    icon={<HiOutlineChartBar size={20} />}
                    color="#f59e0b"
                />
            </div>

            {/* Quick Access Folders */}
            {folders.filter(f => f.isStarred).length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <span>Thư mục nhanh</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {folders.filter(f => f.isStarred).slice(0, 6).map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => onFolderClick(folder.id)}
                                className="p-3 rounded-xl bg-surface-2 border border-white/5 hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center text-center gap-2"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <HiOutlineDocumentText size={20} />
                                </div>
                                <span className="text-[11px] font-medium text-text-secondary group-hover:text-white truncate w-full px-1">
                                    {folder.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Files Table-like Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <HiOutlineClock className="text-primary" />
                        <span>Tệp tin gần đây</span>
                    </div>
                </div>

                <div className="bg-surface-2 rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    <th className="px-4 py-3">Tên tệp</th>
                                    <th className="px-4 py-3">Ngày cập nhật</th>
                                    <th className="px-4 py-3">Kích thước</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentFiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm italic">
                                            Chưa có tệp tin nào gần đây.
                                        </td>
                                    </tr>
                                ) : (
                                    recentFiles.map(file => (
                                        <tr
                                            key={file.id}
                                            className="group hover:bg-white/5 transition-colors cursor-pointer"
                                            onClick={() => onFileClick(file)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted">
                                                        {file.type === 'image' && <HiOutlinePhotograph size={16} />}
                                                        {file.type === 'video' && <HiOutlineVideoCamera size={16} />}
                                                        {file.type === 'xlsx' && <HiOutlineTable size={16} />}
                                                        {(file.type === 'pdf' || file.type === 'text' || file.type === 'other') && <HiOutlineDocumentText size={16} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-white group-hover:text-primary transition-colors truncate max-w-[200px]">
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[11px] text-text-secondary">
                                                {new Date(file.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-[11px] text-text-secondary">
                                                {formatFileSize(file.size)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-text-muted transition-all">
                                                    <HiOutlineDocumentText size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
    return (
        <div className="p-5 rounded-2xl glass border border-white/5 hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div
                    className="p-2.5 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: `${color}20`, color: color }}
                >
                    {icon}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-white tracking-tight">{value}</p>
            </div>
            <div
                className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}
