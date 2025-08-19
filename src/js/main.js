import sunnyIcon from "../../assets/sunny.png";
import cloudyIcon from "../../assets/cloudy.png";
import rainyIcon from "../../assets/rainy.png";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct";

const searchInput = document.getElementById("searchInput");
const weatherCards = document.getElementById("weatherCards");
const temperatureFilter = document.getElementById("temperatureFilter");
const windFilter = document.getElementById("windFilter");
const conditionFilter = document.getElementById("conditionFilter");

let currentSearchTerm = "";
let citiesData = [];

const weatherConditions = {
  clear: { type: "sunny", img: sunnyIcon },
  clouds: { type: "cloudy", img: cloudyIcon },
  rain: { type: "rainy", img: rainyIcon },
  drizzle: { type: "rainy", img: rainyIcon },
  thunderstorm: { type: "rainy", img: rainyIcon },
  snow: { type: "rainy", img: rainyIcon },
  mist: { type: "cloudy", img: cloudyIcon },
  smoke: { type: "cloudy", img: cloudyIcon },
  haze: { type: "cloudy", img: cloudyIcon },
  fog: { type: "cloudy", img: cloudyIcon },
};

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

async function fetchWeatherData(city) {
  try {
    const response = await fetch(
      `${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=en_us`
    );
    if (!response.ok) throw new Error("Cidade não encontrada");
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return null;
  }
}

function filterUniqueCities(cities) {
  if (!Array.isArray(cities)) return [];

  const unique = [];
  const seen = new Set();

  for (const city of cities) {
    const key = `${city.name.toLowerCase()}_${city.country.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(city);
    }
  }

  return (
    unique.sort((a, b) => (a.country === "BR" ? -1 : 1)), unique.slice(0, 5)
  );
}

function createWeatherCard(data, searchTerm = "") {
  const weatherId = data.weather[0].main.toLowerCase();
  const condition = weatherConditions[weatherId] || {
    type: "unknown",
    img: "cloudy.png",
  };

  const localTime = new Date((data.dt + data.timezone) * 1000);
  const options = { weekday: "long", hour: "2-digit", minute: "2-digit" };
  const localTimeString = localTime.toLocaleDateString("en-US", options);

  const highlightedName = data.name.replace(
    new RegExp(searchTerm, "gi"),
    (match) => `<span class="highlight">${match}</span>`
  );

  const card = document.createElement("div");
  card.className = "weather-card";
  card.dataset.temp = Math.round(data.main.temp);
  card.dataset.wind = Math.round(data.wind.speed);
  card.dataset.condition = condition.type;

  card.innerHTML = `
    <div class="weather-icon">
      <img class="weather-img" src="${condition.img}" alt="condition">
    </div>
    <div class="weather-info">
      <h2 class="city-name">
      <span class="name-flag">
        <img class="flag" src="https://flagsapi.com/${
          data.sys.country
        }/flat/64.png">
        ${highlightedName}
      </span>
      <span class="weather-temp">${Math.round(data.main.temp)}°C</span></h2>
      <p class="weather-wind"> wind: ${Math.round(data.wind.speed)} km/h</p>
      <p class="weather-time">${localTimeString}</p>
      <p class="weather-condition">${data.weather[0].description}</p>
    </div>
  `;

  return card;
}

function applyFilters() {
  const tempValue = temperatureFilter.value;
  const windValue = windFilter.value;
  const conditionValue = conditionFilter.value;

  document.querySelectorAll(".weather-card").forEach((card) => {
    const temp = card.dataset.temp;
    const wind = card.dataset.wind;
    const condition = card.dataset.condition;

    const tempMatch =
      !tempValue ||
      (tempValue === "hot" && temp > 30) ||
      (tempValue === "mild" && temp >= 15 && temp <= 30) ||
      (tempValue === "cold" && temp < 15);

    const windMatch =
      !windValue ||
      (windValue === "low" && wind > 10) ||
      (windValue === "medium" && wind >= 10 && wind <= 20) ||
      (windValue === "high" && wind < 20);

    const conditionMatch = !conditionValue || condition === conditionValue;

    card.style.display =
      tempMatch && windMatch && conditionMatch ? "block" : "none";
  });
}

async function dynamicSearch(query) {
  if (query.length < 3) {
    weatherCards.innerHTML = "";
    return;
  }

  currentSearchTerm = query;
  weatherCards.classList.add("loading");

  try {
    const response = await fetch(
      `${GEOCODING_URL}?q=${query}&limit=5&appid=${API_KEY}`
    );

    if (!response.ok) throw new Error("Erro na API");

    const geoData = await response.json();

    if (!Array.isArray(geoData)) {
      throw new Error("Dados inválidos na API");
    }

    citiesData = filterUniqueCities(geoData);
    weatherCards.innerHTML = "";

    if (citiesData.length === 0) {
      weatherCards.innerHTML = `<p class="error-message">Nenhuma cidade encontrada</p>`;
      return;
    }

    for (const city of citiesData) {
      const weatherData = await fetchWeatherData(
        `${city.name}, ${city.country}`
      );
      if (weatherData) {
        const card = createWeatherCard(weatherData, query);
        weatherCards.appendChild(card);
      }
    }

    applyFilters();
  } catch (error) {
    console.error("Erro na busca:", error);
    weatherCards.innerHTML = `<p class="error-message">${
      error.message === "Dados inválidos na API"
        ? "Erro na API"
        : "Erro ao buscar cidades"
    }</p>`;
  } finally {
    weatherCards.classList.remove("loading");
  }
}

searchInput.addEventListener(
  "input",
  debounce((e) => {
    const query = e.target.value.trim();
    if (query === currentSearchTerm) return;
    dynamicSearch(query);
  }, 500)
);

temperatureFilter.addEventListener("change", applyFilters);
windFilter.addEventListener("change", applyFilters);
conditionFilter.addEventListener("change", applyFilters);

weatherCards.innerHTML =
  "<p class='search-message'>Search for a city to get started</p>";
