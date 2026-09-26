import "tailwindcss"
import * as sca from "../cscsca_bindings/src/sca_type_bindings.js"
import init, { apply } from "../cscsca_bindings/pkg/cscsca_bindings.js"
import { set_output } from "./output_gen.ts"
import { create_cscsca_editor } from "./editor_utils.ts"

await init();

const RULE_KEY = "cscsca.rules"

const DEFAULT_RULES = `DEFINE V {i, e, a, u, o}
DEFINE N {m, n}
DEFINE P- {p, t, k}
DEFINE P+ {b, d, g}

@P- >> @P+ / @V _ @V
{@V, @N} >> / @V [*] _ #
`

function get_rules(): string {
    const local = localStorage.getItem(RULE_KEY);

    return local == null ? DEFAULT_RULES : local;
}

const editor = create_cscsca_editor("cscsca-rules", get_rules())

editor.onEndUpdate(() => {
    localStorage.setItem(RULE_KEY, editor.getValue());
});

const input_box = document.getElementById("cscsca-input")! as HTMLTextAreaElement;

(document.getElementById("cscsca-apply")!).onclick = () => {
    let input = input_box.value;
    let rules = editor.getValue();

    let result = apply(input, rules) as sca.ScaResult;

    set_output(result);
};

function new_file_input(): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*.sca,*.cscsca"
    input.hidden = true;
    return input;
}

const import_selector = new_file_input();

(document.getElementById("cscsca-rules-import")!).onclick = () => {
    import_selector.click();
};

import_selector.onchange = async () => {
    const file = import_selector.files?.[0];

    if (file) {
        import_selector.value = "";
        const new_rules = await file.text();
        editor.setValue(new_rules);
    } 
}

(document.getElementById("cscsca-rules-export") as HTMLElement).onclick = () => {
    const blob = new Blob([editor.getValue()], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sound-change.sca";
    link.click();
};