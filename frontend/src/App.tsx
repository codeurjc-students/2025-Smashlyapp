import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { RacketsProvider } from "./contexts/RacketsContext";
import { ListsProvider } from "./contexts/ListsContext";
import CatalogPage from "./pages/CatalogPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import HomePage from "./pages/HomePage";
import RacketDetailPage from "./pages/RacketDetailPage";
import FAQPage from "./pages/FAQPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserPage from "./pages/UserPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ErrorPage from "./pages/ErrorPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RacketsProvider>
          <ComparisonProvider>
            <ListsProvider>
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
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Rutas protegidas */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <UserPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminPanelPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Página de errores */}
                  <Route path="/error" element={<ErrorPage />} />

                  {/* Ruta 404 - página no encontrada */}
                  <Route path="*" element={<ErrorPage />} />
                </Routes>
              </Layout>
            </ListsProvider>
          </ComparisonProvider>
        </RacketsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
