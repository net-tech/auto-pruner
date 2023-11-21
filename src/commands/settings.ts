import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionsBitField
} from "discord.js"
import { getGuildData, updateGuildSettings } from "../util/database.js"
import {
	RolesStringParserReturn,
	colors,
	guildSettings,
	logChannelRequiredPermissions
} from "../util/misc.js"
import { parseInterval } from "../util/parseInterval.js"
import { getSettingDescription, parseRoles } from "../util/settings.js"
import type { Command } from "./index.js"

export default {
	data: {
		name: "settings",
		description:
			"Configure AutoPruner. Provide no arguments to see the current settings.",
		dm_permission: false,
		default_member_permissions:
			PermissionsBitField.Flags.ManageGuild.toString(),
		options: [
			{
				name: "enabled",
				description: "Whether or not the auto-prune should be enabled.",
				type: ApplicationCommandOptionType.Boolean,
				required: false
			},
			{
				name: "interval",
				description:
					"How often the auto-prune should run. Must start with the word 'every'. E.g.\"every 3 days\".",
				type: ApplicationCommandOptionType.String,
				required: false
			},
			{
				name: "days",
				description: "The number of days to use when pruning.",
				max_value: 30,
				min_value: 1,
				type: ApplicationCommandOptionType.Integer,
				required: false
			},
			{
				name: "roles",
				description:
					'The roles to include when pruning. This overwrites the current setting. To reset, put "reset".',
				type: ApplicationCommandOptionType.String,
				required: false
			},
			{
				name: "channel",
				description: "The channel to log auto-prunes in.",
				type: ApplicationCommandOptionType.Channel,
				required: false
			}
		]
	},

	async execute(interaction: ChatInputCommandInteraction) {
		if (!(interaction.guild && interaction.inCachedGuild())) return

		const enabled = interaction.options.getBoolean("enabled")
		let interval: string | Date | null =
			interaction.options.getString("interval")
		const days = interaction.options.getInteger("days")
		let roles: RolesStringParserReturn | string | null =
			interaction.options.getString("roles")
		const channel = interaction.options.getChannel("channel")

		await interaction.deferReply()

		if (roles) {
			roles = parseRoles(roles)
			if (!roles.reset && roles.roles.length === 0) {
				interaction.editReply({
					content:
						"Please mention at least one role or type `reset` to reset the roles to be pruned."
				})
				return
			}

			// Check that the roles are valid
			if (roles.roles.length > 0) {
				const invalidRoles = roles.roles.filter(
					(role) =>
						!interaction.guild.roles.cache.has(role) ||
						role === interaction.guildId
				)

				if (invalidRoles.length > 0) {
					interaction.editReply({
						content: `The following roles are invalid and do not exist: ${invalidRoles
							.map((role) => `<@&${role}>`)
							.join(", ")}.`,
						allowedMentions: { roles: [] }
					})
					return
				}
			}
		}

		if (channel) {
			const me = await interaction.guild.members.fetchMe()
			const permissions = channel.permissionsFor(me)
			if (!permissions.has(logChannelRequiredPermissions)) {
				const missing = logChannelRequiredPermissions.filter(
					(permission) => !permissions.has(permission)
				)
				interaction.editReply({
					content: `I am missing the following permission(s) in that channel: ${new PermissionsBitField(
						missing
					)
						.toArray()
						.join(", ")}.`
				})
				return
			}
		}

		if (interval) {
			if (!interval.startsWith("every ")) {
				interaction.editReply({
					content: "The interval must start with `every`. E.g. `every 3 days`."
				})
				return
			}
			interval = new Date(parseInterval(interval))
			if (!interval || Number.isNaN(interval.getTime())) {
				interaction.editReply({
					content:
						"The interval must be a valid time interval. E.g. `every 3 days`."
				})
				return
				// < 1 day
			} else if (interval.getTime() < 86_400_000) {
				interaction.editReply({
					content: "The interval must be at least 1 day."
				})
				return
				// >= 10 years
			} else if (interval.getTime() >= 365 * 10 * 86_400_000) {
				interaction.editReply({
					content:
						"Really? You want to prune every 10+ years? The interval must be less than 10 years."
				})
				return
			}
		}

		await updateGuildSettings(interaction.guild.id, {
			id: interaction.guildId,
			enabled: enabled ?? undefined,
			interval: interval ?? undefined,
			intervalHuman: interaction.options.getString("interval") ?? undefined,
			days: days ?? undefined,
			roles: roles as RolesStringParserReturn | undefined,
			logChannelId: channel?.id
		}).catch((err) => {
			interaction.editReply({
				content: `An error occurred while updating the guild settings. ${
					err.message ? `\n\n${err.message}` : ""
				}`
			})
			return
		})

		const guildData = await getGuildData(interaction.guild.id)

		const settingsEmbed = new EmbedBuilder()
			.setTitle("Server Settings")
			.setAuthor({
				name: interaction.guild.name,
				iconURL: interaction.guild.iconURL() || ""
			})
			.setColor(colors.embed)

		// Process the settings and generate description
		for (const setting of guildSettings) {
			if (!settingsEmbed.data.description) settingsEmbed.data.description = ""
			settingsEmbed.data.description += `**${
				setting.name
			}:** ${getSettingDescription(guildData, setting)}${
				setting.name === "roles" ? "" : "\n"
			}`
		}

		settingsEmbed.data.description = settingsEmbed.data.description
			?.replaceAll(/undefined|null/gim, "Not set")
			.replaceAll("true", "✅")
			.replaceAll("false", "❌")

		return void interaction.editReply({ embeds: [settingsEmbed] })
	}
} satisfies Command
