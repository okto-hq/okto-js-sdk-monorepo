/**
 * Represents the  Response for Supported Networks
 */

export type GetSupportedNetworksResponseData = {
  caipId: string;
  networkName: string;
  chainId: string;
  logo: string;
  sponsorshipEnabled: boolean;
  gsnEnabled: boolean;
  type: string;
  networkId: string;
};
