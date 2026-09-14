import {
	ApplicationCommandOptionType,
	type ChatInputCommandInteraction,
	MessageFlags,
	PermissionsBitField,
	TextDisplayBuilder
} from "discord.js"
import { getGuildData, updateGuildSettings } from "../util/database.js"
import {
	GUILD_REQUIRED_PERMISSIONS,
	GUILD_SETTINGS,
	LOG_CHANNEL_REQUIRED_PERMISSIONS,
	PRUNE_REQUIRES_ADMIN_MESSAGE,
	pruneRequiresAdministrator,
	type RolesStringParserReturn
} from "../util/misc.js"
import { parseInterval } from "../util/parseInterval.js"
import { getSettingDescription, parseRoles } from "../util/settings.js"
import type { Command } from "./index.js"

export default {
	data: {
		name: "settings",
		description:
			"Configure AutoPruner. Provide no input to see the current settings.",
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
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				content:
					"Something went wrong while executing that command. If this keeps happening please report it on support server (run /about for the link to it).",
				flags: MessageFlags.Ephemeral
			})
			return
		}

		const enabled = interaction.options.getBoolean("enabled")
		const intervalHuman = interaction.options.getString("interval")
		const days = interaction.options.getInteger("days")
		const rolesInput = interaction.options.getString("roles")
		const channel = interaction.options.getChannel("channel")

		await interaction.deferReply()

		const me = await interaction.guild.members.fetchMe()

		let roles: RolesStringParserReturn | undefined
		if (rolesInput) {
			roles = parseRoles(rolesInput)
			if (!roles.reset && roles.roles.length === 0) {
				await interaction.editReply({
					content:
						"Please mention at least one role or type `reset` to reset the roles to be pruned."
				})
				return
			}

			const invalidRoles = roles.roles.filter(
				(role) =>
					!interaction.guild.roles.cache.has(role) ||
					role === interaction.guildId
			)

			if (invalidRoles.length > 0) {
				await interaction.editReply({
					content: `The following roles cannot be used: ${invalidRoles
						.map((role) => `<@&${role}>`)
						.join(", ")}.`,
					allowedMentions: { parse: [] }
				})
				return
			}
		}

		if (channel) {
			const channelPermissions = channel.permissionsFor(me)
			if (!channelPermissions.has(LOG_CHANNEL_REQUIRED_PERMISSIONS)) {
				const missing = LOG_CHANNEL_REQUIRED_PERMISSIONS.filter(
					(permission) => !channelPermissions.has(permission)
				)
				await interaction.editReply({
					content: `I am missing the following permission${
						missing.length === 1 ? "" : "s"
					} in that channel: ${new PermissionsBitField(missing)
						.toArray()
						.join(", ")}.`
				})
				return
			}
		}

		let interval: Date | undefined
		if (intervalHuman) {
			if (!intervalHuman.startsWith("every ")) {
				await interaction.editReply({
					content: "The interval must start with `every`. E.g., `every 3 days`."
				})
				return
			}

			const parsed = parseInterval(intervalHuman)
			if (parsed === undefined || Number.isNaN(parsed)) {
				await interaction.editReply({
					content:
						"The interval must be a valid time interval. E.g., `every 3 days`."
				})
				return
			}

			// < 1 day
			if (parsed < 86_400_000) {
				await interaction.editReply({
					content: "The interval must be at least 1 day."
				})
				return
			}

			// >= 10 years
			if (parsed >= 365 * 10 * 86_400_000) {
				await interaction.editReply({
					content:
						"The interval must be less than 10 years."
				})
				return
			}

			interval = new Date(parsed)
		}

		try {
			await updateGuildSettings(interaction.guild.id, {
				id: interaction.guildId,
				enabled: enabled ?? undefined,
				interval,
				intervalHuman: intervalHuman ?? undefined,
				days: days ?? undefined,
				roles,
				logChannelId: channel?.id
			})
		} catch (error) {
			await interaction.editReply({
				content: `An error occurred while updating the guild settings.${
					error instanceof Error ? `\n\n${error.message}` : ""
				}\n\nIf this keeps happening please report it on support server (run /about for the link to it).`
			})
			return
		}

		const guildData = await getGuildData(interaction.guild.id)

		const lines = ["## Server Settings"]
		for (const setting of GUILD_SETTINGS) {
			lines.push(
				`**${setting.name}:** ${getSettingDescription(guildData, setting)}`
			)
		}

		const guildPermissions = me.permissions
		if (!guildPermissions.has(GUILD_REQUIRED_PERMISSIONS)) {
			const missing = GUILD_REQUIRED_PERMISSIONS.filter(
				(permission) => !guildPermissions.has(permission)
			)

			lines.push(
				"",
				`:warning: I am missing the following permission${
					missing.length === 1 ? "" : "s"
				} in this server: ${new PermissionsBitField(missing)
					.toArray()
					.join(", ")}.`
			)
		}

		if (
			pruneRequiresAdministrator(interaction.guild) &&
			!guildPermissions.has(PermissionsBitField.Flags.Administrator)
		) {
			lines.push("", `:warning: ${PRUNE_REQUIRES_ADMIN_MESSAGE}`)
		}

		await interaction.editReply({
			components: [new TextDisplayBuilder().setContent(lines.join("\n"))],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] }
		})
	}
} satisfies Command
