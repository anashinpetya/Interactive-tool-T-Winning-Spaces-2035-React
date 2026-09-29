import { lazy, Suspense, useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Sidebar } from "./components/Sidebar";
import { Spinner } from "./components/Spinner";
import { BAR_PAGES } from "./config/barCharts";
import { MAP_PAGES } from "./config/mapPages";
import { HomePage } from "./pages/HomePage";
import { MapSettingsProvider } from "./state/MapSettings";

// Map and chart code is large, so it is only downloaded when such a page is opened
const MapPage = lazy(() => import("./pages/MapPage").then((m) => ({ default: m.MapPage })));
const BarChartPage = lazy(() => import("./pages/BarChartPage").then((m) => ({ default: m.BarChartPage })));

const TITLES: Record<string, string> = {
  "/": "Interactive tool · T-Winning Spaces 2035",
  ...Object.fromEntries([...MAP_PAGES, ...BAR_PAGES].map((p) => [p.path, `${p.navLabel} · T-Winning Spaces 2035`])),
};

// Old Streamlit-era page addresses still work
const REDIRECTS: Record<string, string> = {
  "/emissions-comparison": "/emissions",
  "/remote-workers-comparison": "/remote-workers",
  "/on-site-workers-comparison": "/on-site-workers",
  "/car-passengers-comparison": "/car-passengers",
  "/transit-passengers-comparison": "/transit-passengers",
};

function Layout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = TITLES[pathname] ?? TITLES["/"];
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={menuOpen ? "app sidebar-open" : "app"}>
      <header className="topbar">
        <button type="button" className="icon-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="topbar-title">T-Winning Spaces 2035</span>
      </header>
      <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />
      <Sidebar onNavigate={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} />

      <main className="main">
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<Spinner text="Loading…" />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {MAP_PAGES.map((page) => (
                <Route key={page.path} path={page.path} element={<MapPage key={page.path} page={page} />} />
              ))}
              {BAR_PAGES.map((page) => (
                <Route key={page.path} path={page.path} element={<BarChartPage key={page.path} config={page} />} />
              ))}
              {Object.entries(REDIRECTS).map(([from, to]) => (
                <Route key={from} path={from} element={<Navigate to={to} replace />} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export function App() {
  return (
    // Hash URLs (#/emissions) work on any static host, e.g. GitHub Pages
    <HashRouter>
      <MapSettingsProvider>
        <Layout />
      </MapSettingsProvider>
    </HashRouter>
  );
}
