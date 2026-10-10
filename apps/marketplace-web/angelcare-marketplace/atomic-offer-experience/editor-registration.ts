type EditorComponent = {
  fields?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  render?: (props: any) => any;
  [key: string]: unknown;
};

/** Stored legacy roots remain legacy when opened or saved in Studio. */
export function registerAtomicComponents(
  components: Record<string, EditorComponent>,
  additions: Record<string, EditorComponent>,
): void {
  for (const [key, atomic] of Object.entries(additions)) {
    const legacy = components[key];
    if (!legacy || key === 'atomic_offer_section') {
      components[key] = atomic;
      continue;
    }
    components[key] = {
      ...legacy,
      ...atomic,
      fields: { ...legacy.fields, ...atomic.fields },
      defaultProps: { ...legacy.defaultProps, atomicExperienceVersion: 0 },
      render: props => props.atomicExperienceVersion === 1
        ? atomic.render?.(props)
        : legacy.render?.(props),
    };
  }
}
