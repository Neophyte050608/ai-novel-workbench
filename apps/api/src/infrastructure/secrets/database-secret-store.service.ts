import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LocalMasterKeyService } from './local-master-key.service';
import { SecretStore } from './secret-store.interface';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

type SecretCredentialClient = Pick<PrismaService | Prisma.TransactionClient, 'secretCredential'>;

@Injectable()
export class DatabaseSecretStore implements SecretStore {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masterKey: LocalMasterKeyService,
  ) {}

  async setSecret(ref: string, value: string): Promise<void> {
    await this.setSecretWithClient(this.prisma, ref, value);
  }

  async setSecretWithClient(client: SecretCredentialClient, ref: string, value: string): Promise<void> {
    this.assertValidRef(ref);

    const encrypted = this.encrypt(value);
    await client.secretCredential.upsert({
      where: { ref },
      create: {
        ref,
        encryptedValue: encrypted.encryptedValue,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        algorithm: ALGORITHM,
      },
      update: {
        encryptedValue: encrypted.encryptedValue,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        algorithm: ALGORITHM,
      },
    });
  }

  async getSecret(ref: string): Promise<string | null> {
    this.assertValidRef(ref);

    const credential = await this.prisma.secretCredential.findUnique({ where: { ref } });
    if (!credential) {
      return null;
    }

    if (credential.algorithm !== ALGORITHM) {
      throw new Error(`Unsupported secret algorithm: ${credential.algorithm}`);
    }

    if (!credential.authTag) {
      throw new Error('Secret credential is missing auth tag');
    }

    return this.decrypt({
      encryptedValue: credential.encryptedValue,
      iv: credential.iv,
      authTag: credential.authTag,
    });
  }

  async deleteSecret(ref: string): Promise<void> {
    await this.deleteSecretWithClient(this.prisma, ref);
  }

  async deleteSecretWithClient(client: SecretCredentialClient, ref: string): Promise<void> {
    this.assertValidRef(ref);
    await client.secretCredential.deleteMany({ where: { ref } });
  }

  async hasSecret(ref: string): Promise<boolean> {
    this.assertValidRef(ref);

    const count = await this.prisma.secretCredential.count({ where: { ref } });
    return count > 0;
  }

  private encrypt(value: string) {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.masterKey.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedValue: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  private decrypt(value: { encryptedValue: string; iv: string; authTag: string }) {
    const decipher = createDecipheriv(ALGORITHM, this.masterKey.getKey(), Buffer.from(value.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(value.authTag, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(value.encryptedValue, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private assertValidRef(ref: string): void {
    if (!ref || ref.trim().length === 0) {
      throw new Error('Secret ref must not be empty');
    }
  }
}
