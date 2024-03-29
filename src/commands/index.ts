import type {
	AutocompleteInteraction,
	CommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody
} from "discord.js"
import type { StructurePredicate } from "../util/loaders.js"

/**
 * Defines the structure of a command
 */
export type Command = {
	/**
	 * The data for the command
	 */
	data: RESTPostAPIApplicationCommandsJSONBody
	/**
	 * The function to execute when the command is called
	 *
	 * @param interaction - The interaction of the command
	 */
	execute(interaction: CommandInteraction): Promise<void> | void
	/**
	 * The function to execute when it has autocomplete.
	 *
	 * @param interaction - the AutoComplete Interaction
	 */
	autocomplete?(interaction: AutocompleteInteraction): Promise<void> | void
}

// Defines the predicate to check if an object is a valid Command type
export const predicate: StructurePredicate<Command> = (
	structure
): structure is Command =>
	Boolean(structure) &&
	typeof structure === "object" &&
	// biome-ignore lint/style/noNonNullAssertion: predicate
	"data" in structure! &&
	"execute" in structure &&
	typeof structure.data === "object" &&
	typeof structure.execute === "function"
