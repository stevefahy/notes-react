import { Fragment, useEffect, useState, useContext, useCallback } from "react";
import { Notebook, NotebooksListProps } from "../../types";
import { dispatchErrorSnack } from "../../lib/dispatchSnack";
import {
  toLegacyCover,
  type NotebookCoverType,
} from "../../lib/folder-options";
import { useAppDispatch } from "../../store/hooks";
import Footer from "../layout/footer";
import { AuthContext } from "../../context/AuthContext";
import NotebookListItem from "./notebook-list-item";
import LoadingScreen from "../ui/loading-screen";
import { addNotebook } from "../../helpers/addNotebook";
import AddNotebookForm from "./add-notebook-form";

const useAuth = () => {
  return useContext(AuthContext);
};

const NotebooksList = (props: NotebooksListProps) => {
  const { authContext } = useAuth();
  const { token } = authContext;

  const dispatch = useAppDispatch();

  const [enableAddNotebook, setEnableAddNotebook] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[] | []>([]);

  const reportError = useCallback(
    (err: unknown, fromServer?: boolean) => {
      dispatchErrorSnack(dispatch, err, fromServer);
    },
    [dispatch],
  );

  useEffect(() => {
    if (
      props.notebooks &&
      props.notebooks.success &&
      props.notebooks.notebooks
    ) {
      const noteBooksArray = props.notebooks.notebooks;
      setNotebooks(noteBooksArray);
    }
    if (props.notebooks && props.notebooks.error) {
      dispatchErrorSnack(
        dispatch,
        props.notebooks.error,
        "fromServer" in props.notebooks
          ? props.notebooks.fromServer
          : undefined,
      );
    }
  }, [props.notebooks, dispatch]);

  const addNotebookFormHandler = () => {
    setEnableAddNotebook(true);
  };

  const cancelHandler = () => {
    setEnableAddNotebook(false);
  };

  const addNotebookHandler = async (
    notebook_name: string,
    notebook_cover: NotebookCoverType,
  ): Promise<boolean> => {
    if (!token) {
      return false;
    }
    try {
      const response = await addNotebook(
        token,
        notebook_name,
        toLegacyCover(notebook_cover),
      );
      if (response.error) {
        reportError(response.error, response.fromServer);
        return false;
      }
      if (response.success) {
        setEnableAddNotebook(false);
        await props.onNotebooksReload?.();
        return true;
      }
    } catch (err) {
      reportError(err, false);
    }
    return false;
  };

  return (
    <Fragment>
      <div>
        {!notebooks && <LoadingScreen />}
        {notebooks && (
          <div className="notebooks-list-wrap">
            <h2 className="page-heading">Your Notebooks</h2>
            <ul className="notebooks_list">
              {notebooks.map((notebook) => (
                <NotebookListItem key={notebook._id} notebook_item={notebook} />
              ))}
            </ul>
          </div>
        )}
        {enableAddNotebook && (
          <AddNotebookForm
            method="create"
            addNotebook={addNotebookHandler}
            onCancel={cancelHandler}
          />
        )}
      </div>
      <Footer>
        {notebooks && (
          <div className="fab-row">
            <button
              type="button"
              className="fab"
              onClick={addNotebookFormHandler}
              aria-label="New notebook"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              New Notebook
            </button>
          </div>
        )}
      </Footer>
    </Fragment>
  );
};

export default NotebooksList;
