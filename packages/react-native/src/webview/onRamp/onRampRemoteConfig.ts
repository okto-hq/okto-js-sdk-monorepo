import { getStorage } from '../../utils/storageUtils.js';
import type { OnrampConfig } from '../onRamp/types.js';

interface ConfigValue {
  stringValue: string;
  booleanValue: boolean;
  numberValue: number;
  jsonValue: Record<string, unknown> | unknown[] | null;
}

type ValueType = 'STRING' | 'BOOLEAN' | 'NUMBER' | 'JSON';

interface RemoteConfigParameter {
  valueType: ValueType;
  defaultValue: {
    value: string | number | boolean | object;
  };
}

interface RemoteConfigData {
  parameters: Record<string, RemoteConfigParameter>;
}

export class OnrampRemoteConfig {
  private static instance: OnrampRemoteConfig | null = null;
  private configValues = new Map<string, ConfigValue>();
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): OnrampRemoteConfig {
    if (!OnrampRemoteConfig.instance) {
      OnrampRemoteConfig.instance = new OnrampRemoteConfig();
    }
    return OnrampRemoteConfig.instance;
  }

  public async getValue(key: string): Promise<ConfigValue> {
    if (!this.isLoaded) {
      await this.loadDefaultConfig();
    }
    return this.configValues.get(key) || this.createConfigValue('', 'STRING');
  }

  public getValueSync(key: string): ConfigValue {
    return this.configValues.get(key) || this.createConfigValue('', 'STRING');
  }

  private async loadDefaultConfig(): Promise<void> {
    try {
      const storedConfig = getStorage('okto_remote_config');
      if (storedConfig) {
        this.parseConfig(JSON.parse(storedConfig) as RemoteConfigData);
      } else {
        this.createDefaultConfig();
      }
    } catch (error) {
      console.error('Error loading config:', error);
      this.createDefaultConfig();
    }
    this.isLoaded = true;
  }

  private createDefaultConfig(): void {
    console.log('Creating default config values...');
    this.configValues.set(
      'on_ramp_enabled',
      this.createConfigValue(true, 'BOOLEAN'),
    );
    this.configValues.set(
      'onramp_theme',
      this.createConfigValue('light', 'STRING'),
    );
    this.configValues.set(
      'onramp_country_code',
      this.createConfigValue('IN', 'STRING'),
    );
    this.configValues.set(
      'onramp_app_version',
      this.createConfigValue('500000', 'STRING'),
    );
    this.configValues.set(
      'onramp_timeout',
      this.createConfigValue(30000, 'NUMBER'),
    );
    this.configValues.set(
      'onramp_max_retries',
      this.createConfigValue(3, 'NUMBER'),
    );
  }

  private parseConfig(configData: RemoteConfigData): void {
    const parameters = configData?.parameters;

    if (!parameters || typeof parameters !== 'object') {
      console.warn("No valid 'parameters' object found in config.");
      this.createDefaultConfig();
      return;
    }

    for (const key in parameters) {
      try {
        const param = parameters[key];
        const valueType = param?.valueType;
        const value = param?.defaultValue?.value;

        if (!valueType || value === undefined) {
          console.warn(`Skipping invalid config entry: ${key}`);
          continue;
        }

        this.configValues.set(key, this.createConfigValue(value, valueType));
      } catch (innerError) {
        console.error(`Error parsing config key '${key}':`, innerError);
      }
    }
  }

  private createConfigValue(
    value: string | number | boolean | object,
    type: ValueType,
  ): ConfigValue {
    const result: ConfigValue = {
      stringValue: '',
      booleanValue: false,
      numberValue: 0,
      jsonValue: null,
    };

    try {
      switch (type.toUpperCase()) {
        case 'STRING':
          result.stringValue = String(value ?? '');
          break;
        case 'BOOLEAN':
          result.booleanValue = Boolean(value);
          result.stringValue = String(result.booleanValue);
          break;
        case 'NUMBER':
          result.numberValue = Number(value) || 0;
          result.stringValue = String(result.numberValue);
          break;
        case 'JSON':
          if (typeof value === 'string') {
            result.jsonValue = JSON.parse(value) as
              | Record<string, unknown>
              | unknown[];
          } else {
            result.jsonValue = value as Record<string, unknown> | unknown[];
          }
          result.stringValue = JSON.stringify(result.jsonValue);
          break;
        default:
          result.stringValue = String(value ?? '');
          break;
      }
    } catch (error) {
      console.error(`Failed to parse value of type ${type}:`, error);
    }

    return result;
  }

  public async getOnrampConfig(): Promise<OnrampConfig> {
    await this.loadDefaultConfig();
    return {
      onRampEnabled: this.getValueSync('on_ramp_enabled').booleanValue,
      theme: this.getValueSync('onramp_theme').stringValue as 'light' | 'dark',
      countryCode: this.getValueSync('onramp_country_code').stringValue,
      appVersion: this.getValueSync('onramp_app_version').stringValue,
      timeout: this.getValueSync('onramp_timeout').numberValue,
      maxRetries: this.getValueSync('onramp_max_retries').numberValue,
    };
  }
}
