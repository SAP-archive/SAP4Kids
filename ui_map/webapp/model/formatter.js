sap.ui.define(["sap/ui/model/type/Time"], function (TimeFormatter) {
  "use strict";

  const timesFormatter = function (timeFrom, timeTo) {
    const oFormatter = new TimeFormatter({ source: { pattern: "hh:mm:ss" }, style: "short" });

    return oFormatter.formatValue(timeFrom, "any") + " - " + oFormatter.formatValue(timeTo, "any");
  };

  const daysFormatter = function (oBundle, availableMon, availableTue, availableWed, availableThr, availableFri, availableSat, availableSun) {
    const aDays = [];
    if (availableMon) {
      aDays.push(oBundle.getText("marker.mo"));
    }
    if (availableTue) {
      aDays.push(oBundle.getText("marker.tu"));
    }
    if (availableWed) {
      aDays.push(oBundle.getText("marker.w"));
    }
    if (availableThr) {
      aDays.push(oBundle.getText("marker.th"));
    }
    if (availableFri) {
      aDays.push(oBundle.getText("marker.f"));
    }
    if (availableSat) {
      aDays.push(oBundle.getText("marker.sa"));
    }
    if (availableSun) {
      aDays.push(oBundle.getText("marker.so"));
    }
    return "(" + aDays.join(", ") + ")";
  };

  return {

    providerSorter: function (providerA, providerB) {
      const oStateModel = this.getView().getModel("state");
      const lat = oStateModel.getProperty("/location/lat");
      const lng = oStateModel.getProperty("/location/lng");
      if (!lat) {
        return 0;
      }
      const euclidianDistA = Math.sqrt(
        Math.pow((providerA.lat - lat), 2) +
        Math.pow((providerA.lng - lng), 2));
      const euclidianDistB = Math.sqrt(
        Math.pow((providerB.lat - lat), 2) +
        Math.pow((providerB.lng - lng), 2));

      return euclidianDistA - euclidianDistB;
    },

    headerImageFormatter: function (device) {
      return device.resize.height > 1000;
    },

    markerInfoFormatter: function (oLocationInfo, oBundle) {
      let aMethods = [];

      if (oLocationInfo.assistanceTypes[0] === "User") {
        return "<div class='userLocationPopover'><b>" +
          oBundle.getText("youAreHere") +
          "</b></div>";
      }

      if (oLocationInfo.pickupInd) {
        aMethods.push(oBundle.getText("marker.pickup"));
      }
      if (oLocationInfo.deliveryInd) {
        aMethods.push(oBundle.getText("marker.delivery"));
      }

      const subItems = oLocationInfo.assistanceOfferings
        .sort(function (a, b) {
          return this.subTypeSorter(a.subType, b.subType);
        }.bind(this))
        .map(function (oOffering) {

          const sDays = daysFormatter(oBundle, oOffering.availableMon, oOffering.availableTue, oOffering.availableWed,
            oOffering.availableThr, oOffering.availableFri, oOffering.availableSat, oOffering.availableSun);

          return "<div class='sub-item'>" +
            "<div class='type'>" + oOffering.subType + " " + sDays + "</div>" +
            "<div class='time'>" + timesFormatter(oOffering.timeFrom, oOffering.timeTo) + "</div>" +
            "</div>";
        }).join("");

      return "<div class='institution-popup'>" +
        "<div class='name'>" + oLocationInfo.name + "</div>" +
        "<div class='mode'>" + oBundle.getText("marker.who") + " " + oLocationInfo.eligibility + "</div>" +
        "<div class='mode'>" + oBundle.getText("marker.how") + " " + aMethods.join(" & ") + "</div>" +
        "<div class='items'>" +
        "<div class='item item-food'>" +
        "<div class='sub-items'>" +
        subItems +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";
    },

    transformBackendData: function (aRaw) {
      function calcTimeslots(oRaw) {

        const days = [oRaw.AVAILABLESUN, oRaw.AVAILABLEMON, oRaw.AVAILABLETUE, oRaw.AVAILABLEWED,
        oRaw.AVAILABLETHR, oRaw.AVAILABLEFRI, oRaw.AVAILABLESAT];
        const firstOccurence = oRaw.STARTDATE, lastOccurence = oRaw.ENDDATE, timeFrom = oRaw.TIMEFROM, timeTo = oRaw.TIMETO;

        const aSlots = [], today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);

        for (let i = 0; i <= 14; i++) {
          const timeRegEx = /\d\d/g;
          let dStartTime = new Date(today), dEndTime = new Date(today);
          dStartTime.setDate(today.getDate() + i);
          dEndTime.setDate(today.getDate() + i);

          const bAlreadyStarted = firstOccurence ? new Date(firstOccurence) < dStartTime : true;
          const bNotEnded = lastOccurence ? new Date(lastOccurence) > dStartTime : true;
          if (bAlreadyStarted && bNotEnded && days[dStartTime.getDay()] && timeTo && timeFrom) {
            if (!timeTo || !timeFrom) {
              console.warn("No timeTo/timeFrom exists for a record, this should only happen in test data"); /*eslint no-console:0*/
            }
            const aFrom = timeFrom.match(timeRegEx);

            dStartTime.setHours(aFrom[0]);
            dStartTime.setMinutes(aFrom[1]);

            const aTo = timeTo.match(timeRegEx);
            dEndTime.setHours(aTo[0]);
            dEndTime.setMinutes(aTo[1]);

            aSlots.push({
              assistanceType: oRaw.ASSISTANCETYPE,
              subType: oRaw.ASSISTANCESUBTYPE,
              from: dStartTime,
              to: dEndTime
            });
          }

        }

        return aSlots;
      }

      function getOffering(oRaw) {
        return {
          timeFrom: oRaw.TIMEFROM,
          timeTo: oRaw.TIMETO,
          availableMon: oRaw.AVAILABLEMON,
          availableTue: oRaw.AVAILABLETUE,
          availableWed: oRaw.AVAILABLEWED,
          availableThr: oRaw.AVAILABLETHR,
          availableFri: oRaw.AVAILABLEFRI,
          availableSat: oRaw.AVAILABLESAT,
          availableSun: oRaw.AVAILABLESUN,
          startDate: oRaw.STARTDATE,
          endDate: oRaw.ENDDATE,
          assistanceType: oRaw.ASSISTANCETYPE,
          subType: oRaw.ASSISTANCESUBTYPE
        };
      }

      function getLocation(oRaw) {
        return {
          id: oRaw.ID,
          name: oRaw.NAME,
          street: oRaw.STREET,
          city: oRaw.CITY,
          lat: oRaw.LAT,
          lng: oRaw.LONG,
          state: oRaw.STATECODE,
          assistanceTypes: [oRaw.ASSISTANCETYPE],
          locationType: oRaw.LOCATIONTYPE,
          website: oRaw.WEBSITEURL,
          comment: oRaw.OFFERDETAILS,
          eligibility: oRaw.ELIGIBILITYCATEGORY,
          pickupInd: oRaw.PICKUPIND,
          deliveryInd: oRaw.DELIVERYIND
        };
      }

      function addToSet(aTypes, oNext) {
        if (!aTypes.includes(oNext.ASSISTANCETYPE)) {
          aTypes.push(oNext.ASSISTANCETYPE);
        }
        return aTypes;
      }

      const oAggregated = aRaw.reduce(function (oAkku, oNext) {
        if (!oAkku[oNext.ADDRESS_ID]) {
          oAkku[oNext.ADDRESS_ID] = getLocation(oNext);
          oAkku[oNext.ADDRESS_ID].assistanceOfferings = [];
          oAkku[oNext.ADDRESS_ID].timeslots = [];
        }
        addToSet(oAkku[oNext.ADDRESS_ID].assistanceTypes, oNext);
        oAkku[oNext.ADDRESS_ID].assistanceOfferings.push(getOffering(oNext));
        oAkku[oNext.ADDRESS_ID].timeslots = oAkku[oNext.ADDRESS_ID].timeslots.concat(calcTimeslots(oNext));

        return oAkku;

      }, {});

      return Object.values(oAggregated);
    },

    markerIconFormatter: function (aAssistanceTypes) {
      if (aAssistanceTypes.length > 1) {
        return "resources/img/markers/more_than_one_pin.svg";
      }
      const oMap = {
        "Food": "resources/img/markers/food_pin.svg",
        "Childcare": "resources/img/markers/childcare_pin.svg",
        "Financial": "resources/img/markers/financial_pin.svg",
        "Medical": "resources/img/markers/medical_pin.svg",
        "Shelter": "resources/img/markers/shelter_pin.svg",
        "Workforce": "resources/img/markers/workforce_pin.svg",
        "More": "resources/img/markers/more_than_one_pin.svg",
        "User": "resources/img/markers/user.png",
      };
      return oMap[aAssistanceTypes[0]];
    },

    appointmentIconFormatter: function (sAssistanceType) {
      const oMap = {
        "Food": "resources/img/services/food.svg",
        "Childcare": "resources/img/services/childcare.svg",
        "Financial": "resources/img/services/financial.svg",
        "Medical": "resources/img/services/medical.svg",
        "Shelter": "resources/img/services/shelter.svg",
        "Workforce": "resources/img/services/workforce.svg",
        "More": "resources/img/services/more_than_one.svg",
      };
      return oMap[sAssistanceType];
    },

    offeringTypeFormatter: function (subType) {
      return subType;
    },

    timeslotTooltipFormatter: function (subType, sFrom, sTo) {
      return subType + " ( " + sFrom + " - " + sTo + " )";
    },

    offeringTimesFormatter: function (sTimeFrom, sTimeTo) {
      return sTimeFrom + " - " + sTimeTo;
    },

    offeringDaysFormatter: function (availableMon, availableTue, availableWed, availableThr, availableFri, availableSat, availableSun) {
      const oBundle = this.getView().getModel("i18n").getResourceBundle();
      return daysFormatter(oBundle, availableMon, availableTue, availableWed, availableThr, availableFri, availableSat, availableSun);
    },

    subTypeSorter: function (a, b) {
      const oOrder = {
        "BREAKFAST": 0,
        "MORNING SNACK": 1,
        "LUNCH": 2,
        "AFTERNOON SNACK": 3,
        "DINNER": 4
      };
      return oOrder[a.toUpperCase()] - oOrder[b.toUpperCase()];
    }
  };
});
