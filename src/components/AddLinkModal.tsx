import { useState, useRef, useEffect } from 'react';
import { HiX, HiOutlineTag, HiOutlineLink, HiOutlineExternalLink } from 'react-icons/hi';

/* ── Link type detection ─────────────────────────────────── */

export interface LinkMeta {
    type: 'google-sheets' | 'google-docs' | 'google-slides' | 'google-drive' | 'notion' | 'figma' | 'canva' | 'youtube' | 'amazon' | 'web';
    emoji: string;
    label: string;
    color: string;
    bgColor: string;
}

const LINK_PATTERNS: { pattern: RegExp; meta: Omit<LinkMeta, 'type'> & { type: LinkMeta['type'] } }[] = [
    { pattern: /docs\.google\.com\/spreadsheets/i, meta: { type: 'google-sheets', emoji: '📊', label: 'Google Sheets', color: '#34A853', bgColor: 'rgba(52,168,83,0.12)' } },
    { pattern: /docs\.google\.com\/document/i, meta: { type: 'google-docs', emoji: '📝', label: 'Google Docs', color: '#4285F4', bgColor: 'rgba(66,133,244,0.12)' } },
    { pattern: /docs\.google\.com\/presentation/i, meta: { type: 'google-slides', emoji: '📽️', label: 'Google Slides', color: '#FBBC04', bgColor: 'rgba(251,188,4,0.12)' } },
    { pattern: /drive\.google\.com/i, meta: { type: 'google-drive', emoji: '📁', label: 'Google Drive', color: '#4285F4', bgColor: 'rgba(66,133,244,0.12)' } },
    { pattern: /notion\.(so|site)/i, meta: { type: 'notion', emoji: '📓', label: 'Notion', color: '#FFFFFF', bgColor: 'rgba(255,255,255,0.08)' } },
    { pattern: /figma\.com/i, meta: { type: 'figma', emoji: '🎨', label: 'Figma', color: '#A259FF', bgColor: 'rgba(162,89,255,0.12)' } },
    { pattern: /canva\.com/i, meta: { type: 'canva', emoji: '🖌️', label: 'Canva', color: '#00C4CC', bgColor: 'rgba(0,196,204,0.12)' } },
    { pattern: /(youtube\.com|youtu\.be)/i, meta: { type: 'youtube', emoji: '▶️', label: 'YouTube', color: '#FF0000', bgColor: 'rgba(255,0,0,0.10)' } },
    { pattern: /amazon\.(com|co\.|ae|sa)/i, meta: { type: 'amazon', emoji: '🛒', label: 'Amazon', color: '#FF9900', bgColor: 'rgba(255,153,0,0.12)' } },
];

export function detectLinkType(url: string): LinkMeta {
    for (const { pattern, meta } of LINK_PATTERNS) {
        if (pattern.test(url)) return meta;
    }
    return { type: 'web', emoji: '🌐', label: 'Website', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.10)' };
}

function getDomain(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

/* ── Add Link Modal ──────────────────────────────────────── */

interface AddLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: {
        url: string;
        name: string;
        tags: string[];
        linkMeta: LinkMeta;
    }) => void;
}

export default function AddLinkModal({ isOpen, onClose, onAdd }: AddLinkModalProps) {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const linkMeta = url ? detectLinkType(url) : null;
    const isValidUrl = (() => {
        try { new URL(url); return true; } catch { return false; }
    })();

    useEffect(() => {
        if (isOpen) {
            setUrl('');
            setName('');
            setTags([]);
            setTagInput('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Auto-suggest name from URL
    useEffect(() => {
        if (url && !name && linkMeta) {
            const domain = getDomain(url);
            setName(`${linkMeta.label} - ${domain}`);
        }
    }, [url, linkMeta, name]);

    const addTag = () => {
        const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (t && !tags.includes(t)) setTags([...tags, t]);
        setTagInput('');
    };

    const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

    const handleSubmit = () => {
        if (!isValidUrl || !name.trim() || !linkMeta) return;
        onAdd({ url, name: name.trim(), tags, linkMeta });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-lg glass rounded-2xl overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                            <HiOutlineLink size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Lưu Link</h2>
                            <p className="text-xs text-text-muted">Thêm link Google Sheets, Docs, Notion, web...</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <HiX size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* URL input */}
                    <div>
                        <label className="text-xs font-medium text-text-secondary mb-1.5 block">URL</label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-surface-3 border border-border
                  text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <HiOutlineExternalLink size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        </div>
                    </div>

                    {/* Auto-detected type badge */}
                    {url && linkMeta && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in"
                            style={{ background: linkMeta.bgColor, border: `1px solid ${linkMeta.color}20` }}>
                            <span className="text-2xl">{linkMeta.emoji}</span>
                            <div>
                                <p className="text-xs font-semibold" style={{ color: linkMeta.color }}>{linkMeta.label}</p>
                                <p className="text-[10px] text-text-muted truncate max-w-[280px]">{getDomain(url)}</p>
                            </div>
                            {isValidUrl && (
                                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/20 text-success">
                                    ✓ Valid
                                </span>
                            )}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="text-xs font-medium text-text-secondary mb-1.5 block">Tên hiển thị</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tên link..."
                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-3 border border-border
                text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-xs font-medium text-text-secondary mb-1.5 block">Tags</label>
                        {tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                {tags.map((tag) => (
                                    <span key={tag} className="tag-chip">
                                        #{tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-error transition-colors">
                                            <HiX size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text" value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="Add tag..."
                                className="flex-1 px-3 py-2 rounded-xl text-sm bg-surface-3 border border-border
                  text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <button onClick={addTag}
                                className="px-3 py-2 rounded-xl bg-accent/20 text-accent hover:bg-accent/30 transition-colors">
                                <HiOutlineTag size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Quick type pills */}
                    <div>
                        <label className="text-xs font-medium text-text-secondary mb-1.5 block">Hoặc paste nhanh</label>
                        <div className="flex flex-wrap gap-1.5">
                            {LINK_PATTERNS.slice(0, 6).map(({ meta }) => (
                                <button
                                    key={meta.type}
                                    onClick={() => {
                                        if (!url) inputRef.current?.focus();
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium
                    border border-border/50 hover:border-border transition-all"
                                    style={{ background: meta.bgColor, color: meta.color }}
                                >
                                    <span>{meta.emoji}</span>
                                    {meta.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary
              hover:text-white hover:bg-surface-3 transition-all">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValidUrl || !name.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                            background: isValidUrl ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'var(--color-surface-3)',
                            color: isValidUrl ? '#fff' : 'var(--color-text-muted)',
                        }}
                    >
                        <HiOutlineLink size={16} />
                        Lưu Link
                    </button>
                </div>
            </div>
        </div>
    );
}
