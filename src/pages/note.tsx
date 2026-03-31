import { useParams, useNavigate, useBlocker } from "react-router-dom";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  useContext,
  useRef,
} from "react";
import { editActions } from "../store/edit-slice";
import { useAppDispatch } from "../store/hooks";
import { dispatchErrorSnack, dispatchSuccessSnack } from "../lib/dispatchSnack";
import {
  alignNotePanesScroll,
  captureSplitEnterScrollSnap,
  detachScrollSyncListeners,
  initScrollSync,
  stabilizeSplitEnterScroll,
} from "../lib/scroll_sync";
import {
  commitNoteShellTransition,
  getNoteShellEditViewTransitionCleanupMs,
  getNoteShellSplitTransitionCleanupMs,
} from "../lib/noteShellDom";
import type { NoteShellLayout } from "../lib/noteShellDom";
import { useNoteShellSwipeNavigation } from "../lib/useNoteShellSwipeNavigation";
import useWindowDimensions from "../lib/useWindowDimension";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { AuthContext } from "../context/AuthContext";
import Footer from "../components/layout/footer";
import EditNote from "../components/note/editnote";
import ViewNote from "../components/note/viewnote";
import LoadingScreen from "../components/ui/loading-screen";
import { getNotebook } from "../helpers/getNotebook";
import { getNote } from "../helpers/getNote";
import { createNote } from "../helpers/createNote";
import { saveNote } from "../helpers/saveNote";
import { useWelcomeNoteBody } from "./note/useWelcomeNoteBody";

const useAuth = () => {
  return useContext(AuthContext);
};

type PersistOpts = {
  showSnack: boolean;
  switchToViewAfterSave: boolean;
};

const NotePage = () => {
  const { authContext } = useAuth();
  const { token } = authContext;
  const { notebookId, noteId } = useParams();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { width, height } = useWindowDimensions();
  const WELCOME_NOTE = useWelcomeNoteBody();

  const reportError = useCallback(
    (err: unknown, fromServer?: boolean) => {
      dispatchErrorSnack(dispatch, err, fromServer);
    },
    [dispatch],
  );

  const [viewText, setViewText] = useState("");
  const [loadedText, setLoadedText] = useState("");
  const [isChanged, setIsChanged] = useState(false);
  const [isView, setIsView] = useState(noteId !== "create-note");
  const [isSplitScreen, setIsplitScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreate, setIsCreate] = useState(noteId === "create-note");
  const [originalText, setOriginalText] = useState("");
  const [updateEditTextProp, setUpdateEditTextProp] = useState("");
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [notebookLoaded, setNotebookLoaded] = useState(false);

  useEffect(() => {
    if (width < APPLICATION_CONSTANTS.SPLITSCREEN_MINIMUM_WIDTH) {
      setIsplitScreen(false);
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, [width, height]);

  const prevIsSplitRef = useRef(isSplitScreen);
  const splitEnterFromRef = useRef<"edit" | "view" | null>(null);
  const viewContainerRef = useRef<HTMLDivElement | null>(null);
  const prevNoteShellLayoutRef = useRef<NoteShellLayout | null>(null);
  const splitPostAlignTimeoutRef = useRef<number | null>(null);
  const splitEnterSnapRef = useRef<ReturnType<
    typeof captureSplitEnterScrollSnap
  > | null>(null);
  const splitStabilizeCleanupRef = useRef<(() => void) | null>(null);
  const prevIsSplitForScrollRef = useRef(isSplitScreen);
  const prevNoteShellLayoutScrollRef = useRef<NoteShellLayout | null>(null);

  const noteShellLayout: NoteShellLayout = isSplitScreen
    ? "split"
    : isView
      ? "view"
      : "edit";

  const swipeGoToView = useCallback(() => setIsView(true), []);
  const swipeGoToEdit = useCallback(() => setIsView(false), []);

  const noteShellReady = noteLoaded && token !== null;

  useNoteShellSwipeNavigation(
    viewContainerRef,
    noteShellLayout,
    swipeGoToView,
    swipeGoToEdit,
    noteShellReady,
  );

  useLayoutEffect(() => {
    if (!prevIsSplitRef.current && isSplitScreen) {
      splitEnterFromRef.current = isView ? "view" : "edit";
    }
    prevIsSplitRef.current = isSplitScreen;
  }, [isSplitScreen, isView]);

  useLayoutEffect(() => {
    const el = viewContainerRef.current;
    const prev = prevNoteShellLayoutRef.current;
    if (prev !== null && prev !== noteShellLayout) {
      commitNoteShellTransition(el, prev, noteShellLayout);
    }
    prevNoteShellLayoutRef.current = noteShellLayout;
  }, [noteShellLayout]);

  useLayoutEffect(() => {
    const prevLayout = prevNoteShellLayoutScrollRef.current;
    const editViewTransition =
      prevLayout !== null &&
      ((prevLayout === "edit" && noteShellLayout === "view") ||
        (prevLayout === "view" && noteShellLayout === "edit"));

    const wasSplit = prevIsSplitForScrollRef.current;
    const leavingSplit = wasSplit && !isSplitScreen;
    const enteringSplit = !wasSplit && isSplitScreen;
    prevIsSplitForScrollRef.current = isSplitScreen;

    if (leavingSplit || enteringSplit || editViewTransition) {
      detachScrollSyncListeners();
    }

    if (splitPostAlignTimeoutRef.current !== null) {
      window.clearTimeout(splitPostAlignTimeoutRef.current);
      splitPostAlignTimeoutRef.current = null;
    }
    splitStabilizeCleanupRef.current?.();
    splitStabilizeCleanupRef.current = null;

    let raf1 = 0;
    let raf2 = 0;
    const splitFrom = splitEnterFromRef.current;
    const snapCaptured = splitEnterSnapRef.current;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!isSplitScreen) {
          if (leavingSplit) {
            const exitSettleMs = getNoteShellSplitTransitionCleanupMs() + 120;
            splitPostAlignTimeoutRef.current = window.setTimeout(() => {
              splitPostAlignTimeoutRef.current = null;
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  splitEnterFromRef.current = null;
                  initScrollSync();
                });
              });
            }, exitSettleMs);
            return;
          }
          if (editViewTransition) {
            const settleMs = getNoteShellEditViewTransitionCleanupMs() + 120;
            splitPostAlignTimeoutRef.current = window.setTimeout(() => {
              splitPostAlignTimeoutRef.current = null;
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  alignNotePanesScroll(noteShellLayout, null);
                  splitEnterFromRef.current = null;
                  initScrollSync();
                });
              });
            }, settleMs);
            return;
          }
          alignNotePanesScroll(noteShellLayout, null);
          splitEnterFromRef.current = null;
          initScrollSync();
          return;
        }

        const splitEnterWithOrigin = splitFrom !== null;
        if (splitEnterWithOrigin) {
          splitEnterFromRef.current = null;
        }

        if (splitEnterWithOrigin && snapCaptured) {
          splitEnterSnapRef.current = null;
          const splitStabilizeMs = getNoteShellSplitTransitionCleanupMs() + 120;
          splitStabilizeCleanupRef.current = stabilizeSplitEnterScroll(
            snapCaptured,
            splitStabilizeMs,
            () => {
              splitStabilizeCleanupRef.current = null;
              initScrollSync();
            },
          );
          return;
        }

        if (splitEnterWithOrigin) {
          splitPostAlignTimeoutRef.current = window.setTimeout(() => {
            splitPostAlignTimeoutRef.current = null;
            alignNotePanesScroll("split", splitFrom);
            initScrollSync();
          }, getNoteShellSplitTransitionCleanupMs());
          return;
        }

        alignNotePanesScroll("split", null);
        initScrollSync();
      });
    });
    prevNoteShellLayoutScrollRef.current = noteShellLayout;
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (splitPostAlignTimeoutRef.current !== null) {
        window.clearTimeout(splitPostAlignTimeoutRef.current);
        splitPostAlignTimeoutRef.current = null;
      }
      splitStabilizeCleanupRef.current?.();
      splitStabilizeCleanupRef.current = null;
    };
  }, [noteShellLayout, isSplitScreen]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      initScrollSync();
    }, 500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const creating = noteId === "create-note";
    setIsCreate(creating);
    setIsView(!creating);
  }, [noteId]);

  useEffect(() => {
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
            reportError(response.error, response.fromServer);
            return;
          }
          if (response.success) {
            setViewText(response.note.note);
            setLoadedText(response.note.note);
            setOriginalText(response.note.note);
            setNoteLoaded(true);
          }
        } catch (err) {
          reportError(err, false);
          setNoteLoaded(true);
          return;
        }
      } else {
        setNoteLoaded(true);
      }
    })();

    (async () => {
      if (!notebookLoaded && token && notebookId) {
        setNotebookLoaded(false);
        try {
          const response = await getNotebook(token, notebookId);
          setNotebookLoaded(true);
          if (response.error) {
            reportError(response.error, response.fromServer);
            return;
          }
          if (response.success) {
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
  }, [
    token,
    dispatch,
    notebookId,
    noteId,
    isCreate,
    noteLoaded,
    notebookLoaded,
    reportError,
  ]);

  const toggleEditHandlerCallback = useCallback(() => {
    setIsView(!isView);
  }, [isView]);

  const toggleSplitHandlerCallback = useCallback(() => {
    if (!isSplitScreen) {
      splitEnterSnapRef.current = captureSplitEnterScrollSnap(isView);
    } else {
      splitEnterSnapRef.current = null;
    }
    setIsplitScreen(!isSplitScreen);
  }, [isSplitScreen, isView]);

  const persistNote = useCallback(
    async (opts: PersistOpts): Promise<boolean> => {
      if (!token || !notebookId || !noteId || !viewText || isCreate) {
        return true;
      }
      if (!isChanged) {
        return true;
      }
      try {
        const response = await saveNote(token, notebookId, noteId, viewText);
        if (response.error) {
          reportError(response.error, response.fromServer);
          return false;
        }
        if (response.success) {
          setIsChanged(false);
          setOriginalText(viewText);
          if (opts.showSnack) {
            dispatchSuccessSnack(dispatch, "Note Saved");
          }
          if (opts.switchToViewAfterSave && !isView) {
            toggleEditHandlerCallback();
          }
          return true;
        }
      } catch (err) {
        reportError(err, false);
        return false;
      }
      return false;
    },
    [
      isView,
      noteId,
      notebookId,
      viewText,
      token,
      reportError,
      dispatch,
      isChanged,
      isCreate,
      toggleEditHandlerCallback,
    ],
  );

  const persistRef = useRef(persistNote);
  persistRef.current = persistNote;

  const shouldBlock = useCallback(
    ({
      currentLocation,
      nextLocation,
    }: {
      currentLocation: { pathname: string };
      nextLocation: { pathname: string };
    }) =>
      isChanged &&
      !isCreate &&
      currentLocation.pathname !== nextLocation.pathname,
    [isChanged, isCreate],
  );

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state !== "blocked") return;

    let cancelled = false;

    (async () => {
      const ok = await persistRef.current({
        showSnack: true,
        switchToViewAfterSave: false,
      });
      if (cancelled) return;
      if (ok) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blocker.state, blocker]);

  const handleSaveNoteClick = useCallback(() => {
    void persistNote({
      showSnack: true,
      switchToViewAfterSave: true,
    });
  }, [persistNote]);

  const exampleNote = () => {
    if (!isMobile) {
      splitEnterSnapRef.current = captureSplitEnterScrollSnap(isView);
      setIsplitScreen(true);
    }
    updatedViewTextHandler(WELCOME_NOTE);
  };

  const createNotePost = async () => {
    if (token && notebookId && viewText) {
      const note_obj = { notebookId: notebookId, note: viewText };
      try {
        const response = await createNote(token, note_obj);
        setNotebookLoaded(true);
        if (response.error) {
          reportError(response.error, response.fromServer);
          return;
        }
        if (response.success) {
          setIsCreate(false);
          setIsChanged(false);
          navigate(`/notebook/${notebookId}`);
        }
      } catch (err) {
        reportError(err, false);
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
    [originalText],
  );

  const updatedViewTextHandler = useCallback(
    (arg: string | ((prev: string) => string)) => {
      setViewText((prev) => {
        const next = typeof arg === "function" ? arg(prev) : arg;
        updateIsChanged(next);
        setUpdateEditTextProp(next);
        return next;
      });
    },
    [updateIsChanged],
  );

  return (
    <Fragment>
      {(!noteLoaded || token === null) && <LoadingScreen />}
      <div className="page_scrollable_header_breadcrumb_footer">
        {noteLoaded && token !== null && (
          <div
            ref={viewContainerRef}
            className={`view_container${
              isSplitScreen ? " editnote_box_split" : ""
            }`}
            id="view_container"
            data-note-layout={noteShellLayout}
          >
            <EditNote
              visible={!isView || isSplitScreen}
              splitScreen={isSplitScreen}
              loadedText={loadedText}
              updateViewText={updatedViewTextHandler}
              passUpdatedViewText={updateEditTextProp}
            />
            <ViewNote
              visible={isView || isSplitScreen}
              splitScreen={isSplitScreen}
              viewText={viewText}
              updatedViewText={updatedViewTextHandler}
            />
          </div>
        )}
      </div>

      <Footer>
        {noteLoaded ? (
          <div className="nb-footer-row">
            {viewText.length > 0 && !isCreate && isChanged ? (
              <button
                type="button"
                className="btn-action-primary"
                onClick={handleSaveNoteClick}
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
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Note
              </button>
            ) : null}
            {viewText.length > 0 && isCreate ? (
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => void createNotePost()}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M6 1v10M1 6h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Create Note
              </button>
            ) : null}
            {viewText.length === 0 && isCreate ? (
              <button
                type="button"
                className="btn-action-ghost example_button"
                onClick={exampleNote}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  egg
                </span>
                Example
              </button>
            ) : null}
            {!isSplitScreen ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={toggleEditHandlerCallback}
                aria-label={isView ? "Switch to Edit" : "Switch to View"}
              >
                {isView ? (
                  <>
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
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </>
                ) : (
                  <>
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
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View
                  </>
                )}
              </button>
            ) : null}
            {!isMobile ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={toggleSplitHandlerCallback}
                aria-label="Toggle split screen"
              >
                {isSplitScreen ? (
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
                  >
                    <rect x="6" y="2" width="12" height="20" rx="2" />
                  </svg>
                ) : (
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
                  >
                    <rect x="2" y="2" width="8" height="20" rx="2" />
                    <rect x="14" y="2" width="8" height="20" rx="2" />
                  </svg>
                )}
                Split Screen
              </button>
            ) : null}
          </div>
        ) : null}
      </Footer>
    </Fragment>
  );
};

export default NotePage;
