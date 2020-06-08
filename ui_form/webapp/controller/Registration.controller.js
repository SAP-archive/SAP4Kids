sap.ui.define([
	"./BaseController",
	"../model/models",
	"../model/formatter",
	"../model/EmailType",
	"../model/URLType",
	"sap/ui/model/odata/v4/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/format/DateFormat",
	"openui5/googlemaps/MapUtils",
	"openui5/googlemaps/Marker",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/base/Log",
	"sap/m/MessageToast",
	"sap/m/TimePicker",
	"sap/ui/Device",
	"sap/m/Dialog",
	"sap/m/Button"
], function (BaseController, models, formatter, EmailType, URLType, ODataModel, JSONModel, MessageBox, DateFormat, MapUtils, Marker, Filter, FilterOperator, Sorter, Log, MessageToast, TimePicker, Device, Dialog, Button) {
	"use strict";
	var that = this;

	const SERVICE_URL = "/odata/entry/";
	const ORGANIZATION_TYPE_SCHOOL = "SchoolDistrict";
	const ORGANIZATION_TYPE_NONPROFIT = "NonProfit";
	const ORGANIZATION_TYPE_OTHER = "Other";
	const LOCATION_TYPE_SCHOOL = "d741de0e-c541-4c93-b0b6-934cc30ba335";
	const LOCATION_TYPE_NONPROFIT = "a0d20c3a-c708-424a-8a86-66f2ce1f9a7c";
	const TYPING_DELAY = 1000;
	const ASSISTANCE_TYPE_FOOD = "11605ca6-3326-4b3f-9722-89ea1bf770a7";
	const ELIGIBILITY_TYPE_PUBLIC = "36a00731-7f07-42a8-a141-f4303d41a10b";
	const ELIGIBILITY_TYPE_STUDENTS = "2ff87b1c-045a-44ee-b4fa-b6f7723d8481";
	const ASSISTANCE_SUBTYPE_BREAKFAST = "03487ac3-e0db-43af-852b-2ebf198e3a0f";
	const ASSISTANCE_SUBTYPE_LUNCH = "9847b50a-31bd-4830-b961-9b6404007482";
	const ASSISTANCE_SUBTYPE_DINNER = "06c9b85c-6ffc-4417-bbfe-7168410e0114";
	const ASSISTANCE_SUBTYPE_SNACKS = "33db847a-8ab3-4542-99ad-bc628a41c9f0";

	// monkey patch for sap.m.Timepicker to patch to round to the next quarter hour on open
	var fnOriginalToggleOpen = TimePicker.prototype.toggleOpen;
	TimePicker.prototype.toggleOpen = function (bOpened) {
		if (!bOpened) {
			if (this.getMinutesStep() && !this.getValue()) {
				var oTimeInstance = DateFormat.getTimeInstance(this.getValueFormat());
				var iNow = Date.now();
				var sValue = oTimeInstance.format(new Date(iNow - iNow % (this.getMinutesStep() * 60 * 1000)));
				this.setValue(sValue);
			}
		}
		fnOriginalToggleOpen.call(this, bOpened);
	};

	return BaseController.extend("com.sap4kids.assistanceentry.controller.Registration", {

		/*** Formatters and custom types ***/

		formatter: formatter,
		types: {
			email: new EmailType(),
			url: new URLType()
		},

		/*** Header and assistance popup handlers ***/

		onDisclaimerOpen: function () {
			this.byId("disclaimer").open();
		},

		onAboutOpen: function () {
			this.byId("about").open();
		},

		onFAQOpen: function () {
			this.byId("faq").open();
		},

		onHelp: function () {
			try {
				$("#launcher-frame").contents().find(".launcher-button").click();
			} catch (oException) {
				Log.warning("Could not access help iframe");
			}
		},

		onLogout: function () {
			window.location.href = "/do/logout";
		},

		onPrintLegal: function (oEvent) {
			var mywindow = window.open("", "PRINT", "height=400,width=600");

			mywindow.document.write("<html><head><title>Legal</title>");
			mywindow.document.write("</head><body >");
			mywindow.document.write(oEvent.getSource().getParent().getContent()[0].getText());
			mywindow.document.write("</body></html>");

			mywindow.document.close(); // necessary for IE >= 10
			mywindow.focus(); // necessary for IE >= 10*/

			mywindow.print();
			mywindow.close();

			return true;
		},

		onCloseDialog: function (oEvent) {
			oEvent.getSource().getParent().close();
		},

		/*onFeedbackOpen: function () {
			MessageToast.show("Not yet implemented :)")
		},*/

		onProfile: function (oEvent) {
			this.byId("profile").openBy(oEvent.getSource());
		},

		onSchoolInfo: function (oEvent) {
			this.byId("schoolInfo").openBy(oEvent.getSource());
		},

		onAssociationToSchoolInfo: function (oEvent) {
			this.byId("onAssociationToSchoolInfo").openBy(oEvent.getSource());
		},

		onAssistanceInfo: function (oEvent) {
			this.byId("assistanceInfo").openBy(oEvent.getSource());
		},

		onContactInfo: function (oEvent) {
			this.byId("contactInfo").openBy(oEvent.getSource());
		},

		/*** Init models ***/

		onInit: function () {
			// the frontend model
			this.setModel(models.createFrontendModel());

			// model used to manipulate control states
			var oViewModel = new JSONModel({
				lat: 48.8110034,
				lng: 9.169893199999999,
				markers: [],
				growingThreshold: 10000,
				busyDelay: 500,
				earlyRequests: true,
				organziationTypes: [
					{ key: ORGANIZATION_TYPE_SCHOOL, name: this.getResourceBundle().getText("organizationTypeSchoolDistrict") },
					{ key: ORGANIZATION_TYPE_NONPROFIT, name: this.getResourceBundle().getText("organizationTypeNonprofit") },
					{ key: ORGANIZATION_TYPE_OTHER, name: this.getResourceBundle().getText("organizationTypeOther") }
				]
			});
			this.setModel(oViewModel, "view");

			// focus first input field
			this.byId("page").addEventDelegate({
				onAfterRendering: function () {
					setTimeout(function () {
						this.byId("state").focus();
					}.bind(this), 500);

					// BUGFIX: disable autocomplete on chrome by setting autocomplete to chrome-off instead of off
					var oDelegate = {
						onAfterRendering: function () {
							if (Device.browser.chrome) {
								$("input[autocomplete=off]").attr("autocomplete", "chrome-off");
							}
						}
					};
					this.byId("organizationType").addEventDelegate(oDelegate);
					this.byId("state").addEventDelegate(oDelegate);
					this.byId("district").addEventDelegate(oDelegate);
					this.byId("school").addEventDelegate(oDelegate);
					this.byId("locationName").addEventDelegate(oDelegate);
					this.byId("locationType").addEventDelegate(oDelegate);
					this.byId("address").addEventDelegate(oDelegate);
					this.byId("webAddress").addEventDelegate(oDelegate);
					this.byId("contactName").addEventDelegate(oDelegate);
					this.byId("contactTitle").addEventDelegate(oDelegate);
					this.byId("contactEmail").addEventDelegate(oDelegate);
					this.byId("contactPhone").addEventDelegate(oDelegate);
					this.byId("assistanceType").addEventDelegate(oDelegate);
					this.byId("assistanceSubType").addEventDelegate(oDelegate);
					this.byId("serviceEntitlement").addEventDelegate(oDelegate);

				}.bind(this)
			});
		},

		onAfterRendering: function () {
			/*
			// initialize google captcha
			this._prepareCaptcha();
			$("#recaptcha").attr("data-sitekey", window.sap4kidsTokens.recaptcha);
			*/

			// hide splash screen
			$("#splashScreen").remove();
		},

		/*** Form Handlers ***/

		/** Step 1 **/

		onChangeOrganizationType(oEvent) {
			var oOrganizationTypeCombobox = this.byId("organizationType");
			var sKey;

			// ensure that entry from the list is selected
			if (oOrganizationTypeCombobox.getSelectedItem()) {
				sKey = oOrganizationTypeCombobox.getSelectedItem().getKey();
				// remove this BUGFIX later - key has a space in the database
				sKey = sKey.replace(" ", "");
				oOrganizationTypeCombobox.setValueState("None");
				oOrganizationTypeCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
			} else {
				oOrganizationTypeCombobox.setValueState("Error");
				oOrganizationTypeCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorSelectValueFromList"));
				return;
			}

			// optimization: handle only selection change events for loading data
			if (oEvent.getId() === "change") {
				return;
			}

			// show/hide school related blocks in step 1
			this.byId("schoolForm").setVisible(sKey === ORGANIZATION_TYPE_SCHOOL);
			this.onAssociatedToSchool(sKey === ORGANIZATION_TYPE_SCHOOL);
			this.byId("associationToSchool").setSelected(sKey === ORGANIZATION_TYPE_SCHOOL);

			// set some meaningful defaults for step 1 and 3
			this.byId("locationType").setSelectedKey(sKey === ORGANIZATION_TYPE_SCHOOL ? LOCATION_TYPE_SCHOOL : LOCATION_TYPE_NONPROFIT);
			this.byId("serviceEntitlement").setSelectedKey(sKey === ORGANIZATION_TYPE_SCHOOL ? ELIGIBILITY_TYPE_STUDENTS : ELIGIBILITY_TYPE_PUBLIC);

			// write key to view model
			this.getModel().setProperty("/organizationTypeKey", sKey);
		},

		onChangeState: function (oEvent) {
			var oViewModel = this.getModel("view");
			var oDistrictCombobox = this.byId("district");
			var oStateCombobox = this.byId("state");
			var sKey;

			// ensure that entry from the list is selected
			if (oStateCombobox.getSelectedItem()) {
				sKey = oStateCombobox.getSelectedItem().getKey();
				oStateCombobox.setValueState("None");
				oStateCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
			} else {
				oStateCombobox.setValueState("Error");
				oStateCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorSelectValueFromList"));
				return;
			}

			// optimization: handle only selection change events for loading data
			if (oEvent.getId() === "change") {
				return;
			}

			clearTimeout(this._stateTypingTimeout);
			// optimization: only trigger validation after a certain typing delay
			this._stateTypingTimeout = setTimeout(function () {
				// write key to view model
				this.getModel().setProperty("/stateKey", sKey);

				// construct filters
				var aFilters = [];
				if (sKey) {
					aFilters.push(new Filter("state_StateCode", FilterOperator.EQ, sKey));
				}

				// construct sorters
				var aSorters = [];
				aSorters.push(new Sorter("name"));

				oDistrictCombobox.bindAggregation("suggestionItems", {
					model: "backend",
					path: "/Districts",
					length: this.getModel("view").getProperty("/growingThreshold"),
					template: this.byId("district").getBindingInfo("suggestionItems").template.clone(),
					templateShareable: true,
					sorter: aSorters,
					filters: aFilters,
					events: {
						dataRequested: function () {
							oViewModel.setProperty("/districtBusy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/districtBusy", false);
							oDistrictCombobox.setSelectedKey("");
							oDistrictCombobox.setEnabled(true);
							oDistrictCombobox.setValueState("None");
							oDistrictCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
						}.bind(this)
					}
				});
			}.bind(this), TYPING_DELAY);
		},

		onSuggestDistrict: function (oEvent) {
			/*
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("name", sap.ui.model.FilterOperator.StartsWith, sTerm));
			}
			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);*/
		},

		onChangeDistrict: function (oEvent) {
			var oViewModel = this.getModel("view");
			var oSchoolCombobox = this.byId("school");
			var oDistrictCombobox = this.byId("district");
			var sKey;

			// ensure that entry from the list is selected
			if (oDistrictCombobox.getSelectedItem()) {
				sKey = sap.ui.getCore().byId(oDistrictCombobox.getSelectedItem()).getKey();
				oDistrictCombobox.setValueState("None");
				oDistrictCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
			} else {
				oDistrictCombobox.setValueState("Error");
				oDistrictCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorSelectValueFromSuggestion"));
				return;
			}

			// optimization: handle only selection change events for loading data
			/*
			if (oEvent.getId() === "change") {
				return;
			}*/

			// optimization: if key is still the same, don't rebind
			if (sKey && sKey === this.getModel().getProperty("/districtKey")) {
				return;
			}

			clearTimeout(this._districtTypingTimeout);
			// optimization: only trigger validation after a certain typing delay
			this._districtTypingTimeout = setTimeout(function () {
				// write key to view model
				this.getModel().setProperty("/districtKey", sKey);

				// construct filter
				var aFilters = [];
				if (sKey) {
					aFilters.push(new Filter("district_leaid", FilterOperator.EQ, sKey));
				}

				// construct sorter
				var aSorters = [];
				aSorters.push(new Sorter("name"));

				oSchoolCombobox.bindAggregation("items", {
					model: "backend",
					path: "/Schools",
					length: this.getModel("view").getProperty("/growingThreshold"),
					template: this.byId("school").getBindingInfo("items").template.clone(),
					templateShareable: true,
					sorter: aSorters,
					filters: aFilters,
					events: {
						dataRequested: function () {
							oViewModel.setProperty("/schoolBusy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/schoolBusy", false);
							oSchoolCombobox.setSelectedKey("");
							oSchoolCombobox.setValueState("None");
							oSchoolCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
							oSchoolCombobox.setEnabled(true);
						}.bind(this)
					}
				});
			}.bind(this), TYPING_DELAY);
		},

		onChangeSchool: function (oEvent) {
			this._wizard = this.byId("wizard");
			var currentStep = this._wizard.getCurrentStep();
			switch (currentStep) {
				case "container-com.sap4kids.assistanceentry---registration--StepModifyOffering":
					this._wizard.previousStep();
					break;
				case "container-com.sap4kids.assistanceentry---registration--Step2":
					this._wizard.previousStep();
					break;
				case "container-com.sap4kids.assistanceentry---registration--Step3":
					this._wizard.previousStep();
					this._wizard.previousStep();
					break;
			}

			var oSchoolCombobox = this.byId("school");
			var sKey;

			if (oSchoolCombobox.getSelectedItem()) {
				sKey = oSchoolCombobox.getSelectedItem().getKey();
				oSchoolCombobox.setValueState("None");
				oSchoolCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
			} else {
				oSchoolCombobox.setValueState("Error");
				oSchoolCombobox.setValueStateText(this.getResourceBundle().getText("validationErrorSelectValueFromList"));
				return;
			}

			// optimization: handle only selection change events for loading data
			if (oEvent.getId() === "change") {
				return;
			}

			// optimization: if key is still the same, don't rebind
			if (sKey && sKey === this.getModel().getProperty("/schoolKey")) {
				return;
			}

			clearTimeout(this._schoolTypingTimeout);
			// optimization: only trigger validation after a certain typing delay
			this._schoolTypingTimeout = setTimeout(function () {
				// write key to client model
				this.getModel().setProperty("/schoolKey", sKey);

				// call helper service to check for existing offerings for this school
				$.get({
					url: SERVICE_URL + "Schools('" + sKey + "')?$expand=schoolAssistance($expand=assistance)",
					success: function (oData) {
						var oMessageStrip = this.byId("entriesExistStrip");
						var oResourceBundle = this.getResourceBundle();

						if (oData.schoolAssistance.length) {
							var oDateFormat = DateFormat.getTimeInstance("hh:mm a");
							var aOfferings = [];
							for (var i = 0; i < oData.schoolAssistance.length; i++) {
								var sTime = oDateFormat.format(oDateFormat.parse(oData.schoolAssistance[i].assistance.timeFrom)) + "-" + oDateFormat.format(oDateFormat.parse(oData.schoolAssistance[i].assistance.timeTo));
								switch (oData.schoolAssistance[i].assistance.assistanceSubType_ID) {
									case ASSISTANCE_SUBTYPE_BREAKFAST: aOfferings.push(oResourceBundle.getText("assistanceSubtypeFoodBreakfast") + " (" + sTime + ")"); break;
									case ASSISTANCE_SUBTYPE_LUNCH: aOfferings.push(oResourceBundle.getText("assistanceSubtypeFoodLunch") + " (" + sTime + ")"); break;
									case ASSISTANCE_SUBTYPE_DINNER: aOfferings.push(oResourceBundle.getText("assistanceSubtypeFoodDinner") + " (" + sTime + ")"); break;
									case ASSISTANCE_SUBTYPE_SNACKS: aOfferings.push(oResourceBundle.getText("assistanceSubtypeFoodSnacks") + " (" + sTime + ")"); break;
									default: aOfferings.push(oResourceBundle.getText("assistanceSubtypeFoodOther") + " (" + sTime + ")");
								}
							}
							oMessageStrip.setVisible(true);
							oMessageStrip.setType("Warning");
							oMessageStrip.setText(oResourceBundle.getText("schoolExistingOfferingsWarning", [oData.schoolAssistance.length, aOfferings.join(", ")]));
						} else {
							oMessageStrip.setVisible(true);
							oMessageStrip.setType("Success");
							oMessageStrip.setText(oResourceBundle.getText("schoolExistingOfferingsSuccess"));
						}
					}.bind(this),
					error: function () {
						Log.warning("Could not find address for school id " + sKey);
					}
				});

				// read address manually from backend service
				var sAddressKey = oSchoolCombobox.getSelectedItem().getBindingContext("backend").getObject().address_ID;
				$.get({
					url: SERVICE_URL + "Addresses(" + sAddressKey + ")",
					success: function (oData) {
						var oClientModel = this.getModel();
						var sAddress = oData.street + " " + oData.city + ", " + oData.state_StateCode + " " + oData.zip;
						// convert to title case for all upper case data
						if (sAddress === sAddress.toUpperCase()) {
							sAddress = this.formatter.titleCase(sAddress);
						}
						oClientModel.setProperty("/address", sAddress);
						oClientModel.setProperty("/addressEntity", oData);
						this.updateMap(this.byId("address").getValue());
					}.bind(this),
					error: function () {
						Log.warning("Could not find an address with this key");
					}
				});
			}.bind(this), TYPING_DELAY);

			if (this.byId("modeSelection").getSelectedKey() === "modify") {
				this.setOfferingMode();
			}

			//var isMapVisible = this.byId("map").getVisible();
			//if (isMapVisible) {
			this.byId("mapForm").setVisible(true);
			this.byId("SchoolMapGrid").setDefaultSpan("XL6 L6 M12 S12");
			//} else {
			//this.byId("SchoolMapGrid").setDefaultSpan("XL12 L12 M12 S12");
			//}
			/* var defaultSpan = this.byId("SchoolMapGrid").getDefaultSpan();
			if (this.byId("showMapButton")) {
				switch (defaultSpan) {
					case "XL6 L6 M12 S12":
						this.byId("showMapButton").setVisible(false);
						break;
					case "XL12 L12 M12 S12":
						this.byId("showMapButton").setVisible(true);
						break;
				}
			} */
		},

		onAssociatedToSchool: function (vEvent) {
			var bSelected = typeof vEvent === "boolean" ? vEvent : vEvent.getParameter("selected");

			if (!bSelected) {
				this.byId("school").setValue("");
				this.byId("locationType").setSelectedKey("");
			} else {
				this.byId("address").setValue("");
				this.byId("locationType").setSelectedKey(LOCATION_TYPE_SCHOOL);
			}
			this.byId("school").setEditable(bSelected);
			this.byId("address").setEditable(!bSelected);
			this.byId("address").setRequired(!bSelected);
			this.byId("locationType").setEditable(!bSelected);
			this.byId("locationName").setEditable(!bSelected);
			this.byId("schoolElement").setVisible(bSelected);
			this.byId("locationTypeElement").setVisible(!bSelected);
			this.byId("locationNameElement").setVisible(!bSelected);
			this.byId("entriesExistStrip").setVisible(false);
			this.byId("locationExistStrip").setVisible(false);
		},

		onChangeLocationName: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sAddress = this.byId("address").getValue();

			oEvent.getSource().setValueState(sValue ? "None" : "Error");

			if (sValue && sAddress) {
				this.checkLocationExists();
			}
		},

		checkLocationExists: function () {
			var sValue = this.byId("locationName").getValue();

			// call helper service to check for existing offerings for this school
			$.get({
				url: SERVICE_URL + "AssistanceLocations?$expand=address&$filter=name%20eq%20%27" +
					encodeURI(formatter.formatOrgName(sValue)) + "%27",
				success: function (oData) {
					// check if address matches the one entered in the form
					var oMessageStrip = this.byId("locationExistStrip");
					var oResourceBundle = this.getResourceBundle();
					var oAddress = this.getModel().getProperty("/addressLookup");

					var iMatches = 0;
					if (oData.value.length && oAddress && oAddress.geometry && oAddress.geometry.location) {
						var iLat = oAddress.geometry.location.lat();
						var iLng = oAddress.geometry.location.lng();

						for (var i = 0; i < oData.value.length; i++) {
							// compare lat and lon from lookup to the service
							if (oData.value[i].address && oData.value[i].address.lat === iLat && oData.value[i].address.long === iLng) {
								iMatches++;
							}
						}
					}

					if (iMatches > 0) {
						oMessageStrip.setVisible(true);
						oMessageStrip.setType("Warning");
						oMessageStrip.setText(oResourceBundle.getText("locationExistingOfferingsWarning", [iMatches]));
					} else {
						oMessageStrip.setVisible(true);
						oMessageStrip.setType("Success");
						oMessageStrip.setText(oResourceBundle.getText("locationExistingOfferingsSuccess"));
					}
				}.bind(this),
				error: function () {
					Log.warning("Could not find address for school id " + sValue);
				}
			});
		},

		onChangeAddress: function (oEvent) {
			var sValue = oEvent.getParameter("value");

			var oPromise = this.updateMap(sValue);
			oEvent.getSource().setValueState(sValue ? "None" : "Error");

			if (sValue) {
				oPromise.done(function () {
					this.checkLocationExists();
				}.bind(this));
			}

			this.byId("mapForm").setVisible(true);
			this.byId("SchoolMapGrid").setDefaultSpan("XL6 L6 M12 S12");
		},

		updateMap: function (sAddress) {
			var oPromise = MapUtils.search({
				"address": sAddress
			}).then(function (results) {
				// first entry is the most useful result
				var oItem = results.shift();
				var oViewModel = this.getModel("view");
				// update view model if coordinates are found
				if (oItem && oItem.geometry) {
					oViewModel.setProperty("/lat", oItem.geometry.location.lat());
					oViewModel.setProperty("/lng", oItem.geometry.location.lng());
					oViewModel.setProperty("/markers", [{
						lat: oItem.geometry.location.lat(),
						lng: oItem.geometry.location.lng(),
						info: "Pickup Location"
					}]);
				} else {
					this.byId("address").setValueState("Warning");
				}
				// store address lookup context in client model
				this.getModel().setProperty("/addressLookup", oItem);
			}.bind(this),
				function (error) {
					console.log("map search error : " + error.toString());
				});
			//this.byId("map").setVisible(true);

			return oPromise;
		},

		onDialogPress: function () {
			switch (this.byId("map").getVisible()) {
				case false:
					this.byId("map").setVisible(true);
					break;
				case true:
					this.byId("map").setVisible(false);
					break;
			}

			// if (!this.pressDialog) {
			// 	this.pressDialog = new Dialog({
			// 		title: "Available Products",
			// 		content: new Text({
			// 			text: "Hello"
			// 		}),
			// 		/* beginButton: new Button({
			// 			type: ButtonType.Emphasized,
			// 			text: "OK",
			// 			press: function () {
			// 				this.pressDialog.close();
			// 			}.bind(this)
			// 		}), */
			// 		endButton: new Button({
			// 			text: "Close",
			// 			press: function () {
			// 				this.pressDialog.close();
			// 			}.bind(this)
			// 		})
			// 	});

			// 	//to get access to the global model
			// 	this.getView().addDependent(this.pressDialog);
			// }

			// this.pressDialog.open();
		},

		/** Step Select Offering Mode **/
		setOfferingMode: function () {
			this._wizard = this.byId("wizard");
			switch (this.byId("modeSelection").getSelectedKey()) {
				case "create":
					this._wizard = this.byId("wizard");
					var currentStep = this._wizard.getCurrentStep();
					switch (currentStep) {
						case "container-com.sap4kids.assistanceentry---registration--StepModifyOffering":
							this._wizard.previousStep();
							break;
					}
					this.byId("schoolOfferings").setVisible(false);
					this.byId("ButtonDeleteOffering").setVisible(false);
					this.byId("schoolOfferingsNoData").setVisible(false);
					this.byId("orgOfferings").setVisible(false);
					this.byId("schoolOfferingsNoData").setVisible(false);
					this._wizard.validateStep(this.byId("StepSelectOfferingMode"));
					break;
				case "modify":
					this._wizard = this.byId("wizard");
					var currentStep = this._wizard.getCurrentStep();
					switch (currentStep) {
						case "container-com.sap4kids.assistanceentry---registration--Step2":
							this._wizard.previousStep();
							break;
						case "container-com.sap4kids.assistanceentry---registration--Step3":
							this._wizard.previousStep();
							this._wizard.previousStep();
							break;
					}
					this.byId("ButtonDeleteOffering").setVisible(true);

					//container-com.sap4kids.assistanceentry---registration--StepSelectOfferingMode
					if (currentStep === "container-com.sap4kids.assistanceentry---registration--StepModifyOffering") {
						this.onActivateStepSelectOfferingMode();
					}

					var organizationTypeKey = this.byId("organizationType").getSelectedKey();

					switch (organizationTypeKey) {
						case "NonProfit":
						case "Other":
							var sKey = formatter.formatOrgName(this.byId("locationName").getValue());
							$.get({
								url: SERVICE_URL + "Organizations?$filter=name%20eq%20%27" + sKey + "%27",
								success: function (oData) {
									if (oData.value.length > 0) {
										sKey = oData.value[0].ID;
										$.get({
											url: SERVICE_URL + "OrganizationOfferingAssistance?$expand=*&$filter=organization_ID%20eq%20" + sKey,
											success: function (oData) {
												if (oData.value.length > 0) {
													this._wizard.validateStep(this.byId("StepSelectOfferingMode"));
													this.byId("orgOfferings").setVisible(true);
													var orgAssistanceModel = new JSONModel(oData);
													this.byId("orgOfferings").setModel(orgAssistanceModel);
												} else {
													this._wizard.invalidateStep(this.byId("StepSelectOfferingMode"));
													this.byId("schoolOfferingsNoData").setVisible(true);
												}
											}.bind(this),
											error: function () {
												Log.warning("Error" + sKey);
											}
										});
									} else {
										this._wizard.invalidateStep(this.byId("StepSelectOfferingMode"));
										this.byId("schoolOfferingsNoData").setVisible(true);
										this.byId("schoolOfferingsNoData").setText("No offerings available at this location.");
									}

								}.bind(this),
								error: function () {
									Log.warning("Error" + sKey);
								}
							});
							break;
						case "SchoolDistrict":
							var oSchoolCombobox = this.byId("school");
							var sKey = oSchoolCombobox.getSelectedKey();
							$.get({
								url: SERVICE_URL + "Schools('" + sKey + "')?$expand=schoolAssistance($expand=assistance)",
								success: function (oData) {
									if (oData.schoolAssistance.length > 0) {
										this._wizard.validateStep(this.byId("StepSelectOfferingMode"));
										this.byId("schoolOfferings").setVisible(true);
										var schoolAssistanceModel = new JSONModel(oData);
										this.byId("schoolOfferings").setModel(schoolAssistanceModel);
										this.byId("schoolOfferingsNoData").setVisible(false);
									} else {
										this._wizard.invalidateStep(this.byId("StepSelectOfferingMode"));
										this.byId("schoolOfferingsNoData").setVisible(true);
										this.byId("schoolOfferings").setVisible(false);
									}
								}.bind(this),
								error: function () {
									Log.warning("Error" + sKey);
								}
							});
							break;
					}
					break;
			}
		},

		onSchoolOfferingsChange: function () {
			//this.byId("ButtonDeleteOffering").setVisible(true);
			var currentStep = this.byId("wizard").getCurrentStep();
			//container-com.sap4kids.assistanceentry---registration--StepSelectOfferingMode
			if (currentStep === "container-com.sap4kids.assistanceentry---registration--StepModifyOffering") {
				this.onActivateStepSelectOfferingMode();
			}
		},

		goToOfferingStep: function () {
			var selectedKey = this.byId("modeSelection").getSelectedKey();
			switch (selectedKey) {
				case "create":
					this.byId("StepSelectOfferingMode").setNextStep(this.getView().byId("Step2"));
					break;
				case "modify":
					this.byId("StepSelectOfferingMode").setNextStep(this.getView().byId("StepModifyOffering"));
					break;
			}
		},

		onPressDeleteOfferingButton: function () {
			var selectedKeyOffering = this.byId("schoolOfferings").getSelectedItem() ?
				this.byId("schoolOfferings").getSelectedItem().getKey() :
				this.byId("orgOfferings").getSelectedItem().getKey();
			var oBinding = this.getModel("backend").bindContext("/AssistanceOfferings(" + selectedKeyOffering + ")");
			var oContext = oBinding.getBoundContext();

			// Confirm
			MessageBox.confirm("Are you sure you want to delete this offering?", {
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.OK) {
						// Delete Offering
						var deleteSuccess = "Offering deleted successfully!";
						var deleteError = "Error deleting offering.";

						try {
							oContext.requestObject().then(function () {
								this.toggleSubmit(false);
								oContext.delete()
									.then(function (err) {
										if (err) {
											MessageBox.error(deleteError);
										} else {
											// thats it
											//var sName = this.getModel().getProperty("/locationName");
											var sMessage = this.getResourceBundle().getText("successMessageDelete");
											var sMessageLong = this.getResourceBundle().getText("successMessageLongModify");
											this.showSuccess(sMessage, sMessageLong);
											this.toggleSubmit(true);
										}
									}.bind(this));
							}.bind(this));
						} catch (ex) {
							MessageBox.error(deleteError);
						}
					}
				}.bind(this)
			});
		},

		onActivateStepSelectOfferingMode: function () {
			var selectedKeyOffering;
			var organizationTypeKey = this.byId("organizationType").getSelectedKey();

			switch (organizationTypeKey) {
				case "NonProfit":
				case "Other":
					selectedKeyOffering = this.getView().byId("orgOfferings").getSelectedKey();
					break;
				case "SchoolDistrict":
					selectedKeyOffering = this.getView().byId("schoolOfferings").getSelectedKey();
					break;
			}

			$.get({
				url: SERVICE_URL + "AssistanceOfferings(" + selectedKeyOffering + ")",
				success: function (oData) {
					this.byId("scheduleFormModify_0").setTitle(this.formatter.assistanceSubType_ID_toText(oData.assistanceSubType_ID));
					this.byId("scheduleFormModify_0").setVisible(true);
					this.byId("contactNameModify").setValue(oData.contactName);
					this.byId("contactTitleModify").setValue(oData.contactTitle);
					this.byId("contactEmailModify").setValue(oData.contactEmail);
					this.byId("contactPhoneModify").setValue(oData.contactPhone);
					this.byId("assistanceTypeModify").setSelectedKey(oData.assistanceType_ID);
					if (oData.assistanceSubType_ID === null || oData.assistanceType_ID !== "11605ca6-3326-4b3f-9722-89ea1bf770a7") {
						this.byId("assistanceSubTypeElementModify").setVisible(false);
					} else {
						this.byId("assistanceSubTypeModify").setSelectedKey(oData.assistanceSubType_ID);
						this.byId("assistanceSubTypeElementModify").setVisible(true);
					}

					this.byId("serviceEntitlementModify").setSelectedKey(oData.eligiblityCategory_ID);
					this.byId("pickupModify").setSelected(oData.pickupInd);
					this.byId("deliveryModify").setSelected(oData.deliveryInd);
					this.byId("virtualModify").setSelected(oData.virtualInd);
					this.byId("offerDetailsModify").setValue(oData.offerDetails);
					this.byId("webAddressModify").setValue(oData.websiteURL);
					this.byId("availableMon_0").setSelected(oData.availableMon);
					this.byId("availableTue_0").setSelected(oData.availableTue);
					this.byId("availableWed_0").setSelected(oData.availableWed);
					this.byId("availableThu_0").setSelected(oData.availableThr);
					this.byId("availableFri_0").setSelected(oData.availableFri);
					this.byId("availableSat_0").setSelected(oData.availableSat);
					this.byId("availableSun_0").setSelected(oData.availableSun);

					var timeFrom = oData.timeFrom;
					var timeTo = oData.timeTo;
					var startDate = oData.startDate;
					var endDate = oData.endDate;
					if (startDate === null) {
						//console.log("startDate is null");
					} else {
						startDate = startDate.split("-");
						startDate = new Date(startDate[0], Number(startDate[1]) - 1, startDate[2]);
					}
					if (endDate === null) {
						//console.log("endDate is null");
					} else {
						endDate = endDate.split("-");
						endDate = new Date(endDate[0], Number(endDate[1]) - 1, endDate[2]);
					}
					this.byId("timerangeFromModify_0").setValue(timeFrom);
					this.byId("timerangeToModify_0").setValue(timeTo);
					this.byId("daterangeModify_0").setDateValue(startDate);
					this.byId("daterangeModify_0").setSecondDateValue(endDate);
				}.bind(this),
				error: function () {
					console.log("Error getting assistance offering.");
				}
			});
			//this.byId("contactNameModify").setValue(contactName);
		},

		/*setDiscardableProperty: function (params) {
			if (this._wizard.getProgressStep() !== params.discardStep) {
				MessageBox.warning(params.message, {
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.YES) {
							this._wizard.discardProgress(params.discardStep);
							history[params.historyPath] = this.model.getProperty(params.modelPath);
						} else {
							this.model.setProperty(params.modelPath, history[params.historyPath]);
						}
					}.bind(this)
				});
			} else {
				history[params.historyPath] = this.model.getProperty(params.modelPath);
			}
		},*/

		/** Step Modify Offering **/

		onSelectAssistanceTypeModify: function () {
			var oAssistanceTypeControl = this.byId("assistanceTypeModify");
			var oAssistanceSubTypeControl = this.byId("assistanceSubTypeModify");
			var sKey = oAssistanceTypeControl.getSelectedItem().getKey();

			// build filter array
			var aFilter = [];
			if (sKey) {
				aFilter.push(new Filter("assistanceType_ID", FilterOperator.EQ, sKey));
			}

			// filter binding
			oAssistanceSubTypeControl.getBinding("items").filter(aFilter);

			// write key to view model
			this.getModel().setProperty("/assistanceType", sKey);

			// show/hide food subtype choice in step 3
			this.byId("assistanceSubTypeElementModify").setVisible(sKey === ASSISTANCE_TYPE_FOOD);

			// just add one generic schedule entry in step 3
			var aSelectedTypes = [];
			if (sKey !== ASSISTANCE_TYPE_FOOD) {
				var oScheduleTemplate = {
					"subType": "", // no text for header
					"monday": true,
					"tuesday": true,
					"wednesday": true,
					"thursday": true,
					"friday": true,
					"saturday": false,
					"sunday": false,
					"dateFrom": null,
					"dateTo": null
				};
				aSelectedTypes.push(oScheduleTemplate);
			}
			this.getModel().setProperty("/selectedTypes", aSelectedTypes);
			this.byId("assistanceSubTypeModify").setSelectedItems([]);
			this.byId("scheduleFormModify").setVisible(sKey !== ASSISTANCE_TYPE_FOOD);
		},

		onFoodSelectionChangeModify: function (oEvent) {
			/*var oChangedItem = oEvent.getParameter("changedItem");
			var bSelected = oEvent.getParameter("selected");
			var sKey = oChangedItem.getKey();
	
			var aTypes = this.getModel().getProperty("/selectedTypes");
			var bKeyExists = aTypes.some(function (oItem) {
				return oItem.ID === sKey;
			});
	
			if (!bKeyExists) {
				var oContext = oChangedItem.getBindingContext("backend").getObject();
				var oScheduleTemplate = {
					"monday": true,
					"tuesday": true,
					"wednesday": true,
					"thursday": true,
					"friday": true,
					"saturday": false,
					"sunday": false,
					"dateFrom": null,
					"dateTo": null
				};
				var oContext = Object.assign(oContext, oScheduleTemplate);
	
				// add custom sort value
				switch (oContext.subType) {
					case "Breakfast": oContext.sort = 1; break;
					case "Lunch": oContext.sort = 2; break;
					case "Dinner": oContext.sort = 3; break;
					case "Snack": oContext.sort = 4; break;
					default:
						oContext.sort = 99;
				}
	
				aTypes.push(oContext);
			} else {
				if (!bSelected) {
					var iIndex = aTypes.map(function (oItem) {
						return oItem.ID;
					}).indexOf(sKey);
					aTypes.splice(iIndex, 1);
				}
			}
			this.getModel().setProperty("/selectedTypes", aTypes);
			if (oEvent.getSource().getSelectedItems().length) {
				oEvent.getSource().setValueState("None");
			}
			this.byId("scheduleFormModify").setVisible(!!oEvent.getSource().getSelectedItems().length);
			*/
		},

		onSelectFromTimeModify: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sOtherValue = this.getModel().getProperty(oEvent.getSource().getBindingContext() + "/timerangeTo");
			var oOtherTimePicker = $(oEvent.getSource().getParent().getParent().getParent().$().find(".sapMTimePicker")[1]).control(0);

			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
			if (sValue && sOtherValue) {
				var oTimeInstance = DateFormat.getTimeInstance("hh:mm a");
				var oFromDate = oTimeInstance.parse(sValue);
				var oToDate = oTimeInstance.parse(sOtherValue);

				if (oFromDate > oToDate) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorFromTime"));
				} else {
					oEvent.getSource().setValueState("None");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
					if (oOtherTimePicker.getValueState() === "Error") {
						oOtherTimePicker.setValueState("None");
					}
				}
			}
		},

		onSelectToTimeModify: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sOtherValue = this.getModel().getProperty(oEvent.getSource().getBindingContext() + "/timerangeFrom");
			var oOtherTimePicker = $(oEvent.getSource().getParent().getParent().getParent().$().find(".sapMTimePicker")[0]).control(0);

			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
			if (sValue && sOtherValue) {
				var oTimeInstance = DateFormat.getTimeInstance("hh:mm a");
				var oFromDate = oTimeInstance.parse(sOtherValue);
				var oToDate = oTimeInstance.parse(sValue);

				if (oFromDate > oToDate) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorFromTime"));
				} else {
					oEvent.getSource().setValueState("None");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
					if (oOtherTimePicker.getValueState() === "Error") {
						oOtherTimePicker.setValueState("None");
					}
				}
			}
		},

		onSelectDateRangeModify: function (oEvent) {
			var oControl = oEvent.getSource();
			if (oControl.getSecondDateValue() && oControl.getSecondDateValue() < Date.now()) {
				oEvent.getSource().setValueState("Warning");
			} else {
				oEvent.getSource().setValueState("None");
			}
		},

		onChangeWebAddressModify: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			// add http:// on the fly
			if (sValue && !/^https?:\/\//.test(sValue)) {
				sValue = "http://" + sValue;
				oEvent.getSource().setValue(sValue);
			}
		},

		onChangeContactNameModify: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
		},

		onChangeContactEmailModify: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
		},

		/** Step 2 **/

		onSelectAssistanceType: function () {
			var oAssistanceTypeControl = this.byId("assistanceType");
			var oAssistanceSubTypeControl = this.byId("assistanceSubType");
			var sKey = oAssistanceTypeControl.getSelectedItem().getKey();

			// build filter array
			var aFilter = [];
			if (sKey) {
				aFilter.push(new Filter("assistanceType_ID", FilterOperator.EQ, sKey));
			}

			// filter binding
			oAssistanceSubTypeControl.getBinding("items").filter(aFilter);

			// write key to view model
			this.getModel().setProperty("/assistanceType", sKey);

			// show/hide food subtype choice in step 3
			this.byId("assistanceSubTypeElement").setVisible(sKey === ASSISTANCE_TYPE_FOOD);

			// just add one generic schedule entry in step 3
			var aSelectedTypes = [];
			if (sKey !== ASSISTANCE_TYPE_FOOD) {
				var oScheduleTemplate = {
					"subType": "", // no text for header
					"monday": true,
					"tuesday": true,
					"wednesday": true,
					"thursday": true,
					"friday": true,
					"saturday": false,
					"sunday": false,
					"dateFrom": null,
					"dateTo": null
				};
				aSelectedTypes.push(oScheduleTemplate);
			}
			this.getModel().setProperty("/selectedTypes", aSelectedTypes);
			this.byId("assistanceSubType").setSelectedItems([]);
			this.byId("scheduleForm").setVisible(sKey !== ASSISTANCE_TYPE_FOOD);
		},

		onFoodSelectionChange: function (oEvent) {
			var oChangedItem = oEvent.getParameter("changedItem");
			var bSelected = oEvent.getParameter("selected");
			var sKey = oChangedItem.getKey();

			var aTypes = this.getModel().getProperty("/selectedTypes");
			var bKeyExists = aTypes.some(function (oItem) {
				return oItem.ID === sKey;
			});

			if (!bKeyExists) {
				var oContext = oChangedItem.getBindingContext("backend").getObject();
				var oScheduleTemplate = {
					"monday": true,
					"tuesday": true,
					"wednesday": true,
					"thursday": true,
					"friday": true,
					"saturday": false,
					"sunday": false,
					"dateFrom": null,
					"dateTo": null
				};
				var oContext = Object.assign(oContext, oScheduleTemplate);

				// add custom sort value
				switch (oContext.subType) {
					case "Breakfast": oContext.sort = 1; break;
					case "Lunch": oContext.sort = 2; break;
					case "Dinner": oContext.sort = 3; break;
					case "Snack": oContext.sort = 4; break;
					default:
						oContext.sort = 99;
				}

				aTypes.push(oContext);
			} else {
				if (!bSelected) {
					var iIndex = aTypes.map(function (oItem) {
						return oItem.ID;
					}).indexOf(sKey);
					aTypes.splice(iIndex, 1);
				}
			}
			this.getModel().setProperty("/selectedTypes", aTypes);
			if (oEvent.getSource().getSelectedItems().length) {
				oEvent.getSource().setValueState("None");
			}
			this.byId("scheduleForm").setVisible(!!oEvent.getSource().getSelectedItems().length);
		},

		onSelectDay: function (oEvent) {
			var bSelected = oEvent.getParameter("selected");
			// reset whole group
			if (bSelected) {
				oEvent.getSource().getParent().getItems().forEach(function (oCheckBox) {
					oCheckBox.setValueState("None");
				});
			}
		},

		onSelectFromTime: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sOtherValue = this.getModel().getProperty(oEvent.getSource().getBindingContext() + "/timerangeTo");
			var oOtherTimePicker = $(oEvent.getSource().getParent().getParent().getParent().$().find(".sapMTimePicker")[1]).control(0);

			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
			if (sValue && sOtherValue) {
				var oTimeInstance = DateFormat.getTimeInstance("hh:mm a");
				var oFromDate = oTimeInstance.parse(sValue);
				var oToDate = oTimeInstance.parse(sOtherValue);

				if (oFromDate > oToDate) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorFromTime"));
				} else {
					oEvent.getSource().setValueState("None");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
					if (oOtherTimePicker.getValueState() === "Error") {
						oOtherTimePicker.setValueState("None");
					}
				}
			}
		},

		onSelectToTime: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sOtherValue = this.getModel().getProperty(oEvent.getSource().getBindingContext() + "/timerangeFrom");
			var oOtherTimePicker = $(oEvent.getSource().getParent().getParent().getParent().$().find(".sapMTimePicker")[0]).control(0);

			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
			if (sValue && sOtherValue) {
				var oTimeInstance = DateFormat.getTimeInstance("hh:mm a");
				var oFromDate = oTimeInstance.parse(sOtherValue);
				var oToDate = oTimeInstance.parse(sValue);

				if (oFromDate > oToDate) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorFromTime"));
				} else {
					oEvent.getSource().setValueState("None");
					oEvent.getSource().setValueStateText(this.getResourceBundle().getText("validationErrorGenericInputMissing"));
					if (oOtherTimePicker.getValueState() === "Error") {
						oOtherTimePicker.setValueState("None");
					}
				}
			}
		},

		onSelectDateRange: function (oEvent) {
			var oControl = oEvent.getSource();
			if (oControl.getSecondDateValue() && oControl.getSecondDateValue() < Date.now()) {
				oEvent.getSource().setValueState("Warning");
			} else {
				oEvent.getSource().setValueState("None");
			}
		},

		onChangeWebAddress: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			// add http:// on the fly
			if (sValue && !/^https?:\/\//.test(sValue)) {
				sValue = "http://" + sValue;
				oEvent.getSource().setValue(sValue);
			}
		},

		/** Step 3 **/

		onChangeContactName: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
		},

		onChangeContactEmail: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			oEvent.getSource().setValueState(sValue ? "None" : "Warning");
		},

		/*** Form validation and submit ***/
		toggleSubmit: function (bToggle) {
			// fix: block submit for 3 more seconds to avoid unnecessary validation on accidential double-click
			if (bToggle) {
				setTimeout(function () {
					this.byId("wizard").$().find(".sapMBtn").control().pop().setEnabled(bToggle);
					this._bSubmitting = !bToggle;
				}.bind(this), 3000);
			} else {
				this.byId("wizard").$().find(".sapMBtn").control().pop().setEnabled(bToggle);
				this._bSubmitting = !bToggle;
			}
		},

		errorSubmit: function (bToggle) {
			var sCurrentStep = this.byId("wizard").getCurrentStep();
			var oButton = sap.ui.getCore().byId(sCurrentStep).$().find(".sapMBtn").control().pop();
			oButton.setType(bToggle ? "Critical" : "Emphasized");
			if (bToggle) {
				this.byId("validationInfo").openBy(oButton);
			}
		},

		showSuccess: function (sText, sTextLong) {
			// avoid displaying success messages
			if (!jQuery(".sapMMessageToast").length) {
				MessageToast.show(sText);
				this.byId("successStrip").setText(sTextLong);
				this.byId("successStrip").setVisible(true);
			}
			Log.info(sText);
			this.clearForm();
		},

		showError: function (sText) {
			// avoid displaying duplicate errors
			var oMessageBox = jQuery(".sapMMessageBox").control(0);
			if (!oMessageBox || oMessageBox.getContent().getText() !== sText) {
				MessageBox.error(sText);
			}
			Log.error(sText);
		},

		wizardCompleted: function () {
			var screenMode = this.getModel().getProperty("/screenMode");

			switch (screenMode) {
				case "Create":
					// check for form errors and block submit
					var bValidationError = this.validateStep1() || this.validateStep2() || this.validateStep3(); // || this.validateCaptcha();
					this.errorSubmit(bValidationError);
					if (bValidationError) {
						return;
					}
					this.toggleSubmit(false);
					this._rollbackStack = [];

					try {
						if (this.byId("associationToSchool").getSelected()) {
							/*** school assistance ***/
							// step 1: check for existing association
							var sSchoolId = this.getModel().getProperty("/schoolKey");

							// call helper service to check for existing offerings for this school
							$.get({
								url: SERVICE_URL + "Schools('" + sSchoolId + "')?$expand=schoolAssistance($expand=assistance)",
								success: function (oData) {
									if (oData.schoolAssistance.length) {
										var sLocationID = oData.schoolAssistance[0].assistance.assistanceLocation_ID;
										// only add assistance offerings
										Log.info("Location exists, using id '" + sLocationID + "' to create the new offering");
										this.createAssistanceOfferingEntries(sLocationID, sSchoolId);
									} else {
										// create entry in assistance location table first
										var oSchool = this.byId("school").getSelectedItem().getBindingContext("backend").getObject();
										var oNewLocation = {
											"locationType_ID": this.byId("locationType").getSelectedKey(),
											"name": oSchool.name,
											"address_ID": oSchool.address_ID
										};

										Log.info("Location does not exist yet, creating a new one");
										var oBinding = this.getModel("backend").bindList("/AssistanceLocations");
										oBinding.attachCreateCompleted(function (oEvent) {
											if (!oEvent.getParameter("success")) {
												this.showError("Could not create assistance location");
												this._rollbackChanges();
												this.toggleSubmit(true);
											} else {
												this._rollbackStack.push(oEvent.getParameter("context"));
												var sNewLocationID = oEvent.getParameter("context").getObject().ID;
												// step 2: write entries
												this.createAssistanceOfferingEntries(sNewLocationID, sSchoolId);
											}
										}.bind(this));
										oBinding.create(oNewLocation);
									}
								}.bind(this),
								error: function () {
									Log.warning("Could not find address for school id " + sSchoolId);
								}
							});

						} else {
							/*** other location ***/

							// step 1: check for existing assistanceLocations at this name and address
							var oAddressLookup = this.getModel().getProperty("/addressLookup");

							// call helper service to check for existing assistance locations
							$.get({
								url: SERVICE_URL + "AssistanceLocations?$expand=address&$filter=name%20eq%20%27" + encodeURI(formatter.formatOrgName(this.getModel().getProperty("/locationName"))) + "%27",
								success: function (oData) {
									// check if address matches the one entered in the form
									var sLocationId;
									var sAddressId;
									if (oData.value.length && oAddressLookup && oAddressLookup.geometry && oAddressLookup.geometry.location) {
										var iLat = oAddressLookup.geometry.location.lat();
										var iLng = oAddressLookup.geometry.location.lng();

										for (var i = 0; i < oData.value.length; i++) {
											// compare lat and lon from lookup to the service and return the first match
											if (oData.value[i].address && oData.value[i].address.lat === iLat && oData.value[i].address.long === iLng) {
												sLocationId = oData.value[i].ID;
												sAddressId = oData.value[i].address.ID;
												break;
											}
										}
									}

									if (!sLocationId) {
										// step 2: create address and location
										// extract information from google maps address info object
										function getAddressComponent(sType, bLong) {
											var aResults = oAddressLookup.address_components.filter(function (oItem) {
												return oItem.types.indexOf(sType) >= 0;
											});
											if (aResults.length) {
												return (bLong ? aResults[0].long_name : aResults[0].short_name);
											} else {
												return "";
											}
										}

										var oAddress = {
											street: getAddressComponent("locality", true) + "" + getAddressComponent("street_number", true),
											city: getAddressComponent("locality", true),
											zip: parseInt(getAddressComponent("postal_code", true)),
											lat: "" + oAddressLookup.geometry.location.lat(),
											long: "" + oAddressLookup.geometry.location.lng(),
											state_StateCode: this.getModel("state") || getAddressComponent("administrative_area_level_1", false)
										};

										Log.info("Address does not exist yet, creating a new one");
										var oAddressBinding = this.getModel("backend").bindList("/Addresses");
										oAddressBinding.attachCreateCompleted(function (oEvent) {
											if (!oEvent.getParameter("success")) {
												this.showError("Could not create assistance location");
												this._rollbackChanges();
												this.toggleSubmit(true);
											} else {
												this._rollbackStack.push(oEvent.getParameter("context"));
												sAddressId = oEvent.getParameter("context").getObject().ID;

												// step 2: create location
												var oLocation = {
													"locationType_ID": this.byId("locationType").getSelectedKey(),
													"name": this.getModel().getProperty("/locationName"), //"name": oAddressLookup.formatted_address,
													"address_ID": sAddressId
												};

												Log.info("Location does not exist yet, creating a new one");
												var oLocationBinding = this.getModel("backend").bindList("/AssistanceLocations");
												oLocationBinding.attachCreateCompleted(function (oLocationEvent) {
													if (!oLocationEvent.getParameter("success")) {
														this.showError("Could not create assistance location");
														this._rollbackChanges();
														this.toggleSubmit(true);
													} else {
														this._rollbackStack.push(oEvent.getParameter("context"));
														sLocationId = oEvent.getParameter("context").getObject().ID;
														// step 3: write entries
														var sDistrictId = this.getModel().getProperty("/districtKey");
														if (sDistrictId) {
															this.createAssistanceOfferingEntries(sLocationId, "", sDistrictId);
														} else if (this.getModel().getProperty("/organizationType") !== ORGANIZATION_TYPE_SCHOOL) {
															// Step 4: NonProfit or others was selected, create an Organization
															this.createOrganization(sLocationId, sAddressId);
														}
													}
												}.bind(this));
												oLocationBinding.create(oLocation);
											}
										}.bind(this));
										oAddressBinding.create(oAddress).created();
									} else {
										// step 3: create organization
										var sDistrictId = this.getModel().getProperty("/districtKey");
										if (sDistrictId) {
											this.createAssistanceOfferingEntries(sLocationId, "", sDistrictId);
										} else if (this.getModel().getProperty("/organizationType") !== ORGANIZATION_TYPE_SCHOOL) {
											// Step 4: NonProfit or others was selected, create an Organization
											this.createOrganization(sLocationId, sAddressId);
										}
									}
								}.bind(this),
								error: function () {
									this.toggleSubmit(true);
									Log.warning("Could not query existing locations at this address");
									this.showError("Could not query existing locations at this address");
								}.bind(this)

							});
						}
					} catch (oException) {
						this.showError(oException);
						this.toggleSubmit(true);
					}

					break;
				case "Modify":
					// check for form errors and block submit
					var bValidationError = this.validateStepModifyOffering();
					this.errorSubmit(bValidationError);
					if (bValidationError) {
						return;
					}

					this.toggleSubmit(false);

					var assistance_ID;
					var organizationTypeKey = this.byId("organizationType").getSelectedKey();
					var assistanceTypeName = this.byId("assistanceTypeModify").getSelectedItem().getText();
					var assistanceSubType_ID = this.byId("assistanceSubTypeModify").getSelectedKey();


					switch (organizationTypeKey) {
						case "NonProfit":
						case "Other":
							assistance_ID = this.getView().byId("orgOfferings").getSelectedKey();
							break;
						case "SchoolDistrict":
							assistance_ID = this.getView().byId("schoolOfferings").getSelectedKey();
							break;
					}

					var timeFrom = this.byId("timerangeFromModify_0").getValue();
					var timeTo = this.byId("timerangeToModify_0").getValue();

					//Convert to 24 hours time
					switch (timeFrom.includes("PM")) {
						case false:
							timeFrom = timeFrom.slice(0, 5) + ":00";
							break;
						case true:
							timeFrom = timeFrom.slice(0, 5) + ":00";
							var hours = Number(timeFrom.slice(0, 2)) + 12;
							timeFrom = hours + timeFrom.slice(2, 8);
							break;
					}
					switch (timeTo.includes("PM")) {
						case false:
							timeTo = timeTo.slice(0, 5) + ":00";
							break;
						case true:
							timeTo = timeTo.slice(0, 5) + ":00";
							var hours = Number(timeTo.slice(0, 2)) + 12;
							timeTo = hours + timeTo.slice(2, 8);
							break;
					}
					var startDate = this.byId("daterangeModify_0").getDateValue();
					var endDate = this.byId("daterangeModify_0").getSecondDateValue();
					if (startDate === null) {
						//console.log("startDate is null");
					} else {
						var startDateMonth = String(startDate.getMonth() + 1);
						if (startDateMonth.length === 1) { startDateMonth = "0" + startDateMonth }
						var startDateDay = String(startDate.getDate());
						if (startDateDay.length === 1) { startDateDay = "0" + startDateDay }
						startDate = startDate.getFullYear() + "-" + startDateMonth + "-" + startDateDay;
					}
					if (endDate === null) {
						//console.log("startDate is null");
					} else {
						var endDateMonth = String(endDate.getMonth() + 1);
						if (endDateMonth.length === 1) { endDateMonth = "0" + endDateMonth; }
						var endDateDay = String(endDate.getDate());
						if (endDateDay.length === 1) { endDateDay = "0" + endDateDay; }
						endDate = endDate.getFullYear() + "-" + endDateMonth + "-" + endDateDay;
					}

					var updateSuccess = "Offering modified successfully!";
					var updateError = "Error updating offering.";
					//var messageStrip = this.byId("modifyMessageStrip");
					//messageStrip.setVisible(true);

					var oBinding = this.getModel("backend").bindContext("/AssistanceOfferings(" + assistance_ID + ")");
					oBinding.attachPatchCompleted(function (oEvent) {
						if (!oEvent.getParameter("success")) {
							//messageStrip.setType("Error");
							//messageStrip.setText(updateError);
						} else {
							//messageStrip.setType("Success");
							//messageStrip.setText(updateSuccess);

							// thats it
							//var sName = this.getModel().getProperty("/locationName");
							var sMessage = this.getResourceBundle().getText("successMessageModify");
							var sMessageLong = this.getResourceBundle().getText("successMessageLongModify");
							this.showSuccess(sMessage, sMessageLong);
							this.toggleSubmit(true);
						}
					}.bind(this));


					if ((assistanceTypeName === "Food") && (assistanceSubType_ID)) {
						oBinding.getBoundContext().setProperty("assistanceSubType_ID", this.byId("assistanceSubTypeModify").getSelectedKey(), "offerings");
					}
					oBinding.getBoundContext().setProperty("timeFrom", timeFrom, "offerings");
					oBinding.getBoundContext().setProperty("timeTo", timeTo, "offerings");
					oBinding.getBoundContext().setProperty("availableMon", this.byId("availableMon_0").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("availableTue", this.byId("availableTue_0").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("availableWed", this.byId("availableWed_0").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("availableThr", this.byId("availableThu_0").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("availableFri", this.byId("availableFri_0").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("availableSat", this.byId("availableSat_0").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("availableSun", this.byId("availableSun_0").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("startDate", startDate, "offerings");
					oBinding.getBoundContext().setProperty("endDate", endDate, "offerings");
					oBinding.getBoundContext().setProperty("pickupInd", this.byId("pickupModify").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("deliveryInd", this.byId("deliveryModify").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("virtualInd", this.byId("virtualModify").getSelected(), "offerings");
					oBinding.getBoundContext().setProperty("contactName", this.byId("contactNameModify").getValue(), "offerings");
					oBinding.getBoundContext().setProperty("contactEmail", this.byId("contactEmailModify").getValue(), "offerings");
					oBinding.getBoundContext().setProperty("contactPhone", this.byId("contactPhoneModify").getValue(), "offerings");
					oBinding.getBoundContext().setProperty("contactTitle", this.byId("contactTitleModify").getValue(), "offerings");
					oBinding.getBoundContext().setProperty("websiteURL", this.byId("webAddressModify").getValue(), "offerings");
					oBinding.getBoundContext().setProperty("offerDetails", this.byId("offerDetailsModify").getValue(), "offerings");
					oBinding.getBoundContext().setProperty("eligiblityCategory_ID", this.byId("serviceEntitlementModify").getSelectedKey(), "offerings");
					oBinding.getBoundContext().setProperty("assistanceType_ID", this.byId("assistanceTypeModify").getSelectedKey(), "offerings");
					oBinding.getModel().submitBatch("offerings");
			}
		},

		// helper method to create an organization
		createOrganization: function (sLocationID, sAddressId) {
			// check for existing organization
			// call helper service to check for existing offerings for this school
			$.get({
				url: SERVICE_URL + "Organizations?$filter=name%20eq%20%27" +
					encodeURI(formatter.formatOrgName(this.getModel().getProperty("/locationName")))
					+ "%27%20and%20address_ID%20eq%20" + sAddressId,
				success: function (oData) {
					if (oData.value.length) {
						var sOrganizationId = oData.value[0].ID;
						// only add assistance offerings
						Log.info("Organization exists, using id '" + sOrganizationId + "' to create the new offering");
						// step 5: write entries
						this.createAssistanceOfferingEntries(sLocationID, "", "", sOrganizationId);
					} else {
						// create entry in organization table first
						var oNewOrganization = {
							"name": this.getModel().getProperty("/locationName"),
							"organizationType_code": this.getModel().getProperty("/organizationTypeKey"), //"name": oAddressLookup.formatted_address,
							"address_ID": sAddressId
						};

						Log.info("Organization does not exist yet, creating a new one");

						var oBinding = this.getModel("backend").bindList("/Organizations");
						oBinding.attachCreateCompleted(function (oEvent) {
							if (!oEvent.getParameter("success")) {
								this.showError("Could not create organization");
								this._rollbackChanges();
								this.toggleSubmit(true);
							} else {
								this._rollbackStack.push(oEvent.getParameter("context"));
								var sNewOrganizationId = oEvent.getParameter("context").getObject().ID;
								// step 5: write entries
								this.createAssistanceOfferingEntries(sLocationID, "", "", sNewOrganizationId);
							}
						}.bind(this));
						oBinding.create(oNewOrganization);
					}
				}.bind(this),
				error: function () {
					Log.warning("Could not lookup organizations");
				}
			});
		},

		// helper method to create assistance contexts
		createAssistanceOfferingEntries: function (sLocationID, sSchoolId, sDistrictId, sOrganizationId) {
			var oModel = this.getModel();
			var oNewOfferingTemplate = {
				contactName: oModel.getProperty("/name"),
				contactEmail: oModel.getProperty("/email"),
				contactPhone: oModel.getProperty("/phone"),
				contactTitle: oModel.getProperty("/title"),
				websiteURL: oModel.getProperty("/webAddress"),
				offerDetails: oModel.getProperty("/additionalInformation"),
				pickupInd: oModel.getProperty("/pickup"),
				deliveryInd: oModel.getProperty("/delivery"),
				virtualInd: oModel.getProperty("/virtual"),
				eligiblityCategory_ID: this.byId("serviceEntitlement").getSelectedItem().getBindingContext("backend").getProperty("ID"),
				assistanceLocation_ID: sLocationID,
				assistanceType_ID: this.byId("assistanceType").getSelectedItem().getBindingContext("backend").getProperty("ID"),
			};

			var oModel = this.getModel();
			var aSelectedTypes = oModel.getProperty("/selectedTypes");

			aSelectedTypes.forEach(function (oType) {
				// clone template
				var oNewOffering = Object.assign({}, oNewOfferingTemplate);

				// enrich with additional data
				function getTimeString(sRaw) {
					function pad(n) {
						return n < 10 ? "0" + n : n;
					}

					var oTimeInstance = DateFormat.getTimeInstance("hh:mm a");
					if (sRaw) {
						var oDate = oTimeInstance.parse(sRaw);
						return pad(oDate.getHours()) + ":" +
							pad(oDate.getMinutes()) + ":" +
							pad(oDate.getSeconds());
					}
					return sRaw;
				}

				function getDateString(oRaw) {
					if (oRaw) {
						return oRaw.toISOString().substr(0, 10);
					}
					return undefined;
				}

				var oOfferingSchedule = {
					assistanceSubType_ID: oType.ID,
					timeFrom: getTimeString(oType.timerangeFrom),
					timeTo: getTimeString(oType.timerangeTo),
					availableMon: oType.monday,
					availableTue: oType.tuesday,
					availableWed: oType.wednesday,
					availableThr: oType.thursday,
					availableFri: oType.friday,
					availableSat: oType.saturday,
					availableSun: oType.sunday,
					startDate: getDateString(oType.dateFrom),
					endDate: getDateString(oType.dateTo)
				};

				var oNewOffering = Object.assign(oNewOffering, oOfferingSchedule);

				Log.info("Creating a new assistance offering for subtype '" + oType.ID + "'");
				var oBinding = this.getModel("backend").bindList("/AssistanceOfferings");
				oBinding.attachCreateCompleted(function (oEvent) {
					if (!oEvent.getParameter("success")) {
						this.showError("Could not create assistance offering entry");
						this._rollbackChanges();
						this.toggleSubmit(true);
					} else {
						this._rollbackStack.push(oEvent.getParameter("context"));
						// do not create subsequent entries if another create failed
						if (this._rollbackInProgress) {
							return;
						}
						var sAssistanceID = oEvent.getParameter("context").getObject().ID;
						if (sSchoolId) {
							this.createSchoolOfferingAssistanceEntry(sAssistanceID, sSchoolId);
						} else if (sDistrictId) {
							this.createDistrictOfferingAssistanceEntry(sAssistanceID, sDistrictId);
						} else if (sOrganizationId) {
							this.createOrganizationOfferingAssistanceEntry(sAssistanceID, sOrganizationId);
						} else {
							this.showError("Could not create assistance offering - organization type missing");
							this.toggleSubmit(true);
						}
					}
				}.bind(this));
				oBinding.create(oNewOffering);

				// save new context
			}.bind(this));
		},

		// helper method to create school offering contexts
		createSchoolOfferingAssistanceEntry: function (sAssistanceId, sSchoolId) {
			Log.info("Creating a new school offering assistance entry for assistance id '" + sAssistanceId + "' and school id '" + sSchoolId + "'");

			var oNewEntry = {
				assistance_ID: sAssistanceId,
				school_ID: sSchoolId
			};

			var oBinding = this.getModel("backend").bindList("/SchoolOfferingAssistance");
			oBinding.attachCreateCompleted(function (oEvent) {
				if (!oEvent.getParameter("success")) {
					this.showError("Could not create school offering assistance entry");
					this._rollbackChanges();
					this.toggleSubmit(true);
				} else {
					this._rollbackStack.push(oEvent.getParameter("context"));
					// thats it
					var sName = (this.getModel().getProperty("/school") ? this.getModel().getProperty("/school") : this.getModel().getProperty("/locationName"));
					var sMessage = this.getResourceBundle().getText("successMessage", [sName]);
					var sMessageLong = this.getResourceBundle().getText("successMessageLong", [sName]);
					this.showSuccess(sMessage, sMessageLong);
					this.toggleSubmit(true);
				}
			}.bind(this));
			oBinding.create(oNewEntry);
		},

		// helper method to create district offering contexts
		createDistrictOfferingAssistanceEntry: function (sAssistanceId, sDistrictId) {
			Log.info("Creating a new district offering assistance entry for assistance id '" + sAssistanceId + "' and district id '" + sDistrictId + "'");

			var oNewEntry = {
				assistance_ID: sAssistanceId,
				district_leaid: "" + parseInt(sDistrictId)
			};

			var oBinding = this.getModel("backend").bindList("/DistrictOfferingAsistance");
			oBinding.attachCreateCompleted(function (oEvent) {
				if (!oEvent.getParameter("success")) {
					this.showError("Could not create district offering assistance entry");
					this._rollbackChanges();
					this.toggleSubmit(true);
				} else {
					this._rollbackStack.push(oEvent.getParameter("context"));
					// thats it
					var sName = this.getModel().getProperty("/locationName");
					var sMessage = this.getResourceBundle().getText("successMessage", [sName]);
					var sMessageLong = this.getResourceBundle().getText("successMessageLong", [sName]);
					this.showSuccess(sMessage, sMessageLong);
					this.toggleSubmit(true);
				}
			}.bind(this));
			oBinding.create(oNewEntry);
		},

		// helper method to create district offering contexts
		createOrganizationOfferingAssistanceEntry: function (sAssistanceId, sOrganizationId) {
			Log.info("Creating a new ogranization offering assistance entry for assistance id '" + sAssistanceId + "' and organization id '" + sOrganizationId + "'");

			var oNewEntry = {
				assistance_ID: sAssistanceId,
				organization_ID: sOrganizationId
			};

			var oBinding = this.getModel("backend").bindList("/OrganizationOfferingAssistance");
			oBinding.attachCreateCompleted(function (oEvent) {
				if (!oEvent.getParameter("success")) {
					this.showError("Could not create organization offering assistance entry");
					this._rollbackChanges();
					this.toggleSubmit(true);
				} else {
					this._rollbackStack.push(oEvent.getParameter("context"));
					// thats it
					var sName = this.getModel().getProperty("/locationName");
					var sMessage = this.getResourceBundle().getText("successMessage", [sName]);
					var sMessageLong = this.getResourceBundle().getText("successMessageLong", [sName]);
					this.showSuccess(sMessage, sMessageLong);
					this.toggleSubmit(true);
				}
			}.bind(this));
			oBinding.create(oNewEntry);
		},

		validateStep1: function (oEvent) {
			var bValidationError = false;
			var bSchoolDistrict = this.byId("organizationType").getSelectedKey() === ORGANIZATION_TYPE_SCHOOL;

			if (!this.byId("organizationType").getSelectedKey()) {
				if (this.byId("organizationType").getValueState() === "None") {
					this.byId("organizationType").setValueState("Warning");
				}
				bValidationError = true;
			}

			if (bSchoolDistrict) {
				if (!this.byId("state").getSelectedKey()) {
					if (this.byId("state").getValueState() === "None") {
						this.byId("state").setValueState("Warning");
					}
					bValidationError = true;
				}
				if (!this.byId("district").getSelectedKey()) {
					if (this.byId("district").getValueState() === "None") {
						this.byId("district").setValueState("Warning");
					}
					bValidationError = true;
				}
			}
			if (this.byId("associationToSchool").getSelected()) {
				if (!this.byId("school").getSelectedKey()) {
					if (this.byId("school").getValueState() === "None") {
						this.byId("school").setValueState("Warning");
					}
					bValidationError = true;
				}
			} else {
				var oAddressLookup = this.getModel().getProperty("/addressLookup");
				if (!this.byId("address").getValue() || !oAddressLookup) {
					this.byId("address").setValueState("Warning");
					bValidationError = true;
				}
				if (!this.byId("locationName").getValue()) {
					this.byId("locationName").setValueState("Warning");
					bValidationError = true;
				}
			}
			// stay on this step and display errors
			if (oEvent && bValidationError) {
				setTimeout(function () {
					this.byId("wizard").previousStep();
					jQuery(this.byId("wizard").getDomRef("step-container")).stop();
					setTimeout(function () {
						this.errorSubmit(bValidationError);
					}.bind(this), 300);
				}.bind(this), 0);
			}
			return bValidationError;
		},

		validateStep2: function (oEvent) {
			var bValidationError = false;

			// validate step 1 and 2 first when step 3 button is pressed
			if (oEvent && oEvent.getParameter("id").indexOf("Step3") >= 0) {
				bValidationError = this.validateStep1() || this.validateStep2();
			}

			if (this.byId("contactEmail").getValueState() !== "None") {
				bValidationError = true;
			}

			// stay on this step and display errors
			if (oEvent && bValidationError) {
				setTimeout(function () {
					this.errorSubmit(bValidationError);
					this.byId("wizard").previousStep();
					jQuery(this.byId("wizard").getDomRef("step-container")).stop();
					setTimeout(function () {
						this.errorSubmit(bValidationError);
					}.bind(this), 300);
				}.bind(this), 0);
			}

			/*
			// repair captcha if needed
			if ($("#recaptcha") && !$("#recaptcha").html()) {
				this._prepareCaptcha();
			}
			*/

			return bValidationError;
		},

		validateStep3: function (oEvent) {
			var bValidationError = false;
			var bFoodType = this.byId("assistanceType").getSelectedKey() === ASSISTANCE_TYPE_FOOD;

			// validate step 1 first when step 2 button is pressed
			if (oEvent && oEvent.getParameter("id").indexOf("Step2") >= 0) {
				bValidationError = this.validateStep1();
			}

			if (bFoodType && !this.byId("assistanceSubType").getSelectedItems().length) {
				this.byId("assistanceSubType").setValueState("Warning");
				bValidationError = true;
			}

			// at least 1 day has to be selected
			var i, j;
			var aCheckboxContainers = this.byId("scheduleForm").$().find(".sapMVBox");
			for (i = 0; i < aCheckboxContainers.length; i++) {
				var aCheckBoxes = $(aCheckboxContainers[i]).find(".sapMCb ");
				var bAny = false;
				for (j = 0; j < aCheckBoxes.length; j++) {
					if ($(aCheckBoxes[j]).control(0).getSelected()) {
						bAny = true;
					}
				}
				if (!bAny) {
					bValidationError = true;
					for (j = 0; j < aCheckBoxes.length; j++) {
						$(aCheckBoxes[j]).control(0).setValueState("Warning");
					}
				}
			}

			// time range for subtypes has to be selected
			var aTimePickers = this.byId("scheduleForm").$().find(".sapMTimePicker");
			var oControl;
			for (i = 0; i < aTimePickers.length; i++) {
				oControl = $(aTimePickers[i]).control(0);
				if (!oControl.getValue()) {
					oControl.setValueState("Warning");
					bValidationError = true;
				}
			}

			// if a date is chosen, the end date should be after the current date
			var aDateRanges = $(".sapMInputBase[id*=daterange]");
			for (i = 0; i < aDateRanges.length; i++) {
				oControl = $(aDateRanges[i]).control(0);
				if (oControl.getSecondDateValue() && oControl.getSecondDateValue() < Date.now()) {
					oControl.setValueState("Warning");
					bValidationError = true;
				}
			}

			// check web address (is validated by type anyway)
			if (this.byId("webAddress").getValueState() !== "None") {
				bValidationError = true;
			}

			// stay on this step and display errors
			if (oEvent && bValidationError) {
				setTimeout(function () {
					this.errorSubmit(bValidationError);
					setTimeout(function () {
						this.errorSubmit(bValidationError);
					}.bind(this), 300);
				}.bind(this), 0);
			}

			var screenMode = "Create";
			this.getModel().setProperty("/screenMode", screenMode);

			return bValidationError;
		},

		validateStepModifyOffering: function (oEvent) {
			var bValidationError = false;

			// validate step 1 and 2 first when step 3 button is pressed
			/*if (oEvent && oEvent.getParameter("id").indexOf("StepModifyOffering") >= 0) {
				bValidationError = this.validateStep1();
			}
	
			if (this.byId("contactEmailModify").getValueState() !== "None") {
				bValidationError = true;
			}*/

			//StepModifyOffering


			/*
			// repair captcha if needed
			if ($("#recaptcha") && !$("#recaptcha").html()) {
				this._prepareCaptcha();
			}
			*/

			//var bFoodType = this.byId("assistanceTypeModify").getSelectedKey() === ASSISTANCE_TYPE_FOOD;

			/* if (bFoodType && !this.byId("assistanceSubTypeModify").getSelectedItems().length) {
				this.byId("assistanceSubTypeModify").setValueState("Warning");
				bValidationError = true;
			} */

			// at least 1 day has to be selected
			var availableMon = this.byId("availableMon_0").getSelected();
			var availableTue = this.byId("availableTue_0").getSelected();
			var availableWed = this.byId("availableWed_0").getSelected();
			var availableThr = this.byId("availableThu_0").getSelected();
			var availableFri = this.byId("availableFri_0").getSelected();
			var availableSat = this.byId("availableSat_0").getSelected();
			var availableSun = this.byId("availableSun_0").getSelected();

			if (availableMon === false && availableTue === false && availableWed === false && availableThr === false && availableFri === false && availableSat === false && availableSun === false) {
				this.byId("modifyDaysMessageStrip").setVisible(true);
				bValidationError = true;
			}
			else {
				this.byId("modifyDaysMessageStrip").setVisible(false);
			}

			/* 	var i, j;
				var aCheckboxContainers = this.byId("scheduleFormModify").$().find(".sapMVBox");
				for (i = 0; i < aCheckboxContainers.length; i++) {
					var aCheckBoxes = $(aCheckboxContainers[i]).find(".sapMCb ");
					var bAny = false;
					for (j = 0; j < aCheckBoxes.length; j++) {
						if ($(aCheckBoxes[j]).control(0).getSelected()) {
							bAny = true;
						}
					}
					if (!bAny) {
						bValidationError = true;
						for (j = 0; j < aCheckBoxes.length; j++) {
							$(aCheckBoxes[j]).control(0).setValueState("Warning");
						}
					}
				} */

			// time range for subtypes has to be selected
			var timeFrom = this.byId("timerangeFromModify_0").getValue();
			var timeTo = this.byId("timerangeToModify_0").getValue();
			if (timeFrom.length > 0 && timeTo.length > 0) {
			} else {
				this.byId("modifyTimeMessageStrip").setVisible(true);
				bValidationError = true;
			}

			/* var aTimePickers = this.byId("scheduleFormModify").$().find(".sapMTimePicker");
			var oControl;
			for (i = 0; i < aTimePickers.length; i++) {
				oControl = $(aTimePickers[i]).control(0);
				if (!oControl.getValue()) {
					oControl.setValueState("Warning");
					bValidationError = true;
				}
			} */

			// if a date is chosen, the end date should be after the current date
			var secondDateValue = this.byId("daterangeModify_0").getSecondDateValue();
			if ((secondDateValue) && (secondDateValue < Date.now())) {
				this.byId("daterangeModify_0").setValueState("Warning");
				bValidationError = true;
			}

			// check web address (is validated by type anyway)
			if (this.byId("webAddressModify").getValueState() !== "None") {
				bValidationError = true;
			}

			// stay on this step and display errors
			/*if (oEvent && bValidationError) {
				setTimeout(function () {
					this.errorSubmit(bValidationError);
					setTimeout(function () {
						this.errorSubmit(bValidationError);
					}.bind(this), 300);
				}.bind(this), 0);
			}*/
			var screenMode = "Modify";
			this.getModel().setProperty("/screenMode", screenMode);
			return bValidationError;
		},

		/*
		validateCaptcha: function () {
			var bValidationError = false;
			if (!window.grecaptcha) {
				bValidationError = true;
			}
		
			var captchaToken = window.grecaptcha.getResponse();
			if (!captchaToken) {
				bValidationError = true;
			}
		
			this.toggleCaptchaValidationMessage(bValidationError);
		
			return bValidationError;
		},
		
		// toggle warning state
		toggleCaptchaValidationMessage: function (bValidationError) {
			$(document.getElementById("recaptcha")).toggleClass("validationError", bValidationError);
			this.byId("captchaValidationErrorMessage").setVisible(bValidationError);
		},
		*/

		// reset form after successful submit
		clearForm: function () {
			if (this._bSubmitting) {
				// Discard progress to roll back steps on screen
				this.byId("wizard").discardProgress(this.byId("wizard").getSteps()[0]);

				// create new client model
				this.setModel(models.createFrontendModel());
				this.byId("assistanceType").setSelectedKey(ASSISTANCE_TYPE_FOOD);
				this.byId("assistanceSubTypeElement").setVisible(true);
				this.byId("assistanceSubType").setSelectedItems([]);
				this.byId("organizationType").setSelectedKey(ORGANIZATION_TYPE_SCHOOL);
				this.byId("state").setSelectedKey("");
				this.byId("district").setSelectedKey("");
				this.byId("schoolForm").setVisible(true);
				this.byId("associationToSchool").setSelected(true);
				this.byId("school").setSelectedKey("");
				this.byId("district").setEnabled(false);
				this.byId("school").setEnabled(false);
				this.byId("scheduleForm").setVisible(false);
				this.byId("entriesExistStrip").setVisible(false);
				this.byId("locationExistStrip").setVisible(false);

				// filter binding
				this.byId("assistanceSubType").getBinding("items").filter([new Filter("assistanceType_ID", FilterOperator.EQ, ASSISTANCE_TYPE_FOOD)]);

				this.onAssociatedToSchool(true);
				// scroll to top
				this.byId("wizard").$("step-container").animate({ scrollTop: 0 }, "slow");
				// focus state field
				setTimeout(function () {
					this.byId("state").focus();
				}.bind(this), 0);
				// leave submit mode
				this._bSubmitting = false;
			}
		},

		/*** reCAPTCHA integration ***/
		/*
		_prepareCaptcha: function () {
			//these functions need to be exposed globally, otherwise captcha is not able to access them
			window.validateMandatoryFields = function () {
				this.toggleCaptchaValidationMessage(false);
			}.bind(this);
			window.captchaExpired = this.captchaExpired.bind(this);
		
			var captchaScript = document.createElement("script");
			captchaScript.setAttribute(
				"src",
				"https://www.google.com/recaptcha/api.js"
			);
			document.head.appendChild(captchaScript);
		},
		
		captchaExpired: function () {
			if (window.grecaptcha) {
				window.grecaptcha.reset();
			}
		},
		
		captchaChecked: function () {
			return window.grecaptcha.getResponse().length > 0;
		},
		*/

		_rollbackChanges: function () {
			if (this._rollbackInProgress) {
				return;
			}
			// run backwards through all created bindings during this submit
			// and manually call delete operation on the context
			this._rollbackInProgress = true;
			var aPromises = [];
			var aPaths = [];
			for (var i = this._rollbackStack.length - 1; i >= 0; i--) {
				var oPromise = this._rollbackStack[i].delete("$auto");
				oPromise.then(function () {
					aPaths.push(this.getPath());
				}.bind(this._rollbackStack[i]), function () {
					// show error messages directly
					MessageToast.show(this.getResourceBundle().getText("rollbackErrorMessage", this.getPath()));
					Log.error(this.getResourceBundle().getText("rollbackErrorMessage", this.getPath()));
					this._rollbackInProgress = false;
				}.bind(this._rollbackStack[i]));
				aPromises.push(oPromise);
			}

			// show success message once when all entries have been rolled back
			Promise.all(aPromises).then(function () {
				MessageToast.show(this.getResourceBundle().getText("rollbackSuccessMessage", aPaths.join(", ")));
				Log.info(this.getResourceBundle().getText("rollbackSuccessMessage", aPaths.join(", ")));
				this._rollbackInProgress = false;
			}.bind(this));
		}

	});
});
