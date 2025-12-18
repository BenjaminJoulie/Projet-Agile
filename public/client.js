/**
 * @file client.js
 * @description Logique côté client pour l'application Planning Poker.
 * @author Planning Poker Team
 */

// client.js
let socket;
let app;

// Éviter l'exécution immédiate si chargé via Node pour les tests
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.IS_TEST_ENV) {
  socket = io();
  app = document.getElementById('app');
}
/**
 * Code unique de la partie en cours.
 * @type {string|null}
 */
let codePartie = null;

/**
 * Liste des résultats validés (tâche + estimation finale).
 * @type {Array.<{task: string, priority: string}>}
 */
let resultatsValides = [];

/**
 * Dernier état reçu du serveur, utilisé pour rafraîchir la vue (ex: retour de récap).
 * @type {Object|null}
 */
let dernierEtat = null;


// Affiche l'écran d'accueil
/**
 * Affiche l'écran d'accueil avec les options Créer, Rejoindre, Reprendre.
 * @returns {void}
 */
function afficherAccueil() {
  app.innerHTML = `
    <div class="card">
      <h2>Planning Poker</h2>
      <div class="menu-grid">
        <button id="btnCreate" class="btn-large">Créer une partie</button>
        <button id="btnJoin" class="btn-large">Rejoindre</button>
        <button id="btnResume" class="btn-large">Reprendre</button>
      </div>
    </div>
  `;
  document.getElementById('btnCreate').onclick = afficherEcranCreation;
  document.getElementById('btnJoin').onclick = afficherEcranRejoindre;
  document.getElementById('btnResume').onclick = afficherEcranReprendre;

}

// Gère l'import du fichier JSON de tâches
/**
 * Gère l'import d'un fichier JSON contenant une liste de tâches.
 * @param {Event} e - L'événement de changement de l'input file.
 * @returns {void}
 */
function gererImportJson(e) {
  const fichier = e.target.files[0];
  if (!fichier) return;

  const lecteur = new FileReader();

  lecteur.onload = () => {
    try {
      const donnees = JSON.parse(lecteur.result);

      if (!Array.isArray(donnees.questions)) {
        alert('Le fichier JSON doit contenir un tableau "questions"');
        return;
      }

      // Nettoyer les tâches existantes
      document.getElementById('qs_wrap').innerHTML = '';

      // Ajouter les nouvelles tâches
      donnees.questions.forEach(q => ajouterTache(q));

      // Remplir le titre si présent
      if (donnees.title) {
        document.getElementById('g_title').value = donnees.title;
      }

    } catch (err) {
      alert('Fichier JSON invalide');
    }
  };

  lecteur.readAsText(fichier);
}


/**
 * Affiche le formulaire de création de partie.
 * @returns {void}
 */
function afficherEcranCreation() {
  app.innerHTML = `
    <div class="card">
      <h2>Créer une partie</h2>
      <label>Titre<br><input id="g_title" placeholder="Titre (ex: Sprint)"/></label>
      <label>Votre nom<br><input id="g_master" placeholder="Alice"/></label>
      <label>Règle de validation<br>
        <select id="g_mode">
          <option value="strict">Unanimité (Strict)</option>
          <option value="mean">Moyenne</option>
          <option value="median">Médiane</option>
          <option value="majority">Majorité absolue</option>
        </select>
      </label>
      <label>Importer tâches (JSON)<br>
        <input type="file" id="importJson" accept=".json"/>
      </label>
      <div id="qs_wrap"></div>
      <div class="row" style="margin-top:20px">
         <button id="addQ" class="btn-secondary">Ajouter un point</button>
      </div>
      <div class="actions-footer">
        <button id="back" class="btn-ghost">Retour</button>
        <button id="createBtn" class="btn-primary">Créer la partie</button> 
      </div>
    </div>
  `;
  document.getElementById('back').onclick = afficherAccueil;
  document.getElementById('addQ').onclick = () => ajouterTache('');
  document.getElementById('importJson').onchange = gererImportJson;
  ajouterTache('Point 1');
  ajouterTache('Point 2');

  document.getElementById('createBtn').onclick = () => {
    const titre = document.getElementById('g_title').value;
    const maitre = document.getElementById('g_master').value || 'Maitre';
    const mode = document.getElementById('g_mode').value;
    // Récupérer la liste des tâches
    const taches = Array.from(document.querySelectorAll('#qs_wrap textarea')).map(t => t.value).filter(x => x);

    if (taches.length === 0) { alert('Ajoutez au moins une tâche'); return; }

    socket.emit('create_game', { title: titre, masterName: maitre, questions: taches, mode }, (rep) => {
      if (rep && rep.ok) afficherEcranJeu(rep.code); else alert(rep && rep.error ? rep.error : 'Erreur');
    });
  };
}

/**
 * Ajoute une zone de texte pour une nouvelle tâche dans le formulaire de création.
 * @param {string} [texte=''] - Texte initial de la tâche.
 * @returns {void}
 */
function ajouterTache(texte = '') {
  const conteneur = document.getElementById('qs_wrap');
  const div = document.createElement('div'); div.className = 'card small';
  div.innerHTML = `<textarea rows="2" style="width:100%">${texte}</textarea><div style="text-align:right"><button class="delQ">Supprimer</button></div>`;
  conteneur.appendChild(div);
  div.querySelector('.delQ').onclick = () => div.remove();
}

/**
 * Affiche le formulaire pour rejoindre une partie existante.
 * @returns {void}
 */
function afficherEcranRejoindre() {
  app.innerHTML = `
    <div class="card">
      <h2>Rejoindre</h2>
      <label>Nom<br><input id="p_name" placeholder="Bob"/></label>
      <label>Code de partie<br><input id="p_code" placeholder="AB12CD"/></label>
      <div class="actions-footer">
        <button id="back" class="btn-ghost">Retour</button>
        <button id="joinBtn" class="btn-primary">Rejoindre</button> 
      </div>
    </div>
  `;
  document.getElementById('back').onclick = afficherAccueil;
  document.getElementById('joinBtn').onclick = () => {
    const nom = document.getElementById('p_name').value || 'Joueur';
    const code = document.getElementById('p_code').value.trim().toUpperCase();
    if (!code) return alert('Code requis');
    socket.emit('join_game', { code, name: nom }, (rep) => {
      if (rep && rep.ok) afficherEcranJeu(code); else alert(rep && rep.error ? rep.error : 'Erreur');
    });
  };
}

/**
 * Affiche l'écran permettant de reprendre une sauvegarde locale.
 * @returns {void}
 */
function afficherEcranReprendre() {
  app.innerHTML = `
    <div class="card">
      <h2>Reprendre une partie</h2>

      <label>Votre nom<br>
        <input id="r_name" placeholder="Alice"/>
      </label>

      <label>Fichier de sauvegarde<br>
        <input type="file" id="resumeFile" accept=".json"/>
      </label>

      <div class="actions-footer">
        <button id="back" class="btn-ghost">Retour</button>
        <button id="resumeBtn" class="btn-primary"> Reprendre</button>
      </div>
    </div>
  `;

  document.getElementById('back').onclick = afficherAccueil;
  document.getElementById('resumeBtn').onclick = reprendreDepuisFichier;
}

/**
 * Initialise le conteneur principal du jeu.
 * @param {string} code - Le code de la partie.
 * @returns {void}
 */
function afficherEcranJeu(code) {
  codePartie = code;
  app.innerHTML = `<div id="gameRoot"></div>`;
  document.getElementById('gameRoot').innerHTML = `<div class="card"><div id="game_title">Partie</div><div id="controls"></div></div><div id="main"></div>`;
  // La mise à jour viendra du serveur via 'game_update'
}

/**
 * Fonction principale : met à jour l'interface HTML selon l'état du jeu reçu du serveur.
 * Gère l'affichage des votes, des résultats, du chat, et des modes pause/fin.
 * @param {Object} etat - L'objet état renvoyé par le serveur.
 * @returns {void}
 */
function mettreAJourInterface(etat) {
  console.log('ETAT RECU', etat);
  dernierEtat = etat;
  if (!codePartie) return;
  const racine = document.getElementById('gameRoot'); if (!racine) return;

  // Gestion des demandes de Pause
  const jeSuisMaitre = etat.joueurs.some(j => j.estMaitre && j.id === socket.id);
  document.getElementById('game_title').innerHTML = `<strong>${echapperHtml(etat.titre)} </strong> Code : ${codePartie} — Tâche ${etat.indexQuestion + 1}/${etat.taches.length}`;
  console.log('Check Maitre:', jeSuisMaitre, socket.id); // DEBUG

  if (etat.pauseDemandeePar && !etat.enPause) {
    const ctrl = document.getElementById('controls');

    if (jeSuisMaitre) {
      ctrl.innerHTML = `
      <div class="card center">
        <strong>${echapperHtml(etat.pauseDemandeePar)}</strong> demande une pause
          <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
             <button id="acceptPause" class="btn-primary">Accepter</button>
             <button id="rejectPause" class="btn-secondary">Refuser</button>
          </div>
        </div>
    `;

      document.getElementById('acceptPause').onclick = () => {
        socket.emit('accept_pause', { code: codePartie });
      };
      document.getElementById('rejectPause').onclick = () => {
        socket.emit('reject_pause', { code: codePartie });
      };
    } else {
      ctrl.innerHTML = `
      <div class="card center muted">
        Pause demandée par ${echapperHtml(etat.pauseDemandeePar)}
      </div>
    `;
    }

    document.getElementById('main').innerHTML = '';
    return; //  On bloque l'affichage du reste si une pause est demandée
  }

  // Zone de contrôles (Votes / Cartes)
  const ctrl = document.getElementById('controls');
  let htmlControles = '';

  // Partie en pause effective
  if (etat.enPause) {
    if (jeSuisMaitre) {
      document.getElementById('controls').innerHTML = '';
      document.getElementById('main').innerHTML = `
    <div class="card center">
      La partie a été mise en pause
      <div style="margin-top:10px">
        <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
          <button id="goHome" class="btn-ghost">Menu</button>
          <button id="exportPause" class="btn-primary">Exporter</button>
          <button id="resumeGame" class="btn-secondary">Reprendre</button>
        </div>
      </div>
    </div>
  `;
    }
    else {
      document.getElementById('controls').innerHTML = '';
      document.getElementById('main').innerHTML = `
    <div class="card center">
      La partie a été mise en pause
      <div style="margin-top:10px">
        <button id="goHome" class="btn-ghost">Retour au menu</button>
      </div>
    </div>
  `;
    }

    document.getElementById('goHome').onclick = () => {
      codePartie = null;
      resultatsValides = [];
      afficherAccueil();
    };
    const boutonExportPause = document.getElementById('exportPause')
    if (boutonExportPause) {
      boutonExportPause.onclick = () => {
        exporterSauvegarde(etat);
      };
    }

    const btnResume = document.getElementById('resumeGame');
    if (btnResume) {
      btnResume.onclick = () => {
        socket.emit('resume_game', { code: codePartie });
      };
    }

    return;
  }

  if (!etat.demarre) {
    htmlControles += jeSuisMaitre ? `<button id="startBtn" class="btn-primary btn-large" style="justify-content:center">Démarrer la partie</button>` : `<div class="card center muted">En attente du maître...</div>`;
  } else {
    htmlControles += `<div class="card"><div id="questionBox">${echapperHtml(etat.taches[etat.indexQuestion] || '—')}</div></div>`;

    // Trouver mon vote actuel
    const moi = etat.joueurs.find(j => j.id === socket.id) || { vote: null };

    if (moi.vote === null) {
      htmlControles += `<div class="chips">${['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '100', 'Café'].map(v => `<div class="chip" data-v="${v}">${v}</div>`).join('')}</div>`;
    } else {
      htmlControles += `<div class="muted">Vous avez voté: <strong>${moi.vote === null ? '—' : moi.vote}</strong> <button id="unvote">Changer</button></div>`;
    }
  }
  ctrl.innerHTML = htmlControles;

  // Listeners des boutons de contrôle
  if (!etat.demarre) {
    const b = document.getElementById('startBtn'); if (b) b.onclick = () => socket.emit('start_game', { code: codePartie });
  } else {
    Array.from(document.querySelectorAll('.chip')).forEach(el => el.onclick = () => {
      const v = el.dataset.v;
      socket.emit('submit_vote', { code: codePartie, value: v });
    });
    const un = document.getElementById('unvote'); if (un) un.onclick = () => socket.emit('unvote', { code: codePartie });
  }

  // Liste des joueurs et Résultats
  const main = document.getElementById('main');
  const htmlJoueurs = etat.joueurs.map(j => `<div class="player">${echapperHtml(j.nom)}${j.estMaitre ? ' (maître)' : ''} — vote: ${j.vote === null ? '—' : 'ok'}</div>`).join('');

  // Vérifier si tout le monde a voté
  const toutLeMondeAVote = etat.joueurs.length > 0 && etat.joueurs.every(j => j.vote !== null);

  let htmlResultats = `<div class="card"><h3>Joueurs</h3>${htmlJoueurs}</div>`;

  if (toutLeMondeAVote) {
    htmlResultats += `<div class="card"><h3>Résultats</h3><ul>${etat.joueurs.map(j => `<li>${echapperHtml(j.nom)}: ${j.vote}</li>`).join('')}</ul></div>`;

    const tour = etat.tour || 1;
    const mode = etat.mode || 'strict';

    const resultat = calculerResultatVote(etat.joueurs, mode, tour);

    // Mise à jour des variables locales pour l'affichage
    let accordTrouve = resultat.accordTrouve;
    let valeurFinale = resultat.valeurFinale;

    if (accordTrouve) {
      if (resultat.toutCafe) {
        htmlResultats += `
        <div class="card center">
          Tout le monde veut un café ! Pause...
          ${jeSuisMaitre ? `<div style="margin-top:10px"><button id="exportPause" class="btn-primary">Exporter</button></div>` : ''}
        </div>`;
      } else if (valeurFinale !== null) {
        const modeLabels = {
          strict: 'Unanimité',
          mean: 'Moyenne',
          median: 'Médiane',
          majority: 'Majorité'
        };
        const libelleMode = modeLabels[mode] || mode;

        htmlResultats += `
           <div class="card center">
              <div style="font-size:1.2rem; margin-bottom:0.5rem">
                 Accord trouvé : <strong>${valeurFinale}</strong>
              </div>
              <div class="muted" style="font-size:0.9rem">
                 ${libelleMode} — ${tour}${tour === 1 ? 'er' : 'ème'} tour
              </div>`;
      }

      const tacheActuelle = etat.taches[etat.indexQuestion];
      const dejaSauvegarde = resultatsValides.some(r => r.task === tacheActuelle);

      if (!dejaSauvegarde && valeurFinale !== null) {
        resultatsValides.push({
          task: tacheActuelle,
          priority: valeurFinale
        });
      }

      if (jeSuisMaitre && etat.indexQuestion === etat.taches.length - 1) {
        // Fin de partie
        htmlResultats += `
          <div class="card center">
            <div class="muted">Fin de partie</div>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:10px">
              <button id="exportJson">Exporter les priorités (JSON)</button>
              <button id="showRecap" class="btn-secondary">Voir Récapitulatif</button>
            </div>
          </div>
        `;
      }
      else if (jeSuisMaitre) htmlResultats += `<div style="margin-top:8px"><button id="next">Suivant</button></div>`;
      htmlResultats += `</div>`;

    } else {
      // Pas d'accord
      htmlResultats += `<div class="card"><div class="muted">Votes différents — discutez ou revoter</div>${jeSuisMaitre ? `<div style="margin-top:8px"><button id="revote">Revoter</button></div>` : ''}</div>`;
    }
  }


  // Chat
  const chatDesactive = !toutLeMondeAVote ? 'disabled' : '';
  htmlResultats += `<div class="card"><h3>Chat</h3><div id="chatBox" class="chat">${etat.chat.map(m => `<div><strong>${echapperHtml(m.name)}</strong>: ${echapperHtml(m.msg)}</div>`).join('')}</div><div style="margin-top:8px"><input id="chatInput" placeholder="Message..." style="width:78%"/> <button id="sendChat" ${chatDesactive}>Envoyer</button> </div></div>`;

  main.innerHTML = htmlResultats;

  // Listeners finaux
  const exp = document.getElementById('exportJson');
  if (exp) {
    exp.onclick = () => exporterResultats(etat.titre);
  }

  const btnRecap = document.getElementById('showRecap');
  if (btnRecap) {
    btnRecap.onclick = afficherRecapitulatif;
  }

  const expPause = document.getElementById('exportPause');
  if (expPause) {
    expPause.onclick = () => exporterSauvegarde(etat);
  }

  const rb = document.getElementById('revote'); if (rb) rb.onclick = () => socket.emit('revote', { code: codePartie });
  const nx = document.getElementById('next'); if (nx) nx.onclick = () => socket.emit('next_question', { code: codePartie });
  const sc = document.getElementById('sendChat'); if (sc) sc.onclick = () => {
    const v = document.getElementById('chatInput').value.trim(); if (!v) return; socket.emit('send_chat', { code: codePartie, msg: v }); document.getElementById('chatInput').value = '';
  };

  // Scroll chat vers le bas
  const cb = document.getElementById('chatBox'); if (cb) cb.scrollTop = cb.scrollHeight;
}

/**
 * Échappe les caractères spéciaux HTML pour éviter les injections XSS.
 * @param {string} s - La chaîne à échapper.
 * @returns {string} La chaîne sécurisée.
 */
function echapperHtml(s) { if (!s && s !== 0) return ''; return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/**
 * Lit le fichier JSON sélectionné et tente de recréer la partie via le serveur.
 * @returns {void}
 */
function reprendreDepuisFichier() {
  const fichier = document.getElementById('resumeFile').files[0];
  const nom = document.getElementById('r_name').value || 'Maitre';

  if (!fichier) return alert('Fichier requis');

  const lecteur = new FileReader();

  lecteur.onload = () => {
    try {
      const donnees = JSON.parse(lecteur.result);

      if (!donnees.questions || donnees.current === undefined) {
        alert('Fichier invalide');
        return;
      }

      resultatsValides = donnees.results || [];

      socket.emit('create_game', {
        title: donnees.title,
        masterName: nom,
        questions: donnees.questions,
        current: donnees.current,
        resumed: true
      }, (rep) => {
        if (rep.ok) afficherEcranJeu(rep.code);
        else alert(rep.error);
      });

    } catch {
      alert('JSON invalide');
    }
  };

  lecteur.readAsText(fichier);
}

/**
 * Génère et télécharge un fichier JSON contenant les résultats validés.
 * @param {string} titre - Le titre de la partie.
 * @returns {void}
 */
function exporterResultats(titre) {
  if (!resultatsValides.length) {
    alert('Aucun résultat à exporter');
    return;
  }

  const donnees = {
    title: titre,
    results: resultatsValides
  };

  const blob = new Blob(
    [JSON.stringify(donnees, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = `${titre || 'planning-poker'}-resultats.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// --- FONCTIONS LOGIQUES ---

/**
 * Calcule le résultat du vote en fonction des joueurs, du mode et du tour.
 * @param {Array} joueurs - Liste des joueurs.
 * @param {string} mode - Mode de vote (strict, mean, median, majority).
 * @param {number} tour - Numéro du tour actuel.
 * @returns {Object} { accordTrouve, valeurFinale, toutCafe }
 */
function calculerResultatVote(joueurs, mode, tour) {
  // Filtrer les votes "Café" pour les calculs
  const votes = joueurs.map(j => j.vote).filter(v => v !== 'Café' && v !== 'cafe' && v !== 'café');
  const toutCafe = joueurs.every(j => j.vote === 'Café' || j.vote === 'cafe' || j.vote === 'café');

  let accordTrouve = false;
  let valeurFinale = null;

  if (toutCafe) {
    accordTrouve = true; // Consensus sur la pause
    return { accordTrouve, valeurFinale, toutCafe };
  }

  // Convertir (gestion du 1/2)
  const valeursNumeriques = votes.map(v => v === '1/2' ? 0.5 : parseFloat(v)).filter(n => !isNaN(n));

  // Le Tour 1 est TOUJOURS en mode Strict (Unanimité), sauf si tout café
  const leTour = tour || 1;
  const leMode = mode || 'strict';

  if (leTour === 1) {
    // Mode Strict (Tour 1)
    if (joueurs.length > 0) {
      const premierVote = joueurs[0].vote;
      accordTrouve = joueurs.every(j => j.vote === premierVote);
      if (accordTrouve) valeurFinale = premierVote;
    }
  } else {
    // Tours suivants
    if (leMode === 'strict') {
      const premierVote = joueurs[0].vote;
      accordTrouve = joueurs.every(j => j.vote === premierVote);
      if (accordTrouve) valeurFinale = premierVote;
    } else if (leMode === 'mean') {
      const avg = calculerMoyenne(valeursNumeriques);
      if (avg !== null) {
        valeurFinale = avg.toFixed(1);
        accordTrouve = true;
      }
    } else if (leMode === 'median') {
      const med = calculerMediane(valeursNumeriques);
      if (med !== null) {
        valeurFinale = med.toFixed(1);
        accordTrouve = true;
      }
    } else if (leMode === 'majority') {
      // Majorité absolue (> 50%)
      const compte = {};
      valeursNumeriques.forEach(x => compte[x] = (compte[x] || 0) + 1);
      const gagnant = Object.keys(compte).find(k => compte[k] > valeursNumeriques.length / 2);
      if (gagnant) {
        valeurFinale = gagnant; // String key
        accordTrouve = true;
      }
    }
  }

  return { accordTrouve, valeurFinale, toutCafe };
}

/**
 * Soustrait b de a.
 * @param {number} a - Première opérande.
 * @param {number} b - Deuxième opérande.
 * @returns {number} Résultat de a - b.
 */
function soustraire(a, b) {
  return a - b;
}

/**
 * Additionne a et b.
 * @param {number} a - Première opérande.
 * @param {number} b - Deuxième opérande.
 * @returns {number} Résultat de a + b.
 */
function additionner(a, b) {
  return a + b;
}

/**
 * Calcule la moyenne arithmétique d'une liste de nombres.
 * Les valeurs non numériques ou non finies sont ignorées.
 * @param {Array<number>} numbers - Tableau de nombres.
 * @returns {number|null} La moyenne ou null si aucun nombre valide.
 */
function calculerMoyenne(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;
  const valid = numbers.filter(n => typeof n === 'number' && Number.isFinite(n));
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
}

/**
 * Calcule la médiane d'une liste de nombres.
 * Les valeurs non numériques ou non finies sont ignorées.
 * @param {Array<number>} numbers - Tableau de nombres.
 * @returns {number|null} La médiane ou null si aucun nombre valide.
 */
function calculerMediane(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;
  const valid = numbers.filter(n => typeof n === 'number' && Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 0) {
    return (valid[mid - 1] + valid[mid]) / 2;
  }
  return valid[mid];
}

/**
 * Génère et télécharge une sauvegarde complète de l'état actuel (pour pause).
 * @param {Object} etat - L'état actuel de la partie.
 * @returns {void}
 */
function exporterSauvegarde(etat) {
  const donnees = {
    title: etat.titre,
    current: etat.indexQuestion,
    questions: etat.taches,
    results: resultatsValides
  };

  const blob = new Blob(
    [JSON.stringify(donnees, null, 2)],
    { type: 'application/json' }
  );

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${etat.titre || 'planning-poker'}-pause.json`;
  a.click();

  URL.revokeObjectURL(a.href);
}

/**
 * Affiche une vue modale / tableau récapitulatif de tous les votes validés.
 * @returns {void}
 */
function afficherRecapitulatif() {
  const main = document.getElementById('main');

  let html = `
    <div class="card">
      <h3>Récapitulatif de la partie</h3>
      <table style="width:100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border)">
            <th style="text-align:left; padding: 8px">Tâche</th>
            <th style="text-align:right; padding: 8px">Estimation</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (resultatsValides.length === 0) {
    html += `<tr><td colspan="2" style="text-align:center; padding:20px" class="muted">Aucun résultat validé pour le moment</td></tr>`;
  } else {
    resultatsValides.forEach(r => {
      html += `
        <tr style="border-bottom: 1px solid var(--border)">
          <td style="padding: 8px">${echapperHtml(r.task)}</td>
          <td style="text-align:right; padding: 8px"><strong>${r.priority}</strong></td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>
      <div style="margin-top: 20px; text-align: center">
        <button id="closeRecap" class="btn-ghost">Retour</button>
      </div>
    </div>
  `;

  main.innerHTML = html;

  document.getElementById('closeRecap').onclick = () => {
    if (dernierEtat) mettreAJourInterface(dernierEtat);
  };
}

// Listeners Socket.io
socket.on('connect', () => { console.log('Connecté au serveur', socket.id); });
socket.on('game_update', (etat) => {
  console.log('Mise à jour reçue');
  mettreAJourInterface(etat);
});
socket.on('chat_message', (m) => {
  const cb = document.getElementById('chatBox'); if (cb) { cb.innerHTML += `<div><strong>${echapperHtml(m.name)}</strong>: ${echapperHtml(m.msg)}</div>`; cb.scrollTop = cb.scrollHeight; }
});

afficherAccueil();





try {
  module.exports = {
    echapperHtml,
    mettreAJourInterface,
    afficherEcranReprendre,
    afficherEcranRejoindre,
    afficherEcranCreation,
    afficherAccueil,
    afficherAccueil,
    exporterSauvegarde,
    soustraire,
    additionner,
    calculerMoyenne,
    calculerMediane,
    calculerResultatVote
  };
} catch (e) {
  console.error('EXPORT ERROR:', e);
}
