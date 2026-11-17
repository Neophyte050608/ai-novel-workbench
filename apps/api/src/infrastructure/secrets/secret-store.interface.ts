export const SECRET_STORE = Symbol('SECRET_STORE');

export interface SecretStore {
  setSecret(ref: string, value: string): Promise<void>;
  getSecret(ref: string): Promise<string | null>;
  deleteSecret(ref: string): Promise<void>;
  hasSecret(ref: string): Promise<boolean>;
}
