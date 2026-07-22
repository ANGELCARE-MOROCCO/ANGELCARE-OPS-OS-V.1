# Architecture

The cockpit is a read-model and command-orchestration layer. It aggregates objectives, signals, strategies, Council reviews, approvals, MZ13 compilation objects and MZ14 execution records. Consequential actions delegate to governed phase services. Cockpit tables store snapshots, briefs, exceptions, interventions, views, watchlists and audit only; they do not duplicate the source-of-truth business hierarchy.
