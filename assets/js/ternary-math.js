/**
 * Módulo de Operações Matemáticas em Lógica Ternária Balanceada
 * Trits admitidos: -1, 0, 1
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TernaryMath = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Calcula as potências de 3 pré-computadas até numRods.
     * @param {number} numRods
     * @returns {number[]}
     */
    function getPowersOf3(numRods) {
        const powers = new Array(numRods);
        for (let i = 0; i < numRods; i++) {
            powers[i] = 3 ** i;
        }
        return powers;
    }

    /**
     * Converte um array de trits (onde o índice 0 é a menor potência 3^0) para decimal.
     * @param {number[]} trits
     * @returns {number}
     */
    function balancedToDecimal(trits) {
        if (!Array.isArray(trits)) return 0;
        let total = 0;
        let power = 1;
        for (let i = 0; i < trits.length; i++) {
            const val = trits[i] || 0;
            total += val * power;
            power *= 3;
        }
        return total;
    }

    /**
     * Converte um número decimal inteiro para um array de trits com comprimento numRods.
     * Lança erro se o valor exceder a capacidade do número de hastes.
     * @param {number} decimal
     * @param {number} [numRods=7]
     * @returns {number[]} Array de trits do índice 0 (3^0) ao índice numRods-1
     */
    function decimalToBalanced(decimal, numRods = 7) {
        const trits = new Array(numRods).fill(0);
        let n = Math.trunc(Number(decimal) || 0);

        let i = 0;
        while (n !== 0) {
            if (i >= numRods) {
                throw new RangeError(`Valor ${decimal} excede a capacidade de ${numRods} hastes.`);
            }
            let rem = ((n % 3) + 3) % 3;
            if (rem === 0) {
                trits[i] = 0;
                n = Math.trunc(n / 3);
            } else if (rem === 1) {
                trits[i] = 1;
                n = Math.trunc((n - 1) / 3);
            } else if (rem === 2) {
                trits[i] = -1;
                n = Math.trunc((n + 1) / 3);
            }
            i++;
        }

        return trits;
    }

    /**
     * Inverte a polaridade de todos os trits (negação aritmética).
     * @param {number[]} trits
     * @returns {number[]}
     */
    function invertTrits(trits) {
        return trits.map(trit => (trit === 0 ? 0 : -trit));
    }

    /**
     * Adiciona dois arrays de trits com propagação de vai-um (carry).
     * @param {number[]} a
     * @param {number[]} b
     * @param {number} [numRods=7]
     * @returns {number[]}
     */
    function addTrits(a, b, numRods = 7) {
        const result = new Array(numRods).fill(0);
        let carry = 0;

        for (let i = 0; i < numRods; i++) {
            const valA = a[i] || 0;
            const valB = b[i] || 0;
            const sum = valA + valB + carry;

            if (sum === 3) {
                result[i] = 0;
                carry = 1;
            } else if (sum === 2) {
                result[i] = -1;
                carry = 1;
            } else if (sum === 1) {
                result[i] = 1;
                carry = 0;
            } else if (sum === 0) {
                result[i] = 0;
                carry = 0;
            } else if (sum === -1) {
                result[i] = -1;
                carry = 0;
            } else if (sum === -2) {
                result[i] = 1;
                carry = -1;
            } else if (sum === -3) {
                result[i] = 0;
                carry = -1;
            }
        }

        return result;
    }

    /**
     * Retorna a capacidade máxima e mínima para determinado número de hastes.
     * Capacidade máxima = (3^numRods - 1) / 2
     * @param {number} numRods
     * @returns {{min: number, max: number}}
     */
    function getCapacity(numRods = 7) {
        const max = Math.trunc((3 ** numRods - 1) / 2);
        return { min: -max, max };
    }

    return {
        getPowersOf3,
        balancedToDecimal,
        decimalToBalanced,
        invertTrits,
        addTrits,
        getCapacity
    };
}));
