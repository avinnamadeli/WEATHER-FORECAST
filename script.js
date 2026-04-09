const API_KEY = "14c05e412b66245d2a162203a2d47eb8";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const cityInput = document.getElementById("cityInput");
const weatherContainer = document.getElementById("weatherContainer");
const welcomeMsg = document.getElementById("welcomeMsg");
const errorMsg = document.getElementById("errorMsg");
const errorText = document.getElementById("errorText");

// Allow Enter key to search
cityInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") getWeather();
});

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    hideAll();

    try {
        // Fetch current weather
        const weatherRes = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!weatherRes.ok) {
            showError("City not found. Please check the spelling and try again.");
            return;
        }

        const weatherData = await weatherRes.json();

        // Fetch 5-day forecast
        const forecastRes = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastRes.json();

        displayWeather(weatherData);
        displayForecast(forecastData);

    } catch (err) {
        showError("Something went wrong. Please check your internet connection.");
    }
}

function displayWeather(data) {
    // City and Date
    document.getElementById("cityName").textContent =
        `${data.name}, ${data.sys.country}`;
    document.getElementById("dateTime").textContent = getFormattedDate();

    // Temperature
    document.getElementById("temp").textContent =
        `${Math.round(data.main.temp)}°C`;
    document.getElementById("feelsLike").textContent =
        `Feels like ${Math.round(data.main.feels_like)}°C`;

    // Description and Icon
    document.getElementById("weatherDesc").textContent =
        data.weather[0].description;
    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Stats
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

    // Sunrise & Sunset
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

    // Get one forecast per day (at 12:00:00)
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
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
                <p class="f-temp">${temp}°C</p>
                <p class="f-desc">${desc}</p>
            </div>
        `;
    });
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