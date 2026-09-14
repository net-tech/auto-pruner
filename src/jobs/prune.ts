import { Cron } from "croner"
import {
	type Client,
	DiscordAPIError,
	type Guild,
	PermissionsBitField,
	RESTJSONErrorCodes
} from "discord.js"
import ms from "ms"
import {
	deleteGuildData,
	prisma,
	updateGuildLastPrune
} from "../util/database.js"
import { logger } from "../util/logger.js"
import {
	PRUNE_REQUIRES_ADMIN_MESSAGE,
	pruneRequiresAdministrator
} from "../util/misc.js"
import {
	postPruneLogErrorMessage,
	postPruneLogSuccessMessage
} from "../util/prune.js"

/**
 * Confirm a guild is still reachable, and forget it if it is not.
 *
 * @returns The guild if it could be fetched, otherwise `null`.
 */
const resolveGuild = async (
	client: Client,
	guildId: string
): Promise<Guild | null> => {
	const guild = await client.guilds.fetch(guildId).catch(() => null)
	if (guild) return guild

	const deleted = await deleteGuildData(guildId).catch((error) => {
		logger.error(error, `Failed to delete guild ${guildId} from the database`)
		return false
	})

	logger.warn(
		`Guild ${guildId} could not be fetched, ${
			deleted ? "deleted it from" : "it was not in"
		} the database.`
	)

	return null
}

const pruneJob = async (client: Client) => {
	logger.info("[CRON] Starting prune job...")
	const startedAt = Date.now()

	const guilds = await prisma.guild.findMany({
		where: {
			enabled: true,
			days: {
				gte: 1,
				lte: 30
			},
			interval: {
				not: null,
				gte: new Date(86_400_000), // At least 1 day
				lt: new Date(365 * 10 * 86_400_000) // Less than 10 years
			}
		},
		include: {
			roles: true
		}
	})

	let skipped = 0
	let unreachable = 0
	let attempted = 0
	let succeeded = 0
	const failuresByCode = new Map<string, number>()

	for (const guildSetting of guilds) {
		if (guildSetting.lastPrune && guildSetting.interval) {
			const lastPrune = new Date(guildSetting.lastPrune)
			// Minus 5 seconds just to not have false positives.
			if (
				lastPrune.getTime() + guildSetting.interval.getTime() >
				Date.now() - 5000
			) {
				skipped++
				continue
			}
		}

		const clientGuild = await resolveGuild(client, guildSetting.id)
		if (!clientGuild) {
			unreachable++
			continue
		}

		const roles = guildSetting.roles.map((role) => role.id)

		const memberCount =
			clientGuild.memberCount ?? clientGuild.approximateMemberCount

		attempted++

		try {
			const pruned = await clientGuild.members.prune({
				days: guildSetting.days,
				count: memberCount !== null && memberCount <= 10_000,
				roles,
				reason: "Scheduled guild prune"
			})

			succeeded++

			await updateGuildLastPrune(guildSetting.id, new Date())

			if (guildSetting.logChannelId) {
				await postPruneLogSuccessMessage(
					clientGuild,
					guildSetting.logChannelId,
					{
						guildId: guildSetting.id,
						pruneCount: pruned ?? undefined,
						roles,
						days: guildSetting.days,
						date: new Date()
					}
				)
			}
		} catch (error) {
			const code =
				error instanceof DiscordAPIError
					? String(error.code)
					: error instanceof Error
						? error.name
						: "unknown"
			failuresByCode.set(code, (failuresByCode.get(code) ?? 0) + 1)

			const me = await clientGuild.members.fetchMe().catch(() => null)
			const requiresAdministrator = pruneRequiresAdministrator(clientGuild)
			const hasAdministrator =
				me?.permissions.has(PermissionsBitField.Flags.Administrator) ?? null

			logger.error(
				{
					err: error,
					guildId: guildSetting.id,
					code,
					hasKickMembers:
						me?.permissions.has(PermissionsBitField.Flags.KickMembers) ?? null,
					hasManageGuild:
						me?.permissions.has(PermissionsBitField.Flags.ManageGuild) ?? null,
					hasAdministrator,
					requiresAdministrator
				},
				`Error pruning guild ${guildSetting.id}`
			)

			if (!(error instanceof DiscordAPIError)) continue

			if (
				error.code === RESTJSONErrorCodes.UnknownGuild &&
				!(await resolveGuild(client, guildSetting.id))
			) {
				continue
			}

			if (!guildSetting.logChannelId) continue

			if (error.code === RESTJSONErrorCodes.MissingPermissions) {
				await postPruneLogErrorMessage(
					clientGuild,
					guildSetting.logChannelId,
					requiresAdministrator && hasAdministrator !== true
						? PRUNE_REQUIRES_ADMIN_MESSAGE
						: "I do not have permission to prune members in this server. Please check that I have the 'Kick Members' and 'Manage Server' permissions.",
					false
				)
				continue
			}

			await postPruneLogErrorMessage(
				clientGuild,
				guildSetting.logChannelId,
				`Discord API Error ${error.code}: ${error.message}`
			)
		}
	}

	const durationMs = Date.now() - startedAt
	const failed = attempted - succeeded
	const breakdown = [...failuresByCode.entries()]
		.sort(([, a], [, b]) => b - a)
		.map(([code, count]) => `${code} x${count}`)
		.join(", ")

	logger.info(
		{
			durationMs,
			selected: guilds.length,
			skipped,
			unreachable,
			attempted,
			succeeded,
			failed,
			failuresByCode: Object.fromEntries(failuresByCode)
		},
		`[CRON] Prune job finished in ${ms(durationMs, {
			long: true
		})}. Selected ${guilds.length}, skipped ${skipped}, unreachable ${unreachable}, attempted ${attempted}: ${succeeded} succeeded, ${failed} failed${
			failed > 0 ? ` (${breakdown})` : ""
		}.`
	)
}

const startCron = (client: Client) => {
	// Every 30 minutes
	new Cron("*/30 * * * *", async () => {
		await pruneJob(client).catch((error) => {
			logger.error(error, "[CRON] Prune job failed")
		})
	})
}

export { startCron }
