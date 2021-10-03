
export function isInFullScreen() {
  const document = window.document as any;
  return (
    (document.fullscreenElement && document.fullscreenElement !== null) ||
    (document.webkitFullscreenElement &&
      document.webkitFullscreenElement !== null) ||
    (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
    (document.msFullscreenElement && document.msFullscreenElement !== null)
  );
}

export function requestFullScreen(elem: any) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullScreen) {
    elem.webkitRequestFullScreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  } else {
    console.warn("Did not find request full screen method", elem);
  }
}

export function exitFullScreen() {
  const document = window.document as any;
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

(window as any).toggleFullScreen = function (elem: any) {
  // based on https://stackoverflow.com/questions/36672561/how-to-exit-fullscreen-onclick-using-javascript
  if (isInFullScreen()) {
    exitFullScreen();
  } else {
    requestFullScreen(elem || document.body);
  }
}
