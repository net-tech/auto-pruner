import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	OAuth2Scopes,
	PermissionsBitField,
	TextDisplayBuilder
} from "discord.js"
import {
	GUILD_REQUIRED_PERMISSIONS,
	SUPPORT_SERVER_INVITE_LINK
} from "../util/misc.js"
import type { Command } from "./index.js"

export default {
	data: {
		name: "about",
		description: "Get information about AutoPruner"
	},
	async execute(interaction) {
		const invite = interaction.client.generateInvite({
			permissions: new PermissionsBitField(GUILD_REQUIRED_PERMISSIONS),
			scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
		})

		const info = new TextDisplayBuilder().setContent(
			[
				"## About AutoPruner",
				"AutoPruner automatically prunes members on a customizable interval.",
				"",
				"## Statistics",
				`**Ping:** ${interaction.client.ws.ping}ms`,
				`**Last restart:** <t:${Math.round(
					interaction.client.readyTimestamp / 1000
				)}:R>`,
				`**Server count:** ${interaction.client.guilds.cache.size}`,
				`**Memory usage:** ${Math.round(
					process.memoryUsage().heapUsed / 1024 / 1024
				)} MB`
			].join("\n")
		)

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel("Invite")
				.setURL(invite)
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Support Server")
				.setURL(SUPPORT_SERVER_INVITE_LINK)
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Source Code")
				.setURL("https://github.com/avasilic/auto-pruner")
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Donate")
				.setURL("https://ko-fi.com/avasilic")
				.setStyle(ButtonStyle.Link)
		)

		await interaction.reply({
			components: [info, row],
			flags: MessageFlags.IsComponentsV2
		})
	}
} satisfies Command
