self.port.on('x-unload', function () {
   var ev = document.createEvent('HTMLEvents');
   ev.initEvent('x-unload', true, false);
   window.dispatchEvent(ev);
});
