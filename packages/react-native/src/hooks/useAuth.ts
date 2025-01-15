// src/hooks/useAuth.ts
import { useOktoClient } from "../context/OktoProvider";

export const useAuth = () => {
  const oktoClient = useOktoClient();
  return {
    loginUsingOAuth: oktoClient.auth.loginUsingOAuth,
    verifyLogin: oktoClient.auth.verifyLogin,
    userInfo: oktoClient.auth.userInfo,
  };
};
