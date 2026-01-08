import { Fragment, useRef, useState, lazy, Suspense } from "react";
import classes from "./add-notebook-form.module.css";
import { FolderOptions } from "../../lib/folder-options";
import { NotebookAddEdit, NotebookCoverType } from "../../types";
import Button from "../ui/button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CancelIcon from "@mui/icons-material/Cancel";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";

const AC = APPLICATION_CONSTANTS;

const ErrorAlert = lazy(() => import("../ui/error-alert"));

const AddNotebookForm = (props: NotebookAddEdit) => {
  const [error, setError] = useState({ state: false, message: "" });
  const [selectedCover, setSelectedCover] =
    useState<NotebookCoverType>("default");
  const [selectedName, setSelectedName] = useState("");
  const [formChanged, setFormChanged] = useState(false);

  const notebookNameRef = useRef<HTMLInputElement>(null);

  let notebookName: string = "";
  let notebookCover: NotebookCoverType = "default";
  let originalName: string = "";
  let originalCover: NotebookCoverType = "default";

  if (props.method === "edit" && props.notebook) {
    originalName = notebookName = props.notebook.notebook_name;
    originalCover = notebookCover = props.notebook.notebook_cover;
  } else {
    originalName = notebookName;
    originalCover = notebookCover;
  }

  const checkForm = () => {
    if (!formChanged) {
      return true;
    } else {
      return false;
    }
  };

  const nameChangeHandler = (name: string) => {
    setSelectedName((prev) => name);
    if (name !== originalName || selectedCover !== originalCover) {
      setFormChanged((prev) => true);
    } else {
      setFormChanged((prev) => false);
    }
  };

  const coverChangeHandler = (cover: NotebookCoverType) => {
    setSelectedName((prev) => notebookNameRef.current!.value);
    setSelectedCover((prev) => cover);
    if (
      notebookNameRef.current!.value !== originalName ||
      (notebookNameRef.current!.value !== "" && cover !== originalCover)
    ) {
      setFormChanged((prev) => true);
    } else {
      setFormChanged((prev) => false);
    }
  };

  const cancelHandler = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setError({ state: false, message: "" });
    props.onCancel();
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setError({ state: false, message: "" });
    if (!selectedName || selectedName.length < AC.NOTEBOOK_NAME_MIN) {
      setError({
        state: true,
        message: `${AC.NOTEBOOK_NAME_MIN_ERROR}`,
      });
      return;
    }
    if (selectedName.length > AC.NOTEBOOK_NAME_MAX) {
      setError({
        state: true,
        message: `${AC.NOTEBOOK_NAME_MAX_ERROR}`,
      });
      return;
    }
    if (!selectedCover || selectedCover.length === 0) {
      setError({ state: true, message: AC.NOTEBOOK_COVER_EMPTY });
      return;
    }
    const notebook_name = notebookNameRef.current!.value;
    if (props.method === "edit" && props.notebook && props.editNotebook) {
      const notebookId = props.notebook._id;
      let updated = new Date().toISOString();
      if (props.notebook.updatedAt) {
        updated = props.notebook.updatedAt;
      }
      props.editNotebook(notebookId, notebook_name, selectedCover, updated);
    } else if (props.method === "create" && props.addNotebook) {
      props.addNotebook(notebook_name, selectedCover);
    }
  };

  return (
    <Fragment>
      <Dialog open={true}>
        <DialogTitle>
          {props.method === "edit" ? "Edit Notebook" : "Add Notebook"}
        </DialogTitle>
        <DialogContent>
          <form className={classes.form}>
            <div className={classes.control}>
              <label htmlFor="new-notebook">Name</label>
              <input
                type="text"
                id="new-notebook"
                ref={notebookNameRef}
                defaultValue={notebookName}
                onChange={(e) => {
                  nameChangeHandler(e.target.value);
                }}
              />
            </div>
            <div className={classes.control}>
              <label htmlFor="new-notebook-cover">Cover</label>
              <select
                name="cars"
                className={classes.select_dialogue}
                id="new-notebook-cover"
                defaultValue={notebookCover}
                onChange={(e) => {
                  coverChangeHandler(e.target.value as NotebookCoverType);
                }}
              >
                {FolderOptions.map((folder) => {
                  return (
                    <option key={folder.value} value={folder.value}>
                      {folder.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </form>
          <div className={classes.button_row}>
            <div
              className={checkForm() ? classes.action_disabled : classes.action}
            >
              {props.method === "create" && (
                <Button
                  disabled={checkForm()}
                  variant="contained"
                  color="secondary"
                  size="medium"
                  onClick={submitHandler}
                >
                  Add
                </Button>
              )}
              {props.method === "edit" && (
                <Button
                  variant="contained"
                  onClick={submitHandler}
                  disabled={checkForm()}
                >
                  Confirm
                </Button>
              )}
            </div>
            <div>
              <Button variant="contained" size="medium" onClick={cancelHandler}>
                <CancelIcon sx={{ mr: 1 }} />
                Cancel
              </Button>
            </div>
          </div>
          {error.state && (
            <Suspense fallback={<div>Loading...</div>}>
              <ErrorAlert>
                <div>{error.message}</div>
              </ErrorAlert>
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default AddNotebookForm;
