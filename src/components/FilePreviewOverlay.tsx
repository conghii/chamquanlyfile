import { IoCloseOutline } from 'react-icons/io5';
import { HiOutlineDownload, HiOutlineExternalLink } from 'react-icons/hi';
import type { AssetFile } from '../types';
import { createPortal } from 'react-dom';

interface FilePreviewOverlayProps {
    file: AssetFile;
    onClose: () => void;
}

export default function FilePreviewOverlay({ file, onClose }: FilePreviewOverlayProps) {
    const isImage = file.type === 'image';
    const isVideo = file.type === 'video';
    const isPdf = file.type === 'pdf';

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex flex-col bg-black/90 backdrop-blur-md animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10 glass-strong">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xl">
                            {isImage ? '🖼️' : isVideo ? '🎬' : isPdf ? '📄' : '📎'}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{file.name}</h3>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">{file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={file.downloadUrl}
                        download
                        className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                        title="Tải xuống"
                    >
                        <HiOutlineDownload size={20} />
                    </a>
                    <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                        title="Mở trên Drive"
                    >
                        <HiOutlineExternalLink size={20} />
                    </a>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                    >
                        <IoCloseOutline size={24} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden select-none" onClick={onClose}>
                <div
                    className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {isImage && (
                        <img
                            src={file.webViewLink.replace('view?usp=drivesdk', 'view').replace('/view', '/preview')}
                            alt={file.name}
                            className="max-w-full max-h-[80vh] object-contain shadow-2xl border border-white/5"
                            onError={(e) => {
                                // Fallback to original thumbnail or specific preview URL if needed
                                (e.target as HTMLImageElement).src = file.thumbnailUrl;
                            }}
                        />
                    )}

                    {isVideo && (
                        <video
                            src={file.webViewLink.replace('/view', '/preview')}
                            controls
                            autoPlay
                            className="max-w-full max-h-[80vh] shadow-2xl"
                        />
                    )}

                    {isPdf && (
                        <iframe
                            src={file.webViewLink.replace('/view', '/preview')}
                            className="w-[80vw] h-[80vh] border-none shadow-2xl rounded-lg"
                        />
                    )}

                    {!isImage && !isVideo && !isPdf && (
                        <div className="bg-surface-2 p-12 rounded-3xl flex flex-col items-center gap-6 border border-white/10 max-w-md text-center">
                            <div className="w-24 h-24 rounded-3xl bg-surface-3 flex items-center justify-center text-5xl shadow-inner">
                                📂
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">Không hỗ trợ xem nhanh</h4>
                                <p className="text-sm text-text-secondary">Vui lòng tải xuống hoặc mở trên Google Drive để xem định dạng này.</p>
                            </div>
                            <div className="flex gap-3 w-full mt-4">
                                <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-dark transition-all text-center"
                                >
                                    Mở trên Drive
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Shortcuts hint */}
            <div className="h-12 flex items-center justify-center text-[10px] text-text-muted gap-4 uppercase tracking-[0.2em]">
                <span>Esc để đóng</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span>Nhấn Space để thoát</span>
            </div>
        </div>,
        document.body
    );
}
