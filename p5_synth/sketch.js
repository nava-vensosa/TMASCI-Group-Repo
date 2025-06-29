// p5_synth: Interactive p5.Oscillator() Demo

let osc;
let playing = false;
let fft;

function setup() {
  // Attach p5 canvas to the container - now used for oscilloscope visualization
  let cnv = createCanvas(400, 120);
  cnv.parent('p5-container');
  
  // Initialize FFT for audio analysis
  fft = new p5.FFT(0.9, 2048);
  
  // Start the drawing loop for real-time visualization
  loop();

  // Initialize oscillator
  osc = new p5.Oscillator('sine');
  osc.amp(0.5);
  
  // Connect oscillator to FFT for analysis
  osc.connect(fft);

  // DOM elements from HTML
  const waveSelect = document.getElementById('waveSelect');
  const freqSlider = document.getElementById('freqSlider');
  const ampSlider = document.getElementById('ampSlider');
  const playButton = document.getElementById('playButton');
  const freqLabel = document.getElementById('freqLabel');
  const ampLabel = document.getElementById('ampLabel');

  // Update oscillator and UI on input
  waveSelect.addEventListener('change', function() {
    osc.setType(this.value);
  });

  freqSlider.addEventListener('input', function() {
    osc.freq(Number(this.value));
    freqLabel.textContent = this.value;
  });

  ampSlider.addEventListener('input', function() {
    osc.amp(Number(this.value), 0.1);
    ampLabel.textContent = this.value;
  });

  playButton.addEventListener('click', function() {
    if (!playing) {
      // Some browsers block AudioContext until user gesture
      userStartAudio();
      osc.start();
      this.textContent = 'Stop Oscillator';
      playing = true;
    } else {
      osc.stop();
      this.textContent = 'Start Oscillator';
      playing = false;
    }
  });

  // Set initial values for oscillator
  osc.setType(waveSelect.value);
  osc.freq(Number(freqSlider.value));
  osc.amp(Number(ampSlider.value));
  freqLabel.textContent = freqSlider.value;
  ampLabel.textContent = ampSlider.value;
}

function draw() {
  // Clear background with a subtle color
  background('#1a1a2e');
  
  // Get waveform data from FFT
  let waveform = fft.waveform();
  
  // Draw the oscilloscope grid
  drawGrid();
  
  // Draw the waveform
  stroke('#00d4aa');
  strokeWeight(2);
  noFill();
  
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    let x = map(i, 0, waveform.length, 0, width);
    let y = map(waveform[i], -1, 1, height, 0);
    vertex(x, y);
  }
  endShape();
  
  // Draw center line
  stroke('#444');
  strokeWeight(1);
  line(0, height/2, width, height/2);
  
  // Add status indicator
  drawStatusIndicator();
}

function drawGrid() {
  stroke('#333');
  strokeWeight(0.5);
  
  // Vertical grid lines
  for (let x = 0; x <= width; x += width/8) {
    line(x, 0, x, height);
  }
  
  // Horizontal grid lines
  for (let y = 0; y <= height; y += height/6) {
    line(0, y, width, y);
  }
}

function drawStatusIndicator() {
  // Draw a small indicator showing if audio is playing
  if (playing) {
    fill('#00d4aa');
    noStroke();
    circle(width - 15, 15, 8);
    
    // Add "LIVE" text
    fill('#00d4aa');
    textAlign(RIGHT, TOP);
    textSize(10);
    text('LIVE', width - 25, 8);
  } else {
    fill('#666');
    noStroke();
    circle(width - 15, 15, 8);
    
    // Add "OFF" text
    fill('#666');
    textAlign(RIGHT, TOP);
    textSize(10);
    text('OFF', width - 25, 8);
  }
}