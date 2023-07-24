let sliderTemperatureMap = {
    92: 20,
    93: 21.4,
    94: 21.9,
    95: 22.8,
    96: 23.2,
    97: 23.6,
    98: 24.5,
    99: 25,
    100: 26,
    101: 26.1,
    102: 27,
    103: 28,
    104: 29,
    105: 30,
    106: 30.9,
    107: 32,
    108: 33.4,
    109: 34.2,
    110: 35.5,
    111: 37,
    112: 39,
    113: 40,
    114: 41.7,
    115: 43.5,
    116: 46.4,
    117: 48,
    118: 50,
    119: 52.3,
    120: 56.8,
    121: 59.8,
    122: 63.3,
    123: 67.8,
    124: 75.3,
    125: 82.1,
    126: 92,
    127: 108,
    128: 144
};

function sliderToTemperature(sliderValue) {
    return sliderTemperatureMap[sliderValue];
}

for(let i=1; i<=6; i++) {
    let slider = document.getElementById(`myRange${i}`);
    let temperatureDisplay = document.getElementById(`temperature${i}`);

    // Toon de aanvankelijke temperatuur bij het laden van de pagina voor elke sensor
    temperatureDisplay.innerText = sliderToTemperature(slider.value);

    slider.oninput = function() {
        let temperature = sliderToTemperature(this.value);
        temperatureDisplay.innerText = temperature;

        // Hier kan je de temperatuur doorgeven aan je programma voor elke sensor...
    }
}

