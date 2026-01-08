import { Link } from "react-router-dom";
import classes from "./notebooks-list.module.css";
import DateFormat from "../ui/date-format";
import { Fragment, useEffect, useState } from "react";
import { NotebookItem } from "../../types";
import { Card, CardContent, Skeleton } from "@mui/material";

const NotebookListItem = (props: NotebookItem) => {
  const { notebook_item } = props;
  const [notebookLoaded, setNotebookLoaded] = useState(false);

  useEffect(() => {
    let loadedTimer: NodeJS.Timeout;
    loadedTimer = setTimeout(() => {
      setNotebookLoaded(true);
    }, 100);
    return () => {
      clearTimeout(loadedTimer);
    };
  }, [notebook_item]);

  const notebook_item_html = (
    <li className={`${classes.notebooks_list_bg}`}>
      <Card sx={{ width: "100%" }}>
        <CardContent className={classes.cardcontent}>
          <div className={classes.notebooks_list_outer}>
            <div
              className={`${classes.notebooks_list_left}  ${
                classes[
                  !notebookLoaded ? "" : "tab_" + notebook_item.notebook_cover
                ]
              }`}
            >
              {!notebookLoaded ? (
                <Skeleton variant="rounded" sx={{ height: "100%" }} />
              ) : (
                ""
              )}
            </div>
            <div className={classes.notebooks_list_right}>
              {!notebookLoaded ? (
                <Fragment>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </Fragment>
              ) : (
                <Fragment>
                  <div>{notebook_item.notebook_name}</div>
                  <div className="date_format">
                    <DateFormat dateString={notebook_item.updatedAt!} />
                  </div>
                </Fragment>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );

  return (
    <Fragment>
      {!notebookLoaded ? (
        notebook_item_html
      ) : (
        <Link to={`/notebook/${notebook_item._id}`} key={notebook_item._id}>
          {notebook_item_html}
        </Link>
      )}
    </Fragment>
  );
};

export default NotebookListItem;
