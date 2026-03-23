import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";

const AC = APPLICATION_CONSTANTS;

const useAuth = () => {
  return useContext(AuthContext);
};

export default function MenuDropdown() {
  const { authContext } = useAuth();
  const { loading, details, success, onLogout } = authContext;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setOpen((o) => !o);
    setRippleKey((k) => k + 1);
  };

  const close = useCallback(() => setOpen(false), []);

  const handleProfile = () => {
    close();
    navigate("/profile");
  };

  const loginHandler = () => {
    close();
    navigate(AC.LOGIN_PAGE);
  };

  const handleLogout = () => {
    close();
    if (onLogout) void onLogout();
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        open &&
        e.target instanceof Node &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, close]);

  if (loading && !details) {
    return null;
  }

  return (
    <div className="nav_menu" ref={dropdownRef}>
      <div className="dropdown">
        <button
          type="button"
          className={`icon profile-trigger${open ? " is-active" : ""}`}
          onClick={toggleMenu}
          onKeyDown={(e) => e.key === "Escape" && close()}
          aria-haspopup="true"
          aria-expanded={open}
        >
          {rippleKey > 0 ? (
            <span key={rippleKey} className="ripple-burst" aria-hidden />
          ) : null}
          <span className="material-icons-outlined menu_item">person</span>
        </button>

        {open ? (
          <div className="dropdown-menu" role="menu">
            {success ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={handleProfile}
                role="menuitem"
              >
                <span className="material-icons-outlined menu_item">
                  person
                </span>
                Profile
              </button>
            ) : null}
            {!success ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={loginHandler}
                role="menuitem"
              >
                <span className="material-icons menu_item">login</span>
                Sign in
              </button>
            ) : null}
            {success ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={handleLogout}
                role="menuitem"
              >
                <span className="material-icons menu_item danger_icon">
                  logout
                </span>
                Sign out
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
