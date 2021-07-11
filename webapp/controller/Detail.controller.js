// @ts-nocheck
sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "dylan/bob/utils/utils",
        "dylan/bob/utils/formatter",
        "sap/m/MessageBox",
        "sap/ui/core/Fragment"
    ],
    function (
        Controller,
        utils,
        formatter,
        MessageBox,
        Fragment
    ) {
        "use strict";

        return Controller.extend("dylan.bob.controller.Detail", {
            formatter: formatter,
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("detail").attachMatched(this.initController, this);
                // Init
                this.getView().setModel(utils.model);
            },

            initController: function (oEvent) {
                var that = this;
                var localModel = utils.model;
                localModel.setProperty("/FileData", []);
                localModel.setProperty("/BoardName", "");
                localModel.setProperty("/ArtistName", "");
                localModel.setProperty("/CurrentBoard", {});
                localModel.setProperty("/FileUploader", "");
            },

            onAfterRendering: function () {
            },

            onNavPressBack: function (oEvent) {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("home", {}, true);
            },

            handleFileUploaderChange: function (oEvent) {
                var that = this;
                var oBusyDialog = new sap.m.BusyDialog();
                var file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
                if (file && window.FileReader) {
                    var reader = new FileReader();
                    reader.onloadstart = function (evt) {
                        oBusyDialog.setText("Cargando archivo.");
                        oBusyDialog.open();
                    };
                    reader.onloadend = function (evt) {
                        var data = evt.target.result;
                        var table = [];
                        var promises = [];
                        var lines = data.split("\n");
                        for (let line of lines) {
                            if (line.trim()) {
                                var r = line.split(/^([0-9]{4})(\s+?)/);
                                r.shift();
                                if (r && r.length == 3) {
                                    var row = {};
                                    row.Year = r[0];
                                    row.Album = r[2];
                                    row.Image = utils.NO_IMAGE;
                                    row.External_url = "";
                                    row.Decade = r[0].match(/\d{4}$/)[0].replace(/\d$/, '0');
                                    table.push(row);
                                    var p = utils.searchAlbum(row.Album);
                                    promises.push(p);
                                }
                            }
                        }

                        Promise.all(promises).then((results) => {
                            for (var i = 0; i < results.length; i++) {
                                if (results[i]) {
                                    table[i].Image = results[i].image;
                                    table[i].External_url = results[i].external_url;
                                }
                            }

                            utils.model.setProperty("/FileData", table);
                            oBusyDialog.close();
                        });

                    };
                    reader.onerror = function (evt) {
                        oBusyDialog.close();
                        MessageBox.error("Ocurrió un error al cargar el archivo.", {
                            title: "Error"
                        });
                    };

                    reader.readAsText(file);
                }
            },

            validateFields: function () {
                var localModel = utils.model;
                var ArtistName = localModel.getProperty("/ArtistName");
                var BoardName = localModel.getProperty("/BoardName");
                if (!ArtistName || !BoardName) {
                    return false;
                }
                return true;
            },

            handleNewBoard: function (oEvent) {
                var that = this;
                var localModel = utils.model;
                if (this.validateFields()) {
                    var ArtistName = localModel.getProperty("/ArtistName");
                    this.getView().setBusy(true);
                    var i18n = that.getView().getModel("i18n");
                    var boardErrorMessage = i18n.getResourceBundle().getText("boardErrorMessage");
                    var boardName = localModel.getProperty("/BoardName");
                    var promise = utils.createBoard(boardName, ArtistName);
                    promise.then(
                        function (result) {
                            that.getView().setBusy(false);
                            localModel.setProperty("/CurrentBoard", result);
                            that.createLists(result.id);
                        },
                        function (error) {
                            that.getView().setBusy(false);
                            console.log("Error al crear el Tablero: " + error.responseText);
                            sap.m.MessageBox.error(error.responseText, {
                                title: boardErrorMessage,
                                actions: [MessageBox.Action.OK]
                            });
                        }
                    );
                } else {
                    var i18n = that.getView().getModel("i18n");
                    var requiredErrorMessage = i18n.getResourceBundle().getText("requiredErrorMessage");
                    sap.m.MessageBox.warning(requiredErrorMessage, {
                        actions: [MessageBox.Action.OK]
                    });
                }
            },

            loopGroups: async function (idBoard, oGroup) {
                var tasks = [];
                var localModel = utils.model;
                var that = this;
                for (var i = 0; i < oGroup.length; i++) {
                    var prom = utils.createListAndCard(idBoard, oGroup[i]);
                    tasks.push(prom);
                    await utils.timer(5000);
                }
                localModel.setProperty("/currentTasks", tasks);
            },

            createLists: function (idBoard) {
                var that = this;
                var localModel = utils.model;
                that.getView().setBusy(true);
                var FileData = utils.model.getProperty("/FileData");
                var idArray = this.getView().byId("table").getBinding().aIndices;
                var ordered = [];
                for (var j = 0; j < idArray.length; j++) {
                    ordered.push(FileData[idArray[j]]);
                }
                var oGroup = utils.groupBy(ordered, function (item) {
                    return [item.Decade];
                });
                var oGroup = oGroup.reverse();
                utils.model.setProperty("/FileDataGroup", oGroup);
                var prom = that.loopGroups(idBoard, oGroup);
                prom.then(() => {
                    var tasks = localModel.getProperty("/currentTasks");
                    const callTasks = () => {
                        return tasks.reduce((prev, task) => {
                            return prev
                                .then(task)
                                .catch(err => {
                                    console.warn('err', err.message);
                                });
                        }, Promise.resolve());
                    };

                    var lists = localModel.getProperty("/currentLists");
                    callTasks(tasks);
                    var final = lists.concat(tasks);
                    Promise.all(final).then(() => {
                        that.getView().setBusy(false);
                        sap.m.MessageBox.success("Success", {
                            actions: [MessageBox.Action.OK],
                            onClose: function () {
                                var oEventBus = sap.ui.getCore().getEventBus();
                                oEventBus.publish("MyChannel", "doStuff", {});

                                var oRouter = that.getOwnerComponent().getRouter();
                                oRouter.navTo("home", {}, true);
                            },
                        });
                    });
                });
            },

            //////////////////////////////////
            ////////// SEARCH FRAGMENT //////

            onValueHelpRequest: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();
                var localModel = utils.model;
                localModel.setProperty("/ArtistCollection", []);
                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "dylan.bob.view.Search",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oDialog) {
                    oDialog.open(sInputValue);
                });
            },

            onValueHelpSearch: function (oEvent) {
                var localModel = utils.model;
                var sValue = oEvent.getParameter("value");
                var def = utils.searchSpotifyArtist(sValue);
                def.then(
                    function (result) {
                        var resp = [];
                        if (result && result.artists && result.artists.items && result.artists.items.length > 0) {
                            for (var item of result.artists.items) {
                                var r = {};
                                r.name = item.name;
                                r.picture = (item.images && item.images.length > 0) ? item.images[0].url : "";
                                resp.push(r);
                            }
                        }
                        localModel.setProperty("/ArtistCollection", resp);
                    },
                    function (error) {
                        localModel.setProperty("/ArtistCollection", []);
                    }
                );
            },

            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                if (!oSelectedItem) {
                    return;
                }
                this.byId("artistInput").setValue(oSelectedItem.getTitle());
            }

        });
    }
);
