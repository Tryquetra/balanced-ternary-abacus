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
     * Sorteia um alvo com exatamente min(level, numRods) trits não nulos,
     * em hastes distintas e com sinal aleatório por haste.
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

        // Fisher-Yates parcial: escolhe count hastes distintas
        const indices = [];
        for (let i = 0; i < rods; i++) {
            indices.push(i);
        }

        const trits = new Array(rods).fill(0);
        for (let k = 0; k < count; k++) {
            const span = rods - k;
            const offset = Math.min(span - 1, Math.max(0, Math.floor(random() * span)));
            const j = k + offset;
            const tmp = indices[k];
            indices[k] = indices[j];
            indices[j] = tmp;
            trits[indices[k]] = random() < 0.5 ? -1 : 1;
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
