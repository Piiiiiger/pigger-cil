import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
let cachedModule = null;
let loadAttempted = false;
function loadModule() {
  if (loadAttempted) {
    return cachedModule;
  }
  loadAttempted = true;
  const platform = process.platform;
  if (platform !== "darwin" && platform !== "linux" && platform !== "win32") {
    return null;
  }
  if (process.env.AUDIO_CAPTURE_NODE_PATH) {
    try {
      cachedModule = require2(
        process.env.AUDIO_CAPTURE_NODE_PATH
      );
      return cachedModule;
    } catch {
    }
  }
  const platformDir = `${process.arch}-${platform}`;
  const fallbacks = [
    `./vendor/audio-capture/${platformDir}/audio-capture.node`,
    `../audio-capture/${platformDir}/audio-capture.node`
  ];
  for (const p of fallbacks) {
    try {
      cachedModule = require2(p);
      return cachedModule;
    } catch {
    }
  }
  return null;
}
function isNativeAudioAvailable() {
  return loadModule() !== null;
}
function startNativeRecording(onData, onEnd) {
  const mod = loadModule();
  if (!mod) {
    return false;
  }
  return mod.startRecording(onData, onEnd);
}
function stopNativeRecording() {
  const mod = loadModule();
  if (!mod) {
    return;
  }
  mod.stopRecording();
}
function isNativeRecordingActive() {
  const mod = loadModule();
  if (!mod) {
    return false;
  }
  return mod.isRecording();
}
function startNativePlayback(sampleRate, channels) {
  const mod = loadModule();
  if (!mod) {
    return false;
  }
  return mod.startPlayback(sampleRate, channels);
}
function writeNativePlaybackData(data) {
  const mod = loadModule();
  if (!mod) {
    return;
  }
  mod.writePlaybackData(data);
}
function stopNativePlayback() {
  const mod = loadModule();
  if (!mod) {
    return;
  }
  mod.stopPlayback();
}
function isNativePlaying() {
  const mod = loadModule();
  if (!mod) {
    return false;
  }
  return mod.isPlaying();
}
function microphoneAuthorizationStatus() {
  const mod = loadModule();
  if (!mod || !mod.microphoneAuthorizationStatus) {
    return 0;
  }
  return mod.microphoneAuthorizationStatus();
}
export {
  isNativeAudioAvailable,
  isNativePlaying,
  isNativeRecordingActive,
  microphoneAuthorizationStatus,
  startNativePlayback,
  startNativeRecording,
  stopNativePlayback,
  stopNativeRecording,
  writeNativePlaybackData
};
