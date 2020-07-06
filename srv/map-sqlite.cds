using scp.cloud from '../db/schema';


service Map @(impl : 'map.js') {

  entity SchoolOffers       as
    select from cloud.AssistanceOffering {
      key ID,
          assistanceLocation.ID                      as ADDRESS_ID,
          timeFrom                                   as TIMEFROM,
          timeTo                                     as TIMETO,
          availableMon                               as AVAILABLEMON,
          availableTue                               as AVAILABLETUE,
          availableWed                               as AVAILABLEWED,
          availableThr                               as AVAILABLETHR,
          availableFri                               as AVAILABLEFRI,
          availableSat                               as AVAILABLESAT,
          availableSun                               as AVAILABLESUN,
          startDate                                  as STARTDATE,
          endDate                                    as ENDDATE,
          pickupInd                                  as PICKUPIND,
          deliveryInd                                as DELIVERYIND,
          contactName                                as CONTACTNAME,
          contactEmail                               as CONTACTEMAIL,
          contactTitle                               as CONTACTTITLE,
          websiteURL                                 as WEBSITEURL,
          offerDetails                               as OFFERDETAILS,
          assistanceType.assistanceType              as ASSISTANCETYPE,
          assistanceSubType.subType                  as ASSISTANCESUBTYPE,
          eligiblityCategory.eligibilityCategory     as ELIGIBILITYCATEGORY,
          assistanceLocation.name                    as NAME,
          assistanceLocation.address.city            as CITY,
          assistanceLocation.address.state.StateCode as STATECODE,
          assistanceLocation.address.street          as STREET,
          assistanceLocation.address.zip             as ZIP,
          assistanceLocation.address.lat             as LAT,
          assistanceLocation.address.long            as LONG,
    }
    excluding {
      createdBy,
      modifiedBy,
      createdAt,
      modifiedAt
    };

  entity SchoolOffersByType as
    select from cloud.AssistanceOffering {
      key ID,
          assistanceLocation.ID                      as ADDRESS_ID,
          timeFrom                                   as TIMEFROM,
          timeTo                                     as TIMETO,
          availableMon                               as AVAILABLEMON,
          availableTue                               as AVAILABLETUE,
          availableWed                               as AVAILABLEWED,
          availableThr                               as AVAILABLETHR,
          availableFri                               as AVAILABLEFRI,
          availableSat                               as AVAILABLESAT,
          availableSun                               as AVAILABLESUN,
          startDate                                  as STARTDATE,
          endDate                                    as ENDDATE,
          pickupInd                                  as PICKUPIND,
          deliveryInd                                as DELIVERYIND,
          contactName                                as CONTACTNAME,
          contactEmail                               as CONTACTEMAIL,
          contactTitle                               as CONTACTTITLE,
          websiteURL                                 as WEBSITEURL,
          offerDetails                               as OFFERDETAILS,
          assistanceType.assistanceType              as ASSISTANCETYPE,
          assistanceType.ID                          as ASSISTANCETYPEID,
          assistanceSubType.subType                  as ASSISTANCESUBTYPE,
          eligiblityCategory.eligibilityCategory     as ELIGIBILITYCATEGORY,
          assistanceLocation.name                    as NAME,
          assistanceLocation.address.city            as CITY,
          assistanceLocation.address.state.StateCode as STATECODE,
          assistanceLocation.address.street          as STREET,
          assistanceLocation.address.zip             as ZIP,
          assistanceLocation.address.lat             as LAT,
          assistanceLocation.address.long            as LONG,
    }
    excluding {
      createdBy,
      modifiedBy,
      createdAt,
      modifiedAt
    };

  @readonly
  entity AssistanceTypes    as projection on cloud.AssistanceType;

}
