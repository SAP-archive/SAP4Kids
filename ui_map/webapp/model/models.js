sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (JSONModel, Device) {
  "use strict";

  return {
    createDeviceModel: function () {
      var oModel = new JSONModel(Device);
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    },

    createShadowModel: function () {
      const oModel = new JSONModel({});
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    },

    createKeyModel: function () {
      const oModel = new JSONModel(window.sap4kidsTokens);
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    },

    createMainModel: function () {
      const oModel = new JSONModel([]);
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    },

    createUIModel: function (Component) {
      const today = new Date();
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);

      const inTwoWeeks = new Date();
      inTwoWeeks.setDate(today.getDate() + 14);

      const oStateModel = new JSONModel({
        locatingUser: false,
        requestingData: false,
        determineLocation: false,
        maxDate: inTwoWeeks,
        plannerVisible: Device.resize.height > 1000,
        minDate: today,
        selectedResources: ["11605ca6-3326-4b3f-9722-89ea1bf770a7",
          "4e4e2690-560f-4ce9-98e4-eea1dfdf11cf",
          "d19a7059-d22d-478b-8bf6-ecfc728e8ede",
          "df18e591-f087-4366-81e7-01beec8142a3",
          "ffc27506-c57a-4073-bf8a-1d2c0a0584c5",
          "e488ef60-bc20-452b-b8aa-bdd8c2934edb"
        ],
        selectedDays: ["availableMon", "availableTue", "availableWed", "availableThr", "availableFri", "availableSat", "availableSun"],
        selectedEligibilities: ["36a00731-7f07-42a8-a141-f4303d41a10b",
          "c78b9ea5-89af-4173-af65-efa75368bc4d",
          "2ff87b1c-045a-44ee-b4fa-b6f7723d8481",
          "9187677b-f967-4f5b-a36d-4d276ebf9ea5",
          "104cc2a5-62a5-4290-a800-0bc83ba1c730"
        ],
        mapMoved: false,
        mapCenter: {},
        version: Component.getManifestEntry("/sap.app/applicationVersion/version")
      });

      return oStateModel;
    }
  };
});
