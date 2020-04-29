using scp.cloud.AssistanceOffering from './schema.cds';

@cds.persistence.exists
entity CV_SAP4KIDS(IP_LAT : Double, IP_LON : Double, PROXIMITY_FILTER : Integer) {
    key ID                  : String(36)           @title : 'ID';
        TIMEFROM            : Time null            @title : 'TIMEFROM: TIMEFROM';
        TIMETO              : Time null            @title : 'TIMETO: TIMETO';
        AVAILABLEMON        : Boolean null         @title : 'AVAILABLEMON: AVAILABLEMON';
        AVAILABLETUE        : Boolean null         @title : 'AVAILABLETUE: AVAILABLETUE';
        AVAILABLEWED        : Boolean null         @title : 'AVAILABLEWED: AVAILABLEWED';
        AVAILABLETHR        : Boolean null         @title : 'AVAILABLETHR: AVAILABLETHR';
        AVAILABLEFRI        : Boolean null         @title : 'AVAILABLEFRI: AVAILABLEFRI';
        AVAILABLESAT        : Boolean null         @title : 'AVAILABLESAT: AVAILABLESAT';
        AVAILABLESUN        : Boolean null         @title : 'AVAILABLESUN: AVAILABLESUN';
        STARTDATE           : Date null            @title : 'STARTDATE: STARTDATE';
        ENDDATE             : Date null            @title : 'ENDDATE: ENDDATE';
        NAME                : String(50) null      @title : 'NAME: NAME';
        ADDRESS_ID          : Integer null         @title : 'ADDRESS_ID: ADDRESS_ID';
        LOCATIONTYPE_ID     : String(36) null      @title : 'LOCATIONTYPE_ID';
        ELIGIBILITYCATEGORY : String(50) null      @title : 'ELIGIBILITYCATEGORY';
        DESCRIPTION         : String(100) null     @title : 'DESCRIPTION';
        SUBTYPE             : String(30) null      @title : 'SUBTYPE';
        STREET              : String(100) null     @title : 'STREET';
        CITY                : String(50) null      @title : 'CITY';
        ZIP                 : Integer null         @title : 'ZIP';
        LAT                 : Decimal(23, 15) null @title : 'LAT';
        LONG                : Decimal(23, 15) null @title : 'LONG';
}

@cds.persistence.exists
entity CV_GETSCHOOLOFFERS(IP_LAT : Double, IP_LON : Double, PROXIMITY_FILTER : Integer, IP_ELIGIBILITYCATEGORY : String(38), IP_ASSISTANCESUBTYPE : String(38)) {
    key ID                        : String(36)           @title : 'ID';
        TIMEFROM                  : Time null            @title : 'TIMEFROM: TIMEFROM';
        TIMETO                    : Time null            @title : 'TIMETO: TIMETO';
        AVAILABLEMON              : Boolean null         @title : 'AVAILABLEMON: AVAILABLEMON';
        AVAILABLETUE              : Boolean null         @title : 'AVAILABLETUE: AVAILABLETUE';
        AVAILABLEWED              : Boolean null         @title : 'AVAILABLEWED: AVAILABLEWED';
        AVAILABLETHR              : Boolean null         @title : 'AVAILABLETHR: AVAILABLETHR';
        AVAILABLEFRI              : Boolean null         @title : 'AVAILABLEFRI: AVAILABLEFRI';
        AVAILABLESAT              : Boolean null         @title : 'AVAILABLESAT: AVAILABLESAT';
        AVAILABLESUN              : Boolean null         @title : 'AVAILABLESUN: AVAILABLESUN';
        STARTDATE                 : Date null            @title : 'STARTDATE: STARTDATE';
        ENDDATE                   : Date null            @title : 'ENDDATE: ENDDATE';
        NAME                      : String(50) null      @title : 'NAME: NAME';
        ELIGIBILITYCATEGORY       : String(50) null      @title : 'ELIGIBILITYCATEGORY';
        DESCRIPTION               : String(100) null     @title : 'DESCRIPTION';
        ASSISTANCESUBTYPE         : String(30)           @title : 'Assistance SubType';
        ADDRESS_ID                : Integer null         @title : 'ADDRESS_ID: ADDRESS_ID';
        STREET                    : String(100) null     @title : 'STREET';
        CITY                      : String(50) null      @title : 'CITY';
        STATECODE                 : String(2)            @title : 'State';
        ZIP                       : Integer null         @title : 'ZIP';
        LAT                       : Decimal(23, 15) null @title : 'LAT';
        LONG                      : Decimal(23, 15) null @title : 'LONG';
        LOCATION_ID               : String(36)           @title : 'Location ID';
        LOCATIONTYPE_ID           : String(36) null      @title : 'LOCATIONTYPE_ID';
        LOCATIONDESCRIPTION       : String(100)          @title : 'Location Description';
        LOCATIONTYPE              : String(30)           @title : 'Location Type';
        ASSISTANCETYPE            : String(30)           @title : 'Assitance Type';
        ASSISTANCETYPEDESCRIPTION : String(100)          @title : 'AssistanceTypeDescription';
        PICKUPIND                 : Boolean              @title : 'Pickup Indicator';
        DELIVERYIND               : Boolean              @title : 'Delivery Indicator';
        WEBSITEURL                : String(1000)         @title : 'Offer Website';
        OFFERDETAILS              : String(1000)         @title : 'Offer Details';
        CONTACTNAME               : String(50)           @title : 'Contact Name';
        CONTACTEMAIL              : String(50)           @title : 'Contact Email';
        CONTACTTITLE              : String(60)           @title : 'Contact Title';
}

@cds.persistence.exists
entity CV_GETASSISTANCELOC(IP_LAT : Double, IP_LON : Double, PROXIMITY_FILTER : Integer) {
    key ID         : String(36)           @title : 'Assistance Location ID';
        ADDRESS_ID : Integer null         @title : 'ADDRESS_ID: ADDRESS_ID';
        LAT        : Decimal(23, 15) null @title : 'LAT';
        LONG       : Decimal(23, 15) null @title : 'LONG';
        COUNT_LOC  : Integer64            @title : 'Funny Field from Abhay';
}


/* entity TimeSchedules as
    select from AssistanceOffering {*};

entity SchoolOffers2  as
    select from CV_GETASSISTANCELOC
    mixin {
        schedule : Composition of many TimeSchedules
                       on CV_GETASSISTANCELOC.ID = schedule.assistanceLocation.ID;
    }
    into {
       ID,
        max(ADDRESS_ID) as ADDRESS_ID : Integer,
        max(LAT) as LAT : Decimal(23,15),
        max(LONG) as LONG : Decimal(23,15),
        max(COUNT_LOC) as COUNT_LOC : Integer64,
        schedule
    }
    group by
        CV_GETASSISTANCELOC.ID;
 */
