import { URL } from "node:url"
import { Client, GatewayIntentBits, Options } from "discord.js"
import { loadCommands, loadEvents } from "./util/loaders.js"
import { registerEvents } from "./util/registerEvents.js"

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
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

const events = await loadEvents(new URL("events/", import.meta.url))
const commands = await loadCommands(new URL("commands/", import.meta.url))

registerEvents(commands, events, client)

client.login(Bun.env.DISCORD_TOKEN)
