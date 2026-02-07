/**
 * FileUpload Component
 * 
 * A drag-and-drop file upload component with click-to-upload fallback.
 * Supports multiple files and file type validation.
 * 
 * @example
 * ```tsx
 * <FileUpload
 *   onFilesSelected={(files) => console.log(files)}
 *   accept="image/*"
 *   multiple
 *   maxFiles={5}
 * />
 * ```
 */

'use client';

import { useCallback, useState } from 'react';
import { FileUploadProps } from '@/types';

export function FileUpload({
  onFilesSelected,
  accept = 'image/*',
  multiple = false,
  maxFiles = 10,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);

    // Validate file count
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const fileArray = Array.from(files);
    onFilesSelected(fileArray);
  }, [maxFiles, onFilesSelected]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <UploadIcon />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? (
              'Drop files here'
            ) : (
              <>
                <span className="font-semibold text-blue-600">Click to upload</span>
                {' or drag and drop'}
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {multiple ? `Up to ${maxFiles} files` : '1 file'}
          </p>
        </label>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      className="w-12 h-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}
