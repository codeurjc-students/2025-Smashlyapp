import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { RacketsProvider } from './contexts/RacketsContext';
import { ListsProvider } from './contexts/ListsContext';
import { BackgroundTasksProvider } from './contexts/BackgroundTasksContext';
import { BackgroundTaskPopup } from './components/common/BackgroundTaskPopup';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import PageSkeleton from './components/common/PageSkeleton';
import { FloatingCompareButton } from './components/common/FloatingCompareButton';
import { AuthProvider } from './contexts/AuthContext';

// Code split routes - load on demand
const HomePage = lazy(() => import('./pages/HomePage'));
const PlayerDashboard = lazy(() => import('./pages/PlayerDashboard').then(m => ({ default: m.PlayerDashboard })));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const RacketDetailPage = lazy(() => import('./pages/RacketDetailPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const CompareRacketsPage = lazy(() => import('./pages/CompareRacketsPage'));
const MyComparisonsPage = lazy(() => import('./pages/MyComparisonsPage'));
const SharedComparisonPage = lazy(() => import('./pages/SharedComparisonPage'));
const BestRacketPage = lazy(() => import('./pages/BestRacketPage').then(m => ({ default: m.BestRacketPage })));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const AdminRacketReviewPage = lazy(() => import('./pages/AdminRacketReviewPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading fallback component
const RouteLoadingFallback = () => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%)' }}>
    <LoadingSpinner fullScreen text="Cargando página..." />
  </div>
);

// Catalog skeleton for better UX
const CatalogSkeleton = () => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%)' }}>
    <PageSkeleton count={9} showHeader />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <AuthProvider>
          <RacketsProvider>
            <ComparisonProvider>
              <ListsProvider>
                <BackgroundTasksProvider>
                  <ScrollToTop />
                  <Layout>
                    <FloatingCompareButton />
                    <BackgroundTaskPopup />
                    <Routes>
                      {/* Critical routes - prioritized */}
                      <Route
                        path='/'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <HomePage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/dashboard'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <PlayerDashboard />
                          </Suspense>
                        }
                      />

                      {/* Catalog with skeleton for better perceived performance */}
                      <Route
                        path='/catalog'
                        element={
                          <Suspense fallback={<CatalogSkeleton />}>
                            <CatalogPage />
                          </Suspense>
                        }
                      />

                      {/* Product pages */}
                      <Route
                        path='/racket-detail'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <RacketDetailPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/best-racket'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <BestRacketPage />
                          </Suspense>
                        }
                      />

                      {/* Comparison routes */}
                      <Route
                        path='/compare'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <ComparePage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/compare-rackets'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <CompareRacketsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/comparisons'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <MyComparisonsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/shared/:token'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <SharedComparisonPage />
                          </Suspense>
                        }
                      />

                      {/* User routes */}
                      <Route
                        path='/faq'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <FAQPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/login'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <LoginPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/register'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <RegisterPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/profile'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <UserPage />
                          </Suspense>
                        }
                      />

                      {/* Admin routes - lowest priority */}
                      <Route
                        path='/admin'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <AdminPanelPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='/admin/rackets/review'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <AdminRacketReviewPage />
                          </Suspense>
                        }
                      />

                      {/* 404 */}
                      <Route
                        path='*'
                        element={
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <NotFoundPage />
                          </Suspense>
                        }
                      />
                    </Routes>
                  </Layout>
                </BackgroundTasksProvider>
              </ListsProvider>
            </ComparisonProvider>
          </RacketsProvider>
        </AuthProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
