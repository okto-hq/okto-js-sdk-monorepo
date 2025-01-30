/**
 * ========================
 * Common to Token and Account
 * ========================
 */

export type ChainType = 'EVM' | 'SVM' | 'APT';

export type Network = {
  networkId: string;
  caipBlockchainId: string;
  name: string | undefined;
  sponsorshipEnabled: boolean | undefined;
  whitelisted: boolean | undefined;
  type: ChainType | undefined;
  onRampEnabled: boolean | undefined;
  gsnEnabled: boolean | undefined;
};
