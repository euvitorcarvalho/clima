// configurações
const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct";

// elementos DOM
const searchInput = document.getElementById("searchInput");
const weatherCards = document.getElementById("weatherCards");
const temperatureFilter = document.getElementById("temperatureFilter");
const windFilter = document.getElementById("windFilter");
const conditionFilter = document.getElementById("conditionFilter");

// estado da aplicação
let currentSearchTerm = "";
let citiesData = [];

// mapeamento de condições climáticas
const weatherConditions = {
  clear: { type: "sunny", img: "sunny.png" },
  clouds: { type: "cloudy", img: "cloudy.png" },
  rain: { type: "rainy", img: "rainy.png" },
  drizzle: { type: "rainy", img: "rainy.png" },
  thunderstorm: { type: "rainy", img: "rainy.png" },
  snow: { type: "rainy", img: "rainy.png" },
  mist: { type: "cloudy", img: "cloudy.png" },
  smoke: { type: "cloudy", img: "cloudy.png" },
  haze: { type: "cloudy", img: "cloudy.png" },
  fog: { type: "cloudy", img: "cloudy.png" },
};

// função de busca dinâmica
async function dynamicSearch(query) {
  if (query.length < 3) {
    weatherCards.innerHTML = "";
    return;
  }

  currentSearchTerm = query;
  weatherCards.classList.add("loading");

  try {
    // busca cidades correspondentes
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

    // gera cartões para cada cidade
    for (const city of citiesData) {
      const weatherData = await fetchWeatherData(
        `${city.name}, ${city.country}`
      );
      if (weatherData) {
        const card = createWeatherCard(weatherData, query);
        weatherCards.appendChild(card);
      }
    }

    applyFilters(); // aplica filtros
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

async function fetchWeatherData(city) {
  try {
    const response = await fetch(
      `${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=pt_br`
    );
    if (!response.ok) throw new Error("Cidade não encontrada");
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return null;
  }
}

// filtra cidades únicas criando keys
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
  const localTimeString = localTime.toLocaleDateString("pt-BR", options);

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
      <img class="weather-img" src="./assets/${condition.img}" alt="condition">
    </div>
    <div class="weather-info">
      <h2 class="city-name">
      <img class="flag"
        src="https://flagcdn.com/${data.sys.country.toLowerCase()}.svg"
        alt="${data.sys.country}"> 
      ${highlightedName}
      <span class="weather-temp">${Math.round(data.main.temp)}°C</span></h2>
      <p class="weather-wind"> Vento: ${Math.round(data.wind.speed)} km/h</p>
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

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
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
  "<p class='search-message'>Busque uma cidade para começar</p>";
