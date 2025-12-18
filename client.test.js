/**
 * @jest-environment jsdom
 */


global.window = { IS_TEST_ENV: true };
global.io = () => ({ emit: jest.fn(), on: jest.fn() });

global.URL = { createObjectURL: jest.fn(), revokeObjectURL: jest.fn() };
global.alert = jest.fn();


document.body.innerHTML = '<div id="app"></div>';

const { calculerResultatVote } = require('./public/client');

describe('Logique de Vote (Client)', () => {

    test('Tout le monde vote Café -> Pause', () => {
        const joueurs = [{ vote: 'Café' }, { vote: 'Café' }];
        const res = calculerResultatVote(joueurs, 'strict', 1);
        expect(res.toutCafe).toBe(true);
        expect(res.accordTrouve).toBe(true);
    });

    test('Tour 1 : Unanimité requise (Succès)', () => {
        const joueurs = [{ vote: '5' }, { vote: '5' }];
        const res = calculerResultatVote(joueurs, 'mean', 1);
        expect(res.accordTrouve).toBe(true);
        expect(res.valeurFinale).toBe('5');
    });

    test('Tour 1 : Unanimité requise (Échec)', () => {
        const joueurs = [{ vote: '5' }, { vote: '3' }];
        const res = calculerResultatVote(joueurs, 'strict', 1);
        expect(res.accordTrouve).toBe(false);
        expect(res.valeurFinale).toBeNull();
    });

    test('Tour 2 (Moyenne) : Calcule la moyenne', () => {
        const joueurs = [{ vote: '10' }, { vote: '20' }];
        const res = calculerResultatVote(joueurs, 'mean', 2);
        expect(res.accordTrouve).toBe(true);
        expect(res.valeurFinale).toBe('15.0');
    });

    test('Tour 2 (Médiane) : Calcule la médiane', () => {
        const joueurs = [{ vote: '10' }, { vote: '100' }, { vote: '20' }];
        const res = calculerResultatVote(joueurs, 'median', 2);
        expect(res.accordTrouve).toBe(true);
        expect(res.valeurFinale).toBe('20.0');
    });

    test('Tour 2 (Majorité) : Majorité Absolue', () => {
        const joueurs = [{ vote: '5' }, { vote: '5' }, { vote: '3' }];
        const res = calculerResultatVote(joueurs, 'majority', 2);
        expect(res.accordTrouve).toBe(true);
        expect(res.valeurFinale).toBe('5');
    });

    test('Tour 2 (Majorité) : Pas de majorité absolue', () => {
        const joueurs = [{ vote: '5' }, { vote: '3' }, { vote: '8' }, { vote: '5' }];
        const res = calculerResultatVote(joueurs, 'majority', 2);
        expect(res.accordTrouve).toBe(false);
    });

});
