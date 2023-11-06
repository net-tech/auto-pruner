/**
 * Takes an array and a maximum length it should have. If the array's length is greater than the maximum length, it trims the array to that length and appends a message indicating the number of additional items not shown.
 * The original array passed to the function may be modified.
 * @param array - The array to be trimmed.
 * @param maxLength - The maximum length the array should be.
 * @returns The modified array if it was longer than maxLength, otherwise the original array.
 *
 * @example
 * // returns ['Apple', 'Banana', 'and 1 more...']
 * listAndTrimArray(['Apple', 'Banana', 'Cherry'], 2);
 *
 * @example
 * // returns ['One', 'Two', 'Three']
 * listAndTrimArray(['One', 'Two', 'Three'], 5);
 */
export const listAndTrimArray = (array: string[], maxLength: number) => {
	if (array.length > maxLength) {
		const lengthDifference = array.length - maxLength
		// biome-ignore lint/style/noParameterAssign:
		array = array.slice(0, maxLength)
		array.push(`and ${lengthDifference} more...`)
	}
	return array
}
