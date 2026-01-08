import classes from "./user-profile.module.css";
import { Fragment, useContext, useCallback } from "react";
import { uiActions } from "../../store/ui-slice";
import { useAppDispatch } from "../../store/hooks";
import ProfileForm from "./profile-form";
import { AuthContext } from "../../context/AuthContext";
import { IAuthContext } from "../../types";
import { changePassword } from "../../helpers/changePassword";
import { changeUsername } from "../../helpers/changeUsername";

const UserProfile = () => {
	const { authContext, setAuthContext } = useContext(AuthContext);
	const { success, token, details, onLogout } = authContext;

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

	const changePasswordHandler = async (passwordData: {}) => {
		if (token) {
			try {
				const response = await changePassword(token, passwordData);
				if (response.error) {
					showNotification(`${response.error}`);
					return;
				}
				if (response.success) {
				}
			} catch (err) {
				showNotification(`${err}`);
				return;
			}
		}
	};

	const changeUsernameHandler = async (passwordData: {}) => {
		if (token) {
			try {
				const response = await changeUsername(token, passwordData);
				if (response.error) {
					showNotification(`${response.error}`);
					return;
				}
				if (response.error === "Unauthorized") {
					if (onLogout) {
						onLogout();
					}
					return;
				}
				if (response.success) {
					setAuthContext((authContext: IAuthContext) => {
						return {
							...authContext,
							success: response.success,
							details: response.details,
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

	return (
		<Fragment>
			{!success && <p>Loading...</p>}
			{success && !token && <p>Unauthorized</p>}
			{success && token && (
				<section className={classes.profile}>
					<h2>{details?.username}</h2>
					<h3>{details?.email}</h3>
					<ProfileForm
						userName={details?.username}
						onChangePassword={changePasswordHandler}
						onChangeUsername={changeUsernameHandler}
					/>
				</section>
			)}
		</Fragment>
	);
};

export default UserProfile;
