let RPC = require('discord-rpc');
let startTimestamp = Date.now();

// TIP: Create a new app at discord.com/developers to get your own ID for custom logos
const clientId = '1016740004187357214'; 
const rpc = new RPC.Client({ transport: 'ipc' });

let activity = {
	details: 'Booting NexaFlow...',
	state: 'Main Menu',
	largeImageKey: 'logo-big', // Ensure this key exists in your Discord Dev Portal
	startTimestamp,
	buttons: [
		{ label: 'Join SIC Corp Discord', url: 'https://discord.gg/YOUR_LINK_HERE' },
		{ label: 'Get NexaFlow', url: 'https://nexaflow.example.com' }
	]
}

const updateActivity = details => {
	let { presence, rich, data } = details;
	let [time, mode, map, ingame] = data;
	activity.enabled = presence;

	if (presence) {
		if (rich) {
			if (ingame) {
				let [minutes, seconds] = time.split(':');
				let totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);

				activity.details = `Dominating ${mode}`;
				activity.state = `Map: ${map}`;
				activity.endTimestamp = Date.now() + totalSeconds * 1000;
				activity.largeImageKey = map.toLowerCase();
				activity.largeImageText = `NexaFlow v1.1.2 // ${map}`;
			} else {
				activity.details = 'Preparing for Battle';
				activity.state = 'In Lobby';
				activity.largeImageKey = 'logo-big';
				activity.largeImageText = 'SIC Corp Proprietary Client';
			}
		}
	} else {
		rpc.clearActivity();
	}
}

const setActivity = () => {
	if (!activity.enabled) return;
	rpc.setActivity(activity).catch(() => {});
}

rpc.on('ready', () => {
	setActivity();
	setInterval(() => {
		setActivity();
	}, 5000); // Updates every 5 seconds
});

rpc.login({ clientId }).catch(console.error);

module.exports = { updateActivity }
