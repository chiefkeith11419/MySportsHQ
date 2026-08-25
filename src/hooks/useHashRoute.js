import { useEffect, useState } from 'react';

const readRoute = () => window.location.hash.replace(/^#\/?/, '') || 'home';

export function useHashRoute() {
  const [route, setRouteState] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => setRouteState(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setRoute = (next) => {
    const value = next || 'home';
    if (readRoute() === value) {
      setRouteState(value);
      return;
    }
    window.location.hash = value;
  };

  return [route, setRoute];
}
