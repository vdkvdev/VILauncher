// Variable para rastrear si Minecraft está corriendo Starting
let isMinecraftRunning = false;

// Cargar datos desde LocalStorage (username y ram)
function loadData() {
    const username = localStorage.getItem('lastUsername') || '';
    const ram = localStorage.getItem('lastRam') || '';
    document.getElementById('username').value = username;
    document.getElementById('ram').value = ram;
}

// Cargar versiones de Minecraft desde la API de Mojang y establecer el valor guardado
async function loadVersions() {
    try {
        const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
        const data = await response.json();
        const versions = data.versions.filter(v => v.type === 'release').map(v => v.id);
        const versionSelect = document.getElementById('version');
        
        // Limpiar el select y agregar la opción predeterminada
        versionSelect.innerHTML = '<option value="" disabled selected>Version</option>';
        
        // Agregar las versiones como opciones
        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = version;
            versionSelect.appendChild(option);
        });

        // Establecer el valor guardado en LocalStorage, si existe
        const lastVersion = localStorage.getItem('lastVersion') || '';
        if (lastVersion) {
            versionSelect.value = lastVersion;
        }
    } catch (error) {
        alert('No se pudieron cargar las versiones de Minecraft.');
    }
}

// Guardar la versión seleccionada en LocalStorage cuando cambie
const versionSelect = document.getElementById('version');
versionSelect.addEventListener('change', () => {
    const selectedVersion = versionSelect.value;
    localStorage.setItem('lastVersion', selectedVersion);
});

// Evento del botón "Start"
document.getElementById('start-minecraft').addEventListener('click', async () => {
    if (isMinecraftRunning) {
        alert('Minecraft is already running.');
        return;
    }

    const username = document.getElementById('username').value;
    const version = document.getElementById('version').value;
    const ram = document.getElementById('ram').value;

    if (!username || !version || !ram) {
        alert('Complete all the fields to start Minecraft.');
        return;
    }

    // Guardar datos en LocalStorage
    localStorage.setItem('lastUsername', username);
    localStorage.setItem('lastVersion', version);
    localStorage.setItem('lastRam', ram);

    // Iniciar Minecraft
    const startButton = document.getElementById('start-minecraft');
    startButton.disabled = true;
    startButton.innerHTML = '<img src="assets/icon/play.svg">Starting...';

    try {
        const config = { username, version, ram };
        const result = await window.electron.startMinecraft(config);
        if (!result.success) {
            alert(`Error: ${result.error}`);
            startButton.disabled = false;
            startButton.innerHTML = '<img src="assets/icon/play.svg">Start';
        } else {
            isMinecraftRunning = true;
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
        startButton.disabled = false;
        startButton.innerHTML = '<img src="assets/icon/play.svg">Start';
    }
});

// Actualizar el estado del botón según mensajes del proceso principal
window.electron.onMinecraftStatus((event, status) => {
    const startButton = document.getElementById('start-minecraft');
    if (status === 'closed') {
        isMinecraftRunning = false;
        startButton.disabled = false;
        startButton.innerHTML = '<img src="assets/icon/play.svg">Start';
    } else {
        startButton.innerHTML = `<img src="assets/icon/play.svg">${status}`;
    }
});

// Cerrar la aplicación
document.getElementById('close-app').addEventListener('click', () => {
    window.electron.closeApp();
});


// Inicializar la interfaz
loadData();
loadVersions();