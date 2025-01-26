import { globalConfig } from '@/config/index.js';
import { signMessage } from 'viem/accounts';

export async function getAuthorizationToken() {
  const sessionPriv = globalConfig.authOptions?.sessionPrivKey;
  const sessionPub = globalConfig.authOptions?.sessionPubKey;

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
