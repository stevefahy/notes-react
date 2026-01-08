import { useState, createContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthContextType,
  IAuthContext,
  AuthAuthenticate,
  AuthSignup,
} from "../types";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { uiActions } from "../store/ui-slice";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../helpers/logout";
import { login } from "../helpers/login";
import { signup } from "../helpers/signup";
import { refreshtoken } from "../helpers/refreshtoken";

const AC = APPLICATION_CONSTANTS;

const AuthContext = createContext<AuthContextType>(null!);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const showNotification = useCallback(
    (msg: string) => {
      dispatch(
        uiActions.showNotification({
          status: "error",
          title: "Error!",
          message: msg,
        })
      );
    },
    [dispatch]
  );

  // Sync logout across tabs
  const syncLogout = useCallback(
    (event: StorageEvent) => {
      if (event.key === "logout") {
        navigate(`${AC.LOGIN_PAGE}`);
      }
    },
    [navigate]
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
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          resetAuthContext();
          let dateNow: number = Date.now();
          window.localStorage.setItem("logout", "" + dateNow);
          navigate(`${AC.LOGIN_PAGE}`);
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  };

  const handleLogout = async () => {
    const context = await getRefreshToken();
    if (context && context.token !== null) {
      logoutHandler(context.token);
    }
  };

  const handleSignup = async (
    username: string,
    email: string,
    password: string
  ): Promise<AuthSignup> => {
    if (email && password) {
      try {
        const response: AuthSignup = await signup(username, email, password);
        if (!response) {
          return;
        }
        if (response.error) {
          showNotification(`${response.error}`);
          return;
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
        showNotification(`${err}`);
        return;
      }
    }
  };

  const handleLogin = async (
    email: string,
    password: string
  ): Promise<AuthAuthenticate> => {
    if (email && password) {
      try {
        const response: AuthAuthenticate = await login(email, password);
        if (!response) {
          return;
        }
        if (response.error) {
          showNotification(`${response.error}`);
          return;
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
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
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

  let [authContext, setAuthContext] = useState<IAuthContext>(initialState);
  let value = {
    loading: true,
    authContext,
    setAuthContext,
    onLogin: handleLogin,
    onLogout: handleLogout,
    onRegister: handleSignup,
  };

  const getRefreshToken = useCallback(async () => {
    try {
      const response = await refreshtoken();
      if (!response) {
        return;
      }
      if (response.error) {
        // showNotification(`${response.error}`);
        return;
      }
      if (response.success) {
        return response;
      }
    } catch (err) {
      // showNotification(`${err}`);
      return;
    }
  }, []);

  const resetAuthContext = () => {
    setAuthContext((authContext) => {
      return {
        ...authContext,
        success: null,
        token: null,
        details: null,
        loading: false,
      };
    });
  };

  const verifyRefreshToken = useCallback(async () => {
    try {
      const response = await getRefreshToken();
      if (response === null || response === undefined) {
        resetAuthContext();
        return;
      }
      if (response.success) {
        setAuthContext((oldValues) => {
          return {
            ...oldValues,
            success: response.success,
            token: response.token,
            details: response.details,
            loading: false,
          };
        });
      }
    } catch (err) {
      resetAuthContext();
    }
  }, [getRefreshToken]);

  useEffect(() => {
    verifyRefreshToken();
    return () => {};
  }, [verifyRefreshToken]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!authContext.success) {
        clearInterval(interval);
        navigate(`${AC.LOGIN_PAGE}`);
      } else {
        verifyRefreshToken();
      }
    }, APPLICATION_CONSTANTS.REFRESH_TOKEN_INTERVAL);

    return () => clearInterval(interval);
  }, [authContext.success, navigate, verifyRefreshToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
