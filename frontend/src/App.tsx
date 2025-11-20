import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { ScrollToTop } from "./components/common/ScrollToTop";
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
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <RacketsProvider>
        <ComparisonProvider>
          <ListsProvider>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/racket-detail" element={<RacketDetailPage />} />
                <Route path="/rackets" element={<ComingSoonPage />} />
                <Route path="/compare" element={<ComingSoonPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<UserPage />} />
                <Route path="/admin" element={<AdminPanelPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </ListsProvider>
        </ComparisonProvider>
      </RacketsProvider>
    </AuthProvider>
  );
}
