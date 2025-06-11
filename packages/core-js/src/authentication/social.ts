import type { EnvConfig } from '@/core/types.js';
import type { SocialAuthType } from '@/types/auth/social.js';
import { Constants } from '@/utils/constants.js';
import { v4 as uuidv4 } from 'uuid';

class SocialAuthUrlGenerator {
  private providers: Record<SocialAuthType, string> = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    apple: 'https://appleid.apple.com/auth/authorize', // Add Apple provider
  };

  private buildAuthUrl(
    provider: keyof typeof this.providers,
    params: Record<string, string | object>,
  ): string {
    const baseUrl = this.providers[provider];
    if (!baseUrl) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const urlParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      urlParams.append(
        key,
        typeof value === 'object' ? JSON.stringify(value) : value,
      );
    }

    return `${baseUrl}?${urlParams.toString()}`;
  }

  public generateAuthUrl(
    provider: keyof typeof this.providers,
    state: Record<string, string>,
    envConfig: EnvConfig,
  ): string {
    switch (provider) {
      case 'google':
        return this.buildGoogleAuthUrl(state);
      case 'apple':
        return this.buildAppleAuthUrl(state);
        return this.buildGoogleAuthUrl(state, envConfig);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private buildGoogleAuthUrl(
    state: Record<string, string>,
    envConfig: EnvConfig,
  ): string {
    const nonce = uuidv4();
    return this.buildAuthUrl('google', {
      scope: 'openid email profile',
      redirect_uri: envConfig.authRedirectUrl,
      response_type: 'id_token',
      client_id: Constants.GOOGLE_CLIENT_ID,
      nonce,
      state: {
        ...state,
      },
    });
  }

  private buildAppleAuthUrl(state: Record<string, string>): string {
    const nonce = uuidv4();
    return this.buildAuthUrl('apple', {
      scope: 'name email',
      redirect_uri: 'https://onboarding.oktostage.com/__/auth/handler',
      response_type: 'code id_token',
      response_mode: 'form_post',
      client_id: Constants.APPLE_CLIENT_ID, // You'll need to add this to your constants
      nonce,
      state: {
        ...state,
      },
    });
  }
}

export default SocialAuthUrlGenerator;
