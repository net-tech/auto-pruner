import { EmbedBuilder, type Guild } from "discord.js"
import { listAndTrimArray } from "./listAndTrimArray.js"
import { logger } from "./logger.js"
import { COLORS, SUPPORT_SERVER_INVITE_LINK } from "./misc.js"
import type { ScheduledPruneInfo } from "./misc.js"

export const postPruneLogSuccessMessage = async (
	guild: Guild,
	logChannelId: string,
	prune: ScheduledPruneInfo
) => {
	const channel = await guild.channels.fetch(logChannelId)
	if (!channel)
		return logger.warn(
			`Log channel ${logChannelId} not found for guild ${guild.id}, skipping...`
		)
	if (!channel.isTextBased())
		return logger.warn(
			`Log channel ${logChannelId} is not a text channel, skipping...`
		)

	const logEmbed = new EmbedBuilder()
		.setAuthor({
			name: guild.name,
			iconURL: guild.iconURL() ?? undefined
		})
		.setTitle("Scheduled Prune Successful")
		.setDescription(
			`Pruned ${
				prune.pruneCount ?? "an unknown amount of"
			} members from the server <t:${Math.round(
				prune.date.getTime() / 1000
			)}:R>.`
		)
		.addFields(
			{
				name: "Included Roles",
				value: prune.roles?.length
					? listAndTrimArray(
							prune.roles.map((r) => `<@&${r}>`),
							10
						).join(", ")
					: "None",
				inline: true
			},
			{
				name: "Prune Days",
				value: `${prune.days} days`,
				inline: true
			}
		)
		.setColor(COLORS.embed)

	await channel.send({ embeds: [logEmbed] }).catch((err) => {
		logger.error(err, "Error sending prune log message")
	})
}

export const postPruneLogErrorMessage = async (
	guild: Guild,
	logChannelId: string,
	errorMessage: string,
	showInCodeBlock = true
) => {
	const channel = await guild.channels.fetch(logChannelId)
	if (!channel)
		return logger.warn(
			`Log channel ${logChannelId} not found for guild ${guild.id}, skipping...`
		)
	if (!channel.isTextBased())
		return logger.warn(
			`Log channel ${logChannelId} is not a text channel, skipping...`
		)
	const logEmbed = new EmbedBuilder()
		.setAuthor({
			name: guild.name,
			iconURL: guild.iconURL() ?? undefined
		})
		.setTitle("Scheduled Prune Unsuccessful")
		.setColor(COLORS.red)

	if (showInCodeBlock) {
		logEmbed.setDescription(
			`An error occurred while pruning the server. \n\n\`\`\`${errorMessage}\`\`\`\n\n**Support Server:** ${SUPPORT_SERVER_INVITE_LINK}`
		)
	} else {
		logEmbed.setDescription(
			`An error occurred while pruning the server. \n\n${errorMessage}\n\n**Support Server:** ${SUPPORT_SERVER_INVITE_LINK}`
		)
	}

	await channel.send({ embeds: [logEmbed] }).catch((err) => {
		logger.error(err, "Error sending prune log message")
	})
}
