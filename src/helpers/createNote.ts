import { errString } from "../lib/errString";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import { CreateNoteObj, CreateNote } from "../types";

const AC = APPLICATION_CONSTANTS;

export const createNote = async (
  token: string,
  note: CreateNoteObj
): Promise<CreateNote> => {
  let response;
  try {
    response = await fetch(
      process.env.REACT_APP_API_ENDPOINT + `api/data/create-note`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(note),
      }
    );
    if (response.status === 404) {
      throw new Error(`${response.url} Not Found.`);
    }
  } catch (err: unknown) {
    const errMessage = errString(err);
    return { error: errMessage };
  }
  let data: CreateNote;
  try {
    data = await response.json();
    if (data === null) {
      return { error: `${AC.NOTE_CREATE_ERROR}` };
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
