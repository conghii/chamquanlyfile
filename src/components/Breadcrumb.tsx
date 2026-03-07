import { HiOutlineChevronRight, HiOutlineHome } from 'react-icons/hi';

interface BreadcrumbProps {
    path: string[];
    onNavigate: (index: number) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
    if (path.length === 0) return null;

    return (
        <nav className="flex items-center gap-1.5 px-1 py-2 text-sm animate-fade-in overflow-x-auto">
            <button onClick={() => onNavigate(-1)}
                className="flex items-center gap-1 text-text-muted hover:text-white transition-colors shrink-0">
                <HiOutlineHome size={14} />
            </button>

            {path.map((segment, i) => (
                <div key={i} className="flex items-center gap-1.5 shrink-0">
                    <HiOutlineChevronRight size={12} className="text-text-muted" />
                    {i === path.length - 1 ? (
                        <span className="font-medium text-white">{segment}</span>
                    ) : (
                        <button onClick={() => onNavigate(i)}
                            className="text-text-secondary hover:text-primary transition-colors">
                            {segment}
                        </button>
                    )}
                </div>
            ))}
        </nav>
    );
}
