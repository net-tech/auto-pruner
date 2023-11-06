import { PermissionsBitField, type Snowflake } from "discord.js"

export const logChannelRequiredPermissions: readonly bigint[] = [
	PermissionsBitField.Flags.ViewChannel,
	PermissionsBitField.Flags.SendMessages,
	PermissionsBitField.Flags.SendMessagesInThreads,
	PermissionsBitField.Flags.EmbedLinks
] as const

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

export const colors = {
	red: 0xff3b30,
	embed: 0x2c2d31
}

export const guildSettings: readonly Setting[] = [
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

export const supportServerInviteLink = "https://discord.com/invite/wAhhesqCAH"
