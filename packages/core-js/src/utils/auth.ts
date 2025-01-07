import { globalConfig } from '@/config/index.js';
import { signPayload } from './sessionKey.js';

export function getAuthorizationToken() {
  if (
    globalConfig.authOptions?.sessionPrivKey === undefined ||
    globalConfig.authOptions?.sessionPubKey === undefined
  ) {
    throw new Error('Session keys are not set');
  }

  const data = {
    expire_at: new Date(Date.now() + 30 * 60 * 1000).getTime().toString(),
    session_pub_key: globalConfig.authOptions?.sessionPubKey,
  };

  const payload = {
    type: 'ecdsa_uncompressed',
    data: data,
    data_signature: signPayload(data, globalConfig.authOptions?.sessionPrivKey),
  };

  return btoa(JSON.stringify(payload));
}
