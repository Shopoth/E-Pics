const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class MetadataManager {
  constructor(vaultRoot) {
    this.vaultRoot = vaultRoot;
    this.metadataPath = path.join(vaultRoot, 'metadata.json');
    this.metadata = null;
  }

  async loadMetadata() {
    try {
      if (this.metadata) {
        return this.metadata;
      }
      const data = await fs.readFile(this.metadataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.metadata = {
        files: Array.isArray(parsed.files) ? parsed.files : [],
        passwordHash: typeof parsed.passwordHash === 'string' ? parsed.passwordHash : null
      };
      return this.metadata;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.metadata = { files: [], passwordHash: null };
        return this.metadata;
      }
      if (error.name === 'SyntaxError') {
        console.warn('Corrupt metadata.json detected, resetting vault metadata:', error.message);
        await this.recoverCorruptMetadata();
        return this.metadata;
      }
      throw error;
    }
  }

  async recoverCorruptMetadata() {
    try {
      const backupPath = `${this.metadataPath}.bak`;
      await fs.rename(this.metadataPath, backupPath);
      console.warn(`Corrupt metadata backed up to ${backupPath}`);
    } catch (renameError) {
      console.warn('Unable to backup corrupt metadata file:', renameError.message);
    }
    this.metadata = { files: [], passwordHash: null };
    await this.saveMetadata();
  }

  async saveMetadata() {
    if (!this.metadata) {
      this.metadata = { files: [], passwordHash: null };
    }
    await fs.writeFile(
      this.metadataPath,
      JSON.stringify(this.metadata, null, 2),
      'utf8'
    );
  }

  addFile(fileEntry) {
    if (!this.metadata) {
      this.metadata = { files: [], passwordHash: null };
    }
    fileEntry.id = uuidv4();
    fileEntry.dateAdded = new Date().toISOString();
    fileEntry.isFavorite = false;
    fileEntry.tags = [];
    this.metadata.files.push(fileEntry);
    return fileEntry;
  }

  async removeFile(storedName) {
    if (!this.metadata) {
      await this.loadMetadata();
    }
    this.metadata.files = this.metadata.files.filter(f => f.storedName !== storedName);
  }

  async toggleFavorite(fileId) {
    if (!this.metadata) {
      await this.loadMetadata();
    }
    const file = this.metadata.files.find(f => f.id === fileId);
    if (file) {
      file.isFavorite = !file.isFavorite;
    }
  }

  async addTag(fileId, tag) {
    if (!this.metadata) {
      await this.loadMetadata();
    }
    const file = this.metadata.files.find(f => f.id === fileId);
    if (file && !file.tags.includes(tag)) {
      file.tags.push(tag);
    }
  }

  async removeTag(fileId, tag) {
    if (!this.metadata) {
      await this.loadMetadata();
    }
    const file = this.metadata.files.find(f => f.id === fileId);
    if (file) {
      file.tags = file.tags.filter(t => t !== tag);
    }
  }

  setPasswordHash(hash) {
    if (!this.metadata) {
      this.metadata = { files: [], passwordHash: null };
    }
    this.metadata.passwordHash = hash;
  }

  getPasswordHash() {
    if (!this.metadata) {
      return null;
    }
    return this.metadata.passwordHash;
  }
}

module.exports = MetadataManager;
