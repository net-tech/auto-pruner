import { Cron } from "croner"
import { type Client, DiscordAPIError } from "discord.js"
import { prisma, updateGuildLastPrune } from "../util/database.js"
import { logger } from "../util/logger.js"
import {
	postPruneLogErrorMessage,
	postPruneLogSuccessMessage
} from "../util/prune.js"

const pruneJob = async (client: Client) => {
	logger.info("[CRON] Starting prune job...")

	const guilds = await prisma.guild.findMany({
		where: {
			enabled: true,
			days: {
				gte: 1,
				lte: 30
			},
			interval: {
				not: null,
				gte: new Date(86_400_000),
				lt: new Date(365 * 10 * 86_400_000)
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
				logger.info(
					`Skipping prune for guild ${guildSetting.id} because it was pruned recently.`
				)
				continue
			}
		}

		const clientGuild = await client.guilds.fetch(guildSetting.id)
		if (!clientGuild) {
			logger.warn(
				`Skipping prune for guild ${guildSetting.id} because I am not in it and deleting it from the database.`
			)
			await prisma.guild.delete({
				where: {
					id: guildSetting.id
				}
			})
			continue
		}

		await clientGuild.members
			.prune({
				days: guildSetting.days,
				count: clientGuild.memberCount <= 10_000,
				roles: guildSetting.roles.map((role) => role.id),
				reason: "Scheduled guild prune"
			})
			.then((pruned: number | undefined | null) => {
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
								"I do not have permission to prune members in this guild. Please check that I have the 'Kick Members' permission."
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
	logger.info("[CRON] Prune job finished.")
}

const startCron = (client: Client) => {
	Cron("*/30 * * * *", async () => {
		// Every 30 minutes
		await pruneJob(client).catch((error) => {
			logger.error(error)
		})
	})
}

export { startCron }
