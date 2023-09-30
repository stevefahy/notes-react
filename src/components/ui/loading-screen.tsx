import classes from "./loading-screen.module.css";
import { CircularProgress } from "@mui/material";

const LoadingScreen = () => {
  return (
    <div className={classes.loading_outer}>
      <div className={classes.loading_inner}>
        <CircularProgress />
      </div>
    </div>
  );
};

export default LoadingScreen;
