import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Components as SpecialComponents } from "react-markdown";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import atomDark from "react-syntax-highlighter/dist/cjs/styles/prism/atom-dark";
import js from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import css from "react-syntax-highlighter/dist/cjs/languages/prism/css";
import md from "react-syntax-highlighter/dist/cjs/languages/prism/markdown";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import ts from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import classesShared from "./editviewnote_shared.module.css";
import classes from "./viewnote_markdown.module.css";
import emoji from "remark-emoji";
import { visit } from "unist-util-visit";
import smartypants from "remark-smartypants";
import supersub from "remark-supersub";
import rehypeSlug from "rehype-slug";
import {
  ViewNoteMarkdownProps,
  SpecialChar,
  SourcePosition,
} from "../../types";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import { remarkCustomDirective } from "../../lib/remark-custom-directive";
import useWindowDimensions from "../../lib/useWindowDimension";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import Skeleton from "@mui/material/Skeleton/Skeleton";
import { stringifyPosition } from "unist-util-stringify-position";
import { useMemo } from "react";

SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("markdown", md);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("typeScript", ts);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("json", json);

const ViewNoteMarkdown = (props: ViewNoteMarkdownProps) => {
  const { content } = useMemo(() => matter(props.viewText), [props.viewText]);

  const disableLinks = props.disableLinks;
  const splitscreen = props.splitScreen;

  const [contextView, setContextView] = useState("");
  const [isSplitScreen, setIsSplitScreen] = useState(splitscreen);
  const { width, height, viewnote_width } = useWindowDimensions();
  const [windowDimensions, setWindowDimensions] = useState({
    width,
    height,
    viewnote_width,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWindowDimensions({ width, height, viewnote_width });
  }, [width, height, viewnote_width]);

  useEffect(() => {
    setIsSplitScreen(splitscreen);
  }, [splitscreen]);

  useEffect(() => {
    if (content !== contextView) {
      setContextView(content);
      setIsLoaded(true);
      return () => {
        // component unmount
      };
    }
  }, [content, contextView]);

  const onChangeCheckbox = (
    sourcePosition: SourcePosition,
    checked: boolean
  ) => {
    // Guard against undefined line numbers
    const lineNum = sourcePosition.start?.line;
    if (typeof lineNum !== "number") return;
    // Use 'content' (the current parsed markdown) as the source
    const lines = content.split("\n");
    const lineIndex = lineNum - 1;
    if (lines[lineIndex] !== undefined) {
      lines[lineIndex] = lines[lineIndex].replace(
        /\[\s*(x|\s)\s*\]/,
        checked ? "[x]" : "[ ]"
      );
      const newContent = lines.join("\n");
      // ONLY notify the parent.
      // The parent updates its state -> props.viewText changes -> 'content' recalculates.
      props.updatedViewText(newContent);
    }
  };

  const InputRenderer = ({ node, checked: propChecked, ...props }: any) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    // Sync the DOM checkbox only on initial mount or external prop changes (e.g., load/undo)
    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.checked = !!propChecked;
      }
    }, [propChecked]);

    const sourcePos = node?.properties?.dataSourcepos;
    if (!sourcePos) return <input type="checkbox" {...props} />;

    const [start] = sourcePos.split("-");
    const [sLine] = start.split(":").map(Number);

    return (
      <input
        type="checkbox"
        ref={checkboxRef}
        defaultChecked={!!propChecked} // Initial value only
        onChange={(e) => {
          const newChecked = e.target.checked;
          // Propagate to source
          onChangeCheckbox({ start: { line: sLine }, end: {} }, newChecked);
        }}
        style={{ cursor: "pointer", marginRight: "0.25em" }}
      />
    );
  };

  const ListWrapper: SpecialComponents["li"] = ({ children, ...props }) => {
    return <li {...props}>{children}</li>;
  };

  const TableCellRenderer = ({
    node,
    isHeader,
    children,
    align,
    ...props
  }: any) => {
    // React-markdown v9 passes 'align' as a prop
    const style: React.CSSProperties = align ? { textAlign: align } : {};

    return isHeader ? (
      <th style={style} {...props}>
        {children}
      </th>
    ) : (
      <td style={style} {...props}>
        {children}
      </td>
    );
  };

  const TableWrapper = (props: any) => {
    return <table className="table table-striped">{props.children}</table>;
  };

  const LinkRenderer = (props: any) => {
    let linkTarget = "_blank";
    if (disableLinks) {
      // Remove links in viewnotethumb.
      // They should not be avaialable here and cause a nested <a> error.
      return <span title={props.title}>{props.children}</span>;
    } else {
      if (props.href.charAt(0) === "#") {
        linkTarget = "_self";
      }
      // Open links in a new tab
      return (
        <a
          title={props.title}
          href={props.href}
          id={props.id}
          className={props.class}
          target={linkTarget}
          rel="noreferrer"
        >
          {props.children}
        </a>
      );
    }
  };

  const ImageRenderer = (props: any) => {
    // Get values from props (Markdown standard) OR node.properties (Rehype standard)
    const src = props.src || props.node?.properties?.src || "";
    const title = props.title || props.node?.properties?.title || "";
    const rawAlt = props.alt || props.node?.properties?.alt || "";
    // Fallback for dimensions
    let width: number = 100;
    let height: number = 100;
    let alt: string = "";
    // Parse Alt Tag logic (Your specific format)
    if (rawAlt) {
      const substrings = rawAlt.split("{{");
      alt = substrings[0].trim();
      if (substrings[1] && substrings[1].includes("}}")) {
        const wMatch = substrings[1].match(/w:\s?(\d+)/);
        const hMatch = substrings[1].match(/h:\s?(\d+)/);
        if (wMatch) width = parseInt(wMatch[1]);
        if (hMatch) height = parseInt(hMatch[1]);
      }
    }
    // Use the DIRECT hook values instead of the state variable to avoid stale closures
    const { width: winW, viewnote_width: viewW } = useWindowDimensions();
    let containerWidth = isSplitScreen ? winW / 2 : winW;
    const maxAllowedWidth =
      containerWidth - (APPLICATION_CONSTANTS.VIEWNOTE_PADDING || 0);
    let finalW = width;
    let finalH = height;
    if (width > maxAllowedWidth && maxAllowedWidth > 0) {
      const ratio = height / width;
      finalW = maxAllowedWidth;
      finalH = finalW * ratio;
    }
    return (
      <span
        className={classesShared.image}
        style={{
          display: "inline-block",
          width: Math.round(finalW),
          height: Math.round(finalH),
        }}
      >
        <img
          src={src}
          alt={alt}
          title={title}
          style={{ width: "100%", height: "100%" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/images/image-not-found-icon.svg";
          }}
        />
      </span>
    );
  };

  const replaceSpecialCharacters = (str: string): string => {
    const specialChars: SpecialChar[] =
      APPLICATION_CONSTANTS.SPECIAL_CHARACTERS;
    if (!str || typeof str !== "string") return str;
    let newString = str;
    const charsOnly = specialChars.map((a) => a.char);
    const hasSome = charsOnly.some((char) => str.includes(char));
    if (hasSome) {
      // Sort by length (longest first) to avoid partial replacements
      const sortedChars = [...specialChars].sort(
        (a, b) => b.char.length - a.char.length
      );
      for (const { char, display } of sortedChars) {
        // Use word boundaries or exact match to prevent partial replacements
        const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedChar, "g");
        newString = newString.replace(regex, display);
      }
      return newString;
    }
    return str;
  };

  const checkSpecialChars = (input: any): any => {
    if (typeof input === "string") {
      return replaceSpecialCharacters(input);
    }
    if (Array.isArray(input)) {
      return input.map((item) =>
        typeof item === "string" ? replaceSpecialCharacters(item) : item
      );
    }
    return input;
  };

  const Insert = (insTag: any) => {
    const { node, children } = insTag;
    let classes: string = "";
    let styleObj = null;
    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) {}
    }
    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }
    return (
      <ins className={classes} style={styleObj}>
        {children}
      </ins>
    );
  };

  const Delete = (delTag: any) => {
    const { node, children } = delTag;
    let classes: string = "delete_md ";
    let styleObj = null;
    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) {}
    }
    if (node.properties && node.properties.className) {
      classes += node.properties.className.join(" ");
    }
    return (
      <del className={classes} style={styleObj}>
        {children}
      </del>
    );
  };

  const Unit = (unitTag: any) => {
    const { node, children } = unitTag;
    let classes: string = "";
    let styleObj = null;
    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) {}
    }
    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }
    return (
      <small className={classes} style={styleObj}>
        {children}
      </small>
    );
  };

  const Mark = (markTag: any) => {
    const { node, children } = markTag;
    let classes: string = "";
    let styleObj = null;
    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) {}
    }
    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }
    return (
      <mark className={classes} style={styleObj}>
        {children}
      </mark>
    );
  };

  const Abbr = (abbrTag: any) => {
    const { node, children } = abbrTag;
    let classes: string = "";
    let styleObj = null;
    let title: string = "";
    if (node.properties.title) {
      title = node.properties.title;
    }
    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) {}
    }
    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }
    return (
      <abbr title={title} className={classes} style={styleObj}>
        {children}
      </abbr>
    );
  };

  const Custom = (customTag: any) => {
    const { node, children } = customTag;
    let classes: string = "";
    let styleObj = null;
    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) {}
    }
    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }
    return (
      <span className={classes} style={styleObj}>
        {children}
      </span>
    );
  };

  const customRenderers = useMemo(
    () => ({
      abbr: Abbr,

      custom: Custom,

      mark: Mark,

      unit: Unit,

      ins: Insert,

      delete: Delete,

      table: TableWrapper,

      th: (props: any) => <TableCellRenderer isHeader={true} {...props} />,

      td: (props: any) => <TableCellRenderer isHeader={false} {...props} />,

      li: ListWrapper,

      input: InputRenderer,

      img: ImageRenderer,

      a: LinkRenderer,

      p(paragraph: any) {
        const { children } = paragraph;
        const processedContent = checkSpecialChars(children);
        return (
          <p
            className="line"
            data-line={typeof children === "string" ? children.length : 0}
          >
            {processedContent}
          </p>
        );
      },

      code(code: any) {
        const { className, children, node } = code;
        const hasPosition =
          node.children[0] && node.children[0].position !== undefined;
        const inline = hasPosition;
        let language: string = "";
        if (className !== undefined) {
          language = className.split("-")[1]; // className is something like language-js => We need the "js" part here
        }
        return (
          <span className="highlightRoot">
            {inline ? (
              <span className="inlineCode">
                <code>{children}</code>
              </span>
            ) : (
              <span>
                <span className={classes.codebox}>
                  <SyntaxHighlighter
                    language={language}
                    style={atomDark}
                    showLineNumbers={false}
                    startingLineNumber={1}
                    children={children}
                  />
                </span>
                {language && (
                  <span className={classes.codebox_language}>
                    <p>{language}</p>
                  </span>
                )}
              </span>
            )}
          </span>
        );
      },

      section(section: any) {
        const { node, children } = section;
        let classes;
        if (node.properties && node.properties.className) {
          classes = node.properties.className.join(" ");
        }
        let data_attribute;
        if (node.properties && node.properties.dataFootnotes) {
          data_attribute = { "data-footnotes": "true" };
          let new_children = [...children];
          new_children.shift();
          return (
            <span className="footnotes_inner">
              <hr />
              <section className={classes} {...data_attribute}>
                {new_children}
              </section>
            </span>
          );
        }
        return <section className={classes}>{children}</section>;
      },
    }),
    []
  );

  function rehypePluginAddingIndex() {
    return (tree: any) => {
      visit(tree, "element", (node, index, parent) => {
        // Copy LI position onto checkbox input
        if (
          node.tagName === "input" &&
          node.properties?.type === "checkbox" &&
          parent?.tagName === "li" &&
          parent.position
        ) {
          node.properties ??= {};
          node.properties.dataSourcepos = stringifyPosition(parent.position);
        }
        // Keep existing behavior
        if (node.position) {
          node.properties ??= {};
          node.properties.dataSourcepos ??= stringifyPosition(node.position);
        }
      });
    };
  }

  function remarkEscapeColonsInLinks() {
    return (tree: any) => {
      visit(tree, "link", (linkNode) => {
        visit(linkNode, "text", (textNode) => {
          // Replace every ':' with ': ' (colon + zero-width space)
          // This breaks every possible emoticon/shortcode that starts with ':'
          if (textNode.value.includes(":")) {
            textNode.value = textNode.value.replace(/:/g, ":\u200B");
          }
        });
      });
      // Also protect autolinked URLs that end up as <a> with a single text child
      visit(tree, (node) => {
        if (
          node.type === "paragraph" &&
          node.children?.length === 1 &&
          node.children[0].type === "link" &&
          node.children[0].children?.length === 1 &&
          node.children[0].children[0].type === "text"
        ) {
          const textNode = node.children[0].children[0];
          if (textNode.value.includes(":")) {
            textNode.value = textNode.value.replace(/:/g, ":\u200B");
          }
        }
      });
    };
  }
  // Use 'content' (from useMemo) instead of 'contextView' (from state)
  return !isLoaded ? (
    <Skeleton variant="rounded" height={20} />
  ) : (
    <ReactMarkdown
      children={content}
      rehypePlugins={[
        rehypePluginAddingIndex,
        rehypeSlug,
        [
          rehypeSanitize,
          {
            ...defaultSchema,
            protocols: {
              ...defaultSchema.protocols,
              href: [
                ...(defaultSchema.protocols?.href || []),
                "http",
                "https",
                "mailto",
                "tel",
                "#",
              ],
            },
            tagNames: [
              ...(defaultSchema.tagNames || []),
              "small",
              "ins",
              "delete",
              "mark",
              "abbr",
              "custom",
              "section",
            ],
            attributes: {
              ...defaultSchema.attributes,
              "*": [
                ...(defaultSchema.attributes?.["*"] || []),
                "dataSourcepos",
                "id",
                "className",
              ],
              img: ["src", "alt", "title", "width", "height"],
              th: [...(defaultSchema.attributes?.th || []), "align"],
              td: [...(defaultSchema.attributes?.td || []), "align"],
              ol: [...(defaultSchema.attributes?.ol || []), "start"],
              input: [
                ...(defaultSchema.attributes?.input || []),
                "checked",
                "type",
              ],
              code: [
                ...(defaultSchema.attributes?.code || []),
                "className",
                "language-js",
                "language-css",
                "language-md",
                "language-ts",
                "language-typescript",
                "language-typeScript",
                "language-html",
                "language-bash",
                "language-json",
              ],
              small: ["title", "style"],
              ins: ["className", "style"],
              delete: ["className", "style"],
              mark: ["className", "style"],
              section: ["className", "style", "data*"],
              custom: ["className", "style"],
              abbr: ["className", "style", "title"],
            },
          },
        ],
      ]}
      remarkPlugins={[
        [remarkGfm, { tablePipeAlign: true, singleTilde: false }],
        remarkEscapeColonsInLinks,
        remarkCustomDirective,
        [remarkDirective, { directive: "custom" } as any],
        [remarkDirectiveRehype as any],
        [emoji as any, { padSpaceAfter: true, emoticon: true }],
        [
          smartypants as any,
          {
            quotes: true,
            ellipses: true,
            backticks: true,
            dashes: true,
          },
        ],
        [supersub],
      ]}
      components={customRenderers}
    />
  );
};

export default ViewNoteMarkdown;
