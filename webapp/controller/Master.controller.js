// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "dylan/bob/utils/utils",
    "dylan/bob/utils/formatter",
    "sap/ui/Device",
    "sap/m/MessageBox",
], function (Controller, utils, formatter, Device, MessageBox) {
    "use strict";

    return Controller.extend("dylan.bob.controller.Master", {
        formatter: formatter,
        _busy: new sap.m.BusyDialog(),
        onInit: function () {
            var that = this;
            that._busy = new sap.m.BusyDialog();

            this.getView().setModel(utils.model);
            var localModel = this.getView().getModel();
            localModel.setProperty("/Boards", []);
            localModel.setProperty("/SpotifyTokens", {});

            // Spotify
            var code = utils.getParameterByName("code");
            if (!code) {
                utils.requestSpotifyAuthorization();
            } else {
                utils.SPOTIFY_CODE = code;
                var def = utils.fetchSpotifyAccessToken();
                def.then(
                    function (data) {
                        //console.log(data);
                        localModel.setProperty("/SpotifyTokens", data);
                        window.history.pushState("", "", utils.SPOTIFY_REDIRECT_URL);
                    },
                    function (error) {
                        window.history.pushState("", "", utils.SPOTIFY_REDIRECT_URL);
                        var i18n = that.getView().getModel("i18n");
                        var spotifyErrorMessage = i18n.getResourceBundle().getText("spotifyErrorMessage");
                        //that.getView().setBusy(false);
                        console.log("Error al obteber el token de spotify: " + error.responseText);
                        sap.m.MessageBox.error(error.responseText, {
                            title: spotifyErrorMessage,
                            actions: [MessageBox.Action.OK]
                        });
                    }
                );
            }
        },

        onAfterRendering: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("MyChannel", "doStuff", this.initControllerReload, this);

            this.loadMaster();
        },


        initControllerReload: function () {
            var that = this;
            var localModel = this.getView().getModel();
            var noDataMsg = localModel.getProperty("/noDataMsg");
            that.loadMaster();
        },

        loadMaster: function () {
            var that = this;
            var oView = that.getView();
            var localModel = utils.model;

            oView.setBusy(true);
            var boards = utils.getAllBoards();
            boards.then(
                function (result) {
                    localModel.setProperty("/Boards", result);
                    localModel.refresh(true);
                    oView.setBusy(false);
                },
                function (error) {
                    localModel.refresh(true);
                    oView.setBusy(false);
                }
            );
        },

        handleNewRequest: function (oEvent) {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo(
                "detail", {
            }, !Device.system.phone
            );
            oRouter.getTargets().display("detail");
        },

        handleListSelect: function (oEvent) {
            var localModel = utils.model;
            var oPath = oEvent.getParameter("listItem").getBindingContextPath();
            var sItem = utils.model.getProperty(oPath);
            var sRouter = this.getOwnerComponent().getRouter();
            if (this._prevSelect) {
                this._prevSelect.$().css('background-color', '');
            }
            var item = oEvent.getParameter('listItem');
            item.$().css('background-color', '#9ad9f5b5');
            this._prevSelect = item;
            localModel.setProperty("/SelectedBoard", sItem);
            sRouter.navTo(
                "request", {
                id: sItem.id,
            }, !Device.system.phone
            );
            sRouter.getTargets().display("request");
        },


        onFilterApplyPress: function (oEvent) {
            var query = oEvent.getParameter("query");
            if (!query) {
                query = "";
            }

            var oFilter1 = new sap.ui.model.Filter(
                "name",
                sap.ui.model.FilterOperator.Contains,
                query
            );

            var oFilter2 = new sap.ui.model.Filter(
                "id",
                sap.ui.model.FilterOperator.Contains,
                query
            );

            var comFil = new sap.ui.model.Filter([oFilter1, oFilter2]);
            var list = this.getView().byId("emplist");
            list.removeSelections();
            var binding = list.getBinding("items");
            binding.filter(comFil, sap.ui.model.FilterType.Control);

        }
    });

});