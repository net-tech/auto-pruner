import { URL } from "node:url"
import { API } from "@discordjs/core"
import { REST } from "@discordjs/rest"
import { loadCommands } from "./loaders.js"

const commands = await loadCommands(new URL("../commands/", import.meta.url))
const commandData = [...commands.values()].map((command) => command.data)

const rest = new REST({ version: "10" }).setToken(
	Bun.env.DISCORD_TOKEN as string
)
const api = new API(rest)

await api.applicationCommands
	.bulkOverwriteGlobalCommands(Bun.env.APPLICATION_ID as string, commandData)
	.then((commands) => {
		console.log(`Successfully registered ${commands.length} commands.`)
	})
	.catch((error) => {
		console.error("Failed to register application commands:", error)
	})
