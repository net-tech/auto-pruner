import humanInterval from "human-interval"
import ms from "ms"

export const parseInterval = (interval: string) => {
	// biome-ignore lint/style/noParameterAssign:
	interval = interval.replace("every ", "")
	if (Number.isNaN(humanInterval(interval))) {
		return ms(interval)
	} else {
		return humanInterval(interval) as number
	}
}
