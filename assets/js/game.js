/**
 * Módulo de Lógica do Modo Jogo
 * Gera alvos em ternário balanceado e valida a representação no ábaco.
 * Sem dependências externas: as potências de 3 são calculadas localmente.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TernaryGame = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const MAX_LEVEL = 7;

    /**
     * Calcula as potências de 3 até numRods.
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
     * Converte um array de trits para decimal usando as potências informadas.
     * @param {number[]} trits
     * @param {number[]} powers
     * @returns {number}
     */
    function totalFromTrits(trits, powers) {
        if (!Array.isArray(trits)) return 0;
        let total = 0;
        for (let i = 0; i < trits.length; i++) {
            const power = Array.isArray(powers) && powers[i] !== undefined ? powers[i] : 3 ** i;
            total += (trits[i] || 0) * power;
        }
        return total;
    }

    /**
     * Nível de dificuldade para uma sequência de acertos: começa em 1 e satura em 7.
     * @param {number} streak
     * @returns {number}
     */
    function levelForStreak(streak) {
        const wins = Math.trunc(Number(streak));
        const safeWins = Number.isFinite(wins) && wins > 0 ? wins : 0;
        return Math.min(safeWins + 1, MAX_LEVEL);
    }

    /**
     * Sorteia um alvo nas min(level, numRods) hastes menos significativas
     * (3^0 até 3^(count-1)), com sinal aleatório em cada uma.
     * Cada nível acrescenta exatamente uma haste, então a magnitude máxima
     * cresce de forma monotônica: |alvo| <= (3^level - 1) / 2.
     * @param {number} level
     * @param {() => number} [rng=Math.random]
     * @param {number} [numRods=7]
     * @returns {number} Inteiro dentro da capacidade do ábaco, nunca 0.
     */
    function pickTarget(level, rng = Math.random, numRods = 7) {
        const rods = Math.max(1, Math.trunc(Number(numRods)) || MAX_LEVEL);
        const parsedLevel = Math.trunc(Number(level));
        const requested = Number.isFinite(parsedLevel) ? parsedLevel : 1;
        const count = Math.min(Math.max(requested, 1), Math.min(MAX_LEVEL, rods));
        const random = typeof rng === 'function' ? rng : Math.random;

        const trits = new Array(rods).fill(0);
        for (let i = 0; i < count; i++) {
            trits[i] = random() < 0.5 ? -1 : 1;
        }

        return totalFromTrits(trits, getPowersOf3(rods));
    }

    /**
     * Indica se o total do ábaco corresponde ao alvo da rodada.
     * @param {number} total
     * @param {number|null} target
     * @returns {boolean}
     */
    function isMatch(total, target) {
        if (target === null || target === undefined) return false;
        return total === target;
    }

    return {
        MAX_LEVEL,
        getPowersOf3,
        totalFromTrits,
        levelForStreak,
        pickTarget,
        isMatch
    };
}));
