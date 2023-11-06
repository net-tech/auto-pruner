import type { Guild, Role } from "@prisma/client"
import { MessageMentions } from "discord.js"
import type { RolesStringParserReturn, Setting } from "./misc.js"

export const getSettingDescription = (
	guildSettings: Guild & { roles: Role[] },
	setting: Setting
) => {
	const value = guildSettings[setting.value as keyof Guild]
	if (setting.channel) return value ? `<#${value}>` : null

	if (setting.role) {
		return `\n${guildSettings.roles
			.map((role) => {
				// deepcode ignore PureMethodReturnValueIgnored:
				return `> <@&${role.id}>`
			})
			.join("\n")}`
	}

	if (setting.value === "interval" && value instanceof Date) {
		const nextPrune: Date | undefined = guildSettings.lastPrune
			? new Date(value.getTime() + guildSettings.lastPrune.getTime())
			: undefined
		const intervalHuman = guildSettings.intervalHuman
		return `${intervalHuman}. ${
			nextPrune
				? `Next prune is approximately <t:${Math.round(
						nextPrune.getTime() / 1000
				  )}:R>`
				: ""
		}`
	}
	return value
}

export const parseRoles = (roles: string): RolesStringParserReturn => {
	if (roles.includes("reset")) return { reset: true, roles: [] }
	if (!roles.length) return { reset: false, roles: [] }
	if (!MessageMentions.RolesPattern.test(roles)) {
		return { reset: false, roles: [] }
	}
	const roleIds = roles
		.split(" ")
		.filter((role) => MessageMentions.RolesPattern.test(role))
		.map((role) => role.replace(/^<@&(\d{17,20})>$/, "$1"))
	return { reset: false, roles: roleIds }
}
