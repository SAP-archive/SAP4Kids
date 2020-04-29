sap.ui.define([
	"sap/ui/model/SimpleType",
	"sap/ui/model/ValidateException"
], function (SimpleType, ValidateException) {
	"use strict";

	/**
	 * Custom model type for validating a URL address
	 * @class
	 * @extends sap.ui.model.SimpleType
	 */
	return SimpleType.extend("sap4youth.model.URLType", {
		formatValue: function (oValue) {
			return oValue;
		},
		parseValue: function (oValue) {
			//parsing step takes place before validating step, value could be altered here
			return oValue;
		},
		validateValue: function (oValue) {
			// add http:// on the fly
			if (oValue && !/^https?:\/\//.test(oValue)) {
				oValue = "http://" + oValue;
			}
			// The following Regex is NOT a completely correct one and only used for demonstration purposes.
			// Source: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
			var rexURL= /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
			if (oValue && !oValue.match(rexURL)) {
				throw new ValidateException("'" + oValue + "' is not a valid URL");
			}
		}
	});
});
