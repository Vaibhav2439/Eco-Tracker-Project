// Globe initialization
const globe = Globe()(document.getElementById('globe'))
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .showAtmosphere(true)
  .atmosphereColor('#3a7bd5')
  .atmosphereAltitude(0.18);

// Get camera and controls
const camera = globe.camera();
const controls = globe.controls();

// Store initial camera position and target (after a short delay to let everything settle)
let initialCameraPos, initialTarget;
setTimeout(() => {
  initialCameraPos = camera.position.clone();
  initialTarget = controls.target.clone();
  console.log('Initial view saved', initialCameraPos, initialTarget);
}, 1000);

// Auto-rotate
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

// Reset view button – works reliably
document.getElementById('resetView').addEventListener('click', () => {
  if (initialCameraPos && initialTarget) {
    camera.position.copy(initialCameraPos);
    controls.target.copy(initialTarget);
    controls.update();
    controls.autoRotate = true; // ensure auto-rotate stays on
  } else {
    // Fallback if not yet stored
    camera.position.set(0, 0.5, 16);
    controls.target.set(0, 0, 0);
    controls.update();
    controls.autoRotate = true;
  }
});

// ----- Country data (with trend and flags) -----
const countries = [
  { name: "China", value: 10.7, level: "critical", trend: "up", flag: "🇨🇳" },
  { name: "United States", value: 5.0, level: "critical", trend: "down", flag: "🇺🇸" },
  { name: "India", value: 2.7, level: "critical", trend: "up", flag: "🇮🇳" },
  { name: "Russia", value: 1.8, level: "critical", trend: "up", flag: "🇷🇺" },
  { name: "Japan", value: 1.2, level: "high", trend: "down", flag: "🇯🇵" },
  { name: "Germany", value: 0.8, level: "high", trend: "down", flag: "🇩🇪" },
  { name: "Iran", value: 0.7, level: "high", trend: "up", flag: "🇮🇷" },
  { name: "South Korea", value: 0.6, level: "high", trend: "up", flag: "🇰🇷" },
  { name: "Saudi Arabia", value: 0.6, level: "high", trend: "up", flag: "🇸🇦" },
  { name: "Indonesia", value: 0.6, level: "high", trend: "up", flag: "🇮🇩" },
  { name: "Canada", value: 0.5, level: "moderate", trend: "down", flag: "🇨🇦" },
  { name: "Mexico", value: 0.5, level: "moderate", trend: "up", flag: "🇲🇽" },
  { name: "Brazil", value: 0.4, level: "moderate", trend: "up", flag: "🇧🇷" },
  { name: "South Africa", value: 0.4, level: "moderate", trend: "up", flag: "🇿🇦" },
  { name: "Australia", value: 0.4, level: "moderate", trend: "down", flag: "🇦🇺" },
  { name: "Turkey", value: 0.4, level: "moderate", trend: "up", flag: "🇹🇷" },
  { name: "United Kingdom", value: 0.3, level: "moderate", trend: "down", flag: "🇬🇧" },
  { name: "France", value: 0.3, level: "moderate", trend: "down", flag: "🇫🇷" },
  { name: "Italy", value: 0.3, level: "low", trend: "down", flag: "🇮🇹" },
  { name: "Poland", value: 0.3, level: "low", trend: "up", flag: "🇵🇱" },
  { name: "Spain", value: 0.2, level: "low", trend: "down", flag: "🇪🇸" },
  { name: "Ukraine", value: 0.2, level: "low", trend: "down", flag: "🇺🇦" },
  { name: "Thailand", value: 0.2, level: "low", trend: "up", flag: "🇹🇭" },
  { name: "Egypt", value: 0.2, level: "low", trend: "up", flag: "🇪🇬" }
];

const colorMap = {
  critical: '#ff4d6d',
  high: '#ff9f4b',
  moderate: '#ffd93d',
  low: '#51d396'
};

// Render country list
function renderCountries(filterText = '') {
  const container = document.getElementById('country-list');
  container.innerHTML = '';
  
  const filtered = countries.filter(c => 
    c.name.toLowerCase().includes(filterText.toLowerCase())
  );
  
  filtered.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'country-item';
    
    const rank = document.createElement('span');
    rank.className = 'country-rank';
    rank.textContent = `${i+1}.`;
    
    const flag = document.createElement('span');
    flag.className = 'country-flag';
    flag.textContent = c.flag;
    
    const name = document.createElement('span');
    name.className = 'country-name';
    name.textContent = c.name;
    
    const value = document.createElement('span');
    value.className = 'country-value';
    value.textContent = c.value.toFixed(1);
    
    const trend = document.createElement('span');
    trend.className = `trend-icon trend-${c.trend}`;
    trend.innerHTML = c.trend === 'up' ? '▲' : '▼';
    
    const dot = document.createElement('span');
    dot.className = 'color-dot-small';
    dot.style.backgroundColor = colorMap[c.level];
    dot.style.boxShadow = `0 0 8px ${colorMap[c.level]}`;
    
    item.appendChild(rank);
    item.appendChild(flag);
    item.appendChild(name);
    item.appendChild(value);
    item.appendChild(trend);
    item.appendChild(dot);
    
    // Optional: click to rotate globe to that country (placeholder)
    item.addEventListener('click', () => {
      console.log(`Focus on ${c.name}`);
    });
    
    container.appendChild(item);
  });
}

// Initial render
renderCountries();

// Search functionality
document.getElementById('countrySearch').addEventListener('input', (e) => {
  renderCountries(e.target.value);
});

// ----- CO₂ meter simulation (with explanation) -----
const ringFill = document.querySelector('.ring-fill');
const co2Value = document.getElementById('co2Value');
let ppm = 425; // starting value

// Add a title attribute to explain the meter
const meterInfo = document.querySelector('.meter-info');
meterInfo.title = "Current atmospheric CO₂ concentration (parts per million) – simulated live data. Pre-industrial level: ~280 ppm, today: >420 ppm.";

setInterval(() => {
  // realistic random walk between 415 and 430 ppm
  ppm += (Math.random() - 0.5) * 0.3;
  ppm = Math.min(430, Math.max(415, ppm));
  co2Value.textContent = ppm.toFixed(0);
  // Fill ring from 280 (pre-industrial) to 500 (extreme) – 425 is ~60%
  const percent = (ppm - 280) / (500 - 280);
  const deg = Math.min(360, Math.max(0, percent * 360));
  ringFill.style.background = `conic-gradient(#4aff9e 0deg ${deg}deg, #3a5f7a ${deg}deg 360deg)`;
}, 2800);