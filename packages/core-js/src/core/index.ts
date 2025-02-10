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
import type { Env, EnvConfig, SessionConfig, VendorConfig } from './types.js';

/**
 * Configuration interface for initializing OktoClient
 */
export interface OktoClientConfig {
  environment: Env;
  vendorPrivKey: Hash;
  vendorSWA: Hex;
}

/**
 * OktoClient - Handles authentication, session management, and user operations.
 */
class OktoClient {
  private _environment: Env;
  private _vendorConfig: VendorConfig;
  private _sessionConfig: SessionConfig | undefined;
  readonly isDev: boolean = true; //* Mark it as true for development environment

  constructor(config: OktoClientConfig) {
    validateOktoClientConfig(config);

    this._vendorConfig = {
      vendorPrivKey: config.vendorPrivKey,
      vendorPubKey: getPublicKey(config.vendorPrivKey),
      vendorSWA: config.vendorSWA,
    };

    this._environment = config.environment;
  }

  /**
   * Returns the environment configuration based on the selected environment.
   */
  get env(): EnvConfig {
    return this._environment === 'sandbox'
      ? sandboxEnvConfig
      : productionEnvConfig;
  }

  /**
   * Retrieves the current session configuration.
   */
  public getSessionConfig(): SessionConfig | undefined {
    return this._sessionConfig;
  }

  /**
   * Logs in a user using OAuth authentication.
   * @param data - Authentication data.
   * @param onSuccess - Callback function executed on successful login.
   */
  public async loginUsingOAuth(
    data: AuthData,
    onSuccess?: (session: SessionConfig) => void,
  ): Promise<Address | RpcError | undefined> {
    validateAuthData(data);

    const vendorPrivateKey = this._vendorConfig.vendorPrivKey;
    const vendorSWA = this._vendorConfig.vendorSWA;
    const session = SessionKey.create();

    if (!vendorPrivateKey || !vendorSWA) {
      throw new Error('Vendor details not found');
    }

    const authPayload = await generateAuthenticatePayload(
      this,
      data,
      session,
      vendorSWA,
      vendorPrivateKey,
    );

    try {
      const authRes = await GatewayClientRepository.authenticate(
        this,
        authPayload,
      );

      this._sessionConfig = {
        sessionPrivKey: session.privateKeyHexWith0x,
        sessionPubKey: session.uncompressedPublicKeyHexWith0x,
        userSWA: authRes.userAddress as Hex,
      };

      onSuccess?.(this._sessionConfig);

      return this.userSWA;
    } catch (error) {
      if (error instanceof RpcError) {
        return error;
      }
      throw error;
    }
  }

  /**
   * Verifies if the current session is valid.
   */
  public async verifyLogin(): Promise<boolean> {
    try {
      const res = await BffClientRepository.verifySession(this);
      const currentSession = this.getSessionConfig();
      if (
        res.vendorSwa == this._vendorConfig.vendorSWA &&
        res.userSwa == currentSession?.userSWA
      ) {
        return true;
      }
      throw new Error('Session verification failed');
    } catch (error) {
      console.error('Error verifying login:', error);
      this._sessionConfig = undefined;
      return false;
    }
  }

  /**
   * Generates an authorization token for the current session.
   */
  public async getAuthorizationToken() {
    const currentSession = this.getSessionConfig();
    const sessionPriv = currentSession?.sessionPrivKey;
    const sessionPub = currentSession?.sessionPubKey;

    if (sessionPriv === undefined || sessionPub === undefined) {
      throw new Error('Session keys are not set');
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
    return this._sessionConfig?.userSWA;
  }

  get vendorSWA(): Hex | undefined {
    return this._vendorConfig.vendorSWA;
  }

  /**
   * Generates paymaster data for transactions.
   */
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
      this._vendorConfig.vendorSWA,
      this._vendorConfig.vendorPrivKey,
      nonce,
      validUntil,
      validAfter,
    );
  }

  /**
   * Executes a user operation.
   */
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

  /**
   * Signs a user operation with the session's private key.
   */
  public async signUserOp(userop: UserOp): Promise<UserOp> {
    if (!this.isLoggedIn()) {
      throw new BaseError('User must be logged in to sign user operation');
    }
    validateUserOp(userop);
    const currentSession = this.getSessionConfig();
    const privateKey = currentSession?.sessionPrivKey;

    if (privateKey === undefined) {
      throw new Error('Session keys are not set');
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

  /**
   * Checks if a user is logged in.
   */
  public isLoggedIn(): boolean {
    return Boolean(this._sessionConfig);
  }

  /**
   * Clears the current session.
   */
  public sessionClear(): void {
    this._sessionConfig = undefined;
  }
}

export default OktoClient;
export type { SessionConfig } from './types.js';
