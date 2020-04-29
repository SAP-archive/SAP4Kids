# Architecture

## Diagram

The project consists of the following modules and services:
![Diagram](scp_architecture.png)

<dl>
  <dt><strong>Application Router</strong>  - <code>approuter</code> </dt>
  <dd>The entry point of the application which redirects all incoming traffic to the server module and the HTML5 application repository. The module also prompts the user for credentials if needed.</dd>
  <dt><strong>CAP Server</strong>  - <code>srv</code> </dt>
  <dd>Connects to the HDI container and exposes the OData services via HTTP.</dd>
  <dt><strong>UI deployer task</strong>  - <code>deployer</code> </dt>
  <dd>This module contains the webapp resources and uploads them to the HTML5 application repository during deploy time. </dd>
  <dt><strong>DB deployer task</strong>  - <code>db</code>  </dt>
  <dd>A Cloud Foundry tasks that will run once to set up the schema in the HDI container and to import the sample data. Once these steps are completed, the app will shut down and stop consuming memory and CPU quota.</dd>
  <dt><strong>Webapps</strong>  - <code>ui_approver</code>, <code>ui_form</code> and <code>ui_map</code> </dt>
  <dd>This folder are not modules and won't be included in the <code>.mtar</code> package. The built UI source file need to be moved in a subfolder of the UI deployer module mentioned above </dd>
  <dt><strong>XSUAA</strong>  - <code>xs-security.json</code> </dt>
  <dd>This file defines the scopes, role templates and role collections of the application.</dd>
  <dt><strong>SAP Web Analytics</strong> </dt>
  <dd>This optional service can be used to track the user interaction with the web apps. For more info, please refer to <a href="https://developers.sap.com/mission.cp-web-analytics-get-started.html" target="blank">this tutorial</a> </dd>
  <dt><strong>Identity Authentication tentent</strong> </dt>
  <dd>This optional service can be used as a replacement the default SAP ID service. Use this service if you want to allow users to create an account for your self-hosted application.</dd>
</dl>


The [project descriptor file](../mta.yaml) also defines the backing services of the project. In this case, the SAP HANA service, the XSUAA service, and the HTML5 application repository.

## Code Highlights

###  How to expose a calc view in CAP?
There are three steps necessary to expose a calc view:
1. Add the calc view definition file, here: [db/src/CV_SAP4KIDS.hdbcalculationview](../db/src/CV_SAP4KIDS.hdbcalculationview).
2. Make CAP aware of the data structure of this [existing DB entity](../db/cvschema.cds#L3-L28).
3. Expose the [entity in the service definition](../srv/map-hana.cds#L5-L15).


###  How to simulate a calc view with SQLite?
In our situation, it has been possible to use a local DB that returns mocks the calc view and its data structure. In contrast to the calc view, the SQLite view doesn't filter the returned records for their location. This is not a problem for us as the local mock DB contains significantly fewer data than the production DB.
1. Create a new file that contains a service definition that returns the same data structure as the calc view, here: [/srv/map-sqlite.cds](../srv/map-sqlite.cds).
2. Declare that the newly created file should [only be used in the non-production scenarios](../.cdsrc.json#L23-L70) and the already existing `/srv/map-hana.cds` file only in production scenarios.

###  Which authorization checks are performed and where?
This project contains three web apps and therefore, the backend also provides three different services:
* Map service

  This service is publicly accessible but with read-only permissions.

* Entry app

  This service allows authenticated users to create new entities (of various types). The users also need to be able to read data to be warned if there is already an existing record to avoid duplicate data. In case the creation is not successful, they need to be able to roll back the changes, e.g. remove the data they created.

  All these restrictions can be implemented with an `@restrict` annotation in the [service definition](../srv/index.cds#L23-L34).

* Approver app

  An admin can use this service to approve submitted offerings by flipping a flag. Users with the `admin` scope are able to [update and remove any record](../srv/approver.cds#L3-L10).


###  How to serve many web apps from one html5 app repo/app router?
In this project, all web apps are uploaded to the HTML5 Application Repository by a single deployer module.
1. Make sure the built web apps will be placed in the `resources` folder of the deployer module (one subfolder per web app). This can be included in the [`ui5 build` command](../package.json#L24-L27).
2. The [deployer module](../deployer/package.json) will do all the magic from here on.


It is not necessary to define routes to the HTML5 Application Repository in the Application Router. You are use paths like `domain/<app id from manifest>` to access the web app.


###  How to define different scaling parameters for different deployment environments (dev vs prod)?
The load the project has to handle in the development environment is significantly fewer than in production. That's why it makes sense to deploy fewer instances of the microservice in development (and allocate less memory per instance):
1. Override the default (dev) settings from the `mta.yaml` in the [`production.mtaex`](../production.mtaex) (MTA extension).
2. Include this extension in the [deploy command](../package.json#L27).

###  How to implement a splash screen with UI5?
The inspiration to add a splash screen came from Peter Muessig in [this blog post](https://blogs.sap.com/2020/04/09/ui5ers-buzz-50-the-loading-evolution-get-the-most-out-of-your-ui5-app) where he described how to speed up the performance of UI5 apps.

1. [Add the splash screen](../ui_map/webapp/index.html#L37-L43) to the `index.html` file so it is visible as soon as the file is loaded.
2. We want to load the corresponding CSS as soon as possible (before UI5 loads its styles) which is why we moved these styles to [a new file](../ui_map/webapp/css/splash.css).
3. Last but not least, we remove the splash screen in the [`onInit` hook of the controller](../ui_map/webapp/controller/MapView.controller.js#L17).

###  What is the npm script `workaround` doing?
We noticed that the deployer module and the HTML5 Application Repository don't like hidden files such as the `.DS_Store` files which are typical for Macs. If such a file is present, the deploy will fail ☠️. We added the script `workaround` to remove all these files easily.


###  How to use the new UI5 control rendering API?
The new version of the rendering API allows support for DOM patching when the properties of the control change. To summarize it in one sentence, this new API will help you to make your app more performant. There's another [great blog post from Peter Muessig](https://blogs.sap.com/2020/04/20/ui5ers-buzz-52-the-rendering-evolution-semantic-rendering-and-css-variables/) you can check out to learn more about this.

This project includes two custom controls which use the new rendering API: [RowHeader.js](../ui_map/webapp/control/RowHeader.js#L63-L206) and [OfferingTime.js](../ui_map/webapp/control/OfferingTime.js#L14-L45) - note the line ` apiVersion: 2,` which defines the used API.
