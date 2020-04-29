const cds = require("@sap/cds");

module.exports = cds.service.impl(async srv => {
    const {
        AssistanceOfferings
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
});
