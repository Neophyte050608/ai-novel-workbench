import { Global, Module } from '@nestjs/common';
import { DatabaseSecretStore } from './database-secret-store.service';
import { LocalMasterKeyService } from './local-master-key.service';
import { SECRET_STORE } from './secret-store.interface';

@Global()
@Module({
  providers: [
    LocalMasterKeyService,
    DatabaseSecretStore,
    {
      provide: SECRET_STORE,
      useExisting: DatabaseSecretStore,
    },
  ],
  exports: [SECRET_STORE, DatabaseSecretStore, LocalMasterKeyService],
})
export class SecretsModule {}
