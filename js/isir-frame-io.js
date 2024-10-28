//****************************
// Module `isir_frame_io` handles ISIR file format input/output
//   - Read ISIR frames from text files containing one or more fixed-width ISIR frames
//


// Given a collection of [Files]() text files containing one or more fixed-width ISIR frames
// Read each line, using CR/LF line endings, and return all non-blank, non SAIG routing codes.
export async function read_isir_frames(filelist_src) {
    let isir_samples = []
    for await (let isir_frame of aiter_read_isir_frames(filelist_src))
        isir_samples.push(isir_frame)
    return isir_samples.flat()
}


// Given a collection of [Files]() text files containing one or more fixed-width ISIR frames
// Read each line, using CR/LF line endings, and return all non-blank, non SAIG routing codes.
export async function * aiter_read_isir_frames(filelist_src) {
    filelist_src = await filelist_src
    if ('string' === typeof filelist_src)
        filelist_src = new Blob([filelist_src], {type: 'text/plain'})
    if ('function' == typeof filelist_src.text)
        filelist_src = [filelist_src]

    // Match the first 14 fields using a regex. Provides high confidence of an ISIR frame match. 
    // Field 2,3, & 4 are UUIDs, fields 8,12, and 13 are dates, and field 14 is a long string with two values.
    const rx_isir_leader = /(?:\d)(?:[0-9a-fA-Z]{8}-[0-9a-fA-Z]{4}-[0-9a-fA-Z]{4}-[0-9a-fA-Z]{4}-[0-9a-fA-Z]{12}){3}(?:\d{2})..(?:20\d{6})...(?:20\d{6})(?:20\d{6})(?:Processed\s{21}|Processed with Action Required)/

    for await (let isir_frame_list of filelist_src) {
        isir_frame_list = await (await isir_frame_list).text()
        isir_frame_list = isir_frame_list
            .split(/\r?\n/)
            .map(select_isir_frame_substring)
            .filter(Boolean)

        yield isir_frame_list
    }


    function select_isir_frame_substring(ln) {
        let idx = ln.search(rx_isir_leader)
        return (idx>=0 ?
            ln.slice(idx, idx+7704)
              .replace(/['"]\s*$/, '') // trim any trailing CSV or JSON trailing quote
            : null )
    }
}
