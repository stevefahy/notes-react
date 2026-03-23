import { Fragment, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import MainNavigation from "./main-navigation";
import SnackbarView from "../ui/snackbar-view";
const setScreenHeight = () => {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const jsvh = window.innerHeight;
    const header_height = document
      .getElementById("header_height")
      ?.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--jsvh", `${jsvh}px`);
    document.documentElement.style.setProperty(
      "--jsheader-height",
      `${header_height ?? 0}`,
    );
  }
};

const Layout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/LoginPage";

  useEffect(() => {
    if (isLoginPage) return;
    const id = window.setTimeout(() => setScreenHeight(), 0);
    return () => clearTimeout(id);
  }, [isLoginPage, location.pathname]);

  useEffect(() => {
    if (isLoginPage) return;
    const onResize = () => setScreenHeight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isLoginPage]);

  return (
    <Fragment>
      <div className="app-shell">
        {!isLoginPage && <MainNavigation />}
        <main className={isLoginPage ? "login-page" : undefined}>
          <Outlet />
        </main>
        <SnackbarView />
      </div>
    </Fragment>
  );
};

export default Layout;
