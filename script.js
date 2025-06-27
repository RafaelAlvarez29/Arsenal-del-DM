document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORES DEL DOM (ORGANIZADOS) ---
    const mapImageInput = document.getElementById('mapImageInput'),
        saveStateBtn = document.getElementById('saveStateBtn'),
        loadStateBtn = document.getElementById('loadStateBtn');

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

    const toggleWallModeBtn = document.getElementById('toggleWallModeBtn'),
        undoWallBtn = document.getElementById('undoWallBtn'),
        clearWallsBtn = document.getElementById('clearWallsBtn');

    const fileNameDisplay = document.getElementById('fileNameDisplay');

    const add_tokenName = document.getElementById('tokenName'),
        add_tokenLetter = document.getElementById('tokenLetter'),
        add_tokenTurn = document.getElementById('tokenTurn'),
        add_tokenHealth = document.getElementById('tokenHealth'),
        add_tokenNotes = document.getElementById('tokenNotes'),
        add_tokenColor = document.getElementById('tokenColor'),
        add_tokenBorderColor = document.getElementById('tokenBorderColor'),
        add_addBorderCheckbox = document.getElementById('addBorderCheckbox'),
        add_tokenVision = document.getElementById('tokenVision');

    const selectedTokenSection = document.getElementById('selectedTokenSection'),
        tokenEditorDiv = document.getElementById('tokenEditor');

    const edit_tokenName = document.getElementById('editTokenName'),
        edit_tokenLetter = document.getElementById('editTokenLetter'),
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
    let tokens = [],
        selectedTokenId = null,
        visionModeActive = false,
        currentDraggedToken = null,
        isPaintingFog = false,
        isDrawingWallMode = false,
        wallStartPoint = null;
    let dragOffsetX, dragOffsetY;
    let cellSize = parseInt(cellSizeInput.value),
        gridVisible = gridToggle.checked,
        gridColor = gridColorInput.value,
        gridOpacity = parseFloat(gridOpacityInput.value);
    let brushMode = document.querySelector('input[name="brushMode"]:checked').value,
        brushSize = parseInt(brushSizeInput.value);
    let walls = [];
    const revealedBufferCanvas = document.createElement('canvas'),
        revealedBufferCtx = revealedBufferCanvas.getContext('2d', { willReadFrequently: true });

    // --- ESTADO INICIAL ---
    mapContainer.classList.add('no-map');

    // --- EVENT LISTENERS ---
    document.querySelectorAll('.collapsible-header').forEach(header => header.addEventListener('click', () => header.parentElement.classList.toggle('active')));
    mapImageInput.addEventListener('change', handleImageUpload);
    saveStateBtn.addEventListener('click', saveState);
    loadStateBtn.addEventListener('click', loadState);
    gridToggle.addEventListener('change', e => { gridVisible = e.target.checked; drawGrid(); });
    gridColorInput.addEventListener('input', e => { gridColor = e.target.value; drawGrid(); });
    gridOpacityInput.addEventListener('input', e => { gridOpacity = parseFloat(e.target.value); drawGrid(); });
    brushModeInputs.forEach(input => input.addEventListener('change', e => brushMode = e.target.value));
    brushSizeInput.addEventListener('input', e => brushSize = parseInt(e.target.value));
    cellSizeSlider.addEventListener('input', () => { cellSizeInput.value = cellSizeSlider.value; updateCellSize(); });
    cellSizeInput.addEventListener('input', () => { const val = Math.min(parseInt(cellSizeInput.value) || 10, 150); cellSizeSlider.value = val; updateCellSize(); });
    addTokenBtn.addEventListener('click', addToken);
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

    // --- GESTIÓN DE ESTADO (GUARDAR/CARGAR) ---
    function saveState() {
        if (!mapImage.src || mapImage.src.endsWith('#')) { alert("No hay un mapa cargado para guardar."); return; }
        const state = { mapSrc: mapImage.src, cellSize: cellSize, tokens: tokens.map(t => ({ id: t.id, type: t.type, name: t.name, letter: t.letter, turn: t.turn, health_max: t.health_max, health_current: t.health_current, notes: t.notes, color: t.color, borderColor: t.borderColor, visionRadius: t.visionRadius, x: t.x, y: t.y, size: t.size, isDiscovered: t.isDiscovered })), walls: walls, revealedFogData: revealedBufferCanvas.toDataURL(), gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity } };
        localStorage.setItem('dndMapState', JSON.stringify(state));
        alert("¡Escena guardada en el navegador!");
    }

    function loadState() {
        const savedStateJSON = localStorage.getItem('dndMapState');
        if (!savedStateJSON) { alert("No hay ninguna escena guardada."); return; }
        const state = JSON.parse(savedStateJSON);
        const restore = () => restoreSceneFromState(state);
        mapImage.onload = restore;
        mapImage.src = state.mapSrc;
        if (mapImage.complete) {
            restore();
        }
    }

    function restoreSceneFromState(state) {
        showMapArea();
        const mapSection = mapImageInput.closest('.collapsible');
        if (mapSection) mapSection.classList.remove('active');
        removeAllTokens();
        resizeAllCanvas();
        cellSize = state.cellSize;
        cellSizeInput.value = cellSize;
        cellSizeSlider.value = cellSize;
        gridVisible = state.gridSettings.visible;
        gridColor = state.gridSettings.color;
        gridOpacity = state.gridSettings.opacity;
        gridToggle.checked = gridVisible;
        gridColorInput.value = gridColor;
        gridOpacityInput.value = gridOpacity;
        walls = state.walls || [];
        drawWalls();
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
        setTimeout(() => alert("Escena cargada."), 100);
    }

    // --- GESTIÓN DE FICHAS ---
    function addToken() {
        const letter = add_tokenLetter.value.trim(),
            name = add_tokenName.value.trim(),
            vision = parseInt(add_tokenVision.value);
        if (!letter || !name || isNaN(vision)) { alert("Por favor, rellena los campos obligatorios (*): Nombre, Letra y Visión."); return; }
        const initialHealth = parseInt(add_tokenHealth.value) || 0;
        const tokenData = { id: Date.now(), type: document.querySelector('input[name="tokenType"]:checked').value, name: name, letter: letter, turn: parseInt(add_tokenTurn.value) || 0, health_max: initialHealth, health_current: initialHealth, notes: add_tokenNotes.value, color: add_tokenColor.value, borderColor: add_addBorderCheckbox.checked ? add_tokenBorderColor.value : null, visionRadius: vision, x: 20, y: 20, size: cellSize, isDiscovered: document.querySelector('input[name="tokenType"]:checked').value === 'player' };
        recreateToken(tokenData);
        updateTokenList();
        if (visionModeActive) drawVision();
        resetAddTokenForm();
    }

    function resetAddTokenForm() {
        add_tokenName.value = '';
        add_tokenLetter.value = 'A';
        add_tokenTurn.value = '10';
        add_tokenHealth.value = '100';
        add_tokenNotes.value = '';
        document.getElementById('typePlayer').checked = true;
        add_tokenColor.value = '#4a90e2';
        add_tokenBorderColor.value = '#000000';
        add_addBorderCheckbox.checked = false;
        add_tokenVision.value = '6';
        add_tokenName.focus();
    }

    function recreateToken(tokenData) {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token';
        tokenElement.dataset.id = tokenData.id;
        if (tokenData.health_max === undefined) { tokenData.health_max = tokenData.health || 100; tokenData.health_current = tokenData.health || 100; }
        tokenData.element = tokenElement;
        tokens.push(tokenData);
        updateTokenElementStyle(tokenData);
        tokensLayer.appendChild(tokenElement);
    }

    function updateTokenElementStyle(token) {
        const el = token.element;
        el.style.left = `${token.x}px`; el.style.top = `${token.y}px`;
        el.style.width = `${token.size}px`; el.style.height = `${token.size}px`;
        el.style.lineHeight = `${token.size}px`; el.style.backgroundColor = token.color;
        el.style.border = token.borderColor ? `3px solid ${token.borderColor}` : 'none';
        el.textContent = token.letter;
        if (visionModeActive && token.type === 'enemy') { el.classList.toggle('hidden-enemy', !token.isDiscovered); } else { el.classList.remove('hidden-enemy'); }
    }

    function removeAllTokens() { tokens = []; tokensLayer.innerHTML = ''; updateTokenList(); deselectToken(); }
    function deleteToken(tokenId) { tokens = tokens.filter(t => t.id !== tokenId); const el = tokensLayer.querySelector(`.token[data-id="${tokenId}"]`); if (el) el.remove(); if (selectedTokenId === tokenId) deselectToken(); updateTokenList(); if (visionModeActive) drawVision(); }

    function updateTokenList() {
        tokenListUl.innerHTML = '';
        const sortedTokens = [...tokens].sort((a, b) => b.turn - a.turn);
        sortedTokens.forEach(token => {
            const li = document.createElement('li');
            li.dataset.id = token.id;
            const typeIcon = token.type === 'player' ? '🛡️' : '👹';
            const borderStyle = token.borderColor ? `border: 3px solid ${token.borderColor};` : 'none';
            li.innerHTML = `<div class="token-list-preview" style="background-color: ${token.color}; ${borderStyle}">${token.letter}</div><div class="token-list-header"><span>${typeIcon}</span><span>${token.name}</span></div><div class="token-list-details"><span>Turno: ${token.turn}</span><span>❤️ Vida: ${token.health_current}/${token.health_max}</span><span>👁️ Vis: ${token.visionRadius}</span></div><button class="delete-token-btn" data-id="${token.id}" title="Eliminar Ficha">X</button>`;
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
        if (!token) return;
        token.element.classList.add('selected');
        selectedTokenSection.classList.add('has-selection', 'active');
        edit_tokenName.value = token.name; edit_tokenLetter.value = token.letter; edit_tokenTurn.value = token.turn; edit_tokenVision.value = token.visionRadius; edit_tokenHealthMax.value = token.health_max; edit_tokenColor.value = token.color; edit_tokenBorderColor.value = token.borderColor || '#000000'; edit_tokenNotes.value = token.notes;
        healthDisplay.textContent = token.health_current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`;
    }

    function deselectToken() { if (!selectedTokenId) return; const oldToken = tokens.find(t => t.id === selectedTokenId); if (oldToken) oldToken.element.classList.remove('selected'); selectedTokenId = null; selectedTokenSection.classList.remove('has-selection'); }
    function updateSelectedToken() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;
        token.name = edit_tokenName.value.trim(); token.letter = edit_tokenLetter.value.trim(); token.turn = parseInt(edit_tokenTurn.value) || 0; token.visionRadius = parseInt(edit_tokenVision.value) || 0; token.health_max = parseInt(edit_tokenHealthMax.value) || 0; token.color = edit_tokenColor.value; token.borderColor = edit_tokenBorderColor.value; token.notes = edit_tokenNotes.value;
        if (!token.name || !token.letter) { alert("El nombre y la letra no pueden estar vacíos."); return; }
        if (token.health_current > token.health_max) { token.health_current = token.health_max; }
        updateTokenElementStyle(token);
        updateTokenList();
        selectToken(token.id);
        if (visionModeActive) drawVision();
    }

    // --- LÓGICA DE VIDA Y DAÑO ---
    function getHealthColorClass(current, max) { if (max === 0) return 'health-mid'; const percentage = (current / max) * 100; if (percentage <= 10) return 'health-critical'; if (percentage <= 40) return 'health-low'; if (percentage <= 70) return 'health-mid'; return 'health-high'; }
    function showDamageFloat(amount, token) {
        if (amount === 0) return;
        const panelFloat = document.createElement('div');
        panelFloat.className = 'damage-float'; panelFloat.textContent = `${amount > 0 ? '+' : ''}${amount}`; panelFloat.classList.add(amount > 0 ? 'heal' : 'damage');
        healthDisplayContainer.appendChild(panelFloat);
        setTimeout(() => panelFloat.remove(), 1000);
        const mapFloat = document.createElement('div');
        mapFloat.className = 'damage-float'; mapFloat.textContent = `${amount > 0 ? '+' : ''}${amount}`; mapFloat.classList.add(amount > 0 ? 'heal' : 'damage'); mapFloat.style.left = `${token.x + token.size / 2}px`; mapFloat.style.top = `${token.y}px`;
        tokensLayer.appendChild(mapFloat);
        setTimeout(() => mapFloat.remove(), 1000);
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
        healthDisplay.textContent = token.health_current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`;
        showDamageFloat(actualChange, token);
        updateTokenList();
        const tokenElement = token.element;
        if (actualChange < 0) { damageSound.currentTime = 0; damageSound.play(); tokenElement.classList.add('token-damaged'); setTimeout(() => tokenElement.classList.remove('token-damaged'), 400); } else if (actualChange > 0) { healSound.currentTime = 0; healSound.play(); tokenElement.classList.add('token-healed'); setTimeout(() => tokenElement.classList.remove('token-healed'), 500); }
    }

    // --- MANEJO DE RATÓN ---
    function handleLayerMouseDown(event) {
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
            return;
        }
        if (isDrawingWallMode) {
            handleWallDrawing(event);
            return;
        }
        if (visionModeActive) {
            isPaintingFog = true;
            paintFog(event);
        }
    }

    function handleLayerMouseMove(event) {
        if (isDrawingWallMode && wallStartPoint) {
            drawWalls();
            const mapRect = mapContainer.getBoundingClientRect();
            const endX = event.clientX - mapRect.left + mapContainer.scrollLeft;
            const endY = event.clientY - mapRect.top + mapContainer.scrollTop;
            wallsCtx.beginPath();
            wallsCtx.moveTo(wallStartPoint.x, wallStartPoint.y);
            wallsCtx.lineTo(endX, endY);
            wallsCtx.strokeStyle = 'cyan';
            wallsCtx.lineWidth = 3;
            wallsCtx.setLineDash([5, 5]);
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
            if (visionModeActive) {
                drawVision();
            }
        } else if (isPaintingFog) {
            paintFog(event);
        }
    }

    function handleLayerMouseUp() { if (currentDraggedToken) { currentDraggedToken.element.style.zIndex = ''; if (visionModeActive) drawVision(); currentDraggedToken = null; } isPaintingFog = false; }
    function handleLayerClick(event) { if (event.detail > 1) return; setTimeout(() => { if (currentDraggedToken) return; const tokenElement = event.target.closest('.token'); if (tokenElement) { selectToken(parseInt(tokenElement.dataset.id)); } else { deselectToken(); } }, 150); }

    // --- VISIÓN, NIEBLA Y MUROS ---
    function toggleVisionMode() {
        visionModeActive = !visionModeActive;
        toggleVisionBtn.textContent = visionModeActive ? 'Detener Visión Dinámica' : 'Iniciar Visión Dinámica';
        // NO TOCAMOS pointerEvents aquí. El CSS es la única fuente de verdad.
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

    // --- REEMPLAZA ESTA FUNCIÓN EN TU script.js ---

    function paintFog(event) {
        if (!visionModeActive) return;

        // Obtenemos las coordenadas reales del clic, teniendo en cuenta el scroll
        const mapRect = mapContainer.getBoundingClientRect();
        const x = event.clientX - mapRect.left + mapContainer.scrollLeft;
        const y = event.clientY - mapRect.top + mapContainer.scrollTop;

        // Aplicamos la acción del pincel (revelar u ocultar) en el canvas de memoria
        revealedBufferCtx.globalCompositeOperation = brushMode === 'reveal' ? 'source-over' : 'destination-out';
        revealedBufferCtx.fillStyle = 'white';
        revealedBufferCtx.beginPath();
        revealedBufferCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        revealedBufferCtx.fill();

        // En lugar de llamar a drawVision(), ahora solo renderizamos el resultado del buffer
        renderFogFromBuffer();

        // Y comprobamos si hemos descubierto a un enemigo manualmente
        checkEnemyDiscovery();
    }

    // --- AÑADE ESTA FUNCIÓN A TU SCRIPT.JS ---

    function renderFogFromBuffer() {
        ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, visionCanvas.width, visionCanvas.height);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(revealedBufferCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
    }

// --- REEMPLAZA ESTA FUNCIÓN EN TU SCRIPT.JS ---

function drawVision() {
    if (!visionModeActive) return;

    // --- INICIO DE LA SOLUCIÓN DEFINITIVA ---
    // 1. Creamos un CANVAS TEMPORAL solo para la visión de este turno.
    // Esto evita interferir con el canvas principal de memoria (revealedBufferCanvas).
    const visionThisFrameCanvas = document.createElement('canvas');
    visionThisFrameCanvas.width = visionCanvas.width;
    visionThisFrameCanvas.height = visionCanvas.height;
    const visionThisFrameCtx = visionThisFrameCanvas.getContext('2d');
    // --- FIN DE LA SOLUCIÓN DEFINITIVA ---

    const mapBoundaries = [{ x1: 0, y1: 0, x2: visionCanvas.width, y2: 0 }, { x1: visionCanvas.width, y1: 0, x2: visionCanvas.width, y2: visionCanvas.height }, { x1: visionCanvas.width, y1: visionCanvas.height, x2: 0, y2: visionCanvas.height }, { x1: 0, y1: visionCanvas.height, x2: 0, y2: 0 }];
    
    tokens.filter(t => t.type === 'player').forEach(pToken => {
        const centerX = pToken.x + pToken.size / 2;
        const centerY = pToken.y + pToken.size / 2;
        const visionRadiusPixels = pToken.visionRadius * cellSize;

        // Pintamos la visión en el CANVAS TEMPORAL.
        visionThisFrameCtx.save();
        visionThisFrameCtx.beginPath();
        visionThisFrameCtx.arc(centerX, centerY, visionRadiusPixels, 0, Math.PI * 2);
        visionThisFrameCtx.clip();

        if (walls.length === 0) {
            visionThisFrameCtx.fillStyle = 'white';
            visionThisFrameCtx.beginPath();
            visionThisFrameCtx.arc(centerX, centerY, visionRadiusPixels, 0, Math.PI * 2);
            visionThisFrameCtx.fill();
        } else {
            const allWalls = [...walls, ...mapBoundaries];
            let points = [];
            allWalls.forEach(wall => { points.push({ x: wall.x1, y: wall.y1 }); points.push({ x: wall.x2, y: wall.y2 }); });
            
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
                allWalls.forEach(wall => {
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

    // --- INICIO DE LA FUSIÓN DE CAPAS ---
    // 1. Añadimos la visión de este turno al canvas de memoria.
    // Esto asegura que la "memoria" de la niebla se actualice.
    revealedBufferCtx.globalCompositeOperation = 'source-over';
    revealedBufferCtx.drawImage(visionThisFrameCanvas, 0, 0);

    // 2. Ahora, renderizamos la niebla final usando el buffer de memoria actualizado.
    renderFogFromBuffer();

    // 3. Y comprobamos si hemos descubierto enemigos con la nueva visión.
    checkEnemyDiscovery();
    // --- FIN DE LA FUSIÓN DE CAPAS ---
}

// Asegúrate de que tienes esta función en tu código (la añadimos en la respuesta anterior)
function renderFogFromBuffer() {
    ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, visionCanvas.width, visionCanvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(revealedBufferCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
}
    function checkEnemyDiscovery() {
        tokens.filter(t => t.type === 'enemy' && !t.isDiscovered).forEach(enemy => {
            const data = revealedBufferCtx.getImageData(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, 1, 1).data;
            if (data[3] > 0) { enemy.isDiscovered = true; updateTokenElementStyle(enemy); }
        });
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

    function toggleWallMode() {
        if (visionModeActive) { alert("No se puede editar muros mientras la Visión Dinámica está activa. Desactívala primero."); return; }
        isDrawingWallMode = !isDrawingWallMode;
        wallStartPoint = null;
        toggleWallModeBtn.classList.toggle('active', isDrawingWallMode);
        document.body.classList.toggle('wall-drawing-mode', isDrawingWallMode);
        toggleWallModeBtn.textContent = isDrawingWallMode ? 'Desactivar Modo Muros' : 'Activar Modo Muros';
        drawWalls();
    }

    function handleWallDrawing(event) {
        const mapRect = mapContainer.getBoundingClientRect();
        const x = event.clientX - mapRect.left + mapContainer.scrollLeft;
        const y = event.clientY - mapRect.top + mapContainer.scrollTop;
        if (!wallStartPoint) {
            wallStartPoint = { x, y };
        } else {
            const newWall = { x1: wallStartPoint.x, y1: wallStartPoint.y, x2: x, y2: y };
            walls.push(newWall);
            wallStartPoint = null;
            drawWalls();
            if (visionModeActive) drawVision();
        }
    }

    function drawWalls() {
        wallsCtx.clearRect(0, 0, wallsCanvas.width, wallsCanvas.height);
        wallsCtx.strokeStyle = '#e6c253';
        wallsCtx.lineWidth = 4;
        wallsCtx.lineCap = 'round';
        walls.forEach(wall => { wallsCtx.beginPath(); wallsCtx.moveTo(wall.x1, wall.y1); wallsCtx.lineTo(wall.x2, wall.y2); wallsCtx.stroke(); });
    }

    function undoLastWall() { walls.pop(); drawWalls(); if (visionModeActive) drawVision(); }
    function clearAllWalls() { if (confirm("¿Estás seguro de que quieres eliminar todos los muros?")) { walls = []; drawWalls(); if (visionModeActive) drawVision(); } }
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
});