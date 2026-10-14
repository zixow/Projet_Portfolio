/* =========================================================
   Page Contact : vérification du formulaire
   ---------------------------------------------------------
   Pas de serveur : une fois le formulaire valide, la messagerie
   du visiteur s'ouvre avec le message déjà rempli.
   ========================================================= */

(function () {
  const { $, $$ } = window.Portfolio;
  const formulaire = $('#contact-form');
  if (!formulaire) return;
  const statut = $('#form-status');
  const motifEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Une règle par champ : renvoie true si c'est bon, sinon le message d'erreur
  const regles = {
    name: (v) => v.trim().length >= 2 || 'Merci d’indiquer votre nom (2 caractères minimum).',
    email: (v) => motifEmail.test(v.trim()) || 'Merci d’indiquer une adresse e-mail valide.',
    subject: (v) => v.trim().length >= 3 || 'Merci de préciser l’objet du message.',
    message: (v) => v.trim().length >= 10 || 'Votre message doit contenir au moins 10 caractères.',
  };

  const verifier = (champ) => {
    const resultat = regles[champ.name](champ.value);
    const valide = resultat === true;
    const groupe = champ.closest('.form-group');
    const erreur = $('.error', groupe);
    groupe.classList.toggle('invalid', !valide);
    erreur.textContent = valide ? '' : resultat;
    champ.setAttribute('aria-invalid', String(!valide));
    champ.setAttribute('aria-describedby', erreur.id);
    return valide;
  };

  const champs = $$('input, textarea', formulaire);
  champs.forEach((champ) => {
    champ.addEventListener('blur', () => { if (champ.value) verifier(champ); });
    champ.addEventListener('input', () => {
      if (champ.closest('.form-group').classList.contains('invalid')) verifier(champ);
    });
  });

  formulaire.addEventListener('submit', (e) => {
    e.preventDefault();
    const resultats = champs.map(verifier);
    if (resultats.includes(false)) {
      statut.textContent = '';
      champs[resultats.indexOf(false)].focus();
      return;
    }

    const donnees = Object.fromEntries(new FormData(formulaire));
    const corps = `${donnees.message}\n\n— ${donnees.name} (${donnees.email})`;
    window.location.href = `mailto:${formulaire.dataset.to}?subject=${encodeURIComponent(donnees.subject)}&body=${encodeURIComponent(corps)}`;

    statut.textContent = 'Merci ! Votre messagerie va s’ouvrir pour envoyer le message.';
    formulaire.reset();
  });
})();
