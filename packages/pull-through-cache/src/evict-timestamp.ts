export interface EvictTimestamp {
	hours: number;
	minutes: number;
}

/**
 * Sort the timestamps by 'hours ASC, minutes ASC'. Defaults to an empty array if no timestamps are
 * provided.
 */
export function sortEvictTimestamps(
	timestamps?: Array<EvictTimestamp>,
): Array<EvictTimestamp> {
	timestamps ??= [];

	return timestamps.sort((a, b) => {
		if (a.hours !== b.hours) {
			return a.hours - b.hours;
		}

		return a.minutes - b.minutes;
	});
}

/**
 * Select the next timestamp available after the provided hour and minute.
 * Automatically wraps around to the first timestamp i.e 00:00 or later, if no timestamp can be
 * found for later today.
 *
 * Note that we use minute precision, so callers might want to increment the 'minute' value to make
 * sure that the next timestamp is returned. If only a single timestamp exists, it is always
 * returned.
 */
export function selectNextTimestamp(
	timestamps: Array<EvictTimestamp>,
	currentHour: number,
	currentMinute: number,
): EvictTimestamp | undefined {
	if (timestamps.length <= 1) {
		// Return the only available timestamp or undefined.
		return timestamps[0];
	}

	for (const timestamp of timestamps) {
		if (timestamp.hours >= currentHour && timestamp.minutes > currentMinute) {
			return timestamp;
		}
	}

	// Wrap around to the next day.
	return timestamps[0];
}

/**
 * Determine how many milliseconds exist between the moment the function is called and the provided
 * timestamp. Automatically wraps around to the next day if the provided hours and minutes are
 * already in the past for today.
 */
export function millisecondsTillTimestamp(timestamp: EvictTimestamp): number {
	const now = new Date();
	const target = new Date();
	target.setUTCHours(timestamp.hours, timestamp.minutes, 0, 0);
	if (target.getTime() <= now.getTime()) {
		// Advance a day, if the next timestamp is in the past
		target.setUTCDate(target.getUTCDate() + 1);
	}

	return target.getTime() - now.getTime();
}
