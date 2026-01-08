import { Fragment, useEffect, useState, useContext, useCallback } from "react";
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
    if (notebooks_found && notebooks_found.length > 0) {
      // Set an old date for those notes without any updatedAt
      notebooks_found.map((x) => {
        if (x.updatedAt === "No date" || undefined) {
          x.updatedAt = "December 17, 1995 03:24:00";
        }
        return x;
      });
      // Sort the notebooks by updatedAt
      notebooks_found
        .sort((a, b) => {
          if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
            return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1;
          } else {
            return a.updatedAt !== undefined ? 1 : -1;
          }
        })
        .reverse();
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
  }, [userNotebooks, dispatch]);

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
