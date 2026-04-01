import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { RacketsProvider } from './contexts/RacketsContext';
import { ListsProvider } from './contexts/ListsContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { FloatingCompareButton } from './components/common/FloatingCompareButton';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AuthModal from './components/auth/AuthModal';
import { RouteLoadingFallback, CatalogSkeleton } from './components/common/LoadingFallbacks';
import { PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';

// Code split routes - load on demand
const HomePage = lazy(() => import('./pages/HomePage'));
const PlayerDashboard = lazy(() =>
  import('./pages/PlayerDashboard').then(m => ({ default: m.PlayerDashboard }))
);
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const RacketDetailPage = lazy(() => import('./pages/RacketDetailPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const CompareRacketsPage = lazy(() => import('./pages/CompareRacketsPage'));
const SavedComparisonPage = lazy(() => import('./pages/SavedComparisonPage'));
const MyComparisonsPage = lazy(() => import('./pages/MyComparisonsPage'));
const SharedComparisonPage = lazy(() => import('./pages/SharedComparisonPage'));
const BestRacketPage = lazy(() =>
  import('./pages/BestRacketPage').then(m => ({ default: m.BestRacketPage }))
);
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const ListPage = lazy(() => import('./pages/ListPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const AdminRacketReviewPage = lazy(() => import('./pages/AdminRacketReviewPage'));
const AdminRacketsPage = lazy(() => import('./pages/AdminRacketsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminStoresPage = lazy(() => import('./pages/AdminStoresPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <AuthProvider>
          <NotificationProvider>
            <RacketsProvider>
              <ComparisonProvider>
                <ListsProvider>
                  <AuthModalProvider>
                    <ScrollToTop />
                    <AuthModal />
                    <PWAInstallPrompt />
                    <Layout>
                      <FloatingCompareButton />
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
                          path='/compare/:id'
                          element={
                            <Suspense fallback={<RouteLoadingFallback />}>
                              <SavedComparisonPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path='/comparisons'
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <MyComparisonsPage />
                              </Suspense>
                            </ProtectedRoute>
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
                        <Route
                          path='/forgot-password'
                          element={
                            <Suspense fallback={<RouteLoadingFallback />}>
                              <ForgotPasswordPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path='/update-password'
                          element={
                            <Suspense fallback={<RouteLoadingFallback />}>
                              <UpdatePasswordPage />
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
                          path='/profile'
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <UserProfilePage />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path='/lists/:id'
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <ListPage />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />

                        {/* Legal pages - public, no auth required */}
                        <Route
                          path='/terms-and-conditions'
                          element={
                            <Suspense fallback={<RouteLoadingFallback />}>
                              <TermsAndConditionsPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path='/privacy-policy'
                          element={
                            <Suspense fallback={<RouteLoadingFallback />}>
                              <PrivacyPolicyPage />
                            </Suspense>
                          }
                        />

                        {/* Admin routes - protected, require admin role */}
                        <Route
                          path='/admin'
                          element={
                            <ProtectedRoute requireAdmin>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <AdminPanelPage />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/rackets/review'
                          element={
                            <ProtectedRoute requireAdmin>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <AdminRacketReviewPage />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/rackets'
                          element={
                            <ProtectedRoute requireAdmin>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <AdminRacketsPage />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/users'
                          element={
                            <ProtectedRoute requireAdmin>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <AdminUsersPage />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/stores'
                          element={
                            <ProtectedRoute requireAdmin>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <AdminStoresPage />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/settings'
                          element={
                            <ProtectedRoute requireAdmin>
                              <Suspense fallback={<RouteLoadingFallback />}>
                                <AdminSettingsPage />
                              </Suspense>
                            </ProtectedRoute>
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
                  </AuthModalProvider>
                </ListsProvider>
              </ComparisonProvider>
            </RacketsProvider>
          </NotificationProvider>
        </AuthProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
