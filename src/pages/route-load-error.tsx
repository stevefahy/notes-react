import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { dispatchErrorSnack } from "../lib/dispatchSnack";

/** Shown when a lazy route chunk fails to load (offline / network). */
const RouteLoadError = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatchErrorSnack(
      dispatch,
      "Unable to load this page. Please try again.",
      true,
    );
  }, [dispatch]);

  return (
    <div className="page_scrollable_header_breadcrumb_footer_list">
      <div className="loading_routes error-state">
        <p>Unable to load this page. Please try again.</p>
        <Link to="/notebooks" className="back-link">
          Back to Notebooks
        </Link>
        <button
          type="button"
          className="btn-action-ghost back-link"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default RouteLoadError;
