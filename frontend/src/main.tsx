import { ComparisonProvider } from '@contexts/ComparisonContext';
import { GlobalStyles } from '@styles/GlobalStyles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import "sileo/styles.css";
import { Toaster } from 'sileo';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ComparisonProvider>
          <GlobalStyles />
          <App />
          <Toaster position='top-center' options={{ duration: 4000 }} />
        </ComparisonProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
