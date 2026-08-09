# Social Command MZ1 · Windows Storage Boundary

## Authoritative binary store
Windows Social Command Media Gateway, default root:
`D:\AngelCareData\SocialCommand`

## Supabase
Stores metadata, relations, publications, schedules, jobs, results, operations and audit. It does not contain binary media columns and MZ1 never calls Supabase Storage for social assets.

## Upload path
Browser -> signed 30-minute PUT URL -> Windows gateway streaming write -> SHA-256 -> gateway metadata -> Social Command metadata completion.

## Meta delivery
A short-lived HMAC-signed HTTPS delivery URL is generated server-side. The gateway supports byte ranges for provider video fetching.

## Safety
Client controls neither absolute Windows paths nor storage roots. Asset IDs and filenames are normalized. Upload size and MIME are checked. Admin operations require a distinct admin token.
