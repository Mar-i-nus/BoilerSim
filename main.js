let port;
let link34 = true;

async function connect() {
    // vraag de gebruiker om een seriepoort te selecteren
    port = await navigator.serial.requestPort({});
    // open de geselecteerde poort met een baudsnelheid van 9600
    await port.open({ baudRate: 9600 });

    const connectBtn = document.getElementById("connect");
    connectBtn.className = "connect-button connected";
    connectBtn.textContent = "Disconnect";
    connectBtn.onclick = disconnect;

    // controleer of de verbinding succesvol is
    if (port && port.readable && port.writable) {
        // verberg het startscherm en toon de bedieningselementen
        document.getElementById('startup-screen').style.display = 'none';
        document.getElementById('controls').style.display = 'block';

        // wijzig de kleur van de rand van het kader
        document.getElementById('startup-screen').style.borderTopColor = 'green';
        
        // update connection status
        document.getElementById('connection-status').textContent = "Connected";
    } else {
        // maak de kleur van de rand van het kader rood als de verbinding niet succesvol is
        document.getElementById('startup-screen').style.borderTopColor = 'red';
        
        // update connection status
        document.getElementById('connection-status').textContent = "Not Connected";
    }

    log(`Device connected: ${port.getInfo().usbVendorId ? "USB Device" : "Unknown Device"}`);
}


  
  

  
  async function disconnect() {
    if (!port) {
      return;
    }
  
    log(`Disconnected from ${port.getInfo().usbVendorId ? "USB Device" : "Unknown Device"}`);
  
    await port.close();
    port = null;
    
    const connectBtn = document.getElementById("connect");
    connectBtn.className = "connect-button disconnected";
    connectBtn.textContent = "Connect";
    connectBtn.onclick = connect;
  }

async function updateLed(led, value) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  const writer = port.writable.getWriter();
  const data = `LED${led}:${value}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();

  const ledValue = document.getElementById(`led${led}-value`);
  ledValue.textContent = Math.round((value / 255) * 100) + "°C";
}

async function updateLedAndSlider(led, value, propagate=true) {
  document.getElementById(`led${led}`).value = value;
  await updateLed(led, value);

  if (propagate && link34 && (led === '3' || led === '4')) {
    const otherLed = led === '3' ? '4' : '3';
    await updateLedAndSlider(otherLed, value, false);
  }
}

document.getElementById("link34").checked = true;
document.getElementById("link34").onchange = function() { 
  link34 = this.checked; 
  if(link34) {
    let value = document.getElementById('led3').value;
    updateLedAndSlider('4', value);
  }
};

async function toggleLed(led, state) {
  if (!port) {
    console.log('Port is not connected');
    return;
  }

  const writer = port.writable.getWriter();
  const data = `TOGGLE${led}:${state ? 'ON' : 'OFF'}\n`;
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();

  // Update the LED status
  await updateLed(led, state ? 255 : 0);
}

document.getElementById("led1").oninput = function() { updateLedAndSlider('1', this.value); };
document.getElementById("led2").oninput = function() { updateLedAndSlider('2', this.value); };
document.getElementById("led3").oninput = function() { updateLedAndSlider('3', this.value); };
document.getElementById("led4").oninput = function() { updateLedAndSlider('4', this.value); };
document.getElementById("led5").oninput = function() { updateLedAndSlider('5', this.value); };

// Set the initial slider value to 10
window.onload = function() {
  document.getElementById("led1").value = 10;
  document.getElementById("led2").value = 10;
  document.getElementById("led3").value = 10;
  document.getElementById("led4").value = 10;
  document.getElementById("led5").value = 10;

  document.getElementById("led1-value").textContent = "4°C";
  document.getElementById("led2-value").textContent = "4°C";
  document.getElementById("led3-value").textContent = "4°C";
  document.getElementById("led4-value").textContent = "4°C";
  document.getElementById("led5-value").textContent = "4°C";
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
        
        document.getElementById('led5').value = 255;
        log('Setting LED 5 to 255');
        await updateLed('5', 255);
  
        setTimeout(async function() {
          document.getElementById('led4').value = 100;
          log('Setting LED 4 to 100 after 4 seconds');
          await updateLed('4', 100);
          log('Done');
        }, 4000);
        
        break;
    
    //erro 2
      case 'test 2':
        log('Simulating error: ' + selectedError);
        
        document.getElementById('led3').value = 200;
        log('Setting LED 3 to 200');
        await updateLed('3', 200);
  
        setTimeout(async function() {
          document.getElementById('led1').value = 50;
          log('Setting LED 1 to 50 after 4 seconds');
          await updateLed('1', 50);
          log('Done');
        }, 4000);
        
        break;
    
    //error 3

    case 'test 3':
        log('Simulating error: ' + selectedError);
        log('Toggling LED 1: ON');
        document.getElementById('relay-toggle').checked = true;
        await toggleRelay(true);
        log('relais is naar true');
        document.getElementById('relay-toggle').checked = true;
        break;
    default:
        log('Error not recognized: ' + selectedError);
    }
    
}

  
  function log(message) {
    const timestamp = new Date();
    const timeString = timestamp.toLocaleTimeString();
    const logTextarea = document.getElementById('log');
    logTextarea.value +=  `[${timeString}] ${message}\n`;
    logTextarea.scrollTop = logTextarea.scrollHeight; // Scroll naar het laatste bericht
  }
  


   
