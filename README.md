# Application de Planning Poker

Ce projet est une application web de Planning Poker réalisée dans le cadre du cours de gestion de projet agile. Elle a pour but de faciliter l'estimation collaborative des tâches, en offrant une solution simple et efficace pour les équipes, qu'elles soient sur site ou à distance.

##  Binôme

*   Joulie Benjamin
*   Yakoubene Gibril
*   Richand Marius

##  Objectifs et Fonctionnalités

L'application permet de fluidifier les rituels d'estimation grâce aux fonctionnalités suivantes :

### Gestion de Partie
*   **Création intuitive** : Configuration rapide du nom de la partie, du maître de jeu et des règles de vote.
*   **Flexibilité des règles** :
    *   **Mode Strict** : Recherche de l'unanimité absolue.
    *   **Modes Assistance** (Moyenne, Médiane, Majorité) : Le premier tour privilégie toujours l'unanimité pour favoriser le débat. Si aucun accord n'est trouvé, l'application propose automatiquement un résultat basé sur la règle choisie aux tours suivants.
    *   **Import/Export** : Chargement facile du backlog (JSON) et export des résultats finaux pour l'archivage.

### Expérience Utilisateur
*   **Temps Réel** : Les votes et les états des joueurs sont synchronisés instantanément pour tous les participants.
*   **Mode Café** : Une gestion native des pauses. Si l'équipe vote unanimement pour une pause café, la partie se met en veille et l'état est sauvegardé.
*   **Communication** : Un chat intégré permet d'échanger des arguments sans quitter l'interface de vote.

##  Installation et Utilisation

### Prérequis technique
*   Node.js
*   npm

### Mise en place
1.  **Récupération** : Clonez le projet sur votre poste.
2.  **Installation** : Lancez la commande `npm install` pour récupérer les dépendances.
3.  **Démarrage** : Lancez le serveur avec `npm start`.
4.  **Accès** : L'application est accessible à l'adresse `http://localhost:3000`.
5.  **Url GitHub** : Accessible à l'adresse `https://benjaminjoulie.github.io/Projet-Agile`.
6.  **Url Web** : Accessible à l'adresse `https://poker.benjoulie.xyz/`.

##  Architecture et Qualité

Nous avons mis un point d'honneur à rendre le code maintenable et fiable.

*   **Intégration Continue** : Chaque modification du code déclenche automatiquement une suite de tests via GitHub Actions, garantissant la stabilité du projet.
*   **Tests Unitaires** : La logique métier critique (notamment les algorithmes de calcul de vote) est couverte par des tests rigoureux (`npm test`).
*   **Documentation** : Le code source est documenté pour faciliter la reprise et la lecture.

---

