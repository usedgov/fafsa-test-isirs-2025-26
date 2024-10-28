import {imm_tag} from 'https://cdn.jsdelivr.net/npm/imm-dom@0.3.10/esm/index.min.js'

// For use in button event to create a downloadable spreadsheet link
export async function on_make_isir_spreadsheet(isir_samples, fn_ui_yield) {
    let workbook_blob = await isir_list_to_spreadsheet_file(isir_samples, fn_ui_yield)

    await fn_ui_yield?.() // wait for next requestAnimationFrame

    let href = URL.createObjectURL(workbook_blob)
    let download = 'isir-spreadsheet.xlsx'
    let el_link = imm_tag('a', { href, download }, download)
    document.getElementById('output_file_list')?.append( imm_tag('li', {}, el_link) )
    return el_link
}

// Given a list of ISIR frames, create an Excel XLSX Spreadsheet compatible with `isir-from-spreadsheet.html` tool
// using `iter_isir_list_to_field_rows` and adding Excel specific styling
export async function isir_list_to_spreadsheet_file(isir_samples, fn_ui_yield) {
    let workbook = await isir_list_to_spreadsheet(isir_samples, fn_ui_yield)
    let content = await workbook.xlsx.writeBuffer()
    return new Blob([content], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
}
export async function isir_list_to_spreadsheet(isir_samples, fn_ui_yield) {
  // Create Excel XLSX Spreadsheet using [exceljs/exceljs](https://github.com/exceljs/exceljs) library
  let workbook = new ExcelJS.Workbook()
  let ws_isir_mock = workbook.addWorksheet('ISIR Records')

  for (let [row_field, row_isirs, row_ctx] of iter_isir_list_to_field_rows(isir_samples)) {
    // add row for Field, a boundary column, and each ISIR's raw values
    let xl_row = ws_isir_mock.addRow([row_field, '', row_isirs].flat())

    if (row_ctx.header) {
      var hdr_row_field = row_field  // capture the header fields

      // highlight the header row using font and grey background
      Object.assign(xl_row, {
        font: { bold: true, underline: true },
        fill: { type:'pattern', pattern:'solid', fgColor: {argb: 'cccccc'}},
      })

      await fn_ui_yield?.() // wait for next requestAnimationFrame
    }
  }

  await fn_ui_yield?.() // wait for next requestAnimationFrame

  // Highlight the field header columns with light grey
  for (let idx_col=1; idx_col <= hdr_row_field.length; idx_col++) {
    Object.assign(ws_isir_mock.getColumn(idx_col), {
      fill: { type:'pattern', pattern:'solid', fgColor: {argb: 'e8e8e8'}},
    })
  }

  // Highlight a boundary column with very dark grey
  Object.assign(ws_isir_mock.getColumn(1 + hdr_row_field.length), {
    fill: { type:'pattern', pattern:'solid', fgColor: {argb: '444444'}},
  })

  return workbook
}


// Given a list of ISIR frames, generate rows for each field
// return field metadata, raw values for each ISIR frame for the field, and context
export function * iter_isir_list_to_field_rows(isir_samples) {
  if ('string' === typeof isir_samples)
    isir_samples = [isir_samples]
  else isir_samples = [... isir_samples]

  let hdr_field = ['F#', 'Section', 'Field', 'V&V', 'Len']
  let hdr_isirs = isir_samples.map((v,i) => `ISIR ${i+1}`)
  yield [hdr_field, hdr_isirs, {header: true}]

  let { isir_field_read_raw } = isir_module
  for (let section of isir_module.isir_record_sections) {
    let s_path = section.path
    for (let field of section.field_list) {
      let row_field = [
        `f_${field.idx}`, // F#
        s_path, // Section
        field.name ? field.path.replace(section.path, '') : '(filler)', // Field
        field.note.join('\r\n'), // V&V
        field.len, // Len
      ]

      let row_isirs = isir_samples.map(isir => isir_field_read_raw(field, isir))

      yield [row_field, row_isirs, {section, field}]
    }
  }
}