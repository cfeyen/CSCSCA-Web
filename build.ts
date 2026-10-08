import { watch , rm, cp } from "node:fs"

const should_watch = process.argv.includes("--watch")
const watch_folders = ['', '/help', '/about', '/changelog']

async function build(): Promise<boolean> {
    rm("./dist", { recursive: true, force: true }, () => {});

    try {
        await Bun.$`bun run tailwindcss -i ./src/input.css -o ./src/index.css`

        await Bun.build({
        entrypoints: watch_folders.map((path) => `./src${path}/index.html`),
        outdir: './dist',
        minify: !should_watch,
        });

        cp("./cscsca_bindings/pkg/cscsca_bindings_bg.wasm", "./dist/cscsca_bindings_bg.wasm", () => {});

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const OK = await build();

if (should_watch && OK) {
    console.log("watching ...");
    let timer: Timer;

    watch_folders.forEach((path) => {
        watch(`./src${path}`, ((_event, filename) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                console.log(`'${filename}' changed`);
                build();
            }, 100)
        }));
    });
}

if (!OK) {
    process.exit(1);
}