sap.ui.define([
  "sap/ui/core/UIComponent",
  "com/sap4kids/resourcelocator/model/models"
], function (UIComponent, models) {
  "use strict";

  return UIComponent.extend("com.sap4kids.resourcelocator.Component", {

    metadata: {
      manifest: "json"
    },

    /**
     * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
     * @public
     * @override
     */
    init: function () {
      // call the base component's init function
      UIComponent.prototype.init.apply(this, arguments);

      // enable routing
      this.getRouter().initialize();

      this.setModel(models.createDeviceModel(), "device");
      this.setModel(models.createKeyModel(), "keys");
      this.setModel(models.createMainModel(), "main");
      this.setModel(models.createUIModel(), "state");
    }
  });
});
