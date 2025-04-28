const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const searchInput = document.getElementById("searchInput");
const weatherCards = document.getElementById("weatherCards");

const weatherConditions = {
  clear: "sunny",
  clouds: "cloudy",
  rain: "rainy",
  drizzle: "rainy",
  thunderstorm: "rainy",
  snow: "snowy",
  mist: "foggy",
  smoke: "foggy",
  haze: "foggy",
  fog: "foggy",
};

// função para buscar dados do clima
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

// função para criar cartão de clima
function createWeatherCard(weatherData) {
  const weatherId = weatherData.weather[0].main.toLowerCase();
  const condition = weatherConditions[weatherId] || "unknown";

  const card = document.createElement("div");
  card.className = "weather-card";
  card.dataset.temp = Math.round(weatherData.main.temp);
  card.dataset.condition = condition;
  card.dataset.wind = Math.round(weatherData.wind.speed);

  card.innerHTML = `
  <h2 class="city-name">${weatherData.name}, ${weatherData.sys.country}</h2>
    <div class="weather-info">
    
  `
}
