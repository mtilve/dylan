// @ts-nocheck
sap.ui.define(
    ["sap/ui/model/odata/v2/ODataModel", "sap/m/MessageBox", "jquery.sap.global"],
    function (ODataModel, MessageBox, jQuery) {
        "use strict";
        return {
            TRELLO_KEY: "",
            TRELLO_TOKEN: "",
            TRELLO_URL: "",
            SPOTIFY_URL: "",
            SPOTIFY_CLIENTID: "",
            SPOTIFY_SECRETID: "",
            SPOTIFY_REDIRECT_URL: "",
            SPOTIFY_CODE: "",
            SPOTIFY_API: "",
            SPOTIFY_SHOWDIALOG: "",
            NO_IMAGE: "",

            getParameterByName: function (name) {
                var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
                return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
            },

            groupBy: function (array, f) {
                let groups = {};
                array.forEach(function (o) {
                    var group = JSON.stringify(f(o));
                    groups[group] = groups[group] || [];
                    groups[group].push(o);
                });
                return Object.keys(groups).map(function (group) {
                    return groups[group];
                });
            },

            //////////////////////////////////////////
            ////////////// TRELLO ///////////////////

            createBoard: function (boardName, artistName) {
                var that = this;
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "POST",
                        url: that.TRELLO_URL + "boards/?key=" + that.TRELLO_KEY + "&token=" + that.TRELLO_TOKEN + "&name=" + boardName + "&defaultLists=false&desc=" + artistName,
                        dataType: "json",
                        success: function (result, status, xhr) {
                            resolve(result);
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            createList: function (boardId, listName) {
                var that = this;
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "POST",
                        url: that.TRELLO_URL + "boards/" + boardId + "/lists?key=" + that.TRELLO_KEY + "&token=" + that.TRELLO_TOKEN + "&name=" + listName,
                        dataType: "json",
                        success: function (result, status, xhr) {
                            resolve(result);
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            timer: function (milliseconds) {
                return new Promise(resolve => setTimeout(resolve, milliseconds));
            },

            loopItem: async function (result, item) {
                var that = this;
                var tasks = [];
                var localModel = this.model;
                for (var i = 0; i < item.length; i++) {
                    var card = that.createCard(result.id, item[i].Year + " " + item[i].Album, item[i].Image);
                    tasks.push(card);
                    await that.timer(5000);
                }
                localModel.setProperty("/currentLists", tasks);
            },

            createListAndCard: function (boardId, item) {
                var that = this;
                var localModel = this.model;
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "POST",
                        url: that.TRELLO_URL + "boards/" + boardId + "/lists?key=" + that.TRELLO_KEY + "&token=" + that.TRELLO_TOKEN + "&name=" + item[0].Decade,
                        dataType: "json",
                        success: function (result, status, xhr) {
                            var prom = that.loopItem(result, item);
                            prom.then(() => {
                                var tasks = localModel.getProperty("/currentLists");
                                const callTasks = () => {
                                    return tasks.reduce((prev, task) => {
                                        return prev
                                            .then(task)
                                            .catch(err => {
                                                console.warn('err', err.message);
                                            });
                                    }, Promise.resolve());
                                };

                                var serial = callTasks(tasks);
                                serial.then(
                                    function (result) {
                                        resolve(result);
                                    },
                                    function (error) {

                                    }
                                );

                            });
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            createCard: function (idList, cardName, urlSource) {
                var that = this;
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "POST",
                        url: that.TRELLO_URL + "cards?key=" + that.TRELLO_KEY + "&token=" + that.TRELLO_TOKEN + "&idList=" + idList + "&name=" + cardName + "&urlSource=" + urlSource,
                        dataType: "json",
                        success: function (result, status, xhr) {
                            resolve(result);
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            getAllBoards: function () {
                var that = this;
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "GET",
                        url: that.TRELLO_URL + "members/me/boards?key=" + that.TRELLO_KEY + "&token=" + that.TRELLO_TOKEN,
                        dataType: "json",
                        success: function (result, status, xhr) {
                            resolve(result);
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            getAllBoardCards: function (boardId) {
                var that = this;
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "GET",
                        url: that.TRELLO_URL + "/boards/" + boardId + "/cards?key=" + that.TRELLO_KEY + "&token=" + that.TRELLO_TOKEN,
                        dataType: "json",
                        success: function (result, status, xhr) {
                            resolve(result);
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            ////////////////////////////////////
            //////////// SPOTIFY //////////////

            requestSpotifyAuthorization: function () {
                let url = this.SPOTIFY_URL + "/authorize";
                url += "?client_id=" + this.SPOTIFY_CLIENTID;
                url += "&response_type=code";
                url += "&redirect_uri=" + encodeURI(this.SPOTIFY_REDIRECT_URL);
                url += "&show_dialog=" + this.SPOTIFY_SHOWDIALOG;
                window.location.href = url;
            },

            fetchSpotifyAccessToken: function (code) {
                var that = this;
                var body = "grant_type=authorization_code";
                body += "&code=" + this.SPOTIFY_CODE;
                body += "&redirect_uri=" + encodeURI(this.SPOTIFY_REDIRECT_URL);
                body += "&client_id=" + this.SPOTIFY_CLIENTID;
                body += "&client_secret=" + this.SPOTIFY_SECRETID;

                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "POST",
                        url: that.SPOTIFY_URL + "/api/token",
                        data: body,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': 'Basic ' + btoa(that.SPOTIFY_CLIENTID + ":" + that.SPOTIFY_SECRETID)
                        },
                        dataType: "json",
                        success: function (result, status, xhr) {
                            resolve(result);
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            refreshAccessToken: function () {
                var that = this;
                var localmodel = this.model;
                var SpotifyTokens = localmodel.getProperty("/SpotifyTokens");
                var body = "grant_type=refresh_token";
                body += "&refresh_token=" + SpotifyTokens.refresh_token;
                body += "&client_id=" + this.SPOTIFY_CLIENTID;

                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        method: "POST",
                        url: that.SPOTIFY_URL + "/api/token",
                        data: body,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': 'Basic ' + btoa(that.SPOTIFY_CLIENTID + ":" + that.SPOTIFY_SECRETID)
                        },
                        dataType: "json",
                        success: function (result, status, xhr) {
                            resolve(result);
                        },
                        error: function (e, o, a) {
                            reject(e);
                        }
                    });
                });
            },

            searchAlbum: function (query) {
                var localModel = this.model;
                var ArtistName = localModel.getProperty("/ArtistName");
                var promise = this.searchSpotifyAlbum(ArtistName + " " + query);
                return promise;
            },

            searchSpotifyAlbum: function (query) {
                var that = this;
                var localmodel = this.model;
                var SpotifyTokens = localmodel.getProperty("/SpotifyTokens");
                if (SpotifyTokens) {
                    return new Promise(function (resolve, reject) {
                        jQuery.ajax({
                            method: "GET",
                            url: that.SPOTIFY_API + "/search?q=" + query + "&type=album&market=US",
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + SpotifyTokens.access_token
                            },
                            dataType: "json",
                            success: function (result, status, xhr) {
                                if (result && result.albums && result.albums.items.length > 0 &&
                                    result.albums.items[0].images && result.albums.items[0].images.length > 0) {
                                    var req = {};
                                    req.external_url = result.albums.items[0].external_urls.spotify;
                                    req.image = result.albums.items[0].images[0].url;
                                    resolve(req);
                                } else {
                                    // no album cover art
                                    resolve(null);
                                }
                            },
                            error: function (e, o, a) {
                                reject(e);
                            }
                        });
                    });
                } else {
                    return new Promise(function (resolve, reject) {
                        reject("");
                    });
                }
            },

            searchSpotifyArtist: function (query) {
                var that = this;
                var localmodel = this.model;
                var SpotifyTokens = localmodel.getProperty("/SpotifyTokens");
                if (SpotifyTokens) {
                    return new Promise(function (resolve, reject) {
                        jQuery.ajax({
                            method: "GET",
                            url: that.SPOTIFY_API + "/search?q=" + query + "&type=artist&market=US",
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + SpotifyTokens.access_token
                            },
                            dataType: "json",
                            success: function (result, status, xhr) {
                                resolve(result);
                            },
                            error: function (e, o, a) {
                                reject(e);
                            }
                        });
                    });
                } else {
                    return new Promise(function (resolve, reject) {
                        reject("");
                    });
                }
            },


        };
    }
);
