let chevron = document.querySelector("#filters-icon")
let filters = document.querySelector(".filters")

chevron.onclick = () => {
  chevron.classList.toggle("bx-x")
  filters.style.display = filters.style.display === "flex" ? "none" : "flex";
}