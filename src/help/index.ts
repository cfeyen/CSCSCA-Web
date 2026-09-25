import { create_cscsca_editor } from "../editor_utils";
import init from "../../cscsca_bindings/pkg/cscsca_bindings.js"

await init();

create_cscsca_editor("cscsca-help-rules-1", "input >> output", true);
create_cscsca_editor("cscsca-help-rules-2", "c h >> tʃ", true);