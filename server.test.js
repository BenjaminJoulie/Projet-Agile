const { genererCode, obtenirEtat, additionner, soustraire, calculerMoyenne, calculerMediane } = require('./server');

describe('Server Functions', () => {

    describe('Fonctions Utilitaires (Maths)', () => {
        test('additionner ajoute deux nombres', () => {
            expect(additionner(1, 2)).toBe(3);
            expect(additionner(-1, 1)).toBe(0);
        });

        test('soustraire soustrait b de a', () => {
            expect(soustraire(5, 3)).toBe(2);
            expect(soustraire(0, 5)).toBe(-5);
        });

        test('calculerMoyenne calcule la moyenne correctement', () => {
            expect(calculerMoyenne([10, 20])).toBe(15);
            expect(calculerMoyenne([0, 10, 20])).toBe(10);
            expect(calculerMoyenne([])).toBeNull();
        });

        test('calculerMediane calcule la médiane correctement (impair)', () => {
            expect(calculerMediane([1, 5, 10])).toBe(5);
        });

        test('calculerMediane calcule la médiane correctement (pair)', () => {
            expect(calculerMediane([1, 10, 20, 100])).toBe(15);
        });
    });

    describe('Logique Jeu', () => {
        test('genererCode doit retourner une chaine de la bonne longueur', () => {
            const code = genererCode(6);
            expect(code).toHaveLength(6);
            expect(typeof code).toBe('string');
        });

        test('genererCode ne doit contenir que des caractères alphanumériques', () => {
            const code = genererCode(10);
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        test('obtenirEtat doit formater correctement l\'objet partie', () => {
            const mockPartie = {
                titre: 'Sprint 1',
                taches: ['T1', 'T2'],
                indexQuestion: 0,
                demarre: true,
                enPause: false,
                pauseDemandeePar: null,
                joueurs: {
                    'socket1': { nom: 'Alice', vote: '5', estMaitre: true },
                    'socket2': { nom: 'Bob', vote: null, estMaitre: false }
                },
                chat: [],
                mode: 'strict',
                round: 1
            };

            const etat = obtenirEtat(mockPartie);

            expect(etat.titre).toBe('Sprint 1');
            expect(etat.taches).toEqual(['T1', 'T2']);
            expect(etat.joueurs).toHaveLength(2);
            expect(etat.joueurs[0].nom).toBe('Alice');
            expect(etat.joueurs[0].estMaitre).toBe(true);
        });
    });
});
