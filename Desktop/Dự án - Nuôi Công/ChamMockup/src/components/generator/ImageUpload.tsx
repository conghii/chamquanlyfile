'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Upload, X, Sparkles, Loader2, AlertCircle, CheckCircle, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_SIZE_MB = 10;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload() {
  const {
    config,
    setUploadedImage,
    analyzeImage,
    clearImageAnalysis,
    isAnalyzingImage,
    imageAnalysisError,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState('');

  const hasImage = !!config.uploadedImageBase64;
  const hasAnalysis = !!config.uploadedImageAnalysis;

  const processFile = useCallback(
    async (file: File) => {
      setSizeError('');
      if (!ACCEPT.includes(file.type)) {
        setSizeError('Chỉ chấp nhận PNG, JPG, WEBP, GIF');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setSizeError(`File quá lớn. Tối đa ${MAX_SIZE_MB}MB`);
        return;
      }
      const base64 = await fileToBase64(file);
      setUploadedImage(base64);
    },
    [setUploadedImage]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Global paste handler
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
      }
    },
    [processFile]
  );

  // Use passive paste listener when component is mounted
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {!hasImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
            isDragging
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.01]'
              : 'border-gray-300 dark:border-gray-600 hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              Upload hình ảnh áo của bạn
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Kéo thả hoặc click để chọn · PNG, JPG, WEBP · Tối đa {MAX_SIZE_MB}MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        /* Image preview */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative rounded-2xl overflow-hidden border-2 transition-all',
            isDragging
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/40 ring-4 ring-violet-500/20'
              : 'border-violet-300 dark:border-violet-700 bg-gray-50 dark:bg-gray-800'
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-violet-600/10 backdrop-blur-[2px] pointer-events-none">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-full shadow-xl animate-bounce">
                <Upload className="w-6 h-6 text-violet-600" />
              </div>
              <p className="mt-2 text-xs font-bold text-violet-700 dark:text-violet-300 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full shadow-sm">
                Drop to replace image
              </p>
            </div>
          )}
          {/* Preview */}
          <div className="flex gap-3 p-3">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.uploadedImageBase64}
                alt="Uploaded shirt"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Ảnh đã tải lên
                  </span>
                </div>
                <button
                  onClick={clearImageAnalysis}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Xóa ảnh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Analysis result */}
              {hasAnalysis ? (
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                      GPT-4o đã phân tích
                    </span>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed line-clamp-4">
                    {config.uploadedImageAnalysis}
                  </p>
                </div>
              ) : (
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzingImage}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    isAnalyzingImage
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                  )}
                >
                  {isAnalyzingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang phân tích với GPT-4o...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Phân tích ảnh với AI ✨
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Re-analyze button */}
          {hasAnalysis && (
            <div className="px-3 pb-3 flex gap-2">
              <button
                onClick={analyzeImage}
                disabled={isAnalyzingImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-200 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors disabled:opacity-50"
              >
                {isAnalyzingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Phân tích lại
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Đổi ảnh
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {(sizeError || imageAnalysisError) && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400">
            {sizeError || imageAnalysisError}
          </p>
        </div>
      )}

      {/* Usage tip */}
      {hasAnalysis && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-violet-700 dark:text-violet-300">
            Mô tả từ AI đã được tích hợp vào prompt. Nhấn <strong>Generate Mockup</strong> để tạo mockup dựa trên ảnh áo của bạn.
          </p>
        </div>
      )}
    </div>
  );
}
