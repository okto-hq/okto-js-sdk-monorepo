import { Network } from "./chains";

export type Token = {
  tokenId: string;
  tokenAddress: string;
  network: Network;
  whitelisted: boolean | undefined;
  onRampEnabled: boolean | undefined;
};