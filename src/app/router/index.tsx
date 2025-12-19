import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router";
import { Header } from "@/widgets";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import {
  FeedPage,
  PostDetailPage,
  ExplorePage,
  CreateProjectPage,
  EditProjectPage,
  SupportPage,
  FeatureRequestsPage,
  ProjectDetailPage,
  ProjectCommunityPage,
  MilestoneDetailPage,
  FeedbackDetailPage,
  RewardManagePage,
  ProfilePage,
  MyProjectsPage,
  BookmarksPage,
} from "@/pages";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
}

function RootLayout() {
  return (
    <div className="min-h-screen bg-surface-50/30 dark:bg-surface-950">
      <ScrollToTop />
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
        path: "auth/callback",
        element: <AuthCallbackPage />,
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
        // 보호된 라우트: 프로젝트 생성 페이지
        // 비회원이 접근하면 ProtectedRoute 컴포넌트가 메인 피드(/)로 리다이렉트합니다.
        // 세션 토큰이 없는 경우 접근이 차단됩니다.
        path: "create-project",
        element: (
          <ProtectedRoute>
            <CreateProjectPage />
          </ProtectedRoute>
        ),
      },
      {
        // 보호된 라우트: 프로젝트 수정 페이지
        // 비회원이 접근하면 ProtectedRoute 컴포넌트가 메인 피드(/)로 리다이렉트합니다.
        // 세션 토큰이 없는 경우 접근이 차단됩니다.
        path: "project/:id/edit",
        element: (
          <ProtectedRoute>
            <EditProjectPage />
          </ProtectedRoute>
        ),
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
        path: "project/:id/community/rewards/manage",
        element: <RewardManagePage />,
      },
      {
        path: "project/:id/community/:tab",
        element: <ProjectCommunityPage />,
      },
      {
        path: "project/:id/community/milestones/:milestoneId",
        element: <MilestoneDetailPage />,
      },
      {
        path: "project/:id/community/feedback/:feedbackId",
        element: <FeedbackDetailPage />,
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

