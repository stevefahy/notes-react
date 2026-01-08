import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import App from "./App.Authentication";
import { AuthProvider } from "./context/AuthContext";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { createRoot } from "react-dom/client";
import Layout from "./components/layout/layout";
import createEmotionCache from "../src/utils/createEmotionCache";
import theme from "./utils/theme";
import "./index.css";
import { ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
	<React.StrictMode>
		<ReduxProvider store={store}>
			<BrowserRouter>
				<CacheProvider value={clientSideEmotionCache}>
					<ThemeProvider theme={theme}>
						<AuthProvider>
							<Layout>
								<QueryParamProvider
									adapter={ReactRouter6Adapter}
								>
									<CssBaseline />
									<App />
								</QueryParamProvider>
							</Layout>
						</AuthProvider>
					</ThemeProvider>
				</CacheProvider>
			</BrowserRouter>
		</ReduxProvider>
	</React.StrictMode>
);
