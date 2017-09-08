var identifierRegexp = /^[0-9,a-z,A-Z_\.]*$/;

var escapeIdentifier = function(str, quote) {
    quote = quote || "`";
    if (identifierRegexp.test(str)) return str;
    else return '`' + str + '`';
};

var startsWith = function(value, str) {
    return value.slice(0, str.length) === str;
};

var upgradeWhere = function(connection){
    connection.where = function(where) {
        var dbc = this,
            result = '';
        for (var key in where) {
            var value = where[key],
                clause = key;
            if (typeof(value) === 'number') clause = key + ' = ' + value;
            else if (typeof(value) === 'string') {
                /**/ if (startsWith(value, '>=')) clause = key + ' >= ' + dbc.escape(value.substring(2));
                else if (startsWith(value, '<=')) clause = key + ' <= ' + dbc.escape(value.substring(2));
                else if (startsWith(value, '<>')) clause = key + ' <> ' + dbc.escape(value.substring(2));
                else if (startsWith(value, '>' )) clause = key + ' > '  + dbc.escape(value.substring(1));
                else if (startsWith(value, '<' )) clause = key + ' < '  + dbc.escape(value.substring(1));
                else if (startsWith(value, '(' )) clause = key + ' IN (' + value.substr(1, value.length-2).split(',').map(function(s) { return dbc.escape(s); }).join(',') + ')';
                else if (value.indexOf('..') !== -1) {
                    value = value.split('..');
                    clause = '(' + key + ' BETWEEN ' + dbc.escape(value[0]) + ' AND ' + dbc.escape(value[1]) + ')';
                } else if ((value.indexOf('*') !== -1) || (value.indexOf('?') !== -1)) {
                    value = value.replace(/\*/g, '%').replace(/\?/g, '_');
                    clause = key + ' LIKE ' + dbc.escape(value);
                }else if (value == 'setNULL') {
                    clause = key + '= NULL';
                } else clause = key + ' = ' + dbc.escape(value);
            }
            if (result) result = result + ' AND ' + clause; else result = clause;
        }
        return result;
    };
};

module.exports.upgradeWhere = upgradeWhere;