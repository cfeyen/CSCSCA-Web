import * as monaco from "monaco-editor/editor"
import "monaco-editor/editor/contrib/wordOperations/browser/wordOperations"
import { gen_tokens } from "../cscsca_bindings/pkg/cscsca_bindings.js"
import * as sca from "../cscsca_bindings/src/sca_type_bindings.js"

class ScaTokensProvider implements monaco.languages.TokensProvider {
    constructor () {}

    public getInitialState(): monaco.languages.IState {
        return new ScaTokensProviderState();
    }

    public tokenize(line: string, _state: monaco.languages.IState): monaco.languages.ILineTokens {
        return new ScaLineTokens(gen_tokens(line));
    }
}

class ScaLineTokens implements monaco.languages.ILineTokens {
    constructor(tokens: sca.ScaToken[]) {
        this.endState = new ScaTokensProviderState();
        this.tokens = [];

        tokens.forEach((token) => {
            this.tokens.push({ startIndex: token.get_starting_index(), scopes: token.get_token_type() });
        })
    }

    public tokens: monaco.languages.IToken[];
    public endState: monaco.languages.IState;
}

class ScaTokensProviderState implements monaco.languages.IState {
    constructor () {}

    public clone(): monaco.languages.IState {
        return new ScaTokensProviderState();
    }

    public equals(_other: monaco.languages.IState): boolean {
        return true;
    }
}

const TOKEN_TYPE_SPECIAL = "special";
const TOKEN_TYPE_COMMENT = "comment";
const TOKEN_TYPE_STATEMENT = "statement";
const TOKEN_TYPE_ESCAPED_LINE = "escaped-newline";
const TOKEN_TYPE_ERROR = "invalid";
const TOKEN_TYPE_DEFINTION = "defintion";
const TOKEN_TYPE_VARIABLE = "variable";
const TOKEN_TYPE_LABEL = "label";
const TOKEN_TYPE_BREAK = "break";
const TOKEN_TYPE_SEPERATOR = "punctuation-seperator";
const TOKEN_TYPE_SCOPE_BOUND = "punctuation-bound";
const TOKEN_TYPE_NUMBER = "number";
const TOKEN_TYPE_PHONE = "phone";
const TOKEN_TYPE_WHITESPACE = "whitespace";

class ScaThemeData implements monaco.editor.IStandaloneThemeData {
    colors: monaco.editor.IColors = {};
    base: monaco.editor.BuiltinTheme = "vs-dark";
    inherit: boolean = true;
    rules: monaco.editor.ITokenThemeRule[] = [
        { token: TOKEN_TYPE_SPECIAL, foreground: "569CD6" },
        { token: TOKEN_TYPE_COMMENT, foreground: "6A9955" },
        { token: TOKEN_TYPE_STATEMENT, foreground: "4FC1FF", fontStyle: "bold" },
        { token: TOKEN_TYPE_ESCAPED_LINE, foreground: "D7BA7D" },
        { token: TOKEN_TYPE_ERROR, foreground: "CC0000" },
        { token: TOKEN_TYPE_DEFINTION, foreground: "4EC9B0" },
        { token: TOKEN_TYPE_VARIABLE, foreground: "4EC9B0", fontStyle: "italic" },
        { token: TOKEN_TYPE_LABEL, foreground: "DCDCAA", fontStyle: "italic" },
        { token: TOKEN_TYPE_BREAK, foreground: "C586C0" },
        { token: TOKEN_TYPE_SEPERATOR, foreground: "CCCCCC" },
        { token: TOKEN_TYPE_SCOPE_BOUND, foreground: "CCCCCC" },
        { token: TOKEN_TYPE_NUMBER, foreground: "B5CEA8" },
        { token: TOKEN_TYPE_PHONE, foreground: "9CDCFE" },
        { token: TOKEN_TYPE_WHITESPACE, foreground: "CC0000" },
    ];
}

monaco.editor.defineTheme("cscsca-dark", new ScaThemeData())
monaco.languages.register({ id: "cscsca" });
monaco.languages.setTokensProvider("cscsca", new ScaTokensProvider());

export function create_cscsca_editor(id: string, rules: string, readOnly = false): monaco.editor.IStandaloneCodeEditor {
    return monaco.editor.create(document.getElementById(id) as HTMLElement, {
        theme: "cscsca-dark",
        language: "cscsca",
        value: rules,
        automaticLayout: true,
        editContext: false,
        readOnly,
        minimap: { enabled: !readOnly },
        lineNumbers: readOnly ? "off" : "on"
    });
}