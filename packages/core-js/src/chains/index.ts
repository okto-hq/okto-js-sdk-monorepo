import BffClientRepository from '@/api/bff.js';

class Chain {
  // -------------------- Callbacks Definitions -------------------- //
  private _getSessionKey: () => string | undefined;

  // -------------------- Constructor -------------------- //
  constructor(getSessionKey: () => string | undefined) {
    this._getSessionKey = getSessionKey;
  }

  // -------------------- Public Methods -------------------- //
  async getChains() {
    const sessionKey = this._getSessionKey();
    if (!sessionKey) {
      throw new Error('Session Key is not set');
    }

    const response = await BffClientRepository.getSupportedNetworks();

    //TODO: Check if the response is valid

    return response; // {getSupportedNetworks}
  }
}

export default Chain;
