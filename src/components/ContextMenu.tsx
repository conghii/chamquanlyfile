import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'error';
    divider?: boolean;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    position: { x: number; y: number } | null;
    onClose: () => void;
}

export default function ContextMenu({ items, position, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('wheel', onClose);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('wheel', onClose);
        };
    }, [position, onClose]);

    if (!position) return null;

    // Adjust position to stay within viewport
    const menuWidth = 180;
    const menuHeight = items.length * 36 + (items.filter(i => i.divider).length * 10);

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] w-[180px] py-1.5 rounded-xl glass-strong shadow-2xl animate-scale-in border border-white/10"
            style={{ left: x, top: y }}
        >
            {items.map((item, index) => (
                <div key={index}>
                    {item.divider && <div className="my-1 border-t border-white/5 mx-2" />}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            item.onClick();
                            onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors group
                            ${item.variant === 'error'
                                ? 'text-error hover:bg-error/10'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                    >
                        {item.icon && <span className="opacity-70 group-hover:opacity-100 transition-opacity">{item.icon}</span>}
                        <span className="flex-1 text-left">{item.label}</span>
                    </button>
                </div>
            ))}
        </div>,
        document.body
    );
}
