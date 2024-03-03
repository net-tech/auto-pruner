import { Cron } from "croner"
import { type Client, DiscordAPIError } from "discord.js"
import ms from "ms"
import { prisma, updateGuildLastPrune } from "../util/database.js"
import { logger } from "../util/logger.js"
import {
	postPruneLogErrorMessage,
	postPruneLogSuccessMessage
} from "../util/prune.js"

const pruneJob = async (client: Client) => {
	logger.info("[CRON] Starting prune job...")
	const startDate = new Date()

	const guilds = await prisma.guild.findMany({
		where: {
			enabled: true,
			days: {
				gte: 1, // Greater than 1 day
				lte: 30 // Less than 30 days
			},
			interval: {
				not: null,
				gte: new Date(86_400_000), // Greater than 1 day
				lt: new Date(365 * 10 * 86_400_000) // Less than 10 years
			}
		},
		include: {
			roles: true
		}
	})

	for (const guildSetting of guilds) {
		if (guildSetting.lastPrune && guildSetting.interval) {
			const lastPrune = new Date(guildSetting.lastPrune)
			// Minus 5 seconds just to not have false positives.
			if (
				lastPrune.getTime() + guildSetting.interval?.getTime() >
				Date.now() - 5000
			) {
				logger.debug(
					`Skipping prune for guild ${guildSetting.id} because it was pruned recently.`
				)
				continue
			}
		}

		const clientGuild = await client.guilds.fetch(guildSetting.id)
		if (!clientGuild) {
			logger.warn(
				`Skipping prune for guild ${guildSetting.id} because I am not in it.`
			)
			continue
		}

		await clientGuild.members
			.prune({
				days: guildSetting.days,
				count: clientGuild.memberCount <= 10_000,
				roles: guildSetting.roles.map((role) => role.id),
				reason: "Scheduled guild prune"
			})
			.then((pruned?: number | null) => {
				updateGuildLastPrune(guildSetting.id, new Date())

				if (guildSetting.logChannelId) {
					postPruneLogSuccessMessage(clientGuild, guildSetting.logChannelId, {
						guildId: guildSetting.id,
						pruneCount: pruned ?? undefined,
						roles: guildSetting.roles.map((role) => role.id),
						days: guildSetting.days,
						date: new Date()
					}).catch((error) => {
						if (error.error && error.code === 50001) {
							logger.warn(
								`Skipping prune log for guild ${guildSetting.id} because I do not have access to the log channel.`
							)
						}
						logger.error(error, "Error sending prune log message")
					})
				}
			})
			.catch((error) => {
				logger.error(error, "Error pruning guild")
				if (error instanceof DiscordAPIError) {
					if (guildSetting.logChannelId) {
						if (error.code === 50013) {
							postPruneLogErrorMessage(
								clientGuild,
								guildSetting.logChannelId,
								"I do not have permission to prune members in this server. Please check that I have the 'Kick Members' and 'Manage Server' permissions. Discord added the 'Manage Server' permission as a prune requirement on <t:1710529200:D>.",
								false
							)
							return
						}
						postPruneLogErrorMessage(
							clientGuild,
							guildSetting.logChannelId,
							`Discord API Error ${error.code}: ${error.message}`
						).catch((error) => {
							if (error.error && error.code === 50001) {
								logger.warn(
									`Skipping prune log for guild ${guildSetting.id} because I do not have access to the log channel.`
								)
							}
							logger.error(error, "Error sending prune log message")
						})
					}
				}
			})
	}
	logger.info(
		`[CRON] Prune job finished. Took ${ms(
			new Date().getTime() - startDate.getTime(),
			{
				long: true
			}
		)}.`
	)
}

const startCron = (client: Client) => {
	// Every 30 minutes
	Cron("*/30 * * * *", async () => {
		await pruneJob(client).catch((error) => {
			logger.error(error)
		})
	})
}

export { startCron }
