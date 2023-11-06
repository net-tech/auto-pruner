import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	OAuth2Scopes
} from "discord.js"
import { supportServerInviteLink } from "../util/misc.js"
import type { Command } from "./index.js"

export default {
	data: {
		name: "about",
		description: "Get information about AutoPruner"
	},
	async execute(interaction) {
		const invite = interaction.client.generateInvite({
			permissions: 274878286850n,
			scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
		})

		const info = new EmbedBuilder()
			.setTitle("About AutoPruner")
			.setDescription(
				"AutoPruner automatically prunes members on a customizable interval. AutoPruner is written in TypeScript and uses the Discord.js library. It runs using Bun. It is made by [net-tech-](https://nettech.dev)."
			)
			.addFields([
				{
					name: "Statistics",
					value: `**Ping:** ${
						interaction.client.ws.ping
					}ms\n**Last restart:** <t:${Math.round(
						interaction.client.readyTimestamp / 1000
					)}:R>`
				}
			])
			.setColor("#2C2D31")

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel("Invite")
				.setURL(invite)
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Support Server")
				.setURL(supportServerInviteLink)
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Source Code")
				.setURL("https://github.com/net-tech/auto-pruner")
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Donate")
				.setURL("https://ko-fi.com/nettech")
				.setStyle(ButtonStyle.Link)
		)

		interaction.reply({
			embeds: [info],
			components: [row]
		})
	}
} satisfies Command
