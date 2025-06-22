let osc;         // Oscillator object
let playing = false;
let freqSlider, ampSlider, waveSelect, playButton;

function setup() {
  let cnv = createCanvas(400, 120);
  cnv.parent('p5-container');

  // Create Oscillator
  osc = new p5.Oscillator('sine');

  // Frequency slider
  freqSlider = createSlider(100, 1000, 440);
  freqSlider.position(20, 40);
  freqSlider.style('width', '360px');

  // Amplitude slider
  ampSlider = createSlider(0, 1, 0.5, 0.01);
  ampSlider.position(20, 80);
  ampSlider.style('width', '360px');

  // Waveform dropdown
  waveSelect = createSelect();
  waveSelect.position(20, 10);
  ['sine','triangle','square','sawtooth'].forEach(type => waveSelect.option(type));
  waveSelect.selected('sine');

  // Play/Stop button
  playButton = createButton('Start Oscillator');
  playButton.position(290, 10);
  playButton.mousePressed(toggleOscillator);
}

function draw() {
  background('#e3eaf2');
  textSize(16);
  fill(30);
  text('Waveform:', 20, 25);
  text('Frequency: ' + freqSlider.value() + ' Hz', 20, 60);
  text('Amplitude: ' + ampSlider.value(), 20, 100);

  // Set oscillator parameters in real time
  osc.setType(waveSelect.value());
  osc.freq(freqSlider.value());
  osc.amp(ampSlider.value(), 0.1);
}

function toggleOscillator() {
  if (!playing) {
    osc.start();
    playButton.html('Stop Oscillator');
    playing = true;
  } else {
    osc.stop();
    playButton.html('Start Oscillator');
    playing = false;
  }
}