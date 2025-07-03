import { logger } from '../../utils/logger.js';
import { OKTO_REMOTE_CONFIG } from './localConfig.js';
import type { OnrampConfig } from './types.js';

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

const DEFAULT_CONFIG: Record<
  string,
  { value: string | number | boolean | object; type: ValueType }
> = {
  on_ramp_enabled: { value: true, type: 'BOOLEAN' },
  onramp_theme: { value: 'light', type: 'STRING' },
  onramp_country_code: { value: 'IN', type: 'STRING' },
  onramp_app_version: { value: '500000', type: 'STRING' },
  onramp_timeout: { value: 30000, type: 'NUMBER' },
  onramp_max_retries: { value: 3, type: 'NUMBER' },
};

export class RemoteConfigService {
  private static instance: RemoteConfigService;
  private configValues = new Map<string, ConfigValue>();
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): RemoteConfigService {
    if (!RemoteConfigService.instance) {
      RemoteConfigService.instance = new RemoteConfigService();
    }
    return RemoteConfigService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      this.parseConfig(OKTO_REMOTE_CONFIG as RemoteConfigData);
    } catch (error) {
      logger.error('Error loading config:', error);
      this.setDefaultConfig();
    }
    this.isLoaded = true;
  }
  public async getConfigValue(key: string): Promise<ConfigValue> {
    await this.initialize();
    return this.configValues.get(key) || this.createConfigValue('', 'STRING');
  }

  public getConfigValueSync(key: string): ConfigValue {
    if (!this.isLoaded) {
      throw new Error('Config not loaded. Call initialize() first.');
    }
    return this.configValues.get(key) || this.createConfigValue('', 'STRING');
  }

  private setDefaultConfig(): void {
    Object.entries(DEFAULT_CONFIG).forEach(([key, { value, type }]) => {
      this.configValues.set(key, this.createConfigValue(value, type));
    });
  }

  private parseConfig(configData: RemoteConfigData): void {
    if (!configData?.parameters || typeof configData.parameters !== 'object') {
      logger.warn('Invalid config data, using defaults');
      this.setDefaultConfig();
      return;
    }

    Object.entries(configData.parameters).forEach(([key, param]) => {
      try {
        if (param?.valueType && param?.defaultValue?.value !== undefined) {
          this.configValues.set(
            key,
            this.createConfigValue(param.defaultValue.value, param.valueType),
          );
        }
      } catch (error) {
        logger.error(`Error parsing config key '${key}':`, error);
      }
    });
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
          result.jsonValue =
            typeof value === 'string'
              ? JSON.parse(value)
              : (value as Record<string, unknown> | unknown[]);
          result.stringValue = JSON.stringify(result.jsonValue);
          break;
        default:
          result.stringValue = String(value ?? '');
      }
    } catch (error) {
      logger.error(`Failed to parse value of type ${type}:`, error);
    }

    return result;
  }

  public async getOnrampConfig(): Promise<OnrampConfig> {
    await this.initialize();
    return {
      onRampEnabled: this.getConfigValueSync('on_ramp_enabled').booleanValue,
      theme: this.getConfigValueSync('onramp_theme').stringValue as
        | 'light'
        | 'dark',
      countryCode: this.getConfigValueSync('onramp_country_code').stringValue,
      appVersion: this.getConfigValueSync('onramp_app_version').stringValue,
      timeout: this.getConfigValueSync('onramp_timeout').numberValue,
      maxRetries: this.getConfigValueSync('onramp_max_retries').numberValue,
    };
  }
}
