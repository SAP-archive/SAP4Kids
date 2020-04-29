using scp.cloud from '../db/schema';

namespace srv;

using CV_GETSCHOOLOFFERS from '../db/cvschema';

service Map {

  entity SchoolOffers(LATITUDE : Double, LONGITUDE : Double, DISTANCEFORSEARCH : Integer, ELIGIBILITYCAT : String(38), ASSISTSUBTYPE : String(38)) as
    select from CV_GETSCHOOLOFFERS (
      IP_LAT : : LATITUDE, IP_LON : : LONGITUDE, PROXIMITY_FILTER : : DISTANCEFORSEARCH, IP_ELIGIBILITYCATEGORY : : ELIGIBILITYCAT, IP_ASSISTANCESUBTYPE : : ASSISTSUBTYPE
    ) {
      *
    };
}
