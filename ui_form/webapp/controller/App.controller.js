sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("com.sap4kids.assistanceentry.controller.App", {

		onInit: function () {
			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this.getView().getModel("backend").attachSessionTimeout(function (oEvent) {
				console.log("Session timeout.");
			}, this);
		}
	});

});
