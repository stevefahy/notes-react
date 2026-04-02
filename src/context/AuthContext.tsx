import { useState, createContext, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthContextType,
  IAuthContext,
  AuthAuthenticate,
  AuthSignup,
} from "../types";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { useAppDispatch } from "../store/hooks";
import { dispatchErrorSnack } from "../lib/dispatchSnack";
import { toUserFriendlyError } from "../lib/errorMessageMap";
import { logout } from "../helpers/logout";
import { login } from "../helpers/login";
import { signup } from "../helpers/signup";
import { refreshtoken } from "../helpers/refreshtoken";

const AC = APPLICATION_CONSTANTS;

const AuthContext = createContext<AuthContextType>(null!);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  /** Coalesce concurrent refreshtoken calls (matches Svelte auth store; avoids duplicate 401s under Strict Mode). */
  const refreshInProgressRef = useRef<Promise<
    AuthAuthenticate | undefined
  > | null>(null);

  // Sync logout across tabs
  const syncLogout = useCallback(
    (event: StorageEvent) => {
      if (event.key === "logout") {
        navigate(`${AC.LOGIN_PAGE}`);
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener("storage", syncLogout);
    return () => {
      window.removeEventListener("storage", syncLogout);
    };
  }, [syncLogout]);

  const logoutHandler = async (token: string) => {
    if (token) {
      try {
        const response = await logout(token);
        if (response.error) {
          dispatchErrorSnack(dispatch, response.error, response.fromServer);
          return;
        }
        if (response.success) {
          resetAuthContext();
          const dateNow: number = Date.now();
          window.localStorage.setItem("logout", "" + dateNow);
          navigate(`${AC.LOGIN_PAGE}`);
        }
      } catch (err) {
        dispatchErrorSnack(dispatch, err, false);
        return;
      }
    }
  };

  const handleLogout = async () => {
    const context = await getRefreshToken();
    if (context && typeof context.token === "string") {
      logoutHandler(context.token);
    }
  };

  const handleSignup = async (
    username: string,
    email: string,
    password: string,
  ): Promise<AuthSignup> => {
    if (email && password) {
      try {
        const response: AuthSignup = await signup(username, email, password);
        if (!response) {
          return;
        }
        if (response.error) {
          return response;
        }
        if (response.success) {
          setAuthContext((authContext: IAuthContext) => {
            return {
              ...authContext,
              success: response.success,
              details: response.details,
              token: response.token,
              loading: false,
            };
          });
          return {
            success: response.success,
            token: response.token,
            details: response.details,
            notebookID: response.notebookID,
            noteID: response.noteID,
          };
        }
      } catch (err) {
        return { error: toUserFriendlyError(err), fromServer: false };
      }
    }
  };

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<AuthAuthenticate> => {
    if (email && password) {
      try {
        const response: AuthAuthenticate = await login(email, password);
        if (!response) {
          return;
        }
        if (response.error) {
          return response;
        }
        if (response.success) {
          setAuthContext((authContext: IAuthContext) => {
            return {
              ...authContext,
              success: response.success,
              details: response.details,
              token: response.token,
              loading: false,
            };
          });
          return response;
        }
        return {
          error: AC.LOGIN_ERROR,
          fromServer: false,
        };
      } catch (err) {
        return { error: toUserFriendlyError(err), fromServer: false };
      }
    }
  };

  const initialState = {
    loading: true,
    details: null,
    success: null,
    token: null,
    onLogin: handleLogin,
    onLogout: handleLogout,
    onRegister: handleSignup,
    notebookID: null,
    noteID: null,
  };

  const [authContext, setAuthContext] = useState<IAuthContext>(initialState);

  const getRefreshToken = useCallback(async (): Promise<
    AuthAuthenticate | undefined
  > => {
    const inFlight = refreshInProgressRef.current;
    if (inFlight) {
      return inFlight;
    }
    const promise = (async (): Promise<AuthAuthenticate | undefined> => {
      try {
        const response = await refreshtoken();
        if (!response) {
          return undefined;
        }
        if (response.error) {
          return undefined;
        }
        if (response.success) {
          return response;
        }
      } catch {
        return undefined;
      }
      return undefined;
    })();
    refreshInProgressRef.current = promise;
    try {
      return await promise;
    } finally {
      refreshInProgressRef.current = null;
    }
  }, []);

  const resetAuthContext = useCallback(() => {
    setAuthContext((authContext) => {
      return {
        ...authContext,
        success: null,
        token: null,
        details: null,
        loading: false,
      };
    });
  }, []);

  const verifyRefreshTokenWithRetry = useCallback(
    async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await getRefreshToken();
          if (response?.success) {
            setAuthContext((oldValues) => {
              return {
                ...oldValues,
                success: response.success,
                token: response.token,
                details: response.details,
                loading: false,
              };
            });
            return;
          }
        } catch {
          /* retry on next iteration */
        }
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      resetAuthContext();
      navigate(`${AC.LOGIN_PAGE}`);
    },
    [getRefreshToken, navigate, resetAuthContext],
  );

  useEffect(() => {
    void verifyRefreshTokenWithRetry();
    return () => {};
  }, [verifyRefreshTokenWithRetry]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (!authContext.success) {
        clearInterval(interval);
        navigate(`${AC.LOGIN_PAGE}`);
      } else {
        void verifyRefreshTokenWithRetry();
      }
    }, APPLICATION_CONSTANTS.REFRESH_TOKEN_INTERVAL);

    return () => clearInterval(interval);
  }, [authContext.success, navigate, verifyRefreshTokenWithRetry]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.setTimeout(() => {
          void verifyRefreshTokenWithRetry();
        }, 500);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [verifyRefreshTokenWithRetry]);

  const value = {
    authContext,
    setAuthContext,
    verifyRefreshTokenWithRetry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
