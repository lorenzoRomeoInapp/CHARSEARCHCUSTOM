/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "charsearchcustom/model/models",
    "sap/ui/model/json/JSONModel",
    'sap/m/MessageBox'
],
    function (UIComponent, Device, models, JSONModel, MessageBox) {
        "use strict";

        return UIComponent.extend("charsearchcustom.Component", {
            metadata: {
                interfaces: ["sap.ui.core.IAsyncContentCreation"],
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                this._sessionWatcher();

                this._setRootUrlModel();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            },

            _setRootUrlModel: function () {
                //set model with root service url
                let srUrlJsonModel = new JSONModel();
                let src = "";

                for (let i = document.scripts.length - 1; i >= 0; i--) {
                    let iScript = document.scripts[i];
                    if (iScript.src.indexOf("Component-preload") >= 0) {
                        src = iScript.src;
                        break;
                    }
                }

                let srcUrl = src.split("charsearchcustom")[0] + "charsearchcustom";
                if (srcUrl.indexOf("applicationstudio") >= 0) {
                    srcUrl = "";
                }

                let jsonSrvUrl = {};
                jsonSrvUrl.rootUrl = srcUrl;
                srUrlJsonModel.setData(jsonSrvUrl);
                this.setModel(srUrlJsonModel, "modelRootUrl");
            },

            _sessionWatcher: function () {
                // Configurazione del controllo della sessione
                // Durata della sessione in millisecondi (es. 30 minuti)
                let minuti = 30;
                const durataSessione = minuti * 60 * 1000;
                let minWarning = minuti - 5;
                const durataWarning = minWarning * 60 * 1000;

                // Identificatore del timeout della sessione
                let timeoutSessione;
                let timeoutWarning;

                // Funzione per avviare il timer della sessione
                function avviaSessione() {
                    // Cancella il timeout precedente, se presente
                    clearTimeout(timeoutSessione);
                    clearTimeout(timeoutWarning);

                    // Avvia un nuovo timeout per la sessione
                    timeoutSessione = setTimeout(sessioneScaduta, durataSessione);
                    timeoutWarning = setTimeout(sessioneWarning, durataWarning);
                }

                // Funzione da chiamare quando la sessione è scaduta
                function sessioneScaduta() {
                    // Mostra l'alert o esegui altre azioni desiderate
                    //alert('La sessione è scaduta.');
                    MessageBox.show("La sessione è scaduta", {
                        icon: MessageBox.Icon.ERROR,
                        title: "Error",
                        onClose: function (oAction) {
                            //azione da eseguire nella chiusura del message box
                            location.reload(true);
                        }
                    });
                }

                //  Funzione da chiamare quando la sessione sta per scadere
                function sessioneWarning() {
                    // Mostra l'alert o esegui altre azioni desiderate
                    sap.m.MessageToast.show("La sessione sta per scadere.");
                }

                // Avvia la sessione
                avviaSessione();

                //se viene effettuato un click o viene utilizzata la tastiera il timer si aggiorna
                document.addEventListener('click', avviaSessione);
                document.addEventListener('keydown', avviaSessione);
            }

        });
    }
);