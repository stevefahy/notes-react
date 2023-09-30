import { errString } from "../lib/errString";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { DeleteNotebook } from "../types";

const AC = APPLICATION_CONSTANTS;

export const deleteNotebook = async (
  token: string,
  notebook_id: string
): Promise<DeleteNotebook> => {
  let response;
  try {
    const deleteNotebook = {
      notebookID: notebook_id,
    };
    response = await fetch(
      process.env.REACT_APP_API_ENDPOINT + `api/data/delete-notebook`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deleteNotebook),
      }
    );
    if (response.status === 404) {
      throw new Error(`${response.url} Not Found.`);
    }
  } catch (err: unknown) {
    const errMessage = errString(err);
    return { error: errMessage };
  }
  let data: DeleteNotebook;
  try {
    data = await response.json();
    if (data === null) {
      return { error: `${AC.NOTEBOOK_DELETE_ERROR}` };
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
