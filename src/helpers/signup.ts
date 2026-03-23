import {
  normalizeErrorToString,
  toUserFriendlyError,
} from "../lib/errorMessageMap";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import type { AuthSignup } from "../types";

const ENV = import.meta.env;
const AC = APPLICATION_CONSTANTS;

export const signup = async (
  username: string,
  email: string,
  password: string,
): Promise<AuthSignup> => {
  let response;
  try {
    response = await fetch((ENV.VITE_API_ENDPOINT || "") + "api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        framework: AC.FRAMEWORK,
      }),
    });
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
          : AC.SIGNUP_GENERAL,
      fromServer: false,
    };
  }
  let data: AuthSignup;
  try {
    data = await response.json();
  } catch {
    return {
      error: AC.ERROR_SERVER_UNREACHABLE,
      fromServer: false,
    };
  }
  if (data === null || data === undefined)
    return { error: AC.SIGNUP_GENERAL, fromServer: false };
  if (data && "error" in data && data.error)
    return {
      error: normalizeErrorToString(data.error, AC.SIGNUP_GENERAL),
      fromServer: true,
    };
  return data;
};
