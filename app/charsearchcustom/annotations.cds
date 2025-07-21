using catalogService as service from '../../srv/cat-service';

annotate service.funct_locationsSet with @(UI.LineItem: [
    {
        $Type: 'UI.DataField',
        Label: 'Sede tecnica',
        Value: Tplnr,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Descrizione sede tecnica',
        Value: Pltxt,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Punto iniziale strada',
        Value: StartPoint,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Punto finale strada',
        Value: EndPoint,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Codica struttura',
        Value: Tplkz,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Categoria sede tecnica',
        Value: Fltyp,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Data creazione',
        Value: Erdat,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Creato da',
        Value: Ernam,
    },
]);

annotate service.funct_locationsSet with @(
    UI.FieldGroup #GeneratedGroup1: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'Sede tecnica',
                Value: Tplnr,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Descrizione sede tecnica',
                Value: Pltxt,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Punto iniziale strada',
                Value: StartPoint,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Punto finale strada',
                Value: EndPoint,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Codica struttura',
                Value: Tplkz,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Categoria sede tecnica',
                Value: Fltyp,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Data creazione',
                Value: Erdat,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Creato da',
                Value: Ernam,
            },
            {
                $Type: 'UI.DataField',
                Label: 'ID interno sede tecnica',
                Value: FlocId
            },
            {
                $Type: 'UI.DataField',
                Label: 'Sede tecnica superiore',
                Value: Tplma
            },
            {
                $Type: 'UI.DataField',
                Label: 'Limite inf. numerico',
                Value: DecValueFrom
            },
            {
                $Type: 'UI.DataField',
                Label: 'Div. pianificazione della manutenzione',
                Value: Iwerk
            },
            {
                $Type: 'UI.DataField',
                Label: 'Data modifica',
                Value: Aedat
            },
            {
                $Type: 'UI.DataField',
                Label: 'Autore modifica',
                Value: Aenam
            },
            {
                $Type: 'UI.DataField',
                Label: 'Tipo di oggetto tecnico',
                Value: Eqart
            },
            {
                $Type: 'UI.DataField',
                Label: 'Codice strada',
                Value: Zziflot
            },
            {
                $Type: 'UI.DataField',
                Label: 'Descrizione codice strada',
                Value: ZziflotDescr
            },
            {
                $Type: 'UI.DataField',
                Label: 'Num. protocollo ordine di servizio',
                Value: ZznProtocOds
            },
            {
                $Type: 'UI.DataField',
                Label: 'Descrizione sede tecnica (maiuscola)',
                Value: Pltxu
            },
            {
                $Type: 'UI.DataField',
                Label: 'Lunghezza strada',
                Value: LinearLength
            },
            {
                $Type: 'UI.DataField',
                Label: 'Unità di misura',
                Value: LinearUnit
            },
            {
                $Type: 'UI.DataField',
                Label: 'Definizione',
                Value: Atbez
            },
            {
                $Type: 'UI.DataField',
                Label: 'Caratt. interna',
                Value: Atinn
            },
            {
                $Type: 'UI.DataField',
                Label: 'Caratt.',
                Value: Atnam
            },
            {
                $Type: 'UI.DataField',
                Label: 'Valore car.',
                Value: Atwrt
            },
            {
                $Type: 'UI.DataField',
                Label: 'Inizio caratteristica',
                Value: StartPointChar
            },
            {
                $Type: 'UI.DataField',
                Label: 'Fine caratteristica',
                Value: EndPointChar
            },
            {
                $Type: 'UI.DataField',
                Label: 'Lunghezza caratteristica',
                Value: LinearLengthChar
            },
            {
                $Type: 'UI.DataField',
                Label: 'Lunghezza calc. caratteristica',
                Value: LinearLengthCalc
            },
            {
                $Type: 'UI.DataField',
                Label: 'Unità di misura caratteristica',
                Value: LinearUnitChar
            }
        ],
    },
    UI.Facets                     : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup1',
    }, ]
);

annotate service.funct_locationsSet {
    LinearLengthCalc @UI.Hidden      : true;
    LinearLengthCalc @UI.HiddenFilter: true;
};

annotate service.caratteristicheSet with @(UI.LineItem: [
    {
        $Type: 'UI.DataField',
        Label: 'atnam',
        Value: atnam,
    },
    {
        $Type: 'UI.DataField',
        Label: 'atinn',
        Value: atinn,
    },
    {
        $Type: 'UI.DataField',
        Label: 'atbez',
        Value: atbez,
    },
]);

annotate service.caratteristicheSet with @(
    UI.FieldGroup #GeneratedGroup1: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'atnam',
                Value: atnam,
            },
            {
                $Type: 'UI.DataField',
                Label: 'atinn',
                Value: atinn,
            },
            {
                $Type: 'UI.DataField',
                Label: 'atbez',
                Value: atbez,
            },
        ],
    },
    UI.Facets                     : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup1',
    }, ]
);

annotate service.Caratteristiche_no_linSet with @(
    UI.FieldGroup #GeneratedGroup1: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'atnam',
                Value: atnam,
            },
            {
                $Type: 'UI.DataField',
                Label: 'atinn',
                Value: atinn,
            },
            {
                $Type: 'UI.DataField',
                Label: 'atbez',
                Value: atbez,
            },
        ],
    },
    UI.Facets                     : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup1',
    }, ]
);
