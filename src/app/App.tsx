import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PlattformLayout } from './PlattformLayout';
import { PruefungRoute } from './PruefungRoute';
import { MeinePruefungen } from '@/pages/MeinePruefungen';
import { PruefungStart } from '@/pages/PruefungStart';
import { Modi } from '@/pages/Modi';
import { Profil } from '@/pages/Profil';
import { Impressum, Datenschutz } from '@/pages/Rechtliches';
import { NotFound } from '@/pages/NotFound';
import { Abschluss } from '@/pages/Abschluss';
import { Pfad } from '@/pages/Pfad';
import { Lektion } from '@/pages/Lektion';
import { Karten } from '@/pages/Karten';
import { Runde } from '@/pages/Runde';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PlattformLayout />}>
        <Route index element={<MeinePruefungen />} />
        <Route path="profil" element={<Profil />} />
        <Route path="impressum" element={<Impressum />} />
        <Route path="datenschutz" element={<Datenschutz />} />
      </Route>
      <Route path="p/:pruefungId" element={<PruefungRoute />}>
        <Route index element={<PruefungStart />} />
        <Route path="pfad" element={<Pfad />} />
        <Route path="lektion/:lessonId" element={<Lektion />} />
        <Route path="modi" element={<Modi />} />
        <Route path="karten" element={<Karten />} />
        <Route path="abschluss" element={<Abschluss />} />
        <Route path="spiel/:modusId" element={<Runde />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  );
}
