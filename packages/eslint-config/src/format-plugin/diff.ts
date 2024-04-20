/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */
import DiffMatchPatch from "diff-match-patch";

const LINE_ENDING_RE = /\r\n|[\r\n\u2028\u2029]/;

export function reportDifferences(context: any, source: string, formatted: string) {
	if (source !== formatted) {
		const createdDiff = new DiffMatchPatch().diff_main(source, formatted);
		const generatedDiff = generateDifferences(createdDiff);

		for (const diff of generatedDiff) {
			const { operation, offset, deleteText = "", insertText = "" } = diff;
			const range = [offset, offset + deleteText.length] as [number, number];

			const [start, end] =
				range.map((index) => context.sourceCode.getLocFromIndex(index)) ?? [];

			context.report({
				messageId: operation,
				data: {
					deleteText: showInvisibles(deleteText),
					insertText: showInvisibles(insertText),
				},
				loc: { start, end },
				fix: (fixer: any) => fixer.replaceTextRange(range, insertText),
			});
		}
	}
}

/**
 * Converts invisible characters to a commonly recognizable visible form.
 */
function showInvisibles(str: string) {
	let ret = "";
	for (let i = 0; i < str.length; i++) {
		switch (str[i]) {
			case " ":
				ret += "·"; // Middle Dot, \u00B7
				break;
			case "\n":
				ret += "⏎"; // Return Symbol, \u23ce
				break;
			case "\t":
				ret += "↹"; // Left Arrow To Bar Over Right Arrow To Bar, \u21b9
				break;
			case "\r":
				ret += "␍"; // Carriage Return Symbol, \u240D
				break;
			default:
				ret += str[i];
				break;
		}
	}
	return ret;
}

enum Op {
	INSERT = 1,
	EQUAL = 0,
	DELETE = -1,
}

/**
 * Generate results for differences between source code and formatted version.
 */
function generateDifferences(results: Array<[Op, string]>) {
	// fast-diff returns the differences between two texts as a series of
	// INSERT, DELETE or EQUAL operations. The results occur only in these
	// sequences:
	//           /-> INSERT -> EQUAL
	//    EQUAL |           /-> EQUAL
	//           \-> DELETE |
	//                      \-> INSERT -> EQUAL
	// Instead of reporting issues at each INSERT or DELETE, certain sequences
	// are batched together and are reported as a friendlier "replace" operation:
	// - A DELETE immediately followed by an INSERT.
	// - Any number of INSERTs and DELETEs where the joining EQUAL of one's end
	// and another's beginning does not have line endings (i.e. issues that occur
	// on contiguous lines).

	const differences: Array<{
		offset: number;
		operation: string;
		insertText?: string;
		deleteText?: string;
	}> = [];

	const batch: typeof results = [];
	let offset = 0; // NOTE: INSERT never advances the offset.
	while (results.length) {
		const result = results.shift()!;
		const op = result[0];
		const text = result[1];
		switch (op) {
			case Op.INSERT:
			case Op.DELETE:
				batch.push(result);
				break;
			case Op.EQUAL:
				if (results.length) {
					if (batch.length) {
						if (LINE_ENDING_RE.test(text)) {
							flush();
							offset += text.length;
						} else {
							batch.push(result);
						}
					} else {
						offset += text.length;
					}
				}
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				throw new Error(`Unexpected fast-diff operation "${op}"`);
		}
		if (batch.length && !results.length) {
			flush();
		}
	}

	return differences;

	function flush() {
		let aheadDeleteText = "";
		let aheadInsertText = "";
		while (batch.length) {
			const next = batch.shift()!;
			const op = next[0];
			const text = next[1];
			switch (op) {
				case Op.INSERT:
					aheadInsertText += text;
					break;
				case Op.DELETE:
					aheadDeleteText += text;
					break;
				case Op.EQUAL:
					aheadDeleteText += text;
					aheadInsertText += text;
					break;
			}
		}
		if (aheadDeleteText && aheadInsertText) {
			differences.push({
				offset,
				operation: generateDifferences.REPLACE,
				insertText: aheadInsertText,
				deleteText: aheadDeleteText,
			});
		} else if (!aheadDeleteText && aheadInsertText) {
			differences.push({
				offset,
				operation: generateDifferences.INSERT,
				insertText: aheadInsertText,
			});
		} else if (aheadDeleteText && !aheadInsertText) {
			differences.push({
				offset,
				operation: generateDifferences.DELETE,
				deleteText: aheadDeleteText,
			});
		}
		offset += aheadDeleteText.length;
	}
}

generateDifferences.INSERT = "insert";
generateDifferences.DELETE = "delete";
generateDifferences.REPLACE = "replace";
