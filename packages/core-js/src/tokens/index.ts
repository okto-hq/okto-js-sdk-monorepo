import BffClientRepository from "@/api/bff.js"

class Token {
  // -------------------- Callbacks Definitions -------------------- //
  private _getSessionKey: () => string | undefined;

  // -------------------- Constructor -------------------- //
  constructor(getSessionKey: () => string | undefined) {
    this._getSessionKey = getSessionKey;
  }

  // -------------------- Public Methods -------------------- //
  async getTokens() {
    const sessionKey = this._getSessionKey();
    if (!sessionKey) {
      throw new Error('Session Key is not set');
    }

    const response = await BffClientRepository.getSupportedTokens();

    //TODO: Check if the response is valid

    return response; // {getSupportedNetworks}
  }

  async getNftCollections() {
    const sessionKey = this._getSessionKey();
    if (!sessionKey) {
      throw new Error('Session Key is not set');
    }

    const response = await BffClientRepository.getNftOrderDetails();

    //TODO: Check if the response is valid

    return response; // {getSupportedNetworks}
  }
}

export default Token;
