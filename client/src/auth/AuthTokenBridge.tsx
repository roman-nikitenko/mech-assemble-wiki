import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { setAccessTokenGetter } from "./authToken";

/** Invisible: publishes getAccessTokenSilently to the non-React helpers. */
export function AuthTokenBridge() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  useEffect(() => {
    setAccessTokenGetter(isAuthenticated ? () => getAccessTokenSilently() : null);
  }, [isAuthenticated, getAccessTokenSilently]);
  return null;
}
