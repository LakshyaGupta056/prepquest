import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/Landing";
import TestSetup from "./pages/TestSetup";
import TestTaking from "./pages/TestTaking";
import Results from "./pages/Results";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/setup", element: <TestSetup /> },
  { path: "/test", element: <TestTaking /> },
  { path: "/results", element: <Results /> },
  { path: "*", element: <Landing /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
