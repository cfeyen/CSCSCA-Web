export class ScaResult {
    constructor(headers: string[], evolutions: ScaEvolution[], error: string | null) {
        this.headers = headers;
        this.evolutions = evolutions;
        this.error = error;
    }

    private headers: string[];
    private evolutions: ScaEvolution[];
    private error: string | null;

    public get_headers(): string[] {
        return this.headers;
    }
    public get_evolutions(): ScaEvolution[] {
        return this.evolutions;
    }
    public get_error(): string | null {
        return this.error;
    }
}

export class ScaEvolution {
    constructor(initial: string, intermediate: string[], final: string) {
        this.initial = initial;
        this.intermediate = intermediate;
        this.final = final;
    }

    private initial: string;
    private intermediate: string[];
    private final: string;

    public get_initial(): string {
        return this.initial;
    }
    public get_intermediate(): string[] {
        return this.intermediate;
    }
    public get_final(): string {
        return this.final;
    }
}

export class ScaToken {
    constructor(starting_index: number, token_type: string) {
        this.starting_index = starting_index;
        this.token_type = token_type;
    }

    private starting_index: number;
    private token_type: string;

    public get_starting_index() : number {
        return this.starting_index;
    }
    
    public get_token_type() : string {
        return this.token_type;
    }
}