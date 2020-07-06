using scp.cloud from '../db/schema';

namespace srv;

using {
  CV_GETSCHOOLOFFERS,
  CV_GETSCHOOLOFFERS_TYPE
} from '../db/cvschema';

service Map @(impl : 'map.js') {

  entity SchoolOffers(LATITUDE : Double, LONGITUDE : Double, DISTANCEFORSEARCH : Integer)                                 as
    select from CV_GETSCHOOLOFFERS (
      IP_LAT : : LATITUDE, IP_LON : : LONGITUDE, PROXIMITY_FILTER : : DISTANCEFORSEARCH
    ) {
      *
    };

  entity SchoolOffersByType(LATITUDE : Double, LONGITUDE : Double, DISTANCEFORSEARCH : Integer, ASSISTANCETYPES : String) as
    select from CV_GETSCHOOLOFFERS_TYPE (
      IP_LAT : : LATITUDE, IP_LON : : LONGITUDE, PROXIMITY_FILTER : : DISTANCEFORSEARCH, IP_ASSISTANCETYPE_ID : : ASSISTANCETYPES
    ) {
      *
    };

  @readonly
  entity AssistanceTypes                                                                                                  as projection on cloud.AssistanceType;
}
