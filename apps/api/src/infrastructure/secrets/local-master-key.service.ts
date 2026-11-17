import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const MASTER_KEY_BYTES = 32;
const DEFAULT_MASTER_KEY_PATH = join(process.cwd(), '.local', 'secret-master-key');

@Injectable()
export class LocalMasterKeyService {
  private cachedKey?: Buffer;

  getKey(): Buffer {
    if (this.cachedKey) {
      return this.cachedKey;
    }

    const keyFromEnv = process.env.SECRET_ENCRYPTION_KEY;
    if (keyFromEnv) {
      this.cachedKey = this.parseKey(keyFromEnv);
      return this.cachedKey;
    }

    const keyPath = process.env.SECRET_MASTER_KEY_FILE || DEFAULT_MASTER_KEY_PATH;
    if (existsSync(keyPath)) {
      const raw = readFileSync(keyPath, 'utf8').trim();
      this.cachedKey = this.parseKey(raw);
      return this.cachedKey;
    }

    const key = randomBytes(MASTER_KEY_BYTES);
    mkdirSync(dirname(keyPath), { recursive: true });
    writeFileSync(keyPath, key.toString('base64'), { mode: 0o600 });
    this.cachedKey = key;
    return key;
  }

  private parseKey(raw: string): Buffer {
    const normalized = raw.trim();
    const key = this.tryDecodeBase64(normalized) || this.tryDecodeHex(normalized) || Buffer.from(normalized, 'utf8');

    if (key.length !== MASTER_KEY_BYTES) {
      throw new Error('SECRET_ENCRYPTION_KEY must decode to 32 bytes for aes-256-gcm');
    }

    return key;
  }

  private tryDecodeBase64(value: string): Buffer | null {
    try {
      const decoded = Buffer.from(value, 'base64');
      return decoded.length === MASTER_KEY_BYTES ? decoded : null;
    } catch {
      return null;
    }
  }

  private tryDecodeHex(value: string): Buffer | null {
    if (!/^[0-9a-fA-F]+$/.test(value)) {
      return null;
    }

    try {
      const decoded = Buffer.from(value, 'hex');
      return decoded.length === MASTER_KEY_BYTES ? decoded : null;
    } catch {
      return null;
    }
  }
}
