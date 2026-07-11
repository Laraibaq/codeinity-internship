
const API_KEY = "958d212b51590d2df461e4d35061c3eb";
const BASE_URL = "https://api.openweathermap.org/data/2.5/";
const DEFAULT_CITY = "London";
const STORAGE_KEY = "atmosphere_recent_searches";

let weatherState = {
    current: null,
    forecast: null,
    unit: 'metric'
};

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const unitC = document.getElementById('unitC');
const unitF = document.getElementById('unitF');
const recentSearchesBox = document.getElementById('recentSearchesBox');
const recentTags = document.getElementById('recentTags');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const loadingMsg = document.getElementById('loadingMsg');
const weatherContent = document.getElementById('weatherContent');

const locationName = document.getElementById('locationName');
const weatherDate = document.getElementById('weatherDate');
const weatherEmoji = document.getElementById('weatherEmoji');
const tempValue = document.getElementById('tempValue');
const tempUnitSymbol = document.getElementById('tempUnitSymbol');
const weatherCondition = document.getElementById('weatherCondition');
const highBadge = document.getElementById('highBadge');
const lowBadge = document.getElementById('lowBadge');
const tempHighLow = document.getElementById('tempHighLow'); 

const feelsLikeVal = document.getElementById('feelsLikeVal');
const humidityVal = document.getElementById('humidityVal');
const windSpeedVal = document.getElementById('windSpeedVal');
const pressureVal = document.getElementById('pressureVal');

const sunriseVal = document.getElementById('sunriseVal');
const sunsetVal = document.getElementById('sunsetVal');
const sunDuration = document.getElementById('sunDuration');
const sunriseSunsetBar = document.getElementById('sunriseSunsetBar');

const rainVal = document.getElementById('rainVal');
const rainPill = document.getElementById('rainPill');

const forecastList = document.getElementById('forecastList');


window.addEventListener('DOMContentLoaded', () => {
    searchBtn.addEventListener('click', () => searchCity());
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCity();
    });
    geoBtn.addEventListener('click', getUserLocation);

    unitC.addEventListener('click', () => {
        if (weatherState.unit === 'metric') return;
        weatherState.unit = 'metric';
        updateUnitButtons();
        renderWeather();
    });

    unitF.addEventListener('click', () => {
        if (weatherState.unit === 'imperial') return;
        weatherState.unit = 'imperial';
        updateUnitButtons();
        renderWeather();
    });

    renderRecentSearches();
    getUserLocation();
});


function updateUnitButtons() {
    if (weatherState.unit === 'metric') {
        unitC.classList.add('active');
        unitF.classList.remove('active');
    } else {
        unitF.classList.add('active');
        unitC.classList.remove('active');
    }
}


function getUserLocation() {
    setLoading(true);
    hideError();

   
    if (!navigator.geolocation) {
        showError('Your browser does not support location. Please search for a city manually.');
        setLoading(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            fetchWeatherData('coords', {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude
            });
        },

        (err) => {
            switch (err.code) {
                case 1: 
                    showError(
                        'Location access was blocked. ' +
                        'Please click the 🔒 lock icon in your browser address bar → ' +
                        'set Location to "Allow", then try again. ' +
                        'Note: Opening the file directly (file://) also blocks location — ' +
                        'use a local server (e.g. VS Code Live Server).'
                    );
                    setLoading(false);
                    break;
                case 2: 
                    showError('Location unavailable. Showing default city instead.');
                    fetchWeatherData('name', DEFAULT_CITY);
                    break;
                case 3: 
                    showError('Location request timed out. Showing default city instead.');
                    fetchWeatherData('name', DEFAULT_CITY);
                    break;
                default:
                    showError('Could not get your location. Please search for a city manually.');
                    setLoading(false);
            }
        },

    
        {
            timeout: 10000,      
            maximumAge: 0,   
            enableHighAccuracy: false  
        }
    );
}


function searchCity() {
    const query = cityInput.value.trim();
    if (!query) return;
    setLoading(true);
    hideError();
    fetchWeatherData('name', query);
}

function fetchWeatherData(type, value) {
    let currentUrl = "";
    let forecastUrl = "";

    if (type === 'name') {
        const q = encodeURIComponent(value);
        currentUrl = `${BASE_URL}weather?q=${q}&appid=${API_KEY}&units=metric`;
        forecastUrl = `${BASE_URL}forecast?q=${q}&appid=${API_KEY}&units=metric`;
    } else if (type === 'coords') {
        currentUrl = `${BASE_URL}weather?lat=${value.lat}&lon=${value.lon}&appid=${API_KEY}&units=metric`;
        forecastUrl = `${BASE_URL}forecast?lat=${value.lat}&lon=${value.lon}&appid=${API_KEY}&units=metric`;
    }

    Promise.all([
        fetch(currentUrl).then(async res => {
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const msg = body.message || res.statusText;
                throw new Error(`current:${res.status}:${msg}`);
            }
            return res.json();
        }),
        fetch(forecastUrl).then(async res => {
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const msg = body.message || res.statusText;
                throw new Error(`forecast:${res.status}:${msg}`);
            }
            return res.json();
        })
    ])
        .then(([currentData, forecastData]) => {
            weatherState.current = currentData;
            weatherState.forecast = forecastData;
            saveRecentSearch(currentData.name);
            renderWeather();
            setLoading(false);
            cityInput.value = "";
        })
        .catch((error) => {
            console.error('Weather fetch error:', error.message);
            const parts = error.message.split(':');
            const status = parts[1];
            const apiMsg = parts.slice(2).join(':');

            if (status === '401') {
                showError('API key invalid or not yet active. Keys can take up to 2 hours to activate after registration.');
            } else if (status === '404' || apiMsg?.toLowerCase().includes('not found')) {
                showError('City not found. Please double-check the spelling.');
            } else {
                showError(`Could not retrieve weather. ${apiMsg || 'Please try again.'}`);
            }
            setLoading(false);
        });
}

function renderWeather() {
    const current = weatherState.current;
    const forecast = weatherState.forecast;
    if (!current || !forecast) return;

    const tzOffset = current.timezone; 
    const weatherId = current.weather[0].id;
    const iconCode = current.weather[0].icon;


    weatherEmoji.textContent = getWeatherEmoji(iconCode, weatherId);
    weatherDate.textContent = getCityDateTime(tzOffset);
    locationName.textContent = `${current.name}, ${current.sys.country}`;
    weatherCondition.textContent = current.weather[0].description;

    tempValue.textContent = formatTemp(current.main.temp);
    tempUnitSymbol.textContent = weatherState.unit === 'imperial' ? '°F' : '°C';

    const high = formatTemp(current.main.temp_max);
    const low = formatTemp(current.main.temp_min);
    const sym = weatherState.unit === 'imperial' ? '°F' : '°C';
    highBadge.textContent = `H: ${high}${sym}`;
    lowBadge.textContent = `L: ${low}${sym}`;
    if (tempHighLow) tempHighLow.textContent = `H: ${high}°  •  L: ${low}°`;

    
    const speedUnit = weatherState.unit === 'imperial' ? 'mph' : 'km/h';
    const windSpeed = formatWindSpeed(current.wind.speed);
    const feelSym = weatherState.unit === 'imperial' ? '°F' : '°C';
    feelsLikeVal.textContent = `${formatTemp(current.main.feels_like)}${feelSym}`;
    humidityVal.textContent = `${current.main.humidity}%`;
    windSpeedVal.textContent = `${windSpeed} ${speedUnit}`;
    pressureVal.textContent = `${current.main.pressure} hPa`;

    
    if (current.sys.sunrise && current.sys.sunset) {
        sunriseVal.textContent = formatUnixTime(current.sys.sunrise, tzOffset);
        sunsetVal.textContent = formatUnixTime(current.sys.sunset, tzOffset);
        sunDuration.textContent = getSunDuration(current.sys.sunrise, current.sys.sunset);
        sunriseSunsetBar.style.display = '';
    } else {
        sunriseSunsetBar.style.display = 'none';
    }

    const pop = forecast.list[0]?.pop; 
    if (pop !== undefined && pop !== null) {
        rainVal.textContent = `${Math.round(pop * 100)}%`;
        rainPill.style.display = '';
    } else {
        rainPill.style.display = 'none';
    }

    updateBackgroundOverlay(weatherId, iconCode);


    renderForecast(forecast.list, tzOffset);
}


function renderForecast(forecastListArray, tzOffset) {
    forecastList.innerHTML = "";

    const dailyData = {};
    forecastListArray.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData[date]) dailyData[date] = [];
        dailyData[date].push(item);
    });

   
    const cityNow = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (tzOffset * 1000));
    const cityTodayStr = cityNow.toISOString().split('T')[0];
    delete dailyData[cityTodayStr];

    const dates = Object.keys(dailyData).sort().slice(0, 5);

    dates.forEach(date => {
        const dayForecasts = dailyData[date];

        let minT = Infinity, maxT = -Infinity;
        dayForecasts.forEach(f => {
            if (f.main.temp_min < minT) minT = f.main.temp_min;
            if (f.main.temp_max > maxT) maxT = f.main.temp_max;
        });

        const noonForecast = dayForecasts.find(f => f.dt_txt.includes("12:00:00")) || dayForecasts[Math.floor(dayForecasts.length / 2)];
        const wId = noonForecast.weather[0].id;
        const icon = noonForecast.weather[0].icon;
        const emoji = getWeatherEmoji(icon, wId);

        const dayDate = new Date(date + "T00:00:00");
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[dayDate.getDay()];

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <span class="forecast-emoji">${emoji}</span>
            <span class="forecast-high">${formatTemp(maxT)}°</span>
            <span class="forecast-low">${formatTemp(minT)}°</span>
        `;
        forecastList.appendChild(card);
    });
}

function formatTemp(val) {
    if (weatherState.unit === 'imperial') {
        return Math.round((val * 9 / 5) + 32);
    }
    return Math.round(val);
}


function formatWindSpeed(mps) {
    return weatherState.unit === 'imperial'
        ? Math.round(mps * 2.237)
        : Math.round(mps * 3.6);
}

function formatUnixTime(unixSec, tzOffsetSec) {
    const utcMs = unixSec * 1000;
    const cityMs = utcMs + (tzOffsetSec * 1000);
    const d = new Date(cityMs);
   
    let hours = d.getUTCHours();
    const mins = d.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${String(mins).padStart(2, '0')} ${ampm}`;
}

function getSunDuration(riseSec, setSec) {
    const diffSec = setSec - riseSec;
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    return `${h}h ${m}m`;
}

function getCityDateTime(tzOffsetSec) {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cityMs = utcMs + (tzOffsetSec * 1000);
    const city = new Date(cityMs);
    const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
    return city.toLocaleString('en-US', options);
}

function getWeatherEmoji(iconCode, id) {
    const isDay = iconCode.includes('d');
    if (id === 800) return isDay ? '☀️' : '🌙';
    if (id === 801 || id === 802) return isDay ? '⛅' : '☁️';
    if (id === 803 || id === 804) return '☁️';
    if (id >= 200 && id < 300) return '⛈️';
    if (id >= 300 && id < 400) return '🌦️';
    if (id >= 500 && id < 600) return '🌧️';
    if (id >= 600 && id < 700) return '❄️';
    if (id >= 700 && id < 800) return '🌫️';
    return '🌡️';
}


function updateBackgroundOverlay(weatherId, iconCode) {
    const overlay = document.querySelector('.bg-overlay');
    if (!overlay) return;
    const isDay = iconCode.includes('d');

    if (weatherId === 800 && isDay) {
        overlay.style.background = 'rgba(0,0,0,0.22)';
    } else if (weatherId === 800 && !isDay) {
        overlay.style.background = 'rgba(5,5,20,0.55)';
    } else if (weatherId >= 200 && weatherId < 300) {
        overlay.style.background = 'rgba(10,5,30,0.55)';
    } else if (weatherId >= 500 && weatherId < 600) {
        overlay.style.background = 'rgba(0,10,30,0.50)';
    } else if (weatherId >= 600 && weatherId < 700) {
        overlay.style.background = 'rgba(20,30,50,0.45)';
    } else {
        overlay.style.background = 'rgba(0,0,0,0.30)';
    }
}

function saveRecentSearch(cityName) {
    let searches = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    searches = searches.filter(item => item.toLowerCase() !== cityName.toLowerCase());
    searches.unshift(cityName);
    if (searches.length > 5) searches.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    renderRecentSearches();
}

function renderRecentSearches() {
    const searches = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (searches.length === 0) {
        recentSearchesBox.classList.add('hidden');
        return;
    }

    recentSearchesBox.classList.remove('hidden');
    recentTags.innerHTML = "";

    searches.forEach((city) => {
        const tag = document.createElement('span');
        tag.className = 'recent-tag-item';
        tag.textContent = city;
        tag.addEventListener('click', () => {
            setLoading(true);
            hideError();
            fetchWeatherData('name', city);
        });
        recentTags.appendChild(tag);
    });
}

function setLoading(isLoading) {
    if (isLoading) {
        loadingMsg.classList.remove('hidden');
        weatherContent.classList.add('hidden');
        errorMsg.classList.add('hidden');
    } else {
        loadingMsg.classList.add('hidden');
        weatherContent.classList.remove('hidden');
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMsg.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    loadingMsg.classList.add('hidden');
}

function hideError() {
    errorMsg.classList.add('hidden');
}