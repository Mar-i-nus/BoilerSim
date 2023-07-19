// Definieer variabelen
let port; // De seriële poort waarmee we communiceren
let link34 = true; // Deze variabele bepaalt of de schuifjes NTC3 en NTC4 gesynchroniseerd worden
let beginwaarde = 20; 

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
    }
    
}

  
  function log(message) {
    const timestamp = new Date();
    const timeString = timestamp.toLocaleTimeString();
    const logTextarea = document.getElementById('log');
    logTextarea.value +=  `[${timeString}] ${message}\n`;
    logTextarea.scrollTop = logTextarea.scrollHeight; // Scroll naar het laatste bericht
  }
  


   
