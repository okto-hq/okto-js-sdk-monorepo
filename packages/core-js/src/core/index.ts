import Account from '@/account/index.js';
import Auth from '@/auth/index.js';
import Chain from '@/chains/index.js';
import { globalConfig } from '@/config/index.js';
import type { AuthOptions, Env } from '@/config/types.js';
import Token from '@/tokens/index.js';
import UserOperation from '@/userop/index.js';
import { getPublicKey } from '@/utils/sessionKey.js';

class OktoClient {
  private authClient: Auth;
  private accountClient: Account;
  private userOperationClient: UserOperation;
  private chainClient: Chain;
  private tokenClient: Token;

  private sessionPubKey?: string;
  private sessionPrivKey?: string;
  private vendorPubKey: string;
  private vendorPrivKey: string;

  constructor(config: {
    authOptions: AuthOptions;
    environment: Env;
    vendorPrivKey: string;
  }) {
    globalConfig.initialize(config.authOptions, config.environment);

    this.authClient = new Auth(
      this._updateSessionKeyPair,
      this._getVendorPrivateKey,
      this._getVendorPublicKey,
      this._getSessionPrivateKey,
      this._getSessionPublicKey,
    );
    this.accountClient = new Account();
    this.userOperationClient = new UserOperation();
    this.chainClient = new Chain();
    this.tokenClient = new Token();

    this.vendorPrivKey = config.vendorPrivKey;
    this.vendorPubKey = getPublicKey(config.vendorPrivKey);
  }

  private _updateSessionKeyPair = (pub: string, priv: string) => {
    this.sessionPubKey = pub;
    this.sessionPrivKey = priv;
  };

  private get _getVendorPrivateKey() {
    return this.vendorPrivKey;
  }

  private get _getVendorPublicKey() {
    return this.vendorPubKey;
  }

  private get _getSessionPrivateKey() {
    return this.sessionPrivKey;
  }

  private get _getSessionPublicKey() {
    return this.sessionPubKey;
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
