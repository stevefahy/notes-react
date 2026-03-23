import { Fragment, useEffect, useState, useContext, useCallback } from "react";
import { GetNotebooks, Notebook } from "../types";
import { dispatchErrorSnack } from "../lib/dispatchSnack";
import { useAppDispatch } from "../store/hooks";
import { AuthContext } from "../context/AuthContext";
import NotebooksList from "../components/notebooks/notebooks-list";
import LoadingScreen from "../components/ui/loading-screen";
import { getNotebooks } from "../helpers/getNotebooks";

/** Same as Svelte `NotebooksPage.svelte` `filterNotebooks`. */
const filterNotebooks = (notebooks: Notebook[]): Notebook[] => {
  if (!notebooks || notebooks.length === 0) return notebooks;
  const sorted = [...notebooks].map((x) => ({
    ...x,
    updatedAt:
      x.updatedAt === "No date" || !x.updatedAt
        ? "December 17, 1995 03:24:00"
        : x.updatedAt,
  }));
  sorted.sort((a, b) =>
    new Date(a.updatedAt!) > new Date(b.updatedAt!) ? 1 : -1,
  );
  return sorted.reverse();
};

const useAuth = () => {
  return useContext(AuthContext);
};

const NotebooksPage = () => {
  const dispatch = useAppDispatch();
  const { authContext } = useAuth();
  const { token } = authContext;

  const [notebooksLoaded, setNotebooksLoaded] = useState(false);
  const [userNotebooks, setUserNotebooks] = useState<GetNotebooks>();

  const reportError = useCallback(
    (err: unknown, fromServer?: boolean) => {
      dispatchErrorSnack(dispatch, err, fromServer);
    },
    [dispatch],
  );

  const loadNotebooks = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getNotebooks(token);
      if (response.error) {
        reportError(response.error, response.fromServer);
        setNotebooksLoaded(true);
        return;
      }
      if (response.success) {
        setUserNotebooks({
          ...response,
          notebooks: filterNotebooks(response.notebooks),
        });
        setNotebooksLoaded(true);
      }
    } catch (err) {
      reportError(err, false);
      setNotebooksLoaded(true);
    }
  }, [token, reportError]);

  useEffect(() => {
    if (!notebooksLoaded && token) {
      void loadNotebooks();
    }
  }, [token, notebooksLoaded, loadNotebooks]);

  return (
    <Fragment>
      {!notebooksLoaded && <LoadingScreen />}
      <div className="page_scrollable_header_breadcrumb_footer_list">
        {notebooksLoaded && userNotebooks?.notebooks && (
          <NotebooksList
            notebooks={userNotebooks}
            onNotebooksReload={loadNotebooks}
          />
        )}
      </div>
    </Fragment>
  );
};

export default NotebooksPage;
