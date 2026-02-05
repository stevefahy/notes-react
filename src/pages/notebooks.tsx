import {
  Fragment,
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import { GetNotebooks } from "../types";
import { uiActions } from "../store/ui-slice";
import { useAppDispatch } from "../store/hooks";
import { AuthContext } from "../context/AuthContext";
import NotebooksList from "../components/notebooks/notebooks-list";
import LoadingScreen from "../components/ui/loading-screen";
import { getNotebooks } from "../helpers/getNotebooks";

const useAuth = () => {
  return useContext(AuthContext);
};

const NotebooksPage = () => {
  const dispatch = useAppDispatch();
  const { authContext } = useAuth();
  const { token } = authContext;

  const [notebooksLoaded, setNotebooksLoaded] = useState(false);
  const [userNotebooks, setUserNotebooks] = useState<GetNotebooks>();
  const processedNotebooksRef = useRef<string | null>(null);

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

  // Get the Notebooks
  useEffect(() => {
    (async () => {
      if (!notebooksLoaded && token) {
        setNotebooksLoaded(false);
        try {
          const response = await getNotebooks(token);
          setNotebooksLoaded(true);
          if (response.error) {
            showNotification(`${response.error}`);
            return;
          }
          if (response.success) {
            setUserNotebooks(response);
          }
        } catch (err) {
          showNotification(`${err}`);
          setNotebooksLoaded(true);
          return;
        }
      }
    })();
  }, [token, notebooksLoaded, showNotification]);

  useEffect(() => {
    const notebooks_found = userNotebooks?.notebooks;
    const error_found = userNotebooks?.error;

    // Create a unique key from the notebooks array to track if we've processed it
    const notebooksKey = notebooks_found?.map((n) => n._id).join(",") || null;

    // Prevent infinite loop: only process if we haven't processed this exact set of notebooks
    if (notebooksKey && processedNotebooksRef.current === notebooksKey) {
      return;
    }

    if (notebooks_found && notebooks_found.length > 0) {
      // Set an old date for those notes without any updatedAt
      // Create a new array with updated dates (don't mutate the original)
      const notebooksWithDates = notebooks_found.map((x) => {
        if (x.updatedAt === "No date" || x.updatedAt === undefined) {
          return { ...x, updatedAt: "December 17, 1995 03:24:00" };
        }
        return x;
      });
      // Sort the notebooks by updatedAt (create a new array, don't mutate)
      const sortedNotebooks = [...notebooksWithDates]
        .sort((a, b) => {
          if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
            return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1;
          } else {
            return a.updatedAt !== undefined ? 1 : -1;
          }
        })
        .reverse();

      // Update state with the new sorted array
      setUserNotebooks({
        ...userNotebooks!,
        notebooks: sortedNotebooks,
      });
      processedNotebooksRef.current = notebooksKey; // Mark as processed
      setNotebooksLoaded(true);
    }

    if (error_found) {
      dispatch(
        uiActions.showNotification({
          status: "error",
          title: "Error!",
          message: userNotebooks.error,
        })
      );
    }
  }, [userNotebooks?.notebooks, dispatch, userNotebooks]);

  return (
    <Fragment>
      {!notebooksLoaded && <LoadingScreen />}
      <div className="page_scrollable_header_breadcrumb_footer_list">
        {notebooksLoaded && userNotebooks?.notebooks && (
          <NotebooksList notebooks={userNotebooks} />
        )}
      </div>
    </Fragment>
  );
};

export default NotebooksPage;
