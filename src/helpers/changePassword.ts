import { errString } from "../lib/errString";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { ChangePassword } from "../types";

const AC = APPLICATION_CONSTANTS;

export const changePassword = async (
  token: string,
  passwordData: {}
): Promise<ChangePassword> => {
  let response;
  try {
    response = await fetch(
      import.meta.env.VITE_API_ENDPOINT + `api/auth/change-password`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      }
    );
    if (response.status === 404) {
      throw new Error(`${response.url} Not Found.`);
    }
    if (response.status === 401) {
      throw new Error(`Unauthorized`);
    }
  } catch (err: unknown) {
    const errMessage = errString(err);
    return { error: errMessage };
  }
  let data: ChangePassword;
  try {
    data = await response.json();
    if (data === null) {
      return { error: `${AC.CHANGE_PASS_ERROR}` };
    }
  } catch (err: unknown) {
    const errMessage = errString(err);
    return { error: errMessage };
  }
  if (data.error) {
    return { error: data.error };
  }
  return data;
};
