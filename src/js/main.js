const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const searchInput = document.getElementById("searchInput");
const weatherCards = document.getElementById("weatherCards");

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

  return card;
}

async function searchWeather() {
  const cityName = searchInput.value.trim();
  if (cityName.length < 3) {
    weatherCards.innerHTML = "";
    return;
  }

  try {
    const data = await fetchWeatherData(cityName);
    if (data) {
      weatherCards.innerHTML = '';
      const card = createWeatherCard(data);
      weatherCards.appendChild(card);
    }
  } catch (error) {
    console.error(error);
  }
}
