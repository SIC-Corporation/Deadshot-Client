let RPC = require('discord-rpc');
const clientId = '1016740004187357214'; 
const rpc = new RPC.Client({ transport: 'ipc' });

let activity = {
    details: 'NexaFlow v1.0.0',
    state: 'Main Menu',
    largeImageKey: 'logo-big',
    startTimestamp: Date.now(),
    buttons: [
        { label: 'Join SIC Corp Discord', url: 'https://discord.gg/2MEP67Rbj2' }
    ]
}

const setActivity = () => {
    rpc.setActivity(activity).catch(() => {});
}

rpc.on('ready', () => {
    setActivity();
    setInterval(setActivity, 15000);
});

rpc.login({ clientId }).catch(console.error);

module.exports = { 
    updateActivity: (details) => {
        // Logic to update details based on game state
        setActivity();
    } 
}
