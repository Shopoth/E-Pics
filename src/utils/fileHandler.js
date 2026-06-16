const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const MetadataManager = require('./metadataManager');

class FileHandler {
  constructor(vaultRoot, metadataManager = null) {
    this.vaultRoot = vaultRoot;
    this.metadataManager = metadataManager || new MetadataManager(vaultRoot);
    this.supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'mkv', 'avi', 'mov', 'webm'];
    this.imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    this.videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'webm'];
    this.mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'mp4': 'video/mp4',
      'mkv': 'video/x-matroska',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'webm': 'video/webm'
    };
  }

  async ensureVaultExists() {
    try {
      await fs.mkdir(this.vaultRoot, { recursive: true });
      await this.metadataManager.loadMetadata();
      await this.metadataManager.saveMetadata();
    } catch (error) {
      console.error('Failed to ensure vault exists:', error);
      throw error;
    }
  }

  generateHashedFilename() {
    const randomHash = crypto.randomBytes(4).toString('hex');
    const randomSuffix = crypto.randomBytes(2).toString('hex').slice(0, 2);
    return `${randomHash}.${randomSuffix}`;
  }

  getFileType(extension) {
    const ext = extension.toLowerCase().replace('.', '');
    if (this.imageExtensions.includes(ext)) {
      return 'image';
    } else if (this.videoExtensions.includes(ext)) {
      return 'video';
    }
    return 'unknown';
  }

  getMimeType(fileEntry) {
    const ext = fileEntry.originalExtension.toLowerCase().replace('.', '');
    return this.mimeTypes[ext] || 'application/octet-stream';
  }

  async importFiles(filePaths) {
    const results = [];
    await this.metadataManager.loadMetadata();

    for (const filePath of filePaths) {
      try {
        const filename = path.basename(filePath);
        const extension = path.extname(filename);
        const ext = extension.toLowerCase().replace('.', '');

        if (!this.supportedExtensions.includes(ext)) {
          results.push({
            status: 'error',
            name: filename,
            error: 'Unsupported file type'
          });
          continue;
        }

        const hashedName = this.generateHashedFilename();
        const destPath = path.join(this.vaultRoot, hashedName);

        // Copy file to vault
        await fs.copyFile(filePath, destPath);

        // Add to metadata
        const fileEntry = this.metadataManager.addFile({
          originalName: filename,
          originalExtension: extension,
          storedName: hashedName,
          type: this.getFileType(extension)
        });

        results.push({
          status: 'success',
          id: fileEntry.id,
          name: filename,
          storedName: hashedName
        });
      } catch (error) {
        results.push({
          status: 'error',
          name: path.basename(filePath),
          error: error.message
        });
      }
    }

    await this.metadataManager.saveMetadata();
    return results;
  }

  async deleteFile(storedName) {
    try {
      const filePath = path.join(this.vaultRoot, storedName);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async getFile(storedName) {
    const filePath = path.join(this.vaultRoot, storedName);
    return fs.readFile(filePath);
  }

  async getFileThumbnail(storedName) {
    // For now, return the same as getFile. In a production app, you'd generate actual thumbnails
    return this.getFile(storedName);
  }

  async exportFile(storedName, destPath) {
    try {
      const sourcePath = path.join(this.vaultRoot, storedName);
      await this.metadataManager.loadMetadata();
      const fileEntry = this.metadataManager.metadata.files.find(f => f.storedName === storedName);

      if (!fileEntry) {
        throw new Error('File not found in metadata');
      }

      // Restore original filename with extension
      const finalPath = destPath.endsWith(fileEntry.originalExtension) 
        ? destPath 
        : destPath + fileEntry.originalExtension;

      await fs.copyFile(sourcePath, finalPath);
    } catch (error) {
      console.error('Failed to export file:', error);
      throw error;
    }
  }
}

module.exports = FileHandler;
