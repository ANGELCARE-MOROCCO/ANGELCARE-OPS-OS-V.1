# Migration register

Migration: `20260802090000_angelcare_marketplace_conversion_universe.sql`.

It extends existing quote baskets/items, creates conversion sessions, snapshots, holds, consents, outcomes, events, exceptions and policy registry, adds indexes/views, seeds permissions/module/feature flag/policies, enables RLS and revokes direct public table access. It contains no table drop, column drop or truncate.
