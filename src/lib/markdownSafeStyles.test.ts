import { describe, it, expect } from "vitest";
import {
  sanitizeCustomContainerStyles,
  sanitizeCustomCssClasses,
  sanitizeMarkdownTargetId,
} from "./markdownSafeStyles";

describe("sanitizeCustomContainerStyles", () => {
  it("keeps allowlisted declarations", () => {
    expect(
      sanitizeCustomContainerStyles("font-size: 12px; color: #fff;"),
    ).toBe("font-size: 12px; color: #fff");
  });

  it("keeps layout props used by welcome / custom blocks", () => {
    const raw =
      "font-size: 55px;  color: #1B3D29; height: 45px; display: table-cell; vertical-align: bottom;";
    expect(sanitizeCustomContainerStyles(raw)).toBe(
      "font-size: 55px; color: #1B3D29; height: 45px; display: table-cell; vertical-align: bottom",
    );
  });

  it("keeps definition-list style spans (display + logical margin + max-width)", () => {
    const raw =
      "display: inline-block; margin-inline-start: 1.5em; max-width: 90%";
    expect(sanitizeCustomContainerStyles(raw)).toBe(
      "display: inline-block; margin-inline-start: 1.5em; max-width: 90%",
    );
  });

  it("drops url() and unknown properties", () => {
    expect(
      sanitizeCustomContainerStyles(
        "color: url(http://evil.com); background: red",
      ),
    ).toBe("");
  });
});

describe("sanitizeCustomCssClasses", () => {
  it("keeps safe class tokens", () => {
    expect(sanitizeCustomCssClasses("foo bar-baz")).toBe("foo bar-baz");
  });

  it("drops invalid tokens", () => {
    expect(sanitizeCustomCssClasses("ok ../evil")).toBe("ok");
  });
});

describe("sanitizeMarkdownTargetId", () => {
  it("accepts simple ids", () => {
    expect(sanitizeMarkdownTargetId("heading-1")).toBe("heading-1");
  });

  it("accepts percent-encoded slug fragments (markdown-it-anchor)", () => {
    expect(sanitizeMarkdownTargetId("hello-%E4%B8%96%E7%95%8C")).toBe(
      "hello-%E4%B8%96%E7%95%8C",
    );
  });

  it("rejects empty or script-like input", () => {
    expect(sanitizeMarkdownTargetId("")).toBeNull();
    expect(sanitizeMarkdownTargetId("a b")).toBeNull();
    expect(sanitizeMarkdownTargetId("bad%ZZ")).toBeNull();
  });
});
