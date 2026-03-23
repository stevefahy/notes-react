import { Fragment, useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useMatch } from "react-router-dom";
import { PageType, NotebookType } from "../../types";
import { getDisplayCover } from "../../lib/notebookCoverUtils";
import { useAppDispatch } from "../../store/hooks";
import { editActions } from "../../store/edit-slice";
import { useAppSelector } from "../../store/hooks";

const Breadcrumb = () => {
  const dispatch = useAppDispatch();
  const notification_edited = useAppSelector((state) => state.edit.edited);

  const location = useLocation();

  const [pageLayout, setPageLayout] = useState<PageType>("other");
  const [notebook, setNotebook] = useState<NotebookType>({
    id: "",
    name: "",
    cover: "sage",
  });

  const noteMatch = useMatch("/notebook/:notebookId/:noteId");
  const notebookOnlyMatch = useMatch({
    path: "/notebook/:notebookId",
    end: true,
  });

  useEffect(() => {
    const p = location.pathname;
    if (p === "/notebooks") {
      setPageLayout("notebooks");
    } else if (noteMatch) {
      setPageLayout("note");
    } else if (notebookOnlyMatch) {
      setPageLayout("notebook");
    } else if (p.startsWith("/profile")) {
      setPageLayout("profile");
    } else {
      setPageLayout("other");
    }

    if (p === "/notebooks") {
      setNotebook({ id: "", name: "", cover: "sage" });
    }
  }, [location.pathname, noteMatch, notebookOnlyMatch]);

  useEffect(() => {
    const m = notification_edited.message;
    if (m?.notebook_name && m?._id) {
      setNotebook({
        id: m._id,
        name: m.notebook_name,
        cover: getDisplayCover(m.notebook_cover ?? "default"),
      });
    }
  }, [notification_edited]);

  const sectionClasses = useMemo(() => {
    const base = "breadcrumb_container";
    if (pageLayout === "notebooks")
      return `${base} breadcrumb--notebooks breadcrumb--section`;
    if (pageLayout === "profile") return `${base} breadcrumb--section`;
    return base;
  }, [pageLayout]);

  const editNotebook = () => {
    dispatch(editActions.editStatus({ status: true }));
  };

  const notebooksLink = (
    <NavLink to="/notebooks" className="no_link">
      <span className="breadcrumb_group">
        <span className="breadcrumb_link_btn">Notebooks</span>
      </span>
    </NavLink>
  );

  return (
    <Fragment>
      {pageLayout !== "other" && (
        <div role="presentation" className={sectionClasses}>
          <div aria-label="breadcrumb" className="breadcrumbs_inner">
            {pageLayout === "profile" && (
              <Fragment>
                {notebooksLink}
                <span className="breadcrumb_link">
                  <span className="breadcrumb_link_icon">
                    <span className="breadcrumb_seperator">›</span>
                  </span>
                  Profile
                </span>
              </Fragment>
            )}

            {pageLayout === "notebooks" && (
              <span className="breadcrumb_group">
                <span className="breadcrumb_link">Notebooks</span>
              </span>
            )}

            {pageLayout === "notebook" && (
              <Fragment>
                {notebooksLink}
                {notebook.name ? (
                  <span className="breadcrumb_link">
                    <span className="breadcrumb_link_icon">
                      <span className="breadcrumb_seperator">›</span>
                    </span>
                    <span className="breadcrumb_link">{notebook.name}</span>
                  </span>
                ) : null}
                <div className="breadcrumb_edit_btn">
                  <button
                    type="button"
                    className="breadcrumb_edit_fab material-icons edit_icon edit_icon_small"
                    onClick={editNotebook}
                    aria-label="Edit notebook"
                  >
                    edit
                  </button>
                </div>
              </Fragment>
            )}

            {pageLayout === "note" && (
              <Fragment>
                {notebooksLink}
                {notebook.name ? (
                  <NavLink
                    to={`/notebook/${notebook.id}`}
                    className="breadcrumb_link"
                  >
                    <span className="breadcrumb_link_icon">
                      <span className="breadcrumb_seperator">›</span>
                    </span>
                    <span className="breadcrumb_link_btn">{notebook.name}</span>
                  </NavLink>
                ) : null}
                {notebook.name ? (
                  <span className="breadcrumb_link">
                    <span className="breadcrumb_link_icon">
                      <span className="breadcrumb_seperator">›</span>
                    </span>
                    Note
                  </span>
                ) : null}
              </Fragment>
            )}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Breadcrumb;
