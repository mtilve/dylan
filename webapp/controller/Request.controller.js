// @ts-nocheck
sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "dylan/bob/utils/utils",
        "sap/ui/Device",
        "dylan/bob/utils/formatter",
        "sap/m/MessageBox",
    ],
    function (
        Controller,
        utils,
        Device,
        formatter,
        MessageBox
    ) {
        "use strict";

        return Controller.extend("dylan.bob.controller.Request", {
            formatter: formatter,
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("request").attachMatched(this.initControllerRequest, this);
                // Init
                this.getView().setModel(utils.model);
            },

            initControllerRequest: function (oEvent) {
                var that = this;
                var localModel = utils.model;
                var ID = oEvent.getParameter("arguments").id;
                if (!ID) {
                    this.onNavPressBack();
                }
                var oArtist = localModel.getProperty("/SelectedBoard/desc");
                oArtist = oArtist ? oArtist : "";
                localModel.setProperty("/ArtistName", oArtist);
                that.getView().setBusy(true);
                var def = utils.getAllBoardCards(ID);
                def.then(
                    function (results) {
                        var table = [];
                        var promises = [];
                        for (let result of results) {
                            if (result && result.name.trim()) {
                                var r = result.name.split(/^([0-9]{4})(\s+?)/);
                                r.shift();
                                if (r && r.length == 3) {
                                    var row = {};
                                    row.Year = r[0];
                                    row.Album = r[2];
                                    row.Image = utils.NO_IMAGE;
                                    row.External_url = "";
                                    table.push(row);
                                    var p = utils.searchAlbum(row.Album);
                                    promises.push(p);
                                }
                            }
                        }

                        Promise.all(promises).then((data) => {
                            for (var i = 0; i < data.length; i++) {
                                if (data[i]) {
                                    table[i].Image = data[i].image;
                                    table[i].External_url = data[i].external_url;
                                }
                            }
                            that.getView().setBusy(false);
                            localModel.setProperty("/CurrentLists", table);
                        });
                    },
                    function (error) {
                        that.getView().setBusy(false);
                        localModel.setProperty("/CurrentLists", []);
                        console.log("Error al crear al obtener las listas del board: " + error.responseText);
                    }
                );

            },

            onNavPressBack: function (oEvent) {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("home", {}, true);
            },

        });
    }
);
