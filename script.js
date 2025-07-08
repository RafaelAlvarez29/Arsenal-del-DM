// --- SCRIPT.JS - VERSIÓN CON HOJA DE PERSONAJE ---

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN DE INDEXEDDB ---
    const DB_NAME = 'DMArsenalDB';
    const DB_VERSION = 1;
    const SCENES_STORE = 'scenes';
    const ASSETS_STORE = 'assets';

    let db; // Variable para mantener la conexión a la base de datos

    async function initDB() {
        db = await idb.openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(SCENES_STORE)) {
                    db.createObjectStore(SCENES_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(ASSETS_STORE)) {
                    db.createObjectStore(ASSETS_STORE, { keyPath: 'id' });
                }
            },
        });
    }

    initDB();

    // --- BROADCAST CHANNEL ---
    const openPlayerViewBtn = document.getElementById('openPlayerViewBtn');
    const channel = new BroadcastChannel('dnd_arsenal_channel');
    let playerViewWindow = null;

    // --- SELECTORES GENERALES ---
    const mapImageInput = document.getElementById('mapImageInput');
    const mapContainer = document.getElementById('mapContainer');
    const mapContentWrapper = document.getElementById('mapContentWrapper');
    const loadingState = document.querySelector('.loading-state');
    const mapImage = document.getElementById('mapImage');
    const tokensLayer = document.getElementById('tokensLayer');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const playerTurnTracker = document.getElementById('playerTurnTracker');

    // --- SELECTORES DE CANVAS ---
    const gridCanvas = document.getElementById('gridCanvas'), gridCtx = gridCanvas.getContext('2d');
    const wallsCanvas = document.getElementById('wallsCanvas'), wallsCtx = wallsCanvas.getContext('2d');
    const visionCanvas = document.getElementById('visionCanvas'), ctx = visionCanvas.getContext('2d');
    const aoeCanvas = document.getElementById('aoeCanvas'), aoeCtx = aoeCanvas.getContext('2d');
    const revealedBufferCanvas = document.createElement('canvas'),
        revealedBufferCtx = revealedBufferCanvas.getContext('2d', { willReadFrequently: true });

    // --- SELECTORES DE MODALES ---
    const saveStateBtn = document.getElementById('saveStateBtn');
    const loadStateBtn = document.getElementById('loadStateBtn');
    const saveSceneModal = document.getElementById('saveSceneModal');
    const sceneNameInput = document.getElementById('sceneNameInput');
    const confirmSaveSceneBtn = document.getElementById('confirmSaveSceneBtn');
    const cancelSaveSceneBtn = document.getElementById('cancelSaveSceneBtn');
    const savedScenesModal = document.getElementById('savedScenesModal');
    const closeSavedScenesBtn = document.getElementById('closeSavedScenesBtn');
    const sceneListContainer = document.getElementById('sceneListContainer');
    const doorNameModal = document.getElementById('doorNameModal');
    const doorNameInput = document.getElementById('doorNameInput');
    const confirmDoorNameBtn = document.getElementById('confirmDoorNameBtn');
    const cancelDoorNameBtn = document.getElementById('cancelDoorNameBtn');

    // --- SELECTORES PANEL DE CONTROL ---
    const gridToggle = document.getElementById('gridToggle');
    const gridColorInput = document.getElementById('gridColor');
    const gridOpacityInput = document.getElementById('gridOpacity');
    const cellSizeInput = document.getElementById('cellSize');
    const cellSizeSlider = document.getElementById('cellSizeSlider');
    const alignGridModeBtn = document.getElementById('alignGridModeBtn');
    const resetGridOffsetBtn = document.getElementById('resetGridOffsetBtn');
    const brushRevealCheckbox = document.getElementById('brushReveal');
    const brushHideCheckbox = document.getElementById('brushHide');
    const brushSizeInput = document.getElementById('brushSize');
    const drawTypeInputs = document.querySelectorAll('input[name="drawType"]');
    const toggleWallModeBtn = document.getElementById('toggleWallModeBtn');
    const undoWallBtn = document.getElementById('undoWallBtn');
    const clearWallsBtn = document.getElementById('clearWallsBtn');
    const doorListUl = document.getElementById('doorList');
    const noDoorsMessage = document.getElementById('noDoorsMessage');
    const toggleVisionBtn = document.getElementById('toggleVisionBtn');
    const resetFogBtn = document.getElementById('resetFogBtn');

    // --- SELECTORES FORMULARIO "AÑADIR FICHA" ---
    const addTokenBtn = document.getElementById('addTokenBtn');
    const add_tokenName = document.getElementById('tokenName');
    const add_tokenLetter = document.getElementById('tokenLetter');
    const add_tokenImageInput = document.getElementById('tokenImageInput');
    const add_tokenImagePreviewContainer = document.getElementById('addTokenImagePreviewContainer');
    const add_tokenImageName = document.getElementById('tokenImageName');
    const add_tokenHealth = document.getElementById('tokenHealth');
    const add_tokenNotes = document.getElementById('tokenNotes');
    const add_tokenColor = document.getElementById('tokenColor');
    const add_tokenBorderColor = document.getElementById('tokenBorderColor');
    const add_addBorderCheckbox = document.getElementById('addBorderCheckbox');
    const add_tokenVision = document.getElementById('tokenVision');
    const add_tokenSizeMultiplier = document.getElementById('tokenSizeMultiplier');

    // --- SELECTORES FORMULARIO "FICHA SELECCIONADA" ---
    const selectedTokenSection = document.getElementById('selectedTokenSection');
    const edit_tokenLetterPreview = document.getElementById('editTokenLetterPreview');
    const edit_tokenName = document.getElementById('editTokenName');
    const edit_tokenLetter = document.getElementById('editTokenLetter');
    const edit_tokenImageInput = document.getElementById('editTokenImageInput');
    const edit_tokenImagePreviewContainer = document.getElementById('editTokenImagePreviewContainer');
    const edit_tokenImagePreview = document.getElementById('editTokenImagePreview');
    const removeTokenImageBtn = document.getElementById('removeTokenImageBtn');
    const edit_tokenTurn = document.getElementById('editTokenTurn');
    const edit_tokenHealthMax = document.getElementById('editTokenHealthMax');
    const edit_tokenNotes = document.getElementById('editTokenNotes');
    const edit_tokenColor = document.getElementById('editTokenColor');
    const edit_tokenBorderColor = document.getElementById('editTokenBorderColor');
    const edit_tokenVision = document.getElementById('editTokenVision');
    const edit_tokenSizeMultiplier = document.getElementById('editTokenSizeMultiplier');
    const updateTokenBtn = document.getElementById('updateTokenBtn');
    const deselectTokenBtn = document.getElementById('deselectTokenBtn');

    // Controles de vida
    const healthDisplay = document.getElementById('healthDisplay');
    const healthDisplayContainer = document.getElementById('healthDisplayContainer');
    const healthModifierBtns = document.querySelectorAll('.health-modifier-btn');
    const healthModifierInput = document.getElementById('healthModifierInput');
    const damageSound = document.getElementById('damage-sound');
    const healSound = document.getElementById('heal-sound');

    // Controles de estado
    const tokenStatesEditor = document.getElementById('tokenStatesEditor');
    const newStateEmoji = document.getElementById('newStateEmoji');
    const newStateDesc = document.getElementById('newStateDesc');
    const addStateBtn = document.getElementById('addStateBtn');
    const editTokenStatesList = document.getElementById('editTokenStatesList');

    // Controles AoE
    const aoeHeader = document.getElementById('aoeHeader');
    const aoeControlsContainer = document.getElementById('aoeControlsContainer');
    const aoeShapeButtons = document.querySelectorAll('#aoeShapeSelector button');
    const aoeParamsContainer = document.getElementById('aoeParamsContainer');
    const aoeColorInput = document.getElementById('aoeColor');

    // --- SELECTORES MODAL HABILIDADES/INVENTARIO (NUEVO) ---
    const featureInventoryModal = document.getElementById('featureInventoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalNameInput = document.getElementById('modalNameInput');
    const modalDescriptionInput = document.getElementById('modalDescriptionInput');
    const confirmModalBtn = document.getElementById('confirmModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');

    // --- SELECTORES HABILIDADES/INVENTARIO (NUEVO) ---
    const addAbilityBtn = document.getElementById('addAbilityBtn');
    const addInventoryItemBtn = document.getElementById('addInventoryItemBtn');
    const editAbilitiesList = document.getElementById('editAbilitiesList');
    const editInventoryList = document.getElementById('editInventoryList');

    // Lista de fichas
    const tokenListUl = document.getElementById('tokenList');

    // --- VARIABLES DE ESTADO ---
    let tokens = [], walls = [], selectedTokenId = null, visionModeActive = false;
    let currentDraggedToken = null, isPaintingFog = false, isDrawingWallMode = false;
    let wallStartPoint = null, activeBrushMode = null, pendingDoor = null;
    let activeLoopingSound = null, activeAoeType = null;
    let isAligningGrid = false, gridOffsetX = 0, gridOffsetY = 0;
    let isPanning = false, panStartX, panStartY, scrollStartX, scrollStartY;
    let dragOffsetX, dragOffsetY, lastMouseX = 0, lastMouseY = 0;
    let currentModalContext = null; // 'ability' o 'inventory'


    let cellSize = parseFloat(cellSizeInput.value);
    let gridVisible = gridToggle.checked;
    let gridColor = gridColorInput.value;
    let gridOpacity = parseFloat(gridOpacityInput.value);
    let brushSize = parseInt(brushSizeInput.value);
    let drawType = 'wall';

    // --- ESTADO INICIAL ---
    mapContainer.classList.add('no-map');
    updateDoorList();

    // --- HELPERS HOJA DE PERSONAJE ---
    const calculateModifier = (score) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const updateCharStatUI = (prefix, stat) => {
        const scoreInput = document.getElementById(`${prefix}_${stat}_score`);
        const modDisplay = document.getElementById(`${prefix}_${stat}_mod`);
        const score = parseInt(scoreInput.value) || 10;
        modDisplay.textContent = calculateModifier(score);
        updateSavingThrowsUI(prefix);
    };

    const updateSavingThrowsUI = (prefix) => {
        const stats = ['str', 'dex', 'con', 'int', 'wis', 'car'];
        const profBonus = parseInt(document.getElementById(`${prefix}_proficiency_bonus`).value) || 0;

        stats.forEach(stat => {
            const score = parseInt(document.getElementById(`${prefix}_${stat}_score`).value) || 10;
            const baseMod = Math.floor((score - 10) / 2);
            const isProficient = document.getElementById(`${prefix}_${stat}_save_prof`).checked;
            const total = baseMod + (isProficient ? profBonus : 0);

            const totalDisplay = document.getElementById(`${prefix}_${stat}_save_total`);
            totalDisplay.textContent = total >= 0 ? `+${total}` : `${total}`;
        });
    };

    // --- EVENT LISTENERS ---
    document.querySelectorAll('.collapsible-header').forEach(header => header.addEventListener('click', () => header.parentElement.classList.toggle('active')));
    mapImageInput.addEventListener('change', handleImageUpload);
    addTokenBtn.addEventListener('click', addToken);
    updateTokenBtn.addEventListener('click', updateSelectedToken);
    deselectTokenBtn.addEventListener('click', deselectToken);
    toggleVisionBtn.addEventListener('click', toggleVisionMode);
    resetFogBtn.addEventListener('click', resetFog);
    toggleWallModeBtn.addEventListener('click', toggleWallMode);
    undoWallBtn.addEventListener('click', undoLastWall);
    clearWallsBtn.addEventListener('click', clearAllWalls);
    addStateBtn.addEventListener('click', addStateToSelectedToken);
    alignGridModeBtn.addEventListener('click', toggleAlignGridMode);
    resetGridOffsetBtn.addEventListener('click', resetGridOffset);
    saveStateBtn.addEventListener('click', () => {
        if (!mapImage.src || mapImage.src.endsWith('#')) {
            alert("Carga un mapa antes de guardar la escena.");
            return;
        }
        sceneNameInput.value = '';
        saveSceneModal.classList.add('open');
        sceneNameInput.focus();
    });
    loadStateBtn.addEventListener('click', () => {
        renderSavedScenesList();
        savedScenesModal.classList.add('open');
    });
    cancelSaveSceneBtn.addEventListener('click', () => saveSceneModal.classList.remove('open'));
    confirmSaveSceneBtn.addEventListener('click', saveCurrentScene);
    closeSavedScenesBtn.addEventListener('click', () => savedScenesModal.classList.remove('open'));
    confirmDoorNameBtn.addEventListener('click', createDoorFromModal);
    cancelDoorNameBtn.addEventListener('click', () => {
        doorNameModal.classList.remove('open');
        pendingDoor = null;
        drawWalls();
    });
    openPlayerViewBtn.addEventListener('click', () => {
        if (playerViewWindow && !playerViewWindow.closed) {
            playerViewWindow.focus();
            return;
        }
        playerViewWindow = window.open('player/player.html', '_blank', 'width=1280,height=720');
        setTimeout(() => {
            const initialState = {
                mapUrl: mapImage.src,
                fogUrl: revealedBufferCanvas.toDataURL(),
                tokens: tokens,
                cellSize: cellSize,
                gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize }
            };
            broadcastState('INIT_SCENE', initialState);
        }, 1000);
    });

    // --- LISTENERS MODAL HABILIDADES/INVENTARIO (NUEVO) ---
    addAbilityBtn.addEventListener('click', () => openFeatureModal('ability'));
    addInventoryItemBtn.addEventListener('click', () => openFeatureModal('inventory'));
    cancelModalBtn.addEventListener('click', () => featureInventoryModal.classList.remove('open'));
    confirmModalBtn.addEventListener('click', saveFeatureOrItem);

    // Listeners de inputs
    gridToggle.addEventListener('change', e => { gridVisible = e.target.checked; drawGrid(); broadcastGridSettings(); });
    gridColorInput.addEventListener('input', e => { gridColor = e.target.value; drawGrid(); broadcastGridSettings(); });
    gridOpacityInput.addEventListener('input', e => { gridOpacity = parseFloat(e.target.value); drawGrid(); broadcastGridSettings(); });
    brushSizeInput.addEventListener('input', e => brushSize = parseInt(e.target.value));
    drawTypeInputs.forEach(input => input.addEventListener('change', e => drawType = e.target.value));
    cellSizeSlider.addEventListener('input', () => { cellSizeInput.value = cellSizeSlider.value; updateCellSize(); });
    cellSizeInput.addEventListener('input', () => {
        const val = parseFloat(cellSizeInput.value) || 10;
        cellSizeSlider.value = val;
        updateCellSize();
    });
    add_tokenImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        add_tokenImagePreviewContainer.innerHTML = '';
        if (file) {
            add_tokenImagePreviewContainer.style.display = 'block';
            add_tokenImageName.style.display = 'none';
            const image = document.createElement('img');
            image.src = URL.createObjectURL(file);
            image.alt = 'Previsualización de ficha';
            image.onload = () => URL.revokeObjectURL(image.src);
            add_tokenImagePreviewContainer.appendChild(image);
        } else {
            add_tokenImagePreviewContainer.style.display = 'none';
            add_tokenImageName.style.display = 'block';
            add_tokenImageName.textContent = 'Ningún archivo...';
        }
    });
    edit_tokenImageInput.addEventListener('change', handleEditTokenImageChange);
    removeTokenImageBtn.addEventListener('click', removeEditTokenImage);
    healthModifierBtns.forEach(btn => btn.addEventListener('click', () => applyHealthChange(parseInt(btn.dataset.amount))));
    healthModifierInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const amount = parseInt(healthModifierInput.value);
            if (!isNaN(amount)) {
                applyHealthChange(amount);
                healthModifierInput.value = '';
            }
        }
    });
    edit_tokenHealthMax.addEventListener('change', () => {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;
        const newMax = parseInt(edit_tokenHealthMax.value) || 0;
        token.stats.health.max = newMax;
        if (token.stats.health.current > newMax) {
            token.stats.health.current = newMax;
            healthDisplay.textContent = token.stats.health.current;
        }
        healthDisplay.className = `health-display ${getHealthColorClass(token.stats.health.current, token.stats.health.max)}`;
        updateTokenList();
        updatePlayerTurnTracker();
    });
    brushRevealCheckbox.addEventListener('change', handleBrushModeChange);
    brushHideCheckbox.addEventListener('change', handleBrushModeChange);
    aoeShapeButtons.forEach(button => button.addEventListener('click', () => toggleAoe(button.dataset.shape)));
    aoeParamsContainer.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            if (activeAoeType) {
                const fakeEvent = new MouseEvent('mousemove', { clientX: lastMouseX, clientY: lastMouseY });
                handleLayerMouseMove(fakeEvent);
            }
        });
    });

    // Listeners para hojas de personaje (ADD)
    ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
        document.getElementById(`add_${stat}_score`).addEventListener('input', () => updateCharStatUI('add', stat));
        document.getElementById(`add_${stat}_save_prof`).addEventListener('change', () => updateSavingThrowsUI('add'));
    });
    document.getElementById('add_proficiency_bonus').addEventListener('input', () => updateSavingThrowsUI('add'));

    // Listeners para hojas de personaje (EDIT)
    ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
        document.getElementById(`edit_${stat}_score`).addEventListener('input', () => { updateCharStatUI('edit', stat); updateSelectedToken(); });
        document.getElementById(`edit_${stat}_save_prof`).addEventListener('change', () => { updateSavingThrowsUI('edit'); updateSelectedToken(); });
    });
    document.getElementById('edit_proficiency_bonus').addEventListener('input', () => { updateSavingThrowsUI('edit'); updateSelectedToken(); });
    document.getElementById('edit_armor_class').addEventListener('input', () => updateSelectedToken());
    document.getElementById('edit_speed').addEventListener('input', () => updateSelectedToken());

    // Listeners de ratón y teclado
    mapContainer.addEventListener('mousedown', handleLayerMouseDown);
    document.addEventListener('mousemove', handleLayerMouseMove);
    document.addEventListener('mouseup', handleLayerMouseUp);
    mapContainer.addEventListener('click', handleLayerClick);
    doorNameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); confirmDoorNameBtn.click(); } });
    sceneNameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); confirmSaveSceneBtn.click(); } });

    // Listeners de sonido
    document.querySelectorAll('.sound-btn').forEach(button => {
        button.addEventListener('click', () => {
            const soundId = button.dataset.soundId;
            const audio = document.getElementById(soundId);
            if (!audio) return;

            if (audio.loop) {
                if (activeLoopingSound === audio) {
                    audio.pause();
                    audio.currentTime = 0;
                    activeLoopingSound = null;
                    button.classList.remove('active');
                } else {
                    if (activeLoopingSound) {
                        activeLoopingSound.pause();
                        activeLoopingSound.currentTime = 0;
                        document.querySelector('.sound-btn.active')?.classList.remove('active');
                    }
                    audio.play();
                    activeLoopingSound = audio;
                    button.classList.add('active');
                }
            } else {
                audio.currentTime = 0;
                audio.play();
            }
        });
    });


    // --- GESTIÓN DE ESCENAS ---
    function getSavedScenes() { return JSON.parse(localStorage.getItem('dndArsenalSavedScenes')) || []; }

    async function saveCurrentScene() {
        const sceneName = sceneNameInput.value.trim();
        if (!sceneName) {
            alert("Por favor, introduce un nombre para la escena.");
            return;
        }

        const sceneId = Date.now();
        const tx = db.transaction([ASSETS_STORE], 'readwrite');
        const assetStore = tx.objectStore(ASSETS_STORE);

        try {
            const mapAssetId = `map_${sceneId}`;
            await assetStore.put({ id: mapAssetId, data: mapImage.src });

            const fogAssetId = `fog_${sceneId}`;
            await assetStore.put({ id: fogAssetId, data: revealedBufferCanvas.toDataURL() });

            const tokenPromises = tokens.map(async (t, index) => {
                let imageAssetId = null;
                if (t.identity.image) {
                    imageAssetId = `token_${sceneId}_${index}`;
                    await assetStore.put({ id: imageAssetId, data: t.identity.image });
                }
                const cleanToken = JSON.parse(JSON.stringify(t)); // Deep copy
                delete cleanToken.element; // Remove DOM element
                if (cleanToken.identity.image) cleanToken.identity.imageAssetId = imageAssetId; // Store ref
                delete cleanToken.identity.image; // Don't store base64 in metadata
                return cleanToken;
            });

            const tokenMetadata = await Promise.all(tokenPromises);
            await tx.done;

            const sceneMetadata = {
                id: sceneId, name: sceneName, date: new Date().toISOString(),
                mapAssetId: mapAssetId, fogAssetId: fogAssetId, cellSize: cellSize,
                tokens: tokenMetadata, walls: walls,
                gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY }
            };

            const scenes = getSavedScenes();
            scenes.push(sceneMetadata);
            localStorage.setItem('dndArsenalSavedScenes', JSON.stringify(scenes));

            saveSceneModal.classList.remove('open');
            alert(`¡Escena "${sceneName}" guardada!`);

        } catch (error) {
            console.error('Error al guardar la escena:', error);
            tx.abort();
            alert('Hubo un error al guardar la escena. Revisa la consola para más detalles.');
        }
    }

    async function renderSavedScenesList() {
        const scenes = getSavedScenes();
        sceneListContainer.innerHTML = '';

        if (scenes.length === 0) {
            sceneListContainer.innerHTML = `
            <div id="no-scenes-message">
                <div class="icon icon-map-large"></div>
                <h3>No hay mapas guardados</h3>
                <p>Aún no has guardado ninguna escena. Crea una y guárdala para poder cargarla más tarde.</p>
            </div>`;
            return;
        }

        scenes.sort((a, b) => new Date(b.date) - new Date(a.date));

        const validMapKeys = scenes.map(scene => scene.mapAssetId).filter(key => key);
        const mapAssets = new Map();
        if (validMapKeys.length > 0) {
            const tx = db.transaction(ASSETS_STORE, 'readonly');
            const store = tx.objectStore(ASSETS_STORE);
            const assets = await Promise.all(validMapKeys.map(key => store.get(key)));
            assets.forEach(asset => { if (asset) mapAssets.set(asset.id, asset.data); });
        }

        scenes.forEach((scene) => {
            const mapSrc = mapAssets.get(scene.mapAssetId) || '';
            const formattedDate = new Date(scene.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const tokenCount = scene.tokens.length;
            const wallCount = scene.walls.filter(w => w.type === 'wall').length;
            const doorCount = scene.walls.filter(w => w.type === 'door').length;
            const card = document.createElement('div');
            card.className = 'scene-card';
            card.dataset.sceneId = scene.id;

            card.innerHTML = `
            <div class="scene-card-image-container">
                <img src="${mapSrc}" alt="Vista previa de ${scene.name}" class="scene-card-image">
                <div class="scene-card-info-overlay">
                    <h3 class="scene-card-name">${scene.name}</h3>
                    <p class="scene-card-date">Guardado: ${formattedDate}</p>
                </div>
                <button class="delete-scene-btn" data-scene-id="${scene.id}" title="Eliminar Escena">×</button>
            </div>
            <div class="scene-card-body">
                <div class="scene-card-stats">
                    <div class="scene-card-stat-item"><span class="scene-card-stat-icon icon-stat-token"></span><span>${tokenCount} Fichas</span></div>
                    <div class="scene-card-stat-item"><span class="scene-card-stat-icon icon-stat-wall"></span><span>${wallCount} Muros</span></div>
                    <div class="scene-card-stat-item"><span class="scene-card-stat-icon icon-stat-door"></span><span>${doorCount} Puertas</span></div>
                </div>
            </div>`;
            sceneListContainer.appendChild(card);
        });

        sceneListContainer.querySelectorAll('.scene-card').forEach(card => card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-scene-btn')) loadSceneById(card.dataset.sceneId);
        }));
        sceneListContainer.querySelectorAll('.delete-scene-btn').forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSceneById(btn.dataset.sceneId);
        }));
    }

    async function loadSceneById(sceneId) {
        const scenes = getSavedScenes();
        const sceneMetadata = scenes.find(s => s.id == sceneId);
        if (!sceneMetadata) { alert("Error: No se encontró la escena seleccionada."); return; }

        try {
            const tx = db.transaction([ASSETS_STORE], 'readonly');
            const assetStore = tx.objectStore(ASSETS_STORE);
            const mapAsset = await assetStore.get(sceneMetadata.mapAssetId);
            const fogAsset = await assetStore.get(sceneMetadata.fogAssetId);

            await new Promise((resolve) => {
                mapImage.onload = resolve;
                mapImage.src = mapAsset.data;
                if (mapImage.complete) resolve();
            });

            restoreSceneFromState(sceneMetadata, fogAsset.data);

            const tokenAssetPromises = sceneMetadata.tokens.map(tokenMeta => {
                if (tokenMeta.identity && tokenMeta.identity.imageAssetId) return assetStore.get(tokenMeta.identity.imageAssetId);
                else if (tokenMeta.imageAssetId) return assetStore.get(tokenMeta.imageAssetId); // Fallback
                return Promise.resolve(null);
            });

            const tokenAssets = await Promise.all(tokenAssetPromises);

            tokens.forEach((token, index) => {
                const asset = tokenAssets[index];
                if (asset) token.identity.image = asset.data;
            });

            tokens.forEach(updateTokenElementStyle);
            updateTokenList();
            updatePlayerTurnTracker();
            selectToken(selectedTokenId);

        } catch (error) {
            console.error('Error al cargar la escena:', error);
            alert('Hubo un error al cargar los datos de la escena. Revisa la consola.');
        }
        setTimeout(() => {
            broadcastState('INIT_SCENE', {
                mapUrl: mapImage.src, fogUrl: revealedBufferCanvas.toDataURL(), tokens: tokens,
                cellSize: cellSize, gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize }
            });
        }, 500);
    }

    async function deleteSceneById(sceneId) {
        if (!confirm("¿Estás seguro de que quieres eliminar esta escena? Esta acción no se puede deshacer.")) return;

        let scenes = getSavedScenes();
        const sceneToDelete = scenes.find(s => s.id == sceneId);
        if (sceneToDelete) {
            try {
                const tx = db.transaction(ASSETS_STORE, 'readwrite');
                const assetStore = tx.objectStore(ASSETS_STORE);
                const deletePromises = [];
                if (sceneToDelete.mapAssetId) deletePromises.push(assetStore.delete(sceneToDelete.mapAssetId));
                if (sceneToDelete.fogAssetId) deletePromises.push(assetStore.delete(sceneToDelete.fogAssetId));
                sceneToDelete.tokens.forEach(token => {
                    if (token.identity && token.identity.imageAssetId) deletePromises.push(assetStore.delete(token.identity.imageAssetId));
                    else if (token.imageAssetId) deletePromises.push(assetStore.delete(token.imageAssetId)); // Fallback
                });
                await Promise.all(deletePromises);
                await tx.done;

                scenes = scenes.filter(s => s.id != sceneId);
                localStorage.setItem('dndArsenalSavedScenes', JSON.stringify(scenes));
                renderSavedScenesList();
            } catch (error) {
                console.error("Error al eliminar los assets de la escena:", error);
                alert("Hubo un problema al limpiar los datos de la escena eliminada.");
            }
        }
    }

    function restoreSceneFromState(state, fogDataUrl) {
        showMapArea();
        removeAllTokens();
        if (activeLoopingSound) {
            activeLoopingSound.pause();
            activeLoopingSound.currentTime = 0;
            document.querySelector('.sound-btn.active')?.classList.remove('active');
            activeLoopingSound = null;
        }

        resizeAllCanvas();
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
            gridOffsetX = state.gridSettings.offsetX || 0;
            gridOffsetY = state.gridSettings.offsetY || 0;
        } else {
            gridOffsetX = 0;
            gridOffsetY = 0;
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
        fogImg.src = fogDataUrl;

        state.tokens.forEach(tokenData => {
            const migratedTokenData = migrateTokenData(tokenData);
            const tokenToCreate = { ...migratedTokenData };
            if (tokenToCreate.identity) tokenToCreate.identity.image = null;
            recreateToken(tokenToCreate);
        });

        updateTokenList();
        savedScenesModal.classList.remove('open');
        mapImageInput.closest('.collapsible').classList.remove('active');
        updatePlayerTurnTracker();
    }

    function migrateTokenData(oldToken) {
        if (oldToken.stats && oldToken.stats.characteristics && oldToken.info && oldToken.info.abilities) {
            return oldToken; // Ya tiene la estructura nueva y completa.
        }

        console.log(`Migrando token antiguo: ${oldToken.name || oldToken.identity?.name}`);

        // Obtenemos el objeto 'info' existente o creamos uno vacío
        const existingInfo = oldToken.info || {};

        const newStructure = {
            id: oldToken.id,
            isDiscovered: oldToken.isDiscovered,
            identity: oldToken.identity || {
                name: oldToken.name,
                type: oldToken.type,
                letter: oldToken.letter,
                image: null,
                imageAssetId: oldToken.imageAssetId
            },
            position: oldToken.position || {
                x: oldToken.x,
                y: oldToken.y,
                sizeMultiplier: oldToken.sizeMultiplier || 1
            },
            stats: {
                initiative: oldToken.stats?.initiative ?? oldToken.turn ?? 0,
                vision: { radius: oldToken.stats?.vision?.radius ?? oldToken.visionRadius ?? 0 },
                health: { current: oldToken.stats?.health?.current ?? oldToken.health_current, max: oldToken.stats?.health?.max ?? oldToken.health_max },
                proficiencyBonus: oldToken.stats?.proficiencyBonus ?? 2,
                initiativeMod: oldToken.stats?.initiativeMod ?? 0,
                speed: oldToken.stats?.speed ?? 30,
                armorClass: oldToken.stats?.armorClass ?? 10,
                characteristics: oldToken.stats?.characteristics || {
                    str: { score: 10, proficient: false }, dex: { score: 10, proficient: false },
                    con: { score: 10, proficient: false }, int: { score: 10, proficient: false },
                    wis: { score: 10, proficient: false }, car: { score: 10, proficient: false }
                }
            },
            appearance: oldToken.appearance || {
                color: oldToken.color,
                borderColor: oldToken.borderColor
            },
            // === LA CORRECCIÓN ESTÁ AQUÍ ===
            info: {
                notes: existingInfo.notes || oldToken.notes || '',
                states: existingInfo.states || oldToken.states || [],
                // Nos aseguramos de que abilities e inventory existan,
                // manteniendo los datos si ya estaban, o creando un array vacío si no.
                abilities: existingInfo.abilities || [],
                inventory: existingInfo.inventory || []
            }
        };
        return newStructure;
    }


    // --- GESTIÓN DEL MAPA ---
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
        [gridCanvas, wallsCanvas, visionCanvas, revealedBufferCanvas, aoeCanvas].forEach(c => { c.width = w; c.height = h; });
        if (visionModeActive) drawVision();
        drawGrid();
        drawWalls();
    }

    async function processImage(file) {
        if (file.type === 'image/gif') return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        const MAX_WIDTH = 256;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let { width, height } = img;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- GESTIÓN DE FICHAS ---
    async function addToken() {
        const letter = add_tokenLetter.value.trim();
        const name = add_tokenName.value.trim();
        const vision = parseInt(add_tokenVision.value);
        if (!letter || !name || isNaN(vision)) { alert("Por favor, rellena los campos obligatorios (*): Nombre, Letra y Visión."); return; }

        let imageBase64 = null;
        if (add_tokenImageInput.files[0]) imageBase64 = await processImage(add_tokenImageInput.files[0]);

        const characteristics = {};
        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            characteristics[stat] = {
                score: parseInt(document.getElementById(`add_${stat}_score`).value) || 10,
                proficient: document.getElementById(`add_${stat}_save_prof`).checked
            };
        });

        const tokenData = {
            id: Date.now(),
            isDiscovered: document.querySelector('input[name="add_tokenType"]:checked').value === 'player',
            identity: {
                name, type: document.querySelector('input[name="add_tokenType"]:checked').value,
                letter, image: imageBase64
            },
            position: { x: 20, y: 20, size: 0, sizeMultiplier: parseFloat(add_tokenSizeMultiplier.value) || 1 },
            stats: {
                initiative: 0, vision: { radius: vision },
                health: { current: parseInt(add_tokenHealth.value) || 0, max: parseInt(add_tokenHealth.value) || 0 },
                proficiencyBonus: parseInt(document.getElementById('add_proficiency_bonus').value) || 0,
                speed: parseInt(document.getElementById('add_speed').value) || 0,
                armorClass: parseInt(document.getElementById('add_armor_class').value) || 0,
                characteristics
            },
            appearance: {
                color: add_tokenColor.value,
                borderColor: add_addBorderCheckbox.checked ? add_tokenBorderColor.value : null,
            },
            info: {
                notes: add_tokenNotes.value,
                states: [],
                abilities: [],
                inventory: []
            }
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
        add_tokenHealth.value = '';
        add_tokenNotes.value = '';
        document.getElementById('add_typePlayer').checked = true;
        add_tokenColor.value = '#4a90e2';
        add_tokenBorderColor.value = '#000000';
        add_addBorderCheckbox.checked = false;
        add_tokenVision.value = '12';

        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            document.getElementById(`add_${stat}_score`).value = 10;
            document.getElementById(`add_${stat}_save_prof`).checked = false;
        });
        document.getElementById('add_proficiency_bonus').value = 2;
        document.getElementById('add_initiative_mod').value = 0; // Este campo no existe ya en la UI
        document.getElementById('add_speed').value = 30;
        document.getElementById('add_armor_class').value = 10;
        updateSavingThrowsUI('add');

        add_tokenName.focus();
    }

    function recreateToken(tokenData) {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token';
        tokenElement.dataset.id = tokenData.id;
        tokenData.position.sizeMultiplier = tokenData.position.sizeMultiplier || 1;
        tokenData.position.size = tokenData.position.sizeMultiplier * cellSize;
        tokenData.element = tokenElement;
        tokens.push(tokenData);
        updateTokenElementStyle(tokenData);
        tokensLayer.appendChild(tokenElement);
    }

    function updateTokenElementStyle(token) {
        const el = token.element;
        el.style.left = `${token.position.x}px`;
        el.style.top = `${token.position.y}px`;
        el.style.width = `${token.position.size}px`;
        el.style.height = `${token.position.size}px`;
        el.style.lineHeight = `${token.position.size}px`;
        el.style.backgroundColor = token.appearance.color;
        el.style.border = token.appearance.borderColor ? `3px solid ${token.appearance.borderColor}` : 'none';

        if (token.identity.image) {
            el.classList.add('has-image');
            el.style.backgroundImage = `url(${token.identity.image})`;
            el.textContent = '';
        } else {
            el.classList.remove('has-image');
            el.style.backgroundImage = 'none';
            el.textContent = token.identity.letter;
        }

        if (visionModeActive && token.identity.type === 'enemy') {
            el.classList.toggle('hidden-enemy', !token.isDiscovered);
        } else {
            el.classList.remove('hidden-enemy');
        }
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
        tokenListUl.innerHTML = '';
        if (tokens.length === 0) {
            tokenListUl.innerHTML = `<p class="no-tokens-message">Aún no hay fichas en el tablero. ¡Añade una para empezar!</p>`;
            return;
        }

        const sortedTokens = [...tokens].sort((a, b) => (b.stats.initiative || 0) - (a.stats.initiative || 0));

        sortedTokens.forEach(token => {
            const li = document.createElement('li');
            li.dataset.id = token.id;
            const typeIconHTML = `<span class="token-list-icon ${token.identity.type === 'player' ? 'icon-player-list' : 'icon-enemy-list'}"></span>`;
            const borderStyle = token.appearance.borderColor ? `border: 3px solid ${token.appearance.borderColor};` : 'none';
            const imageStyle = token.identity.image ? `background-image: url(${token.identity.image}); background-size: cover; background-position: center;` : `background-color: ${token.appearance.color};`;
            const previewContent = token.identity.image ? '' : token.identity.letter;

            li.innerHTML = `
            <div class="token-list-preview" style="${imageStyle} ${borderStyle}">${previewContent}</div>
            <div class="token-list-header">${typeIconHTML}<span>${token.identity.name}</span></div>
            <div class="token-list-details">
                <span>Iniciativa: ${token.stats.initiative || 0}</span>
                <span>♥️ Vida: ${token.stats.health.current}/${token.stats.health.max}</span>
                <span>👁️ Vis: ${token.stats.vision.radius}</span>
            </div>
            <button class="delete-token-btn" data-id="${token.id}" title="Eliminar Ficha">X</button>
        `;
            tokenListUl.appendChild(li);
        });

        tokenListUl.querySelectorAll('.delete-token-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); deleteToken(parseInt(e.target.dataset.id)); }));
        tokenListUl.querySelectorAll('li').forEach(li => li.addEventListener('click', e => selectToken(parseInt(e.currentTarget.dataset.id))));
    }

    function selectToken(tokenId) {
        if (selectedTokenId === tokenId) return;
        deselectToken();
        selectedTokenId = tokenId;
        const token = tokens.find(t => t.id === tokenId);
        if (!token) { tokenStatesEditor.style.display = 'none'; return; }

        const listItem = tokenListUl.querySelector(`li[data-id="${tokenId}"]`);
        if (listItem) listItem.classList.add('selected-in-list');
        const trackerCard = playerTurnTracker.querySelector(`.player-token-card[data-id="${tokenId}"]`);
        if (trackerCard) trackerCard.classList.add('selected-in-tracker');

        aoeHeader.style.display = 'block';
        aoeControlsContainer.style.display = 'block';
        tokenStatesEditor.style.display = 'block';
        renderTokenStatesEditor(token);
        token.element.classList.add('selected');
        selectedTokenSection.classList.add('has-selection', 'active');

        if (token.identity.image) {
            edit_tokenImagePreview.src = token.identity.image;
            edit_tokenImagePreview.style.display = 'block';
            edit_tokenLetterPreview.style.display = 'none';
            removeTokenImageBtn.style.display = 'block';
        } else {
            edit_tokenImagePreview.style.display = 'none';
            edit_tokenLetterPreview.style.display = 'flex';
            removeTokenImageBtn.style.display = 'none';
            edit_tokenLetterPreview.textContent = token.identity.letter;
            edit_tokenLetterPreview.style.backgroundColor = token.appearance.color;
        }

        edit_tokenName.value = token.identity.name;
        edit_tokenLetter.value = token.identity.letter;
        edit_tokenTurn.value = token.stats.initiative || 0;
        edit_tokenVision.value = token.stats.vision.radius;
        edit_tokenHealthMax.value = token.stats.health.max;
        edit_tokenColor.value = token.appearance.color;
        edit_tokenBorderColor.value = token.appearance.borderColor || '#000000';
        edit_tokenNotes.value = token.info.notes;
        edit_tokenSizeMultiplier.value = token.position.sizeMultiplier || 1;

        document.getElementById('edit_proficiency_bonus').value = token.stats.proficiencyBonus;
        document.getElementById('edit_speed').value = token.stats.speed;
        document.getElementById('edit_armor_class').value = token.stats.armorClass;

        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            document.getElementById(`edit_${stat}_score`).value = token.stats.characteristics[stat].score;
            document.getElementById(`edit_${stat}_save_prof`).checked = token.stats.characteristics[stat].proficient;
            updateCharStatUI('edit', stat);
        });

        healthDisplay.textContent = token.stats.health.current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.stats.health.current, token.stats.health.max)}`;
        renderAbilitiesList(token);
        renderInventoryList(token);

    }

    function deselectToken() {
        if (!selectedTokenId) return;
        const oldToken = tokens.find(t => t.id === selectedTokenId);
        if (oldToken) oldToken.element.classList.remove('selected');
        const oldListItem = tokenListUl.querySelector(`li[data-id="${selectedTokenId}"]`);
        if (oldListItem) oldListItem.classList.remove('selected-in-list');
        const oldTrackerCard = playerTurnTracker.querySelector(`.player-token-card[data-id="${selectedTokenId}"]`);
        if (oldTrackerCard) oldTrackerCard.classList.remove('selected-in-tracker');
        aoeHeader.style.display = 'none';
        aoeControlsContainer.style.display = 'none';
        if (activeAoeType) toggleAoe(activeAoeType);
        selectedTokenId = null;
        selectedTokenSection.classList.remove('has-selection');
        tokenStatesEditor.style.display = 'none';
        editAbilitiesList.innerHTML = '';
        editInventoryList.innerHTML = '';
    }

    async function handleEditTokenImageChange(event) {
        if (!selectedTokenId) return;
        const file = event.target.files[0];
        if (file) {
            const token = tokens.find(t => t.id === selectedTokenId);
            token.identity.image = await processImage(file);
            updateTokenElementStyle(token);
            updateTokenList();
            updatePlayerTurnTracker();
            selectToken(token.id);
        }
    }

    function removeEditTokenImage() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        token.identity.image = null;
        updateTokenElementStyle(token);
        updateTokenList();
        updatePlayerTurnTracker();
        selectToken(token.id);
    }

    function updateSelectedToken() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        token.identity.name = edit_tokenName.value.trim();
        token.identity.letter = edit_tokenLetter.value.trim();
        if (!token.identity.name || !token.identity.letter) { alert("El nombre y la letra no pueden estar vacíos."); return; }

        token.stats.initiative = parseInt(edit_tokenTurn.value) || 0;
        token.stats.vision.radius = parseInt(edit_tokenVision.value) || 0;
        token.stats.health.max = parseInt(edit_tokenHealthMax.value) || 0;
        token.stats.proficiencyBonus = parseInt(document.getElementById('edit_proficiency_bonus').value) || 0;
        token.stats.speed = parseInt(document.getElementById('edit_speed').value) || 0;
        token.stats.armorClass = parseInt(document.getElementById('edit_armor_class').value) || 0;

        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            token.stats.characteristics[stat].score = parseInt(document.getElementById(`edit_${stat}_score`).value) || 10;
            token.stats.characteristics[stat].proficient = document.getElementById(`edit_${stat}_save_prof`).checked;
        });

        token.appearance.color = edit_tokenColor.value;
        token.appearance.borderColor = edit_tokenBorderColor.value;
        token.info.notes = edit_tokenNotes.value;

        const newSizeMultiplier = parseFloat(edit_tokenSizeMultiplier.value) || 1;
        if (token.position.sizeMultiplier !== newSizeMultiplier) {
            token.position.sizeMultiplier = newSizeMultiplier;
            token.position.size = token.position.sizeMultiplier * cellSize;
        }

        if (token.stats.health.current > token.stats.health.max) token.stats.health.current = token.stats.health.max;

        updateTokenElementStyle(token);
        updateTokenList();

        if (!token.identity.image) {
            edit_tokenLetterPreview.textContent = token.identity.letter;
            edit_tokenLetterPreview.style.backgroundColor = token.appearance.color;
        }
        healthDisplay.textContent = token.stats.health.current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.stats.health.current, token.stats.health.max)}`;
        updatePlayerTurnTracker();
        broadcastState('STATE_UPDATE', { tokens, cellSize, gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize } });
    }

    // --- LÓGICA DE VIDA Y DAÑO ---
    function getHealthColorClass(current, max) {
        if (max === 0) return 'health-mid';
        const percentage = (current / max) * 100;
        if (percentage <= 10) return 'health-critical';
        if (percentage <= 40) return 'health-low';
        if (percentage <= 70) return 'health-mid';
        return 'health-high';
    }

    function applyHealthChange(amount) {
        if (!selectedTokenId || isNaN(amount)) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        const oldHealth = token.stats.health.current;
        let newHealth = oldHealth + amount;
        newHealth = Math.max(0, Math.min(token.stats.health.max, newHealth));
        const actualChange = newHealth - oldHealth;
        token.stats.health.current = newHealth;

        healthDisplay.textContent = token.stats.health.current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.stats.health.current, token.stats.health.max)}`;
        updateTokenList();
        updatePlayerTurnTracker();

        const trackerCard = playerTurnTracker.querySelector(`.player-token-card[data-id="${token.id}"]`);
        showDamageFloat(actualChange, token, trackerCard);

        const tokenElement = token.element;
        const animationClass = actualChange < 0 ? 'damaged' : 'healed';
        const sound = actualChange < 0 ? damageSound : healSound;
        const timeout = actualChange < 0 ? 400 : 500;

        if (actualChange !== 0) {
            sound.currentTime = 0;
            sound.play();
            tokenElement.classList.add(`token-${animationClass}`);
            if (trackerCard) trackerCard.classList.add(`card-${animationClass}`);
            setTimeout(() => {
                tokenElement.classList.remove(`token-${animationClass}`);
                if (trackerCard) trackerCard.classList.remove(`card-${animationClass}`);
            }, timeout);
        }

        broadcastState('STATE_UPDATE', { tokens, cellSize, gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize } });
    }

    function showDamageFloat(amount, token, trackerCard) {
        if (amount === 0) return;
        const text = `${amount > 0 ? '+' : ''}${amount}`;
        const typeClass = amount > 0 ? 'heal' : 'damage';

        const panelFloat = document.createElement('div');
        panelFloat.className = `damage-float ${typeClass}`;
        panelFloat.textContent = text;
        healthDisplayContainer.appendChild(panelFloat);
        setTimeout(() => panelFloat.remove(), 1000);

        const mapFloat = document.createElement('div');
        mapFloat.className = `damage-float ${typeClass}`;
        mapFloat.textContent = text;
        mapFloat.style.left = `${token.position.x + token.position.size / 2}px`;
        mapFloat.style.top = `${token.position.y}px`;
        tokensLayer.appendChild(mapFloat);
        setTimeout(() => mapFloat.remove(), 1000);

        if (trackerCard) {
            const trackerFloat = document.createElement('div');
            trackerFloat.className = `damage-float ${typeClass}`;
            trackerFloat.textContent = text;
            const cardRect = trackerCard.getBoundingClientRect();
            trackerFloat.style.position = 'fixed';
            trackerFloat.style.left = `${cardRect.left + (cardRect.width / 2)}px`;
            trackerFloat.style.top = `${cardRect.top}px`;
            document.body.appendChild(trackerFloat);
            setTimeout(() => trackerFloat.remove(), 1000);
        }
    }


    // --- MANEJO DE RATÓN ---
    function handleLayerMouseDown(event) {
        const tokenElement = event.target.closest('.token');
        if (tokenElement) {
            const tokenId = parseInt(tokenElement.dataset.id);
            const token = tokens.find(t => t.id === tokenId);
            if (token && (token.identity.type === 'player' || !visionModeActive || token.isDiscovered)) {
                currentDraggedToken = token;
                const tokenRect = token.element.getBoundingClientRect();
                dragOffsetX = event.clientX - tokenRect.left;
                dragOffsetY = event.clientY - tokenRect.top;
                currentDraggedToken.element.style.zIndex = 100;
            }
            return;
        }

        if (isDrawingWallMode) { handleWallDrawing(event); return; }
        if (visionModeActive && activeBrushMode && (event.buttons === 1 || event.type === 'mousedown')) { isPaintingFog = true; paintFog(event); return; }

        event.preventDefault();
        isPanning = true;
        panStartX = event.clientX;
        panStartY = event.clientY;
        scrollStartX = mapContainer.scrollLeft;
        scrollStartY = mapContainer.scrollTop;
        mapContainer.classList.add('panning');
    }

    function handleLayerMouseMove(event) {
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        if (isPanning) {
            const dx = event.clientX - panStartX;
            const dy = event.clientY - panStartY;
            mapContainer.scrollLeft = scrollStartX - dx;
            mapContainer.scrollTop = scrollStartY - dy;
            return;
        }
        if (activeAoeType && selectedTokenId) { drawAoePreview(event); }
        if (isDrawingWallMode && wallStartPoint) {
            drawWalls();
            const mapRect = mapContainer.getBoundingClientRect();
            const endX = event.clientX - mapRect.left + mapContainer.scrollLeft;
            const endY = event.clientY - mapRect.top + mapContainer.scrollTop;
            wallsCtx.beginPath();
            wallsCtx.moveTo(wallStartPoint.x, wallStartPoint.y);
            const previewDrawType = document.querySelector('input[name="drawType"]:checked').value;
            wallsCtx.setLineDash(previewDrawType === 'door' ? [10, 8] : []);
            wallsCtx.strokeStyle = previewDrawType === 'door' ? '#87CEEB' : 'cyan';
            wallsCtx.lineWidth = 3;
            wallsCtx.lineTo(endX, endY);
            wallsCtx.stroke();
            wallsCtx.setLineDash([]);
        } else if (currentDraggedToken) {
            const mapRect = mapContainer.getBoundingClientRect();
            let newX = event.clientX - mapRect.left + mapContainer.scrollLeft - dragOffsetX;
            let newY = event.clientY - mapRect.top + mapContainer.scrollTop - dragOffsetY;
            const tokenSize = currentDraggedToken.position.size;
            newX = Math.max(0, Math.min(newX, mapContentWrapper.offsetWidth - tokenSize));
            newY = Math.max(0, Math.min(newY, mapContentWrapper.offsetHeight - tokenSize));
            currentDraggedToken.position.x = newX;
            currentDraggedToken.position.y = newY;
            currentDraggedToken.element.style.left = `${newX}px`;
            currentDraggedToken.element.style.top = `${newY}px`;
            if (visionModeActive) drawVision();
            broadcastState('STATE_UPDATE', { tokens, cellSize, fogUrl: visionModeActive ? revealedBufferCanvas.toDataURL() : null });
        } else if (isPaintingFog) {
            paintFog(event);
        }
    }

    function handleLayerMouseUp(event) {
        if (isPanning) { isPanning = false; mapContainer.classList.remove('panning'); }
        if (currentDraggedToken) { currentDraggedToken.element.style.zIndex = ''; currentDraggedToken = null; }
        if (isPaintingFog) { isPaintingFog = false; }
    }

    function handleLayerClick(event) {
        if (event.detail > 1 || isPanning) return;
        if (isAligningGrid) {
            const mapRect = mapContainer.getBoundingClientRect();
            gridOffsetX = (event.clientX - mapRect.left + mapContainer.scrollLeft) % cellSize;
            gridOffsetY = (event.clientY - mapRect.top + mapContainer.scrollTop) % cellSize;
            drawGrid();
            toggleAlignGridMode();
            return;
        }
        setTimeout(() => {
            if (currentDraggedToken) return;
            const tokenElement = event.target.closest('.token');
            if (tokenElement) { selectToken(parseInt(tokenElement.dataset.id)); }
            else { deselectToken(); }
        }, 150);
    }

    // --- VISIÓN, NIEBLA Y MUROS ---
    function toggleVisionMode() {
        visionModeActive = !visionModeActive;
        toggleVisionBtn.textContent = visionModeActive ? 'Detener Visión Dinámica' : 'Iniciar Visión Dinámica';
        toggleWallModeBtn.disabled = visionModeActive;
        undoWallBtn.disabled = visionModeActive;
        clearWallsBtn.disabled = visionModeActive;
        wallsCanvas.style.display = visionModeActive ? 'none' : 'block';
        visionCanvas.style.display = visionModeActive ? 'block' : 'none';

        if (visionModeActive) {
            if (isDrawingWallMode) toggleWallMode();
            updateAllTokenVisibility();
            drawVision();
        } else {
            mapContainer.classList.remove('brush-mode-active');
            ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
            updateAllTokenVisibility();
            drawWalls();
        }
    }

    function updateAllTokenVisibility() { tokens.forEach(updateTokenElementStyle); }
    function clearRevealedBuffer() { revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height); }
    function resetFog() { if (!confirm("¿Estás seguro de que quieres reiniciar toda la niebla de guerra? Esta acción no se puede deshacer.")) return; clearRevealedBuffer(); if (visionModeActive) { tokens.forEach(t => { if (t.identity.type === 'enemy') t.isDiscovered = false; }); drawVision(); updateAllTokenVisibility(); } }

    function paintFog(event) {
        if (!visionModeActive || !activeBrushMode) return;
        const mapRect = mapContainer.getBoundingClientRect();
        const x = event.clientX - mapRect.left + mapContainer.scrollLeft;
        const y = event.clientY - mapRect.top + mapContainer.scrollTop;
        revealedBufferCtx.globalCompositeOperation = activeBrushMode === 'reveal' ? 'source-over' : 'destination-out';
        revealedBufferCtx.fillStyle = 'white';
        revealedBufferCtx.beginPath();
        revealedBufferCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        revealedBufferCtx.fill();
        renderFogFromBuffer();
        checkEnemyDiscovery();
        broadcastState('STATE_UPDATE', { fogUrl: revealedBufferCanvas.toDataURL() });
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

        tokens
            .filter(t => t.identity.type === 'player')
            .forEach(pToken => {
                const centerX = pToken.position.x + pToken.position.size / 2;
                const centerY = pToken.position.y + pToken.position.size / 2;
                const visionRadiusPixels = pToken.stats.vision.radius * cellSize;

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
        let trackerNeedsUpdate = false;
        const fogImageData = revealedBufferCtx.getImageData(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height);
        const fogData = fogImageData.data;
        const canvasWidth = revealedBufferCanvas.width;

        tokens
            .filter(t => t.identity.type === 'enemy' && !t.isDiscovered)
            .forEach(enemy => {
                let isVisible = false;
                const centerX = Math.floor(enemy.position.x + enemy.position.size / 2);
                const centerY = Math.floor(enemy.position.y + enemy.position.size / 2);
                const pixelIndex = (centerY * canvasWidth + centerX) * 4;
                if (fogData[pixelIndex + 3] > 0) isVisible = true;

                if (isVisible) {
                    enemy.isDiscovered = true;
                    updateTokenElementStyle(enemy);
                    trackerNeedsUpdate = true;
                }
            });

        if (trackerNeedsUpdate) updatePlayerTurnTracker();
    }

    function updateCellSize() {
        const newSize = parseFloat(cellSizeInput.value);
        if (isNaN(newSize) || newSize < 10) { cellSizeInput.value = cellSize; return; }
        cellSize = newSize;
        tokens.forEach(token => {
            token.position.size = (token.position.sizeMultiplier || 1) * cellSize;
            updateTokenElementStyle(token);
        });
        drawGrid();
        if (visionModeActive) drawVision();
        broadcastState('STATE_UPDATE', { tokens, cellSize, gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize }, fogUrl: visionModeActive ? revealedBufferCanvas.toDataURL() : null });
    }

    function drawGrid() {
        const w = gridCanvas.width, h = gridCanvas.height;
        gridCtx.clearRect(0, 0, w, h);
        if (!gridVisible || cellSize <= 0) return;
        gridCtx.strokeStyle = gridColor;
        gridCtx.globalAlpha = gridOpacity;
        gridCtx.lineWidth = 1;
        gridCtx.beginPath();
        for (let x = gridOffsetX; x < w; x += cellSize) { gridCtx.moveTo(x, 0); gridCtx.lineTo(x, h); }
        for (let y = gridOffsetY; y < h; y += cellSize) { gridCtx.moveTo(0, y); gridCtx.lineTo(w, y); }
        gridCtx.stroke();
        gridCtx.globalAlpha = 1.0;
    }

    function toggleAlignGridMode() {
        isAligningGrid = !isAligningGrid;
        alignGridModeBtn.classList.toggle('active', isAligningGrid);
        document.body.classList.toggle('grid-align-mode', isAligningGrid);
        alignGridModeBtn.textContent = isAligningGrid ? 'Cancelar Alineación' : 'Activar Modo Alineación';
        if (isAligningGrid && isDrawingWallMode) toggleWallMode();
    }

    function resetGridOffset() {
        if (confirm("¿Restablecer la alineación de la rejilla a la esquina superior izquierda?")) {
            gridOffsetX = 0; gridOffsetY = 0; drawGrid();
            if (isAligningGrid) toggleAlignGridMode();
        }
    }

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
                pendingDoor = { x1: wallStartPoint.x, y1: wallStartPoint.y, x2: x, y2: y };
                doorNameInput.value = '';
                doorNameModal.classList.add('open');
                setTimeout(() => doorNameInput.focus(), 50);
            } else {
                walls.push({ id: Date.now(), x1: wallStartPoint.x, y1: wallStartPoint.y, x2: x, y2: y, type: 'wall' });
                if (visionModeActive) drawVision();
            }
            wallStartPoint = null;
            drawWalls();
        }
    }

    function createDoorFromModal() {
        const doorName = doorNameInput.value.trim();
        if (!doorName) { alert("Por favor, introduce un nombre para el acceso."); return; }
        if (pendingDoor) {
            walls.push({ id: Date.now(), ...pendingDoor, type: 'door', isOpen: false, name: doorName });
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

    function undoLastWall() { walls.pop(); drawWalls(); updateDoorList(); if (visionModeActive) drawVision(); }
    function clearAllWalls() { if (confirm("¿Estás seguro de que quieres eliminar todos los muros y puertas?")) { walls = []; drawWalls(); updateDoorList(); if (visionModeActive) drawVision(); } }

    function updateDoorList() {
        const doors = walls.filter(w => w.type === 'door');
        doorListUl.innerHTML = '';
        noDoorsMessage.style.display = doors.length === 0 ? 'block' : 'none';
        doors.forEach(door => {
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
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            else if (e.key === 'Escape') updateDoorList();
        });
    }

    function toggleDoorState(event) {
        const doorId = parseInt(event.target.dataset.id);
        const door = walls.find(w => w.id === doorId);
        if (door) {
            door.isOpen = !door.isOpen;
            updateDoorList();
            drawWalls();
            if (visionModeActive) { drawVision(); broadcastState('STATE_UPDATE', { fogUrl: revealedBufferCanvas.toDataURL() }); }
        }
    }

    function deleteDoor(event) {
        const doorId = parseInt(event.target.dataset.id);
        walls = walls.filter(w => w.id !== doorId);
        updateDoorList();
        drawWalls();
        if (visionModeActive) drawVision();
    }

    function getIntersection(ray, wall) {
        const r_px = ray.x1, r_py = ray.y1, r_dx = ray.x2 - r_px, r_dy = ray.y2 - r_py;
        const s_px = wall.x1, s_py = wall.y1, s_dx = wall.x2 - s_px, s_dy = wall.y2 - s_py;
        const r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy), s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
        if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) return null;
        const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
        const T1 = (s_px + s_dx * T2 - r_px) / r_dx;
        if (T1 < 0 || T2 < 0 || T2 > 1) return null;
        return { x: r_px + r_dx * T1, y: r_py + r_dy * T1, param: T1 };
    }

    // --- FUNCIÓN CENTRAL PARA EL TRACKER DE JUGADORES (NUEVA) ---
    function updatePlayerTurnTracker() {
        playerTurnTracker.innerHTML = '';
        const visibleTokens = tokens.filter(token => token.identity.type === 'player' || (token.identity.type === 'enemy' && token.isDiscovered));
        const sortedTokens = visibleTokens.sort((a, b) => (b.stats.initiative || 0) - (a.stats.initiative || 0));

        sortedTokens.forEach(token => {
            const card = document.createElement('div');
            card.className = 'player-token-card';
            card.dataset.id = token.id;

            const imageStyle = token.identity.image ? `background-image: url(${token.identity.image});` : `background-color: ${token.appearance.color};`;
            const statesHTML = token.info.states.map(state => `<span title="${state.description}">${state.emoji}</span>`).join('');

            let healthInfoHTML = '';
            if (token.identity.type === 'player') {
                const healthPercentage = token.stats.health.max > 0 ? (token.stats.health.current / token.stats.health.max) * 100 : 0;
                const healthColorClass = getHealthColorClass(token.stats.health.current, token.stats.health.max);
                healthInfoHTML = `<div class="health-bar-container"><div class="health-bar-fill ${healthColorClass}" style="width: ${healthPercentage}%;"></div></div><div class="player-token-health-text">Vida: ${token.stats.health.current}/${token.stats.health.max}</div>`;
            }

            card.innerHTML = `
            <div class="player-token-preview" style="${imageStyle}">${token.identity.image ? '' : token.identity.letter}</div>
            <div class="player-token-info">
                <div class="player-token-name">${token.identity.name}</div>
                <div class="player-token-initiative">Iniciativa: ${token.stats.initiative || 0}</div>
                ${healthInfoHTML} 
                <div class="player-token-states">${statesHTML}</div>
            </div>`;
            playerTurnTracker.appendChild(card);
        });
    }

    // --- GESTIÓN DE ESTADOS (NUEVAS FUNCIONES) ---
    function renderTokenStatesEditor(token) {
        editTokenStatesList.innerHTML = '';
        if (!token || !token.info || !token.info.states) return;
        token.info.states.forEach((state, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="state-emoji">${state.emoji}</span><span class="state-desc">${state.description}</span><button class="delete-state-btn" data-index="${index}" title="Eliminar estado">×</button>`;
            editTokenStatesList.appendChild(li);
        });
        editTokenStatesList.querySelectorAll('.delete-state-btn').forEach(btn => btn.addEventListener('click', () => removeStateFromSelectedToken(parseInt(btn.dataset.index))));
    }

    function addStateToSelectedToken() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;
        const emoji = newStateEmoji.value.trim();
        const desc = newStateDesc.value.trim();
        if (!emoji) { alert('El emoji del estado no puede estar vacío.'); return; }
        if (!token.info.states) token.info.states = [];
        token.info.states.push({ emoji, description: desc });
        newStateEmoji.value = '';
        newStateDesc.value = '';
        renderTokenStatesEditor(token);
        updatePlayerTurnTracker();
    }

    function removeStateFromSelectedToken(index) {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token || !token.info || !token.info.states || !token.info.states[index]) return;
        token.info.states.splice(index, 1);
        renderTokenStatesEditor(token);
        updatePlayerTurnTracker();
    }

    // --- FUNCIONES DE ÁREA DE EFECTO (NUEVO) ---
    function toggleAoe(shape) {
        activeAoeType = activeAoeType === shape ? null : shape;
        updateAoeControls();
        clearAoeCanvas();
    }

    function updateAoeControls() {
        aoeShapeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.shape === activeAoeType));
        document.querySelectorAll('.aoe-params').forEach(paramDiv => {
            paramDiv.style.display = paramDiv.id === `params-${activeAoeType}` ? 'block' : 'none';
        });
        if (!activeAoeType) clearAoeCanvas();
    }

    function clearAoeCanvas() { aoeCtx.clearRect(0, 0, aoeCanvas.width, aoeCanvas.height); }

    function drawAoePreview(event) {
        if (!activeAoeType || !selectedTokenId) { clearAoeCanvas(); return; }
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        clearAoeCanvas();
        const mapRect = mapContainer.getBoundingClientRect();
        const mouseX = event.clientX - mapRect.left + mapContainer.scrollLeft;
        const mouseY = event.clientY - mapRect.top + mapContainer.scrollTop;
        const centerX = token.position.x + token.position.size / 2;
        const centerY = token.position.y + token.position.size / 2;

        aoeCtx.fillStyle = aoeColorInput.value;
        aoeCtx.strokeStyle = aoeColorInput.value;

        switch (activeAoeType) {
            case 'line':
                aoeCtx.lineWidth = (parseInt(document.getElementById('aoeLineWidth').value) || 1) * cellSize;
                aoeCtx.lineCap = 'butt';
                aoeCtx.beginPath();
                aoeCtx.moveTo(centerX, centerY);
                aoeCtx.lineTo(mouseX, mouseY);
                aoeCtx.stroke();
                break;
            case 'cone':
                const coneLength = (parseInt(document.getElementById('aoeConeLength').value) || 1) * cellSize;
                const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
                const endPointX = centerX + Math.cos(angle) * coneLength;
                const endPointY = centerY + Math.sin(angle) * coneLength;
                const halfWidth = coneLength / 2;
                const p1x = endPointX - halfWidth * Math.sin(angle);
                const p1y = endPointY + halfWidth * Math.cos(angle);
                const p2x = endPointX + halfWidth * Math.sin(angle);
                const p2y = endPointY - halfWidth * Math.cos(angle);
                aoeCtx.beginPath();
                aoeCtx.moveTo(centerX, centerY);
                aoeCtx.lineTo(p1x, p1y);
                aoeCtx.lineTo(p2x, p2y);
                aoeCtx.closePath();
                aoeCtx.fill();
                break;
            case 'cube':
                const cubeSize = (parseInt(document.getElementById('aoeCubeSize').value) || 1) * cellSize;
                aoeCtx.fillRect(mouseX - cubeSize / 2, mouseY - cubeSize / 2, cubeSize, cubeSize);
                break;
            case 'sphere':
                const sphereRadius = (parseInt(document.getElementById('aoeSphereRadius').value) || 1) * cellSize;
                aoeCtx.beginPath();
                aoeCtx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
                aoeCtx.fill();
                break;
            case 'cylinder':
                const cylinderRadius = (parseInt(document.getElementById('aoeCylinderRadius').value) || 1) * cellSize;
                aoeCtx.beginPath();
                aoeCtx.arc(mouseX, mouseY, cylinderRadius, 0, Math.PI * 2);
                aoeCtx.fill();
                break;
        }
    }

    function handleBrushModeChange(event) {
        const checkbox = event.target;
        const otherCheckbox = checkbox.id === 'brushReveal' ? brushHideCheckbox : brushRevealCheckbox;
        if (checkbox.checked) {
            otherCheckbox.checked = false;
            activeBrushMode = checkbox.value;
            mapContainer.classList.add('brush-mode-active');
        } else {
            activeBrushMode = null;
            mapContainer.classList.remove('brush-mode-active');
        }
    }

    // --- COMUNICACIÓN CON VISTA DE JUGADOR ---
    function broadcastState(type, payload) {
        if (playerViewWindow && !playerViewWindow.closed) {
            // Deep copy and remove DOM elements before sending
            const cleanPayload = JSON.parse(JSON.stringify(payload), (key, value) => {
                if (key === 'element') return undefined;
                return value;
            });
            channel.postMessage({ type, payload: cleanPayload });
        }
    }

    function broadcastGridSettings() {
        broadcastState('STATE_UPDATE', { gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize } });
    }

    // --- LÓGICA DE HABILIDADES E INVENTARIO (NUEVO) ---

    function openFeatureModal(context) {
        if (!selectedTokenId) return;
        currentModalContext = context;

        if (context === 'ability') {
            modalTitle.textContent = 'Añadir Habilidad Destacada';
            modalNameInput.placeholder = 'Ej: Ataque Furtivo';
            modalDescriptionInput.placeholder = 'Describe la habilidad, dados de daño, etc.';
        } else if (context === 'inventory') {
            modalTitle.textContent = 'Añadir Objeto al Inventario';
            modalNameInput.placeholder = 'Ej: Poción de Curación Mayor';
            modalDescriptionInput.placeholder = 'Cantidad, descripción del objeto, etc.';
        }

        modalNameInput.value = '';
        modalDescriptionInput.value = '';
        featureInventoryModal.classList.add('open');
        modalNameInput.focus();
    }

    function saveFeatureOrItem() {
        if (!selectedTokenId || !currentModalContext) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        const name = modalNameInput.value.trim();
        const description = modalDescriptionInput.value.trim();

        if (!name) {
            alert('El nombre no puede estar vacío.');
            return;
        }

        const newItem = { id: Date.now(), name, description };

        if (currentModalContext === 'ability') {
            if (!token.info.abilities) token.info.abilities = [];
            token.info.abilities.push(newItem);
            renderAbilitiesList(token);
        } else if (currentModalContext === 'inventory') {
            if (!token.info.inventory) token.info.inventory = [];
            token.info.inventory.push(newItem);
            renderInventoryList(token);
        }

        featureInventoryModal.classList.remove('open');
    }

    function renderAbilitiesList(token) {
        editAbilitiesList.innerHTML = '';
        if (!token || !token.info.abilities) return;

        token.info.abilities.forEach((ability, index) => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `
                <h5 class="info-card-title">${ability.name}</h5>
                <p class="info-card-desc">${ability.description}</p>
                <button class="delete-info-btn" data-index="${index}" title="Eliminar habilidad">×</button>
            `;
            editAbilitiesList.appendChild(card);
        });

        editAbilitiesList.querySelectorAll('.delete-info-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                token.info.abilities.splice(index, 1);
                renderAbilitiesList(token);
            });
        });
    }

    function renderInventoryList(token) {
        editInventoryList.innerHTML = '';
        if (!token || !token.info.inventory) return;

        token.info.inventory.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `
                <h5 class="info-card-title">${item.name}</h5>
                <p class="info-card-desc">${item.description}</p>
                <button class="delete-info-btn" data-index="${index}" title="Eliminar objeto">×</button>
            `;
            editInventoryList.appendChild(card);
        });

        editInventoryList.querySelectorAll('.delete-info-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                token.info.inventory.splice(index, 1);
                renderInventoryList(token);
            });
        });
    }
});