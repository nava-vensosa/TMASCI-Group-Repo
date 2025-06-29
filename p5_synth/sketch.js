// p5_synth: Interactive p5.Oscillator() Demo

let osc;
let playing = false;
let fft;
let periodViewMode = false;
let waveformBuffer = [];
let frozenPeriod = [];
let bufferSize = 8192;
let lastFrequency = 440;

function setup() {
  // Attach p5 canvas to the container - now used for oscilloscope visualization
  let cnv = createCanvas(400, 120);
  cnv.parent('p5-container');
  
  // Initialize FFT for audio analysis
  fft = new p5.FFT(1, 2048);
  
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

  // Create period view toggle button
  const periodToggle = document.createElement('button');
  periodToggle.textContent = 'Period View: OFF';
  periodToggle.id = 'periodToggle';
  periodToggle.style.marginTop = '10px';
  document.getElementById('controls').appendChild(periodToggle);

  // Initialize waveform buffer
  waveformBuffer = new Array(bufferSize).fill(0);

  // Update oscillator and UI on input
  waveSelect.addEventListener('change', function() {
    osc.setType(this.value);
    if (periodViewMode) updateFrozenPeriod();
  });

  freqSlider.addEventListener('input', function() {
    osc.freq(Number(this.value));
    freqLabel.textContent = this.value;
    lastFrequency = Number(this.value);
    if (periodViewMode) updateFrozenPeriod();
  });

  ampSlider.addEventListener('input', function() {
    osc.amp(Number(this.value), 0.1);
    ampLabel.textContent = this.value;
  });

  periodToggle.addEventListener('click', function() {
    periodViewMode = !periodViewMode;
    this.textContent = periodViewMode ? 'Period View: ON' : 'Period View: OFF';
    if (periodViewMode && playing) {
      updateFrozenPeriod();
    }
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
  
  // Get current waveform data
  let currentWaveform = fft.waveform();
  
  // Update rolling buffer with new data
  updateWaveformBuffer(currentWaveform);
  
  // Draw the oscilloscope grid
  drawGrid();
  
  // Choose which waveform to display
  let displayWaveform;
  if (periodViewMode && playing && frozenPeriod.length > 0) {
    displayWaveform = frozenPeriod;
  } else {
    displayWaveform = currentWaveform;
  }
  
  // Draw the waveform
  stroke('#00d4aa');
  strokeWeight(2);
  noFill();
  
  beginShape();
  for (let i = 0; i < displayWaveform.length; i++) {
    let x = map(i, 0, displayWaveform.length, 0, width);
    let y = map(displayWaveform[i], -1, 1, height, 0);
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
  // Draw a small indicator showing if audio is playing and mode
  if (playing) {
    fill('#00d4aa');
    noStroke();
    circle(width - 15, 15, 8);
    
    // Add mode text
    fill('#00d4aa');
    textAlign(RIGHT, TOP);
    textSize(10);
    text(periodViewMode ? 'PERIOD' : 'LIVE', width - 25, 8);
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

// Auto-correlation and period detection functions

function updateWaveformBuffer(newWaveform) {
  // Shift buffer and add new data
  const samplesToAdd = Math.min(newWaveform.length, bufferSize);
  
  // Shift existing data left
  for (let i = 0; i < bufferSize - samplesToAdd; i++) {
    waveformBuffer[i] = waveformBuffer[i + samplesToAdd];
  }
  
  // Add new data to the end
  for (let i = 0; i < samplesToAdd; i++) {
    waveformBuffer[bufferSize - samplesToAdd + i] = newWaveform[i];
  }
}

function updateFrozenPeriod() {
  if (!playing || waveformBuffer.length === 0) return;
  
  // Estimate period length based on frequency
  const sampleRate = 44100; // Assume standard sample rate
  const estimatedPeriodSamples = Math.round(sampleRate / lastFrequency);
  
  // Use auto-correlation to find actual period
  const detectedPeriod = findPeriodByAutoCorrelation(waveformBuffer, estimatedPeriodSamples);
  
  if (detectedPeriod > 0) {
    // Extract one clean period from the buffer
    frozenPeriod = extractPeriod(waveformBuffer, detectedPeriod);
  }
}

function findPeriodByAutoCorrelation(signal, estimatedPeriod) {
  const minPeriod = Math.max(10, Math.round(estimatedPeriod * 0.5));
  const maxPeriod = Math.min(signal.length / 4, Math.round(estimatedPeriod * 2));
  
  let bestCorrelation = -1;
  let bestPeriod = estimatedPeriod;
  
  // Search around the estimated period
  for (let period = minPeriod; period <= maxPeriod; period++) {
    const correlation = calculateAutoCorrelation(signal, period);
    
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }
  
  // Only return if correlation is strong enough
  return bestCorrelation > 0.3 ? bestPeriod : estimatedPeriod;
}

function calculateAutoCorrelation(signal, lag) {
  if (lag >= signal.length || lag <= 0) return 0;
  
  let correlation = 0;
  let count = 0;
  
  // Calculate correlation over multiple periods for better accuracy
  const numPeriods = Math.floor((signal.length - lag) / lag);
  const samplesPerPeriod = Math.min(lag, 512); // Limit for performance
  
  for (let period = 0; period < numPeriods - 1; period++) {
    for (let i = 0; i < samplesPerPeriod; i++) {
      const idx1 = period * lag + i;
      const idx2 = (period + 1) * lag + i;
      
      if (idx2 < signal.length) {
        correlation += signal[idx1] * signal[idx2];
        count++;
      }
    }
  }
  
  return count > 0 ? correlation / count : 0;
}

function extractPeriod(signal, periodLength) {
  // Find a good starting point (zero crossing with positive slope)
  let startIdx = findZeroCrossing(signal, periodLength);
  
  if (startIdx === -1) {
    // Fallback: use middle of buffer
    startIdx = Math.floor(signal.length / 2);
  }
  
  // Extract one period
  const period = [];
  for (let i = 0; i < periodLength && startIdx + i < signal.length; i++) {
    period.push(signal[startIdx + i]);
  }
  
  return period;
}

function findZeroCrossing(signal, searchRange) {
  const startSearch = Math.max(0, signal.length - searchRange * 2);
  
  for (let i = startSearch; i < signal.length - 1; i++) {
    // Look for zero crossing with positive slope
    if (signal[i] <= 0 && signal[i + 1] > 0) {
      return i + 1;
    }
  }
  
  return -1; // No zero crossing found
}