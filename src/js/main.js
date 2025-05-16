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
    const geoData = await fetch(
      `${GEOCODING_URL}?q=${query}&limit=5&appid=${API_KEY}`
    );

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
    weatherCards.innerHTML = `<p class=error-message>Erro na busca: ${error.message}</p>`;
  } finally {
    weatherCards.classList.remove("loading");
  }
}

async function fetchWeatherData(city) {
  try {
    const response = await fetch(
      `${BASE_URL}?q=${cityName}&appid=${API_KEY}&units=metric&lang=pt_br`
    );
    if (!response.ok) throw new Error("Cidade não encontrada");
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return null;
  }
}

// filtra cidades únicas
function filterUniqueCities(cities) {
  const unique = [];
  const seen = new Set();

  for (const city of cities) {
    const key = `${city.name.toLowerCase()}_${city.country.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(city);
    }
  }
  return unique.slice(0, 5); // retorna no máximo 5 cidades
}

function createWeatherCard(weatherData) {
  const weatherId = weatherData.weather[0].main.toLowerCase();
  const condition = weatherConditions[weatherId] || {
    type: "unknown",
    img: "cloudy.png",
  };

  const localTime = new Date((weatherData.dt + weatherData.timezone) * 1000);
  const options = { weekday: "long", hour: "2-digit", minute: "2-digit" };
  const localTimeString = localTime.toLocaleDateString("pt-BR", options);

  const card = document.createElement("div");
  card.className = "weather-card";
  card.dataset.temp = Math.round(weatherData.main.temp);
  card.dataset.wind = Math.round(weatherData.wind.speed);
  card.dataset.condition = condition.type;

  card.innerHTML = `
    <div class="weather-icon">
      <img class="weather-img" src="./assets/${condition.img}" alt="condition">
    </div>
    <div class="weather-info">
      <h2 class="city-name">${
        weatherData.name
      }<span class="weather-temp">${Math.round(
    weatherData.main.temp
  )}°C</span></h2>
      <p class="weather-wind"> Vento: ${Math.round(
        weatherData.wind.speed
      )} km/h</p>
      <p class="weather-time">${localTimeString}</p>
      <p class="weather-condition">${weatherData.weather[0].description}</p>
    </div>
  `;

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "x";
  closeBtn.className = "close-btn";
  closeBtn.onclick = () => {
    searchedCities = searchedCities.filter((city) => city !== weatherData.name);
    renderWeatherCards();
  };

  card.appendChild(closeBtn);

  return card;
}

async function searchWeather() {
  const cityName = searchInput.value.trim();
  if (cityName.length < 3 || searchedCities.includes(cityName)) {
    return;
  }

  try {
    weatherCards.innerHTML = '<div class="loading-spinner"></div>';
    const data = await fetchWeatherData(cityName);

    if (!data) {
      weatherCards.innerHTML =
        '<p class="error-message">Cidade não encontrada</p>';
      return;
    }

    searchedCities.push(cityName);
    await renderWeatherCards();
  } catch (error) {
    console.error("Erro na busca:", error);
    weatherCards.innerHTML = `<p class="error-message">Erro ao buscar dados: ${error.message}</p>`;
  }
}

async function renderWeatherCards() {
  if (searchedCities.length === 0) {
    weatherCards.innerHTML =
      "<p class='search-message'>Busque uma cidade para começar</p>";
    return;
  }

  try {
    weatherCards.innerHTML = '<div class="loading-spinner"></div>';
    let hasError = false;

    weatherCards.innerHTML = "";

    for (const city of searchedCities) {
      const data = await fetchWeatherData(city);
      if (data) {
        const card = createWeatherCard(data);
        weatherCards.appendChild(card);
      } else {
        hasError = true;
      }
    }

    if (hasError) {
      const errorElement = document.createElement("p");
      errorElement.className = "error-message";
      errorElement.textContent = "Algumas cidades não puderam ser carregadas";
      weatherCards.appendChild(errorElement);
    }
  } catch (error) {
    weatherCards.innerHTML = `<p class="error-message">Erro ao renderizar cartões: ${error.message}</p>`;
  }
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
