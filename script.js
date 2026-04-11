const API_URL = 'http://localhost:5000/api';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const weatherDisplay = document.getElementById('weatherDisplay');
const welcomeScreen = document.getElementById('welcomeScreen');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const canvas = document.getElementById('weatherCanvas');
const ctx = canvas.getContext('2d');

// Canvas Setup
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Current weather state
let currentWeatherType = 'default';
let animationId = null;
let particles = [];

// Time Display
function updateTime() {
    const now = new Date();
    document.getElementById('timeDisplay').textContent = now.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}
setInterval(updateTime, 1000);
updateTime();

// Enter Key
cityInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') getWeather();
});

// ===== WEATHER FETCH =====
async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    hideAll();

    try {
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(`${API_URL}/weather/${city}`),
            fetch(`${API_URL}/forecast/${city}`)
        ]);

        if (!weatherRes.ok) {
            showError('City not found. Please check spelling!');
            return;
        }

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        displayWeather(weatherData);
        displayForecast(forecastData);
        loadHistory();

        // Trigger weather animation
        const condition = weatherData.weather[0].main.toLowerCase();
        const isNight = isNightTime(weatherData);
        triggerWeatherAnimation(condition, isNight, weatherData.main.temp);

    } catch (err) {
        showError('Connection error. Make sure server is running!');
    }
}

// ===== IS NIGHT =====
function isNightTime(data) {
    const now = Date.now() / 1000;
    return now < data.sys.sunrise || now > data.sys.sunset;
}

// ===== DISPLAY WEATHER =====
function displayWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('dateText').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('mainTemp').textContent = `${Math.round(data.main.temp)}°`;
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.getElementById('tempRange').textContent = `↓${Math.round(data.main.temp_min)}° ↑${Math.round(data.main.temp_max)}°`;
    document.getElementById('weatherCondition').textContent = data.weather[0].description;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('sunrise').textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunset').textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    weatherDisplay.style.display = 'block';
}

// ===== DISPLAY FORECAST =====
function displayForecast(data) {
    const forecastRow = document.getElementById('forecastRow');
    forecastRow.innerHTML = '';

    const daily = data.list.filter(i => i.dt_txt.includes('12:00:00')).slice(0, 5);

    daily.forEach(day => {
        const date = new Date(day.dt * 1000);
        forecastRow.innerHTML += `
            <div class="forecast-card">
                <p class="f-day">${date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="" />
                <p class="f-temp">${Math.round(day.main.temp)}°</p>
                <p class="f-desc">${day.weather[0].description}</p>
            </div>`;
    });
}

// ===== HISTORY =====
async function loadHistory() {
    try {
        const res = await fetch(`${API_URL}/history`);
        const history = await res.json();
        const tags = document.getElementById('historyTags');
        tags.innerHTML = '';
        history.forEach(item => {
            tags.innerHTML += `<span class="hist-tag" onclick="searchCity('${item.city}')">${item.city}</span>`;
        });
    } catch (e) {}
}

function searchCity(city) {
    cityInput.value = city;
    getWeather();
}

async function clearHistory() {
    try {
        await fetch(`${API_URL}/history`, { method: 'DELETE' });
        document.getElementById('historyTags').innerHTML = '';
    } catch (e) {}
}

// ===== ANIMATIONS =====
function triggerWeatherAnimation(condition, isNight, temp) {
    // Stop previous animation
    if (animationId) cancelAnimationFrame(animationId);
    particles = [];

    // Hide all elements first
    document.getElementById('sun').style.display = 'none';
    document.getElementById('moon').style.display = 'none';
    document.getElementById('cloudsContainer').innerHTML = '';
    document.getElementById('lightning').style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Determine weather type
    if (isNight) {
        setNightAnimation();
    } else if (condition.includes('thunder') || condition.includes('storm')) {
        setStormyAnimation();
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
        setRainyAnimation();
    } else if (condition.includes('snow')) {
        setSnowyAnimation();
    } else if (condition.includes('cloud')) {
        setCloudyAnimation();
    } else if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
        setFoggyAnimation();
    } else if (condition.includes('clear') || condition.includes('sun')) {
        if (temp > 32) {
            setHotAnimation();
        } else {
            setSunnyAnimation();
        }
    } else {
        setSunnyAnimation();
    }
}

// ===== NIGHT =====
function setNightAnimation() {
    document.body.className = 'weather-night';
    document.getElementById('moon').style.display = 'block';
    createStars();
    animateStars();
}

function createStars() {
    particles = [];
    for (let i = 0; i < 200; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.7,
            size: Math.random() * 2.5 + 0.5,
            opacity: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleDir: Math.random() > 0.5 ? 1 : -1
        });
    }
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDir;
        if (star.opacity >= 1 || star.opacity <= 0.1) star.twinkleDir *= -1;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 240, ${star.opacity})`;
        ctx.fill();
    });
    animationId = requestAnimationFrame(animateStars);
}

// ===== SUNNY =====
function setSunnyAnimation() {
    document.body.className = 'weather-sunny';
    document.getElementById('sun').style.display = 'block';
    createClouds(3, false);
}

// ===== HOT =====
function setHotAnimation() {
    document.body.className = 'weather-hot';
    document.getElementById('sun').style.display = 'block';
    createClouds(2, false);
    createHeatWaves();
    animateHeatWaves();
}

function createHeatWaves() {
    particles = [];
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height * 0.7 + Math.random() * canvas.height * 0.3,
            width: Math.random() * 200 + 100,
            opacity: 0,
            speed: Math.random() * 0.5 + 0.3,
            offset: Math.random() * Math.PI * 2
        });
    }
}

function animateHeatWaves() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() / 1000;
    particles.forEach(wave => {
        const yOffset = Math.sin(time * wave.speed + wave.offset) * 10;
        const gradient = ctx.createLinearGradient(wave.x, wave.y + yOffset, wave.x + wave.width, wave.y + yOffset);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.08)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(wave.x, wave.y + yOffset, wave.width, 3);
    });
    animationId = requestAnimationFrame(animateHeatWaves);
}

// ===== CLOUDY =====
function setCloudyAnimation() {
    document.body.className = 'weather-cloudy';
    createClouds(6, false);
}

// ===== RAINY =====
function setRainyAnimation() {
    document.body.className = 'weather-rainy';
    createClouds(5, true);
    createRaindrops();
    animateRain();
}

function createRaindrops() {
    particles = [];
    for (let i = 0; i < 200; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 20 + 10,
            speed: Math.random() * 8 + 10,
            opacity: Math.random() * 0.6 + 0.2,
            width: Math.random() * 1.5 + 0.5
        });
    }
}

function animateRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * 0.2, drop.y + drop.length);
        ctx.strokeStyle = `rgba(174, 214, 241, ${drop.opacity})`;
        ctx.lineWidth = drop.width;
        ctx.stroke();
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.2;
        if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
        }
    });
    animationId = requestAnimationFrame(animateRain);
}

// ===== STORMY =====
function setStormyAnimation() {
    document.body.className = 'weather-stormy';
    createClouds(7, true);
    createRaindrops();
    animateStorm();
    startLightning();
}

function animateStorm() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * 0.3, drop.y + drop.length);
        ctx.strokeStyle = `rgba(174, 214, 241, ${drop.opacity * 0.8})`;
        ctx.lineWidth = drop.width * 1.5;
        ctx.stroke();
        drop.y += drop.speed * 1.5;
        drop.x -= drop.speed * 0.4;
        if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
        }
    });
    animationId = requestAnimationFrame(animateStorm);
}

function startLightning() {
    function flash() {
        const delay = Math.random() * 5000 + 2000;
        setTimeout(() => {
            drawLightning();
            if (currentWeatherType === 'stormy') flash();
        }, delay);
    }
    currentWeatherType = 'stormy';
    flash();
}

function drawLightning() {
    const x = Math.random() * canvas.width;
    let y = 0;
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 255, 200, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (y < canvas.height * 0.6) {
        x += (Math.random() - 0.5) * 80;
        y += Math.random() * 60 + 20;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Flash effect
    document.body.style.filter = 'brightness(1.5)';
    setTimeout(() => document.body.style.filter = '', 80);
}

// ===== SNOWY =====
function setSnowyAnimation() {
    document.body.className = 'weather-snowy';
    createClouds(4, false);
    createSnowflakes();
    animateSnow();
}

function createSnowflakes() {
    particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 5 + 2,
            speed: Math.random() * 2 + 0.5,
            drift: Math.random() * 2 - 1,
            opacity: Math.random() * 0.7 + 0.3,
            angle: Math.random() * Math.PI * 2
        });
    }
}

function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() / 3000;
    particles.forEach(flake => {
        flake.y += flake.speed;
        flake.x += flake.drift + Math.sin(time + flake.angle) * 0.5;
        if (flake.y > canvas.height) {
            flake.y = -10;
            flake.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();
    });
    animationId = requestAnimationFrame(animateSnow);
}

// ===== FOGGY =====
function setFoggyAnimation() {
    document.body.className = 'weather-foggy';
    createFogLayers();
    animateFog();
}

function createFogLayers() {
    particles = [];
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: Math.random() * 400 + 200,
            height: Math.random() * 100 + 50,
            speed: Math.random() * 0.5 + 0.1,
            opacity: Math.random() * 0.15 + 0.05
        });
    }
}

function animateFog() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(fog => {
        const gradient = ctx.createRadialGradient(
            fog.x + fog.width/2, fog.y + fog.height/2, 0,
            fog.x + fog.width/2, fog.y + fog.height/2, fog.width/2
        );
        gradient.addColorStop(0, `rgba(220, 220, 220, ${fog.opacity})`);
        gradient.addColorStop(1, 'rgba(220, 220, 220, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(fog.x, fog.y, fog.width, fog.height);
        fog.x += fog.speed;
        if (fog.x > canvas.width + fog.width) fog.x = -fog.width;
    });
    animationId = requestAnimationFrame(animateFog);
}

// ===== CLOUDS =====
function createClouds(count, dark) {
    const container = document.getElementById('cloudsContainer');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const cloud = document.createElement('div');
        const w = Math.random() * 200 + 100;
        const h = w * 0.4;
        const top = Math.random() * 40 + 5;
        const duration = Math.random() * 60 + 40;
        const delay = Math.random() * -60;
        cloud.className = `cloud ${dark ? 'cloud-dark' : ''}`;
        cloud.style.cssText = `
            width: ${w}px; height: ${h}px;
            top: ${top}%; left: -300px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            opacity: ${Math.random() * 0.4 + 0.6};
        `;
        cloud.style.setProperty('--cloud-before-w', `${w * 0.6}px`);
        cloud.style.setProperty('--cloud-before-h', `${w * 0.6}px`);

        // Add pseudo-cloud bumps with child divs
        const bump1 = document.createElement('div');
        bump1.style.cssText = `
            position: absolute;
            width: ${w * 0.5}px; height: ${w * 0.5}px;
            background: ${dark ? 'rgba(100,100,120,0.8)' : 'rgba(255,255,255,0.95)'};
            border-radius: 50%;
            top: ${-w * 0.25}px; left: ${w * 0.1}px;
        `;
        const bump2 = document.createElement('div');
        bump2.style.cssText = `
            position: absolute;
            width: ${w * 0.35}px; height: ${w * 0.35}px;
            background: ${dark ? 'rgba(100,100,120,0.8)' : 'rgba(255,255,255,0.95)'};
            border-radius: 50%;
            top: ${-w * 0.15}px; left: ${w * 0.45}px;
        `;
        cloud.appendChild(bump1);
        cloud.appendChild(bump2);
        container.appendChild(cloud);
    }
}

// ===== HELPERS =====
function hideAll() {
    errorMsg.style.display = 'none';
    weatherDisplay.style.display = 'none';
    welcomeScreen.style.display = 'none';
}

function showError(msg) {
    errorText.textContent = msg;
    errorMsg.style.display = 'flex';
    welcomeScreen.style.display = 'block';
}