using {ZIAMGW_FIORI_TOOL_SRV as external} from './external/ZIAMGW_FIORI_TOOL_SRV';

service catalogService {
    entity funct_locationsSet               as projection on external.funct_locationsSet;
    entity caratteristicheSet               as projection on external.caratteristicheSet;
    entity Caratteristiche_no_linSet        as projection on external.Caratteristiche_no_linSet;
    entity attributiSet                     as projection on external.attributiSet;
    entity search_atinnSet                  as projection on external.search_atinnSet;
    entity search_eqartSet                  as projection on external.search_eqartSet;
    entity search_fltypSet                  as projection on external.search_fltypSet;
    entity search_ingrpSet                  as projection on external.search_ingrpSet;
    entity search_iwerkSet                  as projection on external.search_iwerkSet;
    entity search_linear_unitSet            as projection on external.search_linear_unitSet;
    entity search_swerkSet                  as projection on external.search_swerkSet;
    entity search_tplkzSet                  as projection on external.search_tplkzSet;
    entity search_trpnrSet                  as projection on external.search_trpnrSet;
    entity search_characteristics_valuesSet as projection on external.search_characteristics_valuesSet;
}
