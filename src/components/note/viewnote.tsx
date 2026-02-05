import { useState, useEffect, Fragment, memo } from "react";
import matter from "gray-matter";
import classesShared from "./editviewnote_shared.module.css";
import { NoteEditorView } from "../../types";
import ViewNoteMarkdown from "./viewnote_markdown";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { Skeleton } from "@mui/material";
import { Buffer } from "buffer";

// Required for gray-matter library
window.Buffer = window.Buffer || Buffer;

const ViewNote = (props: NoteEditorView) => {
  const splitscreen = props.splitScreen;
  const isVisible = props.visible;

  const { content } = matter(props.viewText);
  const [contextView, setContextView] = useState("");
  const [isSplitScreen, setIsSplitScreen] = useState(splitscreen);
  const [isLoaded, setIsLoaded] = useState(false);

  const updateViewText = (a: any) => {
    props.updatedViewText(a);
  };

  useEffect(() => {
    if (content !== contextView) {
      setContextView(content);
    }
    setIsLoaded(true);
    return () => {};
  }, [content, contextView]);

  useEffect(() => {
    setIsSplitScreen(splitscreen);
  }, [splitscreen]);

  return (
    <Fragment>
      <div
        id="view"
        className={`view ${
          isSplitScreen ? `view_split ${classesShared.show}` : ""
        } ${classesShared.editnote_box} ${
          isVisible ? classesShared.show : classesShared.hide
        }`}
      >
        <Card sx={{ width: "100%" }}>
          <CardContent>
            <article
              id="viewnote_id"
              className={`viewnote_content viewer ${classesShared.viewnote_content}`}
            >
              {!isLoaded ? (
                <Skeleton variant="rounded" height={50} />
              ) : (
                <ViewNoteMarkdown
                  splitScreen={splitscreen}
                  viewText={contextView}
                  updatedViewText={updateViewText}
                  disableLinks={false}
                />
              )}
            </article>
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
};

export default memo(ViewNote);
