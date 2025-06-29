// --- SCRIPT.JS - VERSIÓN FINAL CON IMÁGENES DE FICHA ---

document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORES DEL DOM ---
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
    let tokens = [],
        walls = [],
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
    let drawType = 'wall';
    const revealedBufferCanvas = document.createElement('canvas'),
        revealedBufferCtx = revealedBufferCanvas.getContext('2d', { willReadFrequently: true });

    // --- ESTADO INICIAL ---
    mapContainer.classList.add('no-map');
    updateDoorList();

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
        const state = { mapSrc: mapImage.src, cellSize: cellSize, tokens: tokens.map(t => ({ id: t.id, type: t.type, name: t.name, letter: t.letter, image: t.image, turn: t.turn, health_max: t.health_max, health_current: t.health_current, notes: t.notes, color: t.color, borderColor: t.borderColor, visionRadius: t.visionRadius, x: t.x, y: t.y, size: t.size, isDiscovered: t.isDiscovered })), walls: walls, revealedFogData: revealedBufferCanvas.toDataURL(), gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity } };
        localStorage.setItem('dndMapState', JSON.stringify(state));
        alert("¡Escena guardada en el navegador!");
    }

    function loadState() {
        const savedStateJSON = localStorage.getItem('dndMapState');
        if (!savedStateJSON) { alert("No hay ninguna escena guardada."); return; }
        const state = JSON.parse(savedStateJSON);
        let hasRestored = false;
        const restore = () => { if (hasRestored) return; hasRestored = true; restoreSceneFromState(state); };
        mapImage.onload = restore;
        mapImage.src = state.mapSrc;
        if (mapImage.complete) { restore(); }
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
        setTimeout(() => alert("Escena cargada."), 100);
    }
    
    // --- LÓGICA DE PROCESAMIENTO DE IMAGEN ---
    async function processImage(file) {
        const MAX_WIDTH = 256; // Calidad suficiente para una ficha
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
                    resolve(canvas.toDataURL('image/webp', 0.8)); // Calidad 80% en formato WebP
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
        if (!letter || !name || isNaN(vision)) { alert("Por favor, rellena los campos obligatorios (*): Nombre, Letra y Visión."); return; }
        
        let imageBase64 = null;
        if (add_tokenImageInput.files[0]) {
            imageBase64 = await processImage(add_tokenImageInput.files[0]);
        }

        const initialHealth = parseInt(add_tokenHealth.value) || 0;
        const tokenData = { id: Date.now(), type: document.querySelector('input[name="tokenType"]:checked').value, name: name, letter: letter, image: imageBase64, turn: parseInt(add_tokenTurn.value) || 0, health_max: initialHealth, health_current: initialHealth, notes: add_tokenNotes.value, color: add_tokenColor.value, borderColor: add_addBorderCheckbox.checked ? add_tokenBorderColor.value : null, visionRadius: vision, x: 20, y: 20, size: cellSize, isDiscovered: document.querySelector('input[name="tokenType"]:checked').value === 'player' };
        
        recreateToken(tokenData);
        updateTokenList();
        if (visionModeActive) drawVision();
        resetAddTokenForm();
    }

    function resetAddTokenForm() {
        add_tokenName.value = '';
        add_tokenLetter.value = 'A';
        add_tokenImageInput.value = '';
        add_tokenImageName.textContent = 'Ningún archivo...';
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
    function deleteToken(tokenId) { tokens = tokens.filter(t => t.id !== tokenId); const el = tokensLayer.querySelector(`.token[data-id="${tokenId}"]`); if (el) el.remove(); if (selectedTokenId === tokenId) deselectToken(); updateTokenList(); if (visionModeActive) drawVision(); }

    function updateTokenList() {
        tokenListUl.innerHTML = '';
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
        
        // Mostrar u ocultar la vista previa de la imagen
        if (token.image) {
            editTokenImagePreview.src = token.image;
            editTokenImagePreviewContainer.style.display = 'block';
        } else {
            editTokenImagePreviewContainer.style.display = 'none';
        }

        edit_tokenName.value = token.name; edit_tokenLetter.value = token.letter; edit_tokenTurn.value = token.turn; edit_tokenVision.value = token.visionRadius; edit_tokenHealthMax.value = token.health_max; edit_tokenColor.value = token.color; edit_tokenBorderColor.value = token.borderColor || '#000000'; edit_tokenNotes.value = token.notes;
        healthDisplay.textContent = token.health_current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`;
    }

    function deselectToken() { if (!selectedTokenId) return; const oldToken = tokens.find(t => t.id === selectedTokenId); if (oldToken) oldToken.element.classList.remove('selected'); selectedTokenId = null; selectedTokenSection.classList.remove('has-selection'); }
    
    async function handleEditTokenImageChange(event) {
        if (!selectedTokenId) return;
        const file = event.target.files[0];
        if (file) {
            const token = tokens.find(t => t.id === selectedTokenId);
            token.image = await processImage(file);
            updateTokenElementStyle(token);
            updateTokenList();
            selectToken(token.id); // Re-seleccionar para actualizar la vista previa
        }
    }
    
    function removeEditTokenImage() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        token.image = null;
        updateTokenElementStyle(token);
        updateTokenList();
        selectToken(token.id);
    }
    
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
    // (Sin cambios)
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
    // (Sin cambios)
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

    function handleLayerMouseUp() { if (currentDraggedToken) { currentDraggedToken.element.style.zIndex = ''; if (visionModeActive) drawVision(); currentDraggedToken = null; } isPaintingFog = false; }
    function handleLayerClick(event) { if (event.detail > 1) return; setTimeout(() => { if (currentDraggedToken) return; const tokenElement = event.target.closest('.token'); if (tokenElement) { selectToken(parseInt(tokenElement.dataset.id)); } else { deselectToken(); } }, 150); }

    // --- VISIÓN, NIEBLA Y MUROS ---
    // (Sin cambios, pero con la última lógica correcta)
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

    // --- LÓGICA DE MUROS Y PUERTAS ---
    // (Sin cambios, pero con la última lógica correcta)
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
            const newWall = { id: Date.now(), x1: wallStartPoint.x, y1: wallStartPoint.y, x2: x, y2: y, type: drawType };
            if (newWall.type === 'door') {
                newWall.isOpen = false;
                const doorCount = walls.filter(w => w.type === 'door').length + 1;
                newWall.name = `Acceso #${doorCount}`;
            }
            walls.push(newWall);
            wallStartPoint = null;
            drawWalls();
            updateDoorList();
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
});