'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUploadFileMutation, useDeleteFileMutation } from '@/store/api/apiSlice';
import { Upload, File, X, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface FileUploadProps {
  documentType: string;
  applicationId?: string;
  maxFiles?: number;
  existingFiles?: Array<{
    _id: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  onFilesChange?: (files: any[]) => void;
  required?: boolean;
  disabled?: boolean;
  localMode?: boolean; // New prop for collecting files without immediate upload
}

export default function FileUpload({
  documentType,
  applicationId,
  maxFiles = 1,
  existingFiles = [],
  onFilesChange,
  required = false,
  disabled = false,
  localMode = false,
}: FileUploadProps) {
  const [files, setFiles] = useState(existingFiles);
  const [localFiles, setLocalFiles] = useState<File[]>([]); // For local mode
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFile] = useUploadFileMutation();
  const [deleteFile] = useDeleteFileMutation();

  // Document type configurations
  const getDocumentConfig = (type: string) => {
    const configs: Record<string, { 
      label: string; 
      accept: string; 
      maxSize: number; 
      description: string;
    }> = {
      profile_picture: {
        label: 'Profile Picture',
        accept: 'image/jpeg,image/jpg,image/png',
        maxSize: 5,
        description: 'Upload your profile picture (JPG, PNG, max 5MB)'
      },
      aadhar_card: {
        label: 'Aadhar Card',
        accept: 'image/jpeg,image/jpg,image/png,application/pdf',
        maxSize: 10,
        description: 'Upload Aadhar card (JPG, PNG, PDF, max 10MB)'
      },
      pan_card: {
        label: 'PAN Card',
        accept: 'image/jpeg,image/jpg,image/png,application/pdf',
        maxSize: 10,
        description: 'Upload PAN card (JPG, PNG, PDF, max 10MB)'
      },
      income_certificate: {
        label: 'Income Certificate',
        accept: 'image/jpeg,image/jpg,image/png,application/pdf',
        maxSize: 10,
        description: 'Upload income certificate (JPG, PNG, PDF, max 10MB)'
      },
      bank_statement: {
        label: 'Bank Statement',
        accept: 'application/pdf',
        maxSize: 20,
        description: 'Upload bank statement (PDF only, max 20MB)'
      },
      admission_letter: {
        label: 'Admission Letter',
        accept: 'image/jpeg,image/jpg,image/png,application/pdf',
        maxSize: 10,
        description: 'Upload admission letter (JPG, PNG, PDF, max 10MB)'
      },
      fee_structure: {
        label: 'Fee Structure',
        accept: 'image/jpeg,image/jpg,image/png,application/pdf',
        maxSize: 10,
        description: 'Upload fee structure (JPG, PNG, PDF, max 10MB)'
      },
      chat_files: {
        label: 'File',
        accept: 'image/jpeg,image/jpg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        maxSize: 15,
        description: 'Upload file (JPG, PNG, PDF, DOC, DOCX, max 15MB)'
      }
    };
    return configs[type] || configs.chat_files;
  };

  const config = getDocumentConfig(documentType);

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(selectedFiles);
    const currentFileCount = localMode ? localFiles.length : files.length;

    // Check file count limit
    if (currentFileCount + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }

    const validFiles: File[] = [];

    for (const file of fileArray) {
      // Validate file size
      if (file.size > config.maxSize * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds ${config.maxSize}MB limit`);
        continue;
      }

      // Validate file type
      const acceptedTypes = config.accept.split(',');
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has invalid format`);
        continue;
      }

      validFiles.push(file);
    }

    if (localMode) {
      // In local mode, just collect files without uploading
      const newLocalFiles = [...localFiles, ...validFiles];
      setLocalFiles(newLocalFiles);
      onFilesChange?.(newLocalFiles);

      validFiles.forEach(file => {
        toast.success(`${file.name} added successfully`);
      });
    } else {
      // In server mode, upload files immediately
      for (const file of validFiles) {
        await uploadFileToServer(file);
      }
    }
  }, [files, localFiles, maxFiles, config, disabled, localMode, onFilesChange]);

  const uploadFileToServer = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (applicationId) {
        formData.append('applicationId', applicationId);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFile(formData).unwrap();

      clearInterval(progressInterval);
      setUploadProgress(100);

      const newFiles = [...files, result.file];
      setFiles(newFiles);
      onFilesChange?.(newFiles);

      toast.success(`${file.name} uploaded successfully`);

    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId).unwrap();
      const newFiles = files.filter(f => f._id !== fileId);
      setFiles(newFiles);
      onFilesChange?.(newFiles);
      toast.success('File deleted successfully');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to delete file');
    }
  };

  const handleLocalFileRemove = (index: number) => {
    const newLocalFiles = localFiles.filter((_, i) => i !== index);
    setLocalFiles(newLocalFiles);
    onFilesChange?.(newLocalFiles);
    toast.success('File removed successfully');
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return '🖼️';
    } else if (extension === 'pdf') {
      return '📄';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝';
    }
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50' : 
        disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
      }`}>
        <CardContent className="p-6">
          <div
            className={`text-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <Upload className={`mx-auto h-12 w-12 mb-4 ${
              disabled ? 'text-gray-300' : 'text-gray-400'
            }`} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {config.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{config.description}</p>
            
            {!disabled && (
              <Button variant="outline" disabled={uploading || files.length >= maxFiles}>
                {uploading ? 'Uploading...' : 'Choose File'}
              </Button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              multiple={maxFiles > 1}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
          {files.map((file) => (
            <Card key={file._id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.originalName)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open(file.fileUrl, '_blank');
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (typeof document !== 'undefined') {
                          const link = document.createElement('a');
                          link.href = file.fileUrl;
                          link.download = file.originalName;
                          link.click();
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDelete(file._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Local Files List (for local mode) */}
      {localMode && localFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files</h4>
          {localFiles.map((file, index) => (
            <Card key={`${file.name}-${index}`} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.name)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Ready to upload
                    </Badge>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLocalFileRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Validation Message */}
      {required && (localMode ? localFiles.length === 0 : files.length === 0) && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">This document is required</span>
        </div>
      )}
    </div>
  );
}
