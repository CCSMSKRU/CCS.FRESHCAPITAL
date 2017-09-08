//
//ррн
//код автор
//номер терминала
//мерчант
//возврат или поступлени или холд
//маска
//дата
//дата постирования (когда прошла транзакция в их банке)

var inc = {
    data: [
        {
            rrn: 123456789012, // Retrival Reference Number это уникальный идентификатор транзакции, который присваивает Банк к карте и банк по этому РРН может найти любую транзакцию
            auth_code: 123456, //
            terminal_id: 123,
            merchant_id: 25,
            type: "PURCHASE",
            pan_mask: "456789|7896",
            transaction_datetime: "datetime",
            execute_datetime: "datetime",
            amount: 4000
        }
    ],
    defaults: [
        {

        }
    ]
};