sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (BaseController) {
  "use strict";

  return BaseController.extend("com.sap4kids.resourcelocator.controller.App", {

    onInit: function () {
      this.getView().getModel("srv").attachSessionTimeout(function (oEvent) {
        console.log("Session timeout.");
      }, this);
    }
  });

});