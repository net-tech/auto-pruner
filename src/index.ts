import { URL } from "node:url"
import { Client, GatewayIntentBits, Options } from "discord.js"
import { loadCommands, loadEvents } from "./util/loaders.js"
import { registerEvents } from "./util/registerEvents.js"

// Initialize the client
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	makeCache: Options.cacheWithLimits({
		AutoModerationRuleManager: 0,
		UserManager: 10, // "... needs to have 10 or so for safety" - discord js people
		PresenceManager: 0,
		VoiceStateManager: 0,
		ThreadMemberManager: 0,
		StageInstanceManager: 0,
		ReactionUserManager: 0,
		MessageManager: 0,
		GuildMemberManager: 0,
		ReactionManager: 0,
		GuildBanManager: 0,
		GuildEmojiManager: 0,
		GuildInviteManager: 0,
		GuildScheduledEventManager: 0,
		GuildStickerManager: 0,
		BaseGuildEmojiManager: 0,
		DMMessageManager: 0
	}),
	allowedMentions: {
		parse: ["users"],
		repliedUser: true
	}
})

// Load the events and commands
const events = await loadEvents(new URL("events/", import.meta.url))
const commands = await loadCommands(new URL("commands/", import.meta.url))

// Register the event handlers
registerEvents(commands, events, client)

// Login to the client
client.login(Bun.env.DISCORD_TOKEN)
