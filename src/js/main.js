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

