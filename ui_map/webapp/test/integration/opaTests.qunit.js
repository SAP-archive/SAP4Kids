/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
  "use strict";

  sap.ui.require([
    "com/sap4kids/resourcelocator/test/integration/AllJourneys"
  ], function () {
    QUnit.start();
  });
});
