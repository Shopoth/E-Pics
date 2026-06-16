const bcrypt = require('bcrypt');

class PasswordManager {
  constructor(metadataManager) {
    this.metadataManager = metadataManager;
    this.saltRounds = 10;
  }

  async setPassword(password) {
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }
    await this.metadataManager.loadMetadata();
    const hash = await bcrypt.hash(password, this.saltRounds);
    this.metadataManager.setPasswordHash(hash);
    await this.metadataManager.saveMetadata();
  }

  async verifyPassword(password) {
    await this.metadataManager.loadMetadata();
    const hash = this.metadataManager.getPasswordHash();
    if (!hash) {
      throw new Error('No password set');
    }
    return bcrypt.compare(password, hash);
  }

  async hasPassword() {
    await this.metadataManager.loadMetadata();
    const hash = this.metadataManager.getPasswordHash();
    return !!hash;
  }
}

module.exports = PasswordManager;
