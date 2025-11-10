

/**
 * Soustrait b de a.
 * @param {number} a - Première opérande.
 * @param {number} b - Deuxième opérande.
 * @returns {number} Résultat de a - b.
 */
export function soustraire(a,b){
    return a-b;
}

/**
 * Additionne a et b.
 * @param {number} a - Première opérande.
 * @param {number} b - Deuxième opérande.
 * @returns {number} Résultat de a + b.
 */
export function additionner(a,b){
    return a+b;
}

/**
 * Calcule la moyenne arithmétique d'une liste de nombres.
 * Les valeurs non numériques ou non finies sont ignorées.
 * @param {Array<number>} numbers - Tableau de nombres.
 * @returns {number|null} La moyenne ou null si aucun nombre valide.
 */
export function calculerMoyenne(numbers){
    if(!Array.isArray(numbers) || numbers.length===0) return null;
    const valid = numbers.filter(n => typeof n === 'number' && Number.isFinite(n));
    if(valid.length===0) return null;
    const sum = valid.reduce((a,b)=>a+b,0);
    return sum / valid.length;
}

/**
 * Calcule la médiane d'une liste de nombres.
 * Les valeurs non numériques ou non finies sont ignorées.
 * @param {Array<number>} numbers - Tableau de nombres.
 * @returns {number|null} La médiane ou null si aucun nombre valide.
 */
export function calculerMediane(numbers){
    if(!Array.isArray(numbers) || numbers.length===0) return null;
    const valid = numbers.filter(n => typeof n === 'number' && Number.isFinite(n)).slice().sort((a,b)=>a-b);
    if(valid.length===0) return null;
    const mid = Math.floor(valid.length/2);
    if(valid.length % 2 === 0){
        return (valid[mid-1] + valid[mid]) / 2;
    }
    return valid[mid];
}