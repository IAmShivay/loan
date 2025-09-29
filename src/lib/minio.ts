import { Client } from 'minio';

// MinIO client configuration
const endPoint = process.env.MINIO_ENDPOINT!.replace('https://', '').replace('http://', '');
const minioClient = new Client({
  endPoint: endPoint,
  port: parseInt(process.env.MINIO_PORT || '443'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!
});

const bucketName = process.env.MINIO_BUCKET_NAME!;
const publicUrl = process.env.MINIO_ENDPOINT!;

export interface UploadOptions {
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  fileName: string;
  fileUrl: string;
  etag: string;
}

/**
 * Upload file to MinIO bucket
 */
export async function uploadToMinio(options: UploadOptions): Promise<UploadResult> {
  const { fileName, fileBuffer, contentType, metadata = {} } = options;

  try {
    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
      console.log(`Bucket ${bucketName} created successfully`);
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Upload file
    const uploadResult = await minioClient.putObject(
      bucketName,
      uniqueFileName,
      fileBuffer,
      fileBuffer.length,
      {
        'Content-Type': contentType,
        ...metadata
      }
    );

    // Construct public URL
    const fileUrl = `${publicUrl}/${bucketName}/${uniqueFileName}`;

    return {
      fileName: uniqueFileName,
      fileUrl,
      etag: uploadResult.etag
    };
  } catch (error) {
    console.error('MinIO upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from MinIO bucket
 */
export async function deleteFromMinio(fileName: string): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, fileName);
    console.log(`File ${fileName} deleted successfully from MinIO`);
  } catch (error) {
    console.error('MinIO delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get file download URL (pre-signed URL for private files)
 */
export async function getDownloadUrl(fileName: string, expirySeconds: number = 3600): Promise<string> {
  try {
    const url = await minioClient.presignedGetObject(bucketName, fileName, expirySeconds);
    return url;
  } catch (error) {
    console.error('MinIO presigned URL error:', error);
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List files in bucket
 */
export async function listFiles(prefix?: string): Promise<string[]> {
  try {
    const files: string[] = [];
    const stream = minioClient.listObjects(bucketName, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          files.push(obj.name);
        }
      });

      stream.on('end', () => {
        resolve(files);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('MinIO list files error:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file exists
 */
export async function fileExists(fileName: string): Promise<boolean> {
  try {
    await minioClient.statObject(bucketName, fileName);
    return true;
  } catch (error) {
    return false;
  }
}

export { minioClient, bucketName, publicUrl };