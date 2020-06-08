sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	const LOCATION_TYPE_SCHOOL = "d741de0e-c541-4c93-b0b6-934cc30ba335";
	const ELIGIBILITY_TYPE_STUDENTS = "2ff87b1c-045a-44ee-b4fa-b6f7723d8481";

	return {

		createAppModel: function (Component) {
			var oModel = new JSONModel({
				version: Component.getManifestEntry("/sap.app/applicationVersion/version")
			});
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createKeyModel: function () {
			const oModel = new JSONModel(window.sap4kidsTokens);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createFrontendModel: function () {
			var oModel = new JSONModel({
				// step 1
				organziationType: "",
				state: "",
				stateKey: "",
				district: "",
				districtKey: "",
				school: "",
				schoolKey: "",
				locationName: "",
				locationType: "School",
				locationTypeKey: LOCATION_TYPE_SCHOOL,
				address: "",
				// step 2
				eligibilityKey: ELIGIBILITY_TYPE_STUDENTS,
				pickup: true,
				delivery: false,
				virtual: false,
				selectedTypes: [],
				webAddress: "",
				additionalInformation: "",
				// step 3
				name: "",
				title: "",
				phone: "",
				email: ""
			});
			return oModel;
		}

	};

});
