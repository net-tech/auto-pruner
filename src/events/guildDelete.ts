import { Events } from "discord.js"
import { prisma } from "../util/database.ts"
import { logger } from "../util/logger.js"
import type { Event } from "./index.js"

export default {
	name: Events.GuildDelete,
	once: true,
	async execute(guild) {
		logger.info(`Left guild ${guild.name} (${guild.id})`)
		prisma.guild.delete({
			where: {
				id: guild.id
			}
		})
	}
} satisfies Event<"guildDelete">
