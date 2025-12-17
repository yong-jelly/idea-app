import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/shared/lib/supabase';
import { useUserStore } from '@/entities/user';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { login } = useUserStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (data.session?.user) {
          // 사용자 정보를 가져와서 스토어에 저장
          const user = data.session.user;
          const demoUser = {
            id: user.id,
            username: user.email?.split("@")[0].toLowerCase() || "user",
            displayName: user.email?.split("@")[0] || "사용자",
            avatar: undefined,
            bio: "",
            points: 100,
            level: "bronze" as const,
            subscribedProjectsCount: 0,
            supportedProjectsCount: 0,
            projectsCount: 0,
            createdAt: user.created_at,
          };

          login(demoUser);
          navigate('/');
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-surface-600 dark:text-surface-400">인증 처리 중...</p>
      </div>
    </div>
  );
}