//****************************
// Module `isir_viewer` renders ISIR frames into user interface elements */
//

import {imm, imm_set, imm_html, imm_raf, imm_emit} from 'https://cdn.jsdelivr.net/npm/imm-dom@0.3.3/esm/index.min.js'
import {read_isir_frames_from_filelist} from './isir-frame-io.js'

// Renders a given ISIR frame into validation report and all fields, grouped by section.
// Also accepts an index into `globalThis.isir_samples`
export function show_isir(isir_frame) {
    if (!globalThis.isir_module) {
        console.warn("isir_module not available", globalThis.isir_module)
        return;
    }

    document.documentElement.classList.add('loaded-isir-frames')

    if (globalThis.isir_samples) {
        isir_frame ??= parseInt(sessionStorage.getItem('isir_sample_index') || 0)

        if ('string' !== typeof isir_frame)
            isir_frame = globalThis.isir_samples[isir_frame]

        let idx_selected = globalThis.isir_samples.indexOf(isir_frame)
        if (0 <= idx_selected) {
            sessionStorage.setItem('isir_sample_index', idx_selected)
        }

        let el_sample_count = document.getElementById('isir_sample_count')
        if (el_sample_count) {
            el_sample_count.textContent = ''+globalThis.isir_samples.length

            let el_selector = el_sample_count.closest('label')?.querySelector('input[type=number]')
            if (el_selector)
                el_selector.setAttribute('value', (0 <= idx_selected) ? 1+idx_selected : '')
        }
    }

    if (!isir_frame)
        return console.warn('No valid ISIR frame found')

    let isir_validation = new Map() // collect validation errors by field
    let isir_report = isir_module.isir_load_report(isir_frame, {mode: isir_validation})

    imm_set(document.getElementById('output_isirs'), 
        _render_validation_report(isir_validation),
        _render_fields(isir_report))

    // browsable ISIR object model, usable from the developer console
    let isir_obj = isir_module.isir_model_from(isir_frame)
    let evt_details = {isir_frame, isir_validation, isir_obj}

    // notify other UI elements of the currently shown ISIR
    imm_emit(document, 'isir_shown', evt_details)
    return evt_details
}

// Renders ISIR validation results into a section, provding technical
function _render_validation_report(isir_validation) {
    let el_report = imm_html.ul()

    if (0 == isir_validation.size)
        el_report = imm_html.em('No issues; clean validation')
    else for (let [field, {value, result, issues}] of isir_validation.entries()) {
        // leave out less useful fields
        let {idx, name, path, pos_start, pos_end, validate, note, ... tech_detail} = field
        let validate_detail = JSON.stringify({value, result}, null, 2).split(/\r?\n/).slice(1,-1)
        tech_detail = JSON.stringify(tech_detail, null, 2).split(/\r?\n/).slice(1,-1)

        imm(el_report, imm_html.li(
            imm_html.details(
                imm_html.summary(
                    imm_html.span({class:'isir-field'},
                    'Field ', imm_html.span({class:'isir-field-idx'}, `f_${field.idx}`),
                    ' ', imm_html.span({class:'isir-field-name'}, field.name ? `${field.name}` : field.value ? '(expected value)' : '(filler)')),
                    ' failed for "', imm_html.code({class:'isir-failed-value'}, `${value}`), '"'),

                imm_html.div({class: 'validation-details'},
                    imm_html.div(
                        imm_html.h5('Valid content note:'),
                        imm_html.pre('  ', note.join('\r\n  ')),
                    ),
                    imm_html.div(
                        imm_html.h5('Field validation detail:'),
                        imm_html.ul(issues.map(msg => imm_html.li(`${msg}`))),
                        imm_html.pre(validate_detail.join('\r\n')),
                    ),
                    imm_html.div(
                        imm_html.h5('Technical detail for ', imm_html.code(`isir_module.field_${field.idx}`),':'),
                        imm_html.pre(tech_detail.join('\r\n')),
                    ))
            )))
    }

    return imm_html.aside({class:'isir-validation'},
        imm_html.h2('ISIR Field Validation'),
        el_report)
}

// Renders ISIR fields into collapsable sections of tables, as grouped by isir_report sections
function _render_fields(isir_report) {
    const _pos_to_cell = pos => (''+(1+pos)).padStart(3,' ')
    const as_field_row = ({field, value, result, invalid}) => (
        imm_html.tr(
            imm_html.td({class: 'field-idx'}, 'f_'+field.idx),
            imm_html.td({class: 'field-len'}, ''+field.len),
            imm_html.td({class: 'field-pos'}, `${_pos_to_cell(field.pos_start)} to ${_pos_to_cell(field.pos_end-1)}`),
            imm_html.td({class: 'field-szvalue'}, imm_html.code(`${value.trimEnd()}`)),
            imm_html.td({class: `field-result ${invalid ? 'field-invalid' : ''}`},
                imm_html.code(invalid ? ''+invalid : JSON.stringify(result) || '')),
            imm_html.td({class: 'field-path'},
                ! field.name ? null
                : imm_html.code(''+([].concat(field.path).join('.'))),
            ),
        ))

    let all_sections = []
    let sect_num = 0
    for (let sect of isir_report) {
        let {el_section, el_thead, el_tbody} = _isir_section_for(sect, {open: 0===sect_num++})

        let field_headers = ['field', 'len', 'pos', 'value', 'result'].map(s => imm_html.th(s))
        field_headers.push(
            imm_html.th('path: ',
                imm_html.code(''+([].concat(sect.path, ['']).join('.'))) ))

        imm_set(el_thead, imm_html.tr(field_headers))
        imm_set(el_tbody, sect.fields.map(as_field_row))
        all_sections.push(el_section)
    }

    return imm_html.article({class:'isir-fields'},
      imm_html.h2('ISIR Fields'),
      all_sections)
}


// Cache the section details/summary elements so that it retains the
// open/closed UI interaction state between viewed ISIRs
let _show_elem_cache = new Map()
function _isir_section_for(sect, {open}) {
    let res = _show_elem_cache.get(sect.section)
    if (!res) {
        _show_elem_cache.set(sect.section, res = {})

        res.el_section = imm_html.section(
            imm_html.details({open},
                res.el_summary = imm_html.summary(),
                imm_html.table({class: 'pure-table isir-field-table'},
                    res.el_thead = imm_html.thead(),
                    res.el_tbody = imm_html.tbody(),
                )))
    }

    imm_set(res.el_summary,
        imm_html.small(`[${sect.path.join('.')}] `),
        sect.non_empty ? imm_html.b(sect.section) : imm_html.span(sect.section),
        imm_html.small(` (non-empty: ${sect.non_empty})`),
    )
    return res
}


// Validates a list of ISIRs to compile unique validation error messages by field.
// Not currently accessible outside the Developer Console
export async function check_isirs_list(isir_list=globalThis.isir_samples) {
    let unique_warnings
    for (unique_warnings of iter_check_isirs_list(isir_list)) {
        console.log(unique_warnings)
        await imm_raf()
    }
    return unique_warnings
}
export function * iter_check_isirs_list(isir_list=globalThis.isir_samples) {
    let unique_warnings = new Map()
    let isir_validation = new Map() // collect validation errors by field
    let n = 0
    for (let isir of isir_list) {
        if (0 == (++n % 100))
            yield unique_warnings

        isir_module.isir_load_report(isir, {mode: isir_validation})
        if (0 != isir_validation.size) {
            console.group('Issues for ISIR %o', n)
            for (let [field, res] of isir_validation.entries()) {
                let counts = unique_warnings.get(field) || new Map()

                if (field.name && 581 != field.idx)
                    console.log('Field %o "%s"', field.idx, field.name, res)

                for (let key of res.issues)
                    counts.set(key, 1 + (counts.get(key) || 0))

                unique_warnings.set(field, counts)
            }
            isir_validation.clear() // reset incremental map
            console.groupEnd()
        }
    }
    return unique_warnings
}


// For use in file HTMLInputElement selection event
// Loads list of ISIR frames from a collection of ISIR text files using `read_isir_frames_from_filelist`
export const on_use_isir_files = async (file_list_src) =>
    use_isir_samples( await read_isir_frames_from_filelist(file_list_src))

export const use_isir_samples = async (isir_samples=globalThis.isir_samples) => (
    isir_samples = await isir_samples,
    imm_emit(document, 'isir_samples_updated', {isir_samples}))


// Install globalThis.isir_viewer module, and hook into ISIR-Viewer specific events / globals for the user interface
export function isir_viewer_init(globals) {
    if (globals)
        Object.assign(globalThis, globals)

    imm(document, {
        isir_samples_updated(evt) {
            let {isir_samples, idx_selected} = evt.detail
            if (null == isir_samples[0])
                isir_samples = isir_samples.slice(1)
            console.log('Loaded %o isir frames', isir_samples.length, {idx_selected})
            globalThis.isir_samples = isir_samples
            show_isir(idx_selected)
        }})

    if (globalThis.isir_samples)
        use_isir_samples()

    return {
        show_isir,
        on_use_isir_files,
        use_isir_samples,
        check_isirs_list,
        iter_check_isirs_list,
    }
}
