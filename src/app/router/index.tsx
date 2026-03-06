import { useEffect, useLayoutEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
  useNavigationType,
} from "react-router";
import { Header, MobileBottomNav } from "@/widgets";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { trackPageView } from "@/shared/lib/gtm";
import { useScrollRestoreStore } from "@/shared/lib/scroll-restore.store";
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
  BookmarkProjectsPage,
} from "@/pages";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";

function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollMap = useScrollRestoreStore((s) => s.scrollMap);

  useLayoutEffect(() => {
    if (navigationType === "POP") {
      const saved = scrollMap[location.pathname];
      if (saved != null && saved > 0) {
        let cancelled = false;
        let retries = 0;
        const maxRetries = 40; // 약 2초(50ms * 40) 동안 복원 재시도

        const restoreWithRetry = () => {
          if (cancelled) return;

          window.scrollTo(0, saved);

          const reached = Math.abs(window.scrollY - saved) < 2;
          if (reached || retries >= maxRetries) return;

          retries += 1;
          setTimeout(restoreWithRetry, 50);
        };

        restoreWithRetry();
        return () => {
          cancelled = true;
        };
      }
    }

    window.scrollTo(0, 0);
  }, [location.pathname, location.search, navigationType, scrollMap]);

  return null;
}

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // 페이지 전환 시 GTM에 페이지뷰 이벤트 전송
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}

function RootLayout() {
  return (
    <div className="min-h-screen bg-surface-50/30 dark:bg-surface-950">
      <ScrollToTop />
      <PageViewTracker />
      <Header />
      <div className="pb-16 lg:pb-0">
        <Outlet />
      </div>
      <MobileBottomNav />
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
        path: "bookmark/project",
        element: <BookmarkProjectsPage />,
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

