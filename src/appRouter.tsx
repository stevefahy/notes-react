import { Suspense, useContext } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import Layout from "./components/layout/layout";
import LoginPage from "./pages/LoginPage";
import LoadingScreen from "./components/ui/loading-screen";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { lazyRoute } from "./lib/lazyRoute";
import APPLICATION_CONSTANTS from "./application_constants/applicationConstants";

const NotebooksPage = lazyRoute(() => import("./pages/notebooks"));
const ProfilePage = lazyRoute(() => import("./pages/profile"));
const NotebookPage = lazyRoute(() => import("./pages/notebook"));
const NotePage = lazyRoute(() => import("./pages/note"));

const AC = APPLICATION_CONSTANTS;

function useAuth() {
  return useContext(AuthContext);
}

function AuthBootstrap() {
  const { authContext } = useAuth();
  const { loading } = authContext;
  if (loading) {
    return (
      <div className="loading_routes">
        <LoadingScreen />
      </div>
    );
  }
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

function RequireAuth() {
  const { authContext } = useAuth();
  const location = useLocation();
  if (!authContext.token) {
    return <Navigate to="/LoginPage" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function IndexRedirect() {
  const { authContext } = useAuth();
  return authContext.token ? (
    <Navigate replace to={AC.DEFAULT_PAGE} />
  ) : (
    <Navigate replace to={AC.LOGIN_PAGE} />
  );
}

function NoMatch() {
  return <p>There's nothing here: 404!</p>;
}

const router = createBrowserRouter([
  {
    /* AuthProvider uses useNavigate — must be inside RouterProvider, not above it */
    element: (
      <AuthProvider>
        <AuthBootstrap />
      </AuthProvider>
    ),
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <IndexRedirect /> },
          { path: "LoginPage", element: <LoginPage /> },
          {
            element: <RequireAuth />,
            children: [
              { path: "notebooks", element: <NotebooksPage /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "notebook/:notebookId", element: <NotebookPage /> },
              {
                path: "notebook/:notebookId/:noteId",
                element: <NotePage />,
              },
            ],
          },
          { path: "*", element: <NoMatch /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
