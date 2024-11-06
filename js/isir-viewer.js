//****************************
// Module `isir_viewer` renders ISIR frames into user interface elements */
//

import {imm, imm_set, imm_html, imm_raf, imm_emit} from 'https://cdn.jsdelivr.net/npm/imm-dom@0.3.10/esm/index.min.js'
import {read_isir_frames} from './isir-frame-io.js'

export {imm, imm_set, imm_html, imm_raf, imm_emit}

export const isir_txn_uuid = (isir_frame) => isir_frame.slice(37,73)

export function select_isir_frame(isir_frame_or_index) {
    const isir_samples = globalThis.isir_samples
    if (!isir_samples)
        return (console.warn('No valid ISIR frame found'), {})

    let isir_label, isir_frame, idx_selected
    isir_frame_or_index ??= 1 + parseInt(sessionStorage.getItem('isir_sample_index') || 0)

    if (isFinite(isir_frame_or_index) || null == isir_frame_or_index) {
        idx_selected = Math.min(isir_samples.length, Math.max(1, isir_frame_or_index || 0)) - 1
        isir_frame = isir_samples[idx_selected]
    } else {
        if ('string' === typeof isir_frame_or_index && isir_frame_or_index.length > 256)
            isir_frame = isir_frame_or_index
        else if (isir_frame_or_index.call) 
            isir_frame = isir_samples.find(isir_frame_or_index)
        else if (isir_frame_or_index.test) 
            isir_frame = isir_samples.find(f => isir_frame_or_index.test(f))
        else if (isir_frame_or_index.trim) 
            isir_frame = isir_samples.find(f => f && f.includes(isir_frame_or_index))

        idx_selected = isir_samples.indexOf(isir_frame)
    }

    if (0 <= idx_selected) {
        sessionStorage.setItem('isir_sample_index', idx_selected)
        isir_label = `ISIR[${1+idx_selected}]`
    }

    let el_sample_count = document.getElementById('isir_sample_count')
    if (el_sample_count) {
        el_sample_count.textContent = ''+isir_samples.length

        let el_selector = el_sample_count.closest('label')?.querySelector('input[type=number]')
        if (el_selector)
            el_selector.value = (0 <= idx_selected) ? 1+idx_selected : ''
    }

    globalThis.active_isir_frame = isir_frame
    if (!isir_frame)
        return (console.warn('No valid ISIR frame found'), {})

    isir_label ||= `ISIR for ${isir_txn_uuid(isir_frame)}`
    return {isir_frame, isir_label}
}

// Renders a given ISIR frame into validation report and all fields, grouped by section.
// Also accepts an index into `globalThis.isir_samples`
export function show_isir(isir_frame_or_index) {
    if (!globalThis.isir_module) {
        console.warn("isir_module not available", globalThis.isir_module)
        return {}
    }

    let {isir_frame, isir_label} = select_isir_frame(isir_frame_or_index)

    let isir_validation = new Map() // collect validation errors by field
    let isir_report = isir_frame && isir_module.isir_load_report(isir_frame, {mode: isir_validation})

    if (!isir_report)
        return void imm_set(document.getElementById('output_isirs'), null)

    let isir_uuid = isir_module.isir_field_read(isir_module.field_3, isir_frame)

    imm_set(document.getElementById('output_isirs'), 
        isir_report ? [
            imm_html.h2('ISIR Fields'),
            imm_html.p(`For ISIR[${isir_uuid.split('-',1)[0]}] uuid `, imm_html.code(`"${isir_uuid}"`), ' (field 3)'),
            _render_validation_report(isir_validation),
            _render_fields(isir_report),
        ] : null,
    )

    // browsable ISIR object model, usable from the developer console
    let isir_obj = isir_module.isir_model_from(isir_frame)
    let evt_details = {isir_frame, isir_label, isir_validation, isir_obj}

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
        imm_html.h3('Validation'),
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
      imm_html.h3('Detail'),
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
        imm_html.small(`[${sect.path}] `),
        sect.non_empty ? imm_html.b(sect.section) : imm_html.span(sect.section),
        imm_html.small(` (non-empty: ${sect.non_empty})`),
    )
    return res
}


// Validates a list of ISIRs to compile unique validation error messages by field.
// Not currently accessible outside the Developer Console
export async function check_isirs_list(isir_frame_list=globalThis.isir_samples) {
    for (var res of iter_check_isirs_list(isir_frame_list)) {
        console.log(res)
        await imm_raf()
    }
    return res
}
export function * iter_check_isirs_list(isir_frame_list=globalThis.isir_samples) {
    let unique_warnings = new Map()
    let with_validation_errors = []
    let isir_validation = new Map() // collect validation errors by field
    let n = 0
    for (let isir_frame of isir_frame_list) {
        if (0 == (++n % 100))
            yield {unique_warnings, with_validation_errors}

        isir_module.isir_load_report(isir_frame, {mode: isir_validation})
        if (0 != isir_validation.size) {
            console.group('Issues for ISIR %o', n)
            {
                let student_email = isir_module.isir_field_read(isir_module.field_33, isir_frame)
                let uuid = isir_module.isir_field_read(isir_module.field_3, isir_frame)
                with_validation_errors.push({student_email, uuid})
                console.log(`with student email <${student_email}> (field 33), uuid "${uuid}" (field 3)`)
            }

            for (let [field, res] of isir_validation.entries()) {
                let counts = unique_warnings.get(field) || new Map()

                if (field.name && 581 != field.idx)
                    console.log('Field %o "%s"', field.idx, field.name, res.invalid, res)

                for (let key of res.issues)
                    counts.set(key, 1 + (counts.get(key) || 0))

                unique_warnings.set(field, counts)
            }
            isir_validation.clear() // reset incremental map
            console.groupEnd()
        }
    }

    yield {unique_warnings, with_validation_errors}
}


// For use in file HTMLInputElement selection event
// Loads list of ISIR frames from a collection of ISIR text files using `read_isir_frames`
export const on_use_isir_files = async (file_list_src) =>
    use_isir_samples(await read_isir_frames(file_list_src))

export async function on_use_isir_text(el_input, opt={}) {
    if (!el_input.value) return;
    let isir_frames = await read_isir_frames(el_input.value)
    el_input.value = ''
    el_input.placeholder = `Loaded ${isir_frames.length} ISIR frames at ${new Date().toLocaleTimeString()}`
    sessionStorage.setItem('isir_sample_index', 0)
    return use_isir_samples(isir_frames)
}

export async function use_isir_samples(isir_samples=globalThis.isir_samples, update_loaded_isir_samples=true) {
    globalThis.isir_samples = isir_samples = Array.from(await isir_samples).filter(Boolean)

    let el_count = document.getElementById('isir_sample_count')
    if (el_count) el_count.textContent = ''+isir_samples.length

    imm_emit(document, 'isir_samples_updated', {isir_samples})

    if (update_loaded_isir_samples) {
        document.getElementById('isir_show_selector')?.focus()
        globalThis.loaded_isir_samples = Array.from(isir_samples)
        document.documentElement.classList.toggle('loaded-isir-frames', isir_samples?.length > 0)

        console.log('Loaded %o ISIR frames', isir_samples.length)
        imm_emit(document, 'loaded_isir_samples', {loaded_isir_samples: isir_samples})
    }
    return isir_samples
}



export function on_search_isirs(search) {
    if (null==search) {
        search = sessionStorage.getItem("isir_search_selector")
        if (!search) return
    }
    search = !search ? '' : search.trim ? search : search.target?.value ?? search.value

    isir_viewer.use_matching_isirs(search)

    sessionStorage.setItem("isir_search_selector", search)
    let el_search = document.querySelector('#isir_search_selector input[type=search]')
    if (el_search) el_search.value = search
    return search
}

export const use_filtered_isirs = (isir_filter_collection, isir_frame_list=globalThis.loaded_isir_samples) =>
    use_isir_samples( filter_isirs('remove', isir_filter_collection, isir_frame_list) , false)

export const use_matching_isirs = (isir_filter_collection, isir_frame_list=globalThis.loaded_isir_samples) =>
    use_isir_samples( filter_isirs('keep', isir_filter_collection, isir_frame_list) , false)

function filter_isirs(match_mode, isir_filter_collection, isir_frame_list=globalThis.loaded_isir_samples) {
    isir_frame_list = Array.from(isir_frame_list)

    if (null == isir_filter_collection) {
        for (var issue_rpt of iter_check_isirs_list(isir_frame_list)) {}
        isir_filter_collection = issue_rpt.with_validation_errors
        console.log({issue_rpt, isir_filter_collection, isir_frame_list})
    }

    if ('string'===typeof isir_filter_collection || !isir_filter_collection[Symbol.iterator])
        isir_filter_collection = [isir_filter_collection]

    const _isir_student_email = isir_frame => isir_frame.slice(373, 423).trim()
    const _isir_uuid = (isir_frame, n=1) => isir_frame.slice(n*36 + 1, n*36 + 37)
    const _isir_in_exclusion_set = isir_frame => by_set.some(isir_frame.includes.bind(isir_frame))


    let by_func=[_isir_in_exclusion_set], by_set = new Set()
    for (let filter of isir_filter_collection) {
        if (filter.trim) by_set.add(filter)
        else if (filter[Symbol.iterator])
          for (let e of filter) by_set.add(e)
        else if (filter.test) by_func.push(isir_frame => filter.test(isir_frame))
        else if (filter.call) by_func.push(filter)
        else if (filter.uuid) by_set.add(filter.uuid)
        else if (filter.student_email) by_set.add(filter.student_email)
        else throw new TypeError(filter)
    }

    by_set = Array.from(by_set)

    match_mode ||= 'remove'
    let is_excluded = {
        keep: test => ! test,
        remove: test => !! test,
    }
    for (let isir_idx in isir_frame_list) {
        let isir_frame = isir_frame_list[isir_idx]
        for (let fn_filter of by_func)
            if (is_excluded[match_mode]( fn_filter(isir_frame) ))
                isir_frame_list[isir_idx] = null
    }

    return isir_frame_list = isir_frame_list.filter(Boolean)
}


// Install globalThis.isir_viewer module, and hook into ISIR-Viewer specific events / globals for the user interface
export function isir_viewer_init(globals) {
    if (globals)
        Object.assign(globalThis, globals)

    document.addEventListener('isir_samples_updated', (evt) => show_isir(evt.detail?.idx_selected))
    if (globalThis.isir_samples) use_isir_samples()

    return {
        show_isir,
        select_isir_frame,
        on_use_isir_files,
        on_use_isir_text,
        use_isir_samples,
        on_search_isirs, filter_isirs, use_filtered_isirs, use_matching_isirs,
        check_isirs_list,
        iter_check_isirs_list,
    }
}
