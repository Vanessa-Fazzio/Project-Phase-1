const airportNames = {
  JFK: "John F Kennedy International Airport",
  LHR: "Heathrow Airport",
  CDG: "Charles de Gaulle Airport"
};

let allFlights = [];
const likeCounts = {};

function showLoading(show) {
  const spinner = document.getElementById("spinner");
  spinner.style.display = show ? "block" : "none";
}

async function fetchFlights() {
  const url = 'https://opensky-network.org/api/states/all';
  try {
    showLoading(true);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Network response was not ok (status: ${res.status})`);
    }
    const data = await res.json();
    allFlights = (data.states || []).map(flight => ({
      icao24: flight[0],
      callsign: flight[1]?.trim() || "Unknown",
      originCountry: flight[2],
      longitude: flight[5],
      latitude: flight[6],
      dep: flight[2],
      arr: flight[2],
      lastContact: flight[4]
    }));
    renderFlights(allFlights);
  } catch (err) {
    document.getElementById("flightsContainer").innerHTML = `
      <div class="api-error">
        <strong>Failed to load flights.</strong><br>
        <span>${err.message ? err.message : "Please check your internet connection or try again later."}</span>
        <br>
        <button id="retry-btn" class="like-btn" style="margin-top:12px;">Retry</button>
      </div>
    `;
    const retryBtn = document.getElementById("retry-btn");
    if (retryBtn) {
      retryBtn.onclick = () => fetchFlights();
    }
  } finally {
    showLoading(false);
  }
}

function renderFlights(flights) {
  const container = document.getElementById("flightsContainer");
  container.innerHTML = "";
  if (!flights.length) {
    return;
  }
  flights.slice(0, 20).forEach(flight => {
    const id = flight.icao24;
    if (!(id in likeCounts)) likeCounts[id] = 0;
    const lastSeen = flight.lastContact
      ? new Date(flight.lastContact * 1000).toLocaleTimeString()
      : "N/A";
    const likedClass = likeCounts[id] > 0 ? "liked" : "";
    const likeBtnClass = likeCounts[id] > 0 ? "like-btn liked" : "like-btn";
    const flightHTML = `
      <div class="flight ${likedClass}">
        <strong>Flight:</strong> ${flight.callsign}<br>
        <strong>Origin Country:</strong> ${flight.originCountry}<br>
        <strong>Coordinates:</strong> ${flight.latitude?.toFixed(2)}, ${flight.longitude?.toFixed(2)}<br>
        <strong>Last Seen:</strong> ${lastSeen}<br>
        <button class="${likeBtnClass}" data-id="${id}">👍 Like</button>
        <span id="like-count-${id}">${likeCounts[id]}</span> likes
      </div>
    `;
    container.insertAdjacentHTML('beforeend', flightHTML);
  });
}

document.getElementById("flightsContainer").addEventListener("click", function(e) {
  if (e.target.classList.contains("like-btn")) {
    const id = e.target.getAttribute("data-id");
    if (!id) return; 
    likeCounts[id] = (likeCounts[id] || 0) + 1;
    const countSpan = document.getElementById(`like-count-${id}`);
    if (countSpan) {
      countSpan.textContent = likeCounts[id];
    }
    e.target.classList.add("liked");
    const flightDiv = e.target.closest(".flight");
    if (flightDiv) {
      flightDiv.classList.add("liked");
    }
  }
});

document.getElementById("refresh-btn").addEventListener("click", function(e) {
  e.preventDefault();
  fetchFlights();
});

document.getElementById("search-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const searchInput = document.getElementById("search-input");
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchInput.style.border = "2px solid #ff6a00";
    searchInput.placeholder = "Please enter at least 2 characters";
    setTimeout(() => {
      searchInput.style.border = "";
      searchInput.placeholder = "Search by country";
    }, 1500);
    return;
  }
  renderFlights(
    allFlights.filter(f => {
      const country = f.originCountry?.toUpperCase() || '';
      return country.includes(query.toUpperCase());
    })
  );
  searchInput.value = ""; 
});