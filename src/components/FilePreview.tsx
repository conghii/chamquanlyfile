import { HiX, HiOutlineDownload, HiOutlineExternalLink, HiOutlineClipboard, HiOutlineTag } from 'react-icons/hi';
import type { AssetFile } from '../types';
import { formatFileSize, getTypeLabel } from '../utils/fileUtils';

interface FilePreviewProps {
    file: AssetFile | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
    if (!isOpen || !file) return null;

    const copyLink = () => {
        navigator.clipboard.writeText(file.webViewLink);
    };

    const renderPreview = () => {
        switch (file.type) {
            case 'image':
                return (
                    <div className="flex items-center justify-center bg-black/40 rounded-xl overflow-hidden"
                        style={{ minHeight: '300px', maxHeight: '50vh' }}>
                        <img
                            src={file.thumbnailUrl}
                            alt={file.name}
                            className="max-w-full max-h-[50vh] object-contain"
                        />
                    </div>
                );
            case 'video':
                return (
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-text-muted">
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                    <div className="w-0 h-0 ml-1.5 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent" />
                                </div>
                                <p className="text-sm">Video preview</p>
                                <p className="text-xs text-text-muted">(Connect Google Drive for playback)</p>
                            </div>
                        </div>
                        {file.thumbnailUrl && (
                            <img src={file.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        )}
                    </div>
                );
            case 'text':
                return (
                    <div className="bg-surface-3 rounded-xl p-6 font-mono text-sm leading-relaxed text-text max-h-[50vh] overflow-y-auto">
                        <p className="text-text-muted italic mb-4">[Text preview — connect Google Drive to load content]</p>
                        <p>Premium Red Velvet Pillow — Ultra Soft Decorative Throw Pillow Cover with Insert</p>
                        <p className="mt-2 text-text-secondary">
                            ✅ LUXURIOUS COMFORT — Made with high-quality velvet fabric for a soft, plush feel.<br />
                            ✅ PERFECT SIZE — 18x18 inches, ideal for sofa, bed, or accent chair.<br />
                            ✅ HIDDEN ZIPPER — Easy to remove and machine washable.
                        </p>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="bg-surface-3 rounded-xl p-8 flex flex-col items-center justify-center gap-4"
                        style={{ minHeight: '300px' }}>
                        <div className="text-5xl">📄</div>
                        <p className="text-sm text-white font-semibold">{file.name}</p>
                        <p className="text-xs text-text-muted">PDF Document · {formatFileSize(file.size)}</p>
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-accent/20 text-accent hover:bg-accent/30 transition-colors">
                            <HiOutlineExternalLink size={16} />
                            Open in Drive
                        </a>
                    </div>
                );
            case 'xlsx':
                return (
                    <div className="bg-surface-3 rounded-xl p-8 flex flex-col items-center justify-center gap-4"
                        style={{ minHeight: '300px' }}>
                        <div className="text-5xl">📊</div>
                        <p className="text-sm text-white font-semibold">{file.name}</p>
                        <p className="text-xs text-text-muted">Spreadsheet · {formatFileSize(file.size)}</p>
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-warning/20 text-warning hover:bg-warning/30 transition-colors">
                            <HiOutlineExternalLink size={16} />
                            Open in Sheets
                        </a>
                    </div>
                );
            default:
                return (
                    <div className="bg-surface-3 rounded-xl p-8 flex flex-col items-center gap-4" style={{ minHeight: '200px' }}>
                        <div className="text-5xl">📁</div>
                        <p className="text-sm text-text-muted">Preview not available</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-3xl glass rounded-2xl overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)', maxHeight: '90vh' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-sm font-bold text-white truncate">{file.name}</h2>
                        <p className="text-xs text-text-muted">
                            {getTypeLabel(file.type)} · {formatFileSize(file.size)} · {file.createdAt.toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={copyLink} title="Copy Drive link"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-surface-3 transition-colors">
                            <HiOutlineClipboard size={16} />
                        </button>
                        <a href={file.downloadUrl} download title="Download"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-surface-3 transition-colors">
                            <HiOutlineDownload size={16} />
                        </a>
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" title="Open in Drive"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-surface-3 transition-colors">
                            <HiOutlineExternalLink size={16} />
                        </a>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-surface-3 transition-colors">
                            <HiX size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                    {renderPreview()}

                    {/* Metadata */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        {file.asin && (
                            <div className="bg-surface-3 rounded-xl p-4">
                                <p className="text-xs text-text-muted mb-1">ASIN</p>
                                <p className="text-sm font-semibold text-primary font-mono">{file.asin}</p>
                            </div>
                        )}
                        {file.productName && (
                            <div className="bg-surface-3 rounded-xl p-4">
                                <p className="text-xs text-text-muted mb-1">Product</p>
                                <p className="text-sm font-semibold text-white">{file.productName}</p>
                            </div>
                        )}
                        <div className="bg-surface-3 rounded-xl p-4">
                            <p className="text-xs text-text-muted mb-1">Category</p>
                            <p className="text-sm text-white font-mono">{file.category}</p>
                        </div>
                        <div className="bg-surface-3 rounded-xl p-4">
                            <p className="text-xs text-text-muted mb-1">Uploaded By</p>
                            <p className="text-sm text-white">{file.uploadedBy}</p>
                        </div>
                    </div>

                    {/* Tags */}
                    {file.tags.length > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlineTag size={14} className="text-text-muted" />
                                <span className="text-xs font-medium text-text-muted">Tags</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {file.tags.map((tag) => (
                                    <span key={tag} className="tag-chip">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
