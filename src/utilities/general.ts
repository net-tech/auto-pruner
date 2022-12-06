/**
 * Provides general utility functions which cannot be categorized.
 * @class
 */
class util {
	/**
	 * Decodes a base64 string.
	 * @param {string} base64String The base64 string to decode.
	 * @returns {string} The decoded string.
	 */
	public static decodeBase64(base64String: string): string {
		return Buffer.from(base64String, "base64").toString("ascii")
	}
}

export default util