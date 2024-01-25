let isBlowing = false;
let audioContext;
let analyser;

const BLOW_THRESHOLD = 120; // Adjust as needed
const BLOW_DURATION_THRESHOLD = 500; // Adjust as needed (in milliseconds)
const BLOW_RECOVERY_DELAY = 2000; // Adjust as needed (in milliseconds)

document.getElementById('blowButton').addEventListener('click', () => {
    if (!isBlowing) {
        startBlow();
    } else {
        stopBlow();
    }
});

function startBlow() {
    isBlowing = true;
    document.getElementById('blowButton').textContent = 'Stop Blowing';

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(handleSuccess)
        .catch(handleError);
}

function stopBlow() {
    isBlowing = false;
    document.getElementById('blowButton').textContent = 'Blow into Mic';
    document.getElementById('flame').style.display = 'block';
    document.getElementById('glow').style.display = 'block';

  // Clean up audio context when stopping
    if (audioContext) {
        audioContext.close().then(() => {
        audioContext = null;
        });
    }
}

function handleSuccess(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);

    microphone.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let blowDetectedStartTime = 0;
    let blowEndedTime = 0;

    function detectBlow() {
        analyser.getByteTimeDomainData(dataArray);

        // Check if the waveform data indicates a blowing sound
        const isBlowDetected = detectBlowPattern(dataArray);

        if (isBlowDetected) {
        if (!blowDetectedStartTime) {
            blowDetectedStartTime = Date.now();
        } else {
            const duration = Date.now() - blowDetectedStartTime;
            if (duration >= BLOW_DURATION_THRESHOLD) {
            if (!blowEndedTime) {
                document.getElementById('flame').style.display = 'none';
                document.getElementById('glow').style.display = 'none';
            }
            }
        }
        } else {
        if (blowDetectedStartTime) {
            blowEndedTime = Date.now();
            const recoveryDuration = blowEndedTime - blowDetectedStartTime;

            if (recoveryDuration >= BLOW_RECOVERY_DELAY) {
            document.getElementById('flame').style.display = 'block';
            document.getElementById('glow').style.display = 'block';
            blowDetectedStartTime = 0;
            blowEndedTime = 0;
            }
        }
        }

        if (isBlowing) {
        requestAnimationFrame(detectBlow);
        }
    }

    detectBlow();
}

function handleError(error) {
    console.error('Error accessing microphone:', error);
    stopBlow();
}

function detectBlowPattern(dataArray) {
    // Simple detection logic - Check if the waveform has a sustained high amplitude
    const aboveThreshold = dataArray.some(value => value > BLOW_THRESHOLD);
    return aboveThreshold;
}
