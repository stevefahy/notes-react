import { Fragment } from "react";
import classes from "./main-navigation.module.css";
import MenuDropdown from "../ui/menu-dropdown";
import Breadcrumb from "./breadcrumb";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

const MainNavigation = () => {
  return (
    <Fragment>
      <div className={classes.header} id="header_height">
        <div className={classes.header_container}>
          <div className={classes.logo_container}>
            <div className={classes.header_title_logo}>
              <img
                src="/images/edit_white.png"
                alt="Notes logo"
                width={20}
                height={20}
              />
            </div>
            <div className={classes.header_title}>NOTES</div>
          </div>
          <div className={classes.header_toolbar}>
            <Toolbar>
              <Box sx={{ flexGrow: 0 }}>
                <MenuDropdown />
              </Box>
            </Toolbar>
          </div>
        </div>
      </div>
      <Breadcrumb />
    </Fragment>
  );
};

export default MainNavigation;
