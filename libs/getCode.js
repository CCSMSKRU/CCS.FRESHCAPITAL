/**
 * Created by iig on 29.10.2015.
 */
//var e = {"results":[{"code":"-1","object":"Sessions","toastr":{"type":"error","title":"ОШИБКА","message":"Не правильный логин/пароль"}}],"connection_id":"","in_out_key":"-qS-6EfVbMO8nJ5BMhYi"};

var errors = {
    // Отрицательныные значения - отладка
    unknow:{
        code: -1000,
        message:'Неизвестная ошибка'
    },
    sysError:{
        code: -999,
        type: 'warning',
        title:'Отладка',
        message:'Произошла системная ошибка. См. консоль.'
    },
    sysCommand:{
        code: -998,
        type: 'warning',
        title:'Системная команда',
        message:'Вы не можете использовать данную команду.'
    },
    //888 Ошибка на клиенте/ В результате null или ош.
    // 0 - Все ОК
    ok:{
        code: 0,
        title:'Ок',
        message:'',
        type:'success'
    },
    noToastr:{
        code: 0,
        title:'Ок',
        message:'',
        type:'success'
    },
    //  -4 и от 1 до 100 ошибки доступа
    noAuth:{
        code: -4,
        message:'Вы должны авторизироваться в системе'
    },
    invalidSession:{
        code: 1,
        message:'Необходимо авторизироваться'
    },
    invalidAuthData:{
        code: 2,
        message:'Неправильный логин или пароль'
    },
    noAccess:{
        code: 11,
        message:'Недостаточно привилегий'
    },
    needConfirm:{
        code: 10,
        type:'warning',
        title:'Подтверждение операции.',
        message:'Данная операция требует подтверждения.'
    },
    invalidToken:{
        code: 50,
        type:'error',
        title:'Ошибка авторизации.',
        message:'Не верный токен.'
    },
    duplicatePayment:{
        code: 60,
        type:'error',
        title:'Ошибка платежа.',
        message:'Такой платеж уже зачислен.'
    },
    internalError:{
        code: 70,
        type:'error',
        title:'Внутренняя ошибка, мискузи.',
        message:'Что-то пошло не так, звоните: +7 (906) 063-88-66, +7 (968) 822-20-76'
    },
    alertDeveloper:{
        code: 70,
        type:'error',
        title:'Такого не должно происходить. Сообщите разработчикам.<br>ivantgco@gmail.com, alextgco@gmail.com <br>+7 (968) 822-20-76, +7 (906) 063-88-66',
        message:''
    },
    wrongPaymentDate:{
        code: 80,
        type:'error',
        title:'Ошибка платежа.',
        message:'Указанный день не является рабочим'
    },
    // от 101 до 200 ошибки работы с данными
    invalid:{
        code: 101,
        type:'error',
        message:'Некоторые поля заполнены не верно.'
    },
    notModified:{
        code: 102,
        type:'error',
        message:'Запись не найдена или не было изменений.'
    },
    rowNotFound:{
        code: 103,
        type:'error',
        message:'Запись не найдена.'
    },
    requiredErr:{
        code: 104,
        type:'error',
        message:'Заполните все обязательные поля.'
    },
    // от 1001 пользовательские ошибки

    ER_DUP_ENTRY:{
        code: 1062,
        type:'error',
        message:'Такая запись уже существует.'
    },

    // от 2001 - ошибки site протокола
    sysErrorSite:{
        code: -999,
        type: 'warning',
        title:'Отладка',
        message:'Произошла системная ошибка.</br>Сообщите пожалуйста нам. </br>+7 (906) 063-88-66'
    },
    noAuthSite:{
        code: 2001,
        message:'Не удалось идентифицировать запрос'
    },
    errRequest:{
        code: 2002,
        message:'Некорректно переданы параметры запроса.'
    },
    badCommand:{
        code: 2003,
        message:'Такой команды не существует.'
    },
    badParams:{
        code: 2004,
        message:'Неверные параметры.'
    }



};

module.exports = function(name, obj, obj2){
    if (typeof obj2=='object'){
        if (typeof obj!=='object') obj = {message:obj};
        for (var i in obj2) {
            obj[i] = obj[i] || obj2[i];
        }
    }
    if (name == 'noToastr') {
        delete obj.message;
        obj.code = 0;
        return obj;
    }
    if (typeof name!=='string') name = 'unknow';
    if (typeof obj!=='object') {
        if (typeof obj==='string') obj = {message:obj};
        else obj = {};
    }

    var tamplete = errors[name] || {
            code: 1001,
            title:'ОШИБКА',
            message: name,
            type:'error'
        };
    obj.type = obj.type || tamplete.type || 'error';
    obj.title = (typeof obj.title!=='undefined')? obj.title : (typeof tamplete.title!=='undefined') ? tamplete.title : 'ОШИБКА';
    obj.message = (typeof obj.message!=='undefined')? obj.message : (typeof obj.msg!=='undefined')? obj.msg : (typeof tamplete.message!=='undefined') ? tamplete.message : 'ОШИБКА';
    var o = {
        code: tamplete.code,
        toastr:{}
    };
    for (var i in obj) {
        var item = obj[i];
        if (i=='msg' || i=='toastr') continue;
        if (i=='type' || i=='title' || i=='message'){
            o.toastr[i] = item; continue;
        }
        o[i] = item;
    }
    return o;
};