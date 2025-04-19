// import type { SocialAuthType } from "@/types/auth/social.js";

class SocialAuthUrlGenerator {
  private static providers: Record<'google', string> = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth'
  };

  private static buildAuthUrl(
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

  public static generateAuthUrl(
    provider: keyof typeof this.providers,
    state: Record<string, string>,
  ): string {
    switch (provider) {
      case 'google':
        return this.buildGoogleAuthUrl(state);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  private static buildGoogleAuthUrl(state: Record<string, string>): string {
    return this.buildAuthUrl('google', {
      scope: 'openid email profile',
      redirect_uri: 'https://onboarding.oktostage.com/__/auth/handler',
      response_type: 'id_token',
      client_id:
        '54780876714-t59u4t7r1pekdj3p54grd9nh4rfg8qvd.apps.googleusercontent.com',
      nonce: 'b703d535-bc46-4911-8aa3-25fb6c19e2ce',
      state: {
        ...state,
      },
    });
  }
}

export default SocialAuthUrlGenerator;