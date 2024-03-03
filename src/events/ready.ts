import { readdirSync } from "fs"
import { join } from "path"
import { Events } from "discord.js"
import { logger } from "../util/logger.js"
import type { Event } from "./index.js"

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		logger.info(`Ready! Logged in as ${client.user.tag}`)

		logger.info("[CRON] Starting CRONs...")
		const __dirname = new URL(".", import.meta.url).pathname
		try {
			const jobs = readdirSync(join(__dirname, "../jobs"))
			for await (const job of jobs) {
				if (!job.endsWith(".ts")) continue
				logger.info(`[CRON] Starting CRON "${job}"`)
				const { startCron } = await import(join(__dirname, "../jobs", job))
				startCron(client)
				logger.info(`[CRON] Started CRON "${job}"`)
			}
			logger.info(
				`[CRON] Started ${jobs.filter((j) => j.endsWith(".ts")).length} CRONs.`
			)
		} catch (error) {
			logger.warn(error, "[CRON] Failed to load CRONs.")
		}
	}
} satisfies Event<"ready">
