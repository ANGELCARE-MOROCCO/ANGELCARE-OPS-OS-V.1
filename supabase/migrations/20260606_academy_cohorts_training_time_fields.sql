alter table academy_cohorts
  add column if not exists training_start_time time default '09:00',
  add column if not exists training_end_time time default '17:00',
  add column if not exists hours_per_day numeric(5,2) default 8;
