import React from "react";
import { AppRouter } from "./appRouter";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { createRoot } from "react-dom/client";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <AppRouter />
    </ReduxProvider>
  </React.StrictMode>,
);
