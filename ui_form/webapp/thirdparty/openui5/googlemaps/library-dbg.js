/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library ui5lab.square.
 */
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/library',
	'openui5/googlemaps/loadScripts'
], function(jQuery, library) {
	"use strict";

	var sPath = sap.ui.require.toUrl("openui5/googlemaps/loadScripts");
	sap.ui.loader.config({paths:{"google.maps": sPath}});

	/**
	 * A library containing googlemaps controls
	 *
	 * @namespace
	 * @name openui5.googlemaps
	 * @public
	 */

	// library dependencies

	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name : "openui5.googlemaps",
		dependencies : ["sap.ui.core"],
		types: [
			"openui5.googlemaps.MapTypeId",
			"openui5.googlemaps.Animation",
			"openui5.googlemaps.TravelMode",
			"openui5.googlemaps.UnitSystem"
		],
		interfaces: [],
		controls: [
			"openui5.googlemaps.loadScripts",
			"openui5.googlemaps.Map",
			"openui5.googlemaps.Marker",
			"openui5.googlemaps.Polyline",
			"openui5.googlemaps.Polygon",
			"openui5.googlemaps.Directions",
			"openui5.googlemaps.Waypoint",
			"openui5.googlemaps.MarkerCluster"
		],
		elements: [
			"openui5.googlemaps.MapsApi"
		],
		version: "0.0.29"
	});

	openui5.googlemaps.MapTypeId = {
		ROADMAP: "roadmap",
		SATELLITE: "satellite",
		HYBRID: "hybrid",
		TERRAIN: "terrain"
	};

	openui5.googlemaps.Animation = {
		BOUNCE: 1,
		DROP: 2,
		k: 3,
		j: 4
	};

	openui5.googlemaps.TravelMode = {
		driving: "DRIVING",
		walking: "WALKING",
		bicycling: "BICYCLING",
		transit: "TRANSIT"
	};

	// These need to match Google"s constants
	openui5.googlemaps.UnitSystem = {
		IMPERIAL: 1,
		METRIC: 0
	};

	return openui5.googlemaps;

});