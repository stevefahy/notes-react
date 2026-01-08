import React, {
  useRef,
  useState,
  useContext,
  Fragment,
  lazy,
  Suspense,
} from "react";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { ErrorMessage } from "../types";
import classes from "./login.module.css";
import Button from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";

const ErrorAlert = lazy(() => import("../components/ui/error-alert"));

function LoginPage() {
  const { authContext } = useContext(AuthContext);
  const { onLogin, onRegister } = authContext;
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ErrorMessage>({
    error: false,
    message: "",
  });

  const navigate = useNavigate();

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const switchAuthModeHandler = () => {
    resetError();
    setIsLogin((prevState) => !prevState);
  };

  const resetError = () => {
    setError({ error: false, message: "" });
    setIsSubmitting(false);
  };

  const validateForm = (validate: string[]) => {
    if (validate.includes("username")) {
      const enteredUsername = usernameInputRef.current!.value;
      if (enteredUsername.length < 2) {
        usernameInputRef.current?.focus();
        setError({
          error: true,
          message: APPLICATION_CONSTANTS.SIGNUP_INVALID_USERNAME,
        });
        return false;
      }
    }
    if (validate.includes("email")) {
      const enteredEmail = emailInputRef.current!.value;
      if (
        !enteredEmail ||
        !enteredEmail.includes("@") ||
        !enteredEmail.includes(".")
      ) {
        emailInputRef.current?.focus();
        setError({
          error: true,
          message: APPLICATION_CONSTANTS.SIGNUP_INVALID_EMAIL,
        });
        return false;
      }
    }
    if (validate.includes("password")) {
      const enteredPassword = passwordInputRef.current!.value;
      if (!enteredPassword || enteredPassword.trim().length < 7) {
        passwordInputRef.current?.focus();
        setError({
          error: true,
          message: APPLICATION_CONSTANTS.SIGNUP_INVALID_PASSWORD,
        });
        return false;
      }
    }
    return true;
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError({ error: false, message: error.message });

    const enteredEmail = emailInputRef.current!.value;
    const enteredPassword = passwordInputRef.current!.value;

    if (isLogin) {
      // Existing user
      const validForm = validateForm(["email", "password"]);
      if (!validForm) {
        return;
      }
      try {
        const result = await onLogin(enteredEmail, enteredPassword);
        setIsSubmitting(false);
        if (!result?.error) {
          // Navigate the default page.
          navigate(`${APPLICATION_CONSTANTS.DEFAULT_PAGE}`);
        } else {
          setError({ error: true, message: result.error });
        }
      } catch (error: any) {
        setError({ error: true, message: error.message });
      }
    } else {
      // New User
      const enteredUsername = usernameInputRef.current!.value;
      const validForm = validateForm(["username", "email", "password"]);
      if (!validForm) {
        return;
      }
      try {
        const result = await onRegister(
          enteredUsername,
          enteredEmail,
          enteredPassword
        );
        setIsSubmitting(false);
        if (result === null || result === undefined) {
          navigate(`${APPLICATION_CONSTANTS.DEFAULT_PAGE}`);
          return;
        }
        if (result.error) {
          setError({ error: true, message: result.error });
          return;
        }
        if (result.success && result.notebookID && result.noteID) {
          navigate(`/notebook/${result.notebookID}/${result.noteID}`);
        } else {
          navigate(`${APPLICATION_CONSTANTS.DEFAULT_PAGE}`);
        }
      } catch (error: any) {
        setError({ error: true, message: error.message });
      }
    }
  };

  return (
    <Fragment>
      <section className={classes.auth}>
        <Card>
          <CardContent>
            <CardHeader title={isLogin ? "Login" : "Sign Up"}></CardHeader>
            <form onSubmit={submitHandler}>
              {!isLogin && (
                <div className={classes.control}>
                  <label htmlFor="username">Your Name</label>
                  <input
                    type="text"
                    id="username"
                    required
                    ref={usernameInputRef}
                    placeholder="Username"
                    autoComplete="username"
                    onChange={(e) => resetError()}
                  />
                </div>
              )}
              <div className={classes.control}>
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  required
                  ref={emailInputRef}
                  placeholder="Email"
                  autoComplete="email"
                  onChange={(e) => resetError()}
                />
              </div>
              <div className={classes.control}>
                <label htmlFor="password">Your Password</label>
                <input
                  type="password"
                  id="password"
                  required
                  ref={passwordInputRef}
                  placeholder="Password"
                  autoComplete="current-password"
                  onChange={(e) => resetError()}
                />
              </div>
              <div className={classes.actions}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={submitHandler}
                  size="medium"
                  disabled={isSubmitting}
                >
                  {isLogin ? "Login" : "Create Account"}
                </Button>
                <Button
                  variant="text"
                  color="secondary"
                  size="large"
                  onClick={switchAuthModeHandler}
                >
                  {isLogin
                    ? "Create new account"
                    : "Login with existing account"}
                </Button>
              </div>
            </form>
            {error.error && (
              <Suspense fallback={<div>Loading...</div>}>
                <ErrorAlert>{error.message}</ErrorAlert>
              </Suspense>
            )}
          </CardContent>
        </Card>
      </section>
    </Fragment>
  );
}

export default LoginPage;
