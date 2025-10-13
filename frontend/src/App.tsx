import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { RacketsProvider } from "./contexts/RacketsContext";
import CatalogPage from "./pages/CatalogPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import HomePage from "./pages/HomePage";
import RacketDetailPage from "./pages/RacketDetailPage";

function App() {
  return (
    // <AuthProvider>
    <RacketsProvider>
      <ComparisonProvider>
        <Layout>
          <Routes>
            {/* Página principal */}
            <Route path="/" element={<HomePage />} />

            {/* Páginas de catálogo y detalle */}
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/racket-detail" element={<RacketDetailPage />} />

            {/* Páginas próximamente */}
            <Route path="/rackets" element={<ComingSoonPage />} />
            <Route path="/compare" element={<ComingSoonPage />} />
            <Route path="/faq" element={<ComingSoonPage />} />
            <Route path="/login" element={<ComingSoonPage />} />
            <Route path="/register" element={<ComingSoonPage />} />

            {/* Ruta 404 - página no encontrada */}
            <Route
              path="*"
              element={
                <div
                  style={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <h1>404 - Página no encontrada</h1>
                  <p>La página que buscas no existe.</p>
                  <a
                    href="/"
                    style={{ color: "#16a34a", textDecoration: "none" }}
                  >
                    ← Volver al inicio
                  </a>
                </div>
              }
            />
          </Routes>
        </Layout>
      </ComparisonProvider>
    </RacketsProvider>
    // </AuthProvider>
  );
}

export default App;
