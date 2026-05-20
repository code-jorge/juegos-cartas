import { useEffect } from 'react';

const SITE_TITLE = 'Juegos de cartas';

export const usePageTitle = (gameTitle?: string) => {
  useEffect(() => {
    document.title = gameTitle ? `${gameTitle} | ${SITE_TITLE}` : SITE_TITLE;
  }, [gameTitle]);
};
