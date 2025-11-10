import {add, substract} from './calc.js'

test('subtract 2 - 1 to equal 1', () => {expect(substract(2, 1)).toBe(1);});
test('add 2 + 1 to equal 3', () => {expect(add(2, 1)).toBe(3);});