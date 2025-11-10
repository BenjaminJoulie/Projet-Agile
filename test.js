import {additionner, soustraire, calculerMoyenne, calculerMediane} from './calc.js'

test('soustraire 2 - 1 donne 1', () => {expect(soustraire(2, 1)).toBe(1);});
test('additionner 2 + 1 donne 3', () => {expect(additionner(2, 1)).toBe(3);});

test('moyenne de [] vaut null', () => {expect(calculerMoyenne([])).toBeNull();});
test('moyenne de [1] vaut 1', () => {expect(calculerMoyenne([1])).toBe(1);});
test('moyenne de [1,2,3] vaut 2', () => {expect(calculerMoyenne([1,2,3])).toBe(2);});
test('la moyenne ignore les non-nombres', () => {expect(calculerMoyenne([1,'a',3])).toBe(2);});

test('médiane de [] vaut null', () => {expect(calculerMediane([])).toBeNull();});
test('médiane de [1] vaut 1', () => {expect(calculerMediane([1])).toBe(1);});
test('médiane de [1,3,5] vaut 3', () => {expect(calculerMediane([1,3,5])).toBe(3);});
test('médiane de [1,3,5,7] vaut 4', () => {expect(calculerMediane([1,3,5,7])).toBe(4);});