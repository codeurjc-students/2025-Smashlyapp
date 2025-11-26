import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { RacketsProvider } from './contexts/RacketsContext';
import { ListsProvider } from './contexts/ListsContext';
import CatalogPage from './pages/CatalogPage';
import HomePage from './pages/HomePage';
import RacketDetailPage from './pages/RacketDetailPage';
import FAQPage from './pages/FAQPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserPage from './pages/UserPage';
import AdminPanelPage from './pages/AdminPanelPage';
import { BestRacketPage } from './pages/BestRacketPage';
import { PlayerDashboard } from './pages/PlayerDashboard';
import { AuthProvider } from './contexts/AuthContext';
import NotFoundPage from './pages/NotFoundPage';
import ComparePage from './pages/ComparePage';
import CompareRacketsPage from './pages/CompareRacketsPage';
import { FloatingCompareButton } from './components/common/FloatingCompareButton';

export default function App() {
  return (
    <AuthProvider>
      <RacketsProvider>
        <ComparisonProvider>
          <ListsProvider>
            <ScrollToTop />
            <Layout>
              <FloatingCompareButton />
              <Routes>
                <Route path='/' element={<HomePage />} />
                <Route path='/dashboard' element={<PlayerDashboard />} />
                <Route path='/catalog' element={<CatalogPage />} />
                <Route path='/racket-detail' element={<RacketDetailPage />} />
                <Route path='/compare' element={<ComparePage />} />
                <Route path='/compare-rackets' element={<CompareRacketsPage />} />
                <Route path='/best-racket' element={<BestRacketPage />} />
                <Route path='/faq' element={<FAQPage />} />
                <Route path='/login' element={<LoginPage />} />
                <Route path='/register' element={<RegisterPage />} />
                <Route path='/profile' element={<UserPage />} />
                <Route path='/admin' element={<AdminPanelPage />} />
                <Route path='*' element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </ListsProvider>
        </ComparisonProvider>
      </RacketsProvider>
    </AuthProvider>
  );
}
