import { errString } from "../lib/errString";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { GetNote } from "../types";

const AC = APPLICATION_CONSTANTS;

export const getNote = async (
  token: string,
  notebookId: string,
  noteId: string
): Promise<GetNote> => {
  let response;
  try {
    response = await fetch(
      process.env.REACT_APP_API_ENDPOINT +
        `api/data/notebook/${notebookId}/${noteId}`,
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
  let data: GetNote;
  try {
    data = await response.json();
    if (data === null) {
      return { error: `${AC.NOTE_ERROR}` };
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
