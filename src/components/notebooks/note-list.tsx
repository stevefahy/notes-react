import { Fragment, useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import classes from "./note-list.module.css";
import { Note, SelectedNote, CheckedNote, NotesProps } from "../../types";
import DateFormat from "../ui/date-format";
import ViewNoteThumb from "../note/viewnotethumb";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

const NoteList = (props: NotesProps) => {
  const [notes, setNotes] = useState<Note[] | []>();
  const [isChecked, setIsChecked] = useState<CheckedNote[]>([]);
  const [isSelected, setIsSelected] = useState<SelectedNote>();

  const { onNotesSelected } = props;
  const { onNotesEdit } = props;
  const { onClearNotesEdit } = props;
  const props_notes = props.notes;

  useEffect(() => {
    if (onClearNotesEdit) {
      setIsSelected((state) => {
        return { ...state, selected: [] };
      });
    }
  }, [onClearNotesEdit]);

  useEffect(() => {
    if (props_notes) {
      // Set the initial notes array
      setNotes((prev) => {
        let newarray: Note[] = props_notes;
        return newarray;
      });

      let newarray: CheckedNote[] = [];
      props_notes.forEach((note) => {
        // Set the checkboxes initial value to false
        setIsChecked((prev) => {
          let newnote = { id: note._id, selected: false };
          newarray.push(newnote);
          return newarray;
        });
      });
    }
  }, [props_notes]);

  useEffect(() => {
    if (isSelected) {
      onNotesSelected(isSelected);
    }
  }, [isSelected, onNotesSelected]);

  const updateCheckbox = (checked_id: string, checked: boolean) => {
    setIsChecked((prev) => {
      // Update the checkbox selected status for each note
      let newarray: CheckedNote[] = [...prev];
      const is = isChecked?.findIndex((x) => x.id === checked_id);
      if (is >= 0 && newarray.length > 0) {
        newarray[is].selected = checked;
      }
      return newarray;
    });

    setIsSelected((state) => {
      // Replace the selected note array with the currently selected notes
      let newarray: SelectedNote = { selected: [] };
      isChecked?.forEach((x) => {
        if (x.selected) {
          newarray.selected.push(x.id);
        }
      });
      return { ...state, selected: newarray.selected };
    });
  };

  const checkboxStatus = (event: React.FormEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    const { checked } = target;
    const checked_id = target.value;
    updateCheckbox(checked_id, checked);
  };

  const divStatus = (id: any) => {
    const target: HTMLInputElement = document.getElementById(
      `input_${id}`
    ) as HTMLInputElement;
    let { checked } = target;
    const checked_id = target.value;
    target.checked = !checked;
    checked = target.checked;
    updateCheckbox(checked_id, checked);
  };

  const NoteLinkHandler = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNotesEdit) {
      event.preventDefault();
    }
  };

  const EditLinkHandler = (noteid: string) => {
    if (onNotesEdit) {
      divStatus(noteid);
    }
  };

  return (
    <Fragment>
      {notes && (
        <ul className={classes.notes_list}>
          {notes.map((note) => (
            <li key={note._id} className={classes.notebook_list_bg}>
              <div className={classes.thumb_outer}>
                <Link
                  className={classes.thumb_outer_link}
                  onClick={NoteLinkHandler}
                  to={`/notebook/${note.notebook}/${note._id}`}
                >
                  <div className={classes.thumb_outer_link}>
                    <div
                      id={note._id}
                      className={classes.edit_link}
                      onClick={() => EditLinkHandler(note._id)}
                    >
                      <Card
                        sx={{ width: "100%" }}
                        className={classes.note_list_card}
                      >
                        <CardContent className={classes.cardcontent}>
                          <div className={classes.thumb_image}>
                            <ViewNoteThumbMemo text={note.note} />
                          </div>
                          <div className="date_format date_format_notes">
                            <DateFormat dateString={note.updatedAt!} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </Link>
                {onNotesEdit && (
                  <div className={classes.thumb_select}>
                    <input
                      id={`input_${note._id}`}
                      type="checkbox"
                      name="Status"
                      value={note._id}
                      onChange={checkboxStatus}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Fragment>
  );
};

const ViewNoteThumbMemo = memo(ViewNoteThumb);
export default memo(NoteList);
