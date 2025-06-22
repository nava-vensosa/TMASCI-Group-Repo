// p5_synth: Interactive p5.Oscillator() Demo

let osc;
let playing = false;

function setup() {
  // Attach p5 canvas to the container (for completeness, though not strictly needed for audio)
  let cnv = createCanvas(400, 120);
  cnv.parent('p5-container');
  background('#e3eaf2');
  noLoop();

  // Initialize oscillator
  osc = new p5.Oscillator('sine');
  osc.amp(0.5);

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