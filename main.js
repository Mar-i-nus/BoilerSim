// Definieer variabelen
let port; // De seriële poort waarmee we communiceren
let link34 = true; // Deze variabele bepaalt of de schuifjes NTC3 en NTC4 gesynchroniseerd worden
let beginwaarde = 20; 
let currentBoilerStatus = '';


async function connect() {
    // vraag de gebruiker om een seriepoort te selecteren
    port = await navigator.serial.requestPort({});
    
    // open de geselecteerde poort met een baudsnelheid van 9600
    await port.open({ baudRate: 9600 });

     // Pas de gebruikersinterface aan om te reflecteren dat we verbonden zijn
    const connectBtn = document.getElementById("connect");
    connectBtn.className = "connect-button connected";
    connectBtn.textContent = "Disconnect";
    connectBtn.onclick = disconnect;

    // controleer of de verbinding succesvol is
    if (port && port.readable && port.writable) {

        // verberg het startscherm en toon de bedieningselementen
        document.getElementById('startup-screen').style.display = 'none';
        document.getElementById('controls').style.display = 'flex';

        // wijzig de kleur van de rand van het kader
        document.getElementById('startup-screen').style.borderTopColor = 'green';
        
        // update connection status
        document.getElementById('connection-status').textContent = "Connected";
        
        log("seriel lezen gaat beginnen")
        await readData();

        //update de sensoren als deze worden aangesloten. 
        for (let i = 1; i <= 5; i++) {
          await updateNTCAndSlider(i, 30);
      }
      

    } else {
        // maak de kleur van de rand van het kader rood als de verbinding niet succesvol is
        document.getElementById('startup-screen').style.borderTopColor = 'red';
        
        // update connection status
        document.getElementById('connection-status').textContent = "Not Connected";
    }
}


//functie om op te halen of boiler aanstaan of uit

async function connect() {
  port = await navigator.serial.requestPort({});
  await port.open({ baudRate: 9600 });

  const connectBtn = document.getElementById("connect");
  connectBtn.className = "connect-button connected";
  connectBtn.textContent = "Disconnect";
  connectBtn.onclick = disconnect;

  if (port && port.readable && port.writable) {
      document.getElementById('startup-screen').style.display = 'none';
      document.getElementById('controls').style.display = 'flex';
      document.getElementById('startup-screen').style.borderTopColor = 'green';
      document.getElementById('connection-status').textContent = "Connected";

      await readData(); 

      for (let i = 1; i <= 5; i++) {
        await updateNTCAndSlider(i, 30);
      }
  } else {
      document.getElementById('startup-screen').style.borderTopColor = 'red';
      document.getElementById('connection-status').textContent = "Not Connected";
  }
}

////////////////////////////////simuleren dat boiler opwarmt///////////////////////////////////////////
let runSimulation = false;

async function readData() {
let reader = port.readable.getReader();
let decoder = new TextDecoder('utf-8');

while (true) {
  let { value, done } = await reader.read();
  if (done) {
      reader.releaseLock();
      break;
  }

  let data = decoder.decode(value);
  let spiraal = document.getElementById('spiraal');

  if (data.includes('boiler staat aan') && currentBoilerStatus != 'aan') {
    spiraal.style.backgroundColor = 'green';
    currentBoilerStatus = 'aan';
    log('boiler staat aan');
    runSimulation = true;
    startHeatUpSimulatie()
  } else if (data.includes('boiler staat uit') && currentBoilerStatus != 'uit') {
    spiraal.style.backgroundColor = 'red';
    currentBoilerStatus = 'uit';
    runSimulation = false;
    log('boiler staat uit');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
}
}

//hier kijk ik of hij op automatisch staat of niet
async function startHeatUpSimulatie() {
  // Verkrijg de huidige waarde van het dropdown-menu
  let dropdownWaarde = document.getElementById('dropdownMenu').value;

  // Als de waarde 'auto' is, start dan de simulatie
  if (dropdownWaarde == 'auto') {
    await simulateHeatup();
  } else {
    // Anders, geef een bericht dat de simulatie niet zal starten
    log('Simulatie zal niet starten omdat het dropdown-menu op Handmatig is ingesteld');
  }
}

//hiermee laat ik de boiler fictief opwarmen als het helemet is ingeschakeld
async function simulateHeatup() {
  log('Water is heating up...');
  
  // Lus totdat simulatie wordt stopgezet
  while (runSimulation) {
    // Lus door elke sensor
    for (let i = 1; i <= 6; i++) {
      // Verlaat de lus als de simulatie is stopgezet
      if (!runSimulation) {
        break;
      }

      // Haal de huidige waarde van de sensor op
      let currentValue = Number(document.getElementById('ntc' + i).value);
      
      // Bereken de nieuwe waarde, maar zorg ervoor dat deze niet hoger is dan 255
      let newValue = Math.min(currentValue + 5, 255);

      document.getElementById('ntc' + i).value = newValue;
      //log('Setting ntc ' + i + ' to ' + newValue / 2.55 + ' °C');  // Aangenomen dat 255 overeenkomt met 100°C
      await updatentc(i.toString(), newValue);

      // Wacht 100ms voordat je naar de volgende sensor gaat
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verlaat de lus als de waarde van elke sensor 255 is
    if (Array.from({length: 6}, (_, i) => Number(document.getElementById('ntc' + (i + 1)).value)).every(value => value === 255)) {
      break;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////
  
// Functie om de verbinding met de poort te verbreken
  async function disconnect() {
    if (!port) {
      return;
    }
    
    // Log de disconnect actie
    log(`Disconnected from ${port.getInfo().usbVendorId ? "USB Device" : "Unknown Device"}`);
  
    // Sluit de poort
    await port.close();
    port = null;
    
    // Reset de connectie knop
    const connectBtn = document.getElementById("connect");
    connectBtn.className = "connect-button disconnected";
    connectBtn.textContent = "Connect";
    connectBtn.onclick = connect;
  }


// Functie om de NTC-waarde en de slider te updaten
  async function updatentc(ntc, value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

// Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `ntc${ntc}:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();

// Update de temperatuurwaarde op de gebruikersinterface
  const ntcValue = document.getElementById(`ntc${ntc}-value`);
  ntcValue.textContent = Math.round((value / 255) * 100) + "°C";
}


// Functie om de geselecteerde waarde van NTC1_select naar de Arduino te sturen
async function updateNTC1(value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  // Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `NTC1_select:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();
}

// Voeg een event listener toe aan het dropdown-menu
// Dit zal de geselecteerde waarde naar de Arduino sturen wanneer deze verandert
document.getElementById("NTC1_select").onchange = function() { 
  updateNTC1(this.value); 
};

async function updateNTC2(value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  // Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `NTC2_select:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();
}

// Voeg een event listener toe aan het dropdown-menu
// Dit zal de geselecteerde waarde naar de Arduino sturen wanneer deze verandert
document.getElementById("NTC2_select").onchange = function() { 
  updateNTC2(this.value); 
};


async function updateNTC3(value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  // Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `NTC3_select:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();
}

// Voeg een event listener toe aan het dropdown-menu
// Dit zal de geselecteerde waarde naar de Arduino sturen wanneer deze verandert
document.getElementById("NTC3_select").onchange = function() { 
  updateNTC3(this.value); 
};

async function updateNTC4(value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  // Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `NTC4_select:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();
}

// Voeg een event listener toe aan het dropdown-menu
// Dit zal de geselecteerde waarde naar de Arduino sturen wanneer deze verandert
document.getElementById("NTC4_select").onchange = function() { 
  updateNTC4(this.value); 
};

async function updateNTC5(value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  // Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `NTC5_select:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();
}

// Voeg een event listener toe aan het dropdown-menu
// Dit zal de geselecteerde waarde naar de Arduino sturen wanneer deze verandert
document.getElementById("NTC5_select").onchange = function() { 
  updateNTC5(this.value); 
};

async function updateNTC6(value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  // Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `NTC6_select:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();
}

// Voeg een event listener toe aan het dropdown-menu
// Dit zal de geselecteerde waarde naar de Arduino sturen wanneer deze verandert
document.getElementById("NTC6_select").onchange = function() { 
  updateNTC6(this.value); 
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function updateNTCAndSlider(ntc, value, propagate=true) {
  // Update de waarde van de slider
  document.getElementById(`ntc${ntc}`).value = value;
  // Stuur de nieuwe waarde naar de hardware
  await updatentc(ntc, value);

  // Als link34 true is, en we veranderen de waarde van ntc3 of ntc4,
  // verander dan ook de waarde van de andere.
  if (propagate && link34 && (ntc === '3' || ntc === '4')) {
    const otherntc = ntc === '3' ? '4' : '3';
    await updateNTCAndSlider(otherntc, value, false);
  }
}

// Voeg een event listener toe aan het link34 checkbox
// Dit zal link34 bijwerken wanneer de gebruiker de checkbox verandert,
// en als het nu aangevinkt is, zal het de waarde van ntc4 gelijk maken aan die van ntc3.
document.getElementById("link34").checked = true;
document.getElementById("link34").onchange = function() { 
  link34 = this.checked; 
  if(link34) {
    let value = document.getElementById('ntc3').value;
    updateNTCAndSlider('4', value);
  }
};

async function togglentc(ntc, state) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

// Verzend de gegevens naar de seriële poort
  const writer = port.writable.getWriter();
  const data = `TOGGLE${ntc}:${state ? 'ON' : 'OFF'}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();

  // Update the ntc status
  await updatentc(ntc, state ? 255 : 0);
}

// Voeg een "event listener" toe aan het element met id "ntc6". 
//Wanneer de input wijzigt, wordt de functie updateNTCAndSlider uitgevoerd met '6' als het NTC-nummer en de huidige waarde van de input.
document.getElementById("ntc1").oninput = function() { updateNTCAndSlider('1', this.value); };
document.getElementById("ntc2").oninput = function() { updateNTCAndSlider('2', this.value); };
document.getElementById("ntc3").oninput = function() { updateNTCAndSlider('3', this.value); };
document.getElementById("ntc4").oninput = function() { updateNTCAndSlider('4', this.value); };
document.getElementById("ntc5").oninput = function() { updateNTCAndSlider('5', this.value); };
document.getElementById("ntc6").oninput = function() { updateNTCAndSlider('6', this.value); };

// Set the initial slider value to 30
window.onload = function() {
  document.getElementById("ntc1").value = 30;
  document.getElementById("ntc2").value = 30;
  document.getElementById("ntc3").value = 30;
  document.getElementById("ntc4").value = 30;
  document.getElementById("ntc5").value = 30;
  document.getElementById("ntc6").value = 30;

  document.getElementById("ntc1-value").textContent = "12°C";
  document.getElementById("ntc2-value").textContent = "12°C";
  document.getElementById("ntc3-value").textContent = "12°C";
  document.getElementById("ntc4-value").textContent = "12°C";
  document.getElementById("ntc5-value").textContent = "12°C";
  document.getElementById("ntc6-value").textContent = "12°C";

  log(`Welkom bij de Boile`);
  log(`BoilerSim is verbonden`);

}


//realis toevoegen zie hieronder
async function toggleRelay(state) {
    if (!port) {
      console.log('Port is not connected');
      return;
    }
  
    const writer = port.writable.getWriter();
    const data = `TOGGLERELAY:${state ? 'ON' : 'OFF'}\n`;
    await writer.write(new TextEncoder().encode(data));
    writer.releaseLock();
  
    // Update the relay checkbox
    document.getElementById('relay-toggle2').checked = state;
  }
  



async function simulateError() {
    let errorSelect = document.getElementById('errorSelect');
    let selectedError = errorSelect.options[errorSelect.selectedIndex].value;
  
    switch (selectedError) {

    //error 1
      case 'test':
        log('Simulating error: ' + selectedError);
        
        document.getElementById('ntc5').value = 255;
        log('Setting ntc 5 to 255');
        await updatentc('5', 255);
  
        setTimeout(async function() {
          document.getElementById('ntc4').value = 100;
          log('Setting ntc 4 to 100 after 4 seconds');
          await updatentc('4', 100);
          log('Done');
        }, 4000);
        
        break;
    
        case 'test 2':
          log('Simulating error: ' + selectedError);
        
          document.getElementById('ntc3').value = 200;
          log('Setting ntc 3 to 200');
          await updatentc('3', 200);
        
          setTimeout(async function() {
            document.getElementById('ntc2').value = 150;
            log('Setting ntc 2 to 150 after 3 seconds');
            await updatentc('2', 150);
            log('Done');
          }, 3000);
        
          break;

          case 'test 3':
            log('Simulating error: ' + selectedError);

            document.getElementById('ntc6').value = 255;
            log('Setting ntc 1 to 255');
            await updatentc('1', 255);

            setTimeout(async function() {
                document.getElementById('ntc2').value = 200;
                log('Setting ntc 2 to 200 after 3 seconds');
                await updatentc('2', 200);

                setTimeout(async function() {
                    document.getElementById('ntc3').value = 150;
                    log('Setting ntc 3 to 150 after another 3 seconds');
                    await updatentc('3', 150);

                    setTimeout(async function() {
                        document.getElementById('ntc6').value = 0;
                        log('Setting ntc 1 to 0 after another 3 seconds');
                        await updatentc('1', 0);

                        document.getElementById('ntc2').value = 0;
                        log('Setting ntc 2 to 0 immediately');
                        await updatentc('2', 0);

                        document.getElementById('ntc3').value = 0;
                        log('Setting ntc 3 to 0 immediately');
                        await updatentc('3', 0);

                        log('Error 3 simulation complete');
                    }, 3000);
                }, 3000);
            }, 3000);

            break;

            case 'W00':
              log('Simulating error: ' + selectedError);
              log('Legionella sensor error');
              let ntc1Select = document.getElementById('NTC1_select');
              ntc1Select.value = "Open Leads"; // U moet ervoor zorgen dat "Open Leads" een optie is in uw dropdown-menu
              log('Setting NTC1 to Open Leads');
              // Zorg ervoor dat u uw hardware correct configureert wanneer NTC1 is ingesteld op "Open Leads"
              updateNTC1(ntc1Select.value);
              log('Done');
              break;

            case 'E10':
              log('Simulating error: ' + selectedError);
              log('Overheat protection');
              
              document.getElementById('ntc1').value = 255;
              log('Setting ntc 1 to 100 °C');
              await updatentc('1', 255);

              document.getElementById('ntc2').value = 255;
              log('Setting ntc 2 to 100 °C');
              await updatentc('2', 255);

              document.getElementById('ntc3').value = 255;
              log('Setting ntc 3 to 100 °C');
              await updatentc('3', 255);

              document.getElementById('ntc4').value = 255;
              log('Setting ntc 4 to 100 °C');
              await updatentc('4', 255);

              document.getElementById('ntc5').value = 255;
              log('Setting ntc 5 to 100 °C');
              await updatentc('5', 255);

              document.getElementById('ntc6').value = 255;
              log('Setting ntc 6 to 100 °C');
              await updatentc('6', 255);

              log('Done');
              break;

            case 'E11':
              log('Simulating error: ' + selectedError);
              log('Delta between the duplex sensor is too large');
              
              document.getElementById('ntc3').value = 153;
              log('Setting ntc 3 to 60 °C');
              await updatentc('3', 153);

              document.getElementById('ntc4').value = 71;
              log('Setting ntc 4 to 30 °C');
              await updatentc('4', 71);

              log('Done');
              break;

    }
    
}



  
  function log(message) {
    const timestamp = new Date();
    const timeString = timestamp.toLocaleTimeString();
    const logTextarea = document.getElementById('log');
    logTextarea.value +=  `[${timeString}] ${message}\n`;
    logTextarea.scrollTop = logTextarea.scrollHeight; // Scroll naar het laatste bericht
  }
  

  document.getElementById('resetButton').addEventListener('click', resetValues);

  async function resetValues() {
    log('All settings reset');
    document.getElementById("ntc1-value").textContent = "12°C";
    document.getElementById("ntc1").value = 30;
    document.getElementById("ntc1").oninput = function() { updateNTCAndSlider('1', this.value); };
    await updatentc('1', 30);
    document.getElementById("ntc2-value").textContent = "12°C";
    document.getElementById("ntc2").value = 30;
    document.getElementById("ntc2").oninput = function() { updateNTCAndSlider('2', this.value); };
    await updatentc('2', 30);
    document.getElementById("ntc3-value").textContent = "12°C";
    document.getElementById("ntc3").value = 30;
    document.getElementById("ntc3").oninput = function() { updateNTCAndSlider('3', this.value); };
    await updatentc('3', 30);
    document.getElementById("ntc4-value").textContent = "12°C";
    document.getElementById("ntc4").value = 30;
    document.getElementById("ntc4").oninput = function() { updateNTCAndSlider('4', this.value); };
    await updatentc('4', 30);
    document.getElementById("ntc5-value").textContent = "12°C";
    document.getElementById("ntc5").value = 30;
    document.getElementById("ntc5").oninput = function() { updateNTCAndSlider('5', this.value); };
    await updatentc('5', 30);
    document.getElementById("ntc6-value").textContent = "12°C";
    document.getElementById("ntc6").value = 30;
    document.getElementById("ntc6").oninput = function() { updateNTCAndSlider('6', this.value); };
    await updatentc('6', 30);

    let ntc1Select = document.getElementById('NTC1_select');
    ntc1Select.value = "Connected";
    updateNTC1(ntc1Select.value);

    let ntc2Select = document.getElementById('NTC2_select');
    ntc2Select.value = "Connected";
    updateNTC2(ntc2Select.value);

    let ntc3Select = document.getElementById('NTC3_select');
    ntc3Select.value = "Connected";
    updateNTC3(ntc3Select.value);

    let ntc4Select = document.getElementById('NTC4_select');
    ntc4Select.value = "Connected";
    updateNTC4(ntc4Select.value);

    let ntc5Select = document.getElementById('NTC5_select');
    ntc5Select.value = "Connected";
    updateNTC5(ntc5Select.value);

    let ntc6Select = document.getElementById('NTC6_select');
    ntc6Select.value = "Connected";
    updateNTC6(ntc6Select.value);
  }
  
   
  async function simulateOverheat() {
    log('Simulating error: Overheat protection');
    
    // Lus door elke sensor
    for (let i = 1; i <= 6; i++) {
      // Lus door elke waarde van 0 tot 255
      for (let value = 0; value <= 255; value++) {
        document.getElementById('ntc' + i).value = value;
        log('Setting ntc ' + i + ' to ' + value / 2.55 + ' °C');  // Aangenomen dat 255 overeenkomt met 100°C
        await updatentc(i.toString(), value);
  
        // Wacht 100ms voordat je naar de volgende waarde gaat
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }