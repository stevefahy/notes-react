import { errString } from "../lib/errString";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { GetNotebooks } from "../types";

const AC = APPLICATION_CONSTANTS;

export const getNotebooks = async (token: string): Promise<GetNotebooks> => {
  let response;
  try {
    response = await fetch(
      process.env.REACT_APP_API_ENDPOINT + `api/data/notebooks`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status === 404) {
      throw new Error(`${response.url} Not Found.`);
    }
  } catch (err: unknown) {
    const errMessage = errString(err);
    return { error: errMessage };
  }
  let data: GetNotebooks;
  try {
    data = await response.json();
    if (data === null) {
      return { error: `${AC.NOTEBOOKS_ERROR}` };
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
