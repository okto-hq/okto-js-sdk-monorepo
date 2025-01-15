import { useOktoClient } from "../context/OktoProvider";

export const useAccount = () => {
  const oktoClient = useOktoClient();
  return {
    getAccount: oktoClient.account.getAccount,
    getPortfolio: oktoClient.account.getPortfolio,
    getOrdersHistory: oktoClient.account.getOrdersHistory,
  };
};
