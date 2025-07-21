const cds = require('@sap/cds');

module.exports = cds.service.impl(async function (srv) {
    srv.before('*', (req) => {
        //insert code here
    });

    const iamGtwService = await cds.connect.to('ZIAMGW_FIORI_TOOL_SRV');

    this.on('READ', 'funct_locationsSet', async request => {
        console.log("Sono nel handler - entity: funct_locationsSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'caratteristicheSet', async request => {
        console.log("Sono nel handler - entity: caratteristicheSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'Caratteristiche_no_linSet', async request => {
        console.log("Sono nel handler - entity: Caratteristiche_no_linSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'attributiSet', async request => {
        console.log("Sono nel handler - entity: attributiSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_atinnSet', async request => {
        console.log("Sono nel handler - entity: search_atinnSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_eqartSet', async request => {
        console.log("Sono nel handler - entity: search_eqartSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_fltypSet', async request => {
        console.log("Sono nel handler - entity: search_fltypSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_ingrpSet', async request => {
        console.log("Sono nel handler - entity: search_ingrpSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_iwerkSet', async request => {
        console.log("Sono nel handler - entity: search_iwerkSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_linear_unitSet', async request => {
        console.log("Sono nel handler - entity: search_linear_unitSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_swerkSet', async request => {
        console.log("Sono nel handler - entity: search_swerkSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_tplkzSet', async request => {
        console.log("Sono nel handler - entity: search_tplkzSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });
    
    this.on('READ', 'search_trpnrSet', async request => {
        console.log("Sono nel handler - entity: search_trpnrSet");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });

    this.on('READ', 'search_characteristics_valuesSet', async request => {
        console.log("Sono nel handler - entity: search_characteristics_values");
        const result = await iamGtwService.tx(request).run(request.query);
        return result;
    });
});