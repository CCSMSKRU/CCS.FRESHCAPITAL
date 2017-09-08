select distinct(fin_id) from (

SELECT
	fin.id as fin_id,
	op.amount as amount,

	@body := op.amount*100/(100+fin.factoring_rate) as body,
	fin.broker_comission,
	@All_comission := @body * (fin.broker_comission/100) + op.amount * (fin.processing_bank_commission / 100) as all_comission,
	@VGamount := ROUND((op.amount - @body - @All_comission) * 0.4 , 2) as VGamount,
	op2.amount as amount2
FROM
	investor_account_operation op
LEFT JOIN investor_account_operation op2 ON op2.investor_account_id = op.investor_account_id AND op2.payment_id = op.payment_id
LEFT JOIN merchant_financing fin on fin.id = op.merchant_financing_id

WHERE
	op.subtype_id = 4
AND op2.subtype_id = 5
and op.deleted is null
and op2.deleted is null
and fin.deleted is null
order by op.amount

) as t1
where t1.amount2 <> t1.VGamount