import { globalConfig } from '@/config/index.js';
import { signMessage } from 'viem/accounts';

export function getAuthorizationToken() {
  const sessionPriv = globalConfig.authOptions?.sessionPrivKey;
  let sessionPub = globalConfig.authOptions?.sessionPubKey;

  if (sessionPriv === undefined || sessionPub === undefined) {
    throw new Error('Session keys are not set');
  }

  sessionPub = sessionPub.replace('0x', '');

  const data = {
    expire_at: new Date(Date.now() + 30 * 60 * 1000).getTime().toString(),
    session_pub_key: sessionPub,
  };

  const payload = {
    type: 'ecdsa_uncompressed',
    data: data,
    data_signature: signMessage({
      message: JSON.stringify(data),
      privateKey: sessionPriv,
    }),
  };

  return btoa(JSON.stringify(payload));
}
