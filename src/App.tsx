import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
// @ts-ignore
import Sidebar from './components/Sidebar.jsx';
import Breadcrumb from './components/Breadcrumb';
import FilterBar from './components/FilterBar';
import FileGallery from './components/FileGallery';
// @ts-ignore
import KanbanBoard from './components/KanbanBoard.jsx';
import ListView from './components/ListView';
// @ts-ignore
import BulkActionBar from './components/BulkActionBar.jsx';
import UploadModal from './components/UploadModal';
// @ts-ignore
import AsinManager from './components/AsinManager.jsx';
import AddLinkModal from './components/AddLinkModal';
import type { LinkMeta } from './components/AddLinkModal';
import FilePreviewOverlay from './components/FilePreviewOverlay'; // Changed from FilePreview
import LoginScreen from './components/LoginScreen';
import LabelManager from './components/LabelManager';
import Dashboard from './components/Dashboard';
import { mockFiles, mockFolderTree, mockUser } from './services/mockData';
import { ensureRootFolder, buildFolderTree, createFolder as driveCreateFolder, renameFile as driveRename, deleteFile as driveDelete, uploadFile as driveUpload, listFiles as driveListFiles, listAllFiles, saveLink as driveSaveLink, loadAppConfig, saveAppConfig } from './services/driveService.ts';
import type { DriveFileItem } from './services/driveService';
import type { AssetFile, FolderNode, FileType, UserProfile, AppConfig, Label, AsinItem, ViewMode, KanbanStatus } from './types';

const USE_MOCK = false; // Set to true for demo mode without Firebase

// Helper to guess FileType from MIME type
function guessFileType(mimeType: string, name: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'xlsx';
  if (mimeType.startsWith('text/') || mimeType.includes('document') || name.endsWith('.txt') || name.endsWith('.doc') || name.endsWith('.docx')) return 'text';
  if (name.endsWith('.url')) return 'link';
  return 'other';
}

// Helper: flatten FolderNode tree → flat array for Sidebar.jsx
function flattenTree(nodes: FolderNode[], parentId: string | null = null): { id: string; name: string; parentId: string | null; type: string; fileCount: number }[] {
  const result: { id: string; name: string; parentId: string | null; type: string; fileCount: number }[] = [];
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      parentId,
      type: node.type || 'general',
      fileCount: 0,
    });
    if (node.children?.length > 0) {
      result.push(...flattenTree(node.children, node.id));
    }
  }
  return result;
}

export default function App() {
  // Auth state
  const [user, setUser] = useState<UserProfile | null>(USE_MOCK ? mockUser : null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const driveRootId = useRef<string | null>(null);

  // Navigation state
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Folder tree state (mutable)
  const [folderTree, setFolderTree] = useState<FolderNode[]>(() =>
    USE_MOCK ? JSON.parse(JSON.stringify(mockFolderTree)) : []
  );

  // App Config state (metadata like folder custom icons and order)
  const [appConfig, setAppConfig] = useState<AppConfig>({ folderMeta: {} });
  const configFileId = useRef<string | null>(null);

  // Files state
  const [allFiles, setAllFiles] = useState<AssetFile[]>(USE_MOCK ? mockFiles : []);
  const [isLoading, setIsLoading] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<FileType | 'all'>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeAsin, setActiveAsin] = useState('');
  const [activeDateRange, setActiveDateRange] = useState('');
  const [activeSizeRange, setActiveSizeRange] = useState('');

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Quick upload (drag-drop) state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [quickUploadToasts, setQuickUploadToasts] = useState<{ id: string; name: string; progress: number; done: boolean; error?: string }[]>([]);
  const dragCounter = useRef(0);

  // Link modal state
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);

  // Preview state
  const [previewFile, setPreviewFile] = useState<AssetFile | null>(null);

  // Label manager state
  const [showLabelManager, setShowLabelManager] = useState(false);

  // ASIN manager state
  const [showAsinManager, setShowAsinManager] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Grid size state
  const [gridSize, setGridSize] = useState<number>(5);

  useEffect(() => {
    localStorage.setItem('app_grid_size', gridSize.toString());
  }, [gridSize]);

  // Bulk selection state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = useCallback((fileId: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedFileIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!user?.accessToken || selectedFileIds.size === 0) return;
    const confirmed = window.confirm(`Xóa ${selectedFileIds.size} file đã chọn ? `);
    if (!confirmed) return;
    for (const fileId of selectedFileIds) {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
      } catch (err) {
        console.error('Bulk delete error for', fileId, err);
      }
    }
    setAllFiles(prev => prev.filter(f => !selectedFileIds.has(f.id)));
    setSelectedFileIds(new Set());
  }, [user, selectedFileIds]);

  const handleBulkStatusChange = useCallback((status: KanbanStatus) => {
    setAllFiles(prev => prev.map(f =>
      selectedFileIds.has(f.id) ? { ...f, kanbanStatus: status } : f
    ));
    // Persist each to Drive
    if (user?.accessToken) {
      for (const fileId of selectedFileIds) {
        const file = allFiles.find(f => f.id === fileId);
        if (file) {
          fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description: JSON.stringify({ tags: file.tags, kanbanStatus: status }) }),
          }).catch(err => console.error('Bulk status error:', err));
        }
      }
    }
    setSelectedFileIds(new Set());
  }, [user, selectedFileIds, allFiles]);



  // ── Load files from a Drive folder ──────────────────────────────
  const loadFilesFromFolder = useCallback(async (token: string, folderId: string | null, allFolderIds?: string[]) => {
    try {
      setIsLoading(true);
      let driveFiles: DriveFileItem[] = [];
      if (folderId) {
        driveFiles = await driveListFiles(token, folderId);
      } else if (allFolderIds && allFolderIds.length > 0) {
        driveFiles = await listAllFiles(token, allFolderIds);
      }

      const converted: AssetFile[] = driveFiles
        .filter((f) => f.mimeType !== 'application/vnd.google-apps.folder') // exclude subfolders
        .map((f) => {
          // Detect if this is a saved link (.url file with description)
          let isLink = false;
          let linkUrl = '';
          let linkTags: string[] = [];
          let linkType = '';
          let fileAsin: string | null = null;
          let pName: string | null = null;
          let kanbanSt: KanbanStatus | undefined;

          if (f.description) {
            try {
              const meta = JSON.parse(f.description);
              if (f.name.endsWith('.url') && meta.isLink) {
                isLink = true;
                linkUrl = meta.url || '';
                linkTags = meta.tags || [];
                linkType = meta.linkType || '';
              }
              fileAsin = meta.asin || null;
              pName = meta.productName || null;
              if (meta.tags && Array.isArray(meta.tags) && !isLink) linkTags = meta.tags;
              if (meta.kanbanStatus) kanbanSt = meta.kanbanStatus as KanbanStatus;
            } catch { /* not JSON */ }
          }

          const fileType = isLink ? 'link' as const : guessFileType(f.mimeType, f.name);

          return {
            id: f.id,
            driveId: f.id,
            name: isLink ? f.name.replace(/\.url$/, '') : f.name,
            originalName: f.name,
            type: fileType,
            mimeType: f.mimeType,
            size: parseInt(f.size || '0', 10),
            asin: fileAsin,
            productName: pName,
            category: isLink ? linkType : '',
            tags: linkTags,
            thumbnailUrl: f.thumbnailLink || '',
            webViewLink: isLink ? linkUrl : (f.webViewLink || ''),
            downloadUrl: f.webViewLink || '',
            driveFolderId: folderId || 'root',
            createdAt: new Date(f.createdTime || Date.now()),
            updatedAt: new Date(f.modifiedTime || Date.now()),
            uploadedBy: '',
            status: 'active' as const,
            kanbanStatus: kanbanSt
          };
        });

      setAllFiles(converted);
    } catch (err) {
      console.error('Failed to load files from folder:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load folder tree from Drive ────────────────────────────────────
  const loadFolderTreeFromDrive = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const rootId = await ensureRootFolder(token);
      driveRootId.current = rootId;
      const tree = await buildFolderTree(token, rootId, 'AmazonAssetManager');

      // Load app config (custom icons, order)
      const configRes = await loadAppConfig(token, rootId);
      configFileId.current = configRes.fileId;
      setAppConfig(configRes.config);

      // Convert to FolderNode[]
      const convertNode = (node: typeof tree): FolderNode => ({
        id: node.id,
        name: node.name,
        driveId: node.driveId,
        parentId: node.parentId,
        type: node.type,
        children: (node.children as typeof tree[]).map(convertNode),
      });
      const finalTree = [convertNode(tree)];
      setFolderTree(finalTree);

      // Load all files initially to populate Home view & enable Global Search
      const flattenIds = (node: typeof tree): string[] => {
        const childIds = node.children.flatMap(flattenIds);
        return [node.id, ...childIds];
      };
      const allIds = flattenIds(tree);
      loadFilesFromFolder(token, null, allIds);
    } catch (err) {
      console.error('Failed to load Drive folders:', err);
      setFolderTree(JSON.parse(JSON.stringify(mockFolderTree)));
    } finally {
      setIsLoading(false);
    }
  }, [loadFilesFromFolder]);

  // Sync app config back to Drive whenever it changes significantly
  const saveConfigToDrive = useCallback(async (token: string, config: AppConfig) => {
    if (!driveRootId.current) return;
    try {
      const newFileId = await saveAppConfig(token, driveRootId.current, configFileId.current, config);
      if (!configFileId.current) {
        configFileId.current = newFileId;
      }
    } catch (error) {
      console.error('Failed to save app config:', error);
    }
  }, []);



  // ── Navigation ────────────────────────────────────────────────────
  const buildBreadcrumb = useCallback((folder: FolderNode): string[] => {
    const path: string[] = [];
    const findPath = (nodes: FolderNode[], target: string): boolean => {
      for (const n of nodes) {
        if (n.id === target) {
          path.push(n.name);
          return true;
        }
        if (n.children.length > 0 && findPath(n.children, target)) {
          path.unshift(n.name);
          return true;
        }
      }
      return false;
    };
    for (const root of folderTree) {
      if (findPath(root.children, folder.id)) break;
    }
    return path;
  }, [folderTree]);



  const handleFolderClick = useCallback((folder: FolderNode) => {
    setActiveFolderId(folder.id);
    setBreadcrumbPath(buildBreadcrumb(folder));
    setSearchQuery('');
    setIsSidebarOpen(false);
    // Load files from this Drive folder
    if (user?.accessToken) {
      loadFilesFromFolder(user.accessToken, folder.id);
    }
  }, [buildBreadcrumb, user, loadFilesFromFolder]);

  // Flat folders for new Sidebar.jsx (Moved up to prevent use-before-declaration)
  const flatFolders = useMemo(() => {
    const flat = flattenTree(folderTree);
    // Compute file counts per folder
    const counts: Record<string, number> = {};
    allFiles.forEach(f => {
      if (f.driveFolderId) counts[f.driveFolderId] = (counts[f.driveFolderId] || 0) + 1;
    });
    return flat.map(f => ({ ...f, fileCount: counts[f.id] || 0 }));
  }, [folderTree, allFiles]);

  // Flat folder list for BulkActionBar move picker
  const folderListForPicker = useMemo(() =>
    flatFolders.map(f => ({ id: f.id, name: f.name, path: f.name })),
    [flatFolders]);

  // ── Folder CRUD ───────────────────────────────────────────────────
  const updateTreeNode = useCallback(
    (nodes: FolderNode[], id: string, updater: (n: FolderNode) => FolderNode | null): FolderNode[] => {
      return nodes.reduce<FolderNode[]>((acc, node) => {
        if (node.id === id) {
          const result = updater(node);
          if (result) acc.push(result);
          // if null, node is deleted
        } else {
          acc.push({ ...node, children: updateTreeNode(node.children, id, updater) });
        }
        return acc;
      }, []);
    }, []
  );

  const handleRenameFolder = useCallback(async (folderId: string, newName: string) => {
    // Optimistic UI update
    setFolderTree((prev) =>
      prev.map((root) => ({
        ...root,
        children: updateTreeNode(root.children, folderId, (n) => ({ ...n, name: newName })),
      }))
    );
    // Also update root name if it matches
    setFolderTree((prev) =>
      prev.map((root) => root.id === folderId ? { ...root, name: newName } : root)
    );
    // Sync with Drive
    if (user?.accessToken) {
      try {
        await driveRename(user.accessToken, folderId, newName);
      } catch (err) {
        console.error('Drive rename failed:', err);
      }
    }
  }, [updateTreeNode, user, flatFolders]);

  const handleDeleteFolder = useCallback(async (folderId: string, _folderName: string) => {
    // Optimistic UI update
    setFolderTree((prev) =>
      prev.map((root) => ({
        ...root,
        children: updateTreeNode(root.children, folderId, () => null),
      }))
    );
    if (activeFolderId === folderId) {
      setActiveFolderId(null);
      setBreadcrumbPath([]);
    }
    // Sync with Drive
    if (user?.accessToken) {
      try {
        await driveDelete(user.accessToken, folderId);
      } catch (err) {
        console.error('Drive delete failed:', err);
      }
    }
  }, [updateTreeNode, activeFolderId, user]);

  const handleNewFolder = useCallback(async (parentId: string | null, name: string = 'New Folder') => {
    const rootId = driveRootId.current;
    const effectiveParent = parentId || rootId;

    if (user?.accessToken && effectiveParent) {
      try {
        // Create on Drive first to get real ID
        const driveId = await driveCreateFolder(user.accessToken, name, effectiveParent);
        const newFolder: FolderNode = {
          id: driveId,
          name: name,
          type: 'subfolder',
          driveId: driveId,
          parentId: effectiveParent,
          children: [],
        };

        if (!parentId) {
          setFolderTree((prev) =>
            prev.map((root, i) =>
              i === 0 ? { ...root, children: [...root.children, newFolder] } : root
            )
          );
        } else {
          setFolderTree((prev) =>
            prev.map((root) => ({
              ...root,
              children: updateTreeNode(root.children, parentId, (n) => ({
                ...n,
                children: [...n.children, newFolder],
              })),
            }))
          );
        }
      } catch (err) {
        console.error('Drive create folder failed:', err);
        alert('Không thể tạo folder trên Drive. Vui lòng thử lại.');
      }
    } else {
      // Offline/mock fallback
      const newFolder: FolderNode = {
        id: `folder-${Date.now()}`,
        name: name,
        type: 'subfolder',
        driveId: `local-${Date.now()}`,
        parentId: parentId,
        children: [],
      };
      if (!parentId) {
        setFolderTree((prev) =>
          prev.map((root, i) =>
            i === 0 ? { ...root, children: [...root.children, newFolder] } : root
          )
        );
      } else {
        setFolderTree((prev) =>
          prev.map((root) => ({
            ...root,
            children: updateTreeNode(root.children, parentId, (n) => ({
              ...n,
              children: [...n.children, newFolder],
            })),
          }))
        );
      }
    }
  }, [updateTreeNode, user, flatFolders]);

  const handleBreadcrumbNav = useCallback((index: number) => {
    if (index === -1) {
      setActiveFolderId(null);
      setBreadcrumbPath([]);
    }
  }, []);

  // ── Search & Filter ───────────────────────────────────────────────
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (q) {
      setActiveFolderId(null);
      setBreadcrumbPath([]);
    }
  }, []);

  const handleTypeChange = useCallback((type: FileType | 'all') => setActiveType(type), []);

  const handleTagToggle = useCallback((tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }, []);

  // ── Filtered files ────────────────────────────────────────────────
  const displayFolders = useMemo(() => {
    if (activeFolderId === 'starred') {
      const getStarred = (nodes: FolderNode[]): FolderNode[] => {
        let starred: FolderNode[] = [];
        nodes.forEach(n => {
          if (n.isStarred) starred.push(n);
          starred = [...starred, ...getStarred(n.children)];
        });
        return starred;
      };
      return getStarred(folderTree);
    }
    if (searchQuery || activeFolderId) return [];
    return folderTree;
  }, [folderTree, searchQuery, activeFolderId]);

  const filteredFiles = useMemo(() => {
    let list = allFiles;

    if (activeFolderId === 'starred') {
      list = list.filter(f => f.isStarred);
    } else if (activeFolderId) {
      list = list.filter(f => f.driveFolderId === activeFolderId);
    }

    // Search — match name, originalName, ASIN, product name, tags, mimeType
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => {
        const matchName = f.name.toLowerCase().includes(q) || (f.originalName && f.originalName.toLowerCase().includes(q));
        const matchAsin = f.asin?.toLowerCase().includes(q);
        const matchProductName = f.productName?.toLowerCase().includes(q);
        const matchCategory = f.category?.toLowerCase().includes(q);
        const matchTags = f.tags.some((t) => t.toLowerCase().includes(q));
        const matchMime = f.mimeType?.toLowerCase().includes(q);
        return matchName || matchAsin || matchProductName || matchCategory || matchTags || matchMime;
      });
    }

    // Type filter
    if (activeType !== 'all') {
      list = list.filter((f) => f.type === activeType);
    }

    // Tag filter
    if (activeTags.length > 0) {
      list = list.filter((f) => activeTags.every((t) => f.tags.includes(t)));
    }

    // ASIN filter
    if (activeAsin) {
      list = list.filter((f) => f.asin === activeAsin);
    }

    // Date range filter
    if (activeDateRange) {
      const now = Date.now();
      const ms: Record<string, number> = {
        today: 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - (ms[activeDateRange] || 0);
      list = list.filter((f) => new Date(f.updatedAt).getTime() >= cutoff);
    }

    // Size range filter
    if (activeSizeRange) {
      const MB = 1024 * 1024;
      list = list.filter((f) => {
        switch (activeSizeRange) {
          case 'small': return f.size < 1 * MB;
          case 'medium': return f.size >= 1 * MB && f.size < 10 * MB;
          case 'large': return f.size >= 10 * MB && f.size < 100 * MB;
          case 'xlarge': return f.size >= 100 * MB;
          default: return true;
        }
      });
    }

    return list;
  }, [allFiles, searchQuery, activeType, activeTags, activeAsin, activeDateRange, activeSizeRange, activeFolderId]);

  // All unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allFiles.forEach((f) => f.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [allFiles]);

  // handleMoveFolder — update tree when folder dragged to new parent
  const handleMoveFolder = useCallback((folderId: string, newParentId: string) => {
    setFolderTree(prev => {
      let movedNode: FolderNode | null = null;
      // Remove from old position
      const removeNode = (nodes: FolderNode[]): FolderNode[] =>
        nodes.reduce<FolderNode[]>((acc, n) => {
          if (n.id === folderId) { movedNode = n; return acc; }
          acc.push({ ...n, children: removeNode(n.children) });
          return acc;
        }, []);
      const cleaned = prev.map(root => ({ ...root, children: removeNode(root.children) }));
      if (!movedNode) return prev;
      // Insert under new parent
      const insertNode = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => n.id === newParentId
          ? { ...n, children: [...n.children, { ...movedNode!, parentId: newParentId }] }
          : { ...n, children: insertNode(n.children) }
        );
      return insertNode(cleaned);
    });
  }, []);

  // ── Quick upload (drag from desktop — no modal) ──
  const handleQuickUpload = useCallback(async (files: File[]) => {
    if (!user?.accessToken) return;
    const targetFolderId = activeFolderId || driveRootId.current;
    if (!targetFolderId) return;

    for (const file of files) {
      const toastId = `quick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const fileName = file.name;

      // Add toast
      setQuickUploadToasts(prev => [...prev, { id: toastId, name: fileName, progress: 0, done: false }]);

      try {
        const result = await driveUpload(
          user.accessToken,
          file,
          targetFolderId,
          fileName,
          (percent) => setQuickUploadToasts(prev => prev.map(t => t.id === toastId ? { ...t, progress: percent } : t))
        );

        // Mark done
        setQuickUploadToasts(prev => prev.map(t => t.id === toastId ? { ...t, progress: 100, done: true } : t));

        // Add to file list
        const newFile: AssetFile = {
          id: result.fileId,
          driveId: result.fileId,
          name: fileName,
          originalName: file.name,
          type: guessFileType(file.type, file.name),
          mimeType: file.type,
          size: file.size,
          asin: null,
          productName: null,
          category: '',
          tags: [],
          thumbnailUrl: result.thumbnailLink || '',
          webViewLink: result.webViewLink || '',
          downloadUrl: result.webViewLink || '',
          driveFolderId: targetFolderId,
          createdAt: new Date(),
          updatedAt: new Date(),
          uploadedBy: user.uid,
          status: 'active',
        };
        setAllFiles(prev => [newFile, ...prev]);

        // Auto-remove toast after 3s
        setTimeout(() => {
          setQuickUploadToasts(prev => prev.filter(t => t.id !== toastId));
        }, 3000);
      } catch (err) {
        setQuickUploadToasts(prev => prev.map(t => t.id === toastId ? { ...t, done: true, error: err instanceof Error ? err.message : 'Lỗi' } : t));
        setTimeout(() => {
          setQuickUploadToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      }
    }
  }, [user, activeFolderId]);

  const handleFileDrop = useCallback((files: File[]) => {
    handleQuickUpload(files);
  }, [handleQuickUpload]);

  const handleFilesSelected = useCallback((files: File[]) => {
    setUploadFiles(files);
    if (!isUploadModalOpen) {
      setIsUploadModalOpen(true);
      setUploadSuccess(false);
      setUploadProgress(0);
    }
  }, [isUploadModalOpen]);

  const handleUpload = useCallback(async (data: {
    file: File; name: string; tags: string[]; asin: string | null; category: string;
  }) => {
    setIsUploading(true);
    setUploadProgress(0);

    if (user?.accessToken) {
      try {
        // Determine target folder: currently active folder or Drive root
        const targetFolderId = activeFolderId || driveRootId.current;
        if (!targetFolderId) throw new Error('No target folder');

        // Upload to Google Drive with real progress
        const result = await driveUpload(
          user.accessToken,
          data.file,
          targetFolderId,
          data.name,
          (percent) => setUploadProgress(percent)
        );

        console.log('✅ Uploaded to Drive:', result.fileId, result.webViewLink);
        setUploadProgress(100);
        setIsUploading(false);
        setUploadSuccess(true);

        // ✅ Add the uploaded file to allFiles so it shows immediately
        const newFile: AssetFile = {
          id: result.fileId,
          driveId: result.fileId,
          name: data.name,
          originalName: data.file.name,
          type: guessFileType(data.file.type, data.file.name),
          mimeType: data.file.type,
          size: data.file.size,
          asin: data.asin,
          productName: null,
          category: data.category,
          tags: data.tags,
          thumbnailUrl: result.thumbnailLink || '',
          webViewLink: result.webViewLink || '',
          downloadUrl: result.webViewLink || '',
          driveFolderId: targetFolderId,
          createdAt: new Date(),
          updatedAt: new Date(),
          uploadedBy: user.uid,
          status: 'active',
        };
        setAllFiles((prev) => [newFile, ...prev]);
      } catch (err) {
        console.error('❌ Drive upload failed:', err);
        setIsUploading(false);
        alert(`Upload thất bại: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      // Mock fallback
      for (let i = 0; i <= 100; i += 5) {
        await new Promise((r) => setTimeout(r, 60));
        setUploadProgress(i);
      }
      setIsUploading(false);
      setUploadSuccess(true);
    }
  }, [user, activeFolderId]);

  const handleUploadClose = useCallback(() => {
    setIsUploadModalOpen(false);
    setUploadFiles([]);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSuccess(false);
  }, []);

  // ── Add Link ──────────────────────────────────────────────────────
  const handleAddLink = useCallback(async (data: {
    url: string; name: string; tags: string[]; linkMeta: LinkMeta;
  }) => {
    const targetFolderId = activeFolderId || driveRootId.current;

    // Save to Drive if possible
    let driveId = '';
    if (user?.accessToken && targetFolderId) {
      try {
        const result = await driveSaveLink(
          user.accessToken,
          targetFolderId,
          data.name,
          data.url,
          data.tags,
          data.linkMeta.type
        );
        driveId = result.fileId;
        console.log('✅ Link saved to Drive:', driveId);
      } catch (err) {
        console.error('❌ Failed to save link to Drive:', err);
      }
    }

    const newFile: AssetFile = {
      id: driveId || `link-${Date.now()}`,
      driveId,
      name: data.name,
      originalName: data.url,
      type: 'link',
      mimeType: 'text/uri-list',
      size: 0,
      asin: null,
      productName: null,
      category: data.linkMeta.type,
      tags: data.tags,
      thumbnailUrl: '',
      webViewLink: data.url,
      downloadUrl: data.url,
      driveFolderId: targetFolderId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      uploadedBy: user?.uid || '',
      status: 'active',
    };
    setAllFiles((prev) => [newFile, ...prev]);
    setIsAddLinkOpen(false);
  }, [activeFolderId, user]);
  const handleFileClick = useCallback((file: AssetFile) => {
    setPreviewFile(file);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setPreviewFile(null);
  }, []);

  // ── File Rename ─────────────────────────────────────────────────────
  const handleFileRename = useCallback(async (file: AssetFile, newName: string) => {
    // Optimistic UI update
    setAllFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, name: newName } : f));
    // Sync with Drive
    if (user?.accessToken && file.driveId) {
      try {
        await driveRename(user.accessToken, file.driveId, newName);
        console.log('✅ File renamed on Drive:', newName);
      } catch (err) {
        console.error('❌ Drive rename failed:', err);
        // Revert on failure
        setAllFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, name: file.name } : f));
      }
    }
  }, [user]);

  // ── File Delete ─────────────────────────────────────────────────────
  const handleFileDelete = useCallback(async (file: AssetFile) => {
    // Optimistic UI update
    setAllFiles((prev) => prev.filter((f) => f.id !== file.id));
    // Sync with Drive
    if (user?.accessToken && file.driveId) {
      try {
        await driveDelete(user.accessToken, file.driveId);
        console.log('✅ File deleted from Drive:', file.name);
      } catch (err) {
        console.error('❌ Drive delete failed:', err);
        // Revert on failure
        setAllFiles((prev) => [file, ...prev]);
      }
    }
  }, [user]);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (previewFile) {
          setPreviewFile(null);
        } else if (selectedFileIds.size === 1) {
          const fileId = Array.from(selectedFileIds)[0];
          const file = allFiles.find(f => f.id === fileId);
          if (file) setPreviewFile(file);
        }
      } else if (e.code === 'Escape') {
        if (previewFile) setPreviewFile(null);
        else if (isUploadModalOpen) handleUploadClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFileIds, allFiles, previewFile, isUploadModalOpen, handleUploadClose]);

  // ── Loading simulation ────────────────────────────────────────────
  useEffect(() => {
    if (activeFolderId || debouncedQuery) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [activeFolderId, debouncedQuery]);

  // ── Render ────────────────────────────────────────────────────────



  const handleUpdateLabels = useCallback((newLabels: Label[]) => {
    setAppConfig(prev => {
      const newConfig = { ...prev, labels: newLabels };
      if (user?.accessToken) {
        saveConfigToDrive(user.accessToken, newConfig);
      }
      return newConfig;
    });
  }, [user, saveConfigToDrive]);

  const handleSaveAsins = useCallback((newAsins: AsinItem[]) => {
    setAppConfig(prev => {
      const newConfig = { ...prev, asins: newAsins };
      if (user?.accessToken) {
        saveConfigToDrive(user.accessToken, newConfig);
      }
      return newConfig;
    });
  }, [saveConfigToDrive, user]);


  // Handle file tags update
  const handleUpdateFileTags = useCallback(async (fileId: string, newTags: string[]) => {
    // Optimistic UI update
    setAllFiles(prev => prev.map(f => {
      if (f.id === fileId) return { ...f, tags: newTags };
      return f;
    }));

    // Find the file to update in Drive
    const fileToUpdate = allFiles.find(f => f.id === fileId);
    if (!fileToUpdate || !user?.accessToken) return;

    try {
      const descJson = {
        tags: newTags,
        isLink: fileToUpdate.type === 'link',
        url: fileToUpdate.webViewLink,
        linkType: fileToUpdate.category
      };

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: JSON.stringify(descJson) })
      });
      if (!res.ok) throw new Error('Failed to update file tags');
    } catch (err) {
      console.error('Failed to update file tags on Drive', err);
    }
  }, [allFiles, user]);

  const handleToggleFileStar = useCallback((fileId: string) => {
    setAllFiles(prev => prev.map(f => f.id === fileId ? { ...f, isStarred: !f.isStarred } : f));
  }, []);

  const handleToggleFolderStar = useCallback((folderId: string) => {
    setFolderTree(prev => {
      const update = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => n.id === folderId ? { ...n, isStarred: !n.isStarred } : { ...n, children: update(n.children) });
      return update(prev);
    });
  }, []);

  const handleLogin = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      const { signInWithGoogle } = await import('./services/authService');
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        setUser(loggedInUser);
        loadFolderTreeFromDrive(loggedInUser.accessToken);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsAuthLoading(false);
    }
  }, [loadFolderTreeFromDrive]);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} isLoading={isAuthLoading} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        user={user}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onUploadClick={() => {
          setUploadFiles([]);
          setIsUploadModalOpen(true);
          setUploadSuccess(false);
        }}
        onAddLinkClick={() => setIsAddLinkOpen(true)}
        onManageLabelsClick={() => setShowLabelManager(true)}
        onManageAsinsClick={() => setShowAsinManager(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        allFiles={allFiles}
        folderTree={folderTree}
        onFolderClick={(folderId: string) => {
          // Find the folder node by ID recursively
          const findFolder = (nodes: typeof folderTree): typeof folderTree[0] | null => {
            for (const n of nodes) {
              if (n.id === folderId) return n;
              const found = findFolder(n.children);
              if (found) return found;
            }
            return null;
          };
          const folder = findFolder(folderTree);
          if (folder) handleFolderClick(folder);
        }}
        onFileClick={handleFileClick}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={flatFolders}
          appAsins={appConfig.asins || []}
          activeFolderId={activeFolderId}
          onSelectFolder={(folderId: string) => {
            if (!folderId) {
              setActiveFolderId(null);
              setBreadcrumbPath([]);
              if (user?.accessToken && flatFolders.length > 0) {
                const allIds = flatFolders.map(f => f.id);
                loadFilesFromFolder(user.accessToken, null, allIds);
              }
              return;
            }
            const findFolder = (nodes: FolderNode[]): FolderNode | null => {
              for (const n of nodes) {
                if (n.id === folderId) return n;
                const found = findFolder(n.children);
                if (found) return found;
              }
              return null;
            };
            const folder = findFolder(folderTree);
            if (folder) handleFolderClick(folder);
            else { setActiveFolderId(folderId); }
          }}
          onCreateFolder={handleNewFolder}
          onRenameFolder={handleRenameFolder}
          onMoveFolder={handleMoveFolder}
          onDeleteFolder={(folderId: string) => handleDeleteFolder(folderId, '')}
          syncStatus="synced"
          lastSyncTime={new Date()}
        />

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main
          className={`flex-1 overflow-y-auto p-5 lg:p-6 relative transition-all duration-200 ${isDraggingOver ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}`}
          style={{ height: 'calc(100vh - 64px)' }}
          onDragEnter={(e) => {
            e.preventDefault();
            dragCounter.current++;
            if (e.dataTransfer.types.includes('Files')) setIsDraggingOver(true);
          }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDragLeave={(e) => {
            e.preventDefault();
            dragCounter.current--;
            if (dragCounter.current <= 0) { setIsDraggingOver(false); dragCounter.current = 0; }
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragCounter.current = 0;
            setIsDraggingOver(false);
            const droppedFiles = Array.from(e.dataTransfer.files);
            if (droppedFiles.length > 0) handleQuickUpload(droppedFiles);
          }}
        >
          {/* Drag overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl pointer-events-none animate-fade-in">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-dashed border-primary flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="text-sm font-semibold text-white">Thả file để upload ngay</p>
                <p className="text-xs text-text-muted">File sẽ được upload vào folder hiện tại</p>
              </div>
            </div>
          )}
          {/* Breadcrumb */}
          <Breadcrumb path={breadcrumbPath} onNavigate={handleBreadcrumbNav} />

          {/* Filter bar */}
          <div className="mb-5 relative z-40">
            <FilterBar
              appLabels={appConfig.labels || []}
              appAsins={appConfig.asins || []}
              activeType={activeType}
              activeTags={activeTags}
              activeAsin={activeAsin}
              activeDateRange={activeDateRange}
              activeSizeRange={activeSizeRange}
              allTags={allTags}
              onTypeChange={handleTypeChange}
              onTagToggle={handleTagToggle}
              onAsinChange={setActiveAsin}
              onDateRangeChange={setActiveDateRange}
              onSizeRangeChange={setActiveSizeRange}
              onClearAll={() => {
                setActiveType('all');
                setActiveTags([]);
                setActiveAsin('');
                setActiveDateRange('');
                setActiveSizeRange('');
              }}
              fileCount={filteredFiles.length}
              totalCount={allFiles.filter(f => f.status === 'active').length}
            />
          </div>

          {/* Calculate current subfolders */}
          {(() => {
            const findSubfolders = (nodes: FolderNode[], targetId: string | null): FolderNode[] => {
              if (targetId === null) return nodes; // Root level: show all top-level folders
              if (targetId === 'starred') return []; // In starred view, displayFolders handles it
              for (const n of nodes) {
                if (n.id === targetId) return n.children;
                const found = findSubfolders(n.children, targetId);
                if (found.length > 0) return found;
              }
              return [];
            };

            // Special case for root level when activeFolderId is null
            const currentSubfolders = findSubfolders(folderTree, activeFolderId);

            const onFolderClick = (folderId: string) => {
              const findNode = (nodes: FolderNode[]): FolderNode | null => {
                for (const n of nodes) {
                  if (n.id === folderId) return n;
                  const found = findNode(n.children);
                  if (found) return found;
                }
                return null;
              };
              const folder = findNode(folderTree);
              if (folder) handleFolderClick(folder);
            };

            return (
              <>
                {/* File gallery / Kanban / List view */}
                {activeFolderId === 'dashboard' ? (
                  <Dashboard
                    files={allFiles.filter(f => f.status === 'active')}
                    folders={folderTree}
                    onFileClick={handleFileClick}
                    onFolderClick={onFolderClick}
                  />
                ) : viewMode === 'kanban' ? (
                  <KanbanBoard
                    files={filteredFiles}
                    columns={appConfig.kanbanColumns || []}
                    onMoveFile={(fileId: string, newStatus: string) => {
                      setAllFiles(prev => prev.map(f =>
                        f.id === fileId ? { ...f, kanbanStatus: newStatus as KanbanStatus } : f
                      ));
                      const file = allFiles.find(f => f.id === fileId);
                      if (file && user?.accessToken) {
                        const descJson = {
                          tags: file.tags,
                          kanbanStatus: newStatus,
                          isLink: file.type === 'link',
                          url: file.webViewLink,
                          linkType: file.category,
                        };
                        fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
                          method: 'PATCH',
                          headers: {
                            Authorization: `Bearer ${user.accessToken}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ description: JSON.stringify(descJson) }),
                        }).catch(err => console.error('Failed to update kanban status on Drive:', err));
                      }
                    }}
                    onUpdateColumns={(newColumns: any[]) => {
                      setAppConfig(prev => {
                        const newConfig = { ...prev, kanbanColumns: newColumns };
                        if (user?.accessToken) saveConfigToDrive(user.accessToken, newConfig);
                        return newConfig;
                      });
                    }}
                    onFileClick={handleFileClick}
                  />
                ) : viewMode === 'list' ? (
                  <ListView
                    files={filteredFiles}
                    subfolders={currentSubfolders}
                    appLabels={appConfig.labels || []}
                    onFileClick={handleFileClick}
                    onFolderClick={onFolderClick}
                    isLoading={isLoading}
                  />
                ) : (
                  <FileGallery
                    subfolders={displayFolders.length > 0 ? displayFolders : currentSubfolders}
                    files={filteredFiles}
                    appLabels={appConfig.labels || []}
                    onFileClick={handleFileClick}
                    onFolderClick={onFolderClick}
                    onFileDrop={handleFileDrop}
                    onFileRename={handleFileRename}
                    onFileDelete={handleFileDelete}
                    onUpdateTags={handleUpdateFileTags}
                    onManageLabels={() => setShowLabelManager(true)}
                    selectedFileIds={selectedFileIds}
                    onToggleSelect={handleToggleSelect}
                    isLoading={isLoading}
                    gridSize={gridSize}
                    onToggleFileStar={handleToggleFileStar}
                    onToggleFolderStar={handleToggleFolderStar}
                  />
                )}
              </>
            );
          })()}

          {/* Footer stats */}
          {filteredFiles.length > 0 && (
            <div className="mt-6 text-center text-xs text-text-muted animate-fade-in">
              Showing {filteredFiles.length} of {allFiles.length} files
              {activeFolderId && ' in this folder'}
              {debouncedQuery && ` matching "${debouncedQuery}"`}
            </div>
          )}
        </main>

        {/* Quick upload toasts */}
        {quickUploadToasts.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 animate-fade-in">
            {quickUploadToasts.map(toast => (
              <div key={toast.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-lg min-w-[280px] transition-all
                  ${toast.error ? 'bg-error/10 border-error/30' : toast.done ? 'bg-success/10 border-success/30' : 'bg-surface-2/95 border-border'}`}>
                {toast.error ? (
                  <span className="text-error text-lg">✗</span>
                ) : toast.done ? (
                  <span className="text-success text-lg">✓</span>
                ) : (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{toast.name}</p>
                  {toast.error ? (
                    <p className="text-[10px] text-error">{toast.error}</p>
                  ) : toast.done ? (
                    <p className="text-[10px] text-success">Upload xong!</p>
                  ) : (
                    <div className="mt-1 h-1 rounded-full bg-surface-3 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${toast.progress}%` }} />
                    </div>
                  )}
                </div>
                <button onClick={() => setQuickUploadToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-text-muted hover:text-white transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedFileIds.size}
          onBulkMove={(folderId: string) => {
            // Move selected files to target folder
            setAllFiles(prev => prev.map(f =>
              selectedFileIds.has(f.id) ? { ...f, driveFolderId: folderId } : f
            ));
            setSelectedFileIds(new Set());
          }}
          onBulkAssignAsin={(asinId: string) => {
            const asin = (appConfig.asins || []).find(a => (a.id || a.code || a.asin) === asinId);
            setAllFiles(prev => prev.map(f =>
              selectedFileIds.has(f.id) ? { ...f, asin: asin?.code || asinId } : f
            ));
            setSelectedFileIds(new Set());
          }}
          onBulkAddTags={(tags: string[]) => {
            setAllFiles(prev => prev.map(f =>
              selectedFileIds.has(f.id)
                ? { ...f, tags: [...new Set([...f.tags, ...tags])] }
                : f
            ));
            setSelectedFileIds(new Set());
          }}
          onBulkChangeStatus={handleBulkStatusChange}
          onBulkDelete={handleBulkDelete}
          onClearSelection={handleClearSelection}
          folderList={folderListForPicker}
          asinList={(appConfig.asins || []).map(a => ({ id: a.id || a.code || a.asin, code: a.code || a.asin, name: a.name || a.productName || a.code || '' }))}
          kanbanColumns={appConfig.kanbanColumns || []}
        />
      </div>

      {/* Modals */}
      <UploadModal
        files={uploadFiles}
        isOpen={isUploadModalOpen}
        onClose={handleUploadClose}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        uploadSuccess={uploadSuccess}
        onFilesSelected={handleFilesSelected}
        appLabels={appConfig.labels || []}
        appAsins={appConfig.asins || []}
        onManageAsins={() => setShowAsinManager(true)}
      />

      {previewFile && (
        <FilePreviewOverlay
          file={previewFile}
          onClose={handlePreviewClose}
        />
      )}

      <AddLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        onAdd={handleAddLink}
      />

      {/* Label Manager */}
      {showLabelManager && (
        <LabelManager
          labels={appConfig.labels || []}
          onUpdateLabels={handleUpdateLabels}
          onClose={() => setShowLabelManager(false)}
        />
      )}

      {/* ASIN Manager */}
      <AsinManager
        isOpen={showAsinManager}
        asins={(appConfig.asins || []).map((a: AsinItem, i: number) => ({
          id: a.id || a.code || a.asin || `asin-${i}`,
          code: a.code || a.asin || '',
          productName: a.productName || a.name || '',
          category: (a as any).category || '',
          fileCount: allFiles.filter(f => f.asin === (a.code || a.asin)).length,
        })) as any}
        onClose={() => setShowAsinManager(false)}
        onCreateAsin={(code: string, productName: string, category: string = '') => {
          const newAsin: AsinItem = {
            id: `asin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            asin: code,
            code,
            name: productName,
            productName,
            category
          } as any;
          handleSaveAsins([...(appConfig.asins || []), newAsin]);
        }}
        onImportAsins={(rows: any[]) => {
          const newAsins = rows.map((r, i) => ({
            id: `asin-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            asin: r.code,
            code: r.code,
            name: r.productName,
            productName: r.productName,
            category: r.category || ''
          }));
          handleSaveAsins([...(appConfig.asins || []), ...newAsins] as any);
        }}
        onUpdateAsin={(asinId: string, updates: any) => {
          handleSaveAsins((appConfig.asins || []).map(a =>
            (a.id || a.code || a.asin || '') === asinId ? {
              ...a,
              name: updates.productName !== undefined ? updates.productName : a.name,
              productName: updates.productName !== undefined ? updates.productName : a.productName,
              category: updates.category !== undefined ? updates.category : (a as any).category
            } : a
          ));
        }}
        onDeleteAsin={(asinId: string) => {
          handleSaveAsins((appConfig.asins || []).filter(a => (a.id || a.code || a.asin || '') !== asinId));
        }}
        onClearAllAsins={() => {
          handleSaveAsins([]);
        }}
      />
    </div>
  );
}
