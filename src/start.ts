import { join } from 'path'
import { promises as fs } from 'fs'

import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { LogLevel } from 'telegram/extensions/Logger'

import env from './env'
import { ModuleManager, managerModule } from './module_manager'
import { NewMessage } from 'telegram/events'

const client = new TelegramClient(
	new StringSession(env.STRING_SESSION),
	env.APP_ID,
	env.APP_HASH,
	{}
)
const manager = new ModuleManager(client)
let started = false
client.setLogLevel(LogLevel.NONE)
async function start() {
	if (started) {
		return
	}
	try {
		await fs.mkdir(join(__dirname, 'externals'))
	} catch (_err) {
		//
	}
	manager.installMultiple(
		await ModuleManager.directory(join(__dirname, 'modules')),
		false
	)
	manager.install(managerModule(manager), false)
	manager.installMultiple(
		await ModuleManager.directory(join(__dirname, 'externals')),
		true
	)
	client.addEventHandler(manager.handler, new NewMessage({}))
	await client.start({ botAuthToken: '' })
	started = true
}
start()