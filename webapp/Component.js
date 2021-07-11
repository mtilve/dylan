sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
    "dylan/bob/model/models",
	"dylan/bob/utils/utils",
], function (UIComponent, Device, models, utils) {
	"use strict";

	return UIComponent.extend("dylan.bob.Component", {

	metadata: {
            manifest: "json",
			includes: ["css/style.css"],
		},

		init: function () {

            var modulePath = jQuery.sap.getModulePath(this.getManifestObject().getComponentName());
            jQuery.sap.registerModulePath("com.penninkhof.controls", modulePath + "/control");

			var deviceModel = new sap.ui.model.json.JSONModel({
				isTouch: sap.ui.Device.support.touch,
				isNoTouch: !sap.ui.Device.support.touch,
				isPhone: sap.ui.Device.system.phone,
				isNoPhone: !sap.ui.Device.system.phone,
				listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
			});

			deviceModel.setDefaultBindingMode("OneWay");

            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(500);
			this.setModel(oModel);
            utils.model = oModel;
            
			// set the device model
            this.setModel(deviceModel, "device");

            var oModel = new sap.ui.model.json.JSONModel()
            oModel.loadData("config/config.json");
            oModel.attachRequestCompleted(function(oEventModel){
                var oData = oModel.getData();
                utils.TRELLO_KEY = oData.TRELLO_KEY,
                utils.TRELLO_TOKEN = oData.TRELLO_TOKEN,
                utils.TRELLO_URL = oData.TRELLO_URL,
                utils.SPOTIFY_URL = oData.SPOTIFY_URL,
                utils.SPOTIFY_CLIENTID = oData.SPOTIFY_CLIENTID,
                utils.SPOTIFY_SECRETID = oData.SPOTIFY_SECRETID,
                utils.SPOTIFY_REDIRECT_URL = oData.SPOTIFY_REDIRECT_URL,
                utils.SPOTIFY_CODE = oData.SPOTIFY_CODE,
                utils.SPOTIFY_API = oData.SPOTIFY_API,
                utils.SPOTIFY_SHOWDIALOG = oData.SPOTIFY_SHOWDIALOG,
                utils.NO_IMAGE = oData.NO_IMAGE
            });

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
            this.getRouter().initialize();
        }
	});
});
