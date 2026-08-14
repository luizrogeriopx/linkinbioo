import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      // 1. Verificar sessão ativa em cache
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        return { user: sessionData.session.user };
      }

      // 2. Se houver tokens ou código OAuth na URL, aguardar processamento do Supabase
      if (typeof window !== "undefined") {
        const hasAuthParams =
          window.location.hash.includes("access_token") ||
          window.location.search.includes("code=") ||
          window.location.hash.includes("refresh_token");

        if (hasAuthParams) {
          const userFromAuth = await new Promise((resolve) => {
            const timeout = setTimeout(async () => {
              const { data } = await supabase.auth.getUser();
              resolve(data?.user ?? null);
            }, 3000);

            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange((_event, session) => {
              if (session?.user) {
                clearTimeout(timeout);
                subscription.unsubscribe();
                resolve(session.user);
              }
            });
          });

          if (userFromAuth) {
            return { user: userFromAuth };
          }
        }
      }

      // 3. Checagem final com getUser()
      const { data: userData, error } = await supabase.auth.getUser();
      if (!error && userData?.user) {
        return { user: userData.user };
      }
    } catch {
      // Falha ao obter usuário
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});

