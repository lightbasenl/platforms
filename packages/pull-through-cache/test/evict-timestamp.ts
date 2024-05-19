import assert from "node:assert/strict";
import { test } from "node:test";
import {
	millisecondsTillTimestamp,
	selectNextTimestamp,
	sortEvictTimestamps,
} from "../src/evict-timestamp.js";

void test("sortEvictTimestamps", async (t) => {
	await t.test("defaults to an empty array", () => {
		assert.equal(sortEvictTimestamps().length, 0);
	});

	const testCases = [
		{
			name: "sorts by hour",
			input: [
				{ hours: 2, minutes: 0 },
				{ hours: 1, minutes: 0 },
			],
			output: [
				{ hours: 1, minutes: 0 },
				{ hours: 2, minutes: 0 },
			],
		},
		{
			name: "sorts by minute if hours are the same",
			input: [
				{ hours: 2, minutes: 0 },
				{ hours: 1, minutes: 10 },
				{ hours: 1, minutes: 5 },
			],
			output: [
				{ hours: 1, minutes: 5 },
				{ hours: 1, minutes: 10 },
				{ hours: 2, minutes: 0 },
			],
		},
	];

	for (const testCase of testCases) {
		await t.test(testCase.name, () => {
			assert.deepEqual(sortEvictTimestamps(testCase.input), testCase.output);
		});
	}
});

void test("selectNextTimestamp", async (t) => {
	const testCases = [
		{
			name: "returns undefined if the input array is empty",
			input: [],
			inputTimestamp: { currentHour: 0, currentMinute: 0 },
			output: undefined,
		},
		{
			name: "returns the only timestamp if a single timestamp is provided",
			input: [{ hours: 2, minutes: 0 }],
			inputTimestamp: { currentHour: 1, currentMinute: 0 },
			output: {
				hours: 2,
				minutes: 0,
			},
		},
		{
			name: "returns the timestamp *after* the current time",
			input: [
				{ hours: 2, minutes: 0 },
				{ hours: 2, minutes: 1 },
			],
			inputTimestamp: { currentHour: 2, currentMinute: 0 },
			output: {
				hours: 2,
				minutes: 1,
			},
		},
		{
			name: "returns the first available match on unsorted inputs",
			input: [
				{ hours: 2, minutes: 2 },
				{ hours: 2, minutes: 1 },
			],
			inputTimestamp: { currentHour: 2, currentMinute: 0 },
			output: {
				hours: 2,
				minutes: 2,
			},
		},
		{
			name: "returns the first input if no timestamps match",
			input: [
				{ hours: 2, minutes: 2 },
				{ hours: 13, minutes: 15 },
				{ hours: 14, minutes: 45 },
			],
			inputTimestamp: { currentHour: 15, currentMinute: 20 },
			output: {
				hours: 2,
				minutes: 2,
			},
		},
	];

	for (const testCase of testCases) {
		await t.test(testCase.name, () => {
			assert.deepEqual(
				selectNextTimestamp(
					testCase.input,
					testCase.inputTimestamp.currentHour,
					testCase.inputTimestamp.currentMinute,
				),
				testCase.output,
			);
		});
	}
});

void test("millisecondsTillTimestamp", async (t) => {
	// Seed with a random start date between 0 and 5 minutes.
	const minutes = Math.floor(Math.random() * 5);
	const now = minutes * 60 * 1000;

	t.beforeEach(() =>
		t.mock.timers.enable({
			now,
			apis: ["Date"],
		}),
	);
	t.afterEach(() => {
		t.mock.timers.reset();
	});

	const testCases = [
		{
			name: "returns the value in milliseconds",
			input: {
				hours: 0,
				minutes: 15,
			},
			output: 15 * 60 * 1000 - now,
		},
		{
			name: "returns the value with hours as well",
			input: {
				hours: 1,
				minutes: 15,
			},
			output: (60 + 15) * 60 * 1000 - now,
		},
		{
			name: "wraps around to the next day",
			input: {
				hours: 0,
				minutes: 0,
			},
			output: 24 * 60 * 60 * 1000 - now,
		},
		{
			name: "returns a full day if the input is exactly now",
			input: {
				hours: 0,
				minutes: minutes,
			},
			output: 24 * 60 * 60 * 1000,
		},
	];

	for (const testCase of testCases) {
		await t.test(testCase.name, () => {
			assert.equal(millisecondsTillTimestamp(testCase.input), testCase.output);
		});
	}
});
