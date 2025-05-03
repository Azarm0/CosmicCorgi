// --- Strict Mode ---
'use strict';

// === Global Variables ===
// ... (Keep ALL declarations as before) ...
let canvas = null, ctx = null, scoreDisplay = null, finalScoreDisplay = null, gameOverScreen = null,
    restartButton = null, instructions = null, shieldIndicator = null, shieldTimerDisplay = null,
    // ... Keep other element refs ...
    loadingScreen = null, gameContent = null, debugInfo = null, pauseOverlay = null;
let audioContext; let masterGain; let bgMusicGainNode;
const audioBuffers = {};
const soundPaths = { collect:'collect.wav',hit:'hit.wav',powerup:'powerup.wav',shieldHit:'shield_hit.wav',click:'click.wav',shoot:'shoot.wav',laserWarn:'laser_warn.wav',laserFire:'laser_fire.wav',combo:'combo.wav',bgMusic:'background.mp3', swarmer_hit:'hit.wav'};
let bgMusicSourceNode = null;
// ... (Keep ALL Settings) ...
// ... (Keep ALL State variables, including the ones added back like isBossFight) ...
let score = 0; let player = null; let mousePos = { x: 0, y: 0 };
// ... etc ...
let starBits = 0; let shopUpgrades = {}; let frameCounter = 0;
let playerLevel = 1; let playerXP = 0; let xpToNextLevel = xpPerLevelBase;


// === FUNCTION DEFINITIONS ===

// --- Initialization Helper ---
function getElements() { /* ... (Keep as is) ... */ }

// --- Asset Loading & Setup ---
function initAudioContext() { // Modified for early creation, resume later
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.gain.setValueAtTime(0.6, audioContext.currentTime);
            masterGain.connect(audioContext.destination);
            bgMusicGainNode = audioContext.createGain();
            bgMusicGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            bgMusicGainNode.connect(masterGain);
            console.log(`AudioContext Initialized (${audioContext.state}). Needs Resume.`);
            // IMPORTANT: DO NOT try resume here, only on user gesture
        } catch (e) { console.error("Audio API Error", e); audioContext = null; }
    }
}
// Define resume function separately
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume()
            .then(() => console.log("AudioContext Resumed OK."))
            .catch(e => console.error("AudioContext resume failed:", e));
    } else if (audioContext) {
         console.log("AudioContext already running or in unexpected state:", audioContext.state);
    } else {
        console.warn("Cannot resume: AudioContext not initialized.");
    }
}
async function loadSound(url){/* ... (Keep as is) ... */}
function loadStorageItem(k,dV){/* ... (Keep as is) ... */}
function saveStorageItem(k,v){/* ... (Keep as is) ... */}
function loadAchievements(){/* ... (Keep as is) ... */}
function saveAchievements(){/* ... (Keep as is) ... */}
function loadShopUpgrades(){/* ... (Keep as is) ... */}
function saveShopUpgrades(){/* ... (Keep as is) ... */}
function loadCurrency(){/* ... (Keep as is) ... */}
function saveCurrency(){/* ... (Keep as is) ... */}
function updateCurrencyDisplay(){/* ... (Keep as is) ... */}
function loadLevelProgress(){/* ... (Keep as is) ... */}
function saveLevelProgress(){/* ... (Keep as is) ... */}
function updateLoadingStatus(text){/* ... (Keep as is) ... */}

async function loadAssets() {
    // (Keep as is - calls finishInitialization at end)
    console.log("loadAssets START"); updateDebugInfo("Loading Assets");
    updateLoadingStatus("Audio Init..."); initAudioContext(); if (!audioContext) console.warn("Audio Skip");
    updateLoadingStatus("Loading Sounds..."); const promises=[]; let loadedCnt=0; const totalSnd=Object.keys(soundPaths).length;
    if(audioContext){for(const k in soundPaths){promises.push(loadSound(soundPaths[k]).then(b=>{if(b)audioBuffers[k]=b;loadedCnt++;updateLoadingStatus(`Sounds(${loadedCnt}/${totalSnd})`);}).catch(e=>{loadedCnt++;updateLoadingStatus(`Sounds(${loadedCnt}/${totalSnd})Err`);console.error(`Snd load err ${k}`,e)}))}}else{updateLoadingStatus("Audio failed");}
    updateLoadingStatus("Loading Data..."); try{loadAchievements();loadShopUpgrades();loadCurrency();loadLevelProgress();}catch(e){console.error("Storage load err",e);}
    try{await Promise.all(promises);console.log("Asset promises resolved.")}catch(e){console.error("Asset promise all err",e);updateDebugInfo("Error Loading Assets");}
    assetsLoaded=true;console.log("Asset loading complete."); updateLoadingStatus("Assets Loaded!");updateDebugInfo("Assets Loaded");
    finishInitialization();
}

function finishInitialization() {
    // (Keep as is - calls setupEventListeners at end)
    console.log("finishInitialization...");
    if (!canvas || !ctx) { console.error("FinishInit: Canvas/Ctx fail!"); return; }
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (gameContent) gameContent.classList.remove('hidden');
    try{populateAchievementsList(); populateShopList();}catch(e){console.error("Populate lists err",e);}
    resetGameVariables(false); // Load progress
    drawInitialState();
    if (instructions) instructions.innerHTML="Click or Move Mouse to Start!";
    updateDebugInfo("Ready");
    if (!setupEventListeners()){ console.error("Listener setup failed!"); updateDebugInfo("ERROR: Listener Setup");}
    else { console.log("Initialization complete. Waiting for interaction."); }
}

// --- AUDIO PLAYBACK --- (Keep as is)
function playSound(bName,pRate=1.0,vol=1.0){/*...*/} function playBgMusic(){/*...*/} function stopBgMusic(){/*...*/}

// === UTILITY & EFFECTS === (Keep all as is)
function random(min,max){/*...*/} function getDistance(x1,y1,x2,y2){/*...*/} function triggerScreenShake(i,d){/*...*/} class FloatingText{/*...*/} function addFloatingText(t,x,y,c,s,d){/*...*/} function updateFloatingTexts(dt){/*...*/} function drawFloatingTexts(ctx){/*...*/} class Particle{/*...*/} function spawnParticles(x,y,cnt,clr,s,sp,l,fr,gr,shrk){/*...*/} function updateParticles(dt){/*...*/} function drawParticles(ctx){/*...*/} function notifyAchievement(key){/*...*/} function checkAchievements(){/*...*/} function updateFlashEffect(dt){/*...*/} function drawFlash(alpha,color='white'){/*...*/} function updateDebugInfo(text){/*...*/}

// === LEVELING SYSTEM === (Keep as is)
function updateXPBar(){/*...*/} function addXP(amt){/*...*/}

// === DRAWING FUNCTIONS === (Keep all as is)
function drawPlayer(ctx){/*...*/} function drawProjectile(p){/*...*/} function drawTreat(treat){/*...*/} function drawJunk(item){/*...*/} function drawMine(item){/*...*/} function drawLaserJunk(item){/*...*/} function drawPowerup(item){/*...*/} function drawBackground(dt){/*...*/} function drawBossShot(item){/*...*/} function drawSwarmer(item){/*...*/}

// === GAME LOGIC & UPDATES === (Keep all as is)
function incrementCombo(){/*...*/} function resetCombo(){/*...*/} function updateCombo(dt){/*...*/} function spawnItems(dt){/*...*/} function updatePlayer(dt){/*...*/} function handleShooting(ts){/*...*/} function updateProjectiles(dt){/*...*/} function updateItems(dt){/*...*/} function updateDifficulty(dt){/*...*/}

// === BOSS LOGIC === (Keep all as is)
class Boss{/*...*/} function bossPattern_SpreadShot(b,dt,st){/*...*/} function bossPattern_SummonMinions(b,dt,st){/*...*/} function bossPattern_BeamSweep(b,dt,st){/*...*/} function drawBossBeam(b,ctx){/*...*/} function checkBossTrigger(){/*...*/} function updateProjectiles_Boss(dt){/*...*/} function updateItems_Boss(dt){/*...*/}

// === GAME STATE & LOOP ===
function resetGameVariables(resetProgress=false){/* ... (Keep as is) ... */}
function initializeBackgroundElements(){/* ... (Keep as is) ... */}
function drawInitialState(){/* ... (Keep as is) ... */}

function startGame(isRestart=false){
    console.log("Attempt startGame. Restart:", isRestart);
    if (!assetsLoaded || !canvas || !ctx) { console.warn("Start aborted."); return; }
    if (isRestart) { resetGameVariables(false); } // Keep progress on restart

    isPaused = false; gameOver = false;
    console.log("Starting Loop");
    updateCurrencyDisplay(); updateXPBar();
    if(scoreDisplay)scoreDisplay.textContent=`Score:${score}`;
    // Reset UI states
    if(comboIndicator){comboIndicator.textContent=`Combo: x1`;comboIndicator.classList.remove('active');}
    if(gameOverScreen)gameOverScreen.classList.add('hidden');
    if(shieldIndicator)shieldIndicator.classList.add('hidden');
    if(multiplierIndicator)multiplierIndicator.classList.add('hidden');
    if(rapidFireIndicator)rapidFireIndicator.classList.add('hidden');
    if(bossHealthBarContainer)bossHealthBarContainer.classList.add('hidden');
    if(instructions)instructions.innerHTML="Move:Mouse|Shoot:Click|Pause:P/Esc";
    if(canvas)canvas.style.cursor='none';
    // Try BGM
    if (audioContext && audioContext.state === 'running') { playBgMusic(); }
    else { console.warn("Starting loop but audio not running for BGM yet."); }

    lastTimestamp = performance.now(); // Ensure timestamp is reset
    if(animationFrameId) cancelAnimationFrame(animationFrameId); // Clear previous loop
    animationFrameId = null; // Reset id
    console.log("Requesting FIRST animation frame...");
    updateDebugInfo("Playing"); // Update status before loop starts
    animationFrameId = requestAnimationFrame(gameLoop); // Start the loop
    console.log("startGame FINISHED");
}

function showGameOver(){/* ... (Keep as is) ... */}
function togglePause(){/* ... (Keep as is) ... */}

function gameLoop(ts){
    // Add log at the very start
    // console.log(`gameLoop - Time: ${ts.toFixed(0)}, Paused: ${isPaused}, GameOver: ${gameOver}`);
    if (isPaused || gameOver){ return; } // Primary exit condition
    if (!ctx || !canvas){ console.error("Ctx/Canvas lost!"); showGameOver(); return; } // Safety check

    frameCounter++;
    const dt=Math.min(0.05,(ts-lastTimestamp)/1000); // Delta time calculation
    lastTimestamp=ts;

    // --- Updates ---
    handleShooting(ts); updatePlayer(dt); updateFlashEffect(dt);
    if(isBossFight&&currentBoss){currentBoss.update(dt);updateProjectiles_Boss(dt);updateItems_Boss(dt);}
    else{checkBossTrigger();updateProjectiles(dt);updateItems(dt);spawnItems(dt);}
    if(gameOver){ showGameOver(); return; } // Check game over *after* all updates
    updateDifficulty(dt);updateParticles(dt);updateFloatingTexts(dt);updateCombo(dt);

    // --- Drawing ---
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let shX=0,shY=0; if(screenShakeIntensity>0&&screenShakeDuration>0){shX=(Math.random()-.5)*2*screenShakeIntensity;shY=(Math.random()-.5)*2*screenShakeIntensity;}
    ctx.save();ctx.translate(shX,shY);
    drawBackground(dt); drawParticles(ctx); treats.forEach(drawTreat); powerups.forEach(drawPowerup);
    junk.forEach(item=>{if(item.dying)return;if(item.type===junkTypes.MINE)drawMine(item);else if(item.type===junkTypes.LASER)drawLaserJunk(item);else if(item.type===junkTypes.BOSS_SHOT)drawBossShot(item);else if(item.type===junkTypes.SWARMER)drawSwarmer(item);else drawJunk(item);});
    projectiles.forEach(drawProjectile); if(isBossFight&&currentBoss){currentBoss.draw(ctx);}
    drawPlayer(ctx); drawFloatingTexts(ctx); drawFlash(flashEffectTimer>0?flashEffectTimer/.2:0,flashEffectColor);
    ctx.fillStyle='#444';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText(`F:${frameCounter}`,5,canvas.height-5);
    ctx.restore(); // Restore from shake

    // Update shake duration
    if(screenShakeDuration>0){screenShakeDuration-=dt;if(screenShakeDuration<=0)screenShakeIntensity=0;}else screenShakeIntensity=0;

    // Loop!
    animationFrameId=requestAnimationFrame(gameLoop);
}


// === UI MODAL FUNCTIONS === (Keep as is)
function openModal(mId){/*...*/} function closeModal(mId){/*...*/} function populateAchievementsList(){/*...*/} function getShopItemCurrentCost(k){/*...*/} function populateShopList(){/*...*/} function buyShopItem(k){/*...*/} function applyShopUpgrades(){/*...*/}

// === EVENT LISTENERS SETUP ===
function setupEventListeners() {
    console.log("Setting up Event Listeners...");
    if (!canvas || !restartButton || !achievementsButton || !shopButton || !achievementsModal || !shopModal) {
        console.error("SetupEventListeners: One or more essential elements missing."); return false;
    }
    try {
        // Canvas listeners try to resume audio context FIRST
        canvas.addEventListener('mousemove',(e)=>{ resumeAudioContext(); handleFirstInteraction(); if(!isPaused){const r=canvas.getBoundingClientRect();mousePos.x=e.clientX-r.left;mousePos.y=e.clientY-r.top;} });
        canvas.addEventListener('mousedown',(e)=>{ resumeAudioContext(); handleFirstInteraction(); if(e.button===0&&!isPaused)mouseIsDown=true; });
        canvas.addEventListener('mouseup',(e)=>{ if(e.button===0)mouseIsDown=false; });
        canvas.addEventListener('mouseleave',()=>{ mouseIsDown=false; });
        // Other button listeners
        achievementsButton.addEventListener('click',()=>openModal('achievementsModal'));
        shopButton.addEventListener('click',()=>openModal('shopModal'));
        window.addEventListener('click',(e)=>{if(e.target===achievementsModal)closeModal('achievementsModal');if(e.target===shopModal)closeModal('shopModal');});
        restartButton.addEventListener('click',()=>{if(gameOverScreen)gameOverScreen.classList.add('hidden');if(instructions)instructions.style.display='block';playSound('click');stopBgMusic();interactionDone=false;isPaused=true;resetGameVariables(false);drawInitialState();if(instructions)instructions.innerHTML="Click or Move Mouse to Start!";updateDebugInfo("Ready for Restart");});
        document.addEventListener('keydown',(e)=>{if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(assetsLoaded&&!gameOver&&!loadingScreen?.classList.contains('hidden')){togglePause();}}});
        console.log("Event Listeners Setup Complete.");
        return true;
    } catch (error) { console.error("Error attaching listeners:", error); return false; }
}

// === INTERACTION & GAME START ===
function handleFirstInteraction(){
    if (interactionDone) return;
    interactionDone = true; // Only run startup once
    console.log("First Interaction Processing...");
    // Audio should have been resumed by the event listener directly
    if (assetsLoaded) {
        console.log("Assets ready, starting game.");
        startGame(); // Directly start game
    } else {
        console.error("CRITICAL: Interaction happened but assets aren't loaded!");
        updateDebugInfo("ERROR: Assets Missing");
    }
}

// === INITIALIZATION POINT ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Initializing...");
    if (getElements()) {
        // Setup listeners immediately after elements are found
        if (!setupEventListeners()) {
            console.error("Setup aborted: Listeners failed.");
            updateDebugInfo("ERROR: Listener Fail");
            return; // Stop if listeners fail
        }
        // Start loading assets AFTER listeners are setup
        loadAssets();
    } else {
        console.error("Setup aborted: Elements missing.");
        // Error already shown by getElements
    }
});