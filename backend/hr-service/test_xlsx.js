import * as XLSX from 'xlsx';

try {
  console.log("Is sheet_to_txt available?", typeof XLSX.utils.sheet_to_txt);
  console.log("Is sheet_to_csv available?", typeof XLSX.utils.sheet_to_csv);
} catch (e) {
  console.error(e);
}
