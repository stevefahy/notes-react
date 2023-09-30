import { createSlice } from "@reduxjs/toolkit";
import { NotebookCoverType } from "../types";

type SliceState = {
  editing: {
    status: boolean;
  };
  edited: {
    message: {
      _id: string;
      notebook_name: string;
      notebook_cover: NotebookCoverType;
    };
  };
};

// Define the initial state using that type
const initialState: SliceState = {
  editing: {
    status: false,
  },
  edited: {
    message: { _id: "", notebook_name: "", notebook_cover: "default" },
  },
};

const editSlice = createSlice({
  name: "edit",
  initialState: initialState,
  reducers: {
    editStatus(state, action) {
      state.editing = {
        status: action.payload.status,
      };
    },
    editChange(state, action) {
      state.edited = {
        message: action.payload.message,
      };
    },
  },
});

export const editActions = editSlice.actions;

export default editSlice;
