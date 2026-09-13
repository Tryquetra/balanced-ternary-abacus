import { describe, expect, test } from "bun:test";
const TernaryMath = require("../assets/js/ternary-math.js");

describe("TernaryMath", () => {
    test("getPowersOf3 calcula potências corretas de 3", () => {
        const powers = TernaryMath.getPowersOf3(7);
        expect(powers).toEqual([1, 3, 9, 27, 81, 243, 729]);
    });

    test("balancedToDecimal converte trits para decimal corretamente", () => {
        expect(TernaryMath.balancedToDecimal([0, 0, 0, 0, 0, 0, 0])).toBe(0);
        expect(TernaryMath.balancedToDecimal([1, 0, 0, 0, 0, 0, 0])).toBe(1);
        expect(TernaryMath.balancedToDecimal([-1, 0, 0, 0, 0, 0, 0])).toBe(-1);
        expect(TernaryMath.balancedToDecimal([1, 1, 0, 0, 0, 0, 0])).toBe(4);
        expect(TernaryMath.balancedToDecimal([-1, -1, 1, 0, 0, 0, 0])).toBe(5);
        expect(TernaryMath.balancedToDecimal([1, 1, -1, 0, 0, 0, 0])).toBe(-5);
        expect(TernaryMath.balancedToDecimal([1, 1, 1, 1, 1, 1, 1])).toBe(1093);
        expect(TernaryMath.balancedToDecimal([-1, -1, -1, -1, -1, -1, -1])).toBe(-1093);
    });

    test("decimalToBalanced converte decimal para trits e reverte perfeitamente", () => {
        const testValues = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 10, -10, 42, -42, 1093, -1093];
        for (const val of testValues) {
            const trits = TernaryMath.decimalToBalanced(val, 7);
            const reconstructed = TernaryMath.balancedToDecimal(trits);
            expect(reconstructed).toBe(val);
        }
    });

    test("decimalToBalanced lança RangeError se exceder capacidade de 7 hastes", () => {
        expect(() => TernaryMath.decimalToBalanced(1094, 7)).toThrow();
        expect(() => TernaryMath.decimalToBalanced(-1094, 7)).toThrow();
    });

    test("invertTrits inverte simetricamente todos os valores", () => {
        const trits = [1, -1, 0, 1, -1, 0, 0];
        const inverted = TernaryMath.invertTrits(trits);
        expect(inverted).toEqual([-1, 1, 0, -1, 1, 0, 0]);
        expect(TernaryMath.balancedToDecimal(inverted)).toBe(-TernaryMath.balancedToDecimal(trits));
    });

    test("addTrits executa adição com propagação de carry", () => {
        // 4 + 5 = 9
        const trits4 = TernaryMath.decimalToBalanced(4, 7);
        const trits5 = TernaryMath.decimalToBalanced(5, 7);
        const sum9 = TernaryMath.addTrits(trits4, trits5, 7);
        expect(TernaryMath.balancedToDecimal(sum9)).toBe(9);

        // 10 + (-4) = 6
        const trits10 = TernaryMath.decimalToBalanced(10, 7);
        const tritsNeg4 = TernaryMath.decimalToBalanced(-4, 7);
        const sum6 = TernaryMath.addTrits(trits10, tritsNeg4, 7);
        expect(TernaryMath.balancedToDecimal(sum6)).toBe(6);
    });

    test("getCapacity calcula faixa correta para 7 hastes", () => {
        const cap = TernaryMath.getCapacity(7);
        expect(cap).toEqual({ min: -1093, max: 1093 });
    });
});
