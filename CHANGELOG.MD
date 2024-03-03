# Changelog

## Version 3.0.0
- BREAKING: Require the Manage Server permission to prune (https://github.com/discord/discord-api-docs/pull/6688).
- Warn users when there are permissions the bot needs in the server that it does not have. The warning message is displayed in `/settings`.
- Correctly determine the number of CRON jobs loaded.
- Add a `.editorconfig` file.
- Bump packages.
- Other miscellaneous changes.

## Version 2.1.0
- Bump dependencies
- Show guild count and memory usage in /about
- Delete guilds from database when the bot leaves them

## Version 2.0.1
- Fetch guilds which can be pruned from the database and loop over them, instead of fetching all guilds the client is in and then fetching the settings of each guild from the database.
- Add `select` to database functions.
- Disable two more caches.
- 

## Version 2.0.0
- Rewrite to use npx create-discord-bot.
- Disable caches
- Support any number of days

## Versions <1.0.0
Changelog not available.
