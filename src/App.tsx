import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameSelector } from './components/GameSelector';
import { EscobaPage } from './pages/EscobaPage';
import { AddictionSolitairePage } from './pages/AddictionSolitairePage';
import { BlockadePage } from './pages/BlockadePage';
import { CrescentPage } from './pages/CrescentPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelector />} />
        <Route path="/escoba" element={<EscobaPage />} />
        <Route path="/addiction-solitaire" element={<AddictionSolitairePage />} />
        <Route path="/blockade" element={<BlockadePage />} />
        <Route path="/crescent" element={<CrescentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
