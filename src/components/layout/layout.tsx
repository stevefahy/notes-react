import { Fragment, useEffect, useState } from "react";
import { Props } from "../../types";
import { useAppSelector } from "../../store/hooks";

import MainNavigation from "./main-navigation";
import NotificationView from "../ui/notification-view";
import SnackbarView from "../ui/snackbar-view";
import { NotificationStatus } from "../../types";

// Set the CSS variable --jsvh (Javascript Vertical Height)
// This var is used because on mobile browsers the css: calc(100vh)
// includes the browser address bar area.
// In the /styles/global.css
// height: calc(100vh - var(--header-footer-height));
// becomes:
// height: calc(var(--jsvh) - var(--header-footer-height));
const setScreenHeight = () => {
	if (typeof window !== "undefined" && typeof document !== "undefined") {
		let jsvh = window.innerHeight;
		let header_height = document
			.getElementById("header_height")
			?.getBoundingClientRect().height;
		document.documentElement.style.setProperty("--jsvh", `${jsvh}px`);
		document.documentElement.style.setProperty(
			"--jsheader-height",
			`${header_height}`
		);
	}
};

const Layout = (props: Props) => {
	const notification = useAppSelector((state) => state.ui.notification);
	const snackbar = useAppSelector((state) => state.snack.snackbar);
	const [status, setStatus] = useState<NotificationStatus>(null);

	// Set the initial screenHeight
	setTimeout(() => {
		setScreenHeight();
	}, 0);

	// Set the screenHeight on window resize (includes orientation change)
	if (typeof window !== "undefined") {
		window.addEventListener("resize", () => {
			setScreenHeight();
		});
	}

	useEffect(() => {
		if (notification.status !== null) {
			setStatus(notification.status);
			const timer = setTimeout(() => {
				setStatus(null);
			}, 5000);
			return () => {
				clearTimeout(timer);
			};
		} else {
			setStatus(null);
		}
	}, [notification]);

	return (
		<Fragment>
			<MainNavigation />
			<main>{props.children}</main>
			{status && (
				<NotificationView
					status={notification.status}
					title={notification.title}
					message={notification.message}
				/>
			)}
			<SnackbarView status={snackbar.status} message={snackbar.message} />
		</Fragment>
	);
};

export default Layout;
