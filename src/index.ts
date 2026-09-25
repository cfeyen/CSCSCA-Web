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

const input_box = document.getElementById("cscsca-input") as HTMLTextAreaElement;

function on_apply() {
    let input = input_box.value;
    let rules = editor.getValue();

    let result = apply(input, rules) as sca.ScaResult;

    set_output(result);
}

(document.getElementById("cscsca-apply") as HTMLElement).onclick = on_apply;