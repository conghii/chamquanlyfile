import { useState } from 'react';
import {
    HiOutlineFolder, HiOutlineBriefcase, HiOutlineAcademicCap,
    HiOutlineArchive, HiOutlinePhotograph, HiOutlineVideoCamera,
    HiOutlineDocumentText, HiOutlineKey, HiOutlineTemplate,
    HiOutlineUserGroup, HiOutlineChartBar, HiOutlineCamera,
    HiOutlineColorSwatch, HiOutlineSearch, HiOutlineTruck,
    HiOutlineHeart, HiOutlineStar, HiOutlineLightningBolt,
    HiOutlineGlobe, HiOutlineShoppingCart, HiOutlineTag,
    HiOutlineCog, HiOutlineChat, HiOutlineClipboardList,
    HiOutlineCollection, HiOutlineCube, HiOutlineLink,
    HiOutlineMail, HiOutlinePhone, HiOutlineTerminal
} from 'react-icons/hi';
import React from 'react';

const ICONS_MAP: Record<string, React.ReactNode> = {
    folder: <HiOutlineFolder size={20} />,
    briefcase: <HiOutlineBriefcase size={20} />,
    academic: <HiOutlineAcademicCap size={20} />,
    archive: <HiOutlineArchive size={20} />,
    photograph: <HiOutlinePhotograph size={20} />,
    video: <HiOutlineVideoCamera size={20} />,
    document: <HiOutlineDocumentText size={20} />,
    key: <HiOutlineKey size={20} />,
    template: <HiOutlineTemplate size={20} />,
    users: <HiOutlineUserGroup size={20} />,
    chart: <HiOutlineChartBar size={20} />,
    camera: <HiOutlineCamera size={20} />,
    swatch: <HiOutlineColorSwatch size={20} />,
    search: <HiOutlineSearch size={20} />,
    truck: <HiOutlineTruck size={20} />,
    heart: <HiOutlineHeart size={20} />,
    star: <HiOutlineStar size={20} />,
    lightning: <HiOutlineLightningBolt size={20} />,
    globe: <HiOutlineGlobe size={20} />,
    cart: <HiOutlineShoppingCart size={20} />,
    tag: <HiOutlineTag size={20} />,
    cog: <HiOutlineCog size={20} />,
    chat: <HiOutlineChat size={20} />,
    clipboard: <HiOutlineClipboardList size={20} />,
    collection: <HiOutlineCollection size={20} />,
    cube: <HiOutlineCube size={20} />,
    link: <HiOutlineLink size={20} />,
    mail: <HiOutlineMail size={20} />,
    phone: <HiOutlinePhone size={20} />,
    terminal: <HiOutlineTerminal size={20} />
};

export const getIconNode = (iconName: string, fallbackNode: React.ReactNode): React.ReactNode => {
    return ICONS_MAP[iconName] || fallbackNode;
};

interface IconPickerDialogProps {
    folderName: string;
    currentIcon: string | null;
    onSelect: (iconName: string) => void;
    onClose: () => void;
}

export default function IconPickerDialog({ folderName, currentIcon, onSelect, onClose }: IconPickerDialogProps) {
    const [selected, setSelected] = useState<string | null>(currentIcon);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="relative glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            >
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Đổi Icon</h3>
                    <p className="text-sm text-text-muted mb-6">
                        Chọn icon mới cho thư mục <strong className="text-white">"{folderName}"</strong>
                    </p>
                </div>

                <div className="grid grid-cols-6 gap-2 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(ICONS_MAP).map(([key, node]) => {
                        const isSelected = selected === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelected(key)}
                                className={`aspect-square flex justify-center items-center rounded-xl transition-all ${isSelected
                                    ? 'bg-primary/20 text-primary border-2 border-primary scale-110 shadow-[0_0_12px_rgba(255,153,0,0.3)]'
                                    : 'text-text-secondary hover:text-white hover:bg-surface-3 border-2 border-transparent'
                                    }`}
                            >
                                {React.cloneElement(node as any, { size: isSelected ? 24 : 20 })}
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => selected && onSelect(selected)}
                        disabled={!selected}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,153,0,0.3)]"
                        style={{ background: 'linear-gradient(135deg, #FF9900 0%, #FF6B00 100%)' }}
                    >
                        Lưu Icon
                    </button>
                </div>
            </div>
        </div>
    );
}
