var paramExample = {
    required: true,
    default: 'test',
    valueMethod:'val', // html() ...
    validation: { // Здесь может быть объект, массив или значение. Объект использует format, func
        format: [
            {
                func: 'addToEnd',
                args: ['Добавим текст в конец']
            },
            {
                func: 'addToEnd',
                args: ['Еще добавим.']
            }
        ],
        func: 'notNull'
    }
};


var methodos = {
    test: {
        name:'test',
        name_ru:'Test',
        description:'Вернет массив с тестами',
        responseJSON:
            '' +
            '\nНет примера\n' +
            '',
        o:{
            command:'test',
            params:{

            }
        }
    },

    get_merchant_financing_list: {
        name:'get_merchant_financing_list',
        name_ru:'Получить список финансирований торговца',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'get_merchant_financing_list',
            params:{
                merchant_id:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Уникальный ключ торговца'
                }
            }
        }
    },
    report_merchant_factoring: {
        name:'report_merchant_factoring',
        name_ru:'Получить финанисрование',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'report_merchant_factoring',
            params:{
                merchant_financing_id:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Уникальный ключ финансирования'
                }
            }
        }
    },
    download_merchant_factoring: {
        name:'download_merchant_factoring',
        name_ru:'Скачать отчет по платежам',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'download_merchant_factoring',
            params:{
                merchant_financing_id:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Уникальный ключ финансирования'
                }
            }
        }
    },
    report_invoices: {
        name:'report_invoices',
        name_ru:'Получить счета торговца',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'report_invoices',
            params:{
                merchant_id:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Уникальный ключ торговца'
                },
                from_date:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Дата начала финансирования (дд.мм.гггг)'
                },
                to_date:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Дата окончания финансирования (дд.мм.гггг)'
                }
            }
        }
    },
    download_invoice: {
        name:'download_invoice',
        name_ru:'Скачать файл счета',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'download_invoice',
            params:{
                invoice_id:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Уникальный ключ счета'
                },
                fin_id:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Уникальный ключ финансирования'
                }
            }
        }
    },

    get_business_type: {
        name:'get_business_type',
        name_ru:'Получить типы бизнеса',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'get_business_type',
            params:{
                limit:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Можно поставить ограничение'
                },
                page_no:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Можно указать страницу'
                }
            }
        }
    },
    calculate: {
        name:'calculate',
        name_ru:'Рассчитать',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'calculate',
            params:{
                business_type_id:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'id Тип бизнеса. Например 11'
                },
                card_turnover:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Месячный оборот по картам'
                },
                factoring_rate:{
                    required:true,
                    default:19,
                    validation:'notNull',
                    description: 'Ставка факторинга'
                }
            }
        }
    },
    calculate_by_founding_amount: {
        name:'calculate_by_founding_amount',
        name_ru:'Пересчет по ставке факторинга ',
        description:'Покупатель на сайте может сам указать сумму факторинга и пересчитать остальные параметры по ней',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'calculate',
            params:{
                recalc_type:{
                    required:true,
                    default:'by_founding_amount',
                    validation:'notNull',
                    description: '{ by_founding_amount | by_payment_amount | by_payments_count }'
                },
                founding_amount:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Сумма финансирования.'
                }
            }
        }
    },
    calculate_by_payment_amount: {
        name: 'calculate_by_payment_amount',
        name_ru: 'Пересчет по сумме платежа ',
        description: 'Покупатель на сайте может сам указать сумму платежа и пересчитать остальные параметры по нему',
        responseJSON: '' +
        '\nНет примера\n' +
        '',
        o: {
            command: 'calculate',
            params: {
                recalc_type: {
                    required: true,
                    default: 'by_payment_amount',
                    validation: 'notNull',
                    description: '{ by_founding_amount | by_payment_amount | by_payments_count }'
                },
                founding_amount: {
                    required: true,
                    default: '',
                    validation: 'notNull',
                    description: 'Сумма финансирования.'
                },
                payment_amount: {
                    required: true,
                    default: '',
                    validation: 'notNull',
                    description: 'Сумма платежа.'
                }
            }
        }
    },
    calculate_by_payments_count: {
        name:'calculate_by_payments_count',
        name_ru:'Пересчет по количеству платежей ',
        description:'Покупатель на сайте может сам указать количество платежей и пересчитать остальные параметры по нему',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'calculate',
            params:{
                recalc_type:{
                    required:true,
                    default:'by_payments_count',
                    validation:'notNull',
                    description: '{ by_founding_amount | by_payment_amount | by_payments_count }'
                },
                founding_amount:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Сумма финансирования.'
                },
                payments_count:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Количество платежей.'
                }
            }
        }
    },
    request_from_site_CALL_ME: {
        name:'request_from_site',
        name_ru:'Заявка с сайта CALL_ME',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'request_from_site',
            params:{
                type:{
                    required:true,
                    default:'CALL_ME',
                    validation:'notNull',
                    description: 'CALL_ME'
                },
                phone:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: '79991112233'
                },
                calltime:{
                    required:false,
                    default:'',
                    validation:'notNull',
                    description: 'calltime'
                }
            }
        }
    },
    request_from_site_ASK_QUESTION: {
        name:'request_from_site',
        name_ru:'Заявка с сайта ASK_QUESTION',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'request_from_site',
            params:{
                type:{
                    required:true,
                    default:'ASK_QUESTION',
                    validation:'notNull',
                    description: 'ASK_QUESTION'
                },
                email:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Email'
                },
                question:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Любой текст'
                }
            }
        }
    },
    request_from_site_FEEDBACK: {
        name:'request_from_site',
        name_ru:'Заявка с сайта FEEDBACK',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'request_from_site',
            params:{
                type:{
                    required:true,
                    default:'FEEDBACK',
                    validation:'notNull',
                    description: 'FEEDBACK'
                },
                name:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Петька'
                },
                email:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Email'
                },
                phone:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: '79991112233'
                },
                inn:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'ИНН'
                }

            }
        }
    },
    request_from_site_GET_FINANCING: {
        name:'request_from_site',
        name_ru:'Заявка с сайта GET_FINANCING',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'request_from_site',
            params:{
                type:{
                    required:true,
                    default:'GET_FINANCING',
                    validation:'notNull',
                    description: 'GET_FINANCING'
                },
                name:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Петька'
                },
                email:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Email'
                },
                phone:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: '79991112233'
                },
                founding_amount:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Сумма финансирования'
                },
                payments_count:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Количество платежей'
                },
                payment_amount:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Сумма одного платежа'
                },
                inn:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'ИНН'
                }
            }
        }
    },
    request_from_site_FEEDBACK_FULL: {
        name:'request_from_site',
        name_ru:'Заявка с сайта FEEDBACK_FULL',
        description:'',
        responseJSON:
        '' +
        '\nНет примера\n' +
        '',
        o:{
            command:'request_from_site',
            params:{
                type:{
                    required:true,
                    default:'FEEDBACK_FULL',
                    validation:'notNull',
                    description: 'FEEDBACK_FULL'
                },
                name:{
                    required:true,
                    default:'',
                    validation:'',
                    description: 'Петька'
                },
                email:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: 'Email'
                },
                phone:{
                    required:true,
                    default:'',
                    validation:'notNull',
                    description: '79991112233'
                },
                company:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Наименование компании'
                },
                anketa:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'Файл анкеты. В тестовом окружениии не работает. В бою передавай файл.'
                },
                inn:{
                    required:false,
                    default:'',
                    validation:'',
                    description: 'ИНН'
                }
            }
        }
    }
    //get_product: {
    //    name:'get_product',
    //    name_ru:'Запросить Продукты',
    //    description:'Вернет список продуктов. Можно передать id через запятую.<br>' +
    //    'Можно искать по имени или фильтровать по категории/подкатегории',
    //    responseJSON:
    //    '' +
    //    '\nНет примера\n' +
    //    '',
    //    o:{
    //        command:'get_product',
    //        params:{
    //            id:{
    //                required:false,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Можно передать id товара или несколько через запяту. Можно не передавать, будет полный набор'
    //            },
    //            category_id:{
    //                required:false,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Можно передать id категории или несколько через запяту. Можно не передавать, будет полный набор'
    //            },
    //            parent_category_id:{
    //                required:false,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Можно передать id подкатегории или несколько через запяту. Можно не передавать, будет полный набор'
    //            },
    //            name:{
    //                required:false,
    //                default:'',
    //                description: 'Можно вводить неполное название.'
    //            },
    //            columns:{
    //                required:false,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Можно передать столбцы через запятую'
    //            }
    //        }
    //    }
    //},
    //get_cart: {
    //    name:'get_cart',
    //    name_ru:'Получить корзину',
    //    description:'Вернет содержимое корзины',
    //    responseJSON:
    //    '' +
    //    '\nНет примера\n' +
    //    '',
    //    o:{
    //        command:'get_cart',
    //        params:{
    //            columns:{
    //                required:false,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Можно передать столбцы через запятую'
    //            }
    //        }
    //    }
    //},
    //add_product_in_cart: {
    //    name:'add_product_in_cart',
    //    name_ru:'Добавить продукт в корзину',
    //    description:'',
    //    responseJSON:
    //    '' +
    //    '\nНет примера\n' +
    //    '',
    //    o:{
    //        command:'add_product_in_cart',
    //        params:{
    //            product_id:{
    //                required:true,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Необходимо передать № продукта.'
    //            },
    //            product_count:{
    //                required:false,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Можно добавить несколько'
    //            }
    //        }
    //    }
    //},
    //remove_product_from_cart: {
    //    name:'add_product_in_cart',
    //    name_ru:'Удалит продукт из корзины',
    //    description:'',
    //    responseJSON:
    //    '' +
    //    '\nНет примера\n' +
    //    '',
    //    o:{
    //        command:'remove_product_from_cart',
    //        params:{
    //            product_id:{
    //                required:true,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Необходимо передать № продукта.'
    //            },
    //            product_count:{
    //                required:false,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Можно удалить несколько'
    //            }
    //        }
    //    }
    //},
    //clear_cart: {
    //    name:'clear_cart',
    //    name_ru:'Очистить корзину',
    //    description:'',
    //    responseJSON:
    //    '' +
    //    '\nНет примера\n' +
    //    '',
    //    o:{
    //        command:'clear_cart',
    //        params:{}
    //    }
    //},
    //create_order: {
    //    name:'create_order',
    //    name_ru:'Создать заказ',
    //    description:'',
    //    responseJSON:
    //    '' +
    //    '\nНет примера\n' +
    //    '',
    //    o:{
    //        command:'create_order',
    //        params:{
    //            phone:{
    //                required:true,
    //                default:'',
    //                validation:'notNull',
    //                description: 'Необходимо передать номер телефона.'
    //            }
    //        }
    //    }
    //}
};