const cds = require("@sap/cds");

module.exports = cds.service.impl(async (srv) => {
  const {
    AssistanceOfferings,
    DistrictOfferingAssistance,
    SchoolOfferingAssistance,
    OrganizationOfferingAssistance
  } = srv.entities;

  srv.on("approveOffer", "AssistanceOfferings", async req => {
    const tx = cds.transaction(req);
    await tx
      .run(
        UPDATE(AssistanceOfferings)
          .set({
            offerApproved: req.data.offerApproved
          })
          .where({
            ID: req.query.SELECT.where[2].val
          })
      )
      .then(
        req.info({
          "code": 204,
          "message": "Approval status changed",
          "numericSeverity": 1
        })
      );
  });

  // Bugfix:  Delete relationship links from associations (since not defined as Compositions)
  srv.before("DELETE", "AssistanceOfferings", async req => {
    const tx = cds.transaction(req);
    await tx
      .run(
        DELETE(OrganizationOfferingAssistance)
          .where({
            ASSISTANCE_ID: req.data.ID
          })
      )
      .then(
        DELETE(SchoolOfferingAssistance)
          .where({
            ASSISTANCE_ID: req.data.ID
          })
      );
  });


});
