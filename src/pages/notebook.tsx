import {
  Fragment,
  useContext,
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
  memo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Note, Notebook, SelectedNote } from "../types";
import { AuthContext } from "../context/AuthContext";
import LoadingScreen from "../components/ui/loading-screen";
import NoteList from "../components/notebooks/note-list";
import { uiActions } from "../store/ui-slice";
import { editActions } from "../store/edit-slice";
import { useAppDispatch } from "../store/hooks";
import { useAppSelector } from "../store/hooks";
import Footer from "../components/layout/footer";
import Fab from "@mui/material/Fab";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import FlipToFrontIcon from "@mui/icons-material/FlipToFront";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import { getNotebooks } from "../helpers/getNotebooks";
import { getNotebook } from "../helpers/getNotebook";
import { getNotes } from "../helpers/getNotes";
import { deleteNotes } from "../helpers/deleteNotes";
import { editNotebookDate } from "../helpers/editNotebookDate";
import { moveNotes } from "../helpers/moveNotes";
import { deleteNotebook } from "../helpers/deleteNotebook";
import { editNotebook } from "../helpers/editNotebook";

const SelectNotebookForm = lazy(
  () => import("../components/notebooks/select-notebook-form")
);
const AddNotebookForm = lazy(
  () => import("../components/notebooks/add-notebook-form")
);

const useAuth = () => {
  return useContext(AuthContext);
};

const NotebookPage = () => {
  const { authContext } = useAuth();
  const { token } = authContext;
  const { notebookId } = useParams();

  const dispatch = useAppDispatch();
  const notification_editing = useAppSelector((state) => state.edit.editing);
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>();
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [notesLoadedDelay, setNotesLoadedDelay] = useState(false);
  const [notebookLoaded, setNotebookLoaded] = useState(false);
  const [notebooksLoaded, setNotebooksLoaded] = useState(false);
  const [notebook, setNotebook] = useState<Notebook>();
  const [userNotebooks, setUserNotebooks] = useState<Notebook[]>();
  const [isSelected, setIsSelected] = useState<SelectedNote | null>();
  const [moveNote, setMoveNote] = useState(false);
  const [enableEditNotebook, setEnableEditNotebook] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [clearEditNotes, setClearEditNotes] = useState(false);

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

  const sortNotes = useCallback((notes: Note[]) => {
    // Add an update date for sorting if one does not exist
    notes.forEach((x) => {
      if (x.updatedAt === "No date" || undefined) {
        x.updatedAt = "December 17, 1995 03:24:00";
      }
    });
    notes
      .sort((a, b) => {
        if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
          return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1;
        } else {
          return a.updatedAt !== undefined ? 1 : -1;
        }
      })
      .reverse();
    return notes;
  }, []);

  useEffect(() => {
    if (notification_editing.status === true) {
      editNotebookBtnHandler();
    }
  }, [notification_editing]);

  useEffect(() => {
    let loadingTimer: NodeJS.Timeout;
    if (notesLoadedDelay) {
      loadingTimer = setTimeout(() => {
        setNotesLoaded(true);
      }, 100);
    }
    return () => clearTimeout(loadingTimer);
  }, [notesLoadedDelay]);

  useEffect(() => {
    if (!notebookId || !token) {
      return;
    }

    // Get the Notes
    (async () => {
      if (!notesLoaded) {
        setNotesLoadedDelay(false);
        setNotesLoaded(false);
        try {
          const response = await getNotes(token, notebookId);
          setNotebookLoaded(true);
          if (response.error) {
            showNotification(`${response.error}`);
            return;
          }
          if (response.success) {
            const notes_sorted = sortNotes(response.notes);
            setNotes(notes_sorted);
            setNotesLoadedDelay(true);
          }
        } catch (err) {
          showNotification(`${err}`);
          setNotesLoadedDelay(true);
          return;
        }
      }
    })();

    // Get the Notebook
    (async () => {
      if (!notebookLoaded) {
        setNotebookLoaded(false);
        try {
          const response = await getNotebook(token, notebookId);
          setNotebookLoaded(true);
          if (response.error) {
            showNotification(`${response.error}`);
            return;
          }
          if (response.success) {
            setNotebook(response.notebook);
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

    // Get the Notebooks
    (async () => {
      if (!notebooksLoaded) {
        setNotebooksLoaded(false);
        try {
          const response = await getNotebooks(token);
          setNotebooksLoaded(true);
          if (response.error) {
            showNotification(`${response.error}`);
            return;
          }
          if (response.success) {
            setUserNotebooks(response.notebooks);
          }
        } catch (err) {
          showNotification(`${err}`);
          setNotebooksLoaded(true);
          return;
        }
      }
    })();
  }, [
    token,
    notebookId,
    sortNotes,
    dispatch,
    notebookLoaded,
    notebooksLoaded,
    notesLoaded,
    showNotification,
  ]);

  const updateSelected = (selected: SelectedNote) => {
    setIsSelected(selected);
  };

  const moveNoteFormHandler = () => {
    setMoveNote(true);
  };

  const cancelHandler = () => {
    setMoveNote(false);
  };
  const cancelEditHandler = () => {
    setEnableEditNotebook(false);
    dispatch(editActions.editStatus({ status: false }));
  };

  const editNotebookBtnHandler = () => {
    setEnableEditNotebook(true);
  };

  const addNoteFormHandler = () => {
    navigate(`/notebook/${notebookId}/create-note`);
  };

  const editNoteFormHandler = () => {
    setEditNotes(true);
    setClearEditNotes(false);
  };

  const resetNotesSelected = () => {
    setIsSelected((state) => {
      let newarray: SelectedNote = { selected: [] };
      return { ...state, selected: newarray.selected };
    });
  };

  const cancelEditNoteFormHandler = () => {
    setEditNotes(false);
    setClearEditNotes(true);
    resetNotesSelected();
  };

  const updateNotebookDate = (
    notebookId: string,
    notebookLatesDate: string
  ) => {
    editNotebookDateHandler(notebookId, notebookLatesDate);
  };

  const deleteNoteHandler = async () => {
    let notesSelected: string[];
    if (token && isSelected !== null && isSelected !== undefined) {
      notesSelected = isSelected.selected;
      try {
        const response = await deleteNotes(token, notesSelected);
        setNotebookLoaded(true);
        if (response.error) {
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          let updatedNotesLatestDate: string | undefined;
          const NotesLatestDate: string | undefined = notes![0].updatedAt;
          // update the notes array to delete the notes from state
          setNotes((prev) => {
            let oldarray: Note[];
            let newarray: Note[] = [];
            if (prev) {
              oldarray = [...prev];
              let i = oldarray.length;
              while (i--) {
                var obj = oldarray[i];
                if (notesSelected.indexOf(obj._id) === -1) {
                  // Not Item to be removed found
                  newarray.push(obj);
                }
              }
              const updated = newarray.reverse();
              if (updated.length > 0) {
                updatedNotesLatestDate = updated[0].updatedAt;
              }
              return updated;
            }
          });
          if (
            updatedNotesLatestDate !== undefined &&
            notebookId !== undefined &&
            NotesLatestDate
          ) {
            if (
              new Date(updatedNotesLatestDate).getTime() !==
              new Date(NotesLatestDate).getTime()
            ) {
              let nID = String(notebookId);
              updateNotebookDate(nID, updatedNotesLatestDate);
            }
          }
          cancelEditNoteFormHandler();
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  };

  const editNotebookDateHandler = async (
    notebookID: string,
    notebookUpdated: string
  ) => {
    if (token && notebookID && notebookUpdated) {
      try {
        const response = await editNotebookDate(
          token,
          notebookID,
          notebookUpdated
        );
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

  const deleteNotebookHandler = async () => {
    const notebook_id = notebook!._id;
    if (token && notebook_id && notebook_id.length > 0) {
      try {
        const response = await deleteNotebook(token, notebook_id);
        if (response.error) {
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          navigate(`/notebooks`);
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  };

  const editNotebookHandler = async (
    notebookID: string,
    notebookName: string,
    notebookCover: string,
    notebookUpdated: string
  ) => {
    if (
      token &&
      notebookID &&
      notebookName &&
      notebookCover &&
      notebookUpdated
    ) {
      try {
        const response = await editNotebook(
          token,
          notebookID,
          notebookName,
          notebookCover,
          notebookUpdated
        );
        if (response.error) {
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          setNotebook(response.notebook_edited);
          dispatch(editActions.editStatus({ status: false }));
          dispatch(
            editActions.editChange({
              message: response.notebook_edited,
            })
          );
          setEnableEditNotebook(false);
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  };

  const getLatestUpdated = (selected: string[]) => {
    let found_notes = [];
    for (const i in selected) {
      if (notes) {
        var result = notes.filter((obj) => {
          return obj._id === selected[i];
        });
        found_notes.push(result[0]);
      }
    }
    let selected_notes = sortNotes(found_notes);
    return selected_notes[0].updatedAt;
  };

  const moveNoteHandler = async (notebookID: string) => {
    let notesSelected: string[];
    if (
      token &&
      notebookID &&
      isSelected !== null &&
      isSelected !== undefined
    ) {
      notesSelected = isSelected.selected;
      const latestUpdatedDate = getLatestUpdated(notesSelected);
      try {
        const response = await moveNotes(
          token,
          notebookID,
          notesSelected,
          latestUpdatedDate
        );
        if (response.error) {
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          let updatedNotesLatestDate: string | undefined;
          // update the notes array to delete the notes from state
          setNotes((prev) => {
            let oldarray: Note[];
            let newarray: Note[] = [];
            if (prev) {
              oldarray = [...prev];
              let i = oldarray.length;
              while (i--) {
                var obj = oldarray[i];
                if (notesSelected.indexOf(obj._id) === -1) {
                  // Not Item to be removed found
                  newarray.push(obj);
                }
              }
              const updated = newarray.reverse();
              if (updated.length > 0) {
                updatedNotesLatestDate = updated[0].updatedAt;
              }
              return updated;
            }
          });

          if (
            updatedNotesLatestDate !== undefined &&
            notebookId !== undefined
          ) {
            let nID = String(notebookId);
            updateNotebookDate(nID, updatedNotesLatestDate);
          }
          // Close the dialogue
          setMoveNote(false);
          // Reset
          cancelEditNoteFormHandler();
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  };

  return (
    <Fragment>
      {(!notebookLoaded || !notesLoaded) && <LoadingScreen />}
      {notebookLoaded && notesLoaded && notebook && notes && (
        <div className="page_scrollable_header_breadcrumb_footer_list">
          {notes && notebook && notesLoaded && (
            <NoteListMemo
              notes={notes}
              onNotesSelected={updateSelected}
              onNotesEdit={editNotes}
              onClearNotesEdit={clearEditNotes}
            />
          )}
          {moveNote && userNotebooks && (
            <Suspense fallback={<div>Loading...</div>}>
              <SelectNotebookForm
                notebooks={userNotebooks}
                moveNotes={moveNoteHandler}
                onCancel={cancelHandler}
              />
            </Suspense>
          )}
          {enableEditNotebook && (
            <Suspense fallback={<div>Loading...</div>}>
              <AddNotebookForm
                method="edit"
                notebook={notebook}
                editNotebook={editNotebookHandler}
                onCancel={cancelEditHandler}
              />
            </Suspense>
          )}
        </div>
      )}
      <Footer>
        {notebookLoaded && notesLoaded && !editNotes && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={addNoteFormHandler}
          >
            <NoteAddIcon sx={{ mr: 1 }} />
            Add Note
          </Fab>
        )}

        {notebookLoaded &&
          notesLoaded &&
          !editNotes &&
          notes &&
          notes.length > 0 && (
            <Fab
              variant="extended"
              color="secondary"
              size="medium"
              onClick={editNoteFormHandler}
            >
              <EditIcon sx={{ mr: 1 }} />
              Edit Notes
            </Fab>
          )}

        {notebookLoaded && notesLoaded && notes && notes.length < 1 && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={deleteNotebookHandler}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Notebook
          </Fab>
        )}

        {notebookLoaded &&
          notesLoaded &&
          editNotes &&
          isSelected &&
          isSelected.selected.length > 0 && (
            <Fragment>
              <Fab
                variant="extended"
                color="secondary"
                size="medium"
                onClick={deleteNoteHandler}
              >
                <DeleteIcon sx={{ mr: 1 }} />
                Delete
              </Fab>
              {userNotebooks && userNotebooks.length > 1 && (
                <Fab
                  variant="extended"
                  color="secondary"
                  size="medium"
                  onClick={moveNoteFormHandler}
                >
                  <FlipToFrontIcon sx={{ mr: 1 }} />
                  Move
                </Fab>
              )}
            </Fragment>
          )}

        {notebookLoaded && notesLoaded && editNotes && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={cancelEditNoteFormHandler}
          >
            <CancelIcon sx={{ mr: 1 }} />
            Cancel
          </Fab>
        )}
      </Footer>
    </Fragment>
  );
};

const NoteListMemo = memo(NoteList);
export default memo(NotebookPage);
