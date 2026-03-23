import { describe, it, expect } from "vitest";
import { unwrapResponse } from "./unwrapResponse";

describe("unwrapResponse", () => {
  it("returns ok:false for null", () => {
    const r = unwrapResponse(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("No response");
  });

  it("returns ok:false for error field", () => {
    const r = unwrapResponse({ error: "bad", fromServer: true });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe("bad");
      expect(r.fromServer).toBe(true);
    }
  });

  it("returns ok:true when success is true", () => {
    const payload = { success: true, notebooks: [] };
    const r = unwrapResponse(payload);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(payload);
  });
});
