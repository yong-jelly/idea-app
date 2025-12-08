import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { Header } from "@/widgets";
import {
  FeedPage,
  PostDetailPage,
  ExplorePage,
  CreateProjectPage,
  SupportPage,
  FeatureRequestsPage,
  ProjectDetailPage,
  ProjectCommunityPage,
  ProfilePage,
  MyProjectsPage,
  BookmarksPage,
} from "@/pages";

function RootLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <FeedPage />,
      },
      {
        path: "explore",
        element: <ExplorePage />,
      },
      {
        path: "my-projects",
        element: <MyProjectsPage />,
      },
      {
        path: "bookmarks",
        element: <BookmarksPage />,
      },
      {
        path: "create-project",
        element: <CreateProjectPage />,
      },
      {
        path: "project/:id",
        element: <ProjectDetailPage />,
      },
      {
        path: "project/:id/community",
        element: <ProjectCommunityPage />,
      },
      {
        path: "project/:id/support",
        element: <SupportPage />,
      },
      {
        path: "project/:id/feature-requests",
        element: <FeatureRequestsPage />,
      },
      {
        path: "profile/:username",
        element: <ProfilePage />,
      },
      {
        path: ":username/status/:postId",
        element: <PostDetailPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

