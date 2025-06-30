// --- SCRIPT.JS - VERSIÓN CON GESTOR DE ESCENAS ---

document.addEventListener('DOMContentLoaded', () => {
    // --- NUEVOS SELECTORES DE MODAL ---
    const saveStateBtn = document.getElementById('saveStateBtn');
    const loadStateBtn = document.getElementById('loadStateBtn');
    //const showSavedScenesBtn = document.getElementById('showSavedScenesBtn');

    const saveSceneModal = document.getElementById('saveSceneModal');
    const sceneNameInput = document.getElementById('sceneNameInput');
    const confirmSaveSceneBtn = document.getElementById('confirmSaveSceneBtn');
    const cancelSaveSceneBtn = document.getElementById('cancelSaveSceneBtn');

    const savedScenesModal = document.getElementById('savedScenesModal');
    const closeSavedScenesBtn = document.getElementById('closeSavedScenesBtn');
    const sceneListContainer = document.getElementById('sceneListContainer');
    const edit_tokenLetterPreview = document.getElementById('editTokenLetterPreview');

    // --- SELECTORES DE MODAL DE PUERTA ---
    const doorNameModal = document.getElementById('doorNameModal');
    const doorNameInput = document.getElementById('doorNameInput');
    const confirmDoorNameBtn = document.getElementById('confirmDoorNameBtn');
    const cancelDoorNameBtn = document.getElementById('cancelDoorNameBtn');

    // selectores para tarjetas de estatus de jugadores
    const playerTurnTracker = document.getElementById('playerTurnTracker');
    const tokenStatesEditor = document.getElementById('tokenStatesEditor');
    const newStateEmoji = document.getElementById('newStateEmoji');
    const newStateDesc = document.getElementById('newStateDesc');
    const addStateBtn = document.getElementById('addStateBtn');
    const editTokenStatesList = document.getElementById('editTokenStatesList');




    // --- CONSTANTE DE ALMACENAMIENTO ---
    const SCENES_STORAGE_KEY = 'dndArsenalSavedScenes';

    // --- SELECTORES DEL DOM (Existentes) ---
    const mapImageInput = document.getElementById('mapImageInput');
    // ... (el resto de selectores existentes van aquí, sin cambios)
    const mapContainer = document.getElementById('mapContainer'),
        mapContentWrapper = document.getElementById('mapContentWrapper'),
        loadingState = document.querySelector('.loading-state'),
        mapImage = document.getElementById('mapImage'),
        gridCanvas = document.getElementById('gridCanvas'),
        gridCtx = gridCanvas.getContext('2d'),
        wallsCanvas = document.getElementById('wallsCanvas'),
        wallsCtx = wallsCanvas.getContext('2d'),
        visionCanvas = document.getElementById('visionCanvas'),
        ctx = visionCanvas.getContext('2d'),
        tokensLayer = document.getElementById('tokensLayer');

    const gridToggle = document.getElementById('gridToggle'),
        gridColorInput = document.getElementById('gridColor'),
        gridOpacityInput = document.getElementById('gridOpacity'),
        brushModeInputs = document.querySelectorAll('input[name="brushMode"]'),
        brushSizeInput = document.getElementById('brushSize'),
        cellSizeInput = document.getElementById('cellSize'),
        cellSizeSlider = document.getElementById('cellSizeSlider');

    const addTokenBtn = document.getElementById('addTokenBtn'),
        tokenListUl = document.getElementById('tokenList');

    const toggleVisionBtn = document.getElementById('toggleVisionBtn'),
        resetFogBtn = document.getElementById('resetFogBtn');

    const drawTypeInputs = document.querySelectorAll('input[name="drawType"]');
    const toggleWallModeBtn = document.getElementById('toggleWallModeBtn'),
        undoWallBtn = document.getElementById('undoWallBtn'),
        clearWallsBtn = document.getElementById('clearWallsBtn');
    const doorListUl = document.getElementById('doorList'),
        noDoorsMessage = document.getElementById('noDoorsMessage');

    const fileNameDisplay = document.getElementById('fileNameDisplay');

    const add_tokenName = document.getElementById('tokenName'),
        add_tokenLetter = document.getElementById('tokenLetter'),
        add_tokenImageInput = document.getElementById('tokenImageInput'),
        add_tokenImageName = document.getElementById('tokenImageName'),
        add_tokenTurn = document.getElementById('tokenTurn'),
        add_tokenHealth = document.getElementById('tokenHealth'),
        add_tokenNotes = document.getElementById('tokenNotes'),
        add_tokenColor = document.getElementById('tokenColor'),
        add_tokenBorderColor = document.getElementById('tokenBorderColor'),
        add_addBorderCheckbox = document.getElementById('addBorderCheckbox'),
        add_tokenVision = document.getElementById('tokenVision');

    const selectedTokenSection = document.getElementById('selectedTokenSection');


    const edit_tokenName = document.getElementById('editTokenName'),
        edit_tokenLetter = document.getElementById('editTokenLetter'),
        edit_tokenImageInput = document.getElementById('editTokenImageInput'),
        edit_tokenImagePreviewContainer = document.getElementById('editTokenImagePreviewContainer'),
        edit_tokenImagePreview = document.getElementById('editTokenImagePreview'),
        removeTokenImageBtn = document.getElementById('removeTokenImageBtn'),
        edit_tokenTurn = document.getElementById('editTokenTurn'),
        edit_tokenHealthMax = document.getElementById('editTokenHealthMax'),
        edit_tokenNotes = document.getElementById('editTokenNotes'),
        edit_tokenColor = document.getElementById('editTokenColor'),
        edit_tokenBorderColor = document.getElementById('editTokenBorderColor'),
        edit_tokenVision = document.getElementById('editTokenVision');

    const updateTokenBtn = document.getElementById('updateTokenBtn'),
        deselectTokenBtn = document.getElementById('deselectTokenBtn');

    const healthDisplay = document.getElementById('healthDisplay'),
        healthDisplayContainer = document.getElementById('healthDisplayContainer'),
        healthModifierBtns = document.querySelectorAll('.health-modifier-btn'),
        healthModifierInput = document.getElementById('healthModifierInput');

    const damageSound = document.getElementById('damage-sound'),
        healSound = document.getElementById('heal-sound');

    // --- VARIABLES DE ESTADO ---
    // ... (el resto de variables de estado van aquí, sin cambios)
    let tokens = [],
        walls = [],
        selectedTokenId = null,
        visionModeActive = false,
        currentDraggedToken = null,
        isPaintingFog = false,
        isDrawingWallMode = false,
        wallStartPoint = null;

    let pendingDoor = null;


    // --- NUEVAS VARIABLES DE ESTADO PARA EL PANEO ---
    let isPanning = false;
    let panStartX, panStartY;
    let scrollStartX, scrollStartY;


    let dragOffsetX, dragOffsetY;
    let cellSize = parseInt(cellSizeInput.value),
        gridVisible = gridToggle.checked,
        gridColor = gridColorInput.value,
        gridOpacity = parseFloat(gridOpacityInput.value);
    let brushMode = document.querySelector('input[name="brushMode"]:checked').value,
        brushSize = parseInt(brushSizeInput.value);
    let drawType = 'wall';
    const revealedBufferCanvas = document.createElement('canvas'),
        revealedBufferCtx = revealedBufferCanvas.getContext('2d', { willReadFrequently: true });

    // --- ESTADO INICIAL ---
    mapContainer.classList.add('no-map');
    updateDoorList();

    // --- EVENT LISTENERS ---
    // ... (todos los listeners existentes van aquí)
    document.querySelectorAll('.collapsible-header').forEach(header => header.addEventListener('click', () => header.parentElement.classList.toggle('active')));
    mapImageInput.addEventListener('change', handleImageUpload);
    gridToggle.addEventListener('change', e => { gridVisible = e.target.checked; drawGrid(); });
    gridColorInput.addEventListener('input', e => { gridColor = e.target.value; drawGrid(); });
    gridOpacityInput.addEventListener('input', e => { gridOpacity = parseFloat(e.target.value); drawGrid(); });
    brushModeInputs.forEach(input => input.addEventListener('change', e => brushMode = e.target.value));
    brushSizeInput.addEventListener('input', e => brushSize = parseInt(e.target.value));
    drawTypeInputs.forEach(input => input.addEventListener('change', e => drawType = e.target.value));
    cellSizeSlider.addEventListener('input', () => { cellSizeInput.value = cellSizeSlider.value; updateCellSize(); });
    cellSizeInput.addEventListener('input', () => { const val = Math.min(parseInt(cellSizeInput.value) || 10, 150); cellSizeSlider.value = val; updateCellSize(); });
    addTokenBtn.addEventListener('click', addToken);
    add_tokenImageInput.addEventListener('change', e => { add_tokenImageName.textContent = e.target.files[0] ? e.target.files[0].name : 'Ningún archivo...'; });
    edit_tokenImageInput.addEventListener('change', handleEditTokenImageChange);
    removeTokenImageBtn.addEventListener('click', removeEditTokenImage);
    updateTokenBtn.addEventListener('click', updateSelectedToken);
    deselectTokenBtn.addEventListener('click', deselectToken);
    toggleVisionBtn.addEventListener('click', toggleVisionMode);
    resetFogBtn.addEventListener('click', resetFog);
    mapContainer.addEventListener('mousedown', handleLayerMouseDown);
    document.addEventListener('mousemove', handleLayerMouseMove);
    document.addEventListener('mouseup', handleLayerMouseUp);
    mapContainer.addEventListener('click', handleLayerClick);
    healthModifierBtns.forEach(btn => btn.addEventListener('click', () => applyHealthChange(parseInt(btn.dataset.amount))));
    healthModifierInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const amount = parseInt(healthModifierInput.value); if (!isNaN(amount)) { applyHealthChange(amount); healthModifierInput.value = ''; } } });
    edit_tokenHealthMax.addEventListener('change', () => { if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; const newMax = parseInt(edit_tokenHealthMax.value) || 0; token.health_max = newMax; if (token.health_current > newMax) { token.health_current = newMax; healthDisplay.textContent = token.health_current; } healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`; updateTokenList(); });
    toggleWallModeBtn.addEventListener('click', toggleWallMode);
    undoWallBtn.addEventListener('click', undoLastWall);
    clearWallsBtn.addEventListener('click', clearAllWalls);
    addStateBtn.addEventListener('click', addStateToSelectedToken);


    // --- NUEVOS LISTENERS PARA MODAL DE PUERTA ---
    confirmDoorNameBtn.addEventListener('click', createDoorFromModal);
    cancelDoorNameBtn.addEventListener('click', () => {
        doorNameModal.classList.remove('open');
        pendingDoor = null; // Limpiamos la puerta pendiente
        drawWalls(); // Redibujamos para quitar la línea de previsualización
    });

    // Cierra el modal de la puerta si se hace clic en el overlay
    doorNameModal.addEventListener('click', (e) => {
        if (e.target === doorNameModal) {
            cancelDoorNameBtn.click(); // Reutilizamos la lógica de cancelación
        }
    });

    // --- NUEVOS EVENT LISTENERS PARA MODALES ---
    saveStateBtn.addEventListener('click', () => {
        if (!mapImage.src || mapImage.src.endsWith('#')) {
            alert("Carga un mapa antes de guardar la escena.");
            return;
        }
        sceneNameInput.value = '';
        saveSceneModal.classList.add('open');
        sceneNameInput.focus();
    });

    // Listener para el botón de Cargar (abre el modal de escenas)
    loadStateBtn.addEventListener('click', () => {
        renderSavedScenesList();
        savedScenesModal.classList.add('open');
    });

    cancelSaveSceneBtn.addEventListener('click', () => saveSceneModal.classList.remove('open'));
    confirmSaveSceneBtn.addEventListener('click', saveCurrentScene);
    closeSavedScenesBtn.addEventListener('click', () => savedScenesModal.classList.remove('open'));

    showSavedScenesBtn.addEventListener('click', () => {
        renderSavedScenesList();
        savedScenesModal.classList.add('open');
    });

    closeSavedScenesBtn.addEventListener('click', () => savedScenesModal.classList.remove('open'));

    // Cierra el modal si se hace clic en el overlay
    [saveSceneModal, savedScenesModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });
    });


    // --- GESTIÓN DE ESCENAS (NUEVO Y REFACTORIZADO) ---
    function getSavedScenes() {
        return JSON.parse(localStorage.getItem(SCENES_STORAGE_KEY)) || [];
    }

    function saveCurrentScene() {
        const sceneName = sceneNameInput.value.trim();
        if (!sceneName) {
            alert("Por favor, introduce un nombre para la escena.");
            return;
        }

        const state = {
            id: Date.now(),
            name: sceneName,
            date: new Date().toISOString(),
            mapSrc: mapImage.src,
            cellSize: cellSize,
            // CORRECCIÓN CRÍTICA: Añadida la propiedad 'states' al guardado
            tokens: tokens.map(t => ({
                id: t.id, type: t.type, name: t.name, letter: t.letter,
                image: t.image, turn: t.turn, health_max: t.health_max,
                health_current: t.health_current, notes: t.notes,
                color: t.color, borderColor: t.borderColor,
                visionRadius: t.visionRadius, x: t.x, y: t.y, size: t.size,
                isDiscovered: t.isDiscovered,
                states: t.states || [] // Guardar estados (con fallback por si acaso)
            })),
            walls: walls,
            revealedFogData: revealedBufferCanvas.toDataURL(),
            gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity }
        };

        const scenes = getSavedScenes();
        scenes.push(state);
        localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(scenes));

        saveSceneModal.classList.remove('open');
        alert(`¡Escena "${sceneName}" guardada!`);
    }

    function renderSavedScenesList() {
        const scenes = getSavedScenes();
        sceneListContainer.innerHTML = ''; // Limpiar la lista

        if (scenes.length === 0) {
            sceneListContainer.innerHTML = `
                <div id="no-scenes-message">
                    <div class="icon">🗺️</div>
                    <h3>No hay mapas guardados</h3>
                    <p>Aún no has guardado ninguna escena. Crea una y guárdala para poder cargarla más tarde.</p>
                </div>`;
            return;
        }

        scenes.sort((a, b) => b.date.localeCompare(a.date)); // Mostrar las más nuevas primero

        scenes.forEach(scene => {
            const formattedDate = new Date(scene.date).toLocaleString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Calcular estadísticas
            const tokenCount = scene.tokens.length;
            const wallCount = scene.walls.filter(w => w.type === 'wall').length;
            const doorCount = scene.walls.filter(w => w.type === 'door').length;

            const card = document.createElement('div');
            card.className = 'scene-card';
            card.dataset.sceneId = scene.id; // Asignar ID a la tarjeta para el evento de carga

            card.innerHTML = `
                <div class="scene-card-image-container">
                    <img src="${scene.mapSrc}" alt="Vista previa de ${scene.name}" class="scene-card-image">
                    <div class="scene-card-info-overlay">
                        <h3 class="scene-card-name">${scene.name}</h3>
                        <p class="scene-card-date">Guardado: ${formattedDate}</p>
                    </div>
                    <button class="delete-scene-btn" data-scene-id="${scene.id}" title="Eliminar Escena">×</button>
                </div>
                <div class="scene-card-body">
                    <div class="scene-card-stats">
                        <div class="scene-card-stat-item">
                            <span class="scene-card-stat-icon">👥</span>
                            <span>${tokenCount} Fichas</span>
                        </div>
                        <div class="scene-card-stat-item">
                            <span class="scene-card-stat-icon">🧱</span>
                            <span>${wallCount} Muros</span>
                        </div>
                        <div class="scene-card-stat-item">
                            <span class="scene-card-stat-icon">🚪</span>
                            <span>${doorCount} Puertas</span>
                        </div>
                    </div>
                </div>
            `;
            sceneListContainer.appendChild(card);
        });

        // --- LÓGICA DE EVENTOS REDISEÑADA ---

        // 1. Cargar escena al hacer clic en la tarjeta
        sceneListContainer.querySelectorAll('.scene-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Solo cargar si no se hizo clic en el botón de eliminar
                if (!e.target.classList.contains('delete-scene-btn')) {
                    loadSceneById(card.dataset.sceneId);
                }
            });
        });

        // 2. Eliminar escena al hacer clic en el botón 'X'
        sceneListContainer.querySelectorAll('.delete-scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que el clic se propague a la tarjeta (y la cargue)
                deleteSceneById(btn.dataset.sceneId);
            });
        });
    }

    function loadSceneById(sceneId) {
        const scenes = getSavedScenes();
        const sceneToLoad = scenes.find(s => s.id == sceneId); // Usar == por si el ID es string

        if (!sceneToLoad) {
            alert("Error: No se encontró la escena seleccionada.");
            return;
        }

        // Usar un callback para asegurarse de que la imagen del mapa se carga ANTES de restaurar todo lo demás
        let hasRestored = false;
        const restore = () => {
            if (hasRestored) return;
            hasRestored = true;
            restoreSceneFromState(sceneToLoad);
        };
        mapImage.onload = restore;
        mapImage.src = sceneToLoad.mapSrc;
        // Si la imagen ya está en caché, `onload` podría no dispararse
        if (mapImage.complete) {
            restore();
        }
    }

    function deleteSceneById(sceneId) {
        if (!confirm("¿Estás seguro de que quieres eliminar esta escena? Esta acción no se puede deshacer.")) {
            return;
        }

        let scenes = getSavedScenes();
        scenes = scenes.filter(s => s.id != sceneId);
        localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(scenes));

        // Refrescar la lista en el modal
        renderSavedScenesList();
    }

    function restoreSceneFromState(state) {
        showMapArea();
        removeAllTokens();
        resizeAllCanvas();

        // Restaurar estado
        cellSize = state.cellSize;
        cellSizeInput.value = cellSize;
        cellSizeSlider.value = cellSize;

        if (state.gridSettings) {
            gridVisible = state.gridSettings.visible;
            gridColor = state.gridSettings.color;
            gridOpacity = state.gridSettings.opacity;
            gridToggle.checked = gridVisible;
            gridColorInput.value = gridColor;
            gridOpacityInput.value = gridOpacity;
        }

        walls = state.walls || [];
        drawWalls();
        updateDoorList();
        drawGrid();

        const fogImg = new Image();
        fogImg.onload = () => {
            revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height);
            revealedBufferCtx.drawImage(fogImg, 0, 0);
            if (visionModeActive) drawVision();
        };
        fogImg.src = state.revealedFogData;

        state.tokens.forEach(tokenData => recreateToken(tokenData));
        updateTokenList();

        // Cerrar el modal
        savedScenesModal.classList.remove('open');

        // --- AÑADIR ESTA LÍNEA ---
        // Buscamos la sección "Mapa y Escena" y le quitamos la clase 'active' para colapsarla.
        mapImageInput.closest('.collapsible').classList.remove('active');

        // Mostrar confirmación
        /* setTimeout(() => alert(`Escena "${state.name}" cargada.`), 100);*/

        updatePlayerTurnTracker();
    }

    // --- (El resto de funciones del script.js original permanecen aquí sin cambios) ---
    // ... handleImageUpload, loadNewMap, showMapArea, resizeAllCanvas, ...
    // ... processImage, addToken, resetAddTokenForm, recreateToken, ...
    // ... updateTokenElementStyle, removeAllTokens, deleteToken, updateTokenList, ...
    // ... selectToken, deselectToken, handleEditTokenImageChange, etc ...
    // ... Todas las funciones desde la línea 226 hasta el final del script original
    // --- GESTIÓN DEL MAPA Y ESCENA ---
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) { fileNameDisplay.textContent = 'Ningún archivo seleccionado'; return; }
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = e => loadNewMap(e.target.result);
        reader.readAsDataURL(file);
    }
    function loadNewMap(src) {
        mapImage.onload = () => {
            showMapArea();
            resizeAllCanvas();
            visionModeActive = false;
            toggleVisionBtn.textContent = 'Iniciar Visión Dinámica';
            visionCanvas.style.display = 'none';
            clearRevealedBuffer();
            removeAllTokens();
            drawGrid();

            // --- ASEGURARNOS DE QUE ESTA LÍNEA TAMBIÉN ESTÉ AQUÍ ---
            const mapSection = mapImageInput.closest('.collapsible');
            if (mapSection) mapSection.classList.remove('active');
        };
        mapImage.src = src;
    }

    function showMapArea() {
        mapContainer.classList.remove('no-map');
        loadingState.style.display = 'none';
        mapContentWrapper.style.display = 'block';
    }

    function resizeAllCanvas() {
        const w = mapImage.naturalWidth, h = mapImage.naturalHeight;
        [gridCanvas, wallsCanvas, visionCanvas, revealedBufferCanvas].forEach(c => { c.width = w; c.height = h; });
        if (visionModeActive) drawVision();
        drawGrid();
        drawWalls();
    }

    // --- LÓGICA DE PROCESAMIENTO DE IMAGEN ---
    // --- LÓGICA DE PROCESAMIENTO DE IMAGEN (REPASO) ---

    async function processImage(file) {
        if (file.type === 'image/gif') {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.readAsDataURL(file);
            });
        }

        const MAX_WIDTH = 256;
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- GESTIÓN DE FICHAS ---
    async function addToken() {
        const letter = add_tokenLetter.value.trim(),
            name = add_tokenName.value.trim(),
            vision = parseInt(add_tokenVision.value);
        if (!letter || !name || isNaN(vision)) {
            alert("Por favor, rellena los campos obligatorios (*): Nombre, Letra y Visión.");
            return;
        }

        let imageBase64 = null;
        if (add_tokenImageInput.files[0]) {
            imageBase64 = await processImage(add_tokenImageInput.files[0]);
        }

        const initialHealth = parseInt(add_tokenHealth.value) || 0;
        const tokenData = {
            id: Date.now(),
            type: document.querySelector('input[name="tokenType"]:checked').value,
            name: name,
            letter: letter,
            image: imageBase64,
            turn: parseInt(add_tokenTurn.value) || 0,
            health_max: initialHealth,
            health_current: initialHealth,
            notes: add_tokenNotes.value,
            color: add_tokenColor.value,
            borderColor: add_addBorderCheckbox.checked ? add_tokenBorderColor.value : null,
            visionRadius: vision,
            x: 20,
            y: 20,
            size: cellSize,
            isDiscovered: document.querySelector('input[name="tokenType"]:checked').value === 'player',
            states: []
        };

        recreateToken(tokenData);
        updateTokenList();
        updatePlayerTurnTracker();
        if (visionModeActive) drawVision();
        resetAddTokenForm();
    }

    function resetAddTokenForm() {
        add_tokenName.value = '';
        add_tokenLetter.value = '';
        add_tokenImageInput.value = '';
        add_tokenImageName.textContent = 'Ningún archivo...';
        add_tokenTurn.value = '10'; // <-- CORREGIDO
        add_tokenHealth.value = '100'; // <-- CORREGIDO
        add_tokenNotes.value = '';
        document.getElementById('typePlayer').checked = true;
        add_tokenColor.value = '#4a90e2';
        add_tokenBorderColor.value = '#000000';
        add_addBorderCheckbox.checked = false;
        add_tokenVision.value = '6'; // <-- CORREGIDO
        add_tokenName.focus();
    }

    function recreateToken(tokenData) {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token';
        tokenElement.dataset.id = tokenData.id;

        // CORRECCIÓN CRÍTICA: Asegurarse de que el array de estados exista, incluso en guardados antiguos
        tokenData.states = tokenData.states || [];

        if (tokenData.health_max === undefined) {
            tokenData.health_max = tokenData.health || 100;
            tokenData.health_current = tokenData.health || 100;
        }
        tokenData.element = tokenElement;
        tokens.push(tokenData);
        updateTokenElementStyle(tokenData);
        tokensLayer.appendChild(tokenElement);
    }

    function updateTokenElementStyle(token) {
        const el = token.element;
        el.style.left = `${token.x}px`; el.style.top = `${token.y}px`;
        el.style.width = `${token.size}px`; el.style.height = `${token.size}px`;
        el.style.lineHeight = `${token.size}px`;
        el.style.backgroundColor = token.color;
        el.style.border = token.borderColor ? `3px solid ${token.borderColor}` : 'none';

        if (token.image) {
            el.classList.add('has-image');
            el.style.backgroundImage = `url(${token.image})`;
            el.textContent = '';
        } else {
            el.classList.remove('has-image');
            el.style.backgroundImage = 'none';
            el.textContent = token.letter;
        }

        if (visionModeActive && token.type === 'enemy') { el.classList.toggle('hidden-enemy', !token.isDiscovered); } else { el.classList.remove('hidden-enemy'); }
    }

    function removeAllTokens() { tokens = []; tokensLayer.innerHTML = ''; updateTokenList(); deselectToken(); }
    function deleteToken(tokenId) {
        tokens = tokens.filter(t => t.id !== tokenId);
        const el = tokensLayer.querySelector(`.token[data-id="${tokenId}"]`);
        if (el) el.remove();
        if (selectedTokenId === tokenId) deselectToken();
        updateTokenList();
        if (visionModeActive) drawVision();
        updatePlayerTurnTracker();
    }
    function updateTokenList() {
        tokenListUl.innerHTML = ''; // Limpiamos la lista como siempre

        // --- LÓGICA CORREGIDA ---
        if (tokens.length === 0) {
            // Si no hay fichas, insertamos el párrafo directamente en el UL
            tokenListUl.innerHTML = `<p class="no-tokens-message">Aún no hay fichas en el tablero. ¡Añade una para empezar!</p>`;
            return; // Terminamos la función aquí
        }

        // Si hay fichas, procedemos con la lógica normal
        const sortedTokens = [...tokens].sort((a, b) => b.turn - a.turn);
        sortedTokens.forEach(token => {
            const li = document.createElement('li');
            li.dataset.id = token.id;
            const typeIcon = token.type === 'player' ? '🛡️' : '👹';
            const borderStyle = token.borderColor ? `border: 3px solid ${token.borderColor};` : 'none';
            const imageStyle = token.image ? `background-image: url(${token.image}); background-size: cover; background-position: center;` : `background-color: ${token.color};`;

            li.innerHTML = `<div class="token-list-preview" style="${imageStyle} ${borderStyle}">${token.image ? '' : token.letter}</div><div class="token-list-header"><span>${typeIcon}</span><span>${token.name}</span></div><div class="token-list-details"><span>Turno: ${token.turn}</span><span>❤️ Vida: ${token.health_current}/${token.health_max}</span><span>👁️ Vis: ${token.visionRadius}</span></div><button class="delete-token-btn" data-id="${token.id}" title="Eliminar Ficha">X</button>`;
            tokenListUl.appendChild(li);
        });

        // Los listeners se añaden después de crear la lista
        tokenListUl.querySelectorAll('.delete-token-btn').forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteToken(parseInt(e.target.dataset.id));
        }));

        // Ya no necesitamos la comprobación extra aquí, porque si la lista está vacía, no hay 'li' a los que añadir listeners.
        tokenListUl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', e => selectToken(parseInt(e.currentTarget.dataset.id)));
        });
    }


    function selectToken(tokenId) {
        const isAlreadySelected = selectedTokenId === tokenId;

        deselectToken(); // Limpia la selección anterior

        if (isAlreadySelected) {
            // Si estábamos re-seleccionando la misma, no hacemos nada más que limpiarla y re-abrir el panel.
            // Esto evita que al hacer clic en la misma ficha se cierre el panel.
        }

        selectedTokenId = tokenId;
        const token = tokens.find(t => t.id === tokenId);
        if (!token) {
            tokenStatesEditor.style.display = 'none'; // Ocultar si no hay token
            return;
        }
        tokenStatesEditor.style.display = 'block'; // Mostrar editor
        renderTokenStatesEditor(token);

        token.element.classList.add('selected');
        selectedTokenSection.classList.add('has-selection', 'active');

        // --- LÓGICA DE VISTA PREVIA ACTUALIZADA (Ahora siempre se ejecutará) ---
        if (token.image) {
            // Si tiene imagen, mostrarla y ocultar la letra
            edit_tokenImagePreview.src = token.image;
            edit_tokenImagePreview.style.display = 'block';
            edit_tokenLetterPreview.style.display = 'none';
            removeTokenImageBtn.style.display = 'block'; // Mostrar botón de quitar
        } else {
            // Si NO tiene imagen, mostrar la letra/color y ocultar la imagen
            edit_tokenImagePreview.style.display = 'none';
            edit_tokenLetterPreview.style.display = 'flex';
            removeTokenImageBtn.style.display = 'none'; // Ocultar botón de quitar

            // Aplicar estilos a la vista previa de la letra
            edit_tokenLetterPreview.textContent = token.letter;
            edit_tokenLetterPreview.style.backgroundColor = token.color;
        }

        // Rellenar el resto del formulario como antes
        edit_tokenName.value = token.name;
        edit_tokenLetter.value = token.letter;
        edit_tokenTurn.value = token.turn;
        edit_tokenVision.value = token.visionRadius;
        edit_tokenHealthMax.value = token.health_max;
        edit_tokenColor.value = token.color;
        edit_tokenBorderColor.value = token.borderColor || '#000000';
        edit_tokenNotes.value = token.notes;

        healthDisplay.textContent = token.health_current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`;
    }


    function deselectToken() {
        if (!selectedTokenId) return;
        const oldToken = tokens.find(t => t.id === selectedTokenId);
        if (oldToken) oldToken.element.classList.remove('selected');
        selectedTokenId = null;
        selectedTokenSection.classList.remove('has-selection');
        tokenStatesEditor.style.display = 'none';
    }

    async function handleEditTokenImageChange(event) {
        if (!selectedTokenId) return;
        const file = event.target.files[0];
        if (file) {
            const token = tokens.find(t => t.id === selectedTokenId);
            token.image = await processImage(file);
            updateTokenElementStyle(token);
            updateTokenList();
            updatePlayerTurnTracker(); // <-- AÑADIR ESTA LÍNEA
            selectToken(token.id); // Re-seleccionar para actualizar toda la UI del editor
        }
    }

    function removeEditTokenImage() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        token.image = null;
        updateTokenElementStyle(token);
        updateTokenList();
        updatePlayerTurnTracker(); // <-- AÑADIR ESTA LÍNEA
        selectToken(token.id); // Re-seleccionar para actualizar la UI del editor
    }


    function updateSelectedToken() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        // Actualizar datos del token
        token.name = edit_tokenName.value.trim();
        token.letter = edit_tokenLetter.value.trim();
        token.turn = parseInt(edit_tokenTurn.value) || 0;
        token.visionRadius = parseInt(edit_tokenVision.value) || 0;
        token.health_max = parseInt(edit_tokenHealthMax.value) || 0;
        token.color = edit_tokenColor.value;
        token.borderColor = edit_tokenBorderColor.value; // Se manejará con lógica de borde
        token.notes = edit_tokenNotes.value;

        if (!token.name || !token.letter) {
            alert("El nombre y la letra no pueden estar vacíos.");
            return;
        }

        if (token.health_current > token.health_max) {
            token.health_current = token.health_max;
        }

        // Actualizar elementos visuales
        updateTokenElementStyle(token);
        updateTokenList();

        // --- ACTUALIZACIÓN DE VISTA PREVIA EN VIVO ---
        // Refresca la vista previa de la letra si no hay imagen
        if (!token.image) {
            edit_tokenLetterPreview.textContent = token.letter;
            edit_tokenLetterPreview.style.backgroundColor = token.color;
        }

        // No es necesario llamar a selectToken(token.id) de nuevo, ya que
        // actualizamos los componentes necesarios aquí mismo.
        // Solo actualizamos la barra de vida si cambió.
        healthDisplay.textContent = token.health_current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`;
        updatePlayerTurnTracker();
    }

    // --- LÓGICA DE VIDA Y DAÑO ---
    function getHealthColorClass(current, max) { if (max === 0) return 'health-mid'; const percentage = (current / max) * 100; if (percentage <= 10) return 'health-critical'; if (percentage <= 40) return 'health-low'; if (percentage <= 70) return 'health-mid'; return 'health-high'; }
    function showDamageFloat(amount, token, trackerCard) { // Añadimos trackerCard como parámetro
        if (amount === 0) return;

        const text = `${amount > 0 ? '+' : ''}${amount}`;
        const typeClass = amount > 0 ? 'heal' : 'damage';

        // 1. Panel Float (en el editor de ficha seleccionada) - SIN CAMBIOS
        const panelFloat = document.createElement('div');
        panelFloat.className = `damage-float ${typeClass}`;
        panelFloat.textContent = text;
        healthDisplayContainer.appendChild(panelFloat);
        setTimeout(() => panelFloat.remove(), 1000);

        // 2. Map Float (sobre la ficha en el mapa) - SIN CAMBIOS
        const mapFloat = document.createElement('div');
        mapFloat.className = `damage-float ${typeClass}`;
        mapFloat.textContent = text;
        mapFloat.style.left = `${token.x + token.size / 2}px`;
        mapFloat.style.top = `${token.y}px`;
        tokensLayer.appendChild(mapFloat);
        setTimeout(() => mapFloat.remove(), 1000);

        // 3. NUEVO: Tracker Card Float
        if (trackerCard) {
            const trackerFloat = document.createElement('div');
            trackerFloat.className = `damage-float ${typeClass}`;
            trackerFloat.textContent = text;

            // Usamos getBoundingClientRect para obtener la posición de la tarjeta en la pantalla
            const cardRect = trackerCard.getBoundingClientRect();

            // Posicionamos el número flotante de forma FIJA en la pantalla
            trackerFloat.style.position = 'fixed';
            trackerFloat.style.left = `${cardRect.left + (cardRect.width / 2)}px`; // Centrado en la tarjeta
            trackerFloat.style.top = `${cardRect.top}px`; // Empezando desde arriba de la tarjeta

            // Lo añadimos al body para que no se vea afectado por otros contenedores
            document.body.appendChild(trackerFloat);
            setTimeout(() => trackerFloat.remove(), 1000);
        }
    }

    function applyHealthChange(amount) {
        if (!selectedTokenId || isNaN(amount)) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        const oldHealth = token.health_current;
        let newHealth = oldHealth + amount;
        newHealth = Math.max(0, Math.min(token.health_max, newHealth));
        const actualChange = newHealth - oldHealth;
        token.health_current = newHealth;

        // Actualizar UI del panel de edición
        healthDisplay.textContent = token.health_current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`;

        // Actualizar la lista de fichas y el tracker de turnos
        updateTokenList();
        updatePlayerTurnTracker();

        // Buscar la tarjeta del tracker DESPUÉS de que se haya actualizado
        const trackerCard = playerTurnTracker.querySelector(`.player-token-card[data-id="${token.id}"]`);

        // --- LLAMADA UNIFICADA A LA LÓGICA DE FEEDBACK VISUAL ---

        // 1. Mostrar todos los números flotantes (le pasamos la tarjeta encontrada)
        showDamageFloat(actualChange, token, trackerCard);

        // 2. Aplicar las animaciones de flash/sacudida
        const tokenElement = token.element;

        if (actualChange < 0) {
            damageSound.currentTime = 0;
            damageSound.play();

            tokenElement.classList.add('token-damaged');
            setTimeout(() => tokenElement.classList.remove('token-damaged'), 400);

            if (trackerCard) {
                trackerCard.classList.add('card-damaged');
                setTimeout(() => trackerCard.classList.remove('card-damaged'), 400);
            }

        } else if (actualChange > 0) {
            healSound.currentTime = 0;
            healSound.play();

            tokenElement.classList.add('token-healed');
            setTimeout(() => tokenElement.classList.remove('token-healed'), 500);

            if (trackerCard) {
                trackerCard.classList.add('card-healed');
                setTimeout(() => trackerCard.classList.remove('card-healed'), 500);
            }
        }
    }
    // --- MANEJO DE RATÓN ---
    function handleLayerMouseDown(event) {
        // Prioridad 1: Arrastrar una ficha
        const tokenElement = event.target.closest('.token');
        if (tokenElement) {
            const tokenId = parseInt(tokenElement.dataset.id);
            const token = tokens.find(t => t.id === tokenId);
            if (token && (token.type === 'player' || !visionModeActive || token.isDiscovered)) {
                currentDraggedToken = token;
                const tokenRect = token.element.getBoundingClientRect();
                const mapRect = mapContainer.getBoundingClientRect();
                dragOffsetX = event.clientX - tokenRect.left;
                dragOffsetY = event.clientY - tokenRect.top;
                currentDraggedToken.element.style.zIndex = 100;
            }
            return; // Termina la función aquí si estamos arrastrando una ficha
        }

        // Prioridad 2: Dibujar un muro
        if (isDrawingWallMode) {
            handleWallDrawing(event);
            return; // Termina la función aquí
        }

        // Prioridad 3: Pintar niebla
        if (visionModeActive && (event.buttons === 1 || event.type === 'mousedown')) {
            isPaintingFog = true;
            paintFog(event);
            return; // Termina la función aquí
        }

        // Si ninguna de las anteriores es cierta, iniciamos el paneo
        event.preventDefault(); // Previene la selección de texto o el arrastre de la imagen
        isPanning = true;
        panStartX = event.clientX;
        panStartY = event.clientY;
        scrollStartX = mapContainer.scrollLeft;
        scrollStartY = mapContainer.scrollTop;
        mapContainer.style.cursor = 'grabbing'; // Cambia el cursor a "mano agarrando"
    }

    function handleLayerMouseMove(event) {
        // Si estamos paneando, esta es la única lógica que se ejecuta
        if (isPanning) {
            const dx = event.clientX - panStartX;
            const dy = event.clientY - panStartY;
            mapContainer.scrollLeft = scrollStartX - dx;
            mapContainer.scrollTop = scrollStartY - dy;
            return; // Importante: termina la función para no ejecutar otras lógicas de movimiento
        }
        if (isDrawingWallMode && wallStartPoint) {
            drawWalls();
            const mapRect = mapContainer.getBoundingClientRect();
            const endX = event.clientX - mapRect.left + mapContainer.scrollLeft;
            const endY = event.clientY - mapRect.top + mapContainer.scrollTop;
            wallsCtx.beginPath();
            wallsCtx.moveTo(wallStartPoint.x, wallStartPoint.y);
            const previewDrawType = document.querySelector('input[name="drawType"]:checked').value;
            if (previewDrawType === 'door') {
                wallsCtx.setLineDash([10, 8]);
                wallsCtx.strokeStyle = '#87CEEB';
            } else {
                wallsCtx.setLineDash([]);
                wallsCtx.strokeStyle = 'cyan';
            }
            wallsCtx.lineWidth = 3;
            wallsCtx.lineTo(endX, endY);
            wallsCtx.stroke();
            wallsCtx.setLineDash([]);
        } else if (currentDraggedToken) {
            const mapRect = mapContainer.getBoundingClientRect();
            let newX = event.clientX - mapRect.left + mapContainer.scrollLeft - dragOffsetX;
            let newY = event.clientY - mapRect.top + mapContainer.scrollTop - dragOffsetY;
            newX = Math.max(0, Math.min(newX, mapContentWrapper.offsetWidth - currentDraggedToken.size));
            newY = Math.max(0, Math.min(newY, mapContentWrapper.offsetHeight - currentDraggedToken.size));
            currentDraggedToken.x = newX;
            currentDraggedToken.y = newY;
            currentDraggedToken.element.style.left = `${newX}px`;
            currentDraggedToken.element.style.top = `${newY}px`;
            if (visionModeActive) { drawVision(); }
        } else if (isPaintingFog) {
            paintFog(event);
        }
    }

    function handleLayerMouseUp() {    // Si estábamos paneando, lo detenemos
        if (isPanning) {
            isPanning = false;
            mapContainer.style.cursor = 'grab'; // Restaura el cursor a "mano abierta"
        } if (currentDraggedToken) { currentDraggedToken.element.style.zIndex = ''; if (visionModeActive) drawVision(); currentDraggedToken = null; } isPaintingFog = false;
    }
    function handleLayerClick(event) { if (event.detail > 1) return; setTimeout(() => { if (currentDraggedToken) return; const tokenElement = event.target.closest('.token'); if (tokenElement) { selectToken(parseInt(tokenElement.dataset.id)); } else { deselectToken(); } }, 150); }

    // --- VISIÓN, NIEBLA Y MUROS ---
    function toggleVisionMode() {
        visionModeActive = !visionModeActive;
        toggleVisionBtn.textContent = visionModeActive ? 'Detener Visión Dinámica' : 'Iniciar Visión Dinámica';
        if (visionModeActive) {
            if (isDrawingWallMode) { toggleWallMode(); }
            toggleWallModeBtn.disabled = true; undoWallBtn.disabled = true; clearWallsBtn.disabled = true;
            wallsCanvas.style.display = 'none';
            visionCanvas.style.display = 'block';
            updateAllTokenVisibility();
            drawVision();
        } else {
            toggleWallModeBtn.disabled = false; undoWallBtn.disabled = false; clearWallsBtn.disabled = false;
            wallsCanvas.style.display = 'block';
            visionCanvas.style.display = 'none';
            ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
            updateAllTokenVisibility();
            drawWalls();
        }
    }

    function updateAllTokenVisibility() { tokens.forEach(token => updateTokenElementStyle(token)); }
    function clearRevealedBuffer() { revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height); }
    function resetFog() { if (!confirm("¿Estás seguro de que quieres reiniciar toda la niebla de guerra? Esta acción no se puede deshacer.")) return; clearRevealedBuffer(); if (visionModeActive) { tokens.forEach(t => { if (t.type === 'enemy') t.isDiscovered = false; }); drawVision(); updateAllTokenVisibility(); } }

    function paintFog(event) {
        if (!visionModeActive) return;
        const mapRect = mapContainer.getBoundingClientRect();
        const x = event.clientX - mapRect.left + mapContainer.scrollLeft;
        const y = event.clientY - mapRect.top + mapContainer.scrollTop;
        revealedBufferCtx.globalCompositeOperation = brushMode === 'reveal' ? 'source-over' : 'destination-out';
        revealedBufferCtx.fillStyle = 'white';
        revealedBufferCtx.beginPath();
        revealedBufferCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        revealedBufferCtx.fill();
        renderFogFromBuffer();
        checkEnemyDiscovery();
    }

    function renderFogFromBuffer() {
        ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, visionCanvas.width, visionCanvas.height);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(revealedBufferCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
    }

    function drawVision() {
        if (!visionModeActive) return;
        const visionThisFrameCanvas = document.createElement('canvas');
        visionThisFrameCanvas.width = visionCanvas.width;
        visionThisFrameCanvas.height = visionCanvas.height;
        const visionThisFrameCtx = visionThisFrameCanvas.getContext('2d');
        const mapBoundaries = [{ x1: 0, y1: 0, x2: visionCanvas.width, y2: 0 }, { x1: visionCanvas.width, y1: 0, x2: visionCanvas.width, y2: visionCanvas.height }, { x1: visionCanvas.width, y1: visionCanvas.height, x2: 0, y2: visionCanvas.height }, { x1: 0, y1: visionCanvas.height, x2: 0, y2: 0 }];
        const activeWalls = walls.filter(w => w.type === 'wall' || (w.type === 'door' && !w.isOpen));

        tokens.filter(t => t.type === 'player').forEach(pToken => {
            const centerX = pToken.x + pToken.size / 2;
            const centerY = pToken.y + pToken.size / 2;
            const visionRadiusPixels = pToken.visionRadius * cellSize;

            visionThisFrameCtx.save();
            visionThisFrameCtx.beginPath();
            visionThisFrameCtx.arc(centerX, centerY, visionRadiusPixels, 0, Math.PI * 2);
            visionThisFrameCtx.clip();

            if (activeWalls.length === 0) {
                visionThisFrameCtx.fillStyle = 'white';
                visionThisFrameCtx.beginPath();
                visionThisFrameCtx.arc(centerX, centerY, visionRadiusPixels, 0, Math.PI * 2);
                visionThisFrameCtx.fill();
            } else {
                const allObstacles = [...activeWalls, ...mapBoundaries];
                let points = [];
                allObstacles.forEach(wall => { points.push({ x: wall.x1, y: wall.y1 }); points.push({ x: wall.x2, y: wall.y2 }); });

                let rays = [];
                points.forEach(point => {
                    const angle = Math.atan2(point.y - centerY, point.x - centerX);
                    const rayLength = visionRadiusPixels * 1.5;
                    rays.push({ angle: angle - 0.0001, x1: centerX, y1: centerY, x2: centerX + Math.cos(angle - 0.0001) * rayLength, y2: centerY + Math.sin(angle - 0.0001) * rayLength });
                    rays.push({ angle: angle, x1: centerX, y1: centerY, x2: centerX + Math.cos(angle) * rayLength, y2: centerY + Math.sin(angle) * rayLength });
                    rays.push({ angle: angle + 0.0001, x1: centerX, y1: centerY, x2: centerX + Math.cos(angle + 0.0001) * rayLength, y2: centerY + Math.sin(angle + 0.0001) * rayLength });
                });

                let intersects = [];
                rays.forEach(ray => {
                    let closestIntersect = null;
                    allObstacles.forEach(wall => {
                        const intersect = getIntersection(ray, wall);
                        if (intersect) { if (!closestIntersect || intersect.param < closestIntersect.param) { closestIntersect = intersect; } }
                    });
                    if (closestIntersect) { closestIntersect.angle = ray.angle; intersects.push(closestIntersect); } else { intersects.push({ angle: ray.angle, x: ray.x2, y: ray.y2 }); }
                });

                intersects.sort((a, b) => a.angle - b.angle);

                if (intersects.length > 0) {
                    visionThisFrameCtx.fillStyle = 'white';
                    visionThisFrameCtx.beginPath();
                    visionThisFrameCtx.moveTo(intersects[0].x, intersects[0].y);
                    for (let i = 1; i < intersects.length; i++) {
                        visionThisFrameCtx.lineTo(intersects[i].x, intersects[i].y);
                    }
                    visionThisFrameCtx.closePath();
                    visionThisFrameCtx.fill();
                }
            }
            visionThisFrameCtx.restore();
        });

        revealedBufferCtx.globalCompositeOperation = 'source-over';
        revealedBufferCtx.drawImage(visionThisFrameCanvas, 0, 0);

        renderFogFromBuffer();
        checkEnemyDiscovery();
    }

    function checkEnemyDiscovery() {
        let trackerNeedsUpdate = false; // <-- Usaremos una bandera para actualizar solo una vez

        tokens.filter(t => t.type === 'enemy' && !t.isDiscovered).forEach(enemy => {
            const data = revealedBufferCtx.getImageData(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, 1, 1).data;
            if (data[3] > 0) { // El canal alfa es mayor que 0, significa que es visible
                enemy.isDiscovered = true;
                updateTokenElementStyle(enemy);
                trackerNeedsUpdate = true; // <-- Marcamos que el tracker necesita una actualización
            }
        });

        // Si al menos un enemigo fue descubierto en este frame, actualizamos el tracker
        if (trackerNeedsUpdate) {
            updatePlayerTurnTracker(); // <-- ¡AQUÍ ESTÁ LA MAGIA!
        }
    }

    function updateCellSize() {
        const newSize = parseInt(cellSizeInput.value);
        if (isNaN(newSize) || newSize < 10) { cellSizeInput.value = cellSize; return; }
        cellSize = newSize;
        tokens.forEach(token => { token.size = cellSize; updateTokenElementStyle(token); });
        drawGrid();
        if (visionModeActive) drawVision();
    }

    function drawGrid() {
        const w = gridCanvas.width, h = gridCanvas.height;
        gridCtx.clearRect(0, 0, w, h);
        if (!gridVisible || cellSize <= 0) return;
        gridCtx.strokeStyle = gridColor;
        gridCtx.globalAlpha = gridOpacity;
        gridCtx.lineWidth = 1;
        gridCtx.beginPath();
        for (let x = cellSize; x < w; x += cellSize) { gridCtx.moveTo(x, 0); gridCtx.lineTo(x, h); }
        for (let y = cellSize; y < h; y += cellSize) { gridCtx.moveTo(0, y); gridCtx.lineTo(w, y); }
        gridCtx.stroke();
        gridCtx.globalAlpha = 1.0;
    }

    // --- LÓGICA DE MUROS Y PUERTAS ---
    function toggleWallMode() {
        if (visionModeActive) { alert("No se puede editar muros mientras la Visión Dinámica está activa. Desactívala primero."); return; }
        isDrawingWallMode = !isDrawingWallMode;
        wallStartPoint = null;
        toggleWallModeBtn.classList.toggle('active', isDrawingWallMode);
        document.body.classList.toggle('wall-drawing-mode', isDrawingWallMode);
        toggleWallModeBtn.textContent = isDrawingWallMode ? 'Desactivar Modo Dibujo' : 'Activar Modo Dibujo';
        drawWalls();
    }

    function handleWallDrawing(event) {
        const mapRect = mapContainer.getBoundingClientRect();
        const x = event.clientX - mapRect.left + mapContainer.scrollLeft;
        const y = event.clientY - mapRect.top + mapContainer.scrollTop;

        if (!wallStartPoint) {
            wallStartPoint = { x, y };
        } else {
            const currentDrawType = document.querySelector('input[name="drawType"]:checked').value;

            if (currentDrawType === 'door') {
                // Si es una puerta, guardamos sus datos y abrimos el modal
                pendingDoor = {
                    x1: wallStartPoint.x, y1: wallStartPoint.y,
                    x2: x, y2: y
                };
                doorNameInput.value = ''; // Limpiamos el input
                doorNameModal.classList.add('open');
                doorNameInput.focus();

            } else {
                // Si es un muro, lo creamos directamente como antes
                const newWall = {
                    id: Date.now(),
                    x1: wallStartPoint.x, y1: wallStartPoint.y,
                    x2: x, y2: y,
                    type: 'wall'
                };
                walls.push(newWall);
                if (visionModeActive) drawVision();
            }

            wallStartPoint = null; // Reiniciamos el punto de inicio para el siguiente trazo
            drawWalls(); // Redibujamos para limpiar la línea de previsualización
        }
    }

    function createDoorFromModal() {
        const doorName = doorNameInput.value.trim();
        if (!doorName) {
            alert("Por favor, introduce un nombre para el acceso.");
            return;
        }

        if (pendingDoor) {
            const newDoor = {
                id: Date.now(),
                ...pendingDoor, // Usamos las coordenadas guardadas
                type: 'door',
                isOpen: false,
                name: doorName
            };
            walls.push(newDoor);

            // Limpieza y actualización
            pendingDoor = null;
            doorNameModal.classList.remove('open');
            updateDoorList();
            drawWalls();
            if (visionModeActive) drawVision();
        }
    }

    function drawWalls() {
        wallsCtx.clearRect(0, 0, wallsCanvas.width, wallsCanvas.height);
        walls.forEach(wall => {
            wallsCtx.beginPath();
            wallsCtx.moveTo(wall.x1, wall.y1);
            wallsCtx.lineTo(wall.x2, wall.y2);

            if (wall.type === 'door') {
                wallsCtx.strokeStyle = wall.isOpen ? '#5dc66f' : '#c65d5d';
                wallsCtx.setLineDash([10, 8]);
                wallsCtx.lineWidth = 5;
            } else {
                wallsCtx.strokeStyle = '#e6c253';
                wallsCtx.setLineDash([]);
                wallsCtx.lineWidth = 4;
            }
            wallsCtx.stroke();
        });
        wallsCtx.setLineDash([]);
    }

    function undoLastWall() {
        walls.pop();
        drawWalls();
        updateDoorList();
        if (visionModeActive) drawVision();
    }

    function clearAllWalls() {
        if (confirm("¿Estás seguro de que quieres eliminar todos los muros y puertas?")) {
            walls = [];
            drawWalls();
            updateDoorList();
            if (visionModeActive) drawVision();
        }
    }

    function updateDoorList() {
        const doors = walls.filter(w => w.type === 'door');
        doorListUl.innerHTML = '';

        if (doors.length === 0) {
            noDoorsMessage.style.display = 'block';
            return;
        }

        noDoorsMessage.style.display = 'none';

        doors.forEach((door) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="door-name" data-id="${door.id}" title="Haz clic para editar">${door.name}</span><div class="door-actions"><button class="toggle-door-btn ${door.isOpen ? 'open' : ''}" data-id="${door.id}">${door.isOpen ? 'Cerrar' : 'Abrir'}</button><button class="delete-door-btn" data-id="${door.id}" title="Eliminar Acceso">X</button></div>`;
            doorListUl.appendChild(li);
        });

        doorListUl.querySelectorAll('.toggle-door-btn').forEach(btn => btn.addEventListener('click', toggleDoorState));
        doorListUl.querySelectorAll('.delete-door-btn').forEach(btn => btn.addEventListener('click', deleteDoor));
        doorListUl.querySelectorAll('.door-name').forEach(nameSpan => nameSpan.addEventListener('click', makeDoorNameEditable));
    }

    function makeDoorNameEditable(event) {
        const nameSpan = event.target;
        const doorId = parseInt(nameSpan.dataset.id);
        const originalName = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.classList.add('door-name-edit');
        nameSpan.replaceWith(input);
        input.focus();
        input.select();
        const saveChanges = () => {
            const door = walls.find(w => w.id === doorId);
            if (door) {
                const newName = input.value.trim();
                door.name = newName === '' ? originalName : newName;
            }
            updateDoorList();
        };
        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                updateDoorList();
            }
        });
    }

    function toggleDoorState(event) {
        const doorId = parseInt(event.target.dataset.id);
        const door = walls.find(w => w.id === doorId);
        if (door) {
            door.isOpen = !door.isOpen;
            updateDoorList();
            drawWalls();
            if (visionModeActive) {
                drawVision();
            }
        }
    }

    function deleteDoor(event) {
        const doorId = parseInt(event.target.dataset.id);
        walls = walls.filter(w => w.id !== doorId);
        updateDoorList();
        drawWalls();
        if (visionModeActive) {
            drawVision();
        }
    }

    function getIntersection(ray, wall) {
        const r_px = ray.x1, r_py = ray.y1, r_dx = ray.x2 - r_px, r_dy = ray.y2 - r_py;
        const s_px = wall.x1, s_py = wall.y1, s_dx = wall.x2 - s_px, s_dy = wall.y2 - s_py;
        const r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy), s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
        if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) { return null; }
        const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
        const T1 = (s_px + s_dx * T2 - r_px) / r_dx;
        if (T1 < 0 || T2 < 0 || T2 > 1) return null;
        return { x: r_px + r_dx * T1, y: r_py + r_dy * T1, param: T1 };
    }

    // --- FUNCIÓN CENTRAL PARA EL TRACKER DE JUGADORES (NUEVA) ---
    function updatePlayerTurnTracker() {
        playerTurnTracker.innerHTML = ''; // Limpiar el tracker

        // 1. Filtramos las fichas: solo jugadores o enemigos DESCUBIERTOS
        const visibleTokens = tokens.filter(token => token.type === 'player' || (token.type === 'enemy' && token.isDiscovered));

        // 2. Ordenamos por iniciativa
        const sortedTokens = visibleTokens.sort((a, b) => b.turn - a.turn);

        sortedTokens.forEach(token => {
            const card = document.createElement('div');
            card.className = 'player-token-card';
            card.dataset.id = token.id;

            const imageStyle = token.image
                ? `background-image: url(${token.image});`
                : `background-color: ${token.color};`;

            const statesHTML = token.states.map(state =>
                `<span title="${state.description}">${state.emoji}</span>`
            ).join('');

            // 3. Generamos el HTML de la barra de vida de forma condicional
            let healthBarHTML = '';
            if (token.type === 'player') {
                const healthPercentage = token.health_max > 0 ? (token.health_current / token.health_max) * 100 : 0;
                const healthColorClass = getHealthColorClass(token.health_current, token.health_max);
                healthBarHTML = `
                    <div class="health-bar-container">
                        <div class="health-bar-fill ${healthColorClass}" style="width: ${healthPercentage}%;"></div>
                    </div>
                `;
            }

            // 4. Construimos la tarjeta final
            card.innerHTML = `
                <div class="player-token-preview" style="${imageStyle}">
                    ${token.image ? '' : token.letter}
                </div>
                <div class="player-token-info">
                    <div class="player-token-name">${token.name}</div>
                    <div class="player-token-initiative">Ini 🎲: ${token.turn}</div>
                    ${healthBarHTML} 
                    <div class="player-token-states">
                        ${statesHTML}
                    </div>
                </div>
            `;
            playerTurnTracker.appendChild(card);
        });
    }


    // --- GESTIÓN DE ESTADOS (NUEVAS FUNCIONES) ---
    function renderTokenStatesEditor(token) {
        editTokenStatesList.innerHTML = '';
        if (!token || !token.states) return;

        token.states.forEach((state, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="state-emoji">${state.emoji}</span>
                <span class="state-desc">${state.description}</span>
                <button class="delete-state-btn" data-index="${index}" title="Eliminar estado">×</button>
            `;
            editTokenStatesList.appendChild(li);
        });

        // Añadir listeners a los botones de borrar
        editTokenStatesList.querySelectorAll('.delete-state-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                removeStateFromSelectedToken(parseInt(btn.dataset.index));
            });
        });
    }
    function addStateToSelectedToken() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        const emoji = newStateEmoji.value.trim();
        const desc = newStateDesc.value.trim();

        if (!emoji) {
            alert('El emoji del estado no puede estar vacío.');
            return;
        }

        token.states.push({ emoji, description: desc });

        // Limpiar inputs y actualizar UI
        newStateEmoji.value = '';
        newStateDesc.value = '';
        renderTokenStatesEditor(token);
        updatePlayerTurnTracker();
    }

    function removeStateFromSelectedToken(index) {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token || !token.states[index]) return;

        token.states.splice(index, 1);

        // Actualizar UI
        renderTokenStatesEditor(token);
        updatePlayerTurnTracker();
    }
    // Guardar y cargar estados
    function saveState() {
        // ... (lógica existente)
        const state = {
            // ... (propiedades existentes)
            tokens: tokens.map(t => ({
                // ... (propiedades de token existentes)
                states: t.states // <-- AÑADIR ESTA LÍNEA
            }))
            // ... (resto del objeto state)
        };
        // ...
    }
});