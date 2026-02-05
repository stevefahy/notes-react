import React, { Fragment, useRef, useState, lazy, Suspense } from "react";
import classes from "./profile-form.module.css";
import { AlertInterface, ProfileFormProps } from "../../types";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import Button from "../ui/button";

const ErrorAlert = lazy(() => import("../ui/error-alert"));

const ProfileForm = (props: ProfileFormProps) => {
  const oldPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const newUsernameRef = useRef<HTMLInputElement>(null);
  const [userNameToggle, setUserNameToggle] = useState(false);
  const [passwordToggle, setPasswordToggle] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);

  const [error, setError] = useState<AlertInterface>({
    error_state: false,
    error_severity: "",
    message: "",
  });

  const username = props.userName;

  const resetError = () => {
    setFormIsValid(true);
    setError((prevState) => ({
      ...prevState,
      error_state: false,
      error_severity: "",
      message: "",
    }));
  };

  const handleChangeUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      event.currentTarget.value.length < APPLICATION_CONSTANTS.USERNAME_MIN ||
      event.currentTarget.value === undefined
    ) {
      setFormIsValid(false);
      setError((prevState) => ({
        ...prevState,
        error_state: true,
        error_severity: "warning",
        message: APPLICATION_CONSTANTS.CHANGE_USER_TOO_FEW,
      }));
    } else if (
      event.currentTarget.value.length > APPLICATION_CONSTANTS.USERNAME_MAX
    ) {
      setFormIsValid(false);
      setError((prevState) => ({
        ...prevState,
        error_state: true,
        error_severity: "warning",
        message: APPLICATION_CONSTANTS.CHANGE_USER_TOO_MANY,
      }));
    } else if (event.currentTarget.value === username) {
      setFormIsValid(false);
      setError((prevState) => ({
        ...prevState,
        error_state: true,
        error_severity: "warning",
        message: APPLICATION_CONSTANTS.CHANGE_USER_UNIQUE,
      }));
    } else {
      resetError();
    }
  };

  const handleChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enteredOldPassword = oldPasswordRef.current?.value;
    const enteredNewPassword = newPasswordRef.current?.value;
    if (
      enteredOldPassword!.length < APPLICATION_CONSTANTS.PASSWORD_MIN ||
      enteredNewPassword!.length < APPLICATION_CONSTANTS.PASSWORD_MIN
    ) {
      setFormIsValid(false);
      setError((prevState) => ({
        ...prevState,
        error_state: true,
        error_severity: "warning",
        message: APPLICATION_CONSTANTS.CHANGE_PASS_TOO_FEW,
      }));
    } else if (
      enteredOldPassword!.length > APPLICATION_CONSTANTS.PASSWORD_MAX ||
      enteredNewPassword!.length > APPLICATION_CONSTANTS.PASSWORD_MAX
    ) {
      setFormIsValid(false);
      setError((prevState) => ({
        ...prevState,
        error_state: true,
        error_severity: "warning",
        message: APPLICATION_CONSTANTS.CHANGE_PASS_TOO_MANY,
      }));
    } else if (
      enteredOldPassword &&
      enteredNewPassword &&
      enteredOldPassword === enteredNewPassword
    ) {
      setFormIsValid(false);
      setError((prevState) => ({
        ...prevState,
        error_state: true,
        error_severity: "warning",
        message: APPLICATION_CONSTANTS.CHANGE_PASS_UNIQUE,
      }));
    } else if (enteredOldPassword!.length !== enteredNewPassword!.length) {
      setFormIsValid(false);
      setError((prevState) => ({
        ...prevState,
        error_state: true,
        error_severity: "warning",
        message: APPLICATION_CONSTANTS.CHANGE_PASS_LENGTH,
      }));
    } else {
      resetError();
    }
  };

  const submitHandlerUsername = (event: React.FormEvent) => {
    event.preventDefault();
    const enteredNewUsername = newUsernameRef.current?.value;
    if (!enteredNewUsername) return;
    props.onChangeUsername({
      newUsername: enteredNewUsername,
    });
    resetToggle();
  };

  const submitHandlerPassword = (event: React.FormEvent) => {
    event.preventDefault();
    const enteredOldPassword = oldPasswordRef.current?.value;
    const enteredNewPassword = newPasswordRef.current?.value;
    if (!enteredOldPassword || !enteredNewPassword) {
      return;
    }
    props.onChangePassword({
      oldPassword: enteredOldPassword,
      newPassword: enteredNewPassword,
    });
    resetToggle();
  };

  const resetToggle = () => {
    resetError();
    setUserNameToggle(false);

    setPasswordToggle(false);
  };

  const toggleUserName = () => {
    resetError();
    setUserNameToggle((prev) => {
      return !prev;
    });
    setPasswordToggle(false);
  };

  const togglePassword = () => {
    resetError();
    setPasswordToggle((prev) => {
      return !prev;
    });
    setUserNameToggle(false);
  };

  return (
    <Fragment>
      <div className={classes.change_buttons}>
        <Button
          disabled={userNameToggle}
          onClick={toggleUserName}
          variant="contained"
          color="primary"
        >
          User Name
        </Button>

        <Button
          disabled={passwordToggle}
          onClick={togglePassword}
          variant="contained"
          color="primary"
        >
          Password
        </Button>
      </div>

      {passwordToggle && (
        <div className={classes.form_container}>
          <form className={classes.form} onSubmit={submitHandlerPassword}>
            <div className={classes.control}>
              <label htmlFor="new-password">New Password</label>
              <input
                autoComplete="New Password"
                type="password"
                id="new-password"
                ref={newPasswordRef}
                onChange={handleChangePassword}
              />
            </div>
            <div className={classes.control}>
              <label htmlFor="old-password">Old Password</label>
              <input
                autoComplete="New User Name"
                type="password"
                id="old-password"
                ref={oldPasswordRef}
                onChange={handleChangePassword}
              />
            </div>
            <div className={classes.action}>
              <Button
                disabled={!formIsValid}
                variant="contained"
                color="secondary"
                type="submit"
              >
                Change Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {userNameToggle && (
        <div className={classes.form_container}>
          <form className={classes.form} onSubmit={submitHandlerUsername}>
            <div className={classes.control}>
              <label htmlFor="new-username">User Name</label>
              <input
                defaultValue={username}
                type="text"
                id="new-password"
                ref={newUsernameRef}
                onChange={handleChangeUsername}
              />
            </div>
            <div className={classes.action}>
              <Button
                disabled={!formIsValid}
                type="submit"
                variant="contained"
                color="secondary"
              >
                Change User Name
              </Button>
            </div>
          </form>
        </div>
      )}

      {error.error_state && (
        <Suspense fallback={<div>Loading...</div>}>
          <ErrorAlert
            error_severity={`${
              error.error_severity ? error.error_severity : "error"
            }`}
          >
            <div>{error.message}</div>
          </ErrorAlert>
        </Suspense>
      )}
    </Fragment>
  );
};

export default ProfileForm;
