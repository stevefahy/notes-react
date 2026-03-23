import {
  Fragment,
  useContext,
  useState,
  useEffect,
  useCallback,
  memo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Note, Notebook, SelectedNote } from "../types";
import { AuthContext } from "../context/AuthContext";
import LoadingScreen from "../components/ui/loading-screen";
import NoteList from "../components/notebooks/note-list";
import SelectNotebookForm from "../components/notebooks/select-notebook-form";
import AddNotebookForm from "../components/notebooks/add-notebook-form";
import { dispatchErrorSnack } from "../lib/dispatchSnack";
import { toLegacyCover, type NotebookCoverType } from "../lib/folder-options";
import { editActions } from "../store/edit-slice";
import { editNotesActions } from "../store/edit-notes-slice";
import { useAppDispatch } from "../store/hooks";
import { useAppSelector } from "../store/hooks";
import Footer from "../components/layout/footer";
import { getNotebooks } from "../helpers/getNotebooks";
import { getNotebook } from "../helpers/getNotebook";
import { getNotes } from "../helpers/getNotes";
import { deleteNotes } from "../helpers/deleteNotes";
import { editNotebookDate } from "../helpers/editNotebookDate";
import { moveNotes } from "../helpers/moveNotes";
import { deleteNotebook } from "../helpers/deleteNotebook";
import { editNotebook } from "../helpers/editNotebook";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { useSortNotes } from "./notebook/useSortNotes";

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

  const reportError = useCallback(
    (err: unknown, fromServer?: boolean) => {
      dispatchErrorSnack(dispatch, err, fromServer);
    },
    [dispatch],
  );

  const sortNotes = useSortNotes();

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
    return () => {
      dispatch(editNotesActions.resetEditNotes());
    };
  }, [dispatch]);

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
            reportError(response.error, response.fromServer);
            return;
          }
          if (response.success) {
            const notes_sorted = sortNotes(response.notes);
            setNotes(notes_sorted);
            setNotesLoadedDelay(true);
          }
        } catch (err) {
          reportError(err, false);
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
            reportError(response.error, response.fromServer);
            return;
          }
          if (response.success) {
            setNotebook(response.notebook);
            dispatch(
              editActions.editChange({
                message: response.notebook,
              }),
            );
          }
        } catch (err) {
          reportError(err, false);
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
            reportError(response.error, response.fromServer);
            return;
          }
          if (response.success) {
            setUserNotebooks(response.notebooks);
          }
        } catch (err) {
          reportError(err, false);
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
    reportError,
  ]);

  const updateSelected = useCallback(
    (selected: SelectedNote) => {
      setIsSelected(selected);
      dispatch(editNotesActions.updateSelectedCount(selected.selected.length));
    },
    [dispatch],
  );

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
    dispatch(
      editNotesActions.setActiveAndCount({
        active: true,
        selectedCount: isSelected?.selected.length ?? 0,
      }),
    );
  };

  const resetNotesSelected = () => {
    setIsSelected((state) => {
      const newarray: SelectedNote = { selected: [] };
      return { ...state, selected: newarray.selected };
    });
  };

  const cancelEditNoteFormHandler = () => {
    setEditNotes(false);
    setClearEditNotes(true);
    resetNotesSelected();
    dispatch(editNotesActions.resetEditNotes());
  };

  const updateNotebookDate = (
    notebookId: string,
    notebookLatesDate: string,
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
          reportError(response.error, response.fromServer);
          return;
        }
        if (response.success) {
          let updatedNotesLatestDate: string | undefined;
          const NotesLatestDate: string | undefined = notes![0].updatedAt;
          // update the notes array to delete the notes from state
          setNotes((prev) => {
            let oldarray: Note[];
            const newarray: Note[] = [];
            if (prev) {
              oldarray = [...prev];
              let i = oldarray.length;
              while (i--) {
                const obj = oldarray[i];
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
              const nID = String(notebookId);
              updateNotebookDate(nID, updatedNotesLatestDate);
            }
          }
          cancelEditNoteFormHandler();
        }
      } catch (err) {
        reportError(err, false);
        return;
      }
    }
  };

  const editNotebookDateHandler = async (
    notebookID: string,
    notebookUpdated: string,
  ) => {
    if (token && notebookID && notebookUpdated) {
      try {
        const response = await editNotebookDate(
          token,
          notebookID,
          notebookUpdated,
        );
        if (response.error) {
          reportError(response.error, response.fromServer);
          return;
        }
        if (response.success) {
          setNotebook((prev) =>
            prev ? { ...prev, updatedAt: notebookUpdated } : prev,
          );
        }
      } catch (err) {
        reportError(err, false);
        return;
      }
    }
  };

  const deleteNotebookHandler = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      reportError(APPLICATION_CONSTANTS.ERROR_NETWORK, false);
      return;
    }
    const notebook_id = notebook!._id;
    if (token && notebook_id && notebook_id.length > 0) {
      try {
        const response = await deleteNotebook(token, notebook_id);
        if (response.error) {
          reportError(response.error, response.fromServer);
          return;
        }
        if (response.success) {
          navigate(`/notebooks`);
        }
      } catch (err) {
        reportError(err, false);
        return;
      }
    }
  };

  const editNotebookHandler = async (
    notebookID: string,
    notebookName: string,
    notebookCover: NotebookCoverType,
    notebookUpdated: string,
  ): Promise<boolean> => {
    if (
      !token ||
      !notebookID ||
      !notebookName ||
      !notebookCover ||
      !notebookUpdated
    ) {
      return false;
    }
    try {
      const response = await editNotebook(
        token,
        notebookID,
        notebookName,
        toLegacyCover(notebookCover),
        notebookUpdated,
      );
      if (response.error) {
        reportError(response.error, response.fromServer);
        return false;
      }
      if (response.success) {
        setNotebook(response.notebook_edited);
        dispatch(editActions.editStatus({ status: false }));
        dispatch(
          editActions.editChange({
            message: response.notebook_edited,
          }),
        );
        return true;
      }
    } catch (err) {
      reportError(err, false);
    }
    return false;
  };

  const getLatestUpdated = (selected: string[]) => {
    const found_notes = [];
    for (const i in selected) {
      if (notes) {
        const result = notes.filter((obj) => {
          return obj._id === selected[i];
        });
        found_notes.push(result[0]);
      }
    }
    const selected_notes = sortNotes(found_notes);
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
          latestUpdatedDate,
        );
        if (response.error) {
          reportError(response.error, response.fromServer);
          return;
        }
        if (response.success) {
          let updatedNotesLatestDate: string | undefined;
          // update the notes array to delete the notes from state
          setNotes((prev) => {
            let oldarray: Note[];
            const newarray: Note[] = [];
            if (prev) {
              oldarray = [...prev];
              let i = oldarray.length;
              while (i--) {
                const obj = oldarray[i];
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
            const nID = String(notebookId);
            updateNotebookDate(nID, updatedNotesLatestDate);
          }
          // Close the dialogue
          setMoveNote(false);
          // Reset
          cancelEditNoteFormHandler();
        }
      } catch (err) {
        reportError(err, false);
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
              key={notebookId}
              notes={notes}
              onNotesSelected={updateSelected}
              onNotesEdit={editNotes}
              onClearNotesEdit={clearEditNotes}
            />
          )}
          {moveNote && userNotebooks && (
            <SelectNotebookForm
              notebooks={userNotebooks}
              currentNotebookId={notebookId ?? null}
              moveNotes={moveNoteHandler}
              onCancel={cancelHandler}
            />
          )}
          {enableEditNotebook && (
            <AddNotebookForm
              method="edit"
              notebook={notebook}
              editNotebook={editNotebookHandler}
              onCancel={cancelEditHandler}
            />
          )}
        </div>
      )}
      <Footer>
        {notebookLoaded && notesLoaded ? (
          <div className="nb-footer-row">
            {!editNotes && notes && notes.length > 0 ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={editNoteFormHandler}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="media_query_size"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Notes
              </button>
            ) : null}
            {!editNotes ? (
              <button
                type="button"
                className="btn-action-primary"
                onClick={addNoteFormHandler}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                  className="media_query_size"
                >
                  <path
                    d="M6 1v10M1 6h10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Add Note
              </button>
            ) : null}
            {notes && notes.length < 1 ? (
              <button
                type="button"
                className="btn-action-danger"
                onClick={deleteNotebookHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon danger">
                    delete
                  </span>
                  Delete Notebook
                </span>
              </button>
            ) : null}
            {editNotes && isSelected && isSelected.selected.length > 0 ? (
              <button
                type="button"
                className="btn-action-danger"
                onClick={deleteNoteHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon danger media_query_size">
                    delete
                  </span>
                  Delete
                </span>
              </button>
            ) : null}
            {editNotes &&
            isSelected &&
            isSelected.selected.length > 0 &&
            userNotebooks &&
            userNotebooks.length > 1 ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={moveNoteFormHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon green symbol_size media_query_size">
                    flip_to_front
                  </span>
                  Move to…
                </span>
              </button>
            ) : null}
            {editNotes ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={cancelEditNoteFormHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon green media_query_size">
                    cancel
                  </span>
                  Cancel
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </Footer>
    </Fragment>
  );
};

const NoteListMemo = memo(NoteList);
export default memo(NotebookPage);
