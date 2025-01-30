import BffClientRepository from '@/api/bff.js';
import GatewayClientRepository from '@/api/gateway.js';
import { RpcError } from '@/errors/rpc.js';
import type { Hash, Hex, User, UserOp } from '@/types/core.js';
import type { AuthData } from '@/types/index.js';
import { getPublicKey, SessionKey } from '@/utils/sessionKey.js';
import { generatePackedUserOp, generateUserOpHash } from '@/utils/userop.js';
import { fromHex } from 'viem';
import { signMessage } from 'viem/accounts';
import { productionEnvConfig, sandboxEnvConfig } from './config.js';
import { generateAuthenticatePayload } from './login.js';
import { generatePaymasterData } from './paymaster.js';
import type { Env, EnvConfig, SessionConfig, VendorConfig } from './types.js';

export interface OktoClientConfig {
  environment: Env;
  vendorPrivKey: Hash;
  vendorSWA: Hex;
}

class OktoClient {
  private _environment: Env;
  private _user?: User;
  private _vendorConfig: VendorConfig;
  private _sessionConfig: SessionConfig | undefined;
  readonly isDev: boolean = true; //* Mark it as true for development environment

  constructor(config: OktoClientConfig) {
    this._vendorConfig = {
      vendorPrivKey: config.vendorPrivKey,
      vendorPubKey: getPublicKey(config.vendorPrivKey),
      vendorSWA: config.vendorSWA,
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

  /**
   * Logs in the user using OAuth.
   * It generates a session key pair, creates an authenticate payload, and sends it to the Gateway service.
   * If the response is valid, it updates the user session.
   *
   * @param {AuthData} data The authentication data.
   * @returns {Promise<string>} A promise that resolves to the user address.
   */
  public async loginUsingOAuth(
    data: AuthData,
  ): Promise<User | RpcError | undefined> {
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

      // TODO: Update with SessionKey Object
      this._sessionConfig = {
        sessionPrivKey: session.privateKeyHexWith0x,
        sessionPubKey: session.uncompressedPublicKeyHexWith0x,
        userSWA: authRes.userAddress as Hex,
      };

      this._user = {
        ...authRes,
      };

      return this._user;
    } catch (error) {
      //TODO: Return proper error

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
    try {
      await BffClientRepository.verifySession(this);
      return true;
    } catch (error) {
      this._sessionConfig = undefined;
      return false;
    }
  }

  public async getAuthorizationToken() {
    const sessionPriv = this._sessionConfig?.sessionPrivKey;
    const sessionPub = this._sessionConfig?.sessionPubKey;

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

  /**
   * Returns the user information.
   * If the user is not logged in, it returns undefined.
   */
  get user(): User | undefined {
    return this._user;
  }

  get userSWA(): Hex | undefined {
    return this._sessionConfig?.userSWA;
  }

  get vendorSWA(): Hex | undefined {
    return this._vendorConfig.vendorSWA;
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
    return generatePaymasterData(
      this._vendorConfig.vendorSWA,
      this._vendorConfig.vendorPrivKey,
      nonce,
      validUntil,
      validAfter,
    );
  }

  public async executeUserOp(userop: UserOp): Promise<string> {
    try {
      return await GatewayClientRepository.execute(this, userop);
    } catch (error) {
      console.error('Error executing user operation:', error);
      throw error;
    }
  }

  public async signUserOp(userop: UserOp): Promise<UserOp> {
    const privateKey = this._sessionConfig?.sessionPrivKey;

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
}

export default OktoClient;
