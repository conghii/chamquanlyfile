import { useState, useRef, useEffect } from 'react';
import { HiX, HiOutlineCheck } from 'react-icons/hi';
import type { Label, AssetFile } from '../types';

interface FileLabelPickerProps {
    file: AssetFile;
    appLabels: Label[];
    onUpdateFileTags: (fileId: string, newTags: string[]) => void;
    onManageLabels: () => void;
    onClose: () => void;
    position: { x: number; y: number };
}

export default function FileLabelPicker({ file, appLabels, onUpdateFileTags, onManageLabels, onClose, position }: FileLabelPickerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(file.tags));

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handleSave();
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [selectedIds, file.tags]);

    const handleSave = () => {
        const currentArr = [...selectedIds].sort();
        const oldArr = [...file.tags].sort();
        if (currentArr.join(',') !== oldArr.join(',')) {
            onUpdateFileTags(file.id, currentArr);
        }
        onClose();
    };

    const toggleTag = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    return (
        <div
            ref={ref}
            className="fixed z-50 w-56 p-2 rounded-xl glass-strong animate-scale-in flex flex-col gap-1 shadow-2xl"
            style={{
                left: position.x, top: position.y,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
            onClick={e => e.stopPropagation()}
        >
            <div className="px-2 py-1.5 border-b border-border/50 text-[10px] font-bold text-text-muted uppercase tracking-wider flex justify-between items-center">
                <span>Gắn Label</span>
                <button onClick={handleSave} className="text-white hover:text-primary"><HiX size={14} /></button>
            </div>

            <div className="flex flex-col gap-0.5 py-1 max-h-48 overflow-y-auto custom-scrollbar">
                {appLabels.length === 0 ? (
                    <p className="text-xs text-text-muted px-2 py-2 text-center">Chưa có label nào.</p>
                ) : (
                    appLabels.map(lbl => {
                        const isSelected = selectedIds.has(lbl.id);
                        return (
                            <button
                                key={lbl.id}
                                onClick={(e) => toggleTag(lbl.id, e)}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-text-secondary hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lbl.color, boxShadow: `0 0 8px ${lbl.color}80` }} />
                                    <span className="truncate max-w-[120px] text-left">{lbl.name}</span>
                                </div>
                                {isSelected && <HiOutlineCheck className="text-primary" />}
                            </button>
                        );
                    })
                )}
            </div>

            <div className="pt-1 mt-1 border-t border-border/50">
                <button
                    onClick={(e) => { e.stopPropagation(); onManageLabels(); onClose(); }}
                    className="w-full px-2 py-1.5 text-xs text-center text-primary/80 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                    + Quản lý Labels
                </button>
            </div>
        </div>
    );
}
