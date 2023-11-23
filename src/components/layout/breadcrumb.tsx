import { Fragment, useState, useEffect } from "react";
import { NavLink, useLocation, useMatch } from "react-router-dom";
import { PageType, NotebookType, NotebookCoverType } from "../../types";
import { useAppDispatch } from "../../store/hooks";
import { editActions } from "../../store/edit-slice";
import { useAppSelector } from "../../store/hooks";
import classes from "./breadcrumb.module.css";
import EditIcon from "@mui/icons-material/Edit";
import Fab from "@mui/material/Fab";
import Typography from "@mui/material/Typography";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import Avatar from "@mui/material/Avatar";

const Breadcrumb = () => {
  const dispatch = useAppDispatch();
  const notification_edited = useAppSelector((state) => state.edit.edited);

  const location = useLocation();

  const [pageLayout, setPageLayout] = useState<PageType>("other");
  const [notebook, setNotebook] = useState<NotebookType>();
  const [notebookLoaded, setNotebookLoaded] = useState<boolean>(false);

  const resetNotebook = () => {
    setNotebook({
      id: "",
      name: "",
      cover: "default",
    });
  };

  useEffect(() => {
    if (
      notification_edited.message.notebook_name !== null &&
      notification_edited.message._id !== null
    ) {
      if (notification_edited && notification_edited.message.notebook_cover) {
        setNotebook({
          id: notification_edited.message._id,
          name: notification_edited.message.notebook_name,
          cover: notification_edited.message
            .notebook_cover as NotebookCoverType,
        });
        setNotebookLoaded(true);
      }
    }
  }, [notification_edited]);

  const match_notebookId = useMatch("/notebook/:notebookId");
  const match_noteId = useMatch("/notebook/:notebookId/:noteId");

  useEffect(() => {
    if (location.pathname) {
      if (location.pathname === "/notebooks") {
        setPageLayout((state) => {
          return "notebooks";
        });
      } else if (location.pathname === match_notebookId?.pathname) {
        setPageLayout((state) => {
          return "notebook";
        });
      } else if (location.pathname === match_noteId?.pathname) {
        setPageLayout((state) => {
          return "note";
        });
      } else if (location.pathname === "/profile") {
        setPageLayout((state) => {
          return "profile";
        });
      } else {
        setPageLayout((state) => {
          return "other";
        });
      }
    }

    if (location.pathname === "/notebooks") {
      resetNotebook();
    }
  }, [location.pathname, match_noteId?.pathname, match_notebookId?.pathname]);

  const editNotebook = () => {
    dispatch(
      editActions.editStatus({
        status: true,
      })
    );
  };

  const notebooks_title = (
    <span className={classes.breadcrumb_link}>
      <LibraryBooksOutlinedIcon sx={{ mr: 0.5 }} />
      Notebooks
    </span>
  );

  const notebooks_link = (
    <NavLink to="notebooks">
      <span className={classes.breadcrumb_link_btn}>{notebooks_title}</span>
    </NavLink>
  );

  return (
    <Fragment>
      {pageLayout !== "other" && (
        <div role="presentation" className={classes.breadcrumb_container}>
          <div aria-label="breadcrumb" className={classes.breadcrumbs_inner}>
            {/* PROFILE */}
            {notebookLoaded &&
              pageLayout === "profile" &&
              notebooks_link &&
              notebooks_link}
            {notebookLoaded && pageLayout === "profile" && notebooks_link && (
              <span className={classes.breadcrumb_link}>
                <span className={classes.breadcrumb_seperator}>/</span>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 0.5,
                    ml: 0.5,
                    fill: "currentcolor",
                    bgcolor: "#676767",
                  }}
                />
                Profile
              </span>
            )}

            {/* NOTEBOOKS */}
            {notebookLoaded && pageLayout === "notebook" && notebooks_link}

            {/* NOTEBOOKS / NOTEBOOK */}
            {notebookLoaded && pageLayout === "notebooks" && notebooks_title}
            {notebookLoaded &&
              pageLayout === "notebook" &&
              notebook &&
              notebook.name && (
                <span className={classes.breadcrumb_link}>
                  <span className={classes.breadcrumb_link_icon}>
                    <span className={classes.breadcrumb_seperator}>/</span>
                    <StickyNote2OutlinedIcon
                      sx={{ mr: 0.5, fontSize: "1.7rem" }}
                      className={`notebook_cover_${notebook?.cover}`}
                    />
                  </span>
                  {notebook.name && (
                    <span className={classes.breadcrumb_link}>
                      {notebook.name}
                    </span>
                  )}
                </span>
              )}

            {/* NOTEEBOOKS / NOTEBOOK / NOTE */}
            {notebookLoaded && pageLayout === "note" && notebooks_link}
            {notebookLoaded && notebook?.name && pageLayout === "note" && (
              <NavLink to={`notebook/${notebook?.id}`}>
                <span className={classes.breadcrumb_link}>
                  <span className={classes.breadcrumb_link_icon}>
                    <span className={classes.breadcrumb_seperator}>/</span>
                    <StickyNote2OutlinedIcon
                      sx={{ mr: 0.5, fontSize: "1.7rem" }}
                      className={`notebook_cover_${notebook?.cover}`}
                    />
                  </span>
                  <span className={classes.breadcrumb_link_btn}>
                    {notebookLoaded && notebook?.name}
                  </span>
                </span>
              </NavLink>
            )}

            {/* NOTE */}
            {notebookLoaded && notebook?.name && pageLayout === "note" && (
              <Fragment>
                <span className={classes.breadcrumb_seperator}>/</span>
                <Typography>
                  <span className={classes.breadcrumb_link}>
                    <NoteOutlinedIcon
                      sx={{ mr: 0.5 }}
                      className={classes.note}
                    />
                    Note
                  </span>
                </Typography>
              </Fragment>
            )}

            {/* EDIT NOTEBOOK BUTTON */}
            {notebookLoaded && pageLayout === "notebook" && (
              <div className={classes.breadcrumb_edit_btn}>
                <Fab
                  size="xsmall"
                  variant="circular"
                  color="default"
                  onClick={editNotebook}
                >
                  <EditIcon
                    sx={{ mr: 0 }}
                    fontSize="small"
                    className={classes.edit_btn}
                  />
                </Fab>
              </div>
            )}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Breadcrumb;
