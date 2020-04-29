sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/core/library",    // avoid preload of sap.ui.core
	"sap/ui/layout/library",  // avoid preload of sap.m
	"sap/ui/unified/library", // avoid preload of sap.m
	"sap/m/library"           // avoid preload of sap.m
], function(Core) {

	// preload the library resources bundles async
	Promise.all([
		Core.getLibraryResourceBundle("sap.ui.core", true),
		Core.getLibraryResourceBundle("sap.ui.layout", true),
		Core.getLibraryResourceBundle("sap.ui.unified", true),
		Core.getLibraryResourceBundle("sap.m", true)
	]).then(function() {
		// boot the Core
		Core.boot();
	});

});