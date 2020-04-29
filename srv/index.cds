using scp.cloud from '../db/schema';


// @(restrict : [
// {
//   grant : 'CREATE',
//   to    : 'authenticated-user'
// },
// {
//   grant : [
//     'UPDATE',
//     'DELETE'
//   ],
//   where : 'createdBy = $user'
// }
// ])
// abstract entity AuthorOnlyEdit {};


service entry {
  //@odata.draft.enabled

  entity AssistanceOfferings @(restrict : [
  {
    grant : 'CREATE',
    to    : 'authenticated-user'
  },
  {
    grant : [
      'UPDATE',
      'DELETE'
    ],
    where : 'createdBy = $user'
  }
  ])                          as projection on cloud.AssistanceOffering;

  action submitOffering(Offering : AssistanceOfferings, SchoolID : Schools.ID) returns AssistanceOfferings.ID;

  entity AssistanceLocations @(restrict : [
  {
    grant : 'CREATE',
    to    : 'authenticated-user'
  },
  {
    grant : [
      'UPDATE',
      'DELETE'
    ],
    where : 'createdBy = $user'
  }
  ])                          as projection on cloud.AssistanceLocation;

  entity Addresses @(restrict : [
  {
    grant : 'CREATE',
    to    : 'authenticated-user'
  },
  {
    grant : [
      'UPDATE',
      'DELETE'
    ],
    where : 'createdBy = $user'
  }
  ])                          as projection on cloud.Address;

  entity DistrictOfferingAsistance @(restrict : [
  {
    grant : 'CREATE',
    to    : 'authenticated-user'
  },
  {
    grant : [
      'UPDATE',
      'DELETE'
    ],
    where : 'createdBy = $user'
  }
  ])                          as projection on cloud.DistrictOfferingAssistance;

  entity SchoolOfferingAssistance @(restrict : [
  {
    grant : 'CREATE',
    to    : 'authenticated-user'
  },
  {
    grant : [
      'UPDATE',
      'DELETE'
    ],
    where : 'createdBy = $user'
  }
  ])                          as projection on cloud.SchoolOfferingAssistance;

  entity OrganizationOfferingAssistance @(restrict : [
  {
    grant : 'CREATE',
    to    : 'authenticated-user'
  },
  {
    grant : [
      'UPDATE',
      'DELETE'
    ],
    where : 'createdBy = $user'
  }
  ])                          as projection on cloud.organizationOfferingAssistance;

  entity Organizations @(restrict : [
  {
    grant : 'CREATE',
    to    : 'authenticated-user'
  },
  {
    grant : [
      'UPDATE',
      'DELETE'
    ],
    where : 'createdBy = $user'
  }
  ])                          as projection on cloud.Organization;

  // extend entities with proper access
  // extend AssistanceOfferings with AuthorOnlyEdit;
  // extend AssistanceLocations with AuthorOnlyEdit;
  // extend Addresses with AuthorOnlyEdit;
  // extend SchoolOfferingAssistance with AuthorOnlyEdit;
  // extend DistrictOfferingAsistance with AuthorOnlyEdit;
  // extend OrganizationOfferingAssistance with AuthorOnlyEdit;
  // extend Organizations with AuthorOnlyEdit;


  @readonly
  entity EligiblityCategories as projection on cloud.EligibilityCategory;

  @readonly
  entity OrganizationTypes    as projection on cloud.OrganizationType;

  @readonly
  entity AssistanceSubTypes   as projection on cloud.AssistanceSubType;

  @readonly
  entity Schools              as projection on cloud.School;

  @readonly
  entity States               as projection on cloud.State;

  @readonly
  entity Districts            as projection on cloud.District;

  @readonly
  entity DeliveryModes        as projection on cloud.DeliveryMode;

  @readonly
  entity AssistanceTypes      as projection on cloud.AssistanceType;

  @readonly
  entity LocationTypes        as projection on cloud.LocationType;
}
