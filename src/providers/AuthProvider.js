"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, selectIsAuthenticated, setMe } from "@/store/app/profileSlice";
import Image from "next/image";

const authPages = ["/login", "/signup", "/forget-password"];

// Simple Slack-like loader
function SlackLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#4A154B]">
      <div className="flex flex-col items-center">
        <Image
          width={100}
          height={100}
          src={process.env.NEXT_PUBLIC_SLACKIFY_LOGO || "/slackify-logo.png"}
          alt="Slackify Loader"
          className="h-16 mb-4 animate-bounce"
        />
        <div className="text-white text-lg font-semibold animate-pulse">Loading Slackify…</div>
      </div>
    </div>
  );
}

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  refresh: () => { },
  logout: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const user = useSelector((state) => state.profile.me);
  const pathname = usePathname();
  const [isAppLoadingCompleted, setIsAppLoadingCompleted] = useState(false);

  const isOpenAuthPage = authPages.includes(pathname);
  // Fetch current user on mount
  useEffect(() => {
    setLoading(true);
    async function fetchUser() {
      try {
        await dispatch(fetchMe()).unwrap();
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to fetch user");
      } finally {
        setLoading(false);
        setIsAppLoadingCompleted(true);
      }
    }
    fetchUser();
  }, [dispatch]);

  // Redirect logic
  useEffect(() => {
    if (!loading && isAuthenticated && authPages.includes(pathname)) {
      setIsAppLoadingCompleted(true);
      router.replace("/");
    } else if (!loading && !isAuthenticated && !authPages.includes(pathname)) {
      setIsAppLoadingCompleted(true);
      router.replace("/login");
    }
  }, [isAuthenticated, loading, pathname, router, user]);

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await dispatch(fetchMe()).unwrap();
    } catch (err) {
      setError("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SlackLoader />;
  }

  return (
    (isAppLoadingCompleted && (isAuthenticated || isOpenAuthPage)) && (
      <AuthContext.Provider value={{ loading, error, logout }}>
        {children}
      </AuthContext.Provider>
    )
  );
}