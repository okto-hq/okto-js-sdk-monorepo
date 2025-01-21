import { useOktoClient } from "../context/OktoProvider";

/**
 * Custom hook that provides authentication-related functions from OktoClient.
 *
 * This hook uses the OktoClient instance to return functions that handle authentication tasks.
 * It includes methods for logging in using OAuth, verifying the login status, and retrieving user information.
 *
 * @returns An object containing methods for handling authentication:
 *   - loginUsingOAuth: Function to login using OAuth authentication.
 *   - verifyLogin: Function to verify the login status.
 *   - userInfo: Function to retrieve the current user's information.
 */
export const useAuth = () => {
  const oktoClient = useOktoClient();

  return {
    loginUsingOAuth: oktoClient.auth.loginUsingOAuth,
    verifyLogin: oktoClient.auth.verifyLogin,
    userInfo: oktoClient.auth.userInfo,
  };
};
