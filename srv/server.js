const cds = require('@sap/cds');
const odatav2proxy = require('@sap/cds-odata-v2-adapter-proxy');

cds.on('bootstrap', (app) => {
  app.use(odatav2proxy());
});

module.exports = cds.server;