'use client';

import { forwardRef, useState, useCallback, useId } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, X, File } from 'lucide-react';

interface FormFileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFileSelect?: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

const FormFileUpload = forwardRef<HTMLInputElement, FormFileUploadProps>(
  ({ 
    label, 
    error, 
    helperText, 
    required, 
    accept, 
    multiple = false, 
    maxSize = 5, 
    onFileSelect,
    className,
    disabled,
    ...props 
  }, ref) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const handleFileSelect = useCallback((files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        if (file.size > maxSize * 1024 * 1024) {
          errors.push(`${file.name} is too large (max ${maxSize}MB)`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        // Handle errors - you might want to show these to the user
        console.error('File upload errors:', errors);
      }

      setSelectedFiles(multiple ? [...selectedFiles, ...validFiles] : validFiles);
      onFileSelect?.(multiple ? [...selectedFiles, ...validFiles] : validFiles);
    }, [selectedFiles, multiple, maxSize, onFileSelect]);

    const handleDrag = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files);
      }
    }, [handleFileSelect]);

    const removeFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFileSelect?.(newFiles);
    };

    const generatedId = useId();
    const inputId = generatedId;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
            {label}
          </Label>
        )}
        
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            error && "border-red-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={ref}
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
            {...props}
          />
          
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or{' '}
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto"
              onClick={() => document.getElementById(inputId)?.click()}
              disabled={disabled}
            >
              browse
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            Max file size: {maxSize}MB
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FormFileUpload.displayName = 'FormFileUpload';

export default FormFileUpload;
