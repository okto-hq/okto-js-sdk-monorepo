import type { AuthOptions, Env, EnvConfig } from './types.js';

/**
 * The GlobalConfig class is responsible for managing the global configuration
 * of the application, including authentication options and environment settings.
 * It ensures that the configuration is initialized only once and provides methods
 * to update the user session key and retrieve configuration details.
 */
class GlobalConfig {
  private _authOptions?: AuthOptions;
  private _environment?: Env;
  private _initialized = false;

  private readonly sandboxEnv: EnvConfig = {
    gatewayBaseUrl: 'https://okto-gateway.oktostage.com',
    bffBaseUrl: 'https://apigw.oktostage.com',
  };

  private readonly productionEnv: EnvConfig = {
    gatewayBaseUrl: 'https://okto-gateway.okto.tech',
    bffBaseUrl: 'https://apigw.okto.tech',
  };

  /**
   * Initializes the GlobalConfig with authentication options and environment settings.
   * This method should be called only once at the beginning of the application.
   *
   * @param authOptions - The authentication options to be set.
   * @param environment - The environment to be set.
   * @throws Error if the GlobalConfig is already initialized.
   *
   * @example
   * ```typescript
   * globalConfig.initialize(authOptions, 'sandbox');
   * ```
   */
  initialize(authOptions: AuthOptions, environment: Env) {
    if (this._initialized) {
      throw new Error('GlobalConfig already initialized');
    }

    this._authOptions = authOptions;
    this._environment = environment;
    this._initialized = true;
  }

  /**
   * Updates the user session key in the authentication options.
   * This method should be called whenever the user session key changes.
   *
   * @param userSessionKey - The user session key to be set.
   * @throws Error if the GlobalConfig is not initialized.
   */
  updateUserSessionKey(userSessionKey: string) {
    if (!this._authOptions) {
      throw new Error('GlobalConfig not initialized');
    }
    this._authOptions.userSessionKey = userSessionKey;
  }

  /**
   * Retrieves the authentication options.
   *
   * @throws Error if the GlobalConfig is not initialized.
   */
  get authOptions(): AuthOptions {
    if (!this._authOptions) {
      throw new Error('GlobalConfig not initialized');
    }
    return this._authOptions;
  }

  /**
   * Retrieves the initialization status of the GlobalConfig.
   *
   * @throws Error if the GlobalConfig is not initialized.
   */
  get initialized(): boolean {
    return this._initialized;
  }

  //TODO(sparsh.a): This should be dynamically generated
  get version(): string {
    return 'core_js_0.0.0';
  }

  /**
   * Retrieves the environment configuration based on the current environment.
   *
   * @throws Error if the GlobalConfig is not initialized.
   */
  get env(): EnvConfig {
    if (!this._environment) {
      throw new Error('GlobalConfig Not Initialized');
    }
    switch (this._environment) {
      case 'sandbox':
        return this.sandboxEnv;
      case 'production':
        return this.productionEnv;
      default:
        return this.productionEnv;
    }
  }
}

export const globalConfig = new GlobalConfig();
