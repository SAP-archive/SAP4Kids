sap.ui.define([
  "../model/formatter",
  "sap/ui/Device",
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "openui5/googlemaps/MapUtils",
  "sap/ui/core/UIComponent"
], function (formatter, Device, Controller, MessageBox, MessageToast, MapUtils, UIComponent) {
  "use strict";

  return Controller.extend("com.sap4kids.resourcelocator.controller.MapView", {

    formatter: formatter,

    onInit: function () {
      $("#splashScreen").remove();
      UIComponent.getRouterFor(this).getRoute("mapview").attachPatternMatched(this._updateUI, this);
    },

    onAfterRendering: function () {
      var oMap = this.byId("map");

      var oController = this;
      oMap.attachEventOnce("ready", function () {
        this.map.addListener('drag', oController.mapMoved.bind(this.map)(oController));
        this.map.addListener('dragend', oController.mapMoved.bind(this.map)(oController));
      });
    },

    mapMoved: function (oController) {
      const oStateModel = oController.getView().getModel("state");
      // a function with this = map and controller in a closure
      return function () {
        // only update after an idle time of 2s to avoid uneccesary reloads
        clearTimeout(oController._moveTimeout);
        oController._moveTimeout = setTimeout(function () {
          oStateModel.setProperty("/mapMoved", true);
          oStateModel.setProperty("/mapCenter", this.getCenter());
        }.bind(this), 1000);
      }.bind(this);
    },

    onSearchAgain: function (oEvent) {
      var oController = this;
      const oStateModel = this.getView().getModel("state");
      var currentLocation = oStateModel.getProperty("/mapCenter");

      oController._updateHash({
        lat: currentLocation.lat(),
        lng: currentLocation.lng(),
        zoom: "recenter"
      });

      oStateModel.setProperty("/mapMoved", false);
    },

    retrieveUserLocation: function () {
      const oView = this.getView();
      const oStateModel = oView.getModel("state");
      oStateModel && oStateModel.setProperty("/locatingUser", true);

      const errorHandler = function (oError) {
        if (oError.code === 1) {
          oStateModel && oStateModel.setProperty("/locatingUser", false);
          oStateModel && oStateModel.setProperty("/determineLocation", false);
          const oBundle = oView.getModel("i18n").getResourceBundle();
          MessageBox.information(oBundle.getText("noLocationPermission"));
        }
      }.bind(this);

      if (navigator.geolocation) {//&& oStateModel && !oStateModel.getProperty("/locationFromUrl")) {
        navigator.geolocation.getCurrentPosition(function success(nativeLocation) {
          oStateModel.setProperty("/determineLocation", true);

          this._updateHash({
            lat: nativeLocation.coords.latitude,
            lng: nativeLocation.coords.longitude,
            zoom: "recenter"
          });

          oStateModel && oStateModel.setProperty("/locatingUser", false);
          oStateModel && oStateModel.setProperty("/mapMoved", false);
        }.bind(this), errorHandler);
      } else {
        MapUtils.currentPosition()
          .then(this._updateHash.bind(this))
          .fail(errorHandler);
        oStateModel && oStateModel.setProperty("/mapMoved", false);
      }
    },

    _updateHash: function (oLocation) {
      // call route with query parameter
      UIComponent.getRouterFor(this).navTo("mapview", {
        query: oLocation
      });
    },

    _updateUI: function (oEvent) {
      var oArguments = oEvent.getParameter("arguments"),
        oQuery = oArguments["?query"];

      const oView = this.getView();
      const oStateModel = oView.getModel("state");

      oStateModel.setProperty("/locatingUser", false);

      if (oQuery) {
        // read location from URL
        oStateModel.setProperty("/locationFromUrl", true);
        this._setUserLocation(oQuery);
      } else if (!oStateModel.getProperty("/retrievedUserLocation")) {
        // just locate the user once
        this.retrieveUserLocation();
        oStateModel.setProperty("/retrievedUserLocation", true);
      }
    },

    _setUserLocation: function (location) {
      const oMap = this.getView().byId("map");
      const zoomType = location.zoom ? location.zoom : "auto";

      location.lat = typeof location.lat === "string" ? parseFloat(location.lat) : location.lat;
      location.lng = typeof location.lng === "string" ? parseFloat(location.lng) : location.lng;

      oMap.getModel("state").setProperty("/locationName", location.name);
      oMap.getModel("state").setProperty("/location", location);

      this.updateMarkerBinding(zoomType);
    },

    _getProviderMarkers: function () {
      const oMap = this.getView().byId("map");
      return oMap.getMarkers().filter(function (oM) {
        return oM.getBindingContext("main");
      });
    },

    _getRequestParam: function () {

      const oStateModel = this.getView().getModel("state");
      const sLat = oStateModel.getProperty("/location/lat");
      const sLng = oStateModel.getProperty("/location/lng");
      const sResources = "''" + oStateModel.getProperty("/selectedResources").join("'',''");
      const sResourcesLocahost = "(ASSISTANCETYPEID eq " + oStateModel.getProperty("/selectedResources").join(" or ASSISTANCETYPEID eq ") + ")";

      // For localhost, just pass in filter for within one lat and one long, roughly 70 miles radius
      return location.href.includes("localhost") ?
        "?$filter=LAT gt " + (parseFloat(sLat) - .5) + " and LAT lt " + (parseFloat(sLat) + .5) +
        " and LONG gt " + (parseFloat(sLng) - .5) + " and LONG lt " + (parseFloat(sLng) + .5) +
        " and " + sResourcesLocahost :
        "(LATITUDE=" + sLat + ",LONGITUDE=" + sLng + ",DISTANCEFORSEARCH=50" + ",ASSISTANCETYPES='" + sResources + "''')/Set";
    },

    updateMarkerBinding: function (zoomType) {
      const oMap = this.getView().byId("map");
      const oBundle = oMap.getModel("i18n").getResourceBundle();

      if (typeof zoomType === "object") {
        const oRouter = UIComponent.getRouterFor(this);
        const oInfo = oRouter.getRouteInfoByHash(oRouter.getHashChanger().getHash());
        zoomType = oInfo.arguments["?query"].zoom;
      }

      this._bindOverlay();

      const oStateModel = this.getView().getModel("state");
      oStateModel.setProperty("/requestingData", true);

      $.get("/public/map/SchoolOffersByType" + this._getRequestParam())
        .done(function (oResult) {
          const aTransformed = this.formatter.transformBackendData(oResult.value);
          const oMainModel = oMap.getModel("main");

          MessageToast.show(oBundle.getText("searchnotification", aTransformed.length || "0"));
          aTransformed.push({
            lat: oStateModel.getProperty("/location/lat"),
            lng: oStateModel.getProperty("/location/lng"),
            assistanceTypes: ["User"]
          });

          oMainModel.setSizeLimit(aTransformed.length);
          oMainModel.setData(aTransformed);
          this.markersUpdated(zoomType);
        }.bind(this))
        .fail(function () {
          MessageBox.error(oBundle.getText("datarequestfailed"), {
            onClose: function (action) {
              if (action !== MessageBox.Action.CLOSE) {
                this.updateMarkerBinding();
              }
            }.bind(this)
          });
        });
    },

    markersUpdated: function (zoomType) {
      const oMap = this.getView().byId("map");
      oMap.getModel("state").setProperty("/requestingData", false);

      if (zoomType === "auto") {
        this._repositionMap(this.getClosestMarkers());
      } else if (zoomType === "recenter") {
        this._repositionMap(this.getClosestMarkers());
        const oMap = this.getView().byId("map");

        setTimeout(function () {
          oMap.fireEvent("ready");
        }.bind(this), 500);

      }
    },

    _repositionMap: function (aCloseMarkers) {
      const oMap = this.getView().byId("map");
      const oStateModel = this.getView().getModel("state");
      oMap.attachEventOnce("ready", function () {

        const allRendered = aCloseMarkers.some(function (oM) {
          return oM.marker;
        });
        if (allRendered) {
          if (aCloseMarkers.length > 1) {
            oMap.fitToSelectedMarkers(aCloseMarkers);
          } else {
            oMap.fitToSelectedMarkers(aCloseMarkers);
            oMap.setLat(oStateModel.getProperty("/location/lat"));
            oMap.setLng(oStateModel.getProperty("/location/lng"));
            oMap.setZoom(10);
          }
        } else {
          this._repositionMap(aCloseMarkers);
        }

      }.bind(this));

    },

    isReady: function (oEvent) {

    },

    onToggleButtonPress: function (oEvent) {
      oEvent.getSource().setPressed(true);
      this.retrieveUserLocation();
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

    onMarkerClick: function (oEvent) {
      const oClickedMarker = oEvent.getSource();
      const oBindingContext = oClickedMarker.getBindingContext("main");

      if (oBindingContext) {
        const oBundle = this.getView().getModel("i18n").getResourceBundle();
        const sInfo = this.formatter.markerInfoFormatter(oBindingContext.getObject(), oBundle);
        oClickedMarker.infoWindow.setContent(sInfo);
      }

      this.getView().byId("map").getMarkers().forEach(function (oMarker) {
        if (oEvent.getSource() !== oMarker || !Device.system.desktop) { //close all on mobile
          oMarker.infoWindowClose();
        }
      });

      this._bindOverlay(oBindingContext.getPath());
    },

    onMapClick: function () {
      this._bindOverlay();
    },

    _bindOverlay: function (sPath) {
      if (Device.system.desktop) {
        const calendarRow = this.getView().byId("calendarRow");
        calendarRow.bindElement("main>" + sPath);
      } else {
        const oOverlay = this.getView().byId("providerOverlay");
        oOverlay.setHidden(!sPath);
        oOverlay.bindElement("main>" + sPath);
      }
    },

    onMarkerHoverOver: function (oEvent) {
      const oMarker = oEvent.getSource();
      const oContext = oMarker.getBindingContext("main");
      if (!oMarker.getInfo() && oContext) {
        const oBundle = this.getView().getModel("i18n").getResourceBundle();
        const sInfo = this.formatter.markerInfoFormatter(oContext.getObject(), oBundle);
        oMarker.setProperty("info", sInfo, true);
        oMarker.infoWindow.setContent(sInfo);
      }

      oEvent.getSource().infoWindowOpen();
    },

    onMarkerHoverOut: function (oEvent) {
      oEvent.getSource().infoWindowClose();
    },

    onAddressSearch: function (oEvent) {
      const input = oEvent.getParameter("query");
      if (input === "") {
        return;
      }
      var currentHash = UIComponent.getRouterFor(this).getHashChanger().getHash();
      this.getView().byId("providerOverlay").setHidden(true);
      const oBundle = oEvent.getSource().getModel("i18n").getResourceBundle();

      MapUtils.search({
        "address": input
      }).done(function (results) {
        document.activeElement.blur(); //remove virtual keyboard on mobile devices
        if (results.length === 0) {
          MessageBox.show(oBundle.getText("invalidLocation", [input]));
          return;
        }
        this.getView().getModel("state").setProperty("/determineLocation", false);
        this.getView().getModel("state").setProperty("/mapMoved", false);
        this._updateHash({
          name: results[0].formatted_address,
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
          zoom: "recenter"
        });

        // Fire event manually for same location (no change to url)
        var newHash = encodeURI("?name=" + results[0].formatted_address + "&lat=" + results[0].geometry.location.lat() + "&lng=" + results[0].geometry.location.lng() + "&zoom=recenter");
        if (currentHash === newHash) {
          UIComponent.getRouterFor(this).getRoute("mapview").fireEvent("patternMatched",
            {
              arguments: {
                "?query": {
                  name: results[0].formatted_address,
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                  zoom: "recenter"
                }
              }
            });
        }
      }.bind(this));
    },

    getClosestMarkers: function () {
      const location = this.getView().getModel("state").getProperty("/location");
      if (!location) {
        return [];
      }
      const aCurrentLocation = [];

      let aNeighbors = [], round = 1;

      while (aNeighbors.length < 10 && round < 100) {
        aNeighbors = this._getProviderMarkers().filter(function (oMarker) {
          const oProviderContext = oMarker.getBindingContext("main");

          const closeLat = Math.abs(oProviderContext.getProperty("lat") - location.lat) < (round * 0.05);
          const closeLng = Math.abs(oProviderContext.getProperty("lng") - location.lng) < (round * 0.05);
          return closeLat && closeLng;
        });
        round++;
      }

      return aCurrentLocation.concat(aNeighbors);
    },

    onDisclaimerOpen: function () {
      this.byId("disclaimer").open();
    },

    onAboutOpen: function () {
      this.byId("about").open();
    },

    onEnterResOpen: function () {
      this.byId("enter").open();
    },

    onOpenForm: function () {
      window.open("/comsap4kidsassistanceentry/index.html", "_blank");
    },

    ignoreAppointmentSelect: function (oEvent) {
      oEvent.getParameter("appointment").setSelected(false);
    },

    onCloseDialog: function (oEvent) {
      oEvent.getSource().getParent().close();
    },

    onFeedbackOpen: function () {
      window.open("https://sapinsights.eu.qualtrics.com/jfe/form/SV_0N82QgYLLEE809T", "_blank");
    },

    onHomePress: function () {
      window.location = window.location.href.split("?")[0];
    },

    onFilterButtonPress: function () {
      const oAccordion = this.getView().byId("filterAccordion");
      oAccordion.setExpanded(!oAccordion.getExpanded());
    },

    onTriggerNavigator: function (oEvent) {
      const oLocation = oEvent.getSource().getBindingContext("main").getObject();
      const sDestination = oLocation.lat + "," + oLocation.lng;
      const oStateModel = this.getView().getModel("state");
      const sOrigin = "saddr=" + oStateModel.getProperty("/location/lat") + "," + oStateModel.getProperty("/location/lng") + "&";
      window.open("http://maps.google.com/maps?" + sOrigin + "daddr=" + sDestination, "_blank");
    }

  });
});
