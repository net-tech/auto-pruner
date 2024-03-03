import { PermissionsBitField, type Snowflake } from "discord.js"

export const LOG_CHANNEL_REQUIRED_PERMISSIONS: readonly bigint[] = [
	// To be able to see the logging channel.
	PermissionsBitField.Flags.ViewChannel,
	// To be able to send log messages in the logging channel.
	PermissionsBitField.Flags.SendMessages,
	// To be able to send log messages in the logging channel if it is a thread.
	PermissionsBitField.Flags.SendMessagesInThreads,
	// To be able to send log embeds in the logging channel.
	PermissionsBitField.Flags.EmbedLinks,
	// To be able to attach files to the log messages (future feature).
	PermissionsBitField.Flags.AttachFiles
] as const

export const GUILD_REQUIRED_PERMISSIONS: readonly bigint[] = [
	// To be able to see the logging channel.
	PermissionsBitField.Flags.ViewChannel,
	// To be able to send log messages in the logging channel.
	PermissionsBitField.Flags.SendMessages,
	// To be able to send log messages in the logging channel if it is a thread.
	PermissionsBitField.Flags.SendMessagesInThreads,
	// To be able to send log embeds in the logging channel.
	PermissionsBitField.Flags.EmbedLinks,
	// To be able to attach files to the log messages (future feature).
	PermissionsBitField.Flags.AttachFiles,
	// To be able to see if the guild was manually pruned (future feature).
	PermissionsBitField.Flags.ViewAuditLog,
	// To be able to prune members.
	PermissionsBitField.Flags.ManageGuild,
	// To be able to prune members.
	PermissionsBitField.Flags.KickMembers
]

export interface Setting {
	name: string
	value: string
	role: RoleSettingType | false
	channel: boolean
}

export interface RoleSettingType {
	allowMultiple: boolean
	allowReset: boolean
}

// Internal

export interface RolesStringParserReturn {
	reset: boolean
	roles: Snowflake[]
}

export interface ScheduledPruneInfo {
	guildId: Snowflake
	pruneCount: number | undefined
	roles: Snowflake[]
	days: number
	date: Date
}

export const COLORS = {
	red: 0xff3b30,
	embed: 0x2c2d31
} as const

export const GUILD_SETTINGS: readonly Setting[] = [
	{
		name: "Auto-prune enabled",
		value: "enabled",
		channel: false,
		role: false
	},
	{
		name: "Auto-prune interval",
		value: "interval",
		channel: false,
		role: false
	},
	{
		name: "Prune days",
		value: "days",
		channel: false,
		role: false
	},
	{
		name: "Prune roles",
		value: "roles",
		channel: false,
		role: {
			allowMultiple: true,
			allowReset: true
		}
	},
	{
		name: "Log channel",
		value: "logChannelId",
		channel: true,
		role: false
	}
] as const

export const SUPPORT_SERVER_INVITE_LINK =
	"https://discord.com/invite/wAhhesqCAH"
