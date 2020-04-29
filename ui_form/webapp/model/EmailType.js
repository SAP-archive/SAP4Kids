sap.ui.define([
	"sap/ui/model/SimpleType",
	"sap/ui/model/ValidateException"
], function (SimpleType, ValidateException) {
	"use strict";

	/**
	 * Custom model type for validating an E-Mail address
	 * @class
	 * @extends sap.ui.model.SimpleType
	 */
	return SimpleType.extend("sap4youth.model.EmailType", {
		formatValue: function (oValue) {
			return oValue;
		},
		parseValue: function (oValue) {
			//parsing step takes place before validating step, value could be altered here
			return oValue;
		},
		validateValue: function (oValue) {
			// The following Regex is NOT a completely correct one and only used for demonstration purposes.
			// RFC 5322 cannot even checked by a Regex and the Regex for RFC 822 is very long and complex.
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
			if (oValue && !oValue.match(rexMail)) {
				throw new ValidateException("'" + oValue + "' is not a valid email address");
			}
		}
	});
});
