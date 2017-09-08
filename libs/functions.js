var moment = require('moment');
var MyError = require('../error').MyError;
let config = require('../config/config.json');

var funcs = {
    guid: function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r, v;
            r = Math.random() * 16 | 0;
            v = (c === "x" ? r : r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    },
    formatResponse: function (code, type, message, data) {
        code = code || 0;
        var o = {
            code: code,
            toastr: {
                type: type,
                message: message
            }
        };
        if (data) {
            o.data = data;
            if (!isNaN(data.count)) {
                o.totalCount = data.count;
                delete data.count;
            }
        }

        return o;
    },
    getDateTimeMySQL: function (d) {
        if (d) {
            if (moment(d, 'DD.MM.YYYY').isValid()) {
                return moment(d, 'DD.MM.YYYY').format('YYYY-MM-DD HH:mm:ss');
            } else {
                return d;
            }
        } else if (d === '') {
            return null;
        }
        return moment().format('YYYY-MM-DD HH:mm:ss');
    },
    getDateMySQL: function (d) {
        if (d) {
            if (moment(d, 'DD.MM.YYYY').isValid()) {
                return moment(d, 'DD.MM.YYYY').format('YYYY-MM-DD');
            } else {
                return d;
            }
        } else if (d === '') {
            return null;
        }
        return moment().format('YYYY-MM-DD');
    },
    getDate: function () {
        return moment().format('DD.MM.YYYY');
    },
    date_A_more_B: function (a, b, format) {
        format = format || 'DD.MM.YYYY';
        var a1 = moment(a, format);
        var b1 = moment(b, format);
        return a1 > b1;
    },
    date_A_more_or_equal_B: function (a, b, format) {
        format = format || 'DD.MM.YYYY';
        var a1 = moment(a, format);
        var b1 = moment(b, format);
        return a1 >= b1;
    },
    parseBlob: function (arr) {
        if (typeof arr !== 'object') {
            return arr;
        }
        return arr.toString();
    },
    parseBool: function (val) {
        return !!val;
    },
    formatMoney: function (val) {
        if (!val) val = 0;
        if (isNaN(+val)) return val;
        return +val.toFixed(2);
    },
    formatPercent: function (val) {
        if (!val) val = 0;
        if (isNaN(+val)) return val;
        return val.toFixed(2);
    },
    nullToString: function (val) {
        return (val === null) ? '' : val;
    },
    returnVasja: function (val) {
        return 'Вася';
    },
    age: function (val, f) {
        f = f || "YYYY-MM-DD";
        if (!moment(val, f).isValid()) {
            return val;
        }
        var a = moment(val, f);
        var b = moment();
        return b.diff(a, 'years');
    },
    userFriendlyDate: function (val) {
        if (!moment(val).isValid()) {
            return val;
        }
        var a = moment(val).format('DD.MM.YYYY');
        return a;
    },
    userFriendlyDateTime: function (val) {
        if (!moment(val).isValid()) {
            return val;
        }
        var a = moment(val).format('DD.MM.YYYY HH:mm:ss');
        return a;
    },
    clearEmpty: function (arr) {
        if (typeof arr !== 'object') {
            return arr;
        }
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === undefined) {
                arr.splice(i, 1);
                funcs.clearEmpty();
            }
        }

    },
    between: function (a, b) {
        var min = Math.min.apply(Math, [a, b]),
            max = Math.max.apply(Math, [a, b]);
        return this > min && this < max;
    },
    validation: {
        isDate: function (val, format) {
            if (!val) return false;
            return moment(val, (format || 'DD.MM.YYYY')).isValid();
        },
        notNull: function (val) {
            if (val === undefined || val === null) return false;
            return (String(val).length > 0);
        },
        number: function (val) {
            if (val === '') {
                return false;
            }
            return !isNaN(+val);
        },
        url: function (val) {
            var regExp = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/;
            return regExp.test(val);
        },
        email: function (val) {
            //var regExp = /^([\w\._]+)@\1\.([a-z]{2,6}\.?)$/;
            var regExp = /.+@.+\..+/i;
            return regExp.test(val);
        }
    },
    makeQuery: function (options, callback) {
        var xml = "<query>";
        //if (options && typeof options === "object" && options.object && options.command) {
        if (options && typeof options === "object" && options.command) {
            if (options.hasOwnProperty("params")) {
                for (var key in options.params) {
                    xml += "<" + key + ">" + options.params[key] + "</" + key + ">";
                }
                //delete options.params;
            }
            for (var key in options) {
                if (key == "params") continue;
                xml += "<" + key + ">" + options[key] + "</" + key + ">";
            }
            xml += "</query>";
        }
        return xml;
    },
    jsonToObj: function (obj) {
        var obj_true = {};
        var objIndex = {};
        for (i in obj['data']) {
            for (var index in obj['data_columns']) {
                if (obj_true[i] == undefined) {
                    obj_true[i] = {};
                }
                obj_true[i][obj['data_columns'][index]] = obj['data'][i][index];
            }
        }
        return obj_true;
    },
    cloneObj: function (obj, depth, currentDepth) {
        depth = (typeof depth !== 'undefined') ? depth : 10000;
        funcs.cloneObjCounter = currentDepth || 0;
        if (obj == null || typeof(obj) != 'object') {
            return obj;
        }
        var temp = {};
        if (Array.isArray(obj)) {
            temp = [];
        }
        for (var key in obj) {
            if (key == 'socket') continue;
            if (funcs.cloneObjCounter < depth) {
                //funcs.cloneObjCounter++;
                temp[key] = this.cloneObj(obj[key], depth, funcs.cloneObjCounter);
            }

        }
        return temp;
    },
    countObj: function (obj) {
        if (typeof obj !== "object") {
            return -1;
        }
        var counter = 0;
        for (var i in obj) {
            counter++;
        }
        return counter;
    },
    collapseData: function (arr, extra_data, data_columns) {
        if (typeof arr != 'object') {
            return new MyError('В функцию collapseData пришли не верные данные', arr);
        }
        var o = {
            data_columns: data_columns || [],
            data: [],
            extra_data: extra_data || {}
        };
        var dataColumns = data_columns || [];
        for (var i0 in arr[0]) {
            dataColumns.push(i0);
        }
        for (var i in arr) {
            var row = arr[i];
            o.data[i] = {};
            for (var j in dataColumns) {
                o.data[i][j] = row[dataColumns[j]];
            }
        }
        o.data_columns = dataColumns;
        o.code = 0;
        return o;
    },


    parseObjectToString: function (obj, level) {
        let _t = this;

        try {
            let content = '';
            let tab = ";".repeat(+level || 0);

            if (typeof obj == 'object') {
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] == 'object') {
                            if (Array.isArray(obj[key])) {
                                if (obj[key].length > 0) {
                                    if (obj[key].length == 1 && typeof obj[key][0] != 'object') {
                                        content += tab + "\'" + key + "\':;\'" + obj[key][0] + '\'\n';
                                    } else {
                                        content += tab + "\'" + key + "\':" + '\n';

                                        obj[key].forEach(function (v, i) {
                                            content += _t.parseObjectToString(v, level + 1);

                                            if (i < obj[key].length - 1) content += tab + ';-;-\n';
                                        });
                                    }
                                }
                            } else {
                                content += tab + "\'" + key + "\':" + '\n';
                                content += _t.parseObjectToString(obj[key], level + 1);
                            }
                        } else {
                            content += tab + "\'" + key + "\':;\'" + obj[key] + '\'\n';
                        }
                    }
                }

                return content;
            } else {
                return tab + "\'" + obj + '\'\n';
            }
        } catch (e) {
            console.log(e);

            return 'error while parsing';
        }
    },
    getSystemURL: function () {
        return config ? 'http://' + config.host + ':' + config.port + '/' : 'http://127.0.0.1:81/';
    }

};
module.exports = funcs;