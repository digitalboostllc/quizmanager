import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigurationService } from '../config/ConfigurationService';
import { FeatureFlagService } from '../config/FeatureFlagService';
import { LoggingService } from '../logging/LoggingService';

/**
 * Supported storage providers
 */
export enum StorageProvider {
    LOCAL = 'local',
    S3 = 's3',
    AZURE = 'azure',
    GOOGLE = 'google',
}

/**
 * File metadata
 */
export interface FileMetadata {
    id: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    path: string;
    url: string;
    userId?: string;
    createdAt: Date;
    tags?: string[];
    bucket?: string;
    isPublic: boolean;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
    filename?: string;
    mimeType?: string;
    userId?: string;
    tags?: string[];
    isPublic?: boolean;
    bucket?: string;
}

/**
 * Centralized file storage service for managing file uploads and storage
 */
export class FileStorageService {
    private static instance: FileStorageService;
    private logger: LoggingService;
    private config: ConfigurationService;
    private featureFlags: FeatureFlagService;

    // Default storage provider
    private provider: StorageProvider;

    // Base directories for local storage
    private baseUploadDir: string;
    private basePublicDir: string;

    // Base URL for public files
    private baseUrl: string;

    // In-memory file registry (in a real app, this would be in a database)
    private fileRegistry: Map<string, FileMetadata> = new Map();

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.config = ConfigurationService.getInstance();
        this.featureFlags = FeatureFlagService.getInstance();

        // Set provider based on config
        this.provider = this.getProviderFromConfig();

        // Set base directories
        this.baseUploadDir = this.config.getString('FILE_UPLOAD_DIR', './uploads');
        this.basePublicDir = this.config.getString('FILE_PUBLIC_DIR', './public/uploads');

        // Set base URL for public files
        this.baseUrl = this.config.getString('FILE_BASE_URL', '/uploads');

        // Initialize storage
        this.initializeStorage();
    }

    public static getInstance(): FileStorageService {
        if (!FileStorageService.instance) {
            FileStorageService.instance = new FileStorageService();
        }
        return FileStorageService.instance;
    }

    /**
     * Upload a file to storage
     * @param buffer The file buffer
     * @param options Upload options
     * @returns The file metadata
     */
    public async uploadFile(
        buffer: Buffer,
        options: FileUploadOptions
    ): Promise<FileMetadata> {
        const {
            filename = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            mimeType = 'application/octet-stream',
            userId,
            tags = [],
            isPublic = false,
            bucket = 'default',
        } = options;

        try {
            // Generate a unique ID for the file
            const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            // Get the file path
            const filePath = this.getFilePath(fileId, bucket, isPublic);

            // Ensure the directory exists
            await this.ensureDirectoryExists(filePath);

            // Write the file
            await fs.writeFile(filePath, buffer);

            // Generate URL for the file
            const url = isPublic
                ? `${this.baseUrl}/${bucket}/${fileId}-${filename}`
                : '';

            // Create file metadata
            const metadata: FileMetadata = {
                id: fileId,
                filename: `${fileId}-${filename}`,
                originalFilename: filename,
                mimeType,
                size: buffer.length,
                path: filePath,
                url,
                userId,
                createdAt: new Date(),
                tags,
                bucket,
                isPublic,
            };

            // Store in registry
            this.fileRegistry.set(fileId, metadata);

            this.logger.info(
                `Uploaded file ${metadata.filename} (${metadata.size} bytes)`,
                'FileStorageService'
            );

            return metadata;
        } catch (error) {
            this.logger.error('Error uploading file', 'FileStorageService', error);
            throw new Error('Failed to upload file');
        }
    }

    /**
     * Upload a file from a FormData entry
     * @param formData The form data containing the file
     * @param fileKey The key of the file in the form data
     * @param options Upload options
     * @returns The file metadata or null if file not found in formData
     */
    public async uploadFromFormData(
        formData: FormData,
        fileKey: string,
        options: Omit<FileUploadOptions, 'filename' | 'mimeType'> = {}
    ): Promise<FileMetadata | null> {
        const file = formData.get(fileKey) as File | null;

        if (!file) {
            this.logger.warn(`No file found in formData with key ${fileKey}`, 'FileStorageService');
            return null;
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        return this.uploadFile(buffer, {
            ...options,
            filename: file.name,
            mimeType: file.type || undefined,
        });
    }

    /**
     * Get a file by ID
     * @param fileId The file ID
     * @returns The file metadata or null if not found
     */
    public async getFile(fileId: string): Promise<FileMetadata | null> {
        const metadata = this.fileRegistry.get(fileId);

        if (!metadata) {
            return null;
        }

        // Verify the file still exists
        try {
            await fs.access(metadata.path);
            return metadata;
        } catch (error) {
            this.logger.warn(
                `File ${fileId} exists in registry but not on disk`,
                'FileStorageService'
            );
            return null;
        }
    }

    /**
     * Get a file buffer by ID
     * @param fileId The file ID
     * @returns The file buffer or null if not found
     */
    public async getFileBuffer(fileId: string): Promise<Buffer | null> {
        const metadata = await this.getFile(fileId);

        if (!metadata) {
            return null;
        }

        try {
            return await fs.readFile(metadata.path);
        } catch (error) {
            this.logger.error(
                `Error reading file ${fileId}`,
                'FileStorageService',
                error
            );
            return null;
        }
    }

    /**
     * Delete a file by ID
     * @param fileId The file ID
     * @param userId Optional user ID for verification
     * @returns True if the file was deleted, false otherwise
     */
    public async deleteFile(fileId: string, userId?: string): Promise<boolean> {
        const metadata = this.fileRegistry.get(fileId);

        if (!metadata) {
            return false;
        }

        // If userId is provided, verify it matches
        if (userId && metadata.userId && metadata.userId !== userId) {
            this.logger.warn(
                `User ${userId} attempted to delete file ${fileId} owned by ${metadata.userId}`,
                'FileStorageService'
            );
            return false;
        }

        try {
            // Delete the file
            await fs.unlink(metadata.path);

            // Remove from registry
            this.fileRegistry.delete(fileId);

            this.logger.info(`Deleted file ${fileId}`, 'FileStorageService');

            return true;
        } catch (error) {
            this.logger.error(
                `Error deleting file ${fileId}`,
                'FileStorageService',
                error
            );
            return false;
        }
    }

    /**
     * List files for a user
     * @param userId The user ID
     * @param options Filter options
     * @returns Array of file metadata
     */
    public listUserFiles(
        userId: string,
        options: { bucket?: string; tags?: string[]; limit?: number } = {}
    ): FileMetadata[] {
        const { bucket, tags, limit } = options;

        let userFiles = Array.from(this.fileRegistry.values()).filter((file) => {
            let matches = file.userId === userId;

            if (bucket) {
                matches = matches && file.bucket === bucket;
            }

            if (tags && tags.length > 0) {
                matches = matches && tags.some((tag) => file.tags?.includes(tag));
            }

            return matches;
        });

        // Sort by creation date (newest first)
        userFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Apply limit if specified
        if (limit && limit > 0) {
            userFiles = userFiles.slice(0, limit);
        }

        return userFiles;
    }

    /**
     * Get the storage provider from configuration
     * @returns The storage provider
     */
    private getProviderFromConfig(): StorageProvider {
        const providerName = this.config.getString('STORAGE_PROVIDER', 'local').toLowerCase();

        switch (providerName) {
            case 's3':
                return StorageProvider.S3;
            case 'azure':
                return StorageProvider.AZURE;
            case 'google':
                return StorageProvider.GOOGLE;
            default:
                return StorageProvider.LOCAL;
        }
    }

    /**
     * Initialize the storage system
     */
    private async initializeStorage(): Promise<void> {
        try {
            // Ensure base directories exist
            await this.ensureDirectoryExists(this.baseUploadDir);
            await this.ensureDirectoryExists(this.basePublicDir);

            this.logger.info(
                `Initialized file storage with provider: ${this.provider}`,
                'FileStorageService'
            );
        } catch (error) {
            this.logger.error(
                'Failed to initialize file storage',
                'FileStorageService',
                error
            );
        }
    }

    /**
     * Get the file path for a file
     * @param fileId The file ID
     * @param bucket The bucket
     * @param isPublic Whether the file is public
     * @returns The file path
     */
    private getFilePath(fileId: string, bucket: string, isPublic: boolean): string {
        const baseDir = isPublic ? this.basePublicDir : this.baseUploadDir;
        return join(baseDir, bucket, fileId);
    }

    /**
     * Ensure a directory exists
     * @param directory The directory path
     */
    private async ensureDirectoryExists(directory: string): Promise<void> {
        try {
            await fs.access(directory);
        } catch (error) {
            // Directory doesn't exist, create it
            await fs.mkdir(directory, { recursive: true });
        }
    }
} 