import BffClientRepository from "@/api/bff";

class Token {
  // -------------------- Callbacks Definitions -------------------- //
  private _getSessionKey: () => string | undefined;

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
