import * as monaco from "monaco-editor/editor"
import "monaco-editor/editor/contrib/wordOperations/browser/wordOperations"
import { gen_tokens } from "../cscsca_bindings/pkg/cscsca_bindings.js"
import * as sca from "../cscsca_bindings/src/sca_type_bindings.js"

class ScaTokensProvider implements monaco.languages.TokensProvider {
    constructor () {}

    public getInitialState(): monaco.languages.IState {
        return new ScaTokensProviderState();
    }

    public tokenize(line: string, state: ScaTokensProviderState): monaco.languages.ILineTokens {
        return new ScaLineTokens(gen_tokens(line), state);
    }
}

class ScaLineTokens implements monaco.languages.ILineTokens {
    constructor(tokens: sca.ScaToken[], intitial_state: ScaTokensProviderState) {
        this.endState = intitial_state.clone();
        this.tokens = [];

        tokens.forEach((token) => {
            let token_type = token.get_token_type();

            if (token_type.startsWith(TOKEN_TYPE_SCOPE_BOUND_START_START)) {
                let scope_type = null;

                [TOKEN_TYPE_SCOPE_BOUND_OPTIONAL_END, TOKEN_TYPE_SCOPE_BOUND_SELECTION_END, TOKEN_TYPE_SCOPE_BOUND_REPETITION_END].forEach((end) => {
                    if (token_type.endsWith(end)) { scope_type = end; }
                })

                if (scope_type === null) {
                    token_type = TOKEN_TYPE_ERROR;
                } else {
                    const level = this.endState.get_stack.length % 3;
                    token_type = level === 0 ? TOKEN_TYPE_SCOPE_BOUND_A : (level === 1 ? TOKEN_TYPE_SCOPE_BOUND_B : TOKEN_TYPE_SCOPE_BOUND_C)
                    this.endState.get_stack.push(scope_type);
                }
            } else if (token_type.startsWith(TOKEN_TYPE_SCOPE_BOUND_END_START)) {
                let scope_type = null;

                [TOKEN_TYPE_SCOPE_BOUND_OPTIONAL_END, TOKEN_TYPE_SCOPE_BOUND_SELECTION_END, TOKEN_TYPE_SCOPE_BOUND_REPETITION_END].forEach((end) => {
                    if (token_type.endsWith(end)) { scope_type = end; }
                })

                const stack_len = this.endState.get_stack.length;
                if (scope_type === null || stack_len === 0 || this.endState.get_stack[stack_len - 1] != scope_type) {
                    token_type = TOKEN_TYPE_ERROR;
                } else {
                    this.endState.get_stack.pop();
                    const level = this.endState.get_stack.length % 3;
                    token_type = level === 0 ? TOKEN_TYPE_SCOPE_BOUND_A : (level === 1 ? TOKEN_TYPE_SCOPE_BOUND_B : TOKEN_TYPE_SCOPE_BOUND_C)
                }
            } else if (token_type === TOKEN_TYPE_BREAK && this.endState.get_stack.length !== 0) {
                token_type = TOKEN_TYPE_UNCLOSED_AT_BREAK;
                this.endState = new ScaTokensProviderState;
            } else if (token_type === TOKEN_TYPE_COND_FOCUS && this.endState.get_stack.length !== 0) {
                token_type = TOKEN_TYPE_UNCLOSED_AT_COND_FOCUS;
                this.endState = new ScaTokensProviderState;
            } else if (token_type === TOKEN_TYPE_SCOPE_SPLIT) {
                if (this.endState.get_stack.length === 0) {
                    token_type = TOKEN_TYPE_ERROR;
                } else {
                    const level = (this.endState.get_stack.length - 1) % 3;
                    token_type = level === 0 ? TOKEN_TYPE_SCOPE_BOUND_A : (level === 1 ? TOKEN_TYPE_SCOPE_BOUND_B : TOKEN_TYPE_SCOPE_BOUND_C)
                }
            }

            this.tokens.push({ startIndex: token.get_starting_index(), scopes: token_type });
        });

        if (this.tokens.length === 0 || this.tokens[this.tokens.length - 1]?.scopes !== TOKEN_TYPE_ESCAPED_LINE) {
            if (this.endState.get_stack.length !== 0 && this.tokens.length > 0 && this.tokens[this.tokens.length - 1]?.scopes == TOKEN_TYPE_WHITESPACE ) {
                this.tokens[this.tokens.length - 1]?.scopes == TOKEN_TYPE_UNCLOSED_AT_END
            }

            this.endState = new ScaTokensProviderState;
        }
    }

    public tokens: monaco.languages.IToken[];
    public endState: ScaTokensProviderState;
}

class ScaTokensProviderState implements monaco.languages.IState {
    constructor () {
        this.stack = [];
    }

    private stack: string[];

    public get get_stack() : string[] {
        return this.stack
    }
    

    public clone(): ScaTokensProviderState {
        const new_state = new ScaTokensProviderState();
        this.stack.forEach((s) => new_state.stack.push(s));
        return new_state;
    }

    public equals(other: ScaTokensProviderState): boolean {
        if (this.stack.length == other.stack.length) {
            for (let i = 0; i < this.stack.length; i++) {
                if (this.stack[i] != other.stack[i]) {
                    return false;
                }
            }

            return true;
        }

        return false
    }
}

const TOKEN_TYPE_SPECIAL = "special";
const TOKEN_TYPE_COND_FOCUS = "cond-focus";
const TOKEN_TYPE_UNCLOSED_AT_COND_FOCUS = "cond-focus-unclosed"
const TOKEN_TYPE_COMMENT = "comment";
const TOKEN_TYPE_STATEMENT = "statement";
const TOKEN_TYPE_ESCAPED_LINE = "escaped-newline";
const TOKEN_TYPE_ERROR = "invalid";
const TOKEN_TYPE_DEFINTION = "defintion";
const TOKEN_TYPE_VARIABLE = "variable";
const TOKEN_TYPE_LABEL = "label";
const TOKEN_TYPE_BREAK = "break";
const TOKEN_TYPE_UNCLOSED_AT_BREAK = "break-unclosed";
const TOKEN_TYPE_SCOPE_SPLIT = "scope-split";
const TOKEN_TYPE_SEPERATOR = "punctuation-seperator";
const TOKEN_TYPE_SCOPE_BOUND_START_START = "punctuation-bound-start-";
const TOKEN_TYPE_SCOPE_BOUND_END_START = "punctuation-bound-end-";
const TOKEN_TYPE_SCOPE_BOUND_SELECTION_END = "sel";
const TOKEN_TYPE_SCOPE_BOUND_OPTIONAL_END = "opt";
const TOKEN_TYPE_SCOPE_BOUND_REPETITION_END = "rep";
const TOKEN_TYPE_NUMBER = "number";
const TOKEN_TYPE_PHONE = "phone";
const TOKEN_TYPE_WHITESPACE = "whitespace";
const TOKEN_TYPE_UNCLOSED_AT_END = "whitespace-unclosed";
const TOKEN_TYPE_SCOPE_BOUND_A = "bound-depth-a";
const TOKEN_TYPE_SCOPE_BOUND_B = "bound-depth-b";
const TOKEN_TYPE_SCOPE_BOUND_C = "bound-depth-c";

class ScaThemeData implements monaco.editor.IStandaloneThemeData {
    colors: monaco.editor.IColors = {};
    base: monaco.editor.BuiltinTheme = "vs-dark";
    inherit: boolean = true;
    rules: monaco.editor.ITokenThemeRule[] = [
        { token: TOKEN_TYPE_SPECIAL, foreground: "569CD6" },
        { token: TOKEN_TYPE_COND_FOCUS, foreground: "FF9900" },
        { token: TOKEN_TYPE_UNCLOSED_AT_COND_FOCUS, foreground: "FF9900", fontStyle: "underline" },
        { token: TOKEN_TYPE_COMMENT, foreground: "6A9955" },
        { token: TOKEN_TYPE_STATEMENT, foreground: "4FC1FF", fontStyle: "bold" },
        { token: TOKEN_TYPE_ESCAPED_LINE, foreground: "D7BA7D" },
        { token: TOKEN_TYPE_ERROR, foreground: "CC0000" },
        { token: TOKEN_TYPE_UNCLOSED_AT_END, foreground: "CC0000", fontStyle: "underline" },
        { token: TOKEN_TYPE_DEFINTION, foreground: "4EC9B0" },
        { token: TOKEN_TYPE_VARIABLE, foreground: "4EC9B0", fontStyle: "italic" },
        { token: TOKEN_TYPE_LABEL, foreground: "DCDCAA", fontStyle: "italic" },
        { token: TOKEN_TYPE_BREAK, foreground: "C586C0" },
        { token: TOKEN_TYPE_UNCLOSED_AT_BREAK, foreground: "C586C0", fontStyle: "underline" },
        { token: TOKEN_TYPE_SEPERATOR, foreground: "CCCCCC" },
        { token: TOKEN_TYPE_SCOPE_BOUND_A, foreground: "C586C0" },
        { token: TOKEN_TYPE_SCOPE_BOUND_B, foreground: "569CD6" },
        { token: TOKEN_TYPE_SCOPE_BOUND_C, foreground: "CCCC00" },
        { token: TOKEN_TYPE_NUMBER, foreground: "B5CEA8" },
        { token: TOKEN_TYPE_PHONE, foreground: "9CDCFE" },
        { token: TOKEN_TYPE_SCOPE_SPLIT, foreground: "440044" },
    ];
}

monaco.editor.defineTheme("cscsca-dark", new ScaThemeData())
monaco.languages.register({ id: "cscsca" });
monaco.languages.setTokensProvider("cscsca", new ScaTokensProvider());

const BRACKET_PAIRS: monaco.languages.IAutoClosingPair[] = [
    { open: "(", close: ")" },
    { open: "{", close: "}" },
    { open: "[", close: "]" },
];

monaco.languages.setLanguageConfiguration("cscsca", {
    autoClosingPairs: BRACKET_PAIRS,
    comments: { lineComment: { comment: "##", noIndent: true } },
});

export function create_cscsca_editor(id: string, rules: string, readOnly = false): monaco.editor.IStandaloneCodeEditor {
    const editor = monaco.editor.create(document.getElementById(id) as HTMLElement, {
        theme: "cscsca-dark",
        language: "cscsca",
        value: rules,
        automaticLayout: true,
        editContext: false,
        readOnly,
        minimap: { enabled: !readOnly },
        overviewRulerLanes: readOnly ? 0 : 3,
        scrollbar: {
            vertical: readOnly ? "hidden" : "auto",
            horizontal: readOnly ? "hidden" : "auto",
        },
        scrollBeyondLastLine: !readOnly,
        lineNumbers: readOnly ? "off" : "on",
        renderLineHighlight: readOnly ? "none" : "all",
        autoClosingBrackets: "languageDefined",
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => { toggle_comment(editor) });

    return editor;
}

function toggle_comment(editor: monaco.editor.IStandaloneCodeEditor) {
    const selection = editor.getSelection();
    const model = editor.getModel();

    if (selection === null || model === null) { return; }

    const first_line = selection.startLineNumber;
    const last_line = selection.endLineNumber;

    let commented = true;

    for (var l = first_line; l <= last_line; l++) {
        const line = model.getLineContent(l);
        if (!line.startsWith("##")) {
            commented = false;
        }
    }

    for (var l = first_line; l <= last_line; l++) {
        const line = model.getLineContent(l);

        if (commented) {
            const new_line = line.startsWith("## ") ? line.substring(3) : line.substring(2);

            editor.executeEdits("", [{
                range: new monaco.Selection(l, 0, l, line.length + 1),
                text: new_line,
                forceMoveMarkers: true,
            }]);
        } else {
            editor.executeEdits("", [{
                range: new monaco.Selection(l, 0, l, line.length + 1),
                text: "## " + line,
                forceMoveMarkers: true,
            }]);    
        }
    }
}