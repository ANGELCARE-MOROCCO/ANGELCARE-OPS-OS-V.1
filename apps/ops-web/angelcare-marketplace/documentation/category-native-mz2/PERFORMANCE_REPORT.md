# Performance Report

The adaptive resolver is request-time and loads only the active item, schema, media, variants, availability and bounded recommendations. Images use lazy loading outside primary media. Configurator state stays client-side until explicit validation/revalidation. No whole-site rebuild is required for ordinary category-native publication. Final production latency measurements remain environmental and are collected by the supplied runtime runner.
