import {
  normalizeErrorToString,
  toUserFriendlyError,
} from "../lib/errorMessageMap";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import type { AuthAuthenticate } from "../types";

const ENV = import.meta.env;
const AC = APPLICATION_CONSTANTS;

export const refreshtoken = async (): Promise<AuthAuthenticate> => {
  let response;
  try {
    response = await fetch(
      (ENV.VITE_API_ENDPOINT || "") + "api/auth/refreshtoken",
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (response.status === 404)
      throw new Error(`404 Not Found: ${response.url}`);
    if (response.status === 401) {
      try {
        const data = await response.json();
        if (data && typeof data.error === "string")
          return { error: data.error, fromServer: true };
      } catch {
        // fallback if body can't be parsed
      }
      return { error: AC.UNAUTHORIZED, fromServer: false };
    }
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false };
  }
  if (!response.ok) {
    try {
      const errData = await response.json();
      if (errData && typeof errData.error === "string")
        return { error: errData.error, fromServer: true };
    } catch {
      // Empty or invalid body — server may be down (e.g. 502 from proxy)
    }
    return {
      error:
        response.status >= 500
          ? AC.ERROR_SERVER_UNREACHABLE
          : AC.REFRESH_TOKEN_ERROR,
      fromServer: false,
    };
  }
  let data: AuthAuthenticate;
  try {
    data = await response.json();
    if (data === null || data === undefined)
      return { error: `${AC.REFRESH_TOKEN_ERROR}`, fromServer: false };
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false };
  }
  if (data && "error" in data && data.error)
    return {
      error: normalizeErrorToString(data.error, AC.REFRESH_TOKEN_ERROR),
      fromServer: true,
    };
  return data;
};
