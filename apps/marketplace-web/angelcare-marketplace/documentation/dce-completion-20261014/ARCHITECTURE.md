# Architecture and compatibility decisions

The existing scoped DCE repository, native Marketplace shell, authentication, media vault, canonical offers, receiving and SQL ownership remain the baseline. No production SQL or configuration is executed.

The registry will remain the authoritative family contract, extended with mode definitions, typed controls, default values, localized/public/private metadata, references and dependency semantics. Editor, import preparation, validation, preview and release projection consume that contract. A pure compatibility adapter reads old properties without mutating stored records or immutable release snapshots. Canonical properties win; conflicting legacy values remain in the record and are reported for operator correction.

Known defects confirmed in baseline: forms fields/formFields; activities prompt/label; community title/text vs label/description; planners type vs editable/value/due. Current native search ignores q at the server and filters one page. Advertising inspector reads first 100 rules and omits template context. Publication query errors lack a State wrapper. Create/archive rights assume manage for all kinds. Release restore recomputes and overwrites old manifests: this requires a separately supplied ownership-guarded SQL correction.

Reference authority: original ZIP and explicit child/family amendment. Physical PDF pages 8–1 map family pairs 1/2 through 15/16. Physical pages 10/9 define architecture/master map. Finance/business/budgeting examples are excluded; educational calculation and family planning capabilities are retained.
