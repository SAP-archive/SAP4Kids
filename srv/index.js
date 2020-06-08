const cds = require("@sap/cds");

module.exports = cds.service.impl(async (srv) => {
    const {
        AssistanceOfferings,
        DistrictOfferingAssistance,
        SchoolOfferingAssistance,
        OrganizationOfferingAssistance
    } = srv.entities;


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
                await tx.run(
                    DELETE(SchoolOfferingAssistance)
                        .where({
                            ASSISTANCE_ID: req.data.ID
                        })
                )
            );
    });
});