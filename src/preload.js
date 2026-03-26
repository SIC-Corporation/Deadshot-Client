const { ipcRenderer } = require('electron');
const $ = (selector) => document.querySelector(selector);

// --- NEXAFLOW UI GENERATOR ---
const genSetting = (type, details) => {
	let element = document.createElement('template');
	switch (type) {
		case 'spacer': {
			element.innerHTML = `<div class="bar" style="background: rgba(255,255,255,0.05); height: 1px; margin: 10px 0;"></div>`;
			break;
		}
		case 'info': {
			element.innerHTML = `
			<div class="setting toggle" style="margin-top: 14px; margin-bottom: 14px;">
			<p style="font-size: 14px; letter-spacing: 2px; font-weight: 800; color: #ff4757; text-transform: uppercase;">${details.text}</p>
			</div>`;
			break;
		}
		case 'toggle': {
			element.innerHTML = `
			<div class="setting toggle" style="margin-top: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
			<p style="font-size: 16px; color: #eee;">${details.text}</p>
			<label class="nexa-switch"><input id=${details.id} checked type="checkbox">
			<span class="slider"></span></label></div>`;
			break;
		}
	}
	return element.content;
}

const updateSetting = (id, type) => {
	if (localStorage.getItem(id) !== null) {
		let elem = $(`#${id}`);
		if (elem) elem[type === 'checkbox' ? 'checked' : 'value'] = JSON.parse(localStorage.getItem(id));
	}
}

const addSetting = (id, type, cb = () => { }) => {
	let elem = $(`#${id}`);
	if (elem) {
		elem.onchange = () => {
			cb();
			localStorage.setItem(id, type === 'checkbox' ? elem.checked : elem.value);
		}
	}
}

let path = require('path');
ipcRenderer.once('load', (e, args) => {
	const { isDev } = args;
	let link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	let extraFilesPath = isDev 
		? path.resolve(__dirname, '..', 'unpack') 
		: path.resolve(__dirname, '..', '..', 'app.asar.unpacked', 'unpack');
	link.setAttribute('href', path.join(extraFilesPath, 'extra.css'));
	document.head.appendChild(link);
});

window.onload = () => {
	// --- 1. BLOCK THE "DOUBLE-ESC" QUIT PROMPT ---
	window.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			e.stopPropagation(); 
		}
	}, true);

	// --- 2. DISCORD RPC & MESSAGING ---
	setInterval(() => { window.postMessage(JSON.stringify({ type: "gimmerich" })) }, 1000);
	addEventListener("message", e => {
		try {
			let data = JSON.parse(e.data);
			if (Array.isArray(data) && data.length == 4) {
				ipcRenderer.invoke('rpcData', { data, presence: $('#enablePresence').checked, rich: $('#enableRichPresence').checked });
			}
		} catch(err) {}
	});

	// --- 3. NEXAFLOW HUD ---
	const hud = document.createElement('div');
	hud.id = 'nexa-hud';
	hud.innerHTML = `
		<div style="font-size: 9px; font-weight: 900; opacity: 0.6; letter-spacing: 1px;">NEXAFLOW CLIENT</div>
		<div style="display: flex; gap: 10px; align-items: baseline;">
			<span id="fps-val" style="font-size: 18px; font-weight: 800; color: #ff4757;">--</span>
			<span style="font-size: 10px; font-weight: 700; opacity: 0.8;">FPS</span>
		</div>
	`;
	document.body.appendChild(hud);

	// --- 4. HUD & SMOOTH PLAY STYLING ---
	const style = document.createElement('style');
	style.textContent = `
		#nexa-hud {
			position: fixed; top: 20px; left: 20px; z-index: 10000;
			background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(10px);
			padding: 10px 15px; border-radius: 8px; border-left: 4px solid #ff4757;
			color: white; font-family: 'Inter', sans-serif; pointer-events: none;
		}
		.smooth-play-active {
			image-rendering: pixelated; 
			filter: contrast(1.05) brightness(1.05);
		}
		.nexa-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
		.nexa-switch input { opacity: 0; width: 0; height: 0; }
		.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 20px; }
		input:checked + .slider { background-color: #ff4757; }
	`;
	document.head.appendChild(style);

	// --- 5. SETTINGS MENU ASSEMBLY ---
	let settings = $('#settingsDiv');
	if (settings) {
		settings.innerHTML = ''; 
		settings.append(genSetting('info', { text: 'NexaFlow Settings' }));
		settings.append(genSetting('toggle', { text: 'Discord Presence', id: 'enablePresence' }));
		settings.append(genSetting('toggle', { text: 'Rich Presence', id: 'enableRichPresence' }));
		
		settings.append(genSetting('spacer'));
		settings.append(genSetting('info', { text: 'Performance & HUD' }));
		settings.append(genSetting('toggle', { text: 'Show FPS Counter', id: 'enableFpsDisplay' }));
		settings.append(genSetting('toggle', { text: 'Smooth Play (Anti-Lag)', id: 'enableSmoothPlay' }));

		['enablePresence', 'enableRichPresence', 'enableFpsDisplay', 'enableSmoothPlay'].forEach(id => {
			updateSetting(id, 'checkbox');
			addSetting(id, 'checkbox', () => {
				hud.style.display = $('#enableFpsDisplay').checked ? 'block' : 'none';
				if ($('#enableSmoothPlay').checked) {
					document.body.classList.add('smooth-play-active');
				} else {
					document.body.classList.remove('smooth-play-active');
				}
			});
		});
		
		$('#enableFpsDisplay').onchange();
		$('#enableSmoothPlay').onchange();
	}

	// --- 6. OPTIMIZED FPS LOOP ---
	const times = [];
	function refreshLoop() {
		window.requestAnimationFrame(() => {
			const now = performance.now();
			while (times.length > 0 && times[0] <= now - 1000) { times.shift(); }
			times.push(now);
			const fpsVal = $('#fps-val');
			if(fpsVal) fpsVal.textContent = times.length;
			refreshLoop();
		});
	}
	refreshLoop();
}
