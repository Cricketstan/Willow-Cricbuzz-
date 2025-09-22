document.addEventListener('DOMContentLoaded', async () => {
  shaka.polyfill.installAll();
  if (!shaka.Player.isBrowserSupported()) {
    console.error('Browser not supported');
    return;
  }

  const video = document.querySelector('video');
  const player = new shaka.Player();
  await player.attach(video);

  const container = document.querySelector('.shaka-video-container');
  const ui = new shaka.ui.Overlay(player, container, video);

  ui.configure({
    controlPanelElements: [
      'play_pause', 'time_and_duration', 'mute', 'volume',
      'spacer', 'language', 'captions', 'picture_in_picture',
      'quality', 'fullscreen'
    ],
    volumeBarColors: {
      base: 'rgb(128, 128, 128)',   // gray base
      level: 'rgb(169, 169, 169)'   // lighter gray level
    },
    seekBarColors: {
      base: 'rgb(255, 182, 193)',    // light pink base
      buffered: 'rgb(255, 105, 180)', // hot pink buffered
      played: 'rgb(255, 20, 147)'    // deep pink played
    }
  });

  // Base64 encoded key + URL
  const keyId_b64 = "NDAwMTMxOTk0YjQ0NWQ4Yzg4MTcyMDIyNDg3NjBmZGE="; 
  const key_b64   = "MmQ1NmNiNmYwN2E3NWI5YWZmMTY1ZDUzNGFlMmJmYzQ="; 
  const url_b64   = "aHR0cHM6Ly9qaW90dm1ibGl2ZS5jZG4uamlvLmNvbS9icGstdHYvU3Rhcl9TcG9ydHNfSEQxX0hpbmRpX0JUUy9vdXRwdXQvaW5kZXgubXBk"; 

  // Decode
  const keyId = atob(keyId_b64);
  const key   = atob(key_b64);
  const streamUrl = atob(url_b64);

  let drmConfig = { clearKeys: { [keyId]: key } };

  // Token manually added
  let cookieHeader = "__hdnea__=st=1758532294~exp=1758618694~acl=/*~hmac=d5791b4a59ef2574eeb294a5cd18223b235bf3c5c571c7782eb9f53e17f347b2";

  player.configure({
    drm: drmConfig,
    streaming: {
      lowLatencyMode: true,
      bufferingGoal: 15,
      rebufferingGoal: 2,
      bufferBehind: 15,
      retryParameters: {
        timeout: 10000,
        maxAttempts: 5,
        baseDelay: 300,
        backoffFactor: 1.2
      },
      segmentRequestTimeout: 8000,
      segmentPrefetchLimit: 2,
      useNativeHlsOnSafari: true
    },
    manifest: {
      retryParameters: { timeout: 8000, maxAttempts: 3 }
    }
  });

  player.getNetworkingEngine().registerRequestFilter((type, request) => {
    request.headers['Referer'] = 'https://www.jiotv.com/';
    request.headers['User-Agent'] = "plaYtv/7.1.5 (Linux;Android 13) ExoPlayerLib/2.11.6";
    if (cookieHeader) request.headers['Cookie'] = cookieHeader;

    if (
      (type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
       type === shaka.net.NetworkingEngine.RequestType.SEGMENT) &&
      request.uris[0] && cookieHeader && !request.uris[0].includes('__hdnea=')
    ) {
      const sep = request.uris[0].includes('?') ? '&' : '?';
      request.uris[0] += sep + cookieHeader;
    }
  });

  const attemptAutoplay = async () => {
    try {
      video.muted = false;
      await video.play();
      return true;
    } catch {
      try {
        video.muted = true;
        await video.play();
        return true;
      } catch {
        return false;
      }
    }
  };

  try {
    await player.load(streamUrl);
    await attemptAutoplay();
  } catch (e) {
    console.error("Initial load failed:", e);
  }

  player.addEventListener('error', e => console.error("Shaka Error:", e.detail));
});
