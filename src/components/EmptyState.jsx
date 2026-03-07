import { Package, BookOpen, FolderOpen, Upload, FolderPlus, Link, Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

const FOLDER_CONFIG = {
    product: {
        icon: Package,
        getTitle: (name) => `Chưa có ảnh sản phẩm nào trong ${name}`,
        subtitle: 'Upload ảnh sản phẩm để bắt đầu quản lý listing Amazon',
        buttons: [
            { key: 'upload', label: 'Upload ảnh', emoji: '📤', action: 'upload' },
            { key: 'folder', label: 'Tạo subfolder', emoji: '📁', action: 'createFolder' },
        ],
    },
    learning: {
        icon: BookOpen,
        getTitle: () => 'Thêm tài liệu tham khảo',
        subtitle: 'Lưu tài liệu học tập, template, hướng dẫn của team',
        buttons: [
            { key: 'upload', label: 'Upload file', emoji: '📤', action: 'upload' },
            { key: 'link', label: 'Thêm link', emoji: '🔗', action: 'addLink' },
        ],
    },
    storage: {
        icon: FolderOpen,
        getTitle: () => 'Folder trống',
        subtitle: 'Kéo thả file vào đây hoặc nhấn upload',
        buttons: [
            { key: 'upload', label: 'Upload file', emoji: '📤', action: 'upload' },
            { key: 'folder', label: 'Tạo subfolder', emoji: '📁', action: 'createFolder' },
        ],
    },
    general: {
        icon: FolderOpen,
        getTitle: () => 'Folder trống',
        subtitle: 'Kéo thả file vào đây hoặc nhấn upload',
        buttons: [
            { key: 'upload', label: 'Upload file', emoji: '📤', action: 'upload' },
            { key: 'folder', label: 'Tạo subfolder', emoji: '📁', action: 'createFolder' },
        ],
    },
};

const styles = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        borderRadius: '16px',
        border: '2px dashed #4a4a6a',
        transition: 'border-color 200ms ease',
        cursor: 'default',
        minHeight: '320px',
    },
    wrapperHover: {
        borderColor: '#E8830C',
    },
    iconContainer: {
        width: 48,
        height: 48,
        opacity: 0.6,
        marginBottom: 16,
        animation: 'emptyStatePulse 2s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e0e0e0',
        margin: '0 0 8px 0',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        margin: '0 0 24px 0',
        textAlign: 'center',
        maxWidth: 380,
        lineHeight: 1.5,
    },
    buttonGroup: {
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    button: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 10,
        border: '1px dashed #4a4a6a',
        background: 'transparent',
        color: '#e0e0e0',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none',
    },
    buttonHover: {
        borderStyle: 'solid',
        borderColor: '#E8830C',
        color: '#E8830C',
        background: 'rgba(232, 131, 12, 0.06)',
    },
    // Onboarding banner
    banner: {
        width: '100%',
        maxWidth: 520,
        marginBottom: 28,
        padding: 2,
        borderRadius: 14,
        background: 'linear-gradient(135deg, #E8830C, #f59e0b)',
    },
    bannerInner: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 12,
        background: '#1a1a2e',
        fontSize: 13,
        color: '#e0e0e0',
        lineHeight: 1.6,
    },
    bannerIcon: {
        flexShrink: 0,
        marginTop: 2,
        color: '#f59e0b',
    },
    bannerText: {
        flex: 1,
    },
    bannerDismiss: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
        padding: '5px 14px',
        borderRadius: 8,
        border: '1px solid #4a4a6a',
        background: 'transparent',
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 200ms ease',
    },
};

// Inject keyframes once
if (typeof document !== 'undefined') {
    const STYLE_ID = 'empty-state-keyframes';
    if (!document.getElementById(STYLE_ID)) {
        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
      @keyframes emptyStatePulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.06); }
      }
      @media (max-width: 640px) {
        .empty-state-btn-group {
          flex-direction: column !important;
          width: 100%;
        }
        .empty-state-btn-group button {
          width: 100%;
          justify-content: center;
        }
      }
    `;
        document.head.appendChild(styleEl);
    }
}

export default function EmptyState({
    folderType = 'general',
    folderName = '',
    onUpload,
    onCreateFolder,
    onAddLink,
    isFirstVisit = false,
    onDismissTip,
}) {
    const [hoveredBtn, setHoveredBtn] = useState(null);
    const [isWrapperHovered, setIsWrapperHovered] = useState(false);
    const [showBanner, setShowBanner] = useState(isFirstVisit);

    const config = FOLDER_CONFIG[folderType] || FOLDER_CONFIG.general;
    const IconComponent = config.icon;
    const title = config.getTitle(folderName);

    const handleAction = (action) => {
        if (action === 'upload' && onUpload) onUpload();
        if (action === 'createFolder' && onCreateFolder) onCreateFolder();
        if (action === 'addLink' && onAddLink) onAddLink();
    };

    const handleDismiss = () => {
        setShowBanner(false);
        if (onDismissTip) onDismissTip();
    };

    return (
        <div
            style={{
                ...styles.wrapper,
                ...(isWrapperHovered ? styles.wrapperHover : {}),
            }}
            onMouseEnter={() => setIsWrapperHovered(true)}
            onMouseLeave={() => setIsWrapperHovered(false)}
        >
            {/* Onboarding banner */}
            {showBanner && (
                <div style={styles.banner}>
                    <div style={styles.bannerInner}>
                        <Lightbulb size={20} style={styles.bannerIcon} />
                        <div style={styles.bannerText}>
                            <span>
                                💡 <strong>Mẹo:</strong> Kéo thả file trực tiếp, hoặc paste ảnh bằng{' '}
                                <kbd style={{
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: '#2a2a3e',
                                    border: '1px solid #4a4a6a',
                                    fontSize: 12,
                                }}>⌘V</kbd>. File sẽ tự động đồng bộ lên Google Drive.
                            </span>
                            <div>
                                <button
                                    style={styles.bannerDismiss}
                                    onClick={handleDismiss}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                                        e.currentTarget.style.borderColor = '#f59e0b';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = '#4a4a6a';
                                    }}
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Icon */}
            <div style={styles.iconContainer}>
                <IconComponent size={48} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h3 style={styles.title}>{title}</h3>

            {/* Subtitle */}
            <p style={styles.subtitle}>{config.subtitle}</p>

            {/* Buttons */}
            <div className="empty-state-btn-group" style={styles.buttonGroup}>
                {config.buttons.map((btn) => (
                    <button
                        key={btn.key}
                        style={{
                            ...styles.button,
                            ...(hoveredBtn === btn.key ? styles.buttonHover : {}),
                        }}
                        onMouseEnter={() => setHoveredBtn(btn.key)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        onClick={() => handleAction(btn.action)}
                    >
                        <span>{btn.emoji}</span>
                        <span>{btn.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
