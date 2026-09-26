use cscsca::{IoGetter, Lexer, LogRuntime, ScaError, SirToken, build_rules};
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(module = "/src/sca_type_bindings.ts")]
extern "C" {
    pub type ScaToken;

    #[wasm_bindgen(constructor)]
    fn new(starting_index: usize, token_type: String) -> ScaToken;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TokenOfNote {
    Definition,
    Variable,
    None,
}

#[wasm_bindgen]
pub fn gen_tokens(rules: &str) -> Vec<ScaToken> {
    let mut last_token = TokenOfNote::None;

    Lexer::lex(rules).map(|token| {
        let last = last_token;

        if !matches!(token, SirToken::Whitespace(_)) {
            last_token = TokenOfNote::None;
        }

        let t = match token {
            SirToken::Any(_)
            | SirToken::Bound(_)
            | SirToken::CondFocus(_, _)
            | SirToken::Negative(_)
            => TokenType::Special,
            SirToken::Break(_, _) => TokenType::Break,
            SirToken::Comment(_) => TokenType::Comment,
            SirToken::Message(_, _) => TokenType::IoMsg,
            SirToken::DefinitionDeclaration(_)
            | SirToken::LazyDefinitionDeclaration(_) => {
                last_token = TokenOfNote::Definition;
                TokenType::StatementStart
            },
            SirToken::GetCommand(_)
            | SirToken::GetAsCodeCommand(_) => {
                last_token = TokenOfNote::Variable;
                TokenType::StatementStart
            },
            SirToken::PrintCommand(_) => TokenType::StatementStart,
            SirToken::NonPhoneEscape('\n', _) => TokenType::NewLineEscape,
            SirToken::NonPhoneEscape(_, _)
            | SirToken::InvalidPhone(_)
            | SirToken::InvalidPrefix(_, _) => TokenType::Error,
            SirToken::Definition(_) => TokenType::DefinitionCall,
            SirToken::Variable(_) => TokenType::VariableCall,
            SirToken::Label(_) => TokenType::Label,
            SirToken::ArgSep(_) => TokenType::Punctuation,
            SirToken::ScopeStart(_, _)
            | SirToken::ScopeEnd(_, _)
            => TokenType::ScopeBound,
            SirToken::Number(_, _) => TokenType::Number,
            SirToken::Phone(_) => match last {
                TokenOfNote::Definition => TokenType::DefinitionDecl,
                TokenOfNote::Variable => TokenType::VariableDecl,
                TokenOfNote::None => TokenType::Phone
            },
            SirToken::Whitespace(_)
            | SirToken::EndOfExpr(_) => TokenType::Whitespace,
        };

        // when using monaco, rules is a line and monaco expects character number
        let index = rules[..token.span().index()].chars().map(char::len_utf16).sum();
        ScaToken::new(index, t.to_string())
    })
    .collect()
}

enum TokenType {
    Comment,
    IoMsg,
    Special,
    StatementStart,
    NewLineEscape,
    Error,
    DefinitionCall,
    VariableCall,
    Label,
    DefinitionDecl,
    VariableDecl,
    Break,
    Punctuation,
    ScopeBound,
    Number,
    Phone,
    Whitespace,
}

impl std::fmt::Display for TokenType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Special => write!(f, "special"),
            Self::Comment | Self::IoMsg => write!(f, "comment"),
            Self::StatementStart => write!(f, "statement"),
            Self::NewLineEscape => write!(f, "escaped-newline"),
            Self::Error => write!(f, "invalid"),
            Self::DefinitionCall | Self::DefinitionDecl => write!(f, "defintion"),
            Self::VariableCall | Self::VariableDecl => write!(f, "variable"),
            Self::Label => write!(f, "label"),
            Self::Break => write!(f, "break"),
            Self::Punctuation => write!(f, "punctuation-seperator"),
            Self::ScopeBound => write!(f, "punctuation-bound"),
            Self::Number => write!(f, "number"),
            Self::Phone => write!(f, "phone"),
            Self::Whitespace => write!(f, "whitespace"),
        }
    }
}

#[wasm_bindgen(module = "/src/sca_type_bindings.ts")]
extern "C" {
    pub type ScaEvolution;

    #[wasm_bindgen(constructor)]
    fn new(initial: String, intermediate: Vec<String>, r#final: String) -> ScaEvolution;
}

#[wasm_bindgen(module = "/src/sca_type_bindings.ts")]
extern "C" {
    pub type ScaResult;

    #[wasm_bindgen(constructor)]
    fn new(headers: Vec<String>, evolutions: Vec<ScaEvolution>, error: Option<ScaErrorData>) -> ScaResult;
}

#[wasm_bindgen(module = "/src/sca_type_bindings.ts")]
extern "C" {
    pub type ScaErrorData;

    #[wasm_bindgen(constructor)]
    fn new(error: String, input: Option<&str>) -> ScaErrorData;
}

impl ScaResult {
    fn new_error(e: ScaError, input: Option<&str>) -> Self {
        Self::new(Vec::new(), Vec::new(), Some(ScaErrorData::new(e.to_string(), input)))
    }

    fn new_result(headers: Vec<String>, evolutions: Vec<ScaEvolution>) -> Self {
        Self::new(headers, evolutions, None)
    }
}

#[wasm_bindgen]
pub fn apply(input: &str, rules: &str) -> ScaResult {
    let rules = match build_rules(rules, &mut WebGetter) {
        Err(e) => return ScaResult::new_error(e, None),
        Ok(rules) => rules,
    };

    let mut headers = Vec::new();
    let mut evolutions = Vec::new();

    for input in input.lines().filter(|line| !line.is_empty()) {
        let mut runtime = LogRuntime::default();

        let output = match rules.apply_fallible(input, &mut runtime) {
            Err(e) => return ScaResult::new_error(e, Some(input)),
            Ok(output) => output,
        };

        let header_unset = headers.is_empty();
        let mut intermediate = Vec::new();

        for (header, stage) in runtime.flush_logs() {
            if header_unset {
                headers.push(header);
            }

            intermediate.push(stage);
        }

        evolutions.push(ScaEvolution::new(input.to_string(), intermediate, output));
    }

    ScaResult::new_result(headers, evolutions)
}

struct WebGetter;

impl IoGetter for WebGetter {
    fn get_io(&mut self, _: &str) -> Result<String, String> {
        Err("GET and GET_AS_CODE not implemented".to_string())
    }
}
