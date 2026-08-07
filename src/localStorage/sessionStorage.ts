export const clearCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    // forEach com callback async não espera nada — as deleções rodavam
    // soltas e clearCache() podia "terminar" antes delas de fato
    // acontecerem. Promise.all garante que a função só resolve quando
    // todos os caches já foram apagados.
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  localStorage.clear();
  sessionStorage.clear();
};
