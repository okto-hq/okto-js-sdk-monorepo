import BffClientRepository from "@/api/bff";

class Chain {
  // -------------------- Callbacks Definitions -------------------- //
  private _getSessionKey: () => string | undefined;

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