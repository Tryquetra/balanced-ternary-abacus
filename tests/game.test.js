import { describe, expect, test } from "bun:test";
const TernaryGame = require("../assets/js/game.js");
const TernaryMath = require("../assets/js/ternary-math.js");

// RNG determinístico (mulberry32) para testes reproduzíveis
function seededRng(seed) {
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const countNonZero = (trits) => trits.filter((t) => t !== 0).length;

describe("TernaryGame.pickTarget", () => {
    test("níveis 1 a 7 produzem exatamente min(level, 7) trits não nulos", () => {
        for (let level = 1; level <= 7; level++) {
            const rng = seededRng(1000 + level);
            for (let i = 0; i < 50; i++) {
                const target = TernaryGame.pickTarget(level, rng);
                const trits = TernaryMath.decimalToBalanced(target, 7);
                expect(countNonZero(trits)).toBe(level);
                expect(TernaryMath.balancedToDecimal(trits)).toBe(target);
                expect(target).not.toBe(0);
            }
        }
    });

    test("alvos respeitam os limites de capacidade de 7 hastes", () => {
        const rng = seededRng(42);
        for (let i = 0; i < 200; i++) {
            const target = TernaryGame.pickTarget(7, rng);
            expect(Number.isInteger(target)).toBe(true);
            expect(target).toBeGreaterThanOrEqual(-1093);
            expect(target).toBeLessThanOrEqual(1093);
            expect(target).not.toBe(0);
        }
    });

    test("nível ocupa as hastes menos significativas e respeita o teto de magnitude", () => {
        for (let level = 1; level <= 7; level++) {
            const rng = seededRng(500 + level);
            const expectedRods = Array.from({ length: level }, (_, k) => k);
            for (let i = 0; i < 25; i++) {
                const target = TernaryGame.pickTarget(level, rng);
                const trits = TernaryMath.decimalToBalanced(target, 7);
                const activeRods = trits
                    .map((trit, rod) => (trit !== 0 ? rod : -1))
                    .filter((rod) => rod >= 0);
                expect(activeRods).toEqual(expectedRods);
                expect(Math.abs(target)).toBeLessThanOrEqual((3 ** level - 1) / 2);
            }
        }
    });

    test("sorteia sinais nos dois sentidos", () => {
        const rng = seededRng(7);
        let sawPositive = false;
        let sawNegative = false;
        for (let i = 0; i < 100; i++) {
            const target = TernaryGame.pickTarget(3, rng);
            const trits = TernaryMath.decimalToBalanced(target, 7);
            expect(countNonZero(trits)).toBe(3);
            if (target > 0) sawPositive = true;
            if (target < 0) sawNegative = true;
        }
        expect(sawPositive).toBe(true);
        expect(sawNegative).toBe(true);
    });

    test("nível acima de 7 satura em 7 trits", () => {
        const rng = seededRng(99);
        const target = TernaryGame.pickTarget(50, rng);
        const trits = TernaryMath.decimalToBalanced(target, 7);
        expect(countNonZero(trits)).toBe(7);
    });
});

describe("TernaryGame.levelForStreak", () => {
    test("rampa de dificuldade começa em 1 e satura em 7", () => {
        expect(TernaryGame.levelForStreak(0)).toBe(1);
        expect(TernaryGame.levelForStreak(1)).toBe(2);
        expect(TernaryGame.levelForStreak(5)).toBe(6);
        expect(TernaryGame.levelForStreak(6)).toBe(7);
        expect(TernaryGame.levelForStreak(100)).toBe(7);
    });
});

describe("TernaryGame.isMatch", () => {
    test("alvo nulo nunca corresponde", () => {
        expect(TernaryGame.isMatch(0, null)).toBe(false);
        expect(TernaryGame.isMatch(0, undefined)).toBe(false);
    });

    test("compara total e alvo com igualdade estrita", () => {
        expect(TernaryGame.isMatch(0, 0)).toBe(true);
        expect(TernaryGame.isMatch(5, 5)).toBe(true);
        expect(TernaryGame.isMatch(-42, -42)).toBe(true);
        expect(TernaryGame.isMatch(1, 0)).toBe(false);
        expect(TernaryGame.isMatch(0, 1)).toBe(false);
        expect(TernaryGame.isMatch(5, -5)).toBe(false);
    });
});

describe("TernaryGame.totalFromTrits", () => {
    test("soma ponderada usa as potências fornecidas", () => {
        const powers = TernaryGame.getPowersOf3(7);
        expect(TernaryGame.totalFromTrits([0, 0, 0, 0, 0, 0, 0], powers)).toBe(0);
        expect(TernaryGame.totalFromTrits([1, 0, 0, 0, 0, 0, 0], powers)).toBe(1);
        expect(TernaryGame.totalFromTrits([-1, -1, 1, 0, 0, 0, 0], powers)).toBe(5);
        expect(TernaryGame.totalFromTrits([1, 1, 1, 1, 1, 1, 1], powers)).toBe(1093);
        expect(TernaryGame.totalFromTrits(null, powers)).toBe(0);
    });
});
