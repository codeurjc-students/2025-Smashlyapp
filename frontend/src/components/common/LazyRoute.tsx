import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';
import PageSkeleton from './PageSkeleton';

interface LazyRouteConfig {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallbackType?: 'spinner' | 'skeleton' | 'none';
  fallbackText?: string;
}

/**
 * Higher-order component for lazy loading routes with custom loading states
 *
 * @example
 * const HomePage = createLazyRoute({
 *   loader: () => import('./pages/HomePage'),
 *   fallbackType: 'skeleton'
 * });
 */
export function createLazyRoute(config: LazyRouteConfig) {
  const LazyComponent = lazy(config.loader);

  const WrappedComponent: React.FC = () => (
    <Suspense
      fallback={
        config.fallbackType === 'skeleton' ? (
          <PageSkeleton />
        ) : config.fallbackType === 'none' ? (
          <></>
        ) : (
          <LoadingSpinner
            text={config.fallbackText || 'Cargando...'}
            fullScreen
          />
        )
      }
    >
      <LazyComponent />
    </Suspense>
  );

  // Add display name for debugging
  WrappedComponent.displayName = `LazyRoute(${config.loader.toString()})`;

  return WrappedComponent;
}

/**
 * Wrapper component for lazy loaded components with inline Suspense
 */
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  return (
    <Suspense fallback={fallback || <LoadingSpinner fullScreen />}>
      {children}
    </Suspense>
  );
};

export default createLazyRoute;
