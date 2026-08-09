-- Read-only calculation contract verification
with cases(gross_value,discount_value,estimated_cost,expected_net,expected_margin,expected_margin_percent) as (
 values
 (100000::numeric,10000::numeric,60000::numeric,90000::numeric,30000::numeric,33.333333::numeric),
 (50000::numeric,0::numeric,25000::numeric,50000::numeric,25000::numeric,50::numeric),
 (0::numeric,0::numeric,0::numeric,0::numeric,0::numeric,0::numeric)
), calculated as (
 select *,gross_value-discount_value as actual_net,(gross_value-discount_value)-estimated_cost as actual_margin,
 case when gross_value-discount_value>0 then (((gross_value-discount_value)-estimated_cost)/(gross_value-discount_value))*100 else 0 end as actual_margin_percent
 from cases
)
select gross_value,discount_value,estimated_cost,
 case when actual_net=expected_net and actual_margin=expected_margin and abs(actual_margin_percent-expected_margin_percent)<0.001 then 'PASS' else 'FAIL' end as result,
 jsonb_build_object('actual_net',actual_net,'actual_margin',actual_margin,'actual_margin_percent',actual_margin_percent) as actual
from calculated;
