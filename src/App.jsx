import { lazy, Suspense, useEffect, useState } from "react";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const PublicSite = lazy(() => import("./pages/PublicSite.jsx"));

const cleanPath = () => window.location.pathname.replace(/\/+$/, "") || "/";

function RouteFallback({ dark = false }) {
  return (
    <div className={`grid min-h-screen place-items-center ${dark ? "bg-noir text-cream/60" : "bg-paper text-muted"}`}>
      <span className="text-[0.72rem] uppercase tracking-[0.18em]">Loading Afsahi…</span>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(cleanPath);

  useEffect(() => {
    const onPopState = () => setPath(cleanPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath, { replace = false } = {}) => {
    const normalized = nextPath.replace(/\/+$/, "") || "/";
    if (normalized === path) return;
    window.history[replace ? "replaceState" : "pushState"]({}, "", normalized);
    setPath(normalized);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (path.startsWith("/admin")) {
    return (
      <Suspense fallback={<RouteFallback dark />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <PublicSite path={path} navigate={navigate} />
    </Suspense>
  );
}
