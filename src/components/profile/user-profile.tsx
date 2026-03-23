import classes from "./user-profile.module.css";
import { useContext } from "react";
import ProfileForm from "./profile-form";
import { LoadingSpinner } from "../ui/loading-screen";
import { AuthContext } from "../../context/AuthContext";

const UserProfile = () => {
  const { authContext } = useContext(AuthContext);
  const { success, token, details } = authContext;

  const initial = details?.username?.charAt(0).toUpperCase() ?? "";
  const avatarLabel = details?.username
    ? `Avatar, ${details.username}`
    : "User profile";

  return (
    <section className={classes.profilePage}>
      {!success && (
        <div className={classes.loadingWrap} role="status" aria-label="Loading">
          <LoadingSpinner />
        </div>
      )}
      {success && !token && (
        <p className={classes.unauthorized}>Unauthorized</p>
      )}
      {success && token && (
        <>
          <div className={classes.profileOuter} aria-label={avatarLabel}>
            {initial}
          </div>
          <div className={classes.profileName}>
            {details?.username ? <div>{details.username}</div> : null}
          </div>
          <div className={classes.profileEmail}>
            {details?.email ? details.email : null}
          </div>
          <ProfileForm userName={details?.username} />
        </>
      )}
    </section>
  );
};

export default UserProfile;
