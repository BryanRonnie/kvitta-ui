/**
 * FileUpload Component (using shadcn/ui)
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="w-full space-y-2">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-background"
        )}
      >
        <Input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          aria-label="File upload"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-foreground mb-1">
            {isDragActive ? (
              'Drop files here'
            ) : (
              <>
                <span className="font-semibold">Click to upload</span>
                {' or drag and drop'}
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {accept} {multiple ? `(up to ${maxFiles} files)` : '(single file)'}
          </p>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
