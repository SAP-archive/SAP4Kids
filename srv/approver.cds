using scp.cloud from '../db/schema';

service approver @(requires : 'admin') {
  //@odata.draft.enabled

  // entity AssistanceOfferings as projection on cloud.AssistanceOffering;
  @Capabilities : {
    Insertable : false,
    Updatable  : false,
    Deletable  : true
  }
  entity AssistanceOfferings            as
    select from cloud.AssistanceOffering {
      *
    } actions {
      @(Common.SideEffects : {TargetProperties : [offerApproved], })
      action approveOffer(
      @(title : 'Approve Status')
      offerApproved : Boolean not null);
    }

  action submitOffering(Offering : AssistanceOfferings, SchoolID : Schools.ID) returns AssistanceOfferings.ID;
  entity AssistanceLocations            as projection on cloud.AssistanceLocation;
  entity Addresses                      as projection on cloud.Address;
  entity DistrictOfferingAsistance      as projection on cloud.DistrictOfferingAssistance;
  entity SchoolOfferingAssistance       as projection on cloud.SchoolOfferingAssistance;
  entity OrganizationOfferingAssistance as projection on cloud.organizationOfferingAssistance;
  entity Organizations                  as projection on cloud.Organization;
  //  entity LocationForSchool as select from cloud.AssistanceOffering
  //  join cloud.SchoolOfferingAssistance soa on
  //  cloud.AssistanceOffering.ID = soa.assistance;

  //AssistanceOfferings.ID = SchoolOfferingAssistance.ID


  @readonly
  entity EligiblityCategories           as projection on cloud.EligibilityCategory;

  @readonly
  entity OrganizationTypes              as projection on cloud.OrganizationType;

  @readonly
  entity AssistanceSubTypes             as projection on cloud.AssistanceSubType;

  @readonly
  entity Schools                        as projection on cloud.School;

  @readonly
  entity States                         as projection on cloud.State;

  @readonly
  entity Districts                      as projection on cloud.District;

  @readonly
  entity DeliveryModes                  as projection on cloud.DeliveryMode;

  @readonly
  entity AssistanceTypes                as projection on cloud.AssistanceType;

  @readonly
  entity LocationTypes                  as projection on cloud.LocationType;
}


annotate approver.AssistanceLocations with {
  locationType @Common : {
    Text            : name,
    TextArrangement : #TextOnly,
    ValueList       : {
      Label          : 'Assistance Locations',
      CollectionPath : 'LocationTypes',
      Parameters     : [
      {
        $Type             : 'Common.ValueListParameterInOut',
        LocalDataProperty : locationType_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type             : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'locType'
      }
      ]
    }
  }            @title :  'Location Type';
}

annotate approver.AssistanceOfferings with @(UI : {
  LineItem                 : [
  {Value : createdAt},
  {Value : createdBy},
  {Value : assistanceLocation.name},
  {Value : offerApproved},
  {Value : assistanceType.assistanceType},
  {Value : assistanceSubType.subType},
  {Value : eligiblityCategory_ID},
  {
    $Type              : 'UI.DataFieldForAction',
    Label              : 'BulkApproval',
    Action             : 'approver.approveOffer',
    InvocationGrouping : #Changeset
  },
  {
    $Type  : 'UI.DataFieldForAnnotation',
    Label  : 'ApproveOffer',
    Target : '@UI.FieldGroup#ApproveOffer'
  },
  ],
  SelectionFields          : [
  //   assistanceLocation.locationType_ID,
  assistanceLocation_ID,
  //eligiblityCategory_ID,
  offerApproved,
  assistanceType_ID
  ],
  FieldGroup #ApproveOffer : {Data : [{
    $Type  : 'UI.DataFieldForAction',
    Label  : 'ApproveOffer',
    Action : 'approver.approveOffer'
  }]}
}) {
  assistanceLocation @Common : {
    Text            : name,
    TextArrangement : #TextOnly,
    ValueList       : {
      Label          : 'Assistance Locations',
      CollectionPath : 'AssistanceLocations',
      Parameters     : [
      {
        $Type             : 'Common.ValueListParameterInOut',
        LocalDataProperty : assistanceLocation_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type             : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      }
      ]
    }
  }                  @title :  'Assistance Locations Existing';

  assistanceType     @Common : {
    Text            : eligiblityCategory.eligibilityCategory,
    TextArrangement : #TextOnly,
    ValueList       : {
      Label          : 'Assistance Category',
      CollectionPath : 'AssistanceTypes',
      Parameters     : [
      {
        $Type             : 'Common.ValueListParameterInOut',
        LocalDataProperty : assistanceType_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type             : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'assistanceType'
      }
      ]
    }
  }                  @title :  'Assistance Type';

  eligiblityCategory @Common : {
    Text            : eligiblityCategory.eligibilityCategory,
    TextArrangement : #TextOnly,
    ValueList       : {
      Label          : 'Eligibility Category',
      CollectionPath : 'EligiblityCategories',
      Parameters     : [
      {
        $Type             : 'Common.ValueListParameterInOut',
        LocalDataProperty : eligiblityCategory_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type             : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'eligibilityCategory'
      }
      ]
    }
  }                  @title :  'Eligibility Category';
};

annotate approver.AssistanceOfferings with @(UI : {
  HeaderInfo                           : {
    TypeName       : 'Assistance Offers',
    TypeNamePlural : 'Assistance Offers',
    TypeImageUrl   : 'sap-icon://alert',
    Title          : {Value : assistanceLocation.name}
  },

  HeaderFacets                         : [{
    $Type  : 'UI.ReferenceFacet',
    Target : '@UI.FieldGroup#HeaderGeneralInformation'
  }],

  FieldGroup #HeaderGeneralInformation : {Data : [
  {Value : assistanceType.assistanceType},
  {Value : offerApproved},
  {Value : websiteURL},
  {
    $Type  : 'UI.DataFieldForAnnotation',
    Target : 'GenYouth.AssistanceOfferings/@Communication.Contact',
    Label  : 'Contact Person'
  }
  ]}
});

annotate approver.AssistanceOfferings with @(UI : {
  FieldGroup #OfferDetails : {Data : [
  {Value : assistanceSubType.subType},
  {Value : availableMon},
  {Value : availableTue},
  {Value : availableWed},
  {Value : availableThr},
  {Value : availableFri},
  {Value : availableSat},
  {Value : availableSun}
  ]},
  FieldGroup #OfferAddress : {Data : [
  {Value : assistanceLocation.name},
  {Value : assistanceLocation.address.street},
  {Value : eligiblityCategory.eligibilityCategory},
  {Value : createdBy},
  {Value : assistanceSubType.subType}
  ]},
  FieldGroup #AdminData    : {Data : [
  {Value : createdAt},
  {Value : createdBy}
  ]},
  Facets                   : [{
    $Type  : 'UI.CollectionFacet',
    Label  : 'Offer Details',
    ID     : 'OfferAddress',
    Facets : [
      {
        $Type  : 'UI.ReferenceFacet',
        Label  : 'Offer Description',
        Target : '@UI.FieldGroup#OfferDetails'
      },
      {
        $Type  : 'UI.ReferenceFacet',
        Label  : 'Offer Address',
        Target : '@UI.FieldGroup#OfferAddress'
      },
      {
        $Type  : 'UI.ReferenceFacet',
        Label  : 'Admin Data',
        Target : '@UI.FieldGroup#AdminData'
      }
    ]
  }]
});
