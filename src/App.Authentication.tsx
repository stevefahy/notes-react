import { useContext, Fragment } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Props } from "./types";
import { AuthContext } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import NotebookPage from "./pages/notebook";
import NotePage from "./pages/note";
import NotebooksPage from "./pages/notebooks";
import ProfilePage from "./pages/profile";
import LoadingScreen from "./components/ui/loading-screen";

const useAuth = () => {
	return useContext(AuthContext);
};

const ProtectedRoute = ({ children }: Props) => {
	const { authContext } = useAuth();
	const { token } = authContext;
	const location = useLocation();
	if (!token) {
		return <Navigate to="/LoginPage" replace state={{ from: location }} />;
	}
	return <Fragment>{children}</Fragment>;
};

const NoMatch = () => {
	return <p>There's nothing here: 404!</p>;
};

const App = () => {
	const { authContext } = useContext(AuthContext);
	const { loading, token } = authContext;

	return (
		<Fragment>
			{loading ? (
				<div className="loading_routes">
					<LoadingScreen />
				</div>
			) : (
				<Routes>
					<Route
						index
						path="/"
						element={
							token ? (
								<Navigate replace to={"/notebooks"} />
							) : (
								<Navigate replace to={"/LoginPage"} />
							)
						}
					/>
					<Route path="/LoginPage" element={<LoginPage />} />
					<Route
						path="/notebooks"
						element={
							<ProtectedRoute>
								<NotebooksPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<ProfilePage />
							</ProtectedRoute>
						}
					/>
					<Route path="notebook">
						<Route
							path=":notebookId"
							element={
								<ProtectedRoute>
									<NotebookPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path=":notebookId/:noteId"
							element={
								<ProtectedRoute>
									<NotePage />
								</ProtectedRoute>
							}
						/>
					</Route>
					<Route path="*" element={<NoMatch />} />
				</Routes>
			)}
		</Fragment>
	);
};

export default App;
