import {
  Fragment,
  useEffect,
  useState,
  useContext,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { Notebook, NotebooksListProps } from "../../types";
import classes from "./notebooks-list.module.css";
import { uiActions } from "../../store/ui-slice";
import { useAppDispatch } from "../../store/hooks";
import Footer from "../layout/footer";
import { AuthContext } from "../../context/AuthContext";
import NotebookListItem from "./notebook-list-item";
import LoadingScreen from "../ui/loading-screen";
import Fab from "@mui/material/Fab";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { addNotebook } from "../../helpers/addNotebook";

const AddNotebookForm = lazy(() => import("./add-notebook-form"));

const useAuth = () => {
  return useContext(AuthContext);
};

const NotebooksList = (props: NotebooksListProps) => {
  const { authContext } = useAuth();
  const { token } = authContext;

  const dispatch = useAppDispatch();

  const [enableAddNotebook, setEnableAddNotebook] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[] | []>([]);

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
    if (
      props.notebooks &&
      props.notebooks.success &&
      props.notebooks.notebooks
    ) {
      const noteBooksArray = props.notebooks.notebooks;
      setNotebooks(noteBooksArray);
    }
    if (props.notebooks && props.notebooks.error) {
      dispatch(
        uiActions.showNotification({
          status: "error",
          title: "Error!",
          message: props.notebooks.error,
        })
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
    notebook_cover: string
  ) => {
    if (token) {
      try {
        setEnableAddNotebook(false);
        const response = await addNotebook(
          token,
          notebook_name,
          notebook_cover
        );
        if (response.error) {
          showNotification(`${response.error}`);
          return;
        }
        if (response.success) {
          console.log(response.error);
          setNotebooks((prevNotebooks) => [
            {
              _id: response.notebook._id,
              notebook_name: response.notebook.notebook_name,
              notebook_cover: response.notebook.notebook_cover,
              updatedAt: response.notebook.updatedAt,
              createdAt: response.notebook.createdAt,
            },
            ...prevNotebooks,
          ]);
        }
      } catch (err) {
        showNotification(`${err}`);
        return;
      }
    }
  };

  return (
    <Fragment>
      <div>
        {!notebooks && <LoadingScreen />}
        {notebooks && (
          <ul className={classes.notebooks_list}>
            {notebooks.map((notebook, index) => (
              <div key={index}>
                <NotebookListItem notebook_item={notebook} />
              </div>
            ))}
          </ul>
        )}
        {enableAddNotebook && (
          <Suspense fallback={<div>Page is Loading...</div>}>
            <AddNotebookForm
              method="create"
              addNotebook={addNotebookHandler}
              onCancel={cancelHandler}
            />
          </Suspense>
        )}
      </div>
      <Footer>
        {notebooks && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={addNotebookFormHandler}
          >
            <AddCircleIcon sx={{ mr: 1 }} />
            Add Notebook
          </Fab>
        )}
      </Footer>
    </Fragment>
  );
};

export default NotebooksList;
