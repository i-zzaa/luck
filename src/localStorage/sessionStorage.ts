export const clearCache = async () => {
  if ('caches' in window) {
      const cacheNames = await caches.keys();
      cacheNames.forEach(async (name) => {
          await caches.delete(name);
      });
  }

  localStorage.clear();
  sessionStorage.clear();
};

window.addEventListener("unload", () => {
  localStorage.clear();
  sessionStorage.clear();
  
  if ('caches' in window) {
      caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
      });
  }
});
