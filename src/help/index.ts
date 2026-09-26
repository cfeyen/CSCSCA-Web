import { create_cscsca_editor } from "../editor_utils";
import init from "../../cscsca_bindings/pkg/cscsca_bindings.js"

await init();

create_cscsca_editor("cscsca-help-rules-1", "input >> output", true);
create_cscsca_editor("cscsca-help-rules-2", "## deromanization of 'ch' \nc h >> tʃ", true);

create_cscsca_editor("cscsca-help-conditions-1", "## [h] is lost word-finally\nh >> / _ #", true);
create_cscsca_editor("cscsca-help-conditions-2", "## [h] is lost at word-boundaries\nh >> / # _ / _ #", true);
create_cscsca_editor("cscsca-help-conditions-3", "## [h] is lost when it is the word\nh >> / # _ & _ #", true);
create_cscsca_editor("cscsca-help-conditions-4", "## [t] palatalizes before [i] unless after [n] or before [j]\nt >> tʃ / _ i &! n _ / _ j", true);
create_cscsca_editor("cscsca-help-conditions-5", "input >> output / before _ after", true);
create_cscsca_editor("cscsca-help-conditions-6", "## [h] is lost except when word-initial\nh >> // # _", true);

create_cscsca_editor("cscsca-help-scopes-1", "## [ng] and [nk] merge to [ŋ]\nn {k, g} >> ŋ", true);
create_cscsca_editor("cscsca-help-scopes-2", "## [l] and [lj] merge to [j]\na >> l (j) >> j", true);
create_cscsca_editor("cscsca-help-scopes-3", "## [u] fronts to [y] when following [i] within the word\nu >> y / _ [*] i", true);
create_cscsca_editor("cscsca-help-scopes-4", "## Epenthesis of [t] between [es] and [r] or [ess] and [r]\n>> t / e [s = 1, 2] _ r", true);

create_cscsca_editor("cscsca-help-labels-1", "## Voiced stops devoice\n{b, d, g} >> {p, t, k}", true);
create_cscsca_editor("cscsca-help-labels-2", "## Voiced stops merge with dorsal fricatives\n{x, h} {b, d, g} >> {p, t, k}", true);
create_cscsca_editor("cscsca-help-labels-3", "## Voiced stops merge with dorsal fricatives\n{x, h} $stop{b, d, g} >> $stop{p, t, k}", true);
create_cscsca_editor("cscsca-help-labels-4", "## Nasals assimilate\n{m, n} >> $place{m, n, ŋ} / _ $place{p, t, k}", true);
