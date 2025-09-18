import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import BestRacketPage from "./pages/BestRacketPage";
import CatalogPage from "./pages/CatalogPage";
import CompareRacketsPage from "./pages/CompareRacketsPage";
import FAQPage from "./pages/FAQPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RacketDetailPage from "./pages/RacketDetailPage";
import RacketsPage from "./pages/RacketsPage";
import RegisterPage from "./pages/RegisterPage";
import UserProfilePage from "./pages/UserProfilePage";

function App() {
  return (
    <Layout>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<HomePage />} />

        {/* Páginas de palas */}
        <Route path="/rackets" element={<RacketsPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/racket-detail" element={<RacketDetailPage />} />
        <Route path="/best-racket" element={<BestRacketPage />} />
        <Route path="/compare-rackets" element={<CompareRacketsPage />} />

        {/* Páginas de autenticación */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<UserProfilePage />} />

        {/* Páginas informativas */}
        <Route path="/faq" element={<FAQPage />} />

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
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              <h2 style={{ fontSize: "2rem", fontWeight: "600" }}>
                Página no encontrada
              </h2>
              <p>La página que buscas no existe.</p>
              <a
                href="/"
                style={{
                  color: "#16a34a",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                ← Volver al inicio
              </a>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
