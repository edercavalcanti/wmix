
const audioInputSelect1 = document.getElementById('audioInputSelect1');
const audioInputSelect2 = document.getElementById('audioInputSelect2');
const input1VolumeControl = document.getElementById('input1Volume');
const input2VolumeControl = document.getElementById('input2Volume');
const masterVolumeControl = document.getElementById('masterVolume');
const startAudioButton = document.getElementById('startAudio');

let audioContext;
let masterGainNode;

async function getPermissionAndListDevices() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    audioInputSelect1.innerHTML = audioInputSelect2.innerHTML = audioInputs.map(device =>
      `<option value="${device.deviceId}">${device.label || 'Dispositivo sem nome'}</option>`
    ).join('');
  } catch (error) {
    console.error('Acesso ao microfone negado:', error);
  }
}

async function setupAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
    masterVolumeControl.addEventListener('input', () => {
      masterGainNode.gain.value = masterVolumeControl.value;
    });

    createVolumeMeter(audioContext, masterGainNode, 'masterMeter');
  }

  for (let i = 1; i <= 2; i++) {
    const audioInputSelect = document.getElementById(`audioInputSelect${i}`);
    const volumeControl = document.getElementById(`input${i}Volume`);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: audioInputSelect.value ? { exact: audioInputSelect.value } : undefined }
    });
    const source = audioContext.createMediaStreamSource(stream);
    const gainNode = audioContext.createGain();
    source.connect(gainNode).connect(masterGainNode);
    gainNode.gain.value = volumeControl.value;
    volumeControl.addEventListener('input', () => {
      gainNode.gain.value = volumeControl.value;
    });

    createVolumeMeter(audioContext, source, `meter${i}`);
  }
}

function createVolumeMeter(audioContext, streamSource, meterElementId) {
  const analyser = audioContext.createAnalyser();
  streamSource.connect(analyser);
  analyser.fftSize = 128;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function updateMeter() {
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;
    let volumePercent = average / 128 * 100;

    document.getElementById(meterElementId).children[0].style.height = `${volumePercent}%`;
    requestAnimationFrame(updateMeter);
  }

  updateMeter();

}

startAudioButton.addEventListener('click', setupAudio);

getPermissionAndListDevices();


