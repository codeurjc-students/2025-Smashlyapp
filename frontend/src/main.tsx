import { GlobalStyles } from "./styles/GlobalStyles";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { RacketsProvider } from "./contexts/RacketsContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RacketsProvider>
          <ComparisonProvider>
            <GlobalStyles />
            <App />
          </ComparisonProvider>
        </RacketsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
