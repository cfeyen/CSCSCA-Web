import * as sca from "../cscsca_bindings/src/sca_type_bindings.js"

const output_box = document.getElementById("cscsca-output")!;
const trace_box = document.getElementById("cscsca-trace")! as HTMLSelectElement;

const TRACE_MODE_OUTPUT_ONLY = "output"
const TRACE_MODE_INPUT_AND_OUTPUT_ONLY = "input/output"
const TRACE_MODE_DIFF_ONLY = "diff-only"
const TRACE_MODE_DIFF = "diff"
const TRACE_MODE_ALL = "all"

export function set_output(result: sca.ScaResult) {
    output_box.innerHTML = "";

    const error = result.get_error();

    if (error == null) {
        const trace_mode = trace_box.value;

        switch (trace_mode) {
            case TRACE_MODE_OUTPUT_ONLY:
                output_box.appendChild(create_output_column(result));
                break;
            case TRACE_MODE_INPUT_AND_OUTPUT_ONLY:
                output_box.appendChild(create_input_and_output_column(result));
                break;
            case TRACE_MODE_DIFF_ONLY:
                output_box.appendChild(create_diff_table(result));
                break;
            case TRACE_MODE_DIFF:
                output_box.appendChild(create_trace_table(result, true));
                break;
            case TRACE_MODE_ALL:
                output_box.appendChild(create_trace_table(result, false));
                break;
        }
    } else {
        output_box.appendChild(create_error_element(error.get_error_msg()))
    }
}

function create_error_element(error: string): HTMLElement {
    const elem = document.createElement("p");
    elem.innerText = error;
    elem.className = "text-red-400";

    return elem;
}

function create_output_column(result: sca.ScaResult): HTMLTableElement {
    const table = create_table();

    result.get_evolutions().forEach((evo: sca.ScaEvolution) => {
        const final = evo.get_final();

        const row = create_table_row();
        row.appendChild(create_table_cell(final));

        table.appendChild(row);
    });

    return table;
}

function create_input_and_output_column(result: sca.ScaResult): HTMLTableElement {
    const table = create_table();

    const header_row = create_table_row();
    header_row.appendChild(create_table_header("Initial"));
    header_row.appendChild(create_table_header("Final"));

    table.appendChild(header_row);

    result.get_evolutions().forEach((evo: sca.ScaEvolution) => {
        const initial = evo.get_initial();
        const final = evo.get_final();

        const row = create_table_row();
        row.appendChild(create_table_cell(initial));
        row.appendChild(create_table_cell(final));

        table.appendChild(row);
    });

    return table;
}

function create_diff_table(result: sca.ScaResult): HTMLTableElement {
    const headers = result.get_headers();
    const evos = result.get_evolutions().map(e => e.get_intermediate());
    const final_col = result.get_evolutions().map(e => e.get_final());

    const diff_headers: string[] = ["Initial"];
    let last_col = result.get_evolutions().map(e => e.get_initial());
    const diff_rows = last_col.map(e => [e]);

    for (let col = 0; col < headers.length; col++) {
        let this_col: string[] = [];

        for (let row = 0; row < evos.length; row++) {
            this_col.push(evos[row]![col]!);
        }

        let is_diff = false;
        const diff_col = [];

        for (let row = 0; row < evos.length; row++) {
            if (last_col[row] !== this_col[row]) {
                is_diff = true;
                diff_col.push(this_col[row]);
            } else {
                diff_col.push("")
            }
        }

        if (is_diff) {
            diff_headers.push(headers[col]!);

            for (let row = 0; row < evos.length; row++) {
                diff_rows[row]?.push(diff_col[row]!)
            }

            last_col = this_col;
        }
    }

    const table = create_table();
    
    
    const header_row = create_table_row();
    diff_headers.forEach(header => header_row.appendChild(create_table_header(header)));
    header_row.appendChild(create_table_header("Final"));
    table.appendChild(header_row);

    let r = 0;

    diff_rows.forEach(intermediate => {
        const row = create_table_row();

        intermediate.forEach(step => row.appendChild(create_table_cell(step)) );
        row.appendChild(create_table_cell(final_col[r]!));

        table.appendChild(row);

        r++;
    });

    return table;
}

function create_trace_table(result: sca.ScaResult, diff_only: boolean): HTMLTableElement {
    const table = create_table();

    const header_row = create_table_row();
    header_row.appendChild(create_table_header("Initial"));
    result.get_headers().forEach((header) => {
        header_row.appendChild(create_table_header(header));
    });
    header_row.appendChild(create_table_header("Final"));

    table.appendChild(header_row);

    result.get_evolutions().forEach((evo: sca.ScaEvolution) => {
        if (diff_only) {
            let intermediate_steps = evo.get_intermediate();

            for (let i = intermediate_steps.length - 1; i >= 1; i--) {
                if (intermediate_steps[i] == intermediate_steps[i - 1]) {
                    intermediate_steps[i] = "";
                }
            }

            if (intermediate_steps.length > 0 && intermediate_steps[0] == evo.get_initial()) {
                intermediate_steps[0] = "";
            }
        }

        const initial = evo.get_initial();
        const final = evo.get_final();

        const row = create_table_row();

        row.appendChild(create_table_cell(initial));
        evo.get_intermediate().forEach((intermediate) => {
            row.appendChild(create_table_cell(intermediate));
        });
        row.appendChild(create_table_cell(final));

        table.appendChild(row);
    });

    return table;
}

function create_table(): HTMLTableElement {
    const table = document.createElement("table");

    table.className = "border-2 border-zinc-700 rounded-md";

    return table;
}

function create_table_row(): HTMLTableRowElement {
    return document.createElement("tr");
}

function create_table_header(content: string): HTMLTableCellElement {
    const cell = document.createElement("th");

    cell.innerText = content;

    cell.className = "border-collapse border-2 border-zinc-700 rounded-md p-2";

    return cell;
}

function create_table_cell(content: string): HTMLTableCellElement {
    const cell = document.createElement("td");

    cell.innerText = content;

    cell.className = "border-collapse border-2 border-zinc-700 rounded-md p-2";

    return cell;
}