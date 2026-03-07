#!/bin/bash
sed -i '' 's/import type { AssetFile, FileType, FolderNode, AppConfig, FolderMeta, Label }/import type { AssetFile, FileType, FolderNode, AppConfig, FolderMeta, Label }/g' src/App.tsx || true
sed -i '' 's/import AddLinkModal, { LinkMeta } from '"'"'.\/components\/AddLinkModal'"'"';/import AddLinkModal, { LinkMeta } from '"'"'.\/components\/AddLinkModal'"'"';\nimport LabelManager from '"'"'.\/components\/LabelManager'"'"';/g' src/App.tsx || true
sed -i '' 's/const \[showAddLink, setShowAddLink\] = useState(false);/const [showAddLink, setShowAddLink] = useState(false);\n  const [showLabelManager, setShowLabelManager] = useState(false);/g' src/App.tsx || true
sed -i '' '/const handleUpdateLabels = useCallback/,/}, \[user, saveConfigToDrive\]);/c\
  const saveConfigToDrive = useCallback(async (token: string, config: AppConfig) => {\
    try {\
      await driveSaveAppConfig(token, config);\
    } catch (error) {\
      console.error('"'"'Failed to save app config:'"'"', error);\
    }\
  }, []);\
\
  const handleUpdateFolderMeta = useCallback((folderId: string, metaPatch: Partial<FolderMeta>) => {\
    setAppConfig(prev => {\
      const currentMeta = prev.folderMeta[folderId] || {};\
      const newConfig = {\
        ...prev,\
        folderMeta: {\
          ...prev.folderMeta,\
          [folderId]: { ...currentMeta, ...metaPatch }\
        }\
      };\
      if (user?.accessToken) {\
        setTimeout(() => saveConfigToDrive(user.accessToken, newConfig), 1000);\
      }\
      return newConfig;\
    });\
  }, [saveConfigToDrive, user]);\
\
  const handleUpdateLabels = useCallback((newLabels: Label[]) => {\
    setAppConfig(prev => {\
      const newConfig = { ...prev, labels: newLabels };\
      if (user?.accessToken) {\
        saveConfigToDrive(user.accessToken, newConfig);\
      }\
      return newConfig;\
    });\
  }, [user, saveConfigToDrive]);\
' src/App.tsx
