import { useOkto} from "./useOkto.js";

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
  const oktoClient = useOkto();

   return oktoClient.auth;
};
