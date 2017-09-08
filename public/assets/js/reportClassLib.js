
reportLib = {};

reportLib = {
  casher_report: {
    Name: "Кассовый отчет",
    object: "casher_report",
    Modal: ["users", "dates", "paymentType"]
  },
  k17: {
    Name: "Отчет расхода бланков",
    object: "casher_report_k_17",
    Modal: ["users", "dates"]
  },
  journal_of_operations: {
    Name: "Полный журнал операций",
    object: "casher_journal_of_operations",
    Modal: ["users", "dates"]
  },
  reg_root: {
    Name: "Реестр на передачу корешков билетов",
    object: "register_transfer_of_roots",
    Modal: ["actions", "users"]
  },
  sale_of_tickets_for_action: {
    Name: "Отчет о продаже билетов по мероприятию",
    object: "sale_of_tickets_for_action",
    Modal: ["users", "dates", "paymentType"]
  },
  delivery_note: {
    Name: "Накладная на выдачу квоты",
    object: "delivery_note",
    Modal: ["order"]
  },
  return_note: {
    Name: "Накладная на возврат билетов",
    object: "return_note",
    Modal: ["actions"]
  },
  action_sales_by_agents: {
    Name: "Отчет о продаже билетов уполномочиными",
    object: "action_sales_by_agents",
    Modal: ["actions"]
  },
  raportichka: {
    Name: "Рапортичка",
    object: "raportichka",
    Modal: ["actions"]
  }
};

MB.reportLib = reportLib