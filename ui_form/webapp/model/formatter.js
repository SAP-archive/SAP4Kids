sap.ui.define([
	"sap/ui/core/IconPool"
], function (IconPool) {
	"use strict";

	var formatter = {
		marker: function (oProvider) {
			const controller = this;
			const listItems = oProvider.services.map(function (oService) {
				const unicodeIcon = IconPool.getIconInfo(controller.iconFormatter(oService.type)).content;
				return "<li>" +
					" <span data-sap-ui-icon-content='" + unicodeIcon + "' class='sapUiIcon' style='font-family: SAP-icons; padding-right:10px'></span>"
					+ oService.type + "</li>";
			});
			return "<div id='content'>" +
				"<h3 id='firstHeading' class='firstHeading'>" + oProvider.name + "</h3>" +
				"<div id='bodyContent'>" +
				"<p>This provider offers:</p> <ul style='padding-left: SAP-icons'>" +
				listItems.join("") +
				"</ul><p> <a href='" + oProvider.link + "'>More info</a> " +
				"</div>" +
				"</div>";
		},

		titleCase: function (sString) {
			if (!sString) {
				return sString;
			}
			var aWords = sString.toLowerCase().split(" ");
			aWords = aWords.map(function (sWord) {
				return sWord.charAt(0).toUpperCase() + sWord.slice(1);
			});
			return aWords.join(" ");
		},

		assistanceIcon: function (sString) {
			sString = sString.toLowerCase();
			switch (sString) {
				case "food": return "nutrition-activity"; break;
				case "licensed childcare": return "family-care"; break;
				case "healthcare": return "stethoscope"; break;
				case "housing assistance": return "home"; break;
				case "workforce assistance": return "collaborate"; break;
				case "financial assistance": return "loan"; break;
				default: return "error";
			};
		},

		subTypeSorter: function (a, b) {
			a = (a) ? a : "OTHER";
			b = (b) ? b : "OTHER";
			const oOrder = {
				"BREAKFAST": 0,
				"MORNING SNACK": 1,
				"LUNCH": 2,
				"AFTERNOON SNACK": 3,
				"DINNER": 4,
				"OTHER": 5
			};
			return oOrder[a.toUpperCase()] - oOrder[b.toUpperCase()];
		},

		assistanceType_ID_toText: function (assistanceType_ID) {
			switch (assistanceType_ID) {
				case "11605ca6-3326-4b3f-9722-89ea1bf770a7": return "Food"; break;
				case "4e4e2690-560f-4ce9-98e4-eea1dfdf11cf": return "Healthcare"; break;
				case "d19a7059-d22d-478b-8bf6-ecfc728e8ede": return "Licensed Childcare"; break;
				case "df18e591-f087-4366-81e7-01beec8142a3": return "Housing Assistance"; break;
				case "e488ef60-bc20-452b-b8aa-bdd8c2934edb": return "Financial Assistance"; break;
				case "ffc27506-c57a-4073-bf8a-1d2c0a0584c5": return "Workforce Assistance"; break;
			};
		},
		assistanceSubType_ID_toText: function (assistanceSubType_ID) {
			switch (assistanceSubType_ID) {
				case "03487ac3-e0db-43af-852b-2ebf198e3a0f": return "Breakfast"; break;
				case "33db847a-8ab3-4542-99ad-bc628a41c9f0": return "Morning Snack"; break;
				case "9847b50a-31bd-4830-b961-9b6404007482": return "Lunch"; break;
				case "81A5ACE3-A30F-2D00-F000-000275DC3B00": return "Afternoon Snack"; break;
				case "06c9b85c-6ffc-4417-bbfe-7168410e0114": return "Dinner"; break;
			};
		},
		offeringName: function (assistanceTypeID, assistanceSubTypeID, offerDetails) {
			var formatter = this.getView().getController().formatter;
			var offeringName = formatter.assistanceType_ID_toText(assistanceTypeID);
			offeringName += assistanceSubTypeID ? " - " + formatter.assistanceSubType_ID_toText(assistanceSubTypeID) : "";
			offeringName += offerDetails ? " (" + offerDetails + ")" : "";
			return offeringName;
		},

		// BugFix:
		// Replace special characters (single quotes) for query of service
		formatOrgName: function (orgName) {
			return orgName.replace(/'/g, "''");
		}

	};

	return formatter;
});
