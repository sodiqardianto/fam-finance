import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { authApi, DbUser } from '@/lib/api';

export function useAuth() {
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDbUser(email: string) {
      try {
        const status = await authApi.checkStatus(email);
        if (status.registered) {
          setDbUser(status.user ?? null);
        } else {
          setDbUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch DB user", err);
        setDbUser(null);
      } finally {
        setLoading(false);
      }
    }

    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      getDbUser(session.user.email);
    } else {
      setDbUser(null);
      setLoading(false);
    }
  }, [session, status]);

  return { 
    user: session?.user ?? null, 
    dbUser, 
    loading: loading || status === "loading",
    status 
  };
}
