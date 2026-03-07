import { useState } from 'react';
import { HiX, HiOutlinePlus, HiOutlineTag, HiOutlineTrash } from 'react-icons/hi';
import type { Label } from '../types';

interface LabelManagerProps {
    labels: Label[];
    onUpdateLabels: (newLabels: Label[]) => void;
    onClose: () => void;
}

const PRESET_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#14B8A6',
    '#3B82F6', '#8B5CF6', '#D946EF', '#64748B', '#FFFFFF'
];

export default function LabelManager({ labels, onUpdateLabels, onClose }: LabelManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

    const handleCreate = () => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        const newLabel: Label = {
            id: `lbl_${Date.now()}`,
            name: trimmed,
            color: newColor
        };
        onUpdateLabels([...labels, newLabel]);
        setNewName('');
        setIsCreating(false);
    };

    const handleDelete = (id: string) => {
        onUpdateLabels(labels.filter(l => l.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="glass-strong rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}>

                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-surface/50">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <HiOutlineTag className="text-primary" size={18} />
                        Quản lý Labels
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <HiX size={20} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* List existing */}
                    {labels.length === 0 ? (
                        <p className="text-xs text-text-muted text-center py-4">Chưa có label nào. Hãy tạo mới.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {labels.map(lbl => (
                                <div key={lbl.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] opacity-80" style={{ color: lbl.color, backgroundColor: lbl.color }} />
                                        <span className="text-sm text-white font-medium">{lbl.name}</span>
                                    </div>
                                    <button onClick={() => handleDelete(lbl.id)} className="text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                                        <HiOutlineTrash size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Create new */}
                    {isCreating ? (
                        <div className="flex flex-col gap-3 p-3 rounded-xl bg-surface-3 border border-primary/30 mt-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Tên label..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                className="w-full bg-transparent border-b border-border text-sm text-white px-1 py-1 outline-none focus:border-primary"
                            />
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewColor(c)}
                                        className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: c, boxShadow: newColor === c ? `0 0 10px ${c}` : undefined }}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-xs text-text-muted hover:text-white">Hủy</button>
                                <button onClick={handleCreate} disabled={!newName.trim()} className="px-3 py-1.5 text-xs bg-primary text-white font-medium rounded-lg disabled:opacity-50">Lưu</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-white/20 text-xs text-text-secondary hover:text-white hover:border-primary/50 transition-colors mt-2"
                        >
                            <HiOutlinePlus size={14} /> Tạo Label Mới
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
