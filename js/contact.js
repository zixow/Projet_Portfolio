/* =========================================================
   Page Contact : vérification du formulaire et envoi
   ---------------------------------------------------------
   Avec PHP (XAMPP, hébergeur) : le message est enregistré dans la
   base de données par l'API api/contact.php, puis lu dans
   l'administration. Sans PHP (GitHub Pages) : la messagerie du
   visiteur s'ouvre avec le message déjà rempli.
   ========================================================= */

(function () {
  const { $, $$ } = window.Portfolio;
  const formulaire = $('#contact-form');
  if (!formulaire) return;
  const statut = $('#form-status');
  const boutonEnvoyer = $('button[type="submit"]', formulaire);
  const motifEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // GitHub Pages ne fait pas tourner PHP : on passe directement par la messagerie
  const apiPossible = location.protocol.startsWith('http') && !location.hostname.endsWith('github.io');

  // Une règle par champ : renvoie true si c'est bon, sinon le message d'erreur
  const regles = {
    name: (v) => v.trim().length >= 2 || 'Merci d’indiquer votre nom (2 caractères minimum).',
    email: (v) => motifEmail.test(v.trim()) || 'Merci d’indiquer une adresse e-mail valide.',
    subject: (v) => v.trim().length >= 3 || 'Merci de préciser l’objet du message.',
    message: (v) => v.trim().length >= 10 || 'Votre message doit contenir au moins 10 caractères.',
  };
  // Noms des champs côté serveur (API)
  const CHAMPS_API = { nom: 'name', email: 'email', objet: 'subject', message: 'message' };

  const afficherErreur = (champ, message) => {
    const groupe = champ.closest('.form-group');
    const erreur = $('.error', groupe);
    groupe.classList.toggle('invalid', Boolean(message));
    erreur.textContent = message || '';
    champ.setAttribute('aria-invalid', String(Boolean(message)));
    champ.setAttribute('aria-describedby', erreur.id);
  };

  const verifier = (champ) => {
    const resultat = regles[champ.name](champ.value);
    afficherErreur(champ, resultat === true ? '' : resultat);
    return resultat === true;
  };

  // Le champ piège (anti-robots) n'a pas de règle : il n'est pas vérifié
  const champs = $$('input, textarea', formulaire).filter((champ) => champ.name in regles);
  champs.forEach((champ) => {
    champ.addEventListener('blur', () => { if (champ.value) verifier(champ); });
    champ.addEventListener('input', () => {
      if (champ.closest('.form-group').classList.contains('invalid')) verifier(champ);
    });
  });

  const ouvrirMessagerie = (donnees) => {
    const corps = `${donnees.message}\n\n— ${donnees.name} (${donnees.email})`;
    window.location.href = `mailto:${formulaire.dataset.to}?subject=${encodeURIComponent(donnees.subject)}&body=${encodeURIComponent(corps)}`;
    statut.textContent = 'Merci ! Votre messagerie va s’ouvrir pour envoyer le message.';
    formulaire.reset();
  };

  /** Envoi à l'API. Renvoie true si c'est terminé (enregistré ou refusé), false s'il faut passer par la messagerie. */
  const envoyerALaBase = async (donnees) => {
    try {
      const reponse = await fetch('api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nom: donnees.name, email: donnees.email, objet: donnees.subject, message: donnees.message, site_web: donnees.site_web || '',
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!(reponse.headers.get('content-type') || '').includes('application/json')) return false; // pas de PHP ici
      const json = await reponse.json();

      if (reponse.status === 201) {
        statut.textContent = 'Merci ! Votre message a bien été envoyé. Je vous réponds au plus vite.';
        formulaire.reset();
        return true;
      }
      if (reponse.status === 422 && json.erreurs) { // le serveur a refusé un champ
        Object.entries(json.erreurs).forEach(([nom, message]) => {
          const champ = formulaire.elements[CHAMPS_API[nom]];
          if (champ) afficherErreur(champ, message);
        });
        statut.textContent = '';
        return true;
      }
      if (reponse.status === 429) {
        statut.textContent = json.erreur;
        return true;
      }
      return false; // base indisponible : on passe par la messagerie
    } catch (erreur) {
      return false;
    }
  };

  formulaire.addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultats = champs.map(verifier);
    if (resultats.includes(false)) {
      statut.textContent = '';
      champs[resultats.indexOf(false)].focus();
      return;
    }

    const donnees = Object.fromEntries(new FormData(formulaire));
    if (apiPossible) {
      boutonEnvoyer.disabled = true;
      statut.textContent = 'Envoi en cours…';
      const termine = await envoyerALaBase(donnees);
      boutonEnvoyer.disabled = false;
      if (termine) return;
    }
    ouvrirMessagerie(donnees);
  });
})();
