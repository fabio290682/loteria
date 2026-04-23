(function () {
  var eventName = "flutter-bootstrap-fallback";

  function emitReady() {
    window.dispatchEvent(new Event(eventName));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", emitReady, { once: true });
  } else {
    emitReady();
  }
})();
