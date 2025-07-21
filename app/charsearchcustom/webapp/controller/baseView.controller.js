sap.ui.define(
  ['sap/ui/core/mvc/Controller', 'sap/m/MessageBox', 'sap/ui/model/json/JSONModel', 'sap/ui/model/Filter', 'sap/ui/model/FilterOperator', 'sap/m/Token', 'sap/ui/table/Column', 'sap/m/Label', 'sap/ui/table/RowAction', 'sap/ui/table/RowActionItem', 'sap/ui/export/Spreadsheet', 'sap/ui/export/library', 'sap/m/Link', 'sap/m/Column', 'sap/m/SearchField', 'sap/m/Text', '../model/formatter'],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, MessageBox, JSONModel, Filter, FilterOperator, Token, Column, Label, RowAction, RowActionItem, Spreadsheet, exportLibrary, Link, MColumn, SearchField, Text, formatter) {
    'use strict';

    var rootUrl = '';
    var EdmType = exportLibrary.EdmType;

    return Controller.extend('charsearchcustom.controller.baseView', {

      formatter: formatter,

      onInit: function () {
        rootUrl = this.getOwnerComponent().getModel('modelRootUrl').oData.rootUrl;

        let filtersListBaseModel = new JSONModel([]);
        this.getView().setModel(filtersListBaseModel, 'filtersListBase');

        let baseFiltersListsModel = new JSONModel();
        this.getView().setModel(baseFiltersListsModel, 'baseFiltersList');

        let filtersListLinearModel = new JSONModel([]);
        this.getView().setModel(filtersListLinearModel, 'filtersListLinear');

        let filtersListNotLinearModel = new JSONModel([]);
        this.getView().setModel(filtersListNotLinearModel, 'filtersListNotLinear');

        let filterValueDialogModel = new JSONModel({});
        this.getView().setModel(filterValueDialogModel, 'filterValueDialogModel');

        let filterBaseValueDialogModel = new JSONModel({});
        this.getView().setModel(filterBaseValueDialogModel, 'filterBaseValueDialogModel');

        let flocDetailUrlModel = new JSONModel([
          { env: "anas-dev", url: "https://anas-dev-iam-simmflocext-approuter.cfapps.eu10-004.hana.ondemand.com/cp.portal/site#simmflocext-display?sap-ui-app-id-hint=my.company.simmflocext" },
          { env: "anas-qas", url: "https://anas-qas-iam-simmflocext-approuter.cfapps.eu10-004.hana.ondemand.com/cp.portal/site#simmflocext-display?sap-ui-app-id-hint=my.company.simmflocext" },
          { env: "anas-prd", url: "https://anas-prd-iam-simmflocext-approuter.cfapps.eu10-004.hana.ondemand.com/cp.portal/site#simmflocext-display?sap-ui-app-id-hint=my.company.simmflocext" }
        ]);
        this.getView().setModel(flocDetailUrlModel, 'flocDetailUrlModel');

        // this._enableNavigationRowAction();
      },

      onBeforeRendering: function () {

        this.getView().getModel().annotationsLoaded().then(() => {

          this.resourceBundle = this.getView().getModel("i18n").getResourceBundle();

          this.defaultTableColumns = this.getView().getModel().getServiceAnnotations()['catalogService.funct_locationsSet']['com.sap.vocabularies.UI.v1.LineItem'];
          this.entityPropertiesData = this.getView().getModel().getServiceAnnotations()['catalogService.funct_locationsSet']['com.sap.vocabularies.UI.v1.FieldGroup#GeneratedGroup1'].Data;

          this._addDefaultColumns();
          this._addDefaultBaseFilters();

          this.byId('title').setText(this.resourceBundle.getText('smartTableHeader', ['']));

          this.byId('idUiTable').getBinding('rows').attachDataReceived(evt => {
            let responseData = evt.getParameter('data').results;

            let uiTableColumns = this.byId('idUiTable').getColumns();
            let attributesColumns = uiTableColumns.filter(column => {
              return column.getAggregation('multiLabels')[0].getProperty('text') === 'Attributi lineari' || column.getAggregation('multiLabels')[0].getProperty('text') === 'Attributi non lineari';
            });

            if (responseData.length > 0 && attributesColumns.length > 0) {

              const responseDataChunks = this._splitArrayIntoChunks(responseData, 50);

              var atnamFilterStr = '(';
              attributesColumns.forEach(column => {
                atnamFilterStr = atnamFilterStr + "atnam eq '" + column.getAggregation('template').getBindingInfo('text').parts[0].path + "' or ";
              });

              if (atnamFilterStr.endsWith(' or ')) {
                atnamFilterStr = atnamFilterStr.slice(0, -4);
                atnamFilterStr = atnamFilterStr + ')';
              } else if (atnamFilterStr.length === 1) {
                atnamFilterStr = '';
              }

              var batchRequests = [];

              responseDataChunks.forEach(chunk => {
                var tplnrFilterStr = '(';
                chunk.forEach(item => {
                  tplnrFilterStr = tplnrFilterStr + "tplnr eq '" + item.Tplnr + "' or ";
                })
                tplnrFilterStr = tplnrFilterStr.slice(0, -4) + ')';

                var finalFilterStr = tplnrFilterStr + ' and ' + atnamFilterStr;
                if (finalFilterStr.endsWith(' or )')) {
                  finalFilterStr = finalFilterStr.slice(0, -5);
                }

                let path = rootUrl + '/v2/odata/v4/catalog/attributiSet?$filter=' + finalFilterStr;

                let ajaxRequest = $.ajax({
                  url: path,
                  method: "GET",
                  dataType: 'json'
                });

                batchRequests.push(ajaxRequest);
              });

              $.when.apply($, batchRequests).done(function () {
                let data = []
                for (var i = 0; i < arguments.length; i++) {
                  var responseData = arguments[i][0] ? arguments[i][0].d ? arguments[i][0].d.results : [] : arguments[i].d ? arguments[i].d.results : [];
                  responseData.forEach(item => {
                    data.push(item);
                  })
                };

                if (data.length > 0) {
                  this._handleAttributesData(data);
                }

                if (this.runExport) {
                  this._runExport();
                }
              }.bind(this)).fail(function (jqXHR, textStatus, errorThrow) {
                if (this.runExport || this.runExport === undefined) {
                  this.runExport = false;
                }
              }.bind(this))

            } else {
              if (this.runExport) {
                this._runExport();
              }
            }
          })

        })
      },

      _splitArrayIntoChunks: function (array, chunkSize) {
        const result = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          result.push(array.slice(i, i + chunkSize));
        }
        return result;
      },

      _handleAttributesData: function (data) {
        let tableRows = this.byId('idUiTable').getRows();
        var actualTableRows = tableRows.filter(row => {
          return row.getBindingContext() !== null;
        })

        // Initialize this.attributesData as an empty array if it's not already initialized
        this.attributesData = this.attributesData || [];

        // Merge the new data with the existing data
        this.attributesData = [...this.attributesData, ...data];

        // Keep only unique values based on atnam and tplnr
        this.attributesData = this._getUniqueValuesByKeys(this.attributesData, ['atnam', 'tplnr']);

        this._updateRowsAttributeData(this.attributesData, actualTableRows);
      },

      _getUniqueValuesByKeys: function (data, keys) {
        const uniqueData = new Map();

        for (const item of data) {
          const key = keys.map(k => item[k]).join('|'); // Create a unique key based on specified keys
          if (!uniqueData.has(key)) {
            uniqueData.set(key, item);
          }
        }

        return [...uniqueData.values()];
      },

      _updateRowsAttributeData: function (data, rows) {
        this.uniqueAttributes = [...new Set(data.map(item => item.atnam))];

        rows.forEach(row => {
          row.getCells().forEach(attributeCell => {
            let attributeFound = this.uniqueAttributes.find(attr => {
              return attributeCell.getBindingInfo('text').parts[0].path === attr;
            })

            if (attributeFound) {
              let dataFound = data.find(item => {
                return item.tplnr === row.getBindingContext().getObject().Tplnr && attributeCell.getBindingInfo('text').parts[0].path === item.atnam;
              })

              if (dataFound) {
                attributeCell.setProperty('text', dataFound.atwtb);
              } else {
                attributeCell.setProperty('text', '');
              }
            }
          })
        })
      },

      onRowsUpdated: function (evt) {
        var source = evt.getSource();
        var binding = source.getBinding('rows');
        var count = binding.getCount();

        if (count === undefined) {
          const interval = setInterval(() => {
            count = binding.getCount();
            if (count !== undefined) {
              let titleParameter = count > 0 ? '(' + count + ')' : '';
              this.byId('title').setText(this.resourceBundle.getText('smartTableHeader', [titleParameter]));

              clearInterval(interval);
            }
          }, 200);
        } else if (count !== undefined && this.updateCount) {
          let titleParameter = count > 0 ? '(' + count + ')' : '';
          this.byId('title').setText(this.resourceBundle.getText('smartTableHeader', [titleParameter]));

          this.updateCount = false;
        }

        if (this.attributesData) {
          let tableRows = source.getRows();
          var actualTableRows = tableRows.filter(row => {
            return row.getBindingContext() !== null;
          });

          this._updateRowsAttributeData(this.attributesData, actualTableRows);
        }

      },

      _addDefaultColumns: function () {
        let uiTable = this.byId("idUiTable");

        this.defaultTableColumns.forEach((field, index) => {
          let hAlign = field.EdmType === 'Edm.Double' ? 'End' : 'Begin';

          let templateLabel = new Label({ text: { path: field.Value['Path'] } });
          if (field.EdmType === 'Edm.Double') {
            templateLabel = new Label({ text: { path: field.Value['Path'], formatter: formatter.parseNumericValues } });
          }

          if (field.EdmType === 'Edm.DateTime') {
            templateLabel = new Label({ text: { path: field.Value['Path'], formatter: formatter.parseDate } });
          }

          let firstColumn = false;
          let multiLabels = [];
          if (field.Value['Path'] === 'Tplnr') {
            firstColumn = true;

            templateLabel = new Link({ text: { path: field.Value['Path'] }, press: this._handleActionPress.bind(this) });

            multiLabels = [
              new Label({ text: '', width: '100%', textAlign: 'Center' }),
              new Label({ text: field.Label['String'], width: '100%' })
            ]
          } else {
            multiLabels = [
              new Label({ text: 'Base', width: '100%', textAlign: 'Center' }),
              new Label({ text: field.Label['String'], width: '100%' })
            ]
          }

          uiTable.addColumn(new Column({
            autoResizable: true,
            sortProperty: field.Value['Path'],
            headerSpan: firstColumn ? 1 : this.defaultTableColumns.length - 1,
            hAlign: hAlign,
            label: new Label({ text: field.Label['String'] }),
            width: '10em',
            multiLabels: multiLabels,
            template: templateLabel
          }))
        });
      },

      _addDefaultBaseFilters: function () {
        var filtersListData = this.getView().getModel('filtersListBase').getData();

        this.defaultTableColumns.forEach(property => {
          filtersListData.push({
            field: property.Value['Path'],
            description: property.Label['String'],
            filterType: 'eq',
            filterValue: '',
            filterInputSource: undefined
          })
        });

        this.byId('idFiltersListBase').getBinding('items').refresh();

        this._handlePanelExpanded('filtersListBase', 'idBaseFiltersPanel');
      },

      // _enableNavigationRowAction: function () {
      //   var oTable = this.byId("idUiTable");
      //   var iCount = 1;
      //   var oTemplate = oTable.getRowActionTemplate();
      //   if (oTemplate) {
      //     oTemplate.destroy();
      //     oTemplate = null;
      //   }

      //   var newTemplate = new RowAction({
      //     items: [
      //       new RowActionItem({
      //         type: "Navigation",
      //         press: this._handleActionPress.bind(this),
      //         visible: true
      //       })
      //     ]
      //   });

      //   oTable.setRowActionTemplate(newTemplate);
      //   oTable.setRowActionCount(iCount);
      // },

      _handleActionPress: function (evt) {
        let flocId = evt.getSource().getBindingContext().getProperty('FlocId');
        let currentEnv = window.location.host.substring(0, 8);

        currentEnv = currentEnv.includes('anas') ? currentEnv : 'anas-dev';

        let flocDetailUrlData = this.getView().getModel('flocDetailUrlModel').getData().find(obj => obj.env === currentEnv);
        let finalUrl = flocDetailUrlData.url + "&/" + flocId;
        window.open(finalUrl, '_blank');
      },

      onOpenAddFilterBasePress: function () {
        if (!this._FiltersListBaseDialog) {
          this._FiltersListBaseDialog = sap.ui.xmlfragment('FiltersListBaseDialog', 'charsearchcustom.view.fragments.FiltersListBaseDialog', this);
          this.getView().addDependent(this._FiltersListBaseDialog);
        }

        this._fillBaseFiltersCharacteristicsModel();
        this._filterCharacteristicsListBase();

        this._FiltersListBaseDialog.open();
      },

      _fillBaseFiltersCharacteristicsModel: function () {
        var filtersList = [];
        var metadataProperties = [];

        const interval = setInterval(() => {
          try {
            metadataProperties = this.getView().getModel().getMetaModel().getODataEntityType('catalogService.funct_locationsSet').property;

            this.entityPropertiesData.forEach(property => {
              let metaProperty = metadataProperties.find(metaProperty => {
                return metaProperty.name === property.Value['Path'];
              });

              if (metaProperty['sap:sortable'] === undefined) {
                filtersList.push({
                  field: property.Value['Path'],
                  description: property.Label['String'],
                  filterType: 'eq',
                  filterValue: '',
                  filterInputSource: undefined
                })
              }
            });

            this.getView().getModel("baseFiltersList").setData(filtersList);
            clearInterval(interval);
          } catch (error) {

          }
        }, 200);
      },

      _getExcludingFiltersBase: function () {
        const filtersListData = this.getView().getModel('filtersListBase').getData();

        if (filtersListData.length > 0) {
          var excludingFilters = [];
          filtersListData.forEach((item) => {
            excludingFilters.push(new Filter('field', FilterOperator.NE, item.field));
          });

          return new Filter({ filters: excludingFilters, and: true });
        }
      },

      _filterCharacteristicsListBase: function () {
        var filter = this._getExcludingFiltersBase();

        if (filter) {
          this._FiltersListBaseDialog.getBinding('items').filter([filter]);
        } else {
          this._FiltersListBaseDialog.getBinding('items').filter();
        }
      },

      onFiltersBaseDialogClose: function (evt) {
        var selectedContexts = evt.getParameter('selectedContexts');
        let multilabelText = 'Base';

        if (selectedContexts && selectedContexts.length) {
          this._fillFiltersListBase(selectedContexts);
          this._columnsUpdate(multilabelText, selectedContexts)
        }

        evt.getSource().getBinding('items').filter([]);

        this._handlePanelExpanded('filtersListBase', 'idBaseFiltersPanel');
      },

      _fillFiltersListBase: function (selectedContexts) {
        var filtersListData = this.getView().getModel('filtersListBase').getData();

        selectedContexts.forEach((context) => {
          let obj = context.getObject();

          if (!filtersListData.find((object) => {
            return object.field === obj.field;
          })) {
            let newFilter = obj;
            filtersListData.push(newFilter);
          }
        });

        this.byId('idFiltersListBase').getBinding('items').refresh();
      },

      onFilterBasicDelete: function (evt) {
        var delObject = evt.getParameter('listItem').getBindingContext('filtersListBase').getObject();
        let filtersListData = this.getView().getModel('filtersListBase').getData();

        filtersListData = filtersListData.filter((object) => {
          return object.field !== delObject.field;
        });

        this.getView().getModel('filtersListBase').setData(filtersListData);
        this.byId('idFiltersListBase').getBinding('items').refresh();

        var listItems = evt.getSource().getAggregation("items");
        this._handleTokensOnFilterDelete(listItems, "filtersListBase");

        this._handlePanelExpanded('filtersListBase', 'idBaseFiltersPanel');
      },

      onSearchCharacteristicBase: function (evt) {
        var sValue = evt.getParameter("value");
        var oFilter = new Filter({ filters: [new Filter("field", FilterOperator.Contains, sValue), new Filter("description", FilterOperator.Contains, sValue)], and: false });
        var oBinding = evt.getParameter("itemsBinding");

        oBinding.filter([oFilter]);
      },

      onOpenAddFilterPress: function (evt) {
        if (!this._FiltersListDialog) {
          this._FiltersListDialog = sap.ui.xmlfragment('FiltersListDialog', 'charsearchcustom.view.fragments.FiltersListDialog', this);
          this.getView().addDependent(this._FiltersListDialog);
        }

        this._filterCharacteristicsList();

        let binding = this._FiltersListDialog.getBinding('items');
        if (binding.isSuspended()) {
          binding.resume();
        }

        this._FiltersListDialog.open();
      },

      _filterCharacteristicsList: function () {
        var filter = this._getExcludingFilters();

        if (filter) {
          this._FiltersListDialog.getBinding('items').filter([filter]);
        } else {
          this._FiltersListDialog.getBinding('items').filter();
        }
      },

      _getExcludingFilters: function () {
        const filtersListData = this.getView().getModel('filtersListLinear').getData();

        if (filtersListData.length > 0) {
          var excludingFilters = [];
          filtersListData.forEach((item) => {
            excludingFilters.push(new Filter('atnam', FilterOperator.NE, item.atnam));
          });

          return new Filter({ filters: excludingFilters, and: true });
        }
      },

      onSearchCharacteristic: function (evt) {
        var sValue = evt.getParameter('value');

        var searchFilter = new Filter({
          filters: [
            new Filter('atbez', FilterOperator.Contains, sValue),
            new Filter('atnam', FilterOperator.Contains, sValue),
          ],
          and: false,
        });

        var excludingFilter = this._getExcludingFilters();

        var oFilter = new Filter({ filters: [searchFilter], and: true });
        if (excludingFilter) {
          oFilter.aFilters.push(excludingFilter);
        }

        var oBinding = evt.getParameter('itemsBinding');

        oBinding.filter([oFilter]);
      },

      onFiltersDialogClose: function (evt) {
        var selectedContexts = evt.getParameter('selectedContexts');
        let multilabelText = 'Attributi lineari';

        if (selectedContexts && selectedContexts.length) {
          this._fillFiltersList(selectedContexts);
          this._columnsUpdate(multilabelText, selectedContexts)
        }

        evt.getSource().getBinding('items').filter([]);

        this._handlePanelExpanded('filtersListLinear', 'idLinearCharFiltersPanel');
      },

      _fillFiltersList: function (selectedContexts) {
        var filtersListData = this.getView().getModel('filtersListLinear').getData();

        selectedContexts.forEach((context) => {
          let obj = context.getObject();

          if (
            !filtersListData.find((object) => {
              return object.atnam === obj.atnam;
            })
          ) {
            let newFilter = {
              atinn: obj.atinn,
              atnam: obj.atnam,
              atbez: obj.atbez,
              filterType: 'eq',
              filterValue: '',
              filterInputSource: undefined
            };

            filtersListData.push(newFilter);
          }
        });

        this.byId('idFiltersListLinear').getBinding('items').refresh();
      },

      onFilterDelete: function (evt) {
        var delObject = evt.getParameter('listItem').getBindingContext('filtersListLinear').getObject();
        let filtersListData = this.getView().getModel('filtersListLinear').getData();

        filtersListData = filtersListData.filter((object) => {
          return object.atnam !== delObject.atnam;
        });

        this.getView().getModel('filtersListLinear').setData(filtersListData);
        this.byId('idFiltersListLinear').getBinding('items').refresh();

        var listItems = evt.getSource().getAggregation("items");
        this._handleTokensOnFilterDelete(listItems, "filtersListLinear");

        this._handlePanelExpanded('filtersListLinear', 'idLinearCharFiltersPanel');
      },

      onOpenAddFilterNotLinearPress: function (evt) {
        if (!this._FiltersListNotLinearDialog) {
          this._FiltersListNotLinearDialog = sap.ui.xmlfragment('FiltersListNotLinearDialog', 'charsearchcustom.view.fragments.FiltersListNotLinearDialog', this);
          this.getView().addDependent(this._FiltersListNotLinearDialog);
        }

        this._filterCharacteristicsListNotLinear();

        let binding = this._FiltersListNotLinearDialog.getBinding('items');
        if (binding.isSuspended()) {
          binding.resume();
        }

        this._FiltersListNotLinearDialog.open();
      },

      _filterCharacteristicsListNotLinear: function () {
        var filter = this._getExcludingFiltersNotLinear();

        if (filter) {
          this._FiltersListNotLinearDialog.getBinding('items').filter([filter]);
        } else {
          this._FiltersListNotLinearDialog.getBinding('items').filter();
        }
      },

      _getExcludingFiltersNotLinear: function () {
        const filtersListData = this.getView().getModel('filtersListNotLinear').getData();

        if (filtersListData.length > 0) {
          var excludingFilters = [];
          filtersListData.forEach((item) => {
            excludingFilters.push(new Filter('atnam', FilterOperator.NE, item.atnam));
          });

          return new Filter({ filters: excludingFilters, and: true });
        }
      },

      onSearchCharacteristicNotLinear: function (evt) {
        var sValue = evt.getParameter('value');

        var searchFilter = new Filter({
          filters: [
            new Filter('atbez', FilterOperator.Contains, sValue),
            new Filter('atnam', FilterOperator.Contains, sValue),
          ],
          and: false,
        });

        var excludingFilter = this._getExcludingFiltersNotLinear();

        var oFilter = new Filter({ filters: [searchFilter], and: true });
        if (excludingFilter) {
          oFilter.aFilters.push(excludingFilter);
        }

        var oBinding = evt.getParameter('itemsBinding');

        oBinding.filter([oFilter]);
      },

      onFiltersNotLinearDialogClose: function (evt) {
        var selectedContexts = evt.getParameter('selectedContexts');
        let multilabelText = 'Attributi non lineari';

        if (selectedContexts && selectedContexts.length) {
          this._fillFiltersListNotLinear(selectedContexts);
          this._columnsUpdate(multilabelText, selectedContexts)
        }

        evt.getSource().getBinding('items').filter([]);
        this._handlePanelExpanded('filtersListNotLinear', 'idNotLinearCharFiltersPanel');
      },

      _fillFiltersListNotLinear: function (selectedContexts) {
        var filtersListData = this.getView().getModel('filtersListNotLinear').getData();

        selectedContexts.forEach((context) => {
          let obj = context.getObject();

          if (
            !filtersListData.find((object) => {
              return object.atnam === obj.atnam;
            })
          ) {
            let newFilter = {
              atinn: obj.atinn,
              atnam: obj.atnam,
              atbez: obj.atbez,
              filterType: 'eq',
              filterValue: '',
              filterInputSource: undefined
            };

            filtersListData.push(newFilter);
          }
        });

        this.byId('idFiltersListNotLinear').getBinding('items').refresh();
      },

      onFilterNotLinearDelete: function (evt) {
        var delObject = evt.getParameter('listItem').getBindingContext('filtersListNotLinear').getObject();
        let filtersListData = this.getView().getModel('filtersListNotLinear').getData();

        filtersListData = filtersListData.filter((object) => {
          return object.atnam !== delObject.atnam;
        });

        this.getView().getModel('filtersListNotLinear').setData(filtersListData);
        this.byId('idFiltersListNotLinear').getBinding('items').refresh();

        var listItems = evt.getSource().getAggregation("items");
        this._handleTokensOnFilterDelete(listItems, "filtersListNotLinear");

        this._handlePanelExpanded('filtersListNotLinear', 'idNotLinearCharFiltersPanel');
      },

      openFilterValueHelp: function (evt) {
        const sourceId = evt.getSource().getId();
        this._setBindingContextModelValueHelp(sourceId);

        if (!this._FilterValueDialog) {
          this._FilterValueDialog = sap.ui.xmlfragment('FilterValueDialog', 'charsearchcustom.view.fragments.FilterValueDialog', this);
          this.getView().addDependent(this._FilterValueDialog);
        }

        var filterData = evt.getSource().getBindingContext(this._bindingContextModel).getObject();

        let field = filterData.atnam ? filterData.atnam : filterData.field ? filterData.field : '';

        let entityTypeName = 'search_' + field.toLowerCase() + 'Set';
        let entityFound = this.getView().getModel().getServiceMetadata().dataServices.schema[0].entityType.find(entityType => {
          return entityType.name === entityTypeName;
        });

        let showSearchHelpChars = false;
        if (sourceId.includes("idFiltersListLinear") || sourceId.includes("idFiltersListNotLinear")) {
          entityFound = true;
        }

        this.getView().getModel('filterValueDialogModel').setData({
          atinn: filterData.atinn,
          atnam: field,
          atbez: filterData.atbez ? filterData.atbez : filterData.description ? filterData.description : '',
          filterType: filterData.filterType,
          filterValue: '',
          filterInputSource: evt.getSource(),
          showValueHelp: (entityFound ? true : showSearchHelpChars ? true : false)
        });
        this.getView().getModel('filterValueDialogModel').refresh();

        this._FilterValueDialog.open();
      },

      onConfirmFilterValueDialog: function () {
        const data = this.getView().getModel('filterValueDialogModel').getData();
        const filterInputSource = data.filterInputSource;

        let filterData = filterInputSource.getBindingContext(this._bindingContextModel).getObject();
        filterData.filterType = data.filterType;

        if (data.filterValue !== '' && data.filterValue !== undefined && data.filterValue !== null) {
          filterData.filterValue = filterData.filterValue === '' ? data.filterValue : filterData.filterValue.concat(';', data.filterValue);
          this._setTokens(filterInputSource, filterData.filterValue, data.atnam);
        }

        this._FilterValueDialog.close();
      },

      onCloseFilterValueDialog: function () {
        this.getView().getModel('filterValueDialogModel').setData();
        this.getView().getModel('filterValueDialogModel').refresh();
        this._FilterValueDialog.close();
      },

      openFilterBaseValueHelp: function (evt) {
        const sourceId = evt.getSource().getId();
        this._setBindingContextModelValueHelp(sourceId);

        if (!this._FilterBaseValueDialog) {
          this._FilterBaseValueDialog = sap.ui.xmlfragment('FilterBaseValueDialog', 'charsearchcustom.view.fragments.FilterBaseValueDialog', this);
          this.getView().addDependent(this._FilterBaseValueDialog);
        }

        var filterData = evt.getSource().getBindingContext(this._bindingContextModel).getObject();
        this.getView().getModel('filterBaseValueDialogModel').setData({
          name: filterData.name,
          description: filterData.description,
          filterType: filterData.filterType,
          filterValue: '',
          filterInputSource: evt.getSource(),
        });
        this.getView().getModel('filterBaseValueDialogModel').refresh();

        this._FilterBaseValueDialog.open();
      },

      onConfirmFilterBaseValueDialog: function () {
        const data = this.getView().getModel('filterBaseValueDialogModel').getData();
        const filterInputSource = data.filterInputSource;

        let filterData = filterInputSource.getBindingContext(this._bindingContextModel).getObject();
        filterData.filterType = data.filterType;

        if (data.filterValue !== '' && data.filterValue !== undefined && data.filterValue !== null) {
          filterData.filterValue = filterData.filterValue === '' ? data.filterValue : filterData.filterValue.concat(';', data.filterValue);
          this._setTokens(filterInputSource, filterData.filterValue, data.name);
        }

        this._FilterBaseValueDialog.close();
      },

      onCloseFilterBaseValueDialog: function () {
        this.getView().getModel('filterBaseValueDialogModel').setData();
        this.getView().getModel('filterBaseValueDialogModel').refresh();
        this._FilterBaseValueDialog.close();
      },

      onFilterValueTokenUpdate: function (evt) {
        if (evt.getParameter('type') === 'removed') {

          const sourceId = evt.getSource().getId();
          this._setBindingContextModelValueHelp(sourceId);

          const removedTokens = evt.getParameter('removedTokens');
          const currentTokens = evt.getSource().getTokens();

          var updatedTokens = this._getTokensDiff(currentTokens, removedTokens);

          var newFilterValue = '';
          updatedTokens.forEach(token => {
            newFilterValue = newFilterValue === '' ? token.getText() : newFilterValue.concat(';', token.getText());
          });

          evt.getSource().getBindingContext(this._bindingContextModel).getObject().filterValue = newFilterValue;
          if (newFilterValue !== '') {
            evt.getSource().getBindingContext(this._bindingContextModel).getObject().filterType = 'eq';
          }
        }
      },

      onFilterValueChange: function (evt) {
        const value = evt.getParameter('value');
        this._setBindingContextModelValueHelp(evt.getSource().getId());

        let filterData = evt.getSource().getBindingContext(this._bindingContextModel).getObject();
        filterData.filterValue = filterData.filterValue === '' ? value : filterData.filterValue.concat(';', value);

        var key = filterData.atnam ? filterData.atnam : filterData.field;
        this._setTokens(evt.getSource(), filterData.filterValue, key);

        evt.getSource().setValue('');
      },

      onFilterGoPress: function () {
        let uiTable = this.byId('idUiTable');
        let binding = uiTable.getBinding('rows');

        const linearFiltersData = this.getView().getModel('filtersListLinear').getData();
        const notLinearFiltersData = this.getView().getModel('filtersListNotLinear').getData();
        const baseFiltersData = this.getView().getModel('filtersListBase').getData();

        const filtersData = [...linearFiltersData, ...notLinearFiltersData, ...baseFiltersData];

        var bindingFilters = new Filter({ filters: [], and: true });
        filtersData.forEach((item) => {
          var filterOperatorValue = FilterOperator.EQ;

          if (item.filterType === 'noteq') {
            filterOperatorValue = FilterOperator.NE;
          }

          if (item.filterType === 'like') {
            filterOperatorValue = FilterOperator.Contains;
          }

          if (item.atnam && item.filterValue) {

            var charFilters = [];
            if (item.filterValue.includes(';')) {
              charFilters.push(new Filter('Atinn', FilterOperator.EQ, item.atnam));

              var multiValueFilter = new Filter({ filters: [], and: false });
              item.filterValue.split(';').forEach(value => {
                multiValueFilter.aFilters.push(new Filter('Atwrt', filterOperatorValue, value))
              });

              charFilters.push(multiValueFilter);
            } else {
              charFilters.push(new Filter('Atinn', FilterOperator.EQ, item.atnam), new Filter('Atwrt', filterOperatorValue, item.filterValue));
            }

            bindingFilters.aFilters.push(
              new Filter({
                filters: charFilters,
                and: true,
              })
            );
          }

          if (item.field && item.filterValue) {
            if (item.filterValue.includes(';')) {
              multiValueFilter = new Filter({ filters: [], and: false });

              item.filterValue.split(';').forEach(value => {
                multiValueFilter.aFilters.push(new Filter(item.field, filterOperatorValue, value))
              });

              bindingFilters.aFilters.push(multiValueFilter);
            } else {
              bindingFilters.aFilters.push(new Filter(item.field, filterOperatorValue, item.filterValue));
            }
          }

        });

        this.updateCount = true;

        if (bindingFilters) {
          binding.filter(bindingFilters);
        } else {
          binding.filter();
        }

      },

      _setBindingContextModelValueHelp: function (id) {
        if (id.includes("idFiltersListLinear")) {
          this._bindingContextModel = 'filtersListLinear';
        }

        if (id.includes("idFiltersListNotLinear")) {
          this._bindingContextModel = 'filtersListNotLinear';
        }

        if (id.includes("idFiltersListBase")) {
          this._bindingContextModel = 'filtersListBase';
        }
      },

      _setTokens: function (filterInputSource, values, key) {
        var tokens = [];
        values.split(';').forEach(value => {
          tokens.push(new Token({ text: value, key: key }));
        })
        filterInputSource.setTokens(tokens);
      },

      _handleTokensOnFilterDelete: function (listItems, bindingContextModel) {
        listItems.forEach(listItem => {
          var itemBindingObj = listItem.getBindingContext(bindingContextModel).getObject();
          var itemContent = listItem.getAggregation("content");
          itemContent.forEach(item => {
            var newInputSource = item.getAggregation("items").find(itm => { return itm.getId().includes("input") });
            itemBindingObj.filterInputSource = newInputSource;

            if (itemBindingObj.filterValue !== "" && itemBindingObj.filterValue !== undefined && itemBindingObj.filterValue !== null) {
              var key = itemBindingObj.atnam ? itemBindingObj.atnam : itemBindingObj.field;
              this._setTokens(newInputSource, itemBindingObj.filterValue, key);
            } else {
              newInputSource.removeAllTokens();
            }
          })
        });
      },

      _handlePanelExpanded: function (model, panelId) {
        if (this.getView().getModel(model).getData().length > 0) {
          this.byId(panelId).setExpanded(true);
        } else {
          this.byId(panelId).setExpanded(false);
        }
      },

      _getTokensDiff: function (current, removed) {
        return current.filter(currentToken => {
          return removed.some(removedToken => {
            return currentToken.getId() !== removedToken.getId();
          });
        });
      },

      _getGroupLastColIndex: function (group) {
        let tableColumns = this.byId('idUiTable').getColumns();

        let lastGroupCol = [...tableColumns].reverse().find(column => {
          return column.getAggregation('multiLabels')[0].getProperty('text') === group;
        });

        return tableColumns.indexOf(lastGroupCol);
      },

      _columnsUpdate: function (group, columnsToAdd, onlyNewBaseColumns) {
        let uiTable = this.byId('idUiTable')
        let tableColumns = uiTable.getColumns();

        // check linear and not linear attributes last column position
        let lastLinearColIndex = this._getGroupLastColIndex('Attributi lineari');
        let lastNotLinearColIndex = this._getGroupLastColIndex('Attributi non lineari');

        let firstInsertAttrCols = false;
        if (lastLinearColIndex === -1 && lastNotLinearColIndex === -1) {
          firstInsertAttrCols = true;
        }

        let insertLinearFirst = false;
        if ((lastLinearColIndex !== -1 && lastLinearColIndex < lastNotLinearColIndex) || (lastLinearColIndex > lastNotLinearColIndex && lastNotLinearColIndex === -1)) {
          insertLinearFirst = true;
        }

        let fixedColumn = tableColumns.filter(column => {
          return column.getAggregation('multiLabels')[0].getProperty('text') === '';
        })

        // split column groups in different arrays
        let baseGrpColumns = tableColumns.filter(column => {
          return column.getAggregation('multiLabels')[0].getProperty('text') === 'Base';
        })

        let linearGrpColumns = tableColumns.filter(column => {
          return column.getAggregation('multiLabels')[0].getProperty('text') === 'Attributi lineari';
        })

        let notLinearGrpColumns = tableColumns.filter(column => {
          return column.getAggregation('multiLabels')[0].getProperty('text') === 'Attributi non lineari';
        })

        let colsToAddLen = columnsToAdd.length;
        var headerSpan = 0;

        uiTable.removeAllColumns();

        switch (group) {
          case 'Base':
            headerSpan = !onlyNewBaseColumns ? baseGrpColumns.length + colsToAddLen : colsToAddLen;

            fixedColumn.forEach(column => {
              uiTable.addColumn(column);
            })

            // update headerSpan property on existing 'Base' columns
            if (!onlyNewBaseColumns) {
              baseGrpColumns.forEach(column => {
                column.setHeaderSpan(headerSpan);
                uiTable.addColumn(column);
              });
            }

            // add new 'Base' columns
            columnsToAdd.forEach(context => {
              let obj = context.getObject ? context.getObject() : context.getBindingContext('$p13n').getObject();
              let found = undefined;

              if (!onlyNewBaseColumns) {
                let checkField = obj.field ? obj.field : obj.name;
                found = baseGrpColumns.find(existingColumn => {
                  return existingColumn.getAggregation('template').getBindingInfo('text').parts[0].path === checkField;
                });
              }

              if (!found) {
                uiTable.addColumn(this._newColumn(obj, group, headerSpan))
              }
            });

            // add other groups columns if existing
            // check which group insert first
            if (lastLinearColIndex !== -1 && lastLinearColIndex > lastNotLinearColIndex) {
              linearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })

              notLinearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })
            } else if (lastNotLinearColIndex !== -1 && lastNotLinearColIndex > lastLinearColIndex) {
              notLinearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })

              linearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })
            }
            break;

          case 'Attributi lineari':
            headerSpan = linearGrpColumns.length + colsToAddLen;

            fixedColumn.forEach(column => {
              uiTable.addColumn(column);
            })

            baseGrpColumns.forEach(column => {
              uiTable.addColumn(column);
            })

            // Three ways:
            // Insert and update headerSpan group columns + add new columns and then insert other group columns
            // Insert other group columns and then insert and update headerSpan group columns + add new columns
            // Insert new columns

            if (firstInsertAttrCols) {
              columnsToAdd.forEach(context => {
                let obj = context.getObject();
                uiTable.addColumn(this._newColumn(obj, group, headerSpan))
              });
            } else if (insertLinearFirst) {
              linearGrpColumns.forEach(column => {
                column.setHeaderSpan(headerSpan);
                uiTable.addColumn(column);
              })

              columnsToAdd.forEach(context => {
                let obj = context.getObject();

                let found = linearGrpColumns.find(existingColumn => {
                  return existingColumn.getAggregation('template').getBindingInfo('text').parts[0].path === obj.atnam;
                })

                if (!found) {
                  uiTable.addColumn(this._newColumn(obj, group, headerSpan))
                }
              });

              notLinearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })
            } else {
              notLinearGrpColumns.forEach(column => {
                column.setHeaderSpan(headerSpan);
                uiTable.addColumn(column);
              })

              columnsToAdd.forEach(context => {
                let obj = context.getObject();

                let found = linearGrpColumns.find(existingColumn => {
                  return existingColumn.getAggregation('template').getBindingInfo('text').parts[0].path === obj.atnam;
                })

                if (!found) {
                  uiTable.addColumn(this._newColumn(obj, group, headerSpan))
                }
              });

              linearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })
            }

            break;
          case 'Attributi non lineari':
            headerSpan = notLinearGrpColumns.length + colsToAddLen;

            fixedColumn.forEach(column => {
              uiTable.addColumn(column);
            })

            baseGrpColumns.forEach(column => {
              uiTable.addColumn(column);
            })

            // Three ways:
            // Insert other group columns and then insert and update headerSpan group columns + add new columns
            // Insert and update headerSpan group columns + add new columns and then insert other group columns
            // Insert new columns

            if (firstInsertAttrCols) {
              columnsToAdd.forEach(context => {
                let obj = context.getObject();
                uiTable.addColumn(this._newColumn(obj, group, headerSpan))
              });
            } else if (insertLinearFirst) {
              linearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })

              notLinearGrpColumns.forEach(column => {
                column.setHeaderSpan(headerSpan);
                uiTable.addColumn(column);
              })

              columnsToAdd.forEach(context => {
                let obj = context.getObject();

                let found = notLinearGrpColumns.find(existingColumn => {
                  return existingColumn.getAggregation('template').getBindingInfo('text').parts[0].path === obj.atnam;
                })

                if (!found) {
                  uiTable.addColumn(this._newColumn(obj, group, headerSpan))
                }
              });
            } else {
              notLinearGrpColumns.forEach(column => {
                column.setHeaderSpan(headerSpan);
                uiTable.addColumn(column);
              })

              columnsToAdd.forEach(context => {
                let obj = context.getObject();

                let found = notLinearGrpColumns.find(existingColumn => {
                  return existingColumn.getAggregation('template').getBindingInfo('text').parts[0].path === obj.atnam;
                })

                if (!found) {
                  uiTable.addColumn(this._newColumn(obj, group, headerSpan))
                }
              });

              linearGrpColumns.forEach(column => {
                uiTable.addColumn(column);
              })
            }

            break;
        }
      },

      _newColumn(obj, multiLabelText, headerSpan) {
        let field = obj.atnam ? obj.atnam : obj.field ? obj.field : obj.name;
        let label = obj.atbez ? obj.atbez : obj.description ? obj.description : obj.label;

        let propertyData = this.entityPropertiesData.find(item => { return item.Value['Path'] === field });
        let hAlign = propertyData ? propertyData.EdmType === 'Edm.Double' ? 'End' : 'Begin' : 'Begin';

        let templateLabel = new Label({ text: { path: field } });
        if (field.EdmType === 'Edm.Double') {
          templateLabel = new Label({ text: { path: field, formatter: formatter.parseNumericValues } });
        }

        if (field.EdmType === 'Edm.DateTime') {
          templateLabel = new Label({ text: { path: field, formatter: formatter.parseDate } });
        }

        return new Column({
          autoResizable: true,
          resizable: true,
          headerSpan: headerSpan,
          label: new Label({ text: label }),
          width: '10em',
          hAlign: hAlign,
          multiLabels: [
            new Label({ text: multiLabelText, width: '100%', textAlign: 'Center' }),
            new Label({ text: label, width: '100%' })
          ],
          template: templateLabel
        })
      },

      onExport: function () {
        let uiTable = this.byId('idUiTable');
        let binding = uiTable.getBinding('rows');
        let count = binding.getCount();
        console.log("Export count: "+count);
        if (count){
        uiTable.setVisibleRowCountMode('Fixed');
        uiTable.setVisibleRowCount(count);
        }
        

        this.runExport = true;
        binding.refresh();
      },

      _runExport: async function () {

        this.getOwnerComponent().getModel().setUseBatch(true);

        var columns = this._createColumnConfig();
        await this._createDataSourceConfig().then((dataSource) => {
          let settings = {
            workbook: {
              columns: columns,
              hierarchyLevel: 'Level'
            },
            dataSource: dataSource,
            fileName: 'Sede.xlsx'
          };

          let sheet = new Spreadsheet(settings);
          sheet.build().finally(() => {
            this.getOwnerComponent().getModel().setUseBatch(false);
            this.runExport = false;
            this.prevRunExportEnded = true;
            this.byId('idUiTable').setVisibleRowCountMode('Auto');
            sheet.destroy();
          });
        });
      },

      _createColumnConfig: function () {
        let tableColumns = this.byId('idUiTable').getColumns();
        let exportColumns = [];

        console.log(EdmType);

        tableColumns.forEach(column => {
          let property = column.getAggregation('template').getBindingInfo('text').parts[0].path;
          let label = column.getAggregation('label').getProperty('text');

          let propertyData = this.entityPropertiesData.find(item => { return item.Value['Path'] === property });

          if (propertyData) {
            if (propertyData.EdmType === 'Edm.Double') {
              exportColumns.push({
                label: label,
                property: property,
                type: EdmType.Number,
                delimiter: true,
                scale: 3
              });
            } else {

              let type
              let annotationEdmType = propertyData.EdmType ? propertyData.EdmType : '';
              if (annotationEdmType !== '') {
                type = EdmType[propertyData.EdmType.substring(4)];
              }

              exportColumns.push({
                label: label,
                property: property,
                type: type ? type : EdmType.String
              });
            }
          } else {
            exportColumns.push({
              label: label,
              property: property,
              type: EdmType.String
            });
          }

        })

        return exportColumns;
      },

      _createDataSourceConfig: async function () {
        var exportData = await new Promise(function (resolve) {
          setTimeout(function () {
            var data = this.byId('idUiTable').getRows().map(row => {
              var obj = row.getBindingContext().getObject();

              row.getCells().forEach(cell => {
                if (this.uniqueAttributes) {
                  let attributeFound = this.uniqueAttributes.find(attr => {
                    return cell.getBindingInfo('text').parts[0].path === attr;
                  });

                  if (attributeFound) {
                    obj[attributeFound] = cell.getProperty('text');
                  }
                }
              })

              return obj;
            });

            resolve(data);
          }.bind(this), 500);
        }.bind(this));

        return exportData;
      },

      onOpenP13NPopup: function (evt) {
        var p13nPopup = this.byId("p13nPopup");
        if (!this._bIsOpen) {
          this._setP13NPopupInitialData();
          this._bIsOpen = true;
        }

        this.p13nSelectedItems = p13nPopup.getPanels()[0].getAggregation('_content').getAggregation('items')[0].getSelectedItems();

        p13nPopup.open(evt.getSource());
      },

      _setP13NPopupInitialData: function () {
        var columns = [];
        var metadataProperties = [];
        var selectionPanel = this.byId("columnsPanel");

        const interval = setInterval(() => {
          try {
            metadataProperties = this.getView().getModel().getMetaModel().getODataEntityType('catalogService.funct_locationsSet').property;

            this.entityPropertiesData.forEach(property => {

              let metaProperty = metadataProperties.find(metaProperty => {
                return metaProperty.name === property.Value['Path'];
              });

              if (metaProperty['sap:sortable'] === undefined) {
                let isDefault = this.defaultTableColumns.find(defaultItem => {
                  return defaultItem.Value['Path'] === property.Value['Path'];
                });

                let visible = false;
                if (isDefault) {
                  visible = true;
                }

                columns.push({ visible: visible, name: property.Value['Path'], label: property.Label['String'] });
              }

            });

            selectionPanel.setP13nData(columns);
            this.p13nSelectedItems = this.byId("p13nPopup").getPanels()[0].getAggregation('_content').getAggregation('items')[0].getSelectedItems();

            clearInterval(interval);
          } catch (error) {

          }
        }, 200);
      },

      onP13NPopupClose: function (evt) {
        if (evt.getParameter('reason').toLowerCase() === 'ok') {
          let selectedColumns = this.byId("p13nPopup").getPanels()[0].getAggregation('_content').getAggregation('items')[0].getSelectedItems();
          this._columnsUpdate('Base', selectedColumns, true);
          this._addFilterFromP13NSelection(selectedColumns);
        } else {
          this._resetP13NSelections();
        }
      },

      _resetP13NSelections: function () {
        // var columns = [];
        // var selectionPanel = this.byId("columnsPanel");

        // this.entityPropertiesData.forEach(property => {
        //   let isVisible = this.p13nSelectedItems.find(item => {
        //     return item.getBindingContext('$p13n').getObject().name === property.Value['Path'];
        //   });

        //   let visible = false;
        //   if (isVisible) {
        //     visible = true;
        //   }

        //   columns.push({ visible: visible, name: property.Value['Path'], label: property.Label['String'] });
        // });

        // selectionPanel.setP13nData(columns);

        var columns = [];
        var metadataProperties = [];
        var selectionPanel = this.byId("columnsPanel");

        const interval = setInterval(() => {
          try {
            metadataProperties = this.getView().getModel().getMetaModel().getODataEntityType('catalogService.funct_locationsSet').property;

            this.entityPropertiesData.forEach(property => {

              let metaProperty = metadataProperties.find(metaProperty => {
                return metaProperty.name === property.Value['Path'];
              });

              if (metaProperty['sap:sortable'] === undefined) {
                let isVisible = this.p13nSelectedItems.find(item => {
                  return item.getBindingContext('$p13n').getObject().name === property.Value['Path'];
                });

                let visible = false;
                if (isVisible) {
                  visible = true;
                }

                columns.push({ visible: visible, name: property.Value['Path'], label: property.Label['String'] });
              }

            });

            selectionPanel.setP13nData(columns);
            clearInterval(interval);
          } catch (error) {

          }
        }, 200)
      },

      _addFilterFromP13NSelection: function (selectedColumns) {
        var filtersListData = this.getView().getModel('filtersListBase').getData();

        selectedColumns.forEach(column => {
          var obj = column.getBindingContext('$p13n').getObject();

          let found = filtersListData.find(existingFilter => {
            return existingFilter.field === obj.name;
          });

          if (!found) {
            filtersListData.push({
              field: obj.name,
              description: obj.label,
              filterType: 'eq',
              filterValue: '',
              filterInputSource: undefined
            })
          }
        });

        this.byId('idFiltersListBase').getBinding('items').refresh();

        this._handlePanelExpanded('filtersListBase', 'idBaseFiltersPanel');
      },

      openFilterFieldValueHelp: function (evt) {
        let entityTypeName = 'search_' + evt.getSource().getModel('filterValueDialogModel').getData().atnam.toLowerCase() + 'Set';

        let atinn = evt.getSource().getModel('filterValueDialogModel').getProperty("/atinn");
        if (atinn) {
          entityTypeName = 'search_characteristics_valuesSet'
        }

        let entityFound = this.getView().getModel().getServiceMetadata().dataServices.schema[0].entityType.find(entityType => {
          return entityType.name === entityTypeName;
        });

        if (entityFound) {
          this._loadValueHelpDialog(entityFound.name);
        }
      },

      _loadValueHelpDialog: function (entity) {
        this._oBasicSearchField = new SearchField();
        this.loadFragment({
          name: "charsearchcustom.view.fragments.FilterFieldValueHelpDialog"
        }).then(function (oDialog) {
          var oFilterBar = oDialog.getFilterBar(), oColumnCode, oColumnDescription;
          this._oVHD = oDialog;

          this.getView().addDependent(oDialog);

          // Set Basic Search for FilterBar
          oFilterBar.setFilterBarExpanded(false);
          oFilterBar.setBasicSearch(this._oBasicSearchField);

          // Trigger filter bar search when the basic search is fired
          this._oBasicSearchField.attachSearch(function () {
            oFilterBar.search();
          });

          oDialog.getTableAsync().then(function (oTable) {

            oTable.setModel(this.getView().getModel());

            let atinn = this.getView().getModel('filterValueDialogModel').getProperty("/atinn");
            let path = "/" + entity;

            // For Desktop and tabled the default table is sap.ui.table.Table
            if (oTable.bindRows) {
              oTable.setSelectionMode('Single');

              // Bind rows to the ODataModel and add columns
              oTable.bindAggregation("rows", {
                path: path,
                events: {
                  dataReceived: function (data) {
                    oDialog.update();
                  }
                }
              });
              oColumnCode = new Column({ label: new Label({ text: "Codice" }), template: new Text({ wrapping: false, text: "{code}" }) });
              oColumnCode.data({
                fieldName: "code"
              });
              oColumnDescription = new Column({ label: new Label({ text: "Descrizione" }), template: new Text({ wrapping: false, text: "{description}" }) });
              oColumnDescription.data({
                fieldName: "description"
              });
              oTable.addColumn(oColumnCode);
              oTable.addColumn(oColumnDescription);

              if (atinn) {
                oTable.getBinding("rows").filter(new Filter({ path: "atinn", operator: FilterOperator.EQ, value1: atinn }))
              }
            }

            // For Mobile the default table is sap.m.Table
            if (oTable.bindItems) {
              // Bind items to the ODataModel and add columns
              oTable.bindAggregation("items", {
                path: path,
                template: new ColumnListItem({
                  cells: [new Label({ text: "{code}" }), new Label({ text: "{description}" })]
                }),
                events: {
                  dataReceived: function () {
                    oDialog.update();
                  }
                }
              });
              oTable.addColumn(new MColumn({ header: new Label({ text: "Codice" }) }));
              oTable.addColumn(new MColumn({ header: new Label({ text: "Descrizione" }) }));

              if (atinn) {
                oTable.getBinding("items").filter(new Filter({ path: "atinn", operator: FilterOperator.EQ, value1: atinn }))
              }
            }
            oDialog.update();
          }.bind(this));

          oDialog.open();
        }.bind(this));
      },

      onValueHelpOkPress: function (evt) {
        let key = evt.getParameter('tokens')[0].getProperty('key');
        this.getView().getModel('filterValueDialogModel').setProperty('/filterValue', key);
        this._oVHD.close();
      },

      onValueHelpCancelPress: function () {
        this._oVHD.close();
      },

      onValueHelpAfterClose: function () {
        this._oVHD.destroy();
      },

      onFilterBarSearch: function (oEvent) {
        var sSearchQuery = this._oBasicSearchField.getValue(),
          aSelectionSet = oEvent.getParameter("selectionSet");

        var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
          if (oControl.getValue()) {
            aResult.push(new Filter({
              path: oControl.getName(),
              operator: FilterOperator.Contains,
              value1: oControl.getValue()
            }));
          }

          return aResult;
        }, []);

        let atinn = this.getView().getModel('filterValueDialogModel').getProperty("/atinn");
        if (atinn) {
          aFilters.push(new Filter({ path: "atinn", operator: FilterOperator.EQ, value1: atinn }))
        }

        aFilters.push(new Filter({
          filters: [
            new Filter({ path: "code", operator: FilterOperator.Contains, value1: sSearchQuery }),
            new Filter({ path: "description", operator: FilterOperator.Contains, value1: sSearchQuery })
          ],
          and: false
        }));


        this._filterValueHelpTable(new Filter({
          filters: aFilters,
          and: true
        }));
      },

      _filterValueHelpTable: function (oFilter) {
        var oVHD = this._oVHD;

        oVHD.getTableAsync().then(function (oTable) {
          if (oTable.bindRows) {
            oTable.getBinding("rows").filter(oFilter);
          }
          if (oTable.bindItems) {
            oTable.getBinding("items").filter(oFilter);
          }

          oVHD.update();
        });
      }


    });
  }
);
