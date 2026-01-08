import { createSlice } from "@reduxjs/toolkit";
import { NotificationStatus } from "../types";

type SliceState = {
	notification: {
		status: NotificationStatus | null;
		title: string | null;
		message: string | null;
	};
};

// Define the initial state using that type
const initialState: SliceState = {
	notification: {
		status: null,
		title: null,
		message: null,
	},
};

const uiSlice = createSlice({
	name: "ui",
	initialState: initialState,
	reducers: {
		showNotification(state, action) {
			state.notification = {
				status: action.payload.status,
				title: action.payload.title,
				message: action.payload.message,
			};
		},
	},
});

export const uiActions = uiSlice.actions;

export default uiSlice;
