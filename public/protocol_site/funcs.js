var funcs = {
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
    dateAmoreB: function (a, b) {
        var a1 = moment(a);
        var b1 = moment(b);
        return a1 >= b1;
    },
    cloneObj: function (obj) {
        if (obj == null || typeof(obj) != 'object') {
            return obj;
        }
        var temp = {};
        if (obj.length) {
            temp = [];
        }
        for (var key in obj) {
            temp[key] = this.cloneObj(obj[key]);
        }
        return temp;
    },
    parseBlob: function (arr) {
        if (typeof arr !== 'object') {
            return arr;
        }
        return arr.toString();
    },
    guid: function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r, v;
            r = Math.random() * 16 | 0;
            v = (c === "x" ? r : r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
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
    checkArray: function (arr) {
        if (typeof arr != 'object') return false;
        return (typeof arr.push == 'function' && typeof arr.pop == 'function' && typeof arr.length == 'number');
    },
    //validation:'', Используй validator.js весь функционал там
    jsonToObj: function (obj) {
        var i, j, result = {},
            convert = function (d, n) {
                for (i in obj[d]) {
                    result[i] = {};
                    for (j in obj[n]) {
                        result[i][obj[n][j]] = obj[d][i][j];
                    }
                }
            };

        if (obj['DATA'] && obj['NAMES']) convert('DATA', 'NAMES');
        else if (obj['data']) {
            if (obj['data_columns']) convert('data', 'data_columns');
            else if (obj['names']) convert('data', 'names');
        } else result = obj;

        return result;
    },
    makeQuery: function (options) {
        var key, opt, xml;
        opt = funcs.cloneObj(options);
        xml = "<query>";
        if (opt && typeof opt === "object" && opt.command) {
            if (opt.hasOwnProperty("params")) {
                for (key in opt.params) {
                    xml += "<" + key + ">" + opt.params[key] + "</" + key + ">";
                }
                delete opt.params;
            }
            for (key in opt) {
                xml += "<" + key + ">" + opt[key] + "</" + key + ">";
            }
            xml += "</query>";
        }
        return xml;
    }


};