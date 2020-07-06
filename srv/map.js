const cds = require("@sap/cds");

module.exports = cds.service.impl(async (srv) => {
    const srvUSDA = await cds.connect.to('API_USDA_ARCGIS');

    const {
        SchoolOffersByType,
        AssistanceTypes
    } = srv.entities;

    srv.on("READ", "SchoolOffersByType", async (req, next) => {
        //try {
        // Get Data from DB
        const offers = await next();


        // Parse Incoming Request/Filters
        const assistTypes = await cds.run(SELECT.from(AssistanceTypes));
        const assistTypeFood = assistTypes.filter(typ => typ.assistanceType = "Food");

        var isFoodRequest = false, latLower, latUpper, lngLower, lngUpper;
        console.log("DEBUG: Path: " + JSON.stringify(req._.path));
        if (req._.query && req._.query.$filter) {
            const filterString = req._.query.$filter;
            filterString.split(" and ").map(filterItem => {
                if (filterItem.toUpperCase().indexOf("LAT GT") == 0) {
                    latLower = filterItem.substring(7);
                }
                if (filterItem.toUpperCase().indexOf("LAT LT") == 0) {
                    latUpper = filterItem.substring(7);
                }
                if (filterItem.toUpperCase().indexOf("LONG GT") == 0) {
                    lngLower = filterItem.substring(7);
                }
                if (filterItem.toUpperCase().indexOf("LONG LT") == 0) {
                    lngUpper = filterItem.substring(7);
                }
                if (filterItem.indexOf(assistTypeFood[0].ID) > -1) {
                    isFoodRequest = true;
                }
            });
        } else {
            var sPath = req._.path;
            const reqParams = sPath.substring(sPath.indexOf("(") + 1, sPath.indexOf(")")).split(/=|,/).map((filterItem, i, arItems) => {
                if (filterItem.toUpperCase() === 'LATITUDE') {
                    latLower = parseFloat(arItems[i + 1]) - .5;
                    latUpper = parseFloat(arItems[i + 1]) + .5;
                }
                if (filterItem.toUpperCase() === 'LONGITUDE') {
                    lngLower = parseFloat(arItems[i + 1]) - .5;
                    lngUpper = parseFloat(arItems[i + 1]) + .5;
                }
                if (filterItem.indexOf(assistTypeFood[0].ID) > -1) {
                    isFoodRequest = true;
                }
            });
        }

        if (isFoodRequest) {
            // Query from remote USDA service
            var query = "query?f=json&where=endDate >= CURRENT_TIMESTAMP and startDate <= CURRENT_TIMESTAMP&" +
                "geometryType=esriGeometryEnvelope&geometry={\"xmin\": " + lngLower + ",\"ymin\": " + latLower +
                ",\"xmax\": " + lngUpper + ",\"ymax\": " + latUpper + ", spatialReference:{wkid:4326}}" +
                "&outFields=*";
            console.log("Query: " + query)
            const tx = srvUSDA.transaction(req);
            var response = await tx.get(query);
            const fnFormatDate = function (timestamp) {
                var d = new Date(timestamp);
                return d.getUTCFullYear() + "-" + d.getUTCMonth().toString().padStart(2, '0') + "-" + d.getUTCDate().toString().padStart(2, '0');
            };

            /**
             * Get time range object from string
             * @param {*} strRange 
             * @returns { start: 'hh:mm:ss', end: 'hh:mm:ss'}
             */
            const fnGetTimeRange = function (strRange) {
                const dayStart = 6, dayEnd = 22;
                var arTimes = strRange.split(/-| to /).map(time => {
                    if (time.indexOf(":") > -1) {
                        // Parse time into 24HR Time hh:mm:ss
                        if (time.match(/(am)/gi)) {
                            // Contains AM
                            let [hours, minutes] = time.substring(0, time.toUpperCase().indexOf('AM')).trim().split(":");
                            hours = hours.toString().padStart(2, '0');
                            return `${hours}:${minutes}:00`;

                        } else if (time.match(/(pm)/gi)) {
                            // Contains PM
                            let [hours, minutes] = time.substring(0, time.toUpperCase().indexOf('PM')).trim().split(":");
                            if (hours != 12) { hours = parseInt(hours) + 12 };
                            if (!minutes) { minutes = "00" }
                            hours = hours.toString().padStart(2, '0');
                            return `${hours}:${minutes}:00`;

                        } else {
                            // Assume datetime hours..
                            let [hours, minutes] = time.split(':');
                            if (!minutes) { minutes = "00" }
                            if (hours > 12) {
                                //return `${hours}:${minutes}:00`;
                            } else {
                                if (hours < dayStart) {
                                    hours = parseInt(hours) + 12;
                                    //return `${hours}:${minutes}:00`;
                                } else if (hours + 12 > dayEnd) {
                                    //return `${hours}:${minutes}:00`;
                                } else {

                                }
                            }
                            hours = hours.toString().padStart(2, '0');
                            return `${hours}:${minutes}:00`;
                        }
                    } else {
                        return null;
                    }
                });
                console.log(strRange + " --> " + JSON.stringify(arTimes));

                return { start: arTimes[0], end: arTimes[1] }
            };

            const fnCreateOffer = function (objTemp, isBreakfast, isLunch, isDinner, isSnackAM, isSnackPM, startTime, endTime) {
                var subtypeName = isBreakfast ? "Breakfast" :
                    isLunch ? "Lunch" :
                        isDinner ? "Dinner" :
                            isSnackAM ? "Morning Snack" :
                                isSnackPM ? "Afternoon Snack" : "";
                return {
                    ID: "FFFFFFFF-0000-0000-0000-" + objTemp.attributes.OBJECTID.toString().padStart(12, '0'),
                    ADDRESS_ID: "AAAAAAAA-0000-0000-0000-" + objTemp.attributes.OBJECTID.toString().padStart(12, '0'),
                    TIMEFROM: startTime,
                    TIMETO: endTime,
                    AVAILABLEMON: objTemp.attributes.daysofOperation.indexOf("M") > -1 ? true :
                        objTemp.attributes.daysofOperation.indexOf("Mon") > -1 ? true : false,
                    AVAILABLETUE: objTemp.attributes.daysofOperation.indexOf("T") > -1 ? true :
                        objTemp.attributes.daysofOperation.indexOf("Tue") > -1 ? true : false,
                    AVAILABLEWED: objTemp.attributes.daysofOperation.indexOf("W") > -1 ? true :
                        objTemp.attributes.daysofOperation.indexOf("Wed") > -1 ? true : false,
                    AVAILABLETHR: objTemp.attributes.daysofOperation.indexOf("TH") > -1 ? true :
                        objTemp.attributes.daysofOperation.indexOf("Thu") > -1 ? true : false,
                    AVAILABLEFRI: objTemp.attributes.daysofOperation.indexOf("F") > -1 ? true :
                        objTemp.attributes.daysofOperation.indexOf("Fri") > -1 ? true : false,
                    AVAILABLESAT: objTemp.attributes.daysofOperation.indexOf("SA") > -1 ? true :
                        objTemp.attributes.daysofOperation.indexOf("Sat") > -1 ? true : false,
                    AVAILABLESUN: objTemp.attributes.daysofOperation.indexOf("SU") > -1 ? true :
                        objTemp.attributes.daysofOperation.indexOf("Sun") > -1 ? true : false,
                    STARTDATE: fnFormatDate(objTemp.attributes.startDate),
                    ENDDATE: fnFormatDate(objTemp.attributes.endDate),
                    PICKUPIND: true,
                    DELIVERYIND: false,
                    CONTACTNAME: objTemp.attributes.contactFirstName + " " + objTemp.attributes.contactLastName,
                    CONTACTEMAIL: "USDA",
                    CONTACTTITLE: null,
                    WEBSITEURL: null,
                    OFFERDETAILS: (objTemp.attributes.contactPhone ? "Phone: " + objTemp.attributes.contactPhone : "") + "\n" + objTemp.attributes.comments,
                    ASSISTANCETYPE: "Food",
                    ASSISTANCETYPEID: assistTypeFood[0].ID,
                    ASSISTANCESUBTYPE: subtypeName,
                    ELIGIBILITYCATEGORY: "Students and Siblings under age 18",
                    NAME: objTemp.attributes.siteName,
                    CITY: objTemp.attributes.siteCity,
                    STATECODE: objTemp.attributes.siteState,
                    STREET: objTemp.attributes.siteAddress,
                    ZIP: parseInt(objTemp.attributes.siteZip),
                    LAT: objTemp.geometry.y,
                    LONG: objTemp.geometry.x
                }
            };

            // Merge results
            if (!response.error) {
                var usdaOffers = [];
                response.features.map(obj => {
                    // Split meal times for our data model
                    var oTimeRange;
                    if (obj.attributes.breakfastTime) {
                        var oTimeRange = fnGetTimeRange(obj.attributes.breakfastTime);
                        usdaOffers.push(fnCreateOffer(obj, true, false, false, false, false, oTimeRange.start, oTimeRange.end));
                    }
                    if (obj.attributes.lunchTime) {
                        var oTimeRange = fnGetTimeRange(obj.attributes.lunchTime);
                        usdaOffers.push(fnCreateOffer(obj, false, true, false, false, false, oTimeRange.start, oTimeRange.end));
                    }
                    if (obj.attributes.dinnerSupperTime) {
                        var oTimeRange = fnGetTimeRange(obj.attributes.dinnerSupperTime);
                        usdaOffers.push(fnCreateOffer(obj, false, false, true, false, false, oTimeRange.start, oTimeRange.end));
                    }
                    if (obj.attributes.snackTimeAM) {
                        var oTimeRange = fnGetTimeRange(obj.attributes.snackTimeAM);
                        usdaOffers.push(fnCreateOffer(obj, false, false, false, true, false, oTimeRange.start, oTimeRange.end));
                    }
                    if (obj.attributes.snackTimePM) {
                        var oTimeRange = fnGetTimeRange(obj.attributes.snackTimePM);
                        usdaOffers.push(fnCreateOffer(obj, false, false, false, false, true, oTimeRange.start, oTimeRange.end));
                    }
                });
                return offers ? offers.concat(usdaOffers) : usdaOffers;
            }
            else {
                //Error
                return response;
            }
        }
        else {
            return offers;
        }
        //} catch (ex) {
        //    console.log("exception. " + JSON.stringify(ex));
        //    return ex;
        //}
    });

    // srv.after("READ", "SchoolOffersByType", async (result, req) => {


    // });

});
