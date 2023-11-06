import { Prisma, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
	errorFormat: "pretty"
})

/**
 * Fetch data for a specific guild. If the guild doesn't exist in the database, a new record is created with the provided guildId.
 * @param guildId - The ID of the guild to fetch data for
 * @returns The data for the guild
 */
export const getGuildData = async (guildId: string) => {
	const guildData = await prisma.guild.upsert({
		where: {
			id: guildId
		},
		update: {},
		create: {
			id: guildId
		},
		include: {
			roles: true
		}
	})
	return guildData
}

/**
 * Update the settings of a guild, especially its associated roles.
 *
 * If the `reset` property is set to true in the roles, all roles for the guild will be deleted.
 * If roles are provided as an array, the function will sync the database to match the provided list,
 * adding or removing roles as necessary.
 *
 * @param guildId - The ID of the guild to update.
 * @param settings - An object containing the settings to update.
 */
export const updateGuildSettings = async (
	guildId: string,
	settings: Prisma.GuildCreateInput & {
		roles: { reset: boolean; roles: string[] } | undefined
	}
): Promise<void> => {
	if (settings.roles) {
		if (settings.roles.reset) {
			await resetRolesForGuild(guildId)
		} else if (settings.roles.roles) {
			await syncRolesForGuild(guildId, settings.roles.roles)
		}
	}

	// Prepare settings for upsert operation
	const upsertSettings: Prisma.GuildCreateInput = {
		...settings,
		roles: undefined
	}

	await prisma.guild.upsert({
		where: { id: guildId },
		update: upsertSettings,
		create: { ...upsertSettings }
	})
}

/**
 * Reset (delete) all roles associated with a specific guild.
 *
 * @param guildId - The ID of the guild for which roles should be reset.
 */
const resetRolesForGuild = async (guildId: string): Promise<void> => {
	await prisma.role.deleteMany({
		where: { guild: { id: guildId } }
	})
}

/**
 * Synchronize the provided list of roles with the database for a specific guild.
 * This involves adding new roles, and removing roles that are not in the provided list.
 *
 * @param guildId - The ID of the guild for which roles should be synced.
 * @param roles - An array of role IDs to be synchronized with the database.
 * @returns
 *
 * @example
 * ```js
 * // Assume the guild has roles: ['role1', 'role2', 'role3']
 *
 * // To sync and have the guild roles be ['role1', 'role4']
 * syncRolesForGuild('guild123', ['role1', 'role4']);
 *
 * // After synchronization, the roles 'role2' and 'role3' will be removed, and 'role4' will be added.
 * ```
 */
const syncRolesForGuild = async (
	guildId: string,
	roles: string[]
): Promise<void> => {
	const existingRoles = await prisma.role.findMany({
		where: { guildId: guildId }
	})
	const existingRoleIds = existingRoles.map((role) => role.id)
	const newRoleIds = roles.filter((role) => !existingRoleIds.includes(role))
	const removedRoleIds = existingRoleIds.filter((role) => !roles.includes(role))

	await prisma.role.deleteMany({
		where: { id: { in: removedRoleIds } }
	})

	await prisma.role.createMany({
		data: newRoleIds.map((id) => ({ id, guildId })),
		skipDuplicates: true
	})
}

/**
 * Update the last time a guild's data was pruned.
 *
 * @param guildId - The ID of the guild to update.
 * @param date - The date to set as the last prune date.
 * @returns The updated guild data.
 */
export const updateGuildLastPrune = async (guildId: string, date: Date) => {
	return await prisma.guild.upsert({
		where: {
			id: guildId
		},
		update: {
			lastPrune: date
		},
		create: {
			id: guildId,
			lastPrune: date
		}
	})
}
