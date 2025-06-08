document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("weather-form");
  const resultsContainer = document.getElementById("results");
  const dayButtons = document.querySelectorAll("#days button");
  const darkToggle = document.getElementById("dark-toggle");
  const communeSelect = document.getElementById("commune");
  const zipcodeInput = document.getElementById("zipcode");
  const resetBtn = document.getElementById("reset-btn");

  let selectedDays = [];

  function fetchAndDisplayWeather() {
    const zipcode = zipcodeInput.value;
    const commune = communeSelect.value;
    const checkboxes = document.querySelectorAll('input[name="options"]:checked');
    const options = Array.from(checkboxes).map((cb) => cb.value);

    if (!zipcode || !commune || selectedDays.length === 0) return;

    resultsContainer.innerHTML = "Chargement des données météo...";

    fetch(`https://api.meteo-concept.com/api/forecast/daily?token=f7d06d2b23546fe98fcab761fda383ba1fc4c9be665e3f1a0e2e9d238538a18a&insee=${commune}&fields=uv`)
      .then((response) => response.json())
      .then((data) => {
        resultsContainer.innerHTML = "";
        selectedDays.forEach((day) => {
          const dataDay = data.forecast[parseInt(day) - 1];
          const card = createWeatherCard(dataDay, options, data.city, commune);
          resultsContainer.appendChild(card);
        });
      })
      .catch(() => {
        resultsContainer.innerHTML = "Erreur lors du chargement des données météo.";
      });
  }

  dayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const day = button.getAttribute("data-day");

      if (selectedDays.includes(day)) {
        selectedDays = selectedDays.filter((d) => d !== day);
        button.classList.remove("selected");
      } else {
        selectedDays.push(day);
        button.classList.add("selected");
      }

      fetchAndDisplayWeather();
    });
  });

  darkToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark");
  });

  zipcodeInput.addEventListener("input", async (e) => {
    const code = e.target.value;
    communeSelect.innerHTML = `<option value="">Chargement...</option>`;

    if (/^\d{5}$/.test(code)) {
      try {
        const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${code}&fields=nom`);
        const data = await response.json();

        if (data.length > 0) {
          communeSelect.innerHTML = `<option value="">Sélectionner une commune</option>`;
          data
            .sort((a, b) => a.nom.localeCompare(b.nom))
            .forEach((commune) => {
              const option = document.createElement("option");
              option.value = commune.nom;
              option.textContent = commune.nom;
              communeSelect.appendChild(option);
            });
        } else {
          communeSelect.innerHTML = `<option value="">Aucune commune trouvée</option>`;
        }
      } catch (err) {
        communeSelect.innerHTML = `<option value="">Erreur de chargement</option>`;
      }
    } else {
      communeSelect.innerHTML = `<option value="">Code postal invalide</option>`;
    }
  });

  communeSelect.addEventListener("change", fetchAndDisplayWeather);
  document.querySelectorAll('input[name="options"]').forEach(input => {
    input.addEventListener("change", fetchAndDisplayWeather);
  });

  resetBtn.addEventListener("click", () => {
    resultsContainer.innerHTML = "";
    selectedDays = [];
    dayButtons.forEach(btn => btn.classList.remove("selected"));
    form.reset();
    communeSelect.innerHTML = `<option value="">Sélectionner une commune</option>`;
  });

  function createWeatherCard(data, options, city, communeName) {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h3");
    const date = new Date(data.datetime);
    title.textContent = `${communeName} - ${date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}`;
    card.appendChild(title);

    const emoji = getWeatherEmoji(data.weather);
    const desc = getWeatherDescription(data.weather);
    card.appendChild(createLine("", `${emoji} ${desc}`));
    card.appendChild(createLine("Min", `${data.tmin}°C`));
    card.appendChild(createLine("Max", `${data.tmax}°C`));

    if (options.includes("lat")) {
      card.appendChild(createLine("Latitude", city.latitude));
    }

    if (options.includes("lon")) {
      card.appendChild(createLine("Longitude", city.longitude));
    }

    if (options.includes("rain")) {
      card.appendChild(createLine("Cumul pluie", `${data.rr10} mm`));
    }

    if (options.includes("wind")) {
      card.appendChild(createLine("Vent moyen", `${data.wind10m} km/h`));
    }

    if (options.includes("winddir")) {
      const direction = degToCardinal(data.dirwind10m);
      card.appendChild(createLine("Direction du vent", direction));
    }

    if (options.includes("uv") && data.uv !== undefined) {
      card.appendChild(createLine("Indice UV", data.uv));
    }

    return card;
  }

  function createLine(label, value) {
    const p = document.createElement("p");
    p.innerHTML = label ? `<strong>${label} :</strong> ${value}` : value;
    return p;
  }

  function degToCardinal(deg) {
    if (deg >= 45 && deg < 135) return "Est";
    if (deg >= 135 && deg < 225) return "Sud";
    if (deg >= 225 && deg < 315) return "Ouest";
    return "Nord";
  }

  function getWeatherEmoji(code) {
    const emojis = {
      0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 4: "☁️", 5: "☁️",
      6: "🌫️", 7: "🌫️", 10: "🌧️", 11: "🌧️", 12: "🌧️",
      13: "🌧️", 14: "🌧️", 15: "🌧️", 16: "🌧️",
      20: "🌨️", 21: "🌨️", 22: "🌨️", 30: "🌨️",
      40: "🌦️", 41: "🌨️", 42: "🌧️", 60: "⛈️", 61: "⛈️", 62: "⛈️",
      100: "❓"
    };
    return emojis[code] || "❓";
  }

  function getWeatherDescription(code) {
    const descriptions = {
      0: "Soleil", 1: "Peu nuageux", 2: "Ciel voilé", 3: "Nuageux", 4: "Très nuageux",
      5: "Couvert", 6: "Brouillard", 7: "Brouillard givrant", 10: "Pluie faible",
      11: "Pluie modérée", 12: "Pluie forte", 13: "Pluie faible verglaçante",
      14: "Pluie modérée verglaçante", 15: "Pluie forte verglaçante", 16: "Bruine",
      20: "Neige faible", 21: "Neige modérée", 22: "Neige forte",
      30: "Pluie et neige mêlées", 40: "Averses de pluie", 41: "Averses de neige",
      42: "Averses mixtes", 60: "Orages faibles", 61: "Orages modérés",
      62: "Orages forts", 100: "Inconnu"
    };
    return descriptions[code] || "Inconnu";
  }
});
