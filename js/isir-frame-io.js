//****************************
// Module `isir_frame_io` handles ISIR file format input/output
//   - Read ISIR frames from text files containing one or more fixed-width ISIR frames
//


// Given a collection of [Files]() text files containing one or more fixed-width ISIR frames
// Read each line, using CR/LF line endings, and return all non-blank, non SAIG routing codes.
export async function read_isir_frames_from_filelist(file_list_src) {
    let isir_samples = []
    for await (let isir_frame of aiter_read_isir_frames_from_filelist(file_list_src))
        isir_samples.push(isir_frame)
    return isir_samples.flat()
}


// Given a collection of [Files]() text files containing one or more fixed-width ISIR frames
// Read each line, using CR/LF line endings, and return all non-blank, non SAIG routing codes.
export async function * aiter_read_isir_frames_from_filelist(filelist_src) {
    const rx_saig_routing_header = /^[A-Z\*][0-9A-Z\*]+\s*,CLS=.*$/
    const maybe_isir_frame = (ln) =>
        ln.trim() && ! rx_saig_routing_header.test(ln)

    for await (let isir_frame_list of Array.from(filelist_src, v => v.text())) {
        isir_frame_list = isir_frame_list
            .split(/\r?\n/)
            .filter(maybe_isir_frame)

        yield isir_frame_list
    }
}
