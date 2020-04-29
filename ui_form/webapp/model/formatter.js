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
			aWords = aWords.map(function(sWord) {
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
		}

	};

	return formatter;
});
