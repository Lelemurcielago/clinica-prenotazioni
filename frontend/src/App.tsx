import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Layout from "./components/Layout";
import RottaProtetta from "./components/RottaProtetta";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MiePrenotazioniPage from "./pages/MiePrenotazioniPage";
import PrenotaPage from "./pages/PrenotaPage";
import RegistrazionePage from "./pages/RegistrazionePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrazione" element={<RegistrazionePage />} />
          <Route element={<RottaProtetta />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route element={<RottaProtetta ruoli={["paziente"]} />}>
                <Route path="/prenota" element={<PrenotaPage />} />
                <Route path="/prenotazioni" element={<MiePrenotazioniPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}