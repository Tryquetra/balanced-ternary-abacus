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

    test("balancedToDecimal trata entradas vazias ou incompletas com resiliência", () => {
        expect(TernaryMath.balancedToDecimal(null)).toBe(0);
        expect(TernaryMath.balancedToDecimal(undefined)).toBe(0);
        expect(TernaryMath.balancedToDecimal([])).toBe(0);
        expect(TernaryMath.balancedToDecimal([null, undefined, 1])).toBe(9);
    });

    test("decimalToBalanced converte decimal para trits e reverte perfeitamente", () => {
        const testValues = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 10, -10, 42, -42, 1093, -1093];
        for (const val of testValues) {
            const trits = TernaryMath.decimalToBalanced(val, 7);
            const reconstructed = TernaryMath.balancedToDecimal(trits);
            expect(reconstructed).toBe(val);
        }
    });

    test("decimalToBalanced lida com strings numéricas e valores decimais com ponto flutuante", () => {
        const tritsFromString = TernaryMath.decimalToBalanced("42", 7);
        expect(TernaryMath.balancedToDecimal(tritsFromString)).toBe(42);

        const tritsFromFloat = TernaryMath.decimalToBalanced(42.8, 7);
        expect(TernaryMath.balancedToDecimal(tritsFromFloat)).toBe(42);
    });

    test("decimalToBalanced lança RangeError se exceder capacidade de hastes", () => {
        expect(() => TernaryMath.decimalToBalanced(1094, 7)).toThrow();
        expect(() => TernaryMath.decimalToBalanced(-1094, 7)).toThrow();
        expect(() => TernaryMath.decimalToBalanced(2, 1)).toThrow();
    });

    test("invertTrits inverte simetricamente todos os valores", () => {
        const trits = [1, -1, 0, 1, -1, 0, 0];
        const inverted = TernaryMath.invertTrits(trits);
        expect(inverted).toEqual([-1, 1, 0, -1, 1, 0, 0]);
        expect(TernaryMath.balancedToDecimal(inverted)).toBe(-TernaryMath.balancedToDecimal(trits));
    });

    test("addTrits executa adição com propagação de carry", () => {
        const trits4 = TernaryMath.decimalToBalanced(4, 7);
        const trits5 = TernaryMath.decimalToBalanced(5, 7);
        const sum9 = TernaryMath.addTrits(trits4, trits5, 7);
        expect(TernaryMath.balancedToDecimal(sum9)).toBe(9);

        const trits10 = TernaryMath.decimalToBalanced(10, 7);
        const tritsNeg4 = TernaryMath.decimalToBalanced(-4, 7);
        const sum6 = TernaryMath.addTrits(trits10, tritsNeg4, 7);
        expect(TernaryMath.balancedToDecimal(sum6)).toBe(6);
    });

    test("subtração via soma do inverso produz cancelamento exato", () => {
        const val = 345;
        const tritsA = TernaryMath.decimalToBalanced(val, 7);
        const tritsNegA = TernaryMath.invertTrits(tritsA);
        const zeroResult = TernaryMath.addTrits(tritsA, tritsNegA, 7);
        expect(TernaryMath.balancedToDecimal(zeroResult)).toBe(0);
    });

    test("getCapacity calcula faixas corretas para diferentes números de hastes", () => {
        expect(TernaryMath.getCapacity(1)).toEqual({ min: -1, max: 1 });
        expect(TernaryMath.getCapacity(2)).toEqual({ min: -4, max: 4 });
        expect(TernaryMath.getCapacity(3)).toEqual({ min: -13, max: 13 });
        expect(TernaryMath.getCapacity(7)).toEqual({ min: -1093, max: 1093 });
    });
});
