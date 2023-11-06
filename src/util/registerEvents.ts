import { type Client, Events } from "discord.js"
import { nanoid } from "nanoid"
import type { Command } from "../commands/index.js"
import type { Event } from "../events/index.js"
import { logger } from "./logger.js"

export function registerEvents(
	commands: Map<string, Command>,
	events: Event[],
	client: Client
): void {
	const interactionCreateEvent: Event<Events.InteractionCreate> = {
		name: Events.InteractionCreate,
		async execute(interaction) {
			if (interaction.isCommand()) {
				const command = commands.get(interaction.commandName)

				if (!command) {
					const id = nanoid()
					logger.error(`Unknown command ${interaction.commandName}.`, {
						id,
						interaction
					})
					interaction.reply({
						content: `Command ${interaction.commandName} not found. This is a bug. Please report it to the developers with the ID \`${id}\`.`,
						ephemeral: true
					})
					return
				}

				try {
					await command.execute(interaction)
				} catch (error) {
					const id = nanoid()
					logger.error(error, "An error occurred while executing a command.", {
						id,
						interaction
					})
					interaction.reply({
						content: `Command ${interaction.commandName} not found. This is a bug. Please report it to the developers with the ID \`${id}\`.`,
						ephemeral: true
					})
					return
				}
			}
		}
	}

	for (const event of [...events, interactionCreateEvent]) {
		client[event.once ? "once" : "on"](event.name, async (...args) =>
			event.execute(...args)
		)
	}
}
