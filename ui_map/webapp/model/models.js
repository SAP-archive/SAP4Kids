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

    createUIModel: function () {
      const today = new Date();
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);

      const inTwoWeeks = new Date();
      inTwoWeeks.setDate(today.getDate() + 14);

      const oStateModel = new JSONModel({
        locatingUser: false,
        requestingData: false,
        maxDate: inTwoWeeks,
        minDate: today,
        selectedResources: ["03487ac3-e0db-43af-852b-2ebf198e3a0f",
          "9847b50a-31bd-4830-b961-9b6404007482",
          "06c9b85c-6ffc-4417-bbfe-7168410e0114",
          "33db847a-8ab3-4542-99ad-bc628a41c9f0"],
        selectedDays: ["availableMon", "availableTue", "availableWed", "availableThr", "availableFri", "availableSat", "availableSun"],
        selectedEligibilities: ["36a00731-7f07-42a8-a141-f4303d41a10b",
          "c78b9ea5-89af-4173-af65-efa75368bc4d",
          "2ff87b1c-045a-44ee-b4fa-b6f7723d8481",
          "9187677b-f967-4f5b-a36d-4d276ebf9ea5",
          "104cc2a5-62a5-4290-a800-0bc83ba1c730"
        ]
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function () {
          oStateModel.setProperty("/determineLocation", true);
        }, function () {
          oStateModel.setProperty("/determineLocation", false);
        });
      } else {
        oStateModel.setProperty("/determineLocation", false);
      }

      return oStateModel;
    }
  };
});
