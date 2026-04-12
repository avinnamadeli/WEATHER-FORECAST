const API_URL = 'https://weather-backend-oxex.onrender.com/api';

// Canvas setup
const bgCanvas = document.getElementById('bgCanvas');
const fxCanvas = document.getElementById('fxCanvas');
const bgCtx = bgCanvas.getContext('2d');
const fxCtx = fxCanvas.getContext('2d');

function resizeCanvases() {
    bgCanvas.width = fxCanvas.width = window.innerWidth;
    bgCanvas.height = fxCanvas.height = window.innerHeight;
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

// State
let fxAnimId = null;
let bgAnimId = null;
let particles = [];
let currentState = 'default';

// Time
function updateTime() {
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const el = document.getElementById('navTime');
    if (el) el.textContent = t;
}
setInterval(updateTime, 1000);
updateTime();

// Enter key
document.getElementById('cityInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') getWeather();
});

// ===== GET WEATHER =====
async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;
    await fetchAndDisplay(city);
}

async function getWeatherNav() {
    const city = document.getElementById('navInput').value.trim();
    if (!city) return;
    await fetchAndDisplay(city);
}

async function fetchAndDisplay(city) {
    hideError();
    try {
        const [wRes, fRes] = await Promise.all([
            fetch(`${API_URL}/weather/${city}`),
            fetch(`${API_URL}/forecast/${city}`)
        ]);

        if (!wRes.ok) { showError('City not found. Try again!'); return; }

        const wData = await wRes.json();
        const fData = await fRes.json();

        populateWeather(wData);
        populateForecast(fData);
        loadHistory();

        const cond = wData.weather[0].main.toLowerCase();
        const night = isNight(wData);
        const temp = wData.main.temp;
        applyWeatherTheme(cond, night, temp);

        showDashboard();
    } catch (e) {
        showError('Server not running. Start Node.js server!');
    }
}

function isNight(d) {
    const now = Date.now() / 1000;
    return now < d.sys.sunrise || now > d.sys.sunset;
}

// ===== POPULATE =====
function populateWeather(d) {
    document.getElementById('heroLocation').textContent = `${d.name}, ${d.sys.country}`;
    document.getElementById('heroTemp').textContent = `${Math.round(d.main.temp)}°`;
    document.getElementById('heroCond').textContent = d.weather[0].description;
    document.getElementById('heroFeels').textContent = `Feels like ${Math.round(d.main.feels_like)}°`;
    document.getElementById('heroRange').textContent = `H:${Math.round(d.main.temp_max)}° L:${Math.round(d.main.temp_min)}°`;
    document.getElementById('heroIcon').src = `https://openweathermap.org/img/wn/${d.weather[0].icon}@4x.png`;
    document.getElementById('tileHumidity').textContent = `${d.main.humidity}%`;
    document.getElementById('tileWind').textContent = `${(d.wind.speed * 3.6).toFixed(1)} km/h`;
    document.getElementById('tileVis').textContent = `${(d.visibility / 1000).toFixed(1)} km`;
    document.getElementById('tilePressure').textContent = `${d.main.pressure} hPa`;
    document.getElementById('tileSunrise').textContent = new Date(d.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('tileSunset').textContent = new Date(d.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// Save weather data for AI
currentWeatherForAI = {
    city: d.name + ', ' + d.sys.country,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    condition: d.weather[0].description,
    humidity: d.main.humidity,
    windSpeed: (d.wind.speed * 3.6).toFixed(1),
    visibility: (d.visibility / 1000).toFixed(1),
    pressure: d.main.pressure,
    sunrise: new Date(d.sys.sunrise * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    sunset: new Date(d.sys.sunset * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    tempMin: Math.round(d.main.temp_min),
    tempMax: Math.round(d.main.temp_max)
};

    // Humidity progress bar
    setTimeout(() => {
        const bar = document.getElementById('humProgress');
        if (bar) bar.style.width = `${d.main.humidity}%`;
    }, 300);
    currentWeatherForAI = {
    city: d.name + ', ' + d.sys.country,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    condition: d.weather[0].description,
    humidity: d.main.humidity,
    windSpeed: (d.wind.speed * 3.6).toFixed(1),
    visibility: (d.visibility / 1000).toFixed(1),
    pressure: d.main.pressure,
    sunrise: new Date(d.sys.sunrise * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    sunset: new Date(d.sys.sunset * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    tempMin: Math.round(d.main.temp_min),
    tempMax: Math.round(d.main.temp_max)
};
}

function populateForecast(d) {
    const row = document.getElementById('forecastRow');
    row.innerHTML = '';
    const daily = d.list.filter(i => i.dt_txt.includes('12:00:00')).slice(0, 5);
    daily.forEach((day, i) => {
        const date = new Date(day.dt * 1000);
        const card = document.createElement('div');
        card.className = 'f-card';
        card.style.animationDelay = `${i * 0.08}s`;
        card.innerHTML = `
            <div class="f-day">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="" />
            <div class="f-temp">${Math.round(day.main.temp)}°</div>
            <div class="f-desc">${day.weather[0].description}</div>`;
        row.appendChild(card);
    });
    // Save forecast for AI
currentForecastForAI = daily.map(day => ({
    date: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    temp: Math.round(day.main.temp),
    feelsLike: Math.round(day.main.feels_like),
    condition: day.weather[0].description,
    humidity: day.main.humidity,
    windSpeed: (day.wind.speed * 3.6).toFixed(1),
    rainChance: day.pop ? Math.round(day.pop * 100) : 0,
    tempMin: Math.round(day.main.temp_min),
    tempMax: Math.round(day.main.temp_max)
}));
}

// ===== HISTORY =====
async function loadHistory() {
    try {
        const res = await fetch(`${API_URL}/history`);
        const data = await res.json();
        const row = document.getElementById('pillRow');
        row.innerHTML = '';
        data.forEach(item => {
            const pill = document.createElement('span');
            pill.className = 'pill';
            pill.textContent = item.city;
            pill.onclick = () => {
                document.getElementById('navInput').value = item.city;
                getWeatherNav();
            };
            row.appendChild(pill);
        });
    } catch(e) {}
}

async function clearHistory() {
    try {
        await fetch(`${API_URL}/history`, { method: 'DELETE' });
        document.getElementById('pillRow').innerHTML = '';
    } catch(e) {}
}

// ===== SCREEN TRANSITIONS =====
function showDashboard() {
    document.getElementById('screenSearch').classList.add('hidden');
    document.getElementById('screenDash').classList.add('active');
}

function goBack() {
    document.getElementById('screenSearch').classList.remove('hidden');
    document.getElementById('screenDash').classList.remove('active');
    document.getElementById('cityInput').value = '';
}

// ===== ERROR =====
function showError(msg) {
    const el = document.getElementById('errorPill');
    document.getElementById('errorText').textContent = msg;
    el.style.display = 'flex';
}
function hideError() {
    document.getElementById('errorPill').style.display = 'none';
}

// ===== WEATHER THEME ENGINE =====
function applyWeatherTheme(cond, night, temp) {
    stopAllFX();

    const body = document.body;
    const sun = document.getElementById('sunWrap');
    const moon = document.getElementById('moonWrap');
    const aurora = document.getElementById('auroraWrap');
    const rays = document.getElementById('godRays');

    // Reset
    sun.style.display = 'none';
    moon.style.display = 'none';
    aurora.style.display = 'none';
    rays.style.display = 'none';
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

if (night) {
    // Still show weather effects at night!
    moon.style.display = 'block';
    aurora.style.display = 'block';
    startStars();

    if (cond.includes('thunder') || cond.includes('storm')) {
        body.className = 'state-stormy';
        currentState = 'stormy';
        startHeavyRain();
        startLightningLoop();
        addDarkClouds(8);
    } else if (cond.includes('rain') || cond.includes('drizzle')) {
        body.className = 'state-rainy';
        currentState = 'rainy';
        startRain();
        addDarkClouds(5);
        if (cond.includes('heavy') || cond.includes('extreme')) {
            currentState = 'stormy';
            startLightningLoop();
        }
    } else if (cond.includes('snow')) {
        body.className = 'state-snowy';
        currentState = 'snowy';
        startSnow();
    } else if (cond.includes('cloud')) {
        body.className = 'state-cloudy';
        currentState = 'cloudy';
        addClouds(6, false);
    } else {
        body.className = 'state-night';
        currentState = 'night';
    }
}
     else if (cond.includes('thunder') || cond.includes('storm')) {
        body.className = 'state-stormy';
        currentState = 'stormy';
        startHeavyRain();
        startLightningLoop();
        addDarkClouds(8);
    } else if (cond.includes('rain') || cond.includes('drizzle')) {
        body.className = 'state-rainy';
        currentState = 'rainy';
        startRain();
        addDarkClouds(5);
        // Add lightning for heavy rain
    if (cond.includes('heavy') || cond.includes('extreme') || 
        cond.includes('violent') || cond.includes('intense')) {
        currentState = 'stormy';
        startLightningLoop();
    }
    } else if (cond.includes('snow')) {
        body.className = 'state-snowy';
        currentState = 'snowy';
        startSnow();
        addClouds(4, true);
    } else if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
        body.className = 'state-foggy';
        currentState = 'foggy';
        startFog();
    } else if (cond.includes('cloud') || cond.includes('overcast')) {
        body.className = 'state-cloudy';
        currentState = 'cloudy';
        addClouds(6, false);
    } else {
        if (temp > 32) {
            body.className = 'state-hot';
            currentState = 'hot';
            sun.style.display = 'block';
            rays.style.display = 'block';
            addClouds(2, false);
            startHeatParticles();
        } else {
            body.className = 'state-sunny';
            currentState = 'sunny';
            sun.style.display = 'block';
            rays.style.display = 'block';
            addClouds(3, false);
        }
    }
}

function stopAllFX() {
    if (fxAnimId) cancelAnimationFrame(fxAnimId);
    if (bgAnimId) cancelAnimationFrame(bgAnimId);
    fxAnimId = null; bgAnimId = null;
    particles = [];
    document.getElementById('cloudsBox')?.remove();
    clearLightning();
}

// ===== STARS =====
function startStars() {
    particles = Array.from({ length: 250 }, () => ({
        x: Math.random() * fxCanvas.width,
        y: Math.random() * fxCanvas.height * 0.75,
        r: Math.random() * 1.8 + 0.3,
        op: Math.random(),
        speed: Math.random() * 0.015 + 0.003,
        dir: Math.random() > 0.5 ? 1 : -1,
        color: Math.random() > 0.9 ? '#aaddff' : '#fffff0'
    }));

    // Shooting stars
    let shootTimer = 0;
    function loop() {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        particles.forEach(s => {
            s.op += s.speed * s.dir;
            if (s.op >= 1 || s.op <= 0.05) s.dir *= -1;
            fxCtx.beginPath();
            fxCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            fxCtx.fillStyle = `rgba(${s.color === '#aaddff' ? '170,221,255' : '255,255,240'}, ${s.op})`;
            fxCtx.fill();
        });

        shootTimer++;
        if (shootTimer % 180 === 0) drawShootingStar();

        fxAnimId = requestAnimationFrame(loop);
    }
    loop();
}

function drawShootingStar() {
    const x = Math.random() * fxCanvas.width * 0.7;
    const y = Math.random() * fxCanvas.height * 0.4;
    const len = 120;
    const angle = Math.PI / 6;
    let progress = 0;

    function shoot() {
        fxCtx.save();
        fxCtx.translate(x + Math.cos(angle) * len * progress, y + Math.sin(angle) * len * progress);
        const grad = fxCtx.createLinearGradient(-len * 0.3, 0, 0, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, `rgba(255,255,255,${1 - progress})`);
        fxCtx.strokeStyle = grad;
        fxCtx.lineWidth = 2;
        fxCtx.beginPath();
        fxCtx.moveTo(-len * 0.3, 0);
        fxCtx.lineTo(0, 0);
        fxCtx.stroke();
        fxCtx.restore();
        progress += 0.04;
        if (progress < 1) requestAnimationFrame(shoot);
    }
    shoot();
}

// ===== RAIN =====
function startRain(heavy = false) {
    const count = heavy ? 300 : 160;
    particles = Array.from({ length: count }, () => ({
        x: Math.random() * fxCanvas.width,
        y: Math.random() * fxCanvas.height,
        len: Math.random() * 20 + (heavy ? 20 : 8),
        speed: Math.random() * (heavy ? 18 : 10) + (heavy ? 12 : 6),
        op: Math.random() * 0.5 + 0.2,
        w: Math.random() * 1.5 + 0.5
    }));

    function loop() {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        particles.forEach(d => {
            fxCtx.beginPath();
            fxCtx.moveTo(d.x, d.y);
            fxCtx.lineTo(d.x - d.len * 0.25, d.y + d.len);
            fxCtx.strokeStyle = `rgba(174,214,241,${d.op})`;
            fxCtx.lineWidth = d.w;
            fxCtx.stroke();
            d.y += d.speed;
            d.x -= d.speed * 0.25;
            if (d.y > fxCanvas.height) { d.y = -d.len; d.x = Math.random() * fxCanvas.width; }
        });
        fxAnimId = requestAnimationFrame(loop);
    }
    loop();
}

function startHeavyRain() { startRain(true); }

// ===== LIGHTNING =====
let lightningTimer = null;
function startLightningLoop() {
    function strike() {
        const delay = Math.random() * 4000 + 1500;
        lightningTimer = setTimeout(() => {
            drawLightningBolt();
            if (currentState === 'stormy') strike();
        }, delay);
    }
    strike();
}

function drawLightningBolt() {
    let x = Math.random() * fxCanvas.width;
    let y = 0;
    const points = [{ x, y }];
    while (y < fxCanvas.height * 0.65) {
        x += (Math.random() - 0.5) * 100;
        y += Math.random() * 80 + 20;
        points.push({ x, y });
    }

    let op = 1;
    function flash() {
        fxCtx.save();
        fxCtx.strokeStyle = `rgba(255,255,220,${op})`;
        fxCtx.lineWidth = op > 0.5 ? 3 : 1.5;
        fxCtx.shadowBlur = 30;
        fxCtx.shadowColor = 'rgba(220,220,255,0.9)';
        fxCtx.beginPath();
        fxCtx.moveTo(points[0].x, points[0].y);
        points.forEach(p => fxCtx.lineTo(p.x, p.y));
        fxCtx.stroke();
        fxCtx.restore();

        if (op > 0.5) document.body.style.filter = `brightness(${1 + op * 0.4})`;
        else document.body.style.filter = '';

        op -= 0.08;
        if (op > 0) requestAnimationFrame(flash);
        else document.body.style.filter = '';
    }
    flash();
}

function clearLightning() {
    if (lightningTimer) clearTimeout(lightningTimer);
    lightningTimer = null;
    document.body.style.filter = '';
}

// ===== SNOW =====
function startSnow() {
    particles = Array.from({ length: 180 }, () => ({
        x: Math.random() * fxCanvas.width,
        y: Math.random() * fxCanvas.height,
        r: Math.random() * 4 + 1.5,
        speed: Math.random() * 1.5 + 0.4,
        drift: Math.random() * 1.2 - 0.6,
        op: Math.random() * 0.6 + 0.3,
        angle: Math.random() * Math.PI * 2,
        wobble: Math.random() * 0.02
    }));

    function loop() {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        const t = Date.now() / 3000;
        particles.forEach(s => {
            s.y += s.speed;
            s.x += s.drift + Math.sin(t + s.angle) * 0.5;
            if (s.y > fxCanvas.height + 10) { s.y = -10; s.x = Math.random() * fxCanvas.width; }

            fxCtx.beginPath();
            fxCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            fxCtx.fillStyle = `rgba(255,255,255,${s.op})`;
            fxCtx.fill();

            // Snowflake shine
            fxCtx.beginPath();
            fxCtx.arc(s.x - s.r * 0.3, s.y - s.r * 0.3, s.r * 0.3, 0, Math.PI * 2);
            fxCtx.fillStyle = `rgba(255,255,255,${s.op * 0.8})`;
            fxCtx.fill();
        });
        fxAnimId = requestAnimationFrame(loop);
    }
    loop();
}

// ===== FOG =====
function startFog() {
    particles = Array.from({ length: 10 }, () => ({
        x: Math.random() * fxCanvas.width,
        y: Math.random() * fxCanvas.height,
        w: Math.random() * 500 + 200,
        h: Math.random() * 120 + 60,
        speed: Math.random() * 0.4 + 0.1,
        op: Math.random() * 0.1 + 0.04
    }));

    function loop() {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        particles.forEach(f => {
            const g = fxCtx.createRadialGradient(f.x + f.w/2, f.y + f.h/2, 0, f.x + f.w/2, f.y + f.h/2, f.w/2);
            g.addColorStop(0, `rgba(200,210,215,${f.op})`);
            g.addColorStop(1, 'rgba(200,210,215,0)');
            fxCtx.fillStyle = g;
            fxCtx.fillRect(f.x, f.y, f.w, f.h);
            f.x += f.speed;
            if (f.x > fxCanvas.width + f.w) f.x = -f.w;
        });
        fxAnimId = requestAnimationFrame(loop);
    }
    loop();
}

// ===== HEAT PARTICLES =====
function startHeatParticles() {
    particles = Array.from({ length: 20 }, () => ({
        x: Math.random() * fxCanvas.width,
        y: fxCanvas.height * 0.6 + Math.random() * fxCanvas.height * 0.4,
        w: Math.random() * 300 + 100,
        speed: Math.random() * 0.4 + 0.2,
        phase: Math.random() * Math.PI * 2,
        op: Math.random() * 0.06 + 0.02
    }));

    function loop() {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        const t = Date.now() / 1500;
        particles.forEach(w => {
            const yo = Math.sin(t * w.speed + w.phase) * 8;
            const g = fxCtx.createLinearGradient(w.x, 0, w.x + w.w, 0);
            g.addColorStop(0, 'rgba(255,180,50,0)');
            g.addColorStop(0.5, `rgba(255,180,50,${w.op})`);
            g.addColorStop(1, 'rgba(255,180,50,0)');
            fxCtx.fillStyle = g;
            fxCtx.fillRect(w.x, w.y + yo, w.w, 4);
        });
        fxAnimId = requestAnimationFrame(loop);
    }
    loop();
}

// ===== CLOUDS =====
function addClouds(n, dark, storm = false) {
    let box = document.getElementById('cloudsBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'cloudsBox';
        box.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden;';
        document.body.appendChild(box);
    }
    box.innerHTML = '';

    for (let i = 0; i < n; i++) {
        const scale = Math.random() * 0.6 + 0.7;
        const top = Math.random() * 35 + 2;
        const dur = Math.random() * 80 + 50;
        const delay = Math.random() * -80;
        const opacity = Math.random() * 0.2 + 0.8;

        const cloud = document.createElement('div');
        cloud.style.cssText = `
            position: absolute;
            top: ${top}%;
            left: -500px;
            transform: scale(${scale});
            transform-origin: left center;
            animation: cloudDrift ${dur}s linear ${delay}s infinite;
            opacity: ${opacity};
            filter: ${storm ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' : dark ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' : 'drop-shadow(0 8px 20px rgba(100,150,255,0.3))'};
        `;

        cloud.innerHTML = buildCloud3D(dark, storm);
        box.appendChild(cloud);
    }

    if (!document.getElementById('cloudStyle')) {
        const s = document.createElement('style');
        s.id = 'cloudStyle';
        s.textContent = `@keyframes cloudDrift { from{left:-500px} to{left:calc(100vw + 500px)} }`;
        document.head.appendChild(s);
    }
}

function buildCloud3D(dark, storm) {
    // Color palette
    const base = storm
        ? ['#2c2c3e', '#1e1e2e', '#3a3a4e', '#252535']
        : dark
        ? ['#4a4a5e', '#3d3d52', '#555568', '#424255']
        : ['#ffffff', '#f0f4ff', '#e8eeff', '#f8faff'];

    const shadow = storm
        ? 'rgba(0,0,0,0.7)'
        : dark
        ? 'rgba(0,0,0,0.5)'
        : 'rgba(100,130,200,0.25)';

    const highlight = storm
        ? 'rgba(80,80,100,0.3)'
        : dark
        ? 'rgba(120,120,150,0.3)'
        : 'rgba(255,255,255,0.95)';

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160">
        <defs>
            <!-- Main cloud gradient - gives 3D depth -->
            <radialGradient id="cg1_${Math.random().toString(36).substr(2,5)}" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stop-color="${highlight}"/>
                <stop offset="40%" stop-color="${base[0]}"/>
                <stop offset="100%" stop-color="${base[1]}"/>
            </radialGradient>
            <radialGradient id="cg2_${Math.random().toString(36).substr(2,5)}" cx="40%" cy="25%" r="55%">
                <stop offset="0%" stop-color="${highlight}"/>
                <stop offset="50%" stop-color="${base[2]}"/>
                <stop offset="100%" stop-color="${base[3]}"/>
            </radialGradient>
            <radialGradient id="cg3_${Math.random().toString(36).substr(2,5)}" cx="45%" cy="28%" r="58%">
                <stop offset="0%" stop-color="${highlight}"/>
                <stop offset="45%" stop-color="${base[0]}"/>
                <stop offset="100%" stop-color="${base[1]}"/>
            </radialGradient>
            <!-- Bottom shadow for 3D effect -->
            <linearGradient id="shadowGrad_${Math.random().toString(36).substr(2,5)}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="transparent"/>
                <stop offset="100%" stop-color="${shadow}"/>
            </linearGradient>
            <filter id="blur1" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3"/>
            </filter>
            <filter id="blur2" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="1.5"/>
            </filter>
        </defs>

        <!-- Bottom shadow layer -->
        <ellipse cx="160" cy="148" rx="130" ry="14"
            fill="${shadow}" filter="url(#blur1)" opacity="0.6"/>

        <!-- Main cloud body - back bumps (darker) -->
        <circle cx="80" cy="95" r="42" fill="${base[1]}" opacity="0.9"/>
        <circle cx="130" cy="80" r="52" fill="${base[2]}" opacity="0.9"/>
        <circle cx="200" cy="85" r="46" fill="${base[1]}" opacity="0.9"/>
        <circle cx="250" cy="95" r="38" fill="${base[2]}" opacity="0.9"/>

        <!-- Middle layer -->
        <rect x="60" y="95" width="210" height="45" rx="10" fill="${base[0]}" opacity="0.95"/>

        <!-- Front bumps with 3D gradients -->
        <circle cx="90" cy="88" r="38" fill="url(#cg2_${Math.random().toString(36).substr(2,5)})"/>
        <circle cx="145" cy="68" r="52" fill="url(#cg1_${Math.random().toString(36).substr(2,5)})"/>
        <circle cx="210" cy="75" r="46" fill="url(#cg3_${Math.random().toString(36).substr(2,5)})"/>
        <circle cx="258" cy="88" r="35" fill="url(#cg2_${Math.random().toString(36).substr(2,5)})"/>

        <!-- Base fill -->
        <rect x="62" y="98" width="206" height="42" rx="8" fill="${base[0]}"/>

        <!-- Bottom shadow overlay for 3D depth -->
        <rect x="62" y="115" width="206" height="25" rx="8"
            fill="url(#shadowGrad_${Math.random().toString(36).substr(2,5)})" opacity="0.5"/>

        <!-- Top highlight for 3D shine -->
        <ellipse cx="145" cy="55" rx="45" ry="18"
            fill="${highlight}" opacity="${storm ? 0.05 : dark ? 0.08 : 0.6}"
            filter="url(#blur2)"/>

        ${storm ? `
        <!-- Lightning glow inside storm cloud -->
        <ellipse cx="160" cy="90" rx="60" ry="30"
            fill="rgba(150,120,255,0.06)" filter="url(#blur1)"/>
        ` : ''}
    </svg>`;
}

function addDarkClouds(n) { addClouds(n, true, true); }
// ===== AI ASSISTANT =====
let currentWeatherForAI = null;
let currentForecastForAI = null;

function toggleAI() {
    const panel = document.getElementById('aiPanel');
    panel.classList.toggle('open');
}

function handleAIKey(e) {
    if (e.key === 'Enter') sendAIMessage();
}

async function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const question = input.value.trim();
    if (!question) return;

    if (!currentWeatherForAI) {
        addBotMessage("Please search for a city first so I can help you with weather information! 🌍");
        return;
    }

    addUserMessage(question);
    input.value = '';
    showTyping();

    try {
        const res = await fetch(`${API_URL}/ai-weather`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                weatherData: currentWeatherForAI,
                forecastData:currentForecastForAI            })
        });

        const data = await res.json();
        removeTyping();
        addBotMessage(data.answer);
    } catch (e) {
        removeTyping();
        addBotMessage("Sorry, I couldn't connect to AI. Make sure server is running!");
    }
}

function addUserMessage(text) {
    const msgs = document.getElementById('aiMessages');
    msgs.innerHTML += `
        <div class="ai-message user-message">
            <div class="message-bubble">${text}</div>
        </div>`;
    msgs.scrollTop = msgs.scrollHeight;
}

function addBotMessage(text) {
    const msgs = document.getElementById('aiMessages');
    msgs.innerHTML += `
        <div class="ai-message bot-message">
            <i class="fas fa-robot bot-icon"></i>
            <div class="message-bubble">${text}</div>
        </div>`;
    msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
    const msgs = document.getElementById('aiMessages');
    msgs.innerHTML += `
        <div class="ai-message bot-message" id="typingIndicator">
            <i class="fas fa-robot bot-icon"></i>
            <div class="typing-bubble">AI is thinking... ✨</div>
        </div>`;
    msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}