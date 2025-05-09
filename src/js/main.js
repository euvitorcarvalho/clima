const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const searchInput = document.getElementById("searchInput");
const weatherCards = document.getElementById("weatherCards");

let searchedCities = [];

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

async function fetchWeatherData(cityName) {
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
  card.dataset.condition = condition.type;
  card.dataset.wind = Math.round(weatherData.wind.speed);

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
      "<p class='search-message'>Busque uma cidade para come~çar</p>";
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

searchInput.addEventListener("input", debounce(searchWeather, 500));
document
  .getElementById("temperatureFilter")
  .addEventListener("change", filterCards);
document.getElementById("windFilter").addEventListener("change", filterCards);
document
  .getElementById("conditionFilter")
  .addEventListener("change", filterCards);

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
