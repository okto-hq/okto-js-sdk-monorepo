import BffClientRepository from '@/api/bff.js';
import GatewayClientRepository from '@/api/gateway.js';
import { RpcError } from '@/errors/rpc.js';
import type { Address, Hash, Hex, UserOp } from '@/types/core.js';
import type { AuthData } from '@/types/index.js';
import { getPublicKey, SessionKey } from '@/utils/sessionKey.js';
import { generatePackedUserOp, generateUserOpHash } from '@/utils/userop.js';
import { BaseError, fromHex } from 'viem';
import { signMessage } from 'viem/accounts';
import { productionEnvConfig, sandboxEnvConfig } from './config.js';
import { generateAuthenticatePayload } from './login.js';
import {
  validateAuthData,
  validateOktoClientConfig,
  validateUserOp,
} from './oktoClientInputValidator.js';
import { generatePaymasterData } from './paymaster.js';
import type { ClientConfig, Env, EnvConfig, SessionConfig } from './types.js';

export interface OktoClientConfig {
  environment: Env;
  clientPrivateKey: Hash;
  clientSWA: Hex;
}

class OktoClient {
  private _environment: Env;
  private _clientConfig: ClientConfig;
  private _sessionConfig: SessionConfig | undefined;
  readonly isDev: boolean = true; //* Mark it as true for development environment

  constructor(config: OktoClientConfig) {
    validateOktoClientConfig(config);

    this._clientConfig = {
      clientPrivKey: config.clientPrivateKey,
      clientPubKey: getPublicKey(config.clientPrivateKey),
      clientSWA: config.clientSWA,
    };
    this._environment = config.environment;
  }

  get env(): EnvConfig {
    switch (this._environment) {
      case 'sandbox':
        return sandboxEnvConfig;
      case 'production':
        return productionEnvConfig;
      default:
        return productionEnvConfig;
    }
  }

  protected setSessionConfig(sessionConfig: SessionConfig): void {
    this._sessionConfig = sessionConfig;
  }

  /**
   * Logs in a user using OAuth authentication.
   * @param data - Authentication data.
   * @param onSuccess - Callback function executed on successful login.
   */
  public async loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
    overrideSessionConfig?: SessionConfig | undefined,
  ): Promise<Address | RpcError | undefined> {
    validateAuthData(data);

    const clientPrivateKey = this._clientConfig.clientPrivKey;
    const clientSWA = this._clientConfig.clientSWA;
    const session = SessionKey.create();

    if (!clientPrivateKey || !clientSWA) {
      throw new Error('Client details not found');
    }

    const authPayload = await generateAuthenticatePayload(
      this,
      data,
      session,
      clientSWA,
      clientPrivateKey,
    );

    try {
      const authRes = await GatewayClientRepository.authenticate(
        this,
        authPayload,
      );

      // TODO: Update with SessionKey Object
      this._sessionConfig = {
        sessionPrivKey: session.privateKeyHexWith0x,
        sessionPubKey: session.uncompressedPublicKeyHexWith0x,
        userSWA: authRes.userAddress as Hex,
      };

      onSuccess?.(this._sessionConfig);

      if (overrideSessionConfig) {
        this._sessionConfig = overrideSessionConfig;
      }

      return this.userSWA;
    } catch (error) {
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  /**
   * Verifies if the user is logged in.
   * If user is not logged in, it clears the auth options.
   *
   * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating if the user is logged in.
   */
  public async verifyLogin(): Promise<boolean> {
    //TODO: change the implementation not supported from backend
    try {
      const res = await BffClientRepository.verifySession(this);
      if (
        res.clientSWA == this._clientConfig.clientSWA &&
        res.userSWA == this._sessionConfig?.userSWA
      ) {
        return true;
      }
      throw new BaseError('Session verification failed');
    } catch (error) {
      console.error('Error verifying login:', error);
      this._sessionConfig = undefined;
      return false;
    }
  }

  public async getAuthorizationToken() {
    const sessionPriv = this._sessionConfig?.sessionPrivKey;
    const sessionPub = this._sessionConfig?.sessionPubKey;

    if (sessionPriv === undefined || sessionPub === undefined) {
      throw new BaseError('Session keys are not set');
    }

    const data = {
      expire_at: Math.round(Date.now() / 1000) + 60 * 90,
      session_pub_key: sessionPub,
    };

    const payload = {
      type: 'ecdsa_uncompressed',
      data: data,
      data_signature: await signMessage({
        message: JSON.stringify(data),
        privateKey: sessionPriv,
      }),
    };

    return btoa(JSON.stringify(payload));
  }

  get userSWA(): Hex | undefined {
    if (!this._sessionConfig?.userSWA) {
      throw new BaseError('User is not logged in');
    }
    return this._sessionConfig.userSWA;
  }

  get clientSWA(): Hex | undefined {
    return this._clientConfig.clientSWA;
  }

  public paymasterData({
    nonce,
    validUntil,
    validAfter,
  }: {
    nonce: string;
    validUntil: Date | number | bigint;
    validAfter?: Date | number | bigint;
  }) {
    if (!this.isLoggedIn())
      throw new BaseError('User must be logged in to generate paymaster data');
    return generatePaymasterData(
      this._clientConfig.clientSWA,
      this._clientConfig.clientPrivKey,
      nonce,
      validUntil,
      validAfter,
    );
  }

  public async executeUserOp(userop: UserOp): Promise<string> {
    if (!this.isLoggedIn()) {
      throw new BaseError('User must be logged in to execute user operation');
    }
    validateUserOp(userop);
    try {
      return await GatewayClientRepository.execute(this, userop);
    } catch (error) {
      console.error('Error executing user operation:', error);
      throw error;
    }
  }

  public async signUserOp(userop: UserOp): Promise<UserOp> {
    if (!this.isLoggedIn()) {
      throw new BaseError('User must be logged in to sign user operation');
    }
    validateUserOp(userop);
    const privateKey = this._sessionConfig?.sessionPrivKey;

    if (privateKey === undefined) {
      throw new BaseError('Session keys are not set');
    }

    const packeduserop = generatePackedUserOp(userop);
    const hash = generateUserOpHash(this, packeduserop);
    const sig = await signMessage({
      message: {
        raw: fromHex(hash, 'bytes'),
      },
      privateKey: privateKey,
    });

    userop.signature = sig;

    return userop;
  }

  public isLoggedIn(): boolean {
    return this._sessionConfig !== undefined;
  }

  public sessionClear(): void {
    this._sessionConfig = undefined;
  }
}

export default OktoClient;
export type { SessionConfig } from './types.js';
