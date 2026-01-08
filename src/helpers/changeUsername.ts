import { errString } from "../lib/errString";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { ChangeUsername } from "../types";

const AC = APPLICATION_CONSTANTS;

export const changeUsername = async (
  token: string,
  usernameData: {}
): Promise<ChangeUsername> => {
  let response;
  try {
    response = await fetch(
      process.env.REACT_APP_API_ENDPOINT + `api/auth/change-username`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usernameData),
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
  let data: ChangeUsername;
  try {
    data = await response.json();
    if (data === null) {
      return { error: `${AC.CHANGE_USER_ERROR}` };
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
