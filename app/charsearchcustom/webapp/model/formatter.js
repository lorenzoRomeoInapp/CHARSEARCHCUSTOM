sap.ui.define([], function () {
    "use strict";
    return {

        parseNumericValues: function (value) {
            if (value !== "" && value !== null && value !== undefined) {
                const options = {
                    style: 'decimal',
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                };

                
                return parseFloat(value).toLocaleString('it', options);
            }
        },

        parseDate: function(value){
            if(value){
                var date = value.toLocaleDateString('it-IT');
                var splitDate = date.split('/');
                splitDate[1] = splitDate[1].padStart(2, '0');

                return splitDate.join('/');
            }
        }

    }
});