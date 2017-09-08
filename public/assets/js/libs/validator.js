/**
 * Created by iig on 17.09.2015.
 */
var Validator = function (params) {
    var self = this;
    if (typeof params !== 'object') params = {};
    this.defaultLanguage = params.defaultLanguage || 'ru';
    this.info = {
        isDate: {
            ru: {
                name: 'Проверка на дату',
                text: 'Значение не является датой.'
            }
        },
        notNull: {
            ru: {
                name: 'Проверка на пустое значение',
                text: 'Поле не должно быть пустым.'
            }
        },
        number: {
            ru: {
                name: 'Проверка на число',
                text: 'Значение не является числом.'
            }
        },
        url: {
            ru: {
                name: 'Проверка на URL',
                text: 'Значение не является URL адресом.'
            }
        },
        int: {
            ru: {
                name: 'Проверка на целочисленное',
                text: 'Значение не является целочисленным.'
            }
        },
        float: {
            ru: {
                name: 'Проверка на нецелочисленное',
                text: 'Значение не является нецелочисленным.'
            }
        },
        time: {
            ru: {
                name: 'Проверка на время',
                text: 'Значение имеет не правильный формат времени.'
            }
        },
        date: {
            ru: {
                name: 'Проверка на дату',
                text: 'Значение не является датой.'
            }
        },
        datetime: {
            ru: {
                name: 'Проверка на дату и время',
                text: 'Значение не является датой со временем.'
            }
        }
    };
    this.texts = {
        ru: {
            text1: 'Нет информации по данному типу валидации.',
            text2: 'Нет информации для данного языка: '
        }
    };
    this.getValidatorInfo = function (name, language) {
        language = language || self.defaultLanguage;
        var item = self.info[name];
        var text1 = self.texts[language].text1 || 'No info.';
        var text2 = self.texts[language].text2 || 'No info for language: ';
        if (!item) return {name: name, text: text1};
        if (!item[language])return {name: name, text: text2 + language};
        return item[language];
    };
};
Validator.prototype.isDate = function (val) {
    return moment(val).isValid();
};
Validator.prototype.notNull = function (val) {
    if (val === undefined || val === null) return false;
    return (String(val).length>0);
};
Validator.prototype.number = function (val) {
    if (val === '') {
        return false;
    }
    return !isNaN(+val);
};
Validator.prototype.url = function (val) {
    var regExp = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/;
    return regExp.test(val);
};
Validator.prototype.email = function (val) {
    var regExp = /^([\w\._]+)@\1\.([a-z]{2,6}\.?)$/;
    return regExp.test(val);
};
Validator.prototype.int = function (val) {
    var reg = new RegExp(/^\s*[0-9]+\s*$/);
    return reg.test(val);
};
Validator.prototype.float = function (val) {
    var reg = new RegExp(/^\s*[0-9]+[\.]?[0-9]+\s*$/);
    return reg.test(val);
};
Validator.prototype.time = function (val) {
    var reg = new RegExp(/^\s*[0-9][0-9]\:[0-9][0-9]\s*$/);
    return reg.test(val);
};
Validator.prototype.date = function (val) {
    var reg = new RegExp(/^\s*[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]\s*$/);
    return reg.test(val);
};
Validator.prototype.datetime = function (val) {
    var reg = new RegExp(/^\s*[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]\s+[0-9][0-9]\:[0-9][0-9]\s*$/);
    return reg.test(val);
};