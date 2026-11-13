import type { StoreState } from "@/types";
import { computeStats } from "./store";
import {
  fileStamp,
  formatDate,
  formatDateTime,
  num,
  round2,
  toUsd,
  toSyp,
} from "./format";

const esc = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

type CellValue = string | number | null;

function cell(
  value: CellValue,
  style = "cell",
  options: { mergeAcross?: number; type?: "String" | "Number" } = {},
): string {
  let attrs = ` ss:StyleID="${style}"`;
  if (options.mergeAcross && options.mergeAcross > 0) {
    attrs += ` ss:MergeAcross="${options.mergeAcross}"`;
  }
  if (value === null || value === "") return `<Cell${attrs}/>`;
  const numeric = typeof value === "number";
  return `<Cell${attrs}><Data ss:Type="${numeric ? "Number" : "String"}">${
    numeric ? value : esc(String(value))
  }</Data></Cell>`;
}

function row(cells: string[], height?: number): string {
  return `<Row${height ? ` ss:Height="${height}"` : ""}>${cells.join("")}</Row>`;
}

function totalRow(label: string, values: CellValue[], labelSpan: number, numericStyle = "totalNum") {
  const cells: string[] = [cell(label, "total", { mergeAcross: labelSpan - 1 })];
  values.forEach((v) => cells.push(cell(v, numericStyle)));
  return row(cells, 24);
}

function sheet(name: string, widths: number[], rows: string[]): string {
  return `<Worksheet ss:Name="${esc(name)}">
<Table>
${widths.map((w) => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`).join("")}
${rows.join("\n")}
</Table>
<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
<DisplayRightToLeft/>
<Print><ValidPrinterInfo/><PaperSizeIndex>9</PaperSizeIndex><HorizontalResolution>600</HorizontalResolution></Print>
</WorksheetOptions>
</Worksheet>`;
}

const STYLES = `<Styles>
<Style ss:ID="Default" ss:Name="Normal">
  <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="10" ss:Color="#1E293B"/>
</Style>
<Style ss:ID="title">
  <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft" ss:WrapText="1"/>
  <Font ss:FontName="Tahoma" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
  <Interior ss:Color="#081830" ss:Pattern="Solid"/>
  <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1CB878"/></Borders>
</Style>
<Style ss:ID="sub">
  <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="9" ss:Color="#64748B"/>
  <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="head">
  <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft" ss:WrapText="1"/>
  <Font ss:FontName="Tahoma" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
  <Interior ss:Color="#0F4C81" ss:Pattern="Solid"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3A63"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3A63"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3A63"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3A63"/>
  </Borders>
</Style>
<Style ss:ID="cell">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft" ss:WrapText="1"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
  </Borders>
</Style>
<Style ss:ID="cellAlt">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft" ss:WrapText="1"/>
  <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
  </Borders>
</Style>
<Style ss:ID="num">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <NumberFormat ss:Format="#,##0.00"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
  </Borders>
</Style>
<Style ss:ID="numAlt">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <NumberFormat ss:Format="#,##0.00"/>
  <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
  </Borders>
</Style>
<Style ss:ID="int">
  <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <NumberFormat ss:Format="#,##0"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
  </Borders>
</Style>
<Style ss:ID="total">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="10" ss:Bold="1" ss:Color="#0D4D38"/>
  <Interior ss:Color="#D5F6E5" ss:Pattern="Solid"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1CB878"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1CB878"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1CB878"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1CB878"/>
  </Borders>
</Style>
<Style ss:ID="totalNum">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="10" ss:Bold="1" ss:Color="#0D4D38"/>
  <Interior ss:Color="#D5F6E5" ss:Pattern="Solid"/>
  <NumberFormat ss:Format="#,##0.00"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1CB878"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1CB878"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1CB878"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1CB878"/>
  </Borders>
</Style>
<Style ss:ID="section">
  <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="11" ss:Bold="1" ss:Color="#081830"/>
  <Interior ss:Color="#EAF7EF" ss:Pattern="Solid"/>
  <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#79DDB2"/></Borders>
</Style>
<Style ss:ID="kpiLabel">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="10" ss:Bold="1" ss:Color="#334155"/>
  <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
  </Borders>
</Style>
<Style ss:ID="kpiValue">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
  <NumberFormat ss:Format="#,##0.00"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
  </Borders>
</Style>
<Style ss:ID="kpiValueBig">
  <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
  <Font ss:FontName="Tahoma" ss:Size="12" ss:Bold="1" ss:Color="#0D4D38"/>
  <NumberFormat ss:Format="#,##0.00"/>
  <Interior ss:Color="#EAF7EF" ss:Pattern="Solid"/>
  <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1CB878"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#79DDB2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#79DDB2"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1CB878"/>
  </Borders>
</Style>
</Styles>`;

export function buildExcelXml(state: StoreState): string {
  const rate = state.exchangeRate || 1;
  const stats = computeStats(state, "all");
  const now = new Date();
  const exportInfo = `تصدير: ${formatDateTime(now.toISOString())}  •  سعر الصرف: ${num(
    rate,
  )} ل.س / $  •  Y.A.M`;

  /* ---------------- 1) الجرد ---------------- */
  const inventoryRows: string[] = [];
  inventoryRows.push(row([cell(`${state.shopName} — جرد المحل`, "title", { mergeAcross: 8 })], 30));
  inventoryRows.push(row([cell(exportInfo, "sub", { mergeAcross: 8 })], 20));
  inventoryRows.push(
    row(
      [
        "#",
        "اسم الصنف",
        "التصنيف",
        "الكمية",
        "سعر الشراء $",
        "سعر البيع $",
        "سعر البيع ل.س",
        "إجمالي الشراء $",
        "إجمالي الشراء ل.س",
      ].map((h) => cell(h, "head")),
      28,
    ),
  );
  state.items.forEach((item, index) => {
    const alt = index % 2 === 1;
    const totalUsd = round2(item.qty * item.purchaseUsd);
    inventoryRows.push(
      row([
        cell(index + 1, alt ? "numAlt" : "num"),
        cell(item.name, alt ? "cellAlt" : "cell"),
        cell(item.category, alt ? "cellAlt" : "cell"),
        cell(item.qty, alt ? "numAlt" : "num"),
        cell(round2(item.purchaseUsd), alt ? "numAlt" : "num"),
        cell(round2(item.saleUsd), alt ? "numAlt" : "num"),
        cell(Math.round(toSyp(item.saleUsd, rate)), alt ? "numAlt" : "num"),
        cell(totalUsd, alt ? "numAlt" : "num"),
        cell(Math.round(toSyp(totalUsd, rate)), alt ? "numAlt" : "num"),
      ]),
    );
  });
  if (!state.items.length) {
    inventoryRows.push(row([cell("لا توجد أصناف في الجرد حالياً", "cell", { mergeAcross: 8 })]));
  }
  inventoryRows.push(
    totalRow(
      "إجمالي الجرد",
      [
        stats.piecesCount,
        null,
        null,
        null,
        stats.inventoryValueUsd,
        Math.round(toSyp(stats.inventoryValueUsd, rate)),
      ],
      3,
    ),
  );

  /* ---------------- 2) المعاملات ---------------- */
  const salesRows: string[] = [];
  salesRows.push(row([cell(`${state.shopName} — سجل المبيعات`, "title", { mergeAcross: 9 })], 30));
  salesRows.push(row([cell(exportInfo, "sub", { mergeAcross: 9 })], 20));
  salesRows.push(
    row(
      [
        "#",
        "التاريخ",
        "الصنف",
        "التصنيف",
        "الكمية",
        "الزبون",
        "سعر الوحدة $",
        "الإجمالي $",
        "الإجمالي ل.س",
        "الربح $",
      ].map((h) => cell(h, "head")),
      28,
    ),
  );
  const sortedSales = [...state.sales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  sortedSales.forEach((sale, index) => {
    const alt = index % 2 === 1;
    const total = sale.qty * sale.unitPriceUsd;
    const profit = total - sale.qty * sale.unitCostUsd;
    salesRows.push(
      row([
        cell(index + 1, alt ? "numAlt" : "num"),
        cell(formatDateTime(sale.date), alt ? "cellAlt" : "cell"),
        cell(sale.itemName, alt ? "cellAlt" : "cell"),
        cell(sale.category, alt ? "cellAlt" : "cell"),
        cell(sale.qty, alt ? "numAlt" : "num"),
        cell(sale.customer || "زبون نقدي", alt ? "cellAlt" : "cell"),
        cell(round2(sale.unitPriceUsd), alt ? "numAlt" : "num"),
        cell(round2(total), alt ? "numAlt" : "num"),
        cell(Math.round(toSyp(total, rate)), alt ? "numAlt" : "num"),
        cell(round2(profit), alt ? "numAlt" : "num"),
      ]),
    );
  });
  if (!sortedSales.length) {
    salesRows.push(row([cell("لا توجد عمليات بيع مسجّلة", "cell", { mergeAcross: 9 })]));
  }
  salesRows.push(
    totalRow(
      "إجمالي المبيعات",
      [
        state.sales.reduce((a, s) => a + s.qty, 0),
        null,
        null,
        stats.salesTotalUsd,
        Math.round(toSyp(stats.salesTotalUsd, rate)),
        stats.grossProfitUsd,
      ],
      4,
    ),
  );

  /* ---------------- 3) الديون ---------------- */
  const debtRows: string[] = [];
  debtRows.push(row([cell(`${state.shopName} — سجل الديون`, "title", { mergeAcross: 7 })], 30));
  debtRows.push(row([cell(exportInfo, "sub", { mergeAcross: 7 })], 20));
  debtRows.push(
    row(
      [
        "#",
        "الاسم",
        "النوع",
        "المبلغ $",
        "المبلغ ل.س",
        "الحالة",
        "التاريخ",
        "ملاحظة",
      ].map((h) => cell(h, "head")),
      28,
    ),
  );
  state.debts.forEach((debt, index) => {
    const alt = index % 2 === 1;
    debtRows.push(
      row([
        cell(index + 1, alt ? "numAlt" : "num"),
        cell(debt.person, alt ? "cellAlt" : "cell"),
        cell(debt.type === "له" ? "له (مستحق لنا)" : "عليه (مستحق عليه)", alt ? "cellAlt" : "cell"),
        cell(round2(debt.amountUsd), alt ? "numAlt" : "num"),
        cell(Math.round(toSyp(debt.amountUsd, rate)), alt ? "numAlt" : "num"),
        cell(debt.settled ? "تم السداد" : "غير مسدد", alt ? "cellAlt" : "cell"),
        cell(formatDate(debt.date), alt ? "cellAlt" : "cell"),
        cell(debt.note || "—", alt ? "cellAlt" : "cell"),
      ]),
    );
  });
  if (!state.debts.length) {
    debtRows.push(row([cell("لا توجد ديون مسجّلة", "cell", { mergeAcross: 7 })]));
  }
  debtRows.push(
    totalRow("إجمالي الديون (له) غير المسددة", [stats.receivableUsd, Math.round(toSyp(stats.receivableUsd, rate))], 3),
  );
  debtRows.push(
    totalRow("إجمالي الديون (عليه) غير المسددة", [stats.payableUsd, Math.round(toSyp(stats.payableUsd, rate))], 3),
  );
  debtRows.push(
    totalRow("الصافي", [stats.debtNetUsd, Math.round(toSyp(stats.debtNetUsd, rate))], 3),
  );

  /* ---------------- 4) المصاريف ---------------- */
  const expenseRows: string[] = [];
  expenseRows.push(row([cell(`${state.shopName} — المصاريف`, "title", { mergeAcross: 7 })], 30));
  expenseRows.push(row([cell(exportInfo, "sub", { mergeAcross: 7 })], 20));
  expenseRows.push(
    row(
      ["#", "الوصف", "التصنيف", "المبلغ", "العملة", "المبلغ $", "المبلغ ل.س", "التاريخ"].map(
        (h) => cell(h, "head"),
      ),
      28,
    ),
  );
  state.expenses.forEach((expense, index) => {
    const alt = index % 2 === 1;
    const usd = toUsd(expense.amount, expense.currency, rate);
    expenseRows.push(
      row([
        cell(index + 1, alt ? "numAlt" : "num"),
        cell(expense.description, alt ? "cellAlt" : "cell"),
        cell(expense.category, alt ? "cellAlt" : "cell"),
        cell(round2(expense.amount), alt ? "numAlt" : "num"),
        cell(expense.currency === "USD" ? "دولار" : "ليرة سورية", alt ? "cellAlt" : "cell"),
        cell(round2(usd), alt ? "numAlt" : "num"),
        cell(Math.round(toSyp(usd, rate)), alt ? "numAlt" : "num"),
        cell(formatDate(expense.date), alt ? "cellAlt" : "cell"),
      ]),
    );
  });
  if (!state.expenses.length) {
    expenseRows.push(row([cell("لا توجد مصاريف مسجّلة", "cell", { mergeAcross: 7 })]));
  }
  expenseRows.push(
    totalRow(
      "إجمالي المصاريف",
      [stats.expensesTotalUsd, Math.round(toSyp(stats.expensesTotalUsd, rate))],
      5,
    ),
  );

  /* ---------------- 5) ملخص الميزانية ---------------- */
  const summaryRows: string[] = [];
  summaryRows.push(row([cell(`${state.shopName} — ملخص الميزانية`, "title", { mergeAcross: 3 })], 32));
  summaryRows.push(row([cell(exportInfo, "sub", { mergeAcross: 3 })], 20));
  summaryRows.push(row([cell("المؤشر", "head"), cell("بالدولار $", "head"), cell("بالليرة ل.س", "head"), cell("ملاحظة", "head")], 28));

  const kpis: Array<[string, number, string, boolean?]> = [
    ["إجمالي المبيعات", stats.salesTotalUsd, "مجموع كل عمليات البيع", false],
    ["تكلفة البضاعة المباعة", stats.cogsUsd, "تكلفة شراء الكميات المباعة", false],
    ["الربح الإجمالي", stats.grossProfitUsd, "المبيعات − تكلفة البضاعة المباعة", false],
    ["إجمالي الإيرادات الأخرى", stats.revenuesTotalUsd, "إيرادات متنوعة خارج المبيعات", false],
    ["إجمالي المصاريف", stats.expensesTotalUsd, "إيجار، كهرباء، رواتب، مواصلات…", false],
    ["صافي الربح قبل الديون", stats.netProfitUsd, "الربح الإجمالي − المصاريف + الإيرادات", false],
    ["ديون لنا (له)", stats.receivableUsd, "مبالغ غير مسددة مستحقة لنا", false],
    ["ديون علينا (عليه)", stats.payableUsd, "مبالغ غير مسددة مستحقة علينا", false],
    ["صافي تأثير الديون", stats.debtNetUsd, "له − عليه", false],
    ["صافي الربح النهائي", stats.finalNetUsd, "صافي الربح قبل الديون + صافي الديون", true],
    ["قيمة البضاعة في المحل", stats.inventoryValueUsd, "Σ الكمية × سعر الشراء", false],
    ["عدد الأصناف / القطع", stats.itemsCount, `إجمالي القطع: ${num(stats.piecesCount)}`, true],
  ];

  kpis.forEach(([label, value, note, highlight]) => {
    const isCount = label.startsWith("عدد الأصناف");
    summaryRows.push(
      row([
        cell(label, "kpiLabel"),
        cell(value, highlight ? "kpiValueBig" : "kpiValue"),
        isCount ? cell(null, "kpiValue") : cell(Math.round(toSyp(value, rate)), highlight ? "kpiValueBig" : "kpiValue"),
        cell(note, "cell"),
      ]),
    );
  });

  summaryRows.push(row([]));
  summaryRows.push(row([cell("الإيرادات المتنوعة", "section", { mergeAcross: 3 })], 24));
  summaryRows.push(row([cell("الوصف", "head"), cell("المبلغ $", "head"), cell("المبلغ ل.س", "head"), cell("التاريخ", "head")]));
  state.revenues.forEach((revenue) => {
    const usd = toUsd(revenue.amount, revenue.currency, rate);
    summaryRows.push(
      row([
        cell(revenue.description, "cell"),
        cell(round2(usd), "num"),
        cell(Math.round(toSyp(usd, rate)), "num"),
        cell(formatDate(revenue.date), "cell"),
      ]),
    );
  });
  if (!state.revenues.length) {
    summaryRows.push(row([cell("لا توجد إيرادات متنوعة", "cell", { mergeAcross: 3 })]));
  }

  summaryRows.push(row([]));
  summaryRows.push(row([cell("كيف تُحسب المؤشرات؟", "section", { mergeAcross: 3 })], 24));
  const formulaNotes = [
    "قيمة البضاعة الحالية = Σ (الكمية × سعر الشراء)",
    "إجمالي المبيعات = Σ (كل عمليات البيع)",
    "تكلفة المباع = Σ (الكمية المباعة × سعر شراء الصنف)",
    "الربح الإجمالي = إجمالي المبيعات − تكلفة المباع",
    "صافي الربح قبل الديون = الربح الإجمالي − المصاريف + الإيرادات الأخرى",
    "صافي الربح النهائي = صافي الربح قبل الديون + الديون لنا − الديون علينا",
  ];
  formulaNotes.forEach((note) => {
    summaryRows.push(row([cell(note, "cell", { mergeAcross: 3 })]));
  });
  summaryRows.push(row([]));
  summaryRows.push(row([cell("ذيل التقرير: بَطّة — إدارة المحل • Y.A.M • جميع البيانات محفوظة محلياً على الجهاز", "sub", { mergeAcross: 3 })]));

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${esc(`تقرير بَطّة — ${state.shopName}`)}</Title>
  <Subject>الجرد والمبيعات والديون والميزانية</Subject>
  <Author>Y.A.M</Author>
  <Created>${now.toISOString()}</Created>
</DocumentProperties>
<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
  <WindowHeight>12000</WindowHeight>
  <WindowWidth>24000</WindowWidth>
  <ProtectStructure>False</ProtectStructure>
  <ProtectWindows>False</ProtectWindows>
</ExcelWorkbook>
${STYLES}
${sheet("الجرد", [38, 170, 100, 55, 80, 80, 90, 105, 115], inventoryRows)}
${sheet("المعاملات", [38, 120, 170, 100, 55, 110, 85, 90, 100, 85], salesRows)}
${sheet("الديون", [38, 135, 145, 85, 105, 95, 95, 220], debtRows)}
${sheet("المصاريف", [38, 200, 95, 85, 90, 90, 105, 100], expenseRows)}
${sheet("ملخص الميزانية", [210, 115, 120, 230], summaryRows)}
</Workbook>`;
}

function buildBlob(state: StoreState): { blob: Blob; filename: string } {
  const xml = buildExcelXml(state);
  const blob = new Blob(["\ufeff", xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  return { blob, filename: `Batta-Report-${fileStamp()}.xls` };
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Generates and downloads the 5-sheet Excel report. */
export function downloadExcel(state: StoreState): string {
  const { blob, filename } = buildBlob(state);
  triggerDownload(blob, filename);
  return filename;
}

type ShareCapableNavigator = Navigator & {
  canShare?: (data?: { files?: File[] }) => boolean;
  share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
};

/** Tries the native share sheet (WhatsApp / email / …), falling back to a download. */
export async function shareExcel(state: StoreState): Promise<"shared" | "downloaded" | "failed"> {
  const { blob, filename } = buildBlob(state);
  const nav = navigator as ShareCapableNavigator;
  try {
    const file = new File([blob], filename, {
      type: "application/vnd.ms-excel",
    });
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({
        files: [file],
        title: "تقرير بَطّة — Excel",
        text: `تقرير جرد ومبيعات ${state.shopName}`,
      });
      return "shared";
    }
  } catch {
    return "failed";
  }
  triggerDownload(blob, filename);
  return "downloaded";
}

export function downloadBackup(state: StoreState): string {
  const filename = `Batta-Backup-${fileStamp()}.json`;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
  return filename;
}

export function excelSummaryText(state: StoreState): string {
  const stats = computeStats(state, "all");
  return `المبيعات: ${num(stats.salesTotalUsd)} $ • صافي الربح النهائي: ${num(
    stats.finalNetUsd,
  )} $ • قيمة الجرد: ${num(stats.inventoryValueUsd)} $`;
}
