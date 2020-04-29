sap.ui.define(
  ["sap/ui/core/Control"],
  function (Control) {
    return Control.extend("com.sap4kids.resourcelocator.control.OfferingTime", {
      metadata: {
        properties: {
          type: { type: "string" },
          days: { type: "string" },
          hours: { type: "string" }
        }
      },

      renderer: {
        apiVersion: 2,
        render: function (oRm, oControl) {

          oRm.openStart("div", oControl);
          oRm.class("sub-item");
          oRm.openEnd();

          oRm.openStart("div");
          oRm.class("sub-item-days");
          oRm.openEnd();

          oRm.openStart("div");
          oRm.class("type");
          oRm.openEnd();
          oRm.text(oControl.getType());
          oRm.close("div");

          oRm.openStart("div");
          oRm.class("type");
          oRm.openEnd();
          oRm.text(oControl.getDays());
          oRm.close("div");

          oRm.close("div");

          oRm.openStart("div");
          oRm.class("time");
          oRm.openEnd();
          oRm.text(oControl.getHours());
          oRm.close("div");

          oRm.close("div");

        }
      }
    });
  }
);
