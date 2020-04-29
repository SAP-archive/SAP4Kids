namespace scp.cloud;

using {
  cuid,
  managed,
  sap.common
} from '@sap/cds/common';

entity Address : cuid, managed {
      street             : String(100)    @title : 'Street';
      city               : String(50)     @title : 'City';
      zip                : Integer        @title : 'Zip';
      lat                : Decimal(23, 15)@title : 'Latitude';
      long               : Decimal(23, 15)@title : 'Longitude';
      state              : Association to State;
      school             : Association to many School
                             on school.address = $self;
      assistanceLocation : Association to many AssistanceLocation
                             on assistanceLocation.address = $self;
}

entity AssistanceLocation : cuid, managed {
  name                : String(50)                  @title : 'Assistance Location';
  address             : Association to Address      @title : 'Address';
  locationType        : Association to LocationType @title : 'Location Type';
  assistanceOfferings : Association to many AssistanceOffering
                          on assistanceOfferings.assistanceLocation = $self;
}

entity AssistanceOffering : cuid, managed {
  timeFrom           : Time                               @title : 'Time From';
  timeTo             : Time                               @title : 'Time To';
  availableMon       : Boolean                            @title : 'Monday Availability';
  availableTue       : Boolean                            @title : 'Tuesday Availability';
  availableWed       : Boolean                            @title : 'Wednesday Availability';
  availableThr       : Boolean                            @title : 'Thursday Availability';
  availableFri       : Boolean                            @title : 'Friday Availability';
  availableSat       : Boolean                            @title : 'Saturday Availability';
  availableSun       : Boolean                            @title : 'Sunday Availability';
  startDate          : Date                               @title : 'Offering Start Date';
  endDate            : Date                               @title : 'Offering End Date';
  pickupInd          : Boolean                            @title : 'Indicates Pickup';
  deliveryInd        : Boolean                            @title : 'Indicates Delivery';
  virtualInd         : Boolean                            @title : 'Virtual Offering';
  contactName        : String(50)                         @title : 'Assistance Contact Name';
  contactEmail       : String(50)                         @title : 'Contact Email';
  contactPhone       : String(20)                         @title : 'Contact Phone';
  contactTitle       : String(60)                         @title : 'Contact Title';
  websiteURL         : String(1000)                       @title : 'URL Associated with resource being offered';
  eligiblityCategory : Association to EligibilityCategory @title : 'Indicates category of eligiblity';
  offerDetails       : String(1000)                       @title : 'Misc offer notes';
  offerApproved      : Boolean default false              @title : 'Indicates if offer has been approved';
  assistanceLocation : Association to AssistanceLocation  @title : 'Assistance Location';
  assistanceType     : Association to AssistanceType      @title : 'Assistance Type';
  assistanceSubType  : Association to AssistanceSubType   @title : 'Assistance Sub Type';
}

entity AssistanceSubType : cuid {
  subType        : String(30) @title : 'AssistanceSubType';
  assistanceType : Association to AssistanceType @title : 'Assistance Type';
  description    : String(100)                   @title : 'Assitance Sub Type Description';
}

entity AssistanceType : cuid {
  assistanceType : String(30) @title : 'Assistance Type';
  description    : String(100)@title : 'Assistance Type Description';
}

entity DeliveryMode : GenYouthCodeList {}
entity OrganizationType : GenYouthCodeList {}

entity Organization : cuid {
  name             : String(100)                     @title : 'Organization Name';
  organizationType : Association to OrganizationType @title : 'Organization Type';
  address          : Association to Address          @title : 'Organization Address';
}

entity District {
  key leaid  : String(8)            @title : 'Local Education Agency ID';
      name   : String(100)          @title : 'District Name';
      state  : Association to State @title : 'State';
      school : Association to many School
                 on school.district = $self;
}

entity DistrictOfferingAssistance : managed {
  key assistance : Association to AssistanceOffering;
  key district   : Association to District;
}

entity EligibilityCategory : cuid {
  eligibilityCategory : String(50) @title : 'Eligibility Type';
  description         : String(100)@title : 'Description of Eligiblity Categories';
}

abstract entity GenYouthCodeList : common.CodeList {
  key code : String(20);
}

entity LocationType : cuid {
  locType     : String(30) @title : 'Type of Location';
  description : String(100)@title : 'Description of Location';
}

entity LocationSubType : cuid {
  subtype      : String(30);
  locationType : Association to LocationType @title : 'Location Type';
}

entity organizationOfferingAssistance : managed {
  key assistance   : Association to AssistanceOffering;
  key organization : Association to Organization;
}

entity SchoolOfferingAssistance : managed {
  key assistance : Association to AssistanceOffering;
  key school     : Association to School;
}

entity School {
  key ID               : String(12)              @title : 'School Identifier';
      name             : String(100)             @title : 'School Name';
      district         : Association to District @title : 'LEAID District ID';
      address          : Association to Address  @title : 'School Address';
      schoolAssistance : Association to many SchoolOfferingAssistance
                           on schoolAssistance.school = $self;
}

entity State {
  key StateCode : String(2) @title : 'State Code';
      Name      : String(50)@title : 'name of state';
      FIPS      : Integer   @title : 'FIPS ID';
      district  : Association to many District
                    on district.state = $self;
}

// entity TimeSchedules as
//   select from AssistanceOffering {
//     key ID,
//         // ADDRESS_ID,
//         // SUBTYPE,
//         assistanceLocation,
//         assistanceSubType,
//         timeFrom as TIMEFROM,
//         timeTo,
//         availableMon,
//         availableTue,
//         availableWed,
//         availableThr,
//         availableFri,
//         availableSat,
//         availableSun
//   };


// startDate          : Date                               @title : 'Offering Start Date';
// endDate            : Date                               @title : 'Offering End Date';
// pickupInd          : Boolean                            @title : 'Indicates Pickup';
// deliveryInd        : Boolean                            @title : 'Indicates Delivery';
// virtualInd         : Boolean                            @title : 'Virtual Offering';
// contactName        : String(50)                         @title : 'Assistance Contact Name';
// contactEmail       : String(50)                         @title : 'Contact Email';
// contactPhone       : String(20)                         @title : 'Contact Phone';
// contactTitle       : String(60)                         @title : 'Contact Title';
// websiteURL         : String(1000)                       @title : 'URL Associated with resource being offered';
// eligiblityCategory : Association to EligibilityCategory @title : 'Indicates category of eligiblity';
// offerDetails       : String(1000)                       @title : 'Misc offer notes';
// offerApproved      : Boolean default false              @title : 'Indicates if offer has been approved';
// assistanceLocation : Association to AssistanceLocation  @title : 'Assistance Location';
// assistanceType     : Association to AssistanceType      @title : 'Assistance Type';
//   : Association to AssistanceSubType   @title : 'Assistance Sub Type';
// entity SchoolOffers2                                                                                                                             as
//   select from CV_SAP4KIDS
//   mixin {
//     schedule : Composition of many TimeSchedules
//                  on CV_SAP4KIDS.ADDRESS_ID = schedule.ADDRESS_ID;
//   }
//   into {
//     *,
//     schedule,
//     ADDRESS_ID
//   }
//   excluding {
//     SUBTYPE,
//     TIMEFROM,
//     TIMETO,
//     AVAILABLEMON,
//     AVAILABLETUE,
//     AVAILABLEWED,
//     AVAILABLETHR,
//     AVAILABLEFRI,
//     AVAILABLESAT,
//     AVAILABLESUN
//   }
