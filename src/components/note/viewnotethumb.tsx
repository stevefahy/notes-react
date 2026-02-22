import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import matter from "gray-matter";
import classes from "./viewnotethumb.module.css";
import { Skeleton } from "@mui/material";
import { Buffer } from "buffer";

const ViewNoteMarkdown = lazy(() => import("./viewnote_markdown"));

// Required for gray-matter library
window.Buffer = Buffer;

const ViewNoteThumb = (props: any) => {
	const { content } = matter(props.text);

	const [loaded, setLoaded] = useState(false);

	const updateViewText = useCallback(
		(a: any) => {
			props.updatedViewText = a;
		},
		[props]
	);

	useEffect(() => {
		let loadedTimer: NodeJS.Timeout;
		loadedTimer = setTimeout(() => {
			setLoaded(true);
		}, 600);
		return () => {
			clearTimeout(loadedTimer);
		};
	}, [content]);

	return !loaded ? (
		<Skeleton variant="rounded" height={15} />
	) : (
		<div className={classes.box}>
			<article className="viewnote_content viewnote_thumb">
				<Suspense fallback={<Skeleton variant="rounded" height={15} />}>
					<ViewNoteMarkdown
						viewText={content}
						updatedViewText={updateViewText}
						disableLinks={true}
					/>
				</Suspense>
			</article>
		</div>
	);
};

export default ViewNoteThumb;
