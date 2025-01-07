import Account from '@/account/index.js';
import Auth from '@/auth/index.js';
import Chain from '@/chains/index.js';
import { globalConfig } from '@/config/index.js';
import type { Env } from '@/config/types.js';
import Token from '@/tokens/index.js';
import UserOperation from '@/userop/index.js';

class OktoClient {
  private authClient: Auth;
  private accountClient: Account;
  private userOperationClient: UserOperation;
  private chainClient: Chain;
  private tokenClient: Token;

  constructor(config: { environment: Env; vendorPrivKey: string }) {
    globalConfig.initialize(config.environment, config.vendorPrivKey);

    this.authClient = new Auth();
    this.accountClient = new Account();
    this.userOperationClient = new UserOperation();
    this.chainClient = new Chain();
    this.tokenClient = new Token();
  }

  get auth() {
    return this.authClient;
  }

  get account() {
    return this.accountClient;
  }

  get userOperation() {
    return this.userOperationClient;
  }

  get chain() {
    return this.chainClient;
  }

  get token() {
    return this.tokenClient;
  }
}

export default OktoClient;
