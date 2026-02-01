import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { Home } from './pages/Home';
import { SinglePlayer } from './pages/SinglePlayer';
import { Multiplayer } from './pages/Multiplayer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/single-player" element={<SinglePlayer />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/multiplayer/:gameId" element={<Multiplayer />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
