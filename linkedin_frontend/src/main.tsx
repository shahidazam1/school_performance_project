import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#27715e" },
    secondary: { main: "#d5765e" },
    background: { default: "#edf1ef", paper: "#ffffff" },
  },
  shape: { borderRadius: 5 },
  typography: {
    fontFamily: 'Aptos, "Segoe UI Variable", "Trebuchet MS", sans-serif',
    button: { textTransform: "none", fontWeight: 650 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
