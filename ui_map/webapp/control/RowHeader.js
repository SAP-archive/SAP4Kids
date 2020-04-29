sap.ui.define(
  ["sap/ui/core/Control", "sap/ui/core/Icon"],
  function (Control, Icon) {
    return Control.extend("com.sap4kids.resourcelocator.control.RowHeader", {
      metadata: {
        properties: {
          title: { type: "string" },
          address: { type: "string" },
          website: { type: "string" },
          offerings: { type: "object" },
          type: { type: "string" },
          eligibility: { type: "string" },
          noData: { type: "string" },
          comment: { type: "string" },
          hidden: { type: "boolean", defaultValue: false },
          showCloseBtn: { type: "boolean" }
        },
        aggregations: {
          _webIcon: { type: "sap.ui.core.Icon", multiple: false, visibility: "hidden" },
          _navIcon: { type: "sap.ui.core.Icon", multiple: false, visibility: "hidden" },
          _closeIcon: { type: "sap.ui.core.Icon", multiple: false, visibility: "hidden" },
          times: { type: "com.sap4kids.resourcelocator.control.OfferingTime", multiple: true }
        },
        events: {
          triggerNavigator: {}
        }
      },

      init: function () {
        this.setAggregation("_navIcon", new Icon({
          src: "sap-icon://map-2",
          tooltip: "{i18n>tooltip.navigation}",
          height: "25px",
          width: "25px",
          size: "22px",
          press: function () {
            this.fireTriggerNavigator();
          }.bind(this)
        }));
        this.setAggregation("_webIcon", new Icon({
          src: "sap-icon://action",
          tooltip: "{i18n>tooltip.website}",
          height: "25px",
          width: "25px",
          size: "22px",
          press: function () {
            window.open(this.getWebsite(), "_blank");
          }.bind(this)
        }));
        this.setAggregation("_closeIcon", new Icon({
          src: "sap-icon://decline",
          tooltip: "{i18n>close}",
          height: "25px",
          width: "25px",
          size: "22px",
          press: function () {
            this.setHidden(true);
          }.bind(this)
        }));
      },

      renderer: {
        apiVersion: 2,
        render: function (oRm, oControl) {
          oRm.openStart("div", oControl);
          oRm.class("calander-item");

          if (oControl.getHidden()) {
            oRm.attr("style", "display:none");
          }
          oRm.openEnd();

          if (!oControl.getHidden()) {

            if (!oControl.getEligibility()) {
              oRm.openStart("div");
              oRm.class("");
              oRm.openEnd();
              oRm.text(oControl.getNoData());
              oRm.close("div");
            } else {

              oRm.openStart("div");
              oRm.class("institution-assistance-container");
              oRm.openEnd();


              oRm.openStart("div");
              oRm.class("institution-container");
              oRm.openEnd();

              oRm.openStart("div");
              oRm.class("institution");
              oRm.openEnd();

              oRm.openStart("div");
              oRm.class("name");
              oRm.openEnd();

              oRm.text(oControl.getTitle());

              oRm.close("div");

              oRm.openStart("div");
              oRm.class("address");
              oRm.openEnd();
              oRm.text(oControl.getAddress());
              oRm.close("div");

              oRm.close("div");

              oRm.openStart("div");
              oRm.class("buttons");
              oRm.openEnd();

              if (oControl.getWebsite()) {
                oRm.openStart("div");
                oRm.class("button");
                oRm.openEnd();
                oRm.renderControl(oControl.getAggregation("_webIcon"));

                oRm.close("div");
              }

              oRm.openStart("div");
              oRm.class("button");
              oRm.openEnd();
              oRm.renderControl(oControl.getAggregation("_navIcon"));

              oRm.close("div");

              if (oControl.getShowCloseBtn()) {
                oRm.openStart("div");
                oRm.class("button");
                oRm.openEnd();
                oRm.renderControl(oControl.getAggregation("_closeIcon"));

                oRm.close("div");
              }

              oRm.close("div");

              oRm.close("div");

              oRm.openStart("div");
              oRm.class("assistance");
              oRm.openEnd();

              oRm.openStart("div");
              oRm.class("items");
              oRm.openEnd();

              oRm.openStart("div");
              oRm.class("assistance-type");
              oRm.openEnd();
              oRm.text("How: " + oControl.getType());
              oRm.close("div");

              oRm.openStart("div");
              oRm.class("item");
              oRm.class("item-food");
              oRm.openEnd();

              oRm.openStart("div");
              oRm.class("sub-items");
              oRm.openEnd();

              if (oControl.getAggregation("times")) {
                oControl.getAggregation("times").forEach(function (oTime) {
                  oRm.renderControl(oTime);
                });
              }

              oRm.close("div");

              oRm.close("div");

              oRm.close("div");

              oRm.openStart("div");
              oRm.class("comments");
              oRm.openEnd();

              oRm.openStart("div");
              oRm.class("assistance-type");
              oRm.openEnd();
              oRm.text("Who: " + oControl.getEligibility());
              oRm.close("div");

              oRm.openStart("div");
              oRm.class("comment");
              oRm.openEnd();
              oRm.text(oControl.getComment());
              oRm.close("div");

              // oRm.openStart("div");
              // oRm.class("comment");
              // oRm.openEnd();
              // oRm.text("Water package is only for school kids.");
              // oRm.close("div");

              oRm.close("div");

              oRm.close("div");

              oRm.close("div");
            }
          }


          oRm.close("div");
        }
      }
    });
  }
);
