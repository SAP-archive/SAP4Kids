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

      if (navigator.geolocation && oStateModel && !oStateModel.getProperty("/locationFromUrl")) {
        navigator.geolocation.getCurrentPosition(function success(nativeLocation) {
          this._updateHash({
            lat: nativeLocation.coords.latitude,
            lng: nativeLocation.coords.longitude
          });

          oStateModel && oStateModel.setProperty("/locatingUser", false);
        }.bind(this), errorHandler);
      } else {
        MapUtils.currentPosition()
          .then(this._updateHash.bind(this))
          .fail(errorHandler);
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
        oStateModel.setProperty("/determineLocation", false);
        this._setUserLocation(oQuery);
      } else if (!oStateModel.getProperty("/retrievedUserLocation")) {
        // just locate the user once
        this.retrieveUserLocation();
        oStateModel.setProperty("/retrievedUserLocation", true);
        oStateModel.setProperty("/determineLocation", true);
      }
    },

    _setUserLocation: function (location) {
      const oMap = this.getView().byId("map");

      oMap.getModel("state").setProperty("/locationName", location.name);
      oMap.getModel("state").setProperty("/location", location);

      this.updateMarkerBinding();
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
      const sEligibilities = oStateModel.getProperty("/selectedEligibilities")[0]; //.join(",")
      const sResources = oStateModel.getProperty("/selectedResources")[0];

      return location.href.includes("localhost") ? "" : "(LATITUDE=" + sLat + ",LONGITUDE=" + sLng + ",DISTANCEFORSEARCH=50" + ",ELIGIBILITYCAT='''" + sEligibilities + "''',ASSISTSUBTYPE='''" + sResources + "''')/Set"; //TODO remove this if backend is ready
    },

    updateMarkerBinding: function () {
      const oMap = this.getView().byId("map");
      const oBundle = oMap.getModel("i18n").getResourceBundle();

      this._bindOverlay();

      const oStateModel = this.getView().getModel("state");
      oStateModel.setProperty("/requestingData", true);

      $.get("/public/map/SchoolOffers" + this._getRequestParam())
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
          this.markersUpdated();
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

    markersUpdated: function () {
      const oMap = this.getView().byId("map");
      oMap.getModel("state").setProperty("/requestingData", false);

      this._repositionMap(this.getClosestMarkers());
    },

    _repositionMap: function (aCloseMarkers) {
      const oMap = this.getView().byId("map");
      oMap.attachEventOnce("ready", function () {
        const allRendered = aCloseMarkers.some(function (oM) {
          return oM.marker;
        });
        if (allRendered) {
          oMap.fitToSelectedMarkers(aCloseMarkers);
        } else {
          this._repositionMap(aCloseMarkers);
        }
      }.bind(this));
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
        this._updateHash({
          name: results[0].formatted_address,
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        });
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
      const sDestination = oLocation.address.lat + "," + oLocation.address.lng;
      const oStateModel = this.getView().getModel("state");
      const sOrigin = "saddr=" + oStateModel.getProperty("/location/lat") + "," + oStateModel.getProperty("/location/lng") + "&";
      window.open("http://maps.google.com/maps?" + sOrigin + "daddr=" + sDestination, "_blank");
    }

  });
});
