"use client";

import { useMemo } from "react";
import { useLiveFactoryOptions } from "@/hooks/useLiveFactoryOptions";

export type FactoryOptionSelectProps = {
  group: string;
  moduleKey?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  includeDisabled?: boolean;
  fallbackOptions?: Array<{ value: string; label: string } | string>;
};

export function FactoryOptionSelect({
  group,
  moduleKey,
  value,
  defaultValue,
  onChange,
  name,
  label,
  placeholder = "Select option",
  className,
  disabled,
  required,
  includeDisabled = false,
  fallbackOptions = [],
}: FactoryOptionSelectProps) {
  const { enabledOptions, options, loading, error } = useLiveFactoryOptions(group, moduleKey);

  const renderedOptions = useMemo(() => {
    const live = includeDisabled ? options : enabledOptions;

    if (live.length > 0) {
      return live.map((option) => ({
        value: option.value,
        label: option.label,
      }));
    }

    return fallbackOptions.map((option) =>
      typeof option === "string"
        ? { value: option.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: option }
        : option
    );
  }, [enabledOptions, fallbackOptions, includeDisabled, options]);

  return (
    <label style={{ display: "grid", gap: 6, width: "100%" }}>
      {label ? (
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{label}</span>
      ) : null}

      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled || loading}
        required={required}
        className={className}
        data-factory-group={group}
        data-factory-module={moduleKey}
        style={{
          minHeight: 40,
          borderRadius: 10,
          border: "1px solid rgba(148, 163, 184, 0.22)",
          background: "rgba(2, 6, 23, 0.72)",
          color: "#e5eefc",
          padding: "8px 10px",
        }}
      >
        <option value="">{loading ? "Loading live options..." : placeholder}</option>
        {renderedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <small style={{ color: "#fca5a5", fontSize: 11 }}>
          Factory options fallback active: {error}
        </small>
      ) : null}
    </label>
  );
}

export function FactoryCitySelect(props: Omit<FactoryOptionSelectProps, "group">) {
  return (
    <FactoryOptionSelect
      group="cities"
      placeholder="Select city"
      fallbackOptions={["Casablanca", "Rabat", "Marrakech", "Tanger", "Fès"]}
      {...props}
    />
  );
}

export function FactoryDepartmentSelect(props: Omit<FactoryOptionSelectProps, "group">) {
  return (
    <FactoryOptionSelect
      group="departments"
      placeholder="Select department"
      fallbackOptions={["Operations", "HR", "Academy", "Revenue", "Market", "Finance"]}
      {...props}
    />
  );
}

export function FactoryServiceCategorySelect(props: Omit<FactoryOptionSelectProps, "group">) {
  return (
    <FactoryOptionSelect
      group="service_categories"
      placeholder="Select service category"
      fallbackOptions={["Childcare", "Academy", "Care Service", "Partnership", "Consulting"]}
      {...props}
    />
  );
}

export default FactoryOptionSelect;
