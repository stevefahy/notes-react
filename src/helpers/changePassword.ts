import {
  normalizeErrorToString,
  toUserFriendlyError,
} from "../lib/errorMessageMap";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import type { ChangePassword } from "../types";

const ENV = import.meta.env;
const AC = APPLICATION_CONSTANTS;

export const changePassword = async (
  token: string,
  passwordData: { oldPassword: string; newPassword: string },
): Promise<ChangePassword> => {
  let response;
  try {
    response = await fetch(
      (ENV.VITE_API_ENDPOINT || "") + "api/auth/change-password",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
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
          : AC.CHANGE_PASS_ERROR,
      fromServer: false,
    };
  }
  let data: ChangePassword;
  try {
    data = await response.json();
    if (data === null)
      return { error: `${AC.CHANGE_PASS_ERROR}`, fromServer: false };
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false };
  }
  if (data && "error" in data && data.error)
    return {
      error: normalizeErrorToString(data.error, AC.CHANGE_PASS_ERROR),
      fromServer: true,
    };
  return data;
};
