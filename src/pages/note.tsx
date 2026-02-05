import { useParams } from "react-router-dom";
import { Fragment, useEffect, useCallback, useState, useContext } from "react";
import { uiActions } from "../store/ui-slice";
import { snackActions } from "../store/snack-slice";
import { editActions } from "../store/edit-slice";
import { useAppDispatch } from "../store/hooks";
import classes from "./note.module.css";
import { initScrollSync } from "../lib/scroll_sync";
import useWindowDimensions from "../lib/useWindowDimension";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Footer from "../components/layout/footer";
import EditNote from "../components/note/editnote";
import ViewNote from "../components/note/viewnote";
import LoadingScreen from "../components/ui/loading-screen";
import Fab from "@mui/material/Fab";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EggIcon from "@mui/icons-material/Egg";
import { getNotebook } from "../helpers/getNotebook";
import { getNote } from "../helpers/getNote";
import { createNote } from "../helpers/createNote";
import { saveNote } from "../helpers/saveNote";

const useAuth = () => {
  return useContext(AuthContext);
};

const NotePage = () => {
  const { authContext } = useAuth();
  const { token } = authContext;
  const { notebookId, noteId } = useParams();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  let new_note = false;

  const { width, height } = useWindowDimensions();
  const [WELCOME_NOTE, setWELCOME_NOTE] = useState("");

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

  useEffect(() => {
    fetch("/md/welcome_markdown.md")
      .then((response) => response.text())
      .then((text) => setWELCOME_NOTE(text));
  }, []);

  useEffect(() => {
    if (width < APPLICATION_CONSTANTS.SPLITSCREEN_MINIMUM_WIDTH) {
      setIsplitScreen(false);
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, [width, height]);

  useEffect(() => {
    // Wait for the Markdown to load before initializing scroll sync
    setTimeout(() => {
      initScrollSync();
    }, 500);
  }, []);

  if (noteId === "create-note") {
    new_note = true;
  }

  const [viewText, setViewText] = useState("");
  const [loadedText, setLoadedText] = useState("");
  const [isChanged, setIsChanged] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [isView, setIsView] = useState(new_note);
  const [isSplitScreen, setIsplitScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreate, setIsCreate] = useState(new_note);
  const [originalText, setOriginalText] = useState("");
  const [updateEditTextProp, setUpdateEditTextProp] = useState("");
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [notebookLoaded, setNotebookLoaded] = useState(false);

  useEffect(() => {
    // Get the Note
    (async () => {
      if (
        !isCreate &&
        notebookId &&
        noteId &&
        noteId !== "create-note" &&
        !noteLoaded &&
        token
      ) {
        setNoteLoaded(false);
        try {
          const response = await getNote(token, notebookId, noteId);
          setNoteLoaded(true);
          if (response.error) {
            showNotification(`${response.error}`);
            return;
          }
          if (response.success) {
            setViewText(response.note.note);
            setLoadedText(response.note.note);
            setOriginalText(response.note.note);
            setNoteLoaded(true);
          }
        } catch (err) {
          showNotification(`${err}`);
          setNoteLoaded(true);
          return;
        }
      } else {
        setNoteLoaded(true);
      }
    })();

    // Get the Notebook
    (async () => {
      if (!notebookLoaded && token && notebookId) {
        setNotebookLoaded(false);
        try {
          const response = await getNotebook(token, notebookId);
          setNotebookLoaded(true);
          if (response.error) {
            showNotification(`${response.error}`);
            return;
          }
          if (response.success) {
            dispatch(
              editActions.editChange({
                message: response.notebook,
              })
            );
          }
        } catch (err) {
          showNotification(`${err}`);
          setNotebookLoaded(true);
          return;
        }
      }
    })();
  }, [
    token,
    dispatch,
    notebookId,
    noteId,
    isCreate,
    noteLoaded,
    notebookLoaded,
    showNotification,
  ]);

  const toggleEditHandlerCallback = useCallback(() => {
    setIsView(!isView);
  }, [isView]);

  const toggleSplitHandlerCallback = useCallback(() => {
    setIsplitScreen(!isSplitScreen);
  }, [isSplitScreen]);

  const saveNoteCallback = useCallback(async () => {
    if (token && notebookId && noteId && viewText) {
      let response;
      try {
        response = await saveNote(token, notebookId, noteId, viewText);
        if (response.error) {
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          setIsChanged(false);
          setAutoSave(false);
          setOriginalText(viewText);
          // Change to View Mode
          if (isView) {
            toggleEditHandlerCallback();
          }
          return response;
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  }, [
    isView,
    noteId,
    notebookId,
    toggleEditHandlerCallback,
    viewText,
    token,
    showNotification,
  ]);

  useEffect(() => {
    if (autoSave && isChanged && (isView || isChanged) && !isCreate) {
      const noteSaved = async () => {
        await saveNoteCallback();
        setAutoSave(false);
        setIsChanged(false);
      };
      noteSaved();
      return () => {
        // component unmounts
      };
    }
  }, [autoSave, isChanged, isView, isCreate, saveNoteCallback]);

  useEffect(() => {
    if (autoSave) {
      dispatch(
        snackActions.showSnack({
          status: true,
          message: "Note Saved",
        })
      );
    }
  }, [autoSave, dispatch]);

  const exampleNote = () => {
    if (!isMobile) {
      setIsplitScreen(true);
    }
    updatedViewTextHandler(WELCOME_NOTE);
  };

  // Create Note
  const createNotePost = async () => {
    if (token && notebookId && viewText) {
      setAutoSave(false);
      const note_obj = { notebookId: notebookId, note: viewText };
      try {
        const response = await createNote(token, note_obj);
        setNotebookLoaded(true);
        if (response.error) {
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          setIsCreate(false);
          setIsChanged(false);
          setAutoSave(false);
          navigate(`/notebook/${notebookId}`);
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  };

  const updateIsChanged = useCallback(
    (content: string) => {
      if (content !== originalText) {
        setIsChanged(true);
      } else {
        setIsChanged(false);
      }
    },
    [originalText]
  );

  const updatedViewTextHandler = useCallback(
    (updatedViewText: string) => {
      updateIsChanged(updatedViewText);
      setViewText(updatedViewText);
      setUpdateEditTextProp(updatedViewText);
    },
    [updateIsChanged]
  );

  const onRouteChangeStart = useCallback(() => {
    if (isChanged && !isCreate) {
      setAutoSave(true);
    }
  }, [isChanged, isCreate]);

  useEffect(() => {
    const popStateListener = () => {
      onRouteChangeStart();
    };
    window.addEventListener("popstate", popStateListener);
    return () => {
      window.removeEventListener("popstate", popStateListener);
    };
  }, [onRouteChangeStart]);

  return (
    <Fragment>
      {(!noteLoaded || token === null) && <LoadingScreen />}
      <div className="page_scrollable_header_breadcrumb_footer">
        {noteLoaded && token !== null && (
          <div className={classes.view_container} id="view_container">
            <ViewNoteMemo
              visible={!isView}
              splitScreen={isSplitScreen}
              viewText={viewText}
              updatedViewText={updatedViewTextHandler}
            />
            <EditNoteMemo
              visible={isView}
              splitScreen={isSplitScreen}
              loadedText={loadedText}
              updateViewText={updatedViewTextHandler}
              passUpdatedViewText={updateEditTextProp}
            />
          </div>
        )}
      </div>

      <Footer>
        {noteLoaded && viewText.length > 0 && !isCreate && isChanged && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={saveNoteCallback}
          >
            <AddCircleIcon sx={{ mr: 1 }} />
            Save Note
          </Fab>
        )}
        {noteLoaded && viewText.length > 0 && isCreate && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={createNotePost}
          >
            <AddCircleIcon sx={{ mr: 1 }} />
            Create Note
          </Fab>
        )}
        {noteLoaded && viewText.length === 0 && isCreate && (
          <Fab
            variant="extended"
            color="primary"
            size="medium"
            onClick={exampleNote}
            className="example_button"
          >
            <EggIcon sx={{ mr: 0 }} />
            Example
          </Fab>
        )}
        {noteLoaded && !isSplitScreen && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={toggleEditHandlerCallback}
          >
            {isView ? (
              <VisibilityIcon sx={{ mr: 1 }} />
            ) : (
              <EditIcon sx={{ mr: 1 }} />
            )}
            {isView ? "View" : "Edit"}
          </Fab>
        )}

        {noteLoaded && !isMobile && (
          <Fab
            variant="extended"
            color="primary"
            size="medium"
            onClick={toggleSplitHandlerCallback}
            className="split_screen_button"
          >
            {isSplitScreen ? (
              <span className="split_screen_icon">
                <img
                  src="/images/split_screen_icon_single.png"
                  alt="split screen icon"
                  width="30"
                  height="30"
                />
              </span>
            ) : (
              <span className="split_screen_icon">
                <img
                  src="/images/split_screen_icon_double.png"
                  alt="split screen icon"
                  width="30"
                  height="30"
                />
              </span>
            )}
          </Fab>
        )}
      </Footer>
    </Fragment>
  );
};

const ViewNoteMemo = ViewNote;
const EditNoteMemo = EditNote;
export default NotePage;
