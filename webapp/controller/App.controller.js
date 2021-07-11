sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function(Controller, JSONModel) {
	"use strict";

	return Controller.extend("dylan.bob.controller.App", {

		onInit: function() {
			var oViewModel;
			oViewModel = new JSONModel({
				busy : false,
				delay : 0
			});
			this.getView().setModel(oViewModel, "appView");
		}

	});

});