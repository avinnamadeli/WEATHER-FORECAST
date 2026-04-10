const API_URL = 'http://localhost:5000/api';

const cityInput = document.getElementById("cityInput");
const weatherContainer = document.getElementById("weatherContainer");
const welcomeMsg = document.getElementById("welcomeMsg");
const errorMsg = document.getElementById("errorMsg");
const errorText = document.getElementById("errorText");

cityInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") getWeather();
});

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    hideAll();

    try {
        // Fetch from Node.js server
        const weatherRes = await fetch(`${API_URL}/weather/${city}`);

        if (!weatherRes.ok) {
            showError("City not found. Please try again.");
            return;
        }

        const weatherData = await weatherRes.json();

        // Fetch forecast from Java server directly
        const forecastRes = await fetch(`${API_URL}/forecast/${city}`);
        const forecastData = await forecastRes.json();

        displayWeather(weatherData);
        displayForecast(forecastData);
        loadHistory();

    } catch (err) {
        showError("Something went wrong. Please check your connection.");
    }
}

function displayWeather(data) {
    document.getElementById("cityName").textContent =
        `${data.name}, ${data.sys.country}`;
    document.getElementById("dateTime").textContent = getFormattedDate();
    document.getElementById("temp").textContent =
        `${Math.round(data.main.temp)}°C`;
    document.getElementById("feelsLike").textContent =
        `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.getElementById("weatherDesc").textContent =
        data.weather[0].description;
    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById("minMax").textContent =
        `${Math.round(data.main.temp_min)}°C / ${Math.round(data.main.temp_max)}°C`;
    document.getElementById("humidity").textContent =
        `${data.main.humidity}%`;
    document.getElementById("windSpeed").textContent =
        `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    document.getElementById("visibility").textContent =
        `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById("pressure").textContent =
        `${data.main.pressure} hPa`;

    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit"
    });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit"
    });
    document.getElementById("sunriseSunset").textContent =
        `${sunrise} / ${sunset}`;

    weatherContainer.style.display = "block";
}

function displayForecast(data) {
    const forecastGrid = document.getElementById("forecastGrid");
    forecastGrid.innerHTML = "";

    const dailyForecasts = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    ).slice(0, 5);

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const icon = day.weather[0].icon;
        const temp = Math.round(day.main.temp);
        const desc = day.weather[0].description;

        forecastGrid.innerHTML += `
            <div class="forecast-card">
                <p class="day">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" 
                     alt="${desc}" />
                <p class="f-temp">${temp}°C</p>
                <p class="f-desc">${desc}</p>
            </div>
        `;
    });
}

async function loadHistory() {
    try {
        const res = await fetch(`${API_URL}/history`);
        const history = await res.json();

        const historyContainer = document.getElementById("historyList");
        if (!historyContainer) return;

        historyContainer.innerHTML = "";
        history.forEach(item => {
            historyContainer.innerHTML += `
                <span class="history-item" 
                      onclick="searchFromHistory('${item.city}')">
                    ${item.city}
                </span>
            `;
        });
    } catch (err) {
        console.log("History error:", err);
    }
}

function searchFromHistory(city) {
    cityInput.value = city;
    getWeather();
}

function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function showError(message) {
    errorText.textContent = message;
    errorMsg.style.display = "flex";
    welcomeMsg.style.display = "block";
}

function hideAll() {
    errorMsg.style.display = "none";
    weatherContainer.style.display = "none";
    welcomeMsg.style.display = "none";
}
async function clearHistory() {
    try {
        await fetch(`${API_URL}/history`, { method: 'DELETE' });
        document.getElementById("historyList").innerHTML = "";
    } catch (err) {
        console.log("Clear history error:", err);
    }
}