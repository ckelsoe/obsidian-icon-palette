import { describe, it, expect } from '@jest/globals';
import RuleManager from '../src/managers/RuleManager.js';

// evaluateOperator is a private static. Unit-testing it needs a narrow typed
// handle; the cast keeps the production surface unchanged while exercising the
// real, pure operator dispatch that judgeFile delegates to. Call it through a
// wrapper so it stays bound to RuleManager (satisfies unbound-method).
const RuleManagerInternal = RuleManager as unknown as {
	evaluateOperator(operator: string, source: unknown, value: string, now: Date): boolean;
};
const evaluateOperator = (operator: string, source: unknown, value: string, now: Date): boolean =>
	RuleManagerInternal.evaluateOperator(operator, source, value, now);

// A fixed timestamp; the operators exercised here are time-independent.
const NOW = new Date('2026-07-03T12:00:00.000Z');

describe('RuleManager.evaluateOperator presence operators', () => {
	it('hasValue is true only when the source is present', () => {
		expect(evaluateOperator('hasValue', 'anything', '', NOW)).toBe(true);
		expect(evaluateOperator('hasValue', null, '', NOW)).toBe(false);
		expect(evaluateOperator('hasValue', undefined, '', NOW)).toBe(false);
	});

	it('hasProperty distinguishes undefined from a null-but-present value', () => {
		expect(evaluateOperator('hasProperty', undefined, '', NOW)).toBe(false);
		expect(evaluateOperator('hasProperty', null, '', NOW)).toBe(true);
	});
});

describe('RuleManager.evaluateOperator boolean operators', () => {
	it('matches isTrue and isFalse', () => {
		expect(evaluateOperator('isTrue', true, '', NOW)).toBe(true);
		expect(evaluateOperator('isTrue', false, '', NOW)).toBe(false);
		expect(evaluateOperator('isFalse', false, '', NOW)).toBe(true);
	});
});

describe('RuleManager.evaluateOperator string operators', () => {
	it('compares case-insensitively', () => {
		expect(evaluateOperator('is', 'Hello', 'hello', NOW)).toBe(true);
		expect(evaluateOperator('is', 'Hello', 'world', NOW)).toBe(false);
		expect(evaluateOperator('contains', 'Hello World', 'world', NOW)).toBe(true);
		expect(evaluateOperator('startsWith', 'Hello', 'hel', NOW)).toBe(true);
		expect(evaluateOperator('endsWith', 'Hello', 'LLO', NOW)).toBe(true);
	});

	it('treats an empty comparison value as no match for contains/startsWith/endsWith', () => {
		expect(evaluateOperator('contains', 'Hello', '', NOW)).toBe(false);
		expect(evaluateOperator('startsWith', 'Hello', '', NOW)).toBe(false);
	});

	it('matches a regular expression', () => {
		expect(evaluateOperator('matches', 'Hello', 'H.*o', NOW)).toBe(true);
		expect(evaluateOperator('matches', 'Hello', '^x', NOW)).toBe(false);
	});

	it('does not throw on an invalid regex, and reports no match', () => {
		expect(() => evaluateOperator('matches', 'Hello', '[invalid(', NOW)).not.toThrow();
		expect(evaluateOperator('matches', 'Hello', '[invalid(', NOW)).toBe(false);
	});
});

describe('RuleManager.evaluateOperator number operators', () => {
	it('compares numeric sources', () => {
		expect(evaluateOperator('equals', 42, '42', NOW)).toBe(true);
		expect(evaluateOperator('isLess', 42, '50', NOW)).toBe(true);
		expect(evaluateOperator('isMore', 42, '10', NOW)).toBe(true);
		expect(evaluateOperator('isDivisible', 42, '6', NOW)).toBe(true);
		expect(evaluateOperator('isDivisible', 42, '5', NOW)).toBe(false);
	});
});

describe('RuleManager.evaluateOperator now-relative datetime operators', () => {
	// These operators have no UI value field, so production always calls them
	// with value === '' and relies on `now` for the comparison target.
	const past = new Date('2026-07-03T11:00:00.000Z');
	const future = new Date('2026-07-03T13:00:00.000Z');

	it('isBeforeNow/isAfterNow classify a past number-source timestamp', () => {
		expect(evaluateOperator('isBeforeNow', past.getTime(), '', NOW)).toBe(true);
		expect(evaluateOperator('isAfterNow', past.getTime(), '', NOW)).toBe(false);
	});

	it('isBeforeNow/isAfterNow classify a future number-source timestamp', () => {
		expect(evaluateOperator('isAfterNow', future.getTime(), '', NOW)).toBe(true);
		expect(evaluateOperator('isBeforeNow', future.getTime(), '', NOW)).toBe(false);
	});

	it('isBeforeNow/isAfterNow classify a past string-source timestamp', () => {
		expect(evaluateOperator('isBeforeNow', past.toISOString(), '', NOW)).toBe(true);
		expect(evaluateOperator('isAfterNow', past.toISOString(), '', NOW)).toBe(false);
	});
});

describe('RuleManager.evaluateOperator array operators', () => {
	it('evaluates membership, count, any, and none', () => {
		const tags = ['apple', 'banana', 'cherry'];
		expect(evaluateOperator('includes', tags, 'banana', NOW)).toBe(true);
		expect(evaluateOperator('includes', tags, 'grape', NOW)).toBe(false);
		expect(evaluateOperator('countIs', tags, '3', NOW)).toBe(true);
		expect(evaluateOperator('anyContain', tags, 'ana', NOW)).toBe(true);
		expect(evaluateOperator('noneContain', tags, 'xyz', NOW)).toBe(true);
		expect(evaluateOperator('noneContain', tags, 'apple', NOW)).toBe(false);
	});
});

describe('RuleManager.evaluateOperator none* operators are case-insensitive', () => {
	const tags = ['draft'];

	it('noneContain treats an uppercase value like lowercase', () => {
		// 'draft' is present, so "none contain draft" is false either case.
		expect(evaluateOperator('noneContain', tags, 'Draft', NOW)).toBe(false);
		expect(evaluateOperator('noneContain', tags, 'draft', NOW)).toBe(false);
	});

	it('noneStartWith treats an uppercase value like lowercase', () => {
		expect(evaluateOperator('noneStartWith', tags, 'DRA', NOW)).toBe(false);
		expect(evaluateOperator('noneStartWith', tags, 'dra', NOW)).toBe(false);
	});

	it('noneEndWith treats an uppercase value like lowercase', () => {
		expect(evaluateOperator('noneEndWith', tags, 'AFT', NOW)).toBe(false);
		expect(evaluateOperator('noneEndWith', tags, 'aft', NOW)).toBe(false);
	});

	it('noneContain stays true when the value is genuinely absent', () => {
		expect(evaluateOperator('noneContain', tags, 'FINAL', NOW)).toBe(true);
	});

	it('noneMatch keeps raw-case regex semantics (unchanged by the fix)', () => {
		// Regex is case-sensitive by default; 'Draft' must not match 'draft'.
		expect(evaluateOperator('noneMatch', tags, 'Draft', NOW)).toBe(true);
		expect(evaluateOperator('noneMatch', tags, 'draft', NOW)).toBe(false);
	});
});

describe('RuleManager.evaluateOperator unknown operator', () => {
	it('returns false when no branch matches the operator', () => {
		expect(evaluateOperator('notARealOperator', 'Hello', 'Hello', NOW)).toBe(false);
	});
});
