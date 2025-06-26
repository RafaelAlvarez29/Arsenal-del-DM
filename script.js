document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORES DEL DOM ---
    const mapImageInput = document.getElementById('mapImageInput'), saveStateBtn = document.getElementById('saveStateBtn'), loadStateBtn = document.getElementById('loadStateBtn');
    const mapContainer = document.getElementById('mapContainer'), mapImage = document.getElementById('mapImage'), gridCanvas = document.getElementById('gridCanvas'), gridCtx = gridCanvas.getContext('2d'), visionCanvas = document.getElementById('visionCanvas'), ctx = visionCanvas.getContext('2d'), tokensLayer = document.getElementById('tokensLayer');
    const gridToggle = document.getElementById('gridToggle'), gridColorInput = document.getElementById('gridColor'), gridOpacityInput = document.getElementById('gridOpacity'), brushModeInputs = document.querySelectorAll('input[name="brushMode"]'), brushSizeInput = document.getElementById('brushSize');
    const cellSizeInput = document.getElementById('cellSize');
    const addTokenBtn = document.getElementById('addTokenBtn'), tokenListUl = document.getElementById('tokenList');
    const toggleVisionBtn = document.getElementById('toggleVisionBtn'), resetFogBtn = document.getElementById('resetFogBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    // Selectores "Añadir Ficha"
    const add_tokenName = document.getElementById('tokenName'), add_tokenLetter = document.getElementById('tokenLetter'), add_tokenTurn = document.getElementById('tokenTurn'), add_tokenHealth = document.getElementById('tokenHealth'), add_tokenNotes = document.getElementById('tokenNotes'), add_tokenColor = document.getElementById('tokenColor'), add_tokenBorderColor = document.getElementById('tokenBorderColor'), add_addBorderCheckbox = document.getElementById('addBorderCheckbox'), add_tokenVision = document.getElementById('tokenVision');

    // Selectores "Ficha Seleccionada"
    const selectedTokenSection = document.getElementById('selectedTokenSection'), noTokenSelectedP = document.getElementById('noTokenSelected'), tokenEditorDiv = document.getElementById('tokenEditor');
    const edit_tokenName = document.getElementById('editTokenName'), edit_tokenLetter = document.getElementById('editTokenLetter'), edit_tokenTurn = document.getElementById('editTokenTurn'), edit_tokenHealthMax = document.getElementById('editTokenHealthMax'), edit_tokenNotes = document.getElementById('editTokenNotes'), edit_tokenColor = document.getElementById('editTokenColor'), edit_tokenBorderColor = document.getElementById('editTokenBorderColor'), edit_tokenVision = document.getElementById('editTokenVision');
    const updateTokenBtn = document.getElementById('updateTokenBtn'), deselectTokenBtn = document.getElementById('deselectTokenBtn');

    // Selectores Controles de Vida
    const healthDisplay = document.getElementById('healthDisplay'), healthDisplayContainer = document.getElementById('healthDisplayContainer'), healthModifierBtns = document.querySelectorAll('.health-modifier-btn'), healthModifierInput = document.getElementById('healthModifierInput');

    // FEATURE: Selectores de Sonido
    const damageSound = document.getElementById('damage-sound');
    const healSound = document.getElementById('heal-sound');

    // --- VARIABLES DE ESTADO ---
    let tokens = [], selectedTokenId = null, visionModeActive = false, currentDraggedToken = null;
    let dragOffsetX, dragOffsetY, isPaintingFog = false;
    let cellSize = parseInt(cellSizeInput.value), gridVisible = gridToggle.checked, gridColor = gridColorInput.value, gridOpacity = parseFloat(gridOpacityInput.value);
    let brushMode = document.querySelector('input[name="brushMode"]:checked').value, brushSize = parseInt(brushSizeInput.value);
    const revealedBufferCanvas = document.createElement('canvas'), revealedBufferCtx = revealedBufferCanvas.getContext('2d', { willReadFrequently: true });

    // --- INICIALIZACIÓN Y EVENTOS ---
    document.querySelectorAll('.collapsible-header').forEach(header => header.addEventListener('click', () => header.parentElement.classList.toggle('active')));
    mapImageInput.addEventListener('change', handleImageUpload);
    saveStateBtn.addEventListener('click', saveState);
    loadStateBtn.addEventListener('click', loadState);
    gridToggle.addEventListener('change', e => { gridVisible = e.target.checked; drawGrid(); });
    gridColorInput.addEventListener('input', e => { gridColor = e.target.value; drawGrid(); });
    gridOpacityInput.addEventListener('input', e => { gridOpacity = parseFloat(e.target.value); drawGrid(); });
    brushModeInputs.forEach(input => input.addEventListener('change', e => brushMode = e.target.value));
    brushSizeInput.addEventListener('input', e => brushSize = parseInt(e.target.value));
    cellSizeInput.addEventListener('change', updateCellSize);
    addTokenBtn.addEventListener('click', addToken);
    updateTokenBtn.addEventListener('click', updateSelectedToken);
    deselectTokenBtn.addEventListener('click', deselectToken);
    toggleVisionBtn.addEventListener('click', toggleVisionMode);
    resetFogBtn.addEventListener('click', resetFog);
    visionCanvas.addEventListener('mousedown', handleLayerMouseDown);
    tokensLayer.addEventListener('mousedown', handleLayerMouseDown);
    document.addEventListener('mousemove', handleLayerMouseMove);
    document.addEventListener('mouseup', handleLayerMouseUp);
    tokensLayer.addEventListener('click', handleLayerClick);
    healthModifierBtns.forEach(btn => btn.addEventListener('click', () => applyHealthChange(parseInt(btn.dataset.amount))));
    healthModifierInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const amount = parseInt(healthModifierInput.value); if (!isNaN(amount)) { applyHealthChange(amount); healthModifierInput.value = ''; } } });
    edit_tokenHealthMax.addEventListener('change', () => { if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; const newMax = parseInt(edit_tokenHealthMax.value) || 0; token.health_max = newMax; if (token.health_current > newMax) { token.health_current = newMax; healthDisplay.textContent = token.health_current; } healthDisplay.className = `health-display ${getHealthColorClass(token.health_current, token.health_max)}`; updateTokenList(); });

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            return;
        }

        // Actualizamos el span con el nombre del archivo
        fileNameDisplay.textContent = file.name;

        const reader = new FileReader();
        reader.onload = e => loadNewMap(e.target.result);
        reader.readAsDataURL(file);
    }
    function loadNewMap(src) { mapImage.onload = () => { resizeAllCanvas(); visionModeActive = false; toggleVisionBtn.textContent = 'Iniciar Visión Dinámica'; visionCanvas.style.display = 'none'; clearRevealedBuffer(); removeAllTokens(); drawGrid(); }; mapImage.src = src; }
    function resizeAllCanvas() { const w = mapImage.naturalWidth, h = mapImage.naturalHeight; mapContainer.style.width = `${w}px`; mapContainer.style.height = `${h}px`;[gridCanvas, visionCanvas, revealedBufferCanvas].forEach(c => { c.width = w; c.height = h; }); if (visionModeActive) drawVision(); drawGrid(); }

    // --- GESTIÓN DE ESTADO (Corregida) ---
    function saveState() {
        if (!mapImage.src) { alert("No hay un mapa cargado para guardar."); return; }
        const state = {
            mapSrc: mapImage.src, cellSize: cellSize,
            tokens: tokens.map(t => ({
                id: t.id, type: t.type, name: t.name, letter: t.letter, turn: t.turn,
                health_max: t.health_max, health_current: t.health_current, // FIX: Guardar campos correctos
                notes: t.notes, color: t.color, borderColor: t.borderColor,
                visionRadius: t.visionRadius, x: t.x, y: t.y, size: t.size, isDiscovered: t.isDiscovered
            })),
            revealedFogData: revealedBufferCanvas.toDataURL(),
            gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity }
        };
        localStorage.setItem('dndMapState', JSON.stringify(state));
        alert("¡Escena guardada en el navegador!");
    }

    function loadState() {
        const savedStateJSON = localStorage.getItem('dndMapState');
        if (!savedStateJSON) { alert("No hay ninguna escena guardada."); return; }
        const state = JSON.parse(savedStateJSON);
        removeAllTokens();
        mapImage.onload = () => {
            resizeAllCanvas();
            cellSize = state.cellSize; cellSizeInput.value = cellSize;
            gridVisible = state.gridSettings.visible; gridColor = state.gridSettings.color; gridOpacity = state.gridSettings.opacity;
            gridToggle.checked = gridVisible; gridColorInput.value = gridColor; gridOpacityInput.value = gridOpacity;
            drawGrid();
            const fogImg = new Image();
            fogImg.onload = () => { revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height); revealedBufferCtx.drawImage(fogImg, 0, 0); if (visionModeActive) drawVision(); };
            fogImg.src = state.revealedFogData;
            state.tokens.forEach(tokenData => recreateToken(tokenData));
            updateTokenList();
            alert("Escena cargada.");
        };
        mapImage.src = state.mapSrc;
    }

    // --- GESTIÓN DE FICHAS ---
    function addToken() {
        const letter = add_tokenLetter.value.trim(), name = add_tokenName.value.trim(), vision = parseInt(add_tokenVision.value);
        if (!letter || !name || isNaN(vision)) { alert("Por favor, rellena los campos obligatorios (*): Nombre, Letra y Visión."); return; }
        const initialHealth = parseInt(add_tokenHealth.value) || 0;
        const tokenData = {
            id: Date.now(), type: document.querySelector('input[name="tokenType"]:checked').value, name: name, letter: letter,
            turn: parseInt(add_tokenTurn.value) || 0, health_max: initialHealth, health_current: initialHealth,
            notes: add_tokenNotes.value, color: add_tokenColor.value,
            borderColor: add_addBorderCheckbox.checked ? add_tokenBorderColor.value : null,
            visionRadius: vision, x: 20, y: 20, size: cellSize,
            isDiscovered: document.querySelector('input[name="tokenType"]:checked').value === 'player',
        };
        recreateToken(tokenData);
        updateTokenList();
        if (visionModeActive) drawVision();
    }

    function recreateToken(tokenData) {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token';
        tokenElement.dataset.id = tokenData.id;
        // FIX: Asegurar que los datos de vida existen si se carga una escena antigua
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
        el.style.lineHeight = `${token.size}px`; el.style.backgroundColor = token.color;
        el.style.border = token.borderColor ? `3px solid ${token.borderColor}` : 'none';
        el.textContent = token.letter;
        if (visionModeActive && token.type === 'enemy') { el.classList.toggle('hidden-enemy', !token.isDiscovered); } else { el.classList.remove('hidden-enemy'); }
    }

    function removeAllTokens() { tokens = []; tokensLayer.innerHTML = ''; updateTokenList(); deselectToken(); }
    function deleteToken(tokenId) { tokens = tokens.filter(t => t.id !== tokenId); const el = tokensLayer.querySelector(`.token[data-id="${tokenId}"]`); if (el) el.remove(); if (selectedTokenId === tokenId) deselectToken(); updateTokenList(); if (visionModeActive) drawVision(); }

    // --- LISTA DE FICHAS (Corregida) ---
    function updateTokenList() {
        tokenListUl.innerHTML = '';
        const sortedTokens = [...tokens].sort((a, b) => b.turn - a.turn);
        sortedTokens.forEach(token => {
            const li = document.createElement('li');
            li.dataset.id = token.id;
            const typeIcon = token.type === 'player' ? '🛡️' : '👹';
            const borderStyle = token.borderColor ? `border: 3px solid ${token.borderColor};` : 'none';
            // FIX: Template literal corregido para mostrar el contenido
            li.innerHTML = `
                <div class="token-list-preview" style="background-color: ${token.color}; ${borderStyle}">
                    ${token.letter}
                </div>
                <div class="token-list-header">
                    <span>${typeIcon}</span>
                    <span>${token.name}</span>
                </div>
                <div class="token-list-details">
                    <span>Turno: ${token.turn}</span>
                    <span>❤️ Vida: ${token.health_current}/${token.health_max}</span>
                    <span>👁️ Vis: ${token.visionRadius}</span>
                </div>
                <button class="delete-token-btn" data-id="${token.id}" title="Eliminar Ficha">X</button>
            `;
            tokenListUl.appendChild(li);
        });
        tokenListUl.querySelectorAll('.delete-token-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); deleteToken(parseInt(e.target.dataset.id)); }));
        tokenListUl.querySelectorAll('li').forEach(li => li.addEventListener('click', e => selectToken(parseInt(e.currentTarget.dataset.id))));
    }

    // --- SELECCIÓN Y EDICIÓN (Corregida) ---
    function selectToken(tokenId) {
        if (selectedTokenId === tokenId) return;
        deselectToken();
        selectedTokenId = tokenId;
        const token = tokens.find(t => t.id === tokenId);
        if (!token) return;

        token.element.classList.add('selected');
        selectedTokenSection.classList.add('has-selection', 'active');

        // FIX: Poblar TODOS los campos del editor correctamente
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

    function deselectToken() { if (!selectedTokenId) return; const oldToken = tokens.find(t => t.id === selectedTokenId); if (oldToken) oldToken.element.classList.remove('selected'); selectedTokenId = null; selectedTokenSection.classList.remove('has-selection'); }

    function updateSelectedToken() {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        token.name = edit_tokenName.value.trim();
        token.letter = edit_tokenLetter.value.trim();
        token.turn = parseInt(edit_tokenTurn.value) || 0;
        token.visionRadius = parseInt(edit_tokenVision.value) || 0;
        token.health_max = parseInt(edit_tokenHealthMax.value) || 0;
        token.color = edit_tokenColor.value;
        token.borderColor = edit_tokenBorderColor.value;
        token.notes = edit_tokenNotes.value;

        if (!token.name || !token.letter) { alert("El nombre y la letra no pueden estar vacíos."); return; }

        if (token.health_current > token.health_max) { token.health_current = token.health_max; }

        updateTokenElementStyle(token);
        updateTokenList();
        selectToken(token.id); // Re-seleccionar para actualizar el display de vida por si acaso
        if (visionModeActive) drawVision();
    }

    // --- LÓGICA DE CONTROLES DE VIDA (Mejorada) ---
    function getHealthColorClass(current, max) { if (max === 0) return 'health-mid'; const percentage = (current / max) * 100; if (percentage <= 10) return 'health-critical'; if (percentage <= 40) return 'health-low'; if (percentage <= 70) return 'health-mid'; return 'health-high'; }

    function showDamageFloat(amount, token) {
        if (amount === 0) return;
        // Animación en el panel
        const panelFloat = document.createElement('div');
        panelFloat.className = 'damage-float';
        panelFloat.textContent = `${amount > 0 ? '+' : ''}${amount}`;
        panelFloat.classList.add(amount > 0 ? 'heal' : 'damage');
        healthDisplayContainer.appendChild(panelFloat);
        setTimeout(() => panelFloat.remove(), 1000);

        // FEATURE: Animación sobre la ficha en el mapa
        const mapFloat = document.createElement('div');
        mapFloat.className = 'damage-float';
        mapFloat.textContent = `${amount > 0 ? '+' : ''}${amount}`;
        mapFloat.classList.add(amount > 0 ? 'heal' : 'damage');
        mapFloat.style.left = `${token.x + token.size / 2}px`;
        mapFloat.style.top = `${token.y}px`; // Nace en la parte superior del token
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

        // FEATURE: Animación y sonido en la ficha
        const tokenElement = token.element;
        if (actualChange < 0) {
            damageSound.currentTime = 0;
            damageSound.play();
            tokenElement.classList.add('token-damaged');
            setTimeout(() => tokenElement.classList.remove('token-damaged'), 400);
        } else if (actualChange > 0) {
            healSound.currentTime = 0;
            healSound.play();
            tokenElement.classList.add('token-healed');
            setTimeout(() => tokenElement.classList.remove('token-healed'), 500);
        }
    }

    // --- MANEJO DE RATÓN Y RESTO DE FUNCIONES (Sin cambios estructurales) ---
    function handleLayerMouseDown(event) { const tokenElement = event.target.closest('.token'); if (tokenElement) { const tokenId = parseInt(tokenElement.dataset.id); const token = tokens.find(t => t.id === tokenId); if (token && (token.type === 'player' || !visionModeActive || token.isDiscovered)) { currentDraggedToken = token; const tokenRect = token.element.getBoundingClientRect(); const mapRect = mapContainer.getBoundingClientRect(); dragOffsetX = event.clientX - tokenRect.left; dragOffsetY = event.clientY - tokenRect.top; currentDraggedToken.element.style.zIndex = 100; } } else if (visionModeActive && event.target === visionCanvas) { isPaintingFog = true; paintFog(event); } }
    function handleLayerMouseMove(event) { if (currentDraggedToken) { const mapRect = mapContainer.getBoundingClientRect(); let newX = event.clientX - mapRect.left - dragOffsetX, newY = event.clientY - mapRect.top - dragOffsetY; newX = Math.max(0, Math.min(newX, mapContainer.offsetWidth - currentDraggedToken.size)); newY = Math.max(0, Math.min(newY, mapContainer.offsetHeight - currentDraggedToken.size)); currentDraggedToken.x = newX; currentDraggedToken.y = newY; currentDraggedToken.element.style.left = `${newX}px`; currentDraggedToken.element.style.top = `${newY}px`; if (visionModeActive) drawVision(); } else if (isPaintingFog) { paintFog(event); } }
    function handleLayerMouseUp() { if (currentDraggedToken) { currentDraggedToken.element.style.zIndex = ''; if (visionModeActive) drawVision(); currentDraggedToken = null; } isPaintingFog = false; }
    function handleLayerClick(event) { if (event.detail > 1) return; setTimeout(() => { if (currentDraggedToken) return; const tokenElement = event.target.closest('.token'); if (tokenElement) { selectToken(parseInt(tokenElement.dataset.id)); } else { deselectToken(); } }, 150); }
    function toggleVisionMode() { visionModeActive = !visionModeActive; toggleVisionBtn.textContent = visionModeActive ? 'Detener Visión Dinámica' : 'Iniciar Visión Dinámica'; visionCanvas.style.pointerEvents = visionModeActive ? 'auto' : 'none'; if (visionModeActive) { visionCanvas.style.display = 'block'; updateAllTokenVisibility(); drawVision(); } else { visionCanvas.style.display = 'none'; ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height); updateAllTokenVisibility(); } }
    function updateAllTokenVisibility() { tokens.forEach(token => updateTokenElementStyle(token)); }
    function clearRevealedBuffer() { revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height); }
    function resetFog() { if (!confirm("¿Estás seguro de que quieres reiniciar toda la niebla de guerra? Esta acción no se puede deshacer.")) return; clearRevealedBuffer(); if (visionModeActive) { tokens.forEach(t => { if (t.type === 'enemy') t.isDiscovered = false; }); drawVision(); updateAllTokenVisibility(); } }
    function paintFog(event) { if (!visionModeActive) return; const mapRect = visionCanvas.getBoundingClientRect(); const x = event.clientX - mapRect.left, y = event.clientY - mapRect.top; revealedBufferCtx.globalCompositeOperation = brushMode === 'reveal' ? 'source-over' : 'destination-out'; revealedBufferCtx.fillStyle = 'white'; revealedBufferCtx.beginPath(); revealedBufferCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2); revealedBufferCtx.fill(); renderFogFromBuffer(); checkEnemyDiscovery(); }
    function renderFogFromBuffer() { ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height); ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; ctx.fillRect(0, 0, visionCanvas.width, visionCanvas.height); ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(revealedBufferCanvas, 0, 0); ctx.globalCompositeOperation = 'source-over'; }
    function checkEnemyDiscovery() { tokens.filter(t => t.type === 'enemy' && !t.isDiscovered).forEach(enemy => { const data = revealedBufferCtx.getImageData(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, 1, 1).data; if (data[3] > 0) { enemy.isDiscovered = true; updateTokenElementStyle(enemy); } }); }
    function drawVision() { if (!visionModeActive) return; tokens.filter(t => t.type === 'player').forEach(pToken => { const centerX = pToken.x + pToken.size / 2, centerY = pToken.y + pToken.size / 2; const visionRadiusPixels = pToken.visionRadius * cellSize; revealedBufferCtx.globalCompositeOperation = 'source-over'; revealedBufferCtx.fillStyle = 'white'; revealedBufferCtx.beginPath(); revealedBufferCtx.arc(centerX, centerY, visionRadiusPixels, 0, Math.PI * 2); revealedBufferCtx.fill(); }); renderFogFromBuffer(); checkEnemyDiscovery(); }
    function updateCellSize() { const newSize = parseInt(cellSizeInput.value); if (isNaN(newSize) || newSize < 10) { cellSizeInput.value = cellSize; return; } cellSize = newSize; tokens.forEach(token => { token.size = cellSize; updateTokenElementStyle(token); }); drawGrid(); if (visionModeActive) drawVision(); }
    function drawGrid() { const w = gridCanvas.width, h = gridCanvas.height; gridCtx.clearRect(0, 0, w, h); if (!gridVisible || cellSize <= 0) return; gridCtx.strokeStyle = gridColor; gridCtx.globalAlpha = gridOpacity; gridCtx.lineWidth = 1; gridCtx.beginPath(); for (let x = cellSize; x < w; x += cellSize) { gridCtx.moveTo(x, 0); gridCtx.lineTo(x, h); } for (let y = cellSize; y < h; y += cellSize) { gridCtx.moveTo(0, y); gridCtx.lineTo(w, y); } gridCtx.stroke(); gridCtx.globalAlpha = 1.0; }
});