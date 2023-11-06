import { Cron } from "croner"
import { type Client, DiscordAPIError } from "discord.js"
import { getGuildData, updateGuildLastPrune } from "../util/database.js"
import { logger } from "../util/logger.js"
import {
	postPruneLogErrorMessage,
	postPruneLogSuccessMessage
} from "../util/prune.js"

const pruneJob = async (client: Client) => {
	logger.info("[CRON] Starting prune job...")
	const guilds = client.guilds.cache
	for (const guild of guilds.values()) {
		const guildSettings = await getGuildData(guild.id)
		if (!guildSettings) {
			logger.error(`Guild ${guild.id} not found in database.`)
			continue
		}
		if (!guildSettings.enabled) continue
		if (!guildSettings.interval) continue
		if (!guildSettings.days) continue

		if (guildSettings.lastPrune) {
			const lastPrune = new Date(guildSettings.lastPrune)
			// Minus 5 seconds just to not have false positives.
			if (
				lastPrune.getTime() + guildSettings.interval.getTime() >
				Date.now() - 5000
			) {
				logger.info(
					`Skipping prune for guild ${guild.id} because it was pruned recently.`
				)
				continue
			}
		}

		await guild.members
			.prune({
				days: guildSettings.days,
				count: guild.memberCount > 10_000 ? false : true,
				roles: guildSettings.roles.map((role) => role.id),
				reason: "Scheduled guild prune"
			})
			.then((pruned: number | undefined | null) => {
				updateGuildLastPrune(guild.id, new Date())

				if (guildSettings.logChannelId) {
					postPruneLogSuccessMessage(guild, guildSettings.logChannelId, {
						guildId: guild.id,
						pruneCount: pruned ?? undefined,
						roles: guildSettings.roles.map((role) => role.id),
						days: guildSettings.days,
						date: new Date()
					}).catch((error) => {
						if (error.error && error.code === 50001) {
							logger.warn(
								`Skipping prune log for guild ${guild.id} because I do not have access to the log channel.`
							)
						}
						logger.error(error, "Error sending prune log message")
					})
				}
			})
			.catch((error) => {
				logger.error(error, "Error pruning guild")
				if (error instanceof DiscordAPIError) {
					if (guildSettings.logChannelId) {
						if (error.code === 50013) {
							postPruneLogErrorMessage(
								guild,
								guildSettings.logChannelId,
								"I do not have permission to prune members in this guild. Please check that I have the 'Kick Members' permission."
							)
							return
						}
						postPruneLogErrorMessage(
							guild,
							guildSettings.logChannelId,
							`Discord API Error ${error.code}: ${error.message}`
						).catch((error) => {
							if (error.error && error.code === 50001) {
								logger.warn(
									`Skipping prune log for guild ${guild.id} because I do not have access to the log channel.`
								)
							}
							logger.error(error, "Error sending prune log message")
						})
					}
				}
				return
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
