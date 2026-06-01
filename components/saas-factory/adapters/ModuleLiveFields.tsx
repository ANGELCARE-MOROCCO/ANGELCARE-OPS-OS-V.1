"use client";

import {
  FactoryCitySelect,
  FactoryDepartmentSelect,
  FactoryOptionSelect,
  FactoryServiceCategorySelect,
  type FactoryOptionSelectProps,
} from "@/components/saas-factory/adapters/FactoryOptionSelect";

type ModuleFieldProps = Omit<FactoryOptionSelectProps, "group" | "moduleKey"> & {
  moduleKey?: string;
};

export function RevenueCityField(props: ModuleFieldProps) {
  return <FactoryCitySelect moduleKey={props.moduleKey ?? "revenue_command_center"} {...props} />;
}

export function RevenueLeadSourceField(props: ModuleFieldProps) {
  return (
    <FactoryOptionSelect
      group="lead_sources"
      moduleKey={props.moduleKey ?? "revenue_command_center"}
      placeholder="Select lead source"
      fallbackOptions={["B2B Partnership", "Market Activation", "Referral", "Website"]}
      {...props}
    />
  );
}

export function RevenuePartnerTypeField(props: ModuleFieldProps) {
  return (
    <FactoryOptionSelect
      group="partner_types"
      moduleKey={props.moduleKey ?? "revenue_command_center"}
      placeholder="Select partner type"
      fallbackOptions={["School", "Nursery", "Corporate", "Ambassador", "Provider"]}
      {...props}
    />
  );
}

export function MarketCityField(props: ModuleFieldProps) {
  return <FactoryCitySelect moduleKey={props.moduleKey ?? "market_os"} {...props} />;
}

export function MarketChannelField(props: ModuleFieldProps) {
  return (
    <FactoryOptionSelect
      group="market_channels"
      moduleKey={props.moduleKey ?? "market_os"}
      placeholder="Select channel"
      fallbackOptions={["Field Activation", "Social", "SEO", "Partnership", "Email"]}
      {...props}
    />
  );
}

export function AcademyCityField(props: ModuleFieldProps) {
  return <FactoryCitySelect moduleKey={props.moduleKey ?? "academy"} {...props} />;
}

export function AcademyLocationField(props: ModuleFieldProps) {
  return (
    <FactoryOptionSelect
      group="academy_locations"
      moduleKey={props.moduleKey ?? "academy"}
      placeholder="Select academy location"
      fallbackOptions={["Casablanca Campus", "Rabat Training Room", "Remote"]}
      {...props}
    />
  );
}

export function HRCityField(props: ModuleFieldProps) {
  return <FactoryCitySelect moduleKey={props.moduleKey ?? "hr"} {...props} />;
}

export function HRDepartmentField(props: ModuleFieldProps) {
  return <FactoryDepartmentSelect moduleKey={props.moduleKey ?? "hr"} {...props} />;
}

export function HRPositionField(props: ModuleFieldProps) {
  return (
    <FactoryOptionSelect
      group="positions"
      moduleKey={props.moduleKey ?? "hr"}
      placeholder="Select position"
      fallbackOptions={["Care Coordinator", "Trainer", "HR Officer", "Operations Lead", "Sales Advisor"]}
      {...props}
    />
  );
}

export function ServiceCityField(props: ModuleFieldProps) {
  return <FactoryCitySelect moduleKey={props.moduleKey ?? "service_os"} {...props} />;
}

export function ServiceCategoryField(props: ModuleFieldProps) {
  return <FactoryServiceCategorySelect moduleKey={props.moduleKey ?? "service_os"} {...props} />;
}

export function ConnectTaskPriorityField(props: ModuleFieldProps) {
  return (
    <FactoryOptionSelect
      group="task_priorities"
      moduleKey={props.moduleKey ?? "connect"}
      placeholder="Select priority"
      fallbackOptions={["Urgent", "High", "Normal", "Low"]}
      {...props}
    />
  );
}

export function ConnectDepartmentField(props: ModuleFieldProps) {
  return <FactoryDepartmentSelect moduleKey={props.moduleKey ?? "connect"} {...props} />;
}
