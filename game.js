// --- Strict Mode ---
'use strict';

// === Global Variables ===
// DOM Element References
let canvas, ctx, scoreDisplay, finalScoreDisplay, gameOverScreen, restartButton, instructions,
    shieldIndicator, shieldTimerDisplay, multiplierIndicator, multiplierTimerDisplay,
    rapidFireIndicator, rapidFireTimerDisplay, comboIndicator, loadingScreen, gameContent,
    achievementNotifier, achievementTitle, achievementDesc, bossHealthBarContainer, bossNameDisplay,
    bossHealthFill, achievementsButton, shopButton, achievementsModal, achievementsList,
    shopModal, shopItemsList, currencyDisplay, shopStarBitsDisplay, debugInfo, levelDisplay,
    xpBarFill, xpText, pauseOverlay, loadingStatus; // Added loadingStatus

// Web Audio
let audioContext; let masterGain; let bgMusicGainNode;
const audioBuffers = {};
const soundPaths = { collect:'collect.wav',hit:'hit.wav',powerup:'powerup.wav',shieldHit:'shield_hit.wav',click:'click.wav',shoot:'shoot.wav',laserWarn:'laser_warn.wav',laserFire:'laser_fire.wav',combo:'combo.wav',bgMusic:'background.mp3' };
let bgMusicSourceNode = null;

// Game Settings
const playerRadius = 26; const playerBaseShootCooldown = 0.18; const playerRapidFireCooldown = 0.07;
const playerProjectileSpeed = 13; const playerProjectileRadius = 5;
const playerMaxTiltAngle = 0.15; const playerTiltSpeed = 0.1;
const treatRadius = 16; const junkRadius = 20; const mineRadius = 22;
const laserJunkRadius = 24; const powerupRadius = 18;
const initialSpawnRate = 2.0; const spawnRateIncrease = 0.05;
const initialSpeed = 3.0; const speedIncrease = 0.08;
const powerupSpawnChance = 0.08; const mineSpawnChance = 0.08; const laserJunkSpawnChance = 0.12;
const shieldDuration = 5.0; const multiplierDuration = 6.0; const rapidFireDuration = 5.0;
const emergencyShieldDuration = 15.0;
const comboTimeout = 2.0; const maxCombo = 10; const minePulseSpeed = 0.009;
const nebulaCount = 5; const scoreIncrementPerBoss = 3000;
const playerBaseScoreMultiplier = 1.0;
const xpPerLevelBase = 100; const xpPerLevelFactor = 1.3;
const xpPerTreat = 1; const xpPerJunk = 2; const xpPerMine = 5;
const xpPerLaserJunk = 8; const xpPerBoss = 100;
const laserChargeTimeMin = 0.5; const laserChargeTimeMax = 1.2;

// Game State
let score = 0; let player = null; let mousePos = { x: 0, y: 0 };
let projectiles = []; let treats = []; let junk = []; let powerups = [];
let particles = []; let stars = []; let nebulas = []; let floatingTexts = [];
let currentSpawnRate = initialSpawnRate; let currentSpeed = initialSpeed; let lastSpawnTime = 0;
let gameOver = false; let animationFrameId = null; let gameTime = 0;
let screenShakeIntensity = 0; let screenShakeDuration = 0;
let comboCount = 0; let comboMultiplier = 1; let comboTimer = 0;
let assetsLoaded = false; let isPaused = true; let interactionDone = false;
let achievementTimeoutId = null; let flashEffectTimer = 0; let flashEffectColor = 'white';
let mouseIsDown = false; let isBossFight = false; let currentBoss = null;
let scoreForNextBoss = 1500; let lastTimestamp = 0; let nearingBossScore = false;
let starBits = 0; let shopUpgrades = {}; let frameCounter = 0;
let playerLevel = 1; let playerXP = 0; let xpToNextLevel = xpPerLevelBase;

// Types & Data
const junkColors=['#adb5bd','#8d99ae','#6c757d','#495057']; const junkTypes={NORMAL:'junk',MINE:'mine',LASER:'laser',BOSS_SHOT:'boss_shot'}; const powerupTypes={SHIELD:'shield',MULTIPLIER:'multiplier',RAPID_FIRE:'rapidFire'};
const achievements={score1k:{name:"Nebula Navigator",desc:"Reach 1,000!",unlocked:false,check:()=>score>=1000},score10k:{name:"Cosmic Contender",desc:"Reach 10,000!",unlocked:false,check:()=>score>=10000},combo5:{name:"Chain Reaction",desc:"Achieve x5 Combo!",unlocked:false,check:()=>comboMultiplier>=5},comboMax:{name:"Combo Ace!",desc:"Reach Max Combo!",unlocked:false,check:()=>comboMultiplier>=maxCombo},shieldSave:{name:"Close Call!",desc:"Block 10 hazards.",unlocked:false,count:0,check:()=>achievements.shieldSave.count>=10},boss1Defeat:{name:"Goliath Tamer",desc:"Defeat the Goliath!",unlocked:false,check:()=>false},level5:{name:"Level Up!",desc:"Reach Lvl 5.",unlocked:false,check:()=>playerLevel>=5},level10:{name:"Power!",desc:"Reach Lvl 10.",unlocked:false,check:()=>playerLevel>=10}};
const shopItems={startShield:{name:"Emergency Shield",desc:`Start w/ ${emergencyShieldDuration}s shield.`,cost:500,maxLevel:1,purchased:0,icon:'🛡️'},extraLife:{name:"Extra Life",desc:"Revive once per run.",cost:1500,maxLevel:1,purchased:0,icon:'❤️'},treatValue:{name:"Treat Magnetism",desc:"+Star Bits.",cost:300,costIncrease:2.0,maxLevel:5,level:0,valueBonus:.1,icon:'💰'},cooldownReduction:{name:"Faster Blaster",desc:"Wep Cooldown Down.",cost:750,costIncrease:2.5,maxLevel:3,level:0,cooldownFactor:.9,icon:'⚡'}};


// === FUNCTION DEFINITIONS ===

// --- Initialization Helper ---
function getElements() {
    // Assign to global variables
    try {
        canvas = document.getElementById('gameCanvas'); ctx = canvas?.getContext('2d');
        scoreDisplay = document.getElementById('score'); finalScoreDisplay = document.getElementById('finalScore');
        gameOverScreen = document.getElementById('gameOverScreen'); restartButton = document.getElementById('restartButton');
        instructions = document.getElementById('instructions'); shieldIndicator = document.getElementById('shieldIndicator');
        shieldTimerDisplay = document.getElementById('shieldTimer'); multiplierIndicator = document.getElementById('multiplierIndicator');
        multiplierTimerDisplay = document.getElementById('multiplierTimer'); rapidFireIndicator = document.getElementById('rapidFireIndicator');
        rapidFireTimerDisplay = document.getElementById('rapidFireTimer'); comboIndicator = document.getElementById('comboIndicator');
        loadingScreen = document.getElementById('loadingScreen'); loadingStatus = document.getElementById('loadingStatus');
        gameContent = document.getElementById('gameContent'); achievementNotifier = document.getElementById('achievementNotifier');
        achievementTitle = document.getElementById('achievementTitle'); achievementDesc = document.getElementById('achievementDesc');
        bossHealthBarContainer = document.getElementById('bossHealthBarContainer'); bossNameDisplay = document.getElementById('bossName');
        bossHealthFill = document.getElementById('bossHealthFill'); achievementsButton = document.getElementById('achievementsButton');
        shopButton = document.getElementById('shopButton'); achievementsModal = document.getElementById('achievementsModal');
        achievementsList = document.getElementById('achievementsList'); shopModal = document.getElementById('shopModal');
        shopItemsList = document.getElementById('shopItemsList'); currencyDisplay = document.getElementById('currencyDisplay');
        shopStarBitsDisplay = document.getElementById('shopStarBits'); debugInfo = document.getElementById('debugInfo');
        levelDisplay = document.getElementById('levelDisplay'); xpBarFill = document.getElementById('xpBarFill');
        xpText = document.getElementById('xpText'); pauseOverlay = document.getElementById('pauseOverlay');

        console.log("DOM Elements Referenced.");
        // Check essential elements needed before loading/game start
        if (!canvas || !ctx || !loadingScreen || !gameContent || !restartButton) {
            throw new Error("Core DOM elements missing!");
        }
        return true; // Success
    } catch (e) {
        console.error("CRITICAL ERROR getting DOM Elements:", e);
        // Try to display error even if loadingScreen is missing
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<h1 style="color:red; text-align:center; margin-top: 50px;">Error finding UI element: ${e.message}<br>Cannot start game. Check console (F12).</h1>`;
        }
        return false; // Failure
    }
}

// --- Asset Loading & Setup ---
function initAudioContext(){if(!audioContext){try{audioContext=new(window.AudioContext||window.webkitAudioContext)();masterGain=audioContext.createGain();masterGain.gain.setValueAtTime(.6,audioContext.currentTime);masterGain.connect(audioContext.destination);bgMusicGainNode=audioContext.createGain();bgMusicGainNode.gain.setValueAtTime(.3,audioContext.currentTime);bgMusicGainNode.connect(masterGain);console.log("AudioContext Initialized.")}catch(e){console.error("Web Audio API not supported",e);}}if(audioContext&&audioContext.state==='suspended')audioContext.resume().then(()=>console.log("AudioContext Resumed.")).catch(e=>console.error("Audio resume failed",e))}
async function loadSound(url){if(!audioContext)return null;try{const r=await fetch(url);if(!r.ok)throw new Error(`HTTP ${r.status} ${url}`);const b=await r.arrayBuffer();return await audioContext.decodeAudioData(b)}catch(e){console.error(`Sound Load Err ${url}`,e);return null}}
function loadStorageItem(k, dV){try{const i=localStorage.getItem(k);return i?JSON.parse(i):dV;}catch(e){console.error(`Parse Err ${k}`,e);return dV;}}
function saveStorageItem(k, v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){console.error(`Save Err ${k}`,e);}}
function loadAchievements(){const s=loadStorageItem('cosmicCorgiAchievements',{});for(const k in achievements){if(s&&s.hasOwnProperty(k)&&s[k].unlocked!==undefined)achievements[k].unlocked=s[k].unlocked;achievements[k].notified=achievements[k].unlocked;}console.log("Ach Loaded");}
function saveAchievements(){saveStorageItem('cosmicCorgiAchievements',achievements);}
function loadShopUpgrades(){const s=loadStorageItem('cosmicCorgiShop',{});shopUpgrades={};for(const k in shopItems){const df=shopItems[k];shopUpgrades[k]=s[k]||(df.maxLevel===1?{purchased:0}:{level:0});if(df.maxLevel===1)df.purchased=shopUpgrades[k].purchased;else df.level=shopUpgrades[k].level;}console.log("Shop Loaded");}
function saveShopUpgrades(){saveStorageItem('cosmicCorgiShop',shopUpgrades);}
function loadCurrency(){try{starBits=parseInt(localStorage.getItem('cosmicCorgiStarBits')||'0',10);}catch(e){starBits=0;}updateCurrencyDisplay();console.log("Bits:",starBits);}
function saveCurrency(){try{localStorage.setItem('cosmicCorgiStarBits',starBits.toString());}catch(e){console.error("Save Bits Err",e);}}
function updateCurrencyDisplay(){if(currencyDisplay)currencyDisplay.textContent=`★ ${starBits}`;if(shopStarBitsDisplay)shopStarBitsDisplay.textContent=starBits;}
function updateLoadingStatus(text) { if (loadingStatus) loadingStatus.textContent = text; }

async function loadAssets() {
    console.log("loadAssets START");
    updateDebugInfo("Loading Assets");
    if(loadingStatus) loadingStatus.textContent = "Initializing Audio...";
    initAudioContext();
    if (!audioContext) console.warn("AudioContext failed - sounds disabled.");

    if(loadingStatus) loadingStatus.textContent = "Loading Sounds...";
    const soundPromises = [];
    let loadedCount = 0;
    const totalSounds = Object.keys(soundPaths).length;

    if(audioContext) {
        for (const key in soundPaths) {
            soundPromises.push(
                loadSound(soundPaths[key]).then(buffer => {
                    if (buffer) audioBuffers[key] = buffer;
                    loadedCount++;
                    if(loadingStatus) loadingStatus.textContent = `Loading Sounds (${loadedCount}/${totalSounds})...`;
                }).catch(err => {
                    loadedCount++; // Count as attempted even on error
                    if(loadingStatus) loadingStatus.textContent = `Loading Sounds (${loadedCount}/${totalSounds})... (Error on ${key})`;
                    console.error(`Failed to load sound ${key}:`, err);
                })
            );
        }
    } else {
        if(loadingStatus) loadingStatus.textContent = "Audio failed. Skipping sounds.";
    }

    if(loadingStatus) loadingStatus.textContent = "Loading Save Data...";
    try { loadAchievements(); loadShopUpgrades(); loadCurrency(); } catch(e){ console.error("Storage load error:", e); }

    try {
        await Promise.all(soundPromises);
        console.log("Asset loading promises resolved.");
    } catch (error) {
        console.error("Asset loading Promise.all error:", error); // Should ideally not happen
    }

    assetsLoaded = true;
    console.log("Asset loading phase complete.");
    if(loadingStatus) loadingStatus.textContent = "Assets Loaded!";
    updateDebugInfo("Assets Loaded");

    // Call the function to update UI now that assets are loaded
    finishInitialization();
}

function finishInitialization() {
    console.log("finishInitialization: Setting up UI and initial state.");
    if (!canvas || !ctx) { console.error("FinishInit: Canvas/Context not ready!"); return; }

    // Hide loading, show game
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (gameContent) gameContent.classList.remove('hidden');

    try {
        if(populateAchievementsList) populateAchievementsList(); else console.warn("populateAchievementsList missing");
        if(populateShopList) populateShopList(); else console.warn("populateShopList missing");
    } catch(e) { console.error("Error populating lists:", e); }

    resetGameVariables(); // Set initial game state values
    drawInitialState(); // Draw the very first frame

    if (instructions) instructions.innerHTML = "Click or Move Mouse to Start!";
    updateDebugInfo("Ready");
    console.log("Initialization complete. Waiting for interaction.");
}


// === AUDIO PLAYBACK === (Keep as is)
function playSound(bName,pRate=1.0,vol=1.0){if(!audioContext||audioContext.state!=='running'||!audioBuffers[bName])return;try{const s=audioContext.createBufferSource();s.buffer=audioBuffers[bName];const g=audioContext.createGain();g.gain.setValueAtTime(vol*(masterGain?.gain.value??1.0),audioContext.currentTime);s.playbackRate.setValueAtTime(pRate,audioContext.currentTime);s.connect(g).connect(masterGain);s.start(0)}catch(e){if(e.name!=='AbortError')console.error(`Play sound err ${bName}:`,e)}}
function playBgMusic(){if(!audioContext||audioContext.state!=='running'||!audioBuffers.bgMusic||bgMusicSourceNode)return;try{stopBgMusic();bgMusicSourceNode=audioContext.createBufferSource();bgMusicSourceNode.buffer=audioBuffers.bgMusic;bgMusicSourceNode.loop=true;bgMusicSourceNode.connect(bgMusicGainNode);bgMusicSourceNode.start(0);console.log("BGM Start")}catch(e){console.error("BGM Err",e);bgMusicSourceNode=null;}}
function stopBgMusic(){if(bgMusicSourceNode){try{bgMusicSourceNode.stop(0);console.log("BGM Stop")}catch(e){}finally{try{bgMusicSourceNode.disconnect()}catch(e){}bgMusicSourceNode=null;}}}

// === UTILITY & EFFECTS === (Keep all utility funcs as is)
function random(min,max){return Math.random()*(max-min)+min}
function getDistance(x1,y1,x2,y2){let d=[x2-x1,y2-y1];return Math.sqrt(d[0]*d[0]+d[1]*d[1])}
function triggerScreenShake(i,d){screenShakeIntensity=Math.max(screenShakeIntensity,i);screenShakeDuration=Math.max(screenShakeDuration,d)}
class FloatingText{constructor(t,x,y,c='#fff',s=20,d=0.8){this.t=t;this.x=x;this.y=y;this.c=c;this.s=s;this.d=d;this.l=d;this.vy=-30}update(dt){this.l-=dt;this.y+=this.vy*dt;this.vy*=.98}draw(ctx){ctx.save();ctx.font=`bold ${this.s}px Nunito`;ctx.fillStyle=this.c;ctx.textAlign='center';ctx.globalAlpha=Math.max(0,this.l/this.d);ctx.fillText(this.t,this.x,this.y);ctx.restore()}}
function addFloatingText(t,x,y,c,s,d){floatingTexts.push(new FloatingText(t,x,y,c,s,d))}
function updateFloatingTexts(dt){for(let i=floatingTexts.length-1;i>=0;i--){floatingTexts[i].update(dt);if(floatingTexts[i].l<=0)floatingTexts.splice(i,1)}}
function drawFloatingTexts(ctx){if(!ctx)return;floatingTexts.forEach(ft=>ft.draw(ctx))}
class Particle{constructor(x,y,c,s,sp,l,fr=0.98,gr=0,shrk=0.97){this.x=x;this.y=y;this.c=c;this.s=random(s*.5,s*1.2);const a=Math.random()*Math.PI*2,v=random(sp*.5,sp*1.5);this.vx=Math.cos(a)*v;this.vy=Math.sin(a)*v;this.l=random(l*.7,l*1.3);this.iL=this.l;this.fr=fr;this.gr=gr;this.alpha=1.0;this.shrk=shrk}update(dt){this.l-=dt;this.alpha=Math.max(0,this.l/this.iL);this.vx*=this.fr;this.vy*=this.fr;this.vy+=this.gr;this.x+=this.vx*dt*60;this.y+=this.vy*dt*60;this.s*=this.shrk}draw(ctx){ctx.fillStyle=this.c;ctx.globalAlpha=this.alpha;ctx.beginPath();ctx.arc(this.x,this.y,Math.max(0,this.s),0,Math.PI*2);ctx.fill()}}
function spawnParticles(x,y,cnt,clr,s,sp,l,fr,gr,shrk){const bc=clr;for(let i=0;i<cnt;i++){let pc=bc;if(typeof bc==='string'&&bc.startsWith('#')){try{let v=Math.floor(random(-20,20)),r=parseInt(bc.slice(1,3),16)+v,g=parseInt(bc.slice(3,5),16)+v,b=parseInt(bc.slice(5,7),16)+v;r=Math.max(0,Math.min(255,r)).toString(16).padStart(2,'0');g=Math.max(0,Math.min(255,g)).toString(16).padStart(2,'0');b=Math.max(0,Math.min(255,b)).toString(16).padStart(2,'0');pc=`#${r}${g}${b}`}catch(e){pc=bc}}particles.push(new Particle(x,y,pc,s,sp,l,fr,gr,shrk))}}
function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){particles[i].update(dt);if(particles[i].l<=0||particles[i].s<=0.2)particles.splice(i,1)}}
function drawParticles(ctx){if(!ctx)return;particles.forEach(p=>p.draw(ctx));ctx.globalAlpha=1.0}
function notifyAchievement(key){if(!achievements[key]||achievements[key].notified)return;achievements[key].notified=true;const a=achievements[key];console.log(`Notify Ach: ${a.name||key}`);playSound('powerup',1.1);if(achievementTitle)achievementTitle.textContent=a.name||key;if(achievementDesc)achievementDesc.textContent=a.desc||'Achievement Unlocked!';if(achievementTimeoutId)clearTimeout(achievementTimeoutId);if(achievementNotifier){achievementNotifier.classList.remove('hidden');achievementNotifier.classList.add('visible');achievementTimeoutId=setTimeout(()=>{achievementNotifier.classList.remove('visible');setTimeout(()=>achievementNotifier.classList.add('hidden'),500)},4000);}}
function checkAchievements(){if(gameOver||isPaused)return;for(const k in achievements){const a=achievements[k];if(!a.unlocked&&a.check&&a.check()){a.unlocked=true;notifyAchievement(k);saveAchievements();}}}
function updateFlashEffect(dt){if(flashEffectTimer>0)flashEffectTimer-=dt}
function drawFlash(alpha,color='white'){if(!ctx||alpha<=0)return;ctx.save();ctx.fillStyle=color;ctx.globalAlpha=Math.max(0,alpha);ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore()}
function updateDebugInfo(text){if(debugInfo)debugInfo.textContent=`State:${text}|F:${frameCounter}|Snd:${audioContext?.state}`}

// === LEVELING SYSTEM === (Keep as is)
function updateXPBar(){xpToNextLevel=Math.floor(xpPerLevelBase*Math.pow(xpPerLevelFactor,playerLevel-1));const prog=xpToNextLevel>0?Math.min(1,playerXP/xpToNextLevel):1;if(xpBarFill)xpBarFill.style.width=`${prog*100}%`;if(xpText)xpText.textContent=`XP:${playerXP}/${xpToNextLevel}`;if(levelDisplay)levelDisplay.textContent=`Lvl:${playerLevel}`}
function addXP(amt){if(isPaused||gameOver||!player)return;playerXP+=amt;addFloatingText(`+${amt}XP`,player.x+random(-20,20),player.y-10,'#a0e0ff',14,.8);while(playerXP>=xpToNextLevel){playerXP-=xpToNextLevel;playerLevel++;console.log("Level Up!",playerLevel);addFloatingText(`LEVEL UP! ${playerLevel}`,canvas.width/2,canvas.height/2,'#ffeb3b',35,1.5);playSound('powerup',.8,1.2);flashEffectTimer=.3;flashEffectColor='rgba(255,235,59,.4)';checkAchievements();updateXPBar();}updateXPBar();}

// === DRAWING FUNCTIONS === (Keep all as is)
function drawPlayer(ctx){if(!ctx||!player)return;if(!isPaused&&(player.vx!==0||player.vy!==0)){const t=Math.min(1,Math.sqrt(player.vx*player.vx+player.vy*player.vy)/20);if(Math.random()<t*.8)spawnParticles(player.x-Math.cos(player.tilt+Math.PI/2)*playerRadius*.6,player.y-Math.sin(player.tilt+Math.PI/2)*playerRadius*.6,1,'#f80',3+t*3,1.5+t,.4+t*.2,.95,0,.96);if(Math.random()<t*.6)spawnParticles(player.x,player.y+playerRadius*.6,1,'#fff',2,1,.3,.96)}ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.tilt);ctx.translate(-player.x,-player.y);if(player.shieldActive){const sP=Math.abs(Math.sin(Date.now()*0.01)),sR=playerRadius*(1.4+sP*.2);ctx.fillStyle=`rgba(0,150,255,${.3+sP*.3})`;ctx.beginPath();ctx.arc(player.x,player.y,sR,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(150,200,255,${.5+sP*.3})`;ctx.lineWidth=3;ctx.stroke();}ctx.fillStyle='#e07a5f';ctx.beginPath();ctx.ellipse(player.x,player.y,playerRadius*1.05,playerRadius*.85,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5a3e36';ctx.beginPath();ctx.arc(player.x,player.y+playerRadius*.1,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(player.x-playerRadius*.4,player.y-playerRadius*.2,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(player.x+playerRadius*.4,player.y-playerRadius*.2,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(200,200,255,.4)';ctx.beginPath();ctx.arc(player.x,player.y-playerRadius*.3,playerRadius*.9,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(220,220,255,.7)';ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle='#e07a5f';ctx.beginPath();ctx.moveTo(player.x-playerRadius*.5,player.y-playerRadius*.5);ctx.lineTo(player.x-playerRadius*.3,player.y-playerRadius*1.2);ctx.lineTo(player.x-playerRadius*.1,player.y-playerRadius*.6);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(player.x+playerRadius*.5,player.y-playerRadius*.5);ctx.lineTo(player.x+playerRadius*.3,player.y-playerRadius*1.2);ctx.lineTo(player.x+playerRadius*.1,player.y-playerRadius*.6);ctx.closePath();ctx.fill();ctx.restore();}
function drawProjectile(p){if(!ctx)return;ctx.save();ctx.fillStyle='#0ff';ctx.shadowColor='#0ff';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y+15);ctx.lineWidth=p.radius*.8;ctx.strokeStyle='#0ff';ctx.stroke();ctx.restore();}
function drawTreat(treat){if(!ctx)return;const bO=Math.sin(Date.now()*.003+treat.x)*2,yP=treat.y+bO;ctx.save();ctx.translate(treat.x,yP);ctx.fillStyle='#ffeb3b';ctx.shadowColor='#ffeb3b';ctx.shadowBlur=15;ctx.beginPath();ctx.moveTo(0,-treatRadius);for(let i=0;i<5;i++){ctx.lineTo(Math.cos((18+i*72)*Math.PI/180)*treatRadius,-Math.sin((18+i*72)*Math.PI/180)*treatRadius);ctx.lineTo(Math.cos((54+i*72)*Math.PI/180)*treatRadius*.5,-Math.sin((54+i*72)*Math.PI/180)*treatRadius*.5);}ctx.closePath();ctx.fill();ctx.restore();}
function drawJunk(item){if(!ctx)return;ctx.fillStyle=item.color||'#adb5bd';ctx.strokeStyle='#343a40';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(item.x+junkRadius*.8,item.y-junkRadius*.5);ctx.lineTo(item.x+junkRadius*.2,item.y+junkRadius);ctx.lineTo(item.x-junkRadius*.9,item.y+junkRadius*.3);ctx.lineTo(item.x-junkRadius*.7,item.y-junkRadius*.8);ctx.lineTo(item.x+junkRadius*.1,item.y-junkRadius);ctx.lineTo(item.x+junkRadius*.8,item.y-junkRadius*.5);ctx.closePath();ctx.fill();ctx.stroke();}
function drawMine(item){if(!ctx)return;const p=Math.abs(Math.sin(Date.now()*minePulseSpeed)),cR=mineRadius*(.8+p*.4),a=.7+p*.3;ctx.fillStyle=`rgba(255,100,0,${a*.4})`;ctx.beginPath();ctx.arc(item.x,item.y,cR*1.3,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(200,80,0,${a})`;ctx.strokeStyle=`rgba(255,150,50,${a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(item.x,item.y,cR,0,Math.PI*2);ctx.fill();ctx.stroke();}
function drawLaserJunk(item){if(!ctx)return;const c=item.color||'#c0c';ctx.fillStyle=c;ctx.strokeStyle='#505';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(item.x,item.y-laserJunkRadius*1.1);ctx.lineTo(item.x+laserJunkRadius*.9,item.y+laserJunkRadius*.7);ctx.lineTo(item.x-laserJunkRadius*.9,item.y+laserJunkRadius*.7);ctx.closePath();ctx.fill();ctx.stroke();if(item.laserCharge>0){const r=item.laserCharge/item.laserChargeTime,wa=.1+r*.4,ww=1+r*3;ctx.strokeStyle=`rgba(255,0,100,${wa})`;ctx.lineWidth=ww;ctx.beginPath();ctx.moveTo(item.x,item.y+laserJunkRadius*.7);ctx.lineTo(item.x,canvas.height);ctx.stroke();}if(item.laserFiring>0){const r=item.laserFiring/item.laserFireDuration,fa=.8*(1-Math.pow(1-r,3)),bw=10*r;ctx.strokeStyle=`rgba(255,50,150,${fa})`;ctx.lineWidth=bw;ctx.shadowColor='#f08';ctx.shadowBlur=15;ctx.beginPath();ctx.moveTo(item.x,item.y+laserJunkRadius*.7);ctx.lineTo(item.x,canvas.height);ctx.stroke();ctx.shadowBlur=0;}}
function drawPowerup(item){if(!ctx)return;const bO=Math.sin(Date.now()*.0035+item.y)*2.5,rot=Math.sin(Date.now()*.0006+item.x)*.1,yP=item.y+bO;ctx.save();ctx.translate(item.x,yP);ctx.rotate(rot);const p=Math.abs(Math.sin(Date.now()*.005)),cR=powerupRadius*(.8+p*.4);let c1,c2,shC,txt;if(item.type==='shield'){c1=`rgba(0,150,255,${.6+p*.4})`;c2=`rgba(200,220,255,${.7+p*.3})`;shC='rgba(0,150,255,.8)';txt='S';}else if(item.type==='multiplier'){c1=`rgba(255,193,7,${.6+p*.4})`;c2=`rgba(255,224,130,${.7+p*.3})`;shC='rgba(255,193,7,.8)';txt='x2';}else if(item.type==='rapidFire'){c1=`rgba(255,80,80,${.6+p*.4})`;c2=`rgba(255,150,150,${.7+p*.3})`;shC='rgba(255,80,80,.8)';txt='>>>';}else{c1='gray';c2='darkgray';shC='gray';txt='?';}ctx.fillStyle=c1;ctx.strokeStyle=c2;ctx.lineWidth=3;ctx.shadowColor=shC;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(0,0,cR,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='white';ctx.font='bold 14px Nunito';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,0,1);ctx.restore();}
function drawBackground(dt){if(!ctx||!canvas)return;const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,'#05000a');g.addColorStop(1,'#1a002a');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.globalCompositeOperation='lighter';nebulas.forEach(n=>{n.x+=n.speedX*dt;n.y+=n.speedY*dt;if(n.x>canvas.width+n.radius)n.x=-n.radius;if(n.x<-n.radius)n.x=canvas.width+n.radius;if(n.y>canvas.height+n.radius)n.y=-n.radius;if(n.y<-n.radius)n.y=canvas.height+n.radius;const cg=ctx.createRadialGradient(n.x,n.y,n.radius*.1,n.x,n.y,n.radius);cg.addColorStop(0,n.colorInner);cg.addColorStop(1,n.colorOuter);ctx.fillStyle=cg;ctx.beginPath();ctx.arc(n.x,n.y,n.radius,0,Math.PI*2);ctx.fill();});ctx.restore();ctx.fillStyle='rgba(255,255,255,0.8)';stars.forEach(s=>{s.y+=(s.speed*currentSpeed*dt*15);if(s.y>canvas.height+s.size){s.y=-s.size;s.x=Math.random()*canvas.width;}ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,Math.PI*2);ctx.fill();});}
function drawBossShot(item){if(!ctx)return;ctx.fillStyle=item.color||'#f00';ctx.strokeStyle='#8B0000';ctx.lineWidth=1;ctx.beginPath();ctx.arc(item.x,item.y,item.radius,0,Math.PI*2);ctx.fill();ctx.stroke();}

// === GAME LOGIC & UPDATES ===
function incrementCombo(){if(isPaused||!player)return;comboCount++;comboTimer=comboTimeout;comboMultiplier=Math.min(maxCombo,1+Math.floor(comboCount/5));if(comboIndicator){comboIndicator.textContent=`Combo: x${comboMultiplier}`;comboIndicator.classList.add('active');}playSound('combo',1.0+comboCount*.05);addFloatingText(`x${comboMultiplier}`,player.x,player.y-30,'#f90',24+comboMultiplier*2,0.6);checkAchievements();}
function resetCombo(){comboCount=0;comboMultiplier=1;comboTimer=0;if(comboIndicator){comboIndicator.textContent=`Combo: x1`;comboIndicator.classList.remove('active');}}
function updateCombo(dt){if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0)resetCombo();}}
function spawnItems(dt){if(!player||isBossFight)return;lastSpawnTime+=dt;const intv=1/currentSpawnRate;if(lastSpawnTime>=intv){lastSpawnTime-=intv;let sx=random(laserJunkRadius,canvas.width-laserJunkRadius),sy=-laserJunkRadius;const r=Math.random();if(r<powerupSpawnChance){const sA=player.shieldActive,mA=player.scoreMultiplier>1,rA=player.rapidFireActive;let avT=[];if(!sA)avT.push(powerupTypes.SHIELD);if(!mA)avT.push(powerupTypes.MULTIPLIER);if(!rA)avT.push(powerupTypes.RAPID_FIRE);if(avT.length>0){const t=avT[Math.floor(Math.random()*avT.length)];powerups.push({x:sx,y:sy,type:t})}else{addXP(xpPerTreat*2);treats.push({x:sx,y:sy})}}else if(r<0.60+powerupSpawnChance){treats.push({x:sx,y:sy});}else{const er=Math.random();if(er<mineSpawnChance)junk.push({x:sx,y:sy,type:junkTypes.MINE,radius:mineRadius});else if(er<mineSpawnChance+laserJunkSpawnChance)junk.push({x:sx,y:sy,type:junkTypes.LASER,radius:laserJunkRadius,color:'#c0c',laserCharge:0,laserChargeTime:random(laserChargeTimeMin,laserChargeTimeMax),laserFiring:0,laserFireDuration:0.3,laserCooldown:random(1.5,2.5)});else junk.push({x:sx,y:sy,type:junkTypes.NORMAL,color:junkColors[Math.floor(Math.random()*junkColors.length)],radius:junkRadius})}}}
function updatePlayer(dt){if(!player)return;const tx=mousePos.x,ty=mousePos.y;const dx=tx-player.x;player.vx=dx*playerTiltSpeed;player.x=tx;player.y=ty;player.x=Math.max(playerRadius,Math.min(canvas.width-playerRadius,player.x));player.y=Math.max(playerRadius,Math.min(canvas.height-playerRadius,player.y));let tt=(player.vx/(canvas.width*.1))*playerMaxTiltAngle;tt=Math.max(-playerMaxTiltAngle,Math.min(playerMaxTiltAngle,tt));player.tilt+=(tt-player.tilt)*playerTiltSpeed;if(player.shieldActive){player.shieldTimer-=dt;if(shieldTimerDisplay)shieldTimerDisplay.textContent=player.shieldTimer.toFixed(1);if(player.shieldTimer<=0){player.shieldActive=false;if(shieldIndicator)shieldIndicator.classList.add('hidden');}}if(player.scoreMultiplier>1){player.multiplierTimer-=dt;if(multiplierTimerDisplay)multiplierTimerDisplay.textContent=player.multiplierTimer.toFixed(1);if(player.multiplierTimer<=0){player.scoreMultiplier=1;if(multiplierIndicator)multiplierIndicator.classList.add('hidden');}}if(player.rapidFireActive){player.rapidFireTimer-=dt;if(rapidFireTimerDisplay)rapidFireTimerDisplay.textContent=player.rapidFireTimer.toFixed(1);if(player.rapidFireTimer<=0){player.rapidFireActive=false;if(rapidFireIndicator)rapidFireIndicator.classList.add('hidden');}}}
function handleShooting(ts){if(!player)return;let cdM=1.0;if(shopUpgrades.cooldownReduction?.level>0)cdM=Math.pow(shopItems.cooldownReduction.cooldownFactor,shopUpgrades.cooldownReduction.level);const bcd=player.rapidFireActive?playerRapidFireCooldown:playerBaseShootCooldown;const ccd=bcd*cdM;if(mouseIsDown&&ts-player.lastShotTime>ccd*1000){player.lastShotTime=ts;projectiles.push({x:player.x,y:player.y-playerRadius,radius:playerProjectileRadius,speed:playerProjectileSpeed});playSound('shoot',random(.9,1.1),.5)}}
function updateProjectiles(dt){const s=playerProjectileSpeed*dt*60;for(let i=projectiles.length-1;i>=0;i--){projectiles[i].y-=s;if(projectiles[i].y<-projectiles[i].radius){projectiles.splice(i,1);continue;}for(let j=junk.length-1;j>=0;j--){const en=junk[j];if(en.type===junkTypes.BOSS_SHOT)continue;const er=en.radius||junkRadius;if(getDistance(projectiles[i].x,projectiles[i].y,en.x,en.y)<projectiles[i].radius+er*.9){projectiles.splice(i,1);let pts=0,xp=0,pC='#aaa';if(en.type===junkTypes.MINE){pts=5;xp=xpPerMine;pC='#f80'}else if(en.type===junkTypes.LASER){pts=8;xp=xpPerLaserJunk;pC='#f0f'}else{pts=2;xp=xpPerJunk;}pts=Math.round(pts*player.scoreMultiplier*comboMultiplier*(playerBaseScoreMultiplier+(playerLevel-1)*.05));score+=pts;if(scoreDisplay)scoreDisplay.textContent=`Score:${score}`;addXP(xp);addFloatingText(`+${pts}`,en.x,en.y,'#aaff',18,.7);spawnParticles(en.x,en.y,30,pC,6,5,.7,.98,50,.95);playSound('hit',random(.8,1.2),.7);checkAchievements();incrementCombo();junk.splice(j,1);break;}}}}
function updateItems(dt){if(!player)return;const es=currentSpeed*dt*60;for(let i=treats.length-1;i>=0;i--){const it=treats[i];it.y+=es*1.1;if(getDistance(player.x,player.y,it.x,it.y)<playerRadius+treatRadius){let btv=1;let tB=shopUpgrades.treatValue?.level*shopItems.treatValue?.valueBonus||0;let bft=1+Math.floor(tB*10);starBits+=bft;updateCurrencyDisplay();addFloatingText(`★+${bft}`,it.x,it.y+15,'#fd0',14,.6);let pts=Math.round(btv*player.scoreMultiplier*comboMultiplier*(playerBaseScoreMultiplier+(playerLevel-1)*.05));score+=pts;if(scoreDisplay)scoreDisplay.textContent=`Score:${score}`;addXP(xpPerTreat);spawnParticles(it.x,it.y,15,player.scoreMultiplier>1?'#fd0':'#ffb',5,3,.5);playSound('collect',random(.95,1.05));addFloatingText(`+${pts}`,it.x,it.y,'#ffa',16,.5);incrementCombo();treats.splice(i,1)}else if(it.y>canvas.height+treatRadius)treats.splice(i,1)}for(let i=powerups.length-1;i>=0;i--){const it=powerups[i];it.y+=es*.9;if(getDistance(player.x,player.y,it.x,it.y)<playerRadius+powerupRadius){let c=false,fC='white',m='';if(it.type==='shield'&&!player.shieldActive){player.shieldActive=true;player.shieldTimer=shieldDuration;if(shieldIndicator)shieldIndicator.classList.remove('hidden');if(shieldTimerDisplay)shieldTimerDisplay.textContent=player.shieldTimer.toFixed(1);c=true;fC='rgba(0,180,255,.5)';m='SHIELD!';}else if(it.type==='multiplier'&&player.scoreMultiplier===1){player.scoreMultiplier=2;player.multiplierTimer=multiplierDuration;if(multiplierIndicator)multiplierIndicator.classList.remove('hidden');if(multiplierTimerDisplay)multiplierTimerDisplay.textContent=player.multiplierTimer.toFixed(1);c=true;fC='rgba(255,193,7,.5)';m='SCORE x2!';}else if(it.type==='rapidFire'&&!player.rapidFireActive){player.rapidFireActive=true;player.rapidFireTimer=rapidFireDuration;if(rapidFireIndicator)rapidFireIndicator.classList.remove('hidden');if(rapidFireTimerDisplay)rapidFireTimerDisplay.textContent=player.rapidFireTimer.toFixed(1);c=true;fC='rgba(255,80,80,.5)';m='RAPID FIRE!';}if(c){let pC=it.type===powerupTypes.SHIELD?'#0cf':(it.type===powerupTypes.MULTIPLIER?'#fc3':'#f55');spawnParticles(it.x,it.y,30,pC,7,5,.7);addFloatingText(m,it.x,it.y,pC,24,1.0);flashEffectTimer=.2;flashEffectColor=fC;playSound('powerup');powerups.splice(i,1)}}else if(it.y>canvas.height+powerupRadius)powerups.splice(i,1)}for(let i=junk.length-1;i>=0;i--){const item=junk[i];const spM=(item.type===junkTypes.MINE)?.5:(item.type===junkTypes.LASER)?.7:1;item.y+=es*spM;const cR=item.radius||junkRadius,hS=(item.type===junkTypes.MINE)?1.0:.85;if(item.type===junkTypes.LASER){if(item.laserCooldown>0)item.laserCooldown-=dt;else if(item.laserCharge<=0&&item.laserFiring<=0){item.laserCharge=item.laserChargeTime;playSound('laserWarn',1,.6);}else if(item.laserCharge>0){item.laserCharge-=dt;if(item.laserCharge<=0){item.laserFiring=item.laserFireDuration;playSound('laserFire',random(.9,1.1),.8);}}else if(item.laserFiring>0){item.laserFiring-=dt;if(item.laserFiring<=0)item.laserCooldown=random(1.5,3.0);const lOY=item.y+laserJunkRadius*.7;if(player&&!player.shieldActive&&item.laserFiring>0&&player.y>lOY&&player.x>item.x-5&&player.x<item.x+5){gameOver=true;triggerScreenShake(10,.4);spawnParticles(player.x,player.y,50,'#f08',8,7,1.0);resetCombo();}}}if(player&&getDistance(player.x,player.y,item.x,item.y)<playerRadius+cR*hS){if(player.shieldActive){achievements.shieldSave.count++;checkAchievements();const pC=item.type===junkTypes.MINE?'#f90':(item.type===junkTypes.LASER?'#f0f':'#0af');spawnParticles(item.x,item.y,item.type===junkTypes.MINE?30:20,pC,6,5,.7);playSound('shieldHit');junk.splice(i,1);}else{gameOver=true;const sK=item.type===junkTypes.MINE?15:(item.type===junkTypes.LASER?12:8),pC=item.type===junkTypes.MINE?'#f80':(item.type===junkTypes.LASER?'#f0f':'#f44');triggerScreenShake(sK,.5);spawnParticles(player.x,player.y,60,pC,9,8,1.2);resetCombo();junk.splice(i,1);break;}}else if(item.y>canvas.height+cR)junk.splice(i,1)}}
function updateDifficulty(dt){gameTime+=dt;currentSpeed=Math.min(initialSpeed+gameTime*speedIncrease,15);currentSpawnRate=Math.min(initialSpawnRate+gameTime*spawnRateIncrease,12);}

// === BOSS LOGIC === (Keep as is)
class Boss{constructor(n,x,y,r,h,c,p){this.n=n;this.x=x;this.y=y;this.tY=100;this.r=r;this.h=h;this.mH=h;this.clr=c;this.pats=p;this.currPat=null;this.pTmr=0;this.pCD=3.0;this.entr=true;this.dmgFl=0;this.pIdx=0;this.vx=2*(1+playerLevel*.05);this.patState={};}update(dt){if(this.entr){this.y+=(this.tY-this.y)*.05;if(Math.abs(this.y-this.tY)<1){this.y=this.tY;this.entr=false;this.pTmr=this.pCD;}return;}this.x+=this.vx*dt*60;if(this.x<this.r+50||this.x>canvas.width-this.r-50)this.vx*=-1;if(this.dmgFl>0)this.dmgFl-=dt;this.pTmr-=dt;if(this.pTmr<=0){let nextIdx=Math.floor(Math.random()*this.pats.length);this.currPat=this.pats[nextIdx];this.patState={};const d=this.currPat(this,dt,this.patState);this.pTmr=d+this.pCD+random(-.5,.5);}}draw(ctx){if(!ctx)return;ctx.save();const f=this.dmgFl>0,s=f?1.1:1.0,c=f?'#fff':this.clr;ctx.fillStyle=c;ctx.strokeStyle=f?this.clr:'#333';ctx.lineWidth=f?4:2;ctx.shadowColor=f?'#fff':this.clr;ctx.shadowBlur=f?20:10;ctx.beginPath();ctx.arc(this.x,this.y,this.r*s,0,Math.PI*2);ctx.fill();ctx.stroke();const nO=3;for(let i=0;i<nO;i++){const a=Date.now()*.001+(i*(Math.PI*2/nO)),oX=this.x+Math.cos(a)*this.r*1.3*s,oY=this.y+Math.sin(a)*this.r*1.3*s;ctx.fillStyle=c;ctx.beginPath();ctx.arc(oX,oY,this.r*.3*s,0,Math.PI*2);ctx.fill();}ctx.restore();if(this.patState?.beamActive)drawBossBeam(this,ctx);ctx.shadowBlur=0;}takeDamage(amt){if(this.isEntering)return;this.h-=amt;this.h=Math.max(0,this.h);this.dmgFl=.15;playSound('hit',random(.7,.9),.9);const hp=(this.h/this.mH)*100;if(bossHealthFill)bossHealthFill.style.width=`${hp}%`;if(this.h<=0)this.onDefeat();}onDefeat(){console.log(`${this.n} Defeated!`);isBossFight=false;currentBoss=null;if(bossHealthBarContainer)bossHealthBarContainer.classList.add('hidden');spawnParticles(this.x,this.y,200,'#f80',12,10,1.8,.99,30,.94);spawnParticles(this.x,this.y,150,'#fff',10,8,1.5,.99,20,.95);playSound('hit',.5,1.5);triggerScreenShake(25,.9);let pts=Math.round(500*(playerBaseScoreMultiplier+(playerLevel-1)*.05)*comboMultiplier);score+=pts;if(scoreDisplay)scoreDisplay.textContent=`Score:${score}`;addXP(xpPerBoss*playerLevel);addFloatingText(`BOSS DEFEATED!+${pts}`,canvas.width/2,canvas.height/2,'#f69',40,2.0);if(this.n==="Nebula Goliath")achievements.boss1Defeat.unlocked=true;checkAchievements();saveAchievements();scoreForNextBoss=score+scoreIncrementPerBoss;resetCombo();}}
function bossPattern_SpreadShot(b,dt,st){const nS=5+playerLevel,sA=Math.PI/6,sAng=-sA/2;for(let i=0;i<nS;i++){const a=sAng+(i/(nS-1))*sA,sp=4+playerLevel*.2;junk.push({x:b.x,y:b.y+b.r,type:junkTypes.BOSS_SHOT,radius:8,vx:Math.sin(a)*sp,vy:Math.cos(a)*sp,color:'#f55'})}playSound('shoot',random(.7,.9),.4);return .4-playerLevel*.02;}
function bossPattern_SummonMinions(b,dt,st){const nM=2+playerLevel;for(let i=0;i<nM;i++){const sX=b.x+random(-80,80),sY=b.y+b.r+random(10,40),c=junkColors[Math.floor(Math.random()*junkColors.length)];junk.push({x:sX,y:sY,type:junkTypes.NORMAL,color:c,radius:junkRadius})}playSound('laserWarn',1.2,.5);return 1.5-playerLevel*.1;}
function bossPattern_BeamSweep(b,dt,st){st.beamAngle=st.beamAngle||-Math.PI/3;st.beamSweepSpeed=st.beamSweepSpeed||Math.PI/(2.5-.1*playerLevel);st.beamActive=true;st.beamTimer=2.0;st.beamAngle+=st.beamSweepSpeed*dt*(b.vx>0?1:-1);if(Math.abs(st.beamAngle)>Math.PI/3)st.beamSweepSpeed*=-1;b.patState=st;playSound('laserFire',.6+Math.random()*.2,.2);return 2.0;}
function drawBossBeam(b,ctx){if(!ctx)return;const st=b.patState;if(!st?.beamActive||st.beamTimer<=0)return;st.beamTimer-=1/60;if(st.beamTimer<=0)st.beamActive=false;const bEX=b.x+Math.sin(st.beamAngle)*canvas.height*1.5;const bEY=b.y+Math.cos(st.beamAngle)*canvas.height*1.5;ctx.save();ctx.strokeStyle=`rgba(255,255,100,.6)`;ctx.lineWidth=8+Math.sin(Date.now()*.05)*3;ctx.shadowColor='yellow';ctx.shadowBlur=15;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(bEX,bEY);ctx.stroke();ctx.restore();}
function checkBossTrigger(){if(isBossFight||currentBoss||!canvas)return;if(!isBossFight&&score>=scoreForNextBoss){console.log(`TRIG BOSS`);nearingBossScore=false;canvas.style.borderColor='rgba(255,255,255,.35)';canvas.style.animation='none';isBossFight=true;junk=[];treats=[];powerups=[];projectiles=[];currentBoss=new Boss("Nebula Goliath",canvas.width/2,-100,50,250+playerLevel*50,'#8a2be2',[bossPattern_SpreadShot,bossPattern_SummonMinions,bossPattern_BeamSweep]);if(bossNameDisplay)bossNameDisplay.textContent=currentBoss.n;if(bossHealthFill)bossHealthFill.style.width='100%';if(bossHealthBarContainer)bossHealthBarContainer.classList.remove('hidden');playSound('laserWarn',.8,1.0);}else if(!isBossFight&&score>=scoreForNextBoss*.85){if(!nearingBossScore){console.log(`Near boss`);nearingBossScore=true;canvas.style.borderColor='rgba(255,0,0,.7)';canvas.style.animation='pulseBorder 1s infinite';playSound('laserWarn',.8,.5)}}else if(nearingBossScore){nearingBossScore=false;canvas.style.borderColor='rgba(255,255,255,.35)';canvas.style.animation='none';}}
function updateProjectiles_Boss(dt){const s=playerProjectileSpeed*dt*60;for(let i=projectiles.length-1;i>=0;i--){projectiles[i].y-=s;if(projectiles[i].y<-projectiles[i].radius){projectiles.splice(i,1);continue;}if(currentBoss&&getDistance(projectiles[i].x,projectiles[i].y,currentBoss.x,currentBoss.y)<projectiles[i].radius+currentBoss.r*.9){currentBoss.takeDamage(1);spawnParticles(projectiles[i].x,projectiles[i].y,5,'#0ff',4,2,.3);projectiles.splice(i,1);break;}}}
function updateItems_Boss(dt){if(!player)return;const es=currentSpeed*dt*60;for(let i=junk.length-1;i>=0;i--){const item=junk[i];let itemSpeedMult=1.0;if(item.type===junkTypes.BOSS_SHOT){item.x+=item.vx*dt*60;item.y+=item.vy*dt*60;}else if(item.type===junkTypes.NORMAL){item.y+=es*itemSpeedMult;}let itemRadius=item.radius||junkRadius;if(!player.shieldActive&&getDistance(player.x,player.y,item.x,item.y)<playerRadius+itemRadius*.8){gameOver=true;triggerScreenShake(9,.4);spawnParticles(player.x,player.y,40,item.type===junkTypes.BOSS_SHOT?'#f55':'#f44',7,6,.8);resetCombo();junk.splice(i,1);break;}else if(player.shieldActive&&getDistance(player.x,player.y,item.x,item.y)<playerRadius+itemRadius){achievements.shieldSave.count++;checkAchievements();spawnParticles(item.x,item.y,10,item.type===junkTypes.BOSS_SHOT?'#f55':'#0af',5,3,.4);playSound('shieldHit',1.1);junk.splice(i,1);continue;}if(item.y>canvas.height+itemRadius||item.y<-itemRadius||item.x<-itemRadius||item.x>canvas.width+itemRadius)junk.splice(i,1);}}

// === GAME STATE & LOOP ===
function resetGameVariables(){score=0;gameTime=0;gameOver=false;isBossFight=false;currentBoss=null;nearingBossScore=false;if(canvas){canvas.style.animation='none';canvas.style.borderColor='rgba(255,255,255,.35)';}treats=[];junk=[];powerups=[];projectiles=[];particles=[];floatingTexts=[];player={x:canvas?.width/2??400,y:canvas?.height-80??520,vx:0,vy:0,tilt:0,shieldActive:false,shieldTimer:0,scoreMultiplier:1,multiplierTimer:0,rapidFireActive:false,rapidFireTimer:0,lastShotTime:0};playerLevel=1;playerXP=0;applyShopUpgrades();mousePos={x:player.x,y:player.y};currentSpeed=initialSpeed;currentSpawnRate=initialSpawnRate;lastSpawnTime=0;screenShakeIntensity=0;screenShakeDuration=0;resetCombo();isPaused=true;flashEffectTimer=0;achievements.shieldSave.count=0;for(const k in achievements)achievements[k].notified=achievements[k].unlocked;scoreForNextBoss=1500;if(bossHealthBarContainer)bossHealthBarContainer.classList.add('hidden');frameCounter=0;updateXPBar();updateDebugInfo("Reset");}
function initializeBackgroundElements(){if(!canvas)return;stars=[];for(let i=0;i<200;i++)stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:random(.4,1.8),speed:random(.3,.8)});nebulas=[];for(let i=0;i<nebulaCount;i++)nebulas.push({x:random(0,canvas.width),y:random(0,canvas.height),radius:random(150,300),speedX:random(-5,5),speedY:random(-5,5),colorInner:`rgba(${random(50,150)},${random(0,50)},${random(100,200)},.1)`,colorOuter:`rgba(${random(10,30)},0,${random(20,40)},0)`});}
function drawInitialState(){if(!ctx||!canvas)return;console.log("Draw Initial state...");try{ctx.clearRect(0,0,canvas.width,canvas.height);initializeBackgroundElements();drawBackground(0);ctx.save();ctx.fillStyle='#e07a5f';ctx.beginPath();ctx.ellipse(canvas.width/2,canvas.height-80,playerRadius*1.05,playerRadius*.85,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(200,200,255,.4)';ctx.beginPath();ctx.arc(canvas.width/2,(canvas.height-80)-playerRadius*.3,playerRadius*.9,0,Math.PI*2);ctx.fill();ctx.restore();if(scoreDisplay)scoreDisplay.textContent=`Score: 0`;if(comboIndicator){comboIndicator.textContent=`Combo: x1`;comboIndicator.classList.remove('active');}if(shieldIndicator)shieldIndicator.classList.add('hidden');if(multiplierIndicator)multiplierIndicator.classList.add('hidden');if(rapidFireIndicator)rapidFireIndicator.classList.add('hidden');if(bossHealthBarContainer)bossHealthBarContainer.classList.add('hidden');updateXPBar();console.log("Initial state drawn.");}catch(e){console.error("Err drawInitialState:",e);}}
function startGame(isRestart=false){console.log("Attempt startGame. Restart:",isRestart);if(!assetsLoaded||!canvas||!ctx){console.warn("Start aborted: Assets/Canvas/Ctx not ready.");return;}if(gameOver||isRestart)resetGameVariables();isPaused=false;gameOver=false;console.log("Starting Loop");updateCurrencyDisplay();if(scoreDisplay)scoreDisplay.textContent=`Score:${score}`;if(comboIndicator){comboIndicator.textContent=`Combo: x${comboMultiplier}`;comboIndicator.classList.remove('active');}if(gameOverScreen)gameOverScreen.classList.add('hidden');if(shieldIndicator)shieldIndicator.classList.add('hidden');if(multiplierIndicator)multiplierIndicator.classList.add('hidden');if(rapidFireIndicator)rapidFireIndicator.classList.add('hidden');if(bossHealthBarContainer)bossHealthBarContainer.classList.add('hidden');if(instructions)instructions.innerHTML="Move:Mouse|Shoot:Click|Pause:P/Esc";canvas.style.cursor='none';updateXPBar();if(audioContext&&audioContext.state==='running')playBgMusic();else setTimeout(()=>{if(audioContext&&audioContext.state==='running'&&!gameOver&&!isPaused){console.log("Play BGM timeout.");playBgMusic();}},150);lastTimestamp=performance.now();if(animationFrameId)cancelAnimationFrame(animationFrameId);console.log("Req Anim Frame");animationFrameId=requestAnimationFrame(gameLoop);updateDebugInfo("Playing");console.log("startGame FINISHED");}
function showGameOver(){playSound('hit',1.0,0.9);isPaused=true;stopBgMusic();const bitsEarned=Math.floor(score/10);starBits+=bitsEarned;saveCurrency();updateCurrencyDisplay();addFloatingText(`★+${bitsEarned}`,canvas?.width/2??400,canvas?.height/2-40??260,'#fd0',25,1.5);if(finalScoreDisplay)finalScoreDisplay.textContent=score;if(gameOverScreen)gameOverScreen.classList.remove('hidden');if(instructions)instructions.style.display='none';if(shieldIndicator)shieldIndicator.classList.add('hidden');if(multiplierIndicator)multiplierIndicator.classList.add('hidden');if(rapidFireIndicator)rapidFireIndicator.classList.add('hidden');if(comboIndicator)comboIndicator.classList.remove('active');if(bossHealthBarContainer)bossHealthBarContainer.classList.add('hidden');if(canvas)canvas.style.cursor='default';saveAchievements();if(animationFrameId){cancelAnimationFrame(animationFrameId);animationFrameId=null;}console.log("Game Over");updateDebugInfo("Game Over");}
function togglePause(){if(gameOver)return;isPaused=!isPaused;if(pauseOverlay)pauseOverlay.classList.toggle('hidden',!isPaused);if(isPaused){stopBgMusic();updateDebugInfo("Paused");if(animationFrameId)cancelAnimationFrame(animationFrameId);animationFrameId=null;if(audioContext?.state==='running')audioContext.suspend().then(()=>console.log("Audio Suspended"));if(canvas)canvas.style.cursor='default';}else{if(audioContext?.state==='suspended')audioContext.resume().then(()=>console.log("Audio Resumed"));playBgMusic();updateDebugInfo("Playing");lastTimestamp=performance.now();if(!animationFrameId)animationFrameId=requestAnimationFrame(gameLoop);if(canvas)canvas.style.cursor='none';}}
function gameLoop(ts){if(isPaused||gameOver){return;}if(!ctx||!canvas){console.error("Ctx/Canvas lost!");showGameOver();return;}frameCounter++;const dt=Math.min(0.05,(ts-lastTimestamp)/1000);lastTimestamp=ts;handleShooting(ts);updatePlayer(dt);updateFlashEffect(dt);if(isBossFight&&currentBoss){currentBoss.update(dt);updateProjectiles_Boss(dt);updateItems_Boss(dt);if(gameOver){showGameOver();return;}}else{checkBossTrigger();updateProjectiles(dt);updateItems(dt);if(gameOver){showGameOver();return;}spawnItems(dt);}updateDifficulty(dt);updateParticles(dt);updateFloatingTexts(dt);updateCombo(dt);ctx.clearRect(0,0,canvas.width,canvas.height);let shX=0,shY=0;if(screenShakeIntensity>0&&screenShakeDuration>0){shX=(Math.random()-.5)*2*screenShakeIntensity;shY=(Math.random()-.5)*2*screenShakeIntensity;}ctx.save();ctx.translate(shX,shY);drawBackground(dt);drawParticles(ctx);treats.forEach(drawTreat);powerups.forEach(drawPowerup);junk.forEach(item=>{if(item.type===junkTypes.MINE)drawMine(item);else if(item.type===junkTypes.LASER)drawLaserJunk(item);else if(item.type===junkTypes.BOSS_SHOT)drawBossShot(item);else drawJunk(item);});projectiles.forEach(drawProjectile);if(isBossFight&&currentBoss){currentBoss.draw(ctx);}drawPlayer(ctx);drawFloatingTexts(ctx);drawFlash(flashEffectTimer>0?flashEffectTimer/.2:0,flashEffectColor);ctx.fillStyle='#444';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText(`F:${frameCounter}`,5,canvas.height-5);ctx.restore();if(screenShakeDuration>0){screenShakeDuration-=dt;if(screenShakeDuration<=0)screenShakeIntensity=0;}else screenShakeIntensity=0;animationFrameId=requestAnimationFrame(gameLoop);}

// === UI MODAL FUNCTIONS ===
function openModal(mId){if(!isPaused&&!gameOver)togglePause();playSound('click',1.1);const m=document.getElementById(mId);if(m){if(mId==='shopModal')updateCurrencyDisplay();if(mId==='achievementsModal')populateAchievementsList();if(mId==='shopModal')populateShopList();m.classList.add('visible');m.classList.remove('hidden');updateDebugInfo(`Paused:${mId}`);}}
function closeModal(mId){playSound('click',.9);const m=document.getElementById(mId);if(m){m.classList.remove('visible');m.classList.add('hidden');if(isPaused&&!gameOver)togglePause();}}
function populateAchievementsList(){if(!achievementsList)return;achievementsList.innerHTML='';for(const k in achievements){const a=achievements[k];const li=document.createElement('li');const isU=a.unlocked;li.classList.add(isU?'unlocked':'locked');li.innerHTML=`<span class="ach-icon">🏆</span><div class="ach-details"><div class="ach-title">${a.name||k}</div><div class="ach-desc">${a.desc||'???'}</div></div>`;achievementsList.appendChild(li);}}
function getShopItemCurrentCost(k){const iD=shopItems[k];if(!iD)return Infinity;if(iD.maxLevel===1)return iD.cost;return Math.round(iD.cost*Math.pow(iD.costIncrease,(shopUpgrades[k]?.level||0)));}
function populateShopList(){if(!shopItemsList)return;shopItemsList.innerHTML='';updateCurrencyDisplay();for(const k in shopItems){const iD=shopItems[k];const iS=shopUpgrades[k]||(iD.maxLevel===1?{purchased:0}:{level:0});const cC=getShopItemCurrentCost(k);const li=document.createElement('li');const isM=(iD.maxLevel===1&&iS.purchased>=1)||(iD.maxLevel>1&&iS.level>=iD.maxLevel);const aff=starBits>=cC;li.dataset.key=k;let sT='';if(isM){sT=`<span class="shop-item-status maxed">Maxed</span>`;li.classList.add('maxed')}else if(aff){sT=`<span class="shop-item-cost">Cost:★${cC}</span>`}else{sT=`<span class="shop-item-cost" style="color:#aaa;">Cost:★${cC}</span>`;li.classList.add('cannot-afford')}let lT='';if(iD.maxLevel>1)lT=` (Lv${iS.level||0}/${iD.maxLevel})`;li.innerHTML=`<span class="shop-item-icon">${iD.icon||'?'}</span><div class="shop-item-details"><div class="shop-item-title">${iD.name||k}${lT}</div><div class="shop-item-desc">${iD.desc||'...'}</div>${sT}</div>`;if(!isM&&aff)li.onclick=()=>buyShopItem(k);shopItemsList.appendChild(li);}}
function buyShopItem(k){const iD=shopItems[k];const iS=shopUpgrades[k];const cC=getShopItemCurrentCost(k);const isM=(iD.maxLevel===1&&iS.purchased>=1)||(iD.maxLevel>1&&iS.level>=iD.maxLevel);if(isM||starBits<cC){playSound('hit',.8);console.log(`Cannot buy ${k}`);return;}starBits-=cC;if(iD.maxLevel===1)iS.purchased=1;else iS.level=(iS.level||0)+1;playSound('collect',1.2);console.log(`Purchased ${k}`);saveShopUpgrades();saveCurrency();updateCurrencyDisplay();populateShopList();}
function applyShopUpgrades(){if(!player)return;player.shieldActive=false;player.shieldTimer=0;if(shopUpgrades.startShield?.purchased){player.shieldActive=true;player.shieldTimer=emergencyShieldDuration;if(shieldIndicator){shieldIndicator.classList.remove('hidden');if(shieldTimerDisplay)shieldTimerDisplay.textContent=player.shieldTimer.toFixed(1);}}}

// === EVENT LISTENERS SETUP ===
function setupEventListeners() {
    console.log("Setting up Event Listeners...");
    if (!canvas || !restartButton || !achievementsButton || !shopButton || !achievementsModal || !shopModal) {
        console.error("One or more essential elements missing - cannot attach listeners.");
        return false; // Prevent errors if elements aren't found
    }
    canvas.addEventListener('mousemove',(e)=>{handleFirstInteraction();if(!isPaused){const r=canvas.getBoundingClientRect();mousePos.x=e.clientX-r.left;mousePos.y=e.clientY-r.top;}});
    canvas.addEventListener('mousedown',(e)=>{handleFirstInteraction();if(e.button===0&&!isPaused)mouseIsDown=true;});
    canvas.addEventListener('mouseup',(e)=>{if(e.button===0)mouseIsDown=false;});
    canvas.addEventListener('mouseleave',()=>{mouseIsDown=false;});
    achievementsButton.addEventListener('click',()=>openModal('achievementsModal'));
    shopButton.addEventListener('click',()=>openModal('shopModal'));
    window.addEventListener('click',(e)=>{if(e.target===achievementsModal)closeModal('achievementsModal');if(e.target===shopModal)closeModal('shopModal');});
    restartButton.addEventListener('click',()=>{if(gameOverScreen)gameOverScreen.classList.add('hidden');if(instructions)instructions.style.display='block';playSound('click');stopBgMusic();interactionDone=false;isPaused=true;resetGameVariables();drawInitialState();if(instructions)instructions.innerHTML="Click or Move Mouse to Start!";updateDebugInfo("Ready for Restart");});
    document.addEventListener('keydown',(e)=>{if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(assetsLoaded&&!gameOver&&!loadingScreen?.classList.contains('hidden')){togglePause();}}});
    console.log("Event Listeners Setup Complete.");
    return true;
}

// === INTERACTION & GAME START ===
function handleFirstInteraction(){if(interactionDone)return;interactionDone=true;console.log("First Interaction!");initAudioContext();setTimeout(()=>{if(audioContext&&audioContext.state==='running'){if(assetsLoaded){console.log("Audio OK, starting.");startGame();}else console.warn("Interaction, audio OK, but assets loading.");}else{console.warn("Audio context not running. Starting visually if assets loaded.");if(assetsLoaded)startGame();else console.error("CRITICAL: Interaction but assets not loaded.");}},50);}

// === INITIALIZATION POINT ===
// Use DOMContentLoaded to ensure HTML is parsed before doing anything else
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Initializing game setup...");
    if (getElements()) { // Find elements first
        if (setupEventListeners()) { // Then setup listeners
            loadAssets(); // Then start loading assets (async)
        } else { console.error("Setup aborted due to missing listeners."); updateDebugInfo("ERROR: Listener Fail");}
    } else { console.error("Setup aborted due to missing elements."); }
});