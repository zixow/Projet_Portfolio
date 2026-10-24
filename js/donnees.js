/* =========================================================
   Chargement du contenu (projets, compétences, certifications,
   actualités de la veille) enregistré dans la base de données
   ---------------------------------------------------------
   1. Si le site tourne avec PHP (XAMPP, hébergeur), on lit la
      base en direct grâce à l'API api/contenu.php.
   2. Sinon (GitHub Pages, ouverture sans serveur), on utilise la
      copie data/contenu.js, exportée depuis la base.
   Les pages utilisent : Portfolio.donnees.then((donnees) => …)
   ========================================================= */

window.Portfolio.donnees = (async () => {
  const copie = window.CONTENU_PORTFOLIO;
  // GitHub Pages ne fait pas tourner PHP : inutile d'interroger l'API
  const apiPossible = location.protocol.startsWith('http') && !location.hostname.endsWith('github.io');

  if (apiPossible) {
    try {
      // Pas de réponse 3 s après le chargement de la page : on prend la copie.
      // Le délai part du chargement, car la 3D de l'accueil occupe la page plusieurs secondes.
      const controleur = new AbortController();
      const lancerDelai = () => setTimeout(() => controleur.abort(), 3000);
      if (document.readyState === 'complete') lancerDelai();
      else window.addEventListener('load', lancerDelai, { once: true });

      const reponse = await fetch('api/contenu.php', {
        headers: { Accept: 'application/json' },
        signal: controleur.signal,
      });
      const json = (reponse.headers.get('content-type') || '').includes('application/json');
      if (reponse.ok && json) {
        const donnees = await reponse.json();
        document.documentElement.dataset.source = 'base';
        return { ...donnees, source: 'base' };
      }
    } catch (erreur) {
      /* serveur sans PHP ou base arrêtée : on utilise la copie */
    }
  }

  document.documentElement.dataset.source = 'copie';
  return { categories: [], competences: [], certifications: [], projets: [], actualites: [], ...copie, source: 'copie' };
})();
