# Patch Manifest — Revenue Command Center Excellence v10 Phase 10

**Repository files:** 54
**Routes rebuilt:** 8
**Protected API handlers:** 25
**Governed commands:** 40
**Support tables:** 34
**SQL functions/triggers:** 15

## Repository paths

- `apps/ops-web/app/(protected)/revenue-command-center/campaigns/[id]/assets/page.tsx` — 368 bytes — SHA-256 `b65cb3f4e73ba5b1be15e080092ed59f33dcd7391546f04661313ecf82f6fb83`
- `apps/ops-web/app/(protected)/revenue-command-center/campaigns/[id]/execution/page.tsx` — 364 bytes — SHA-256 `f44517b657870ebfa829995b39a84e45a08e29fc661bab296567a026a7ab8d9b`
- `apps/ops-web/app/(protected)/revenue-command-center/campaigns/[id]/page.tsx` — 362 bytes — SHA-256 `4ead3a848bd952009ff4dd5de9d2db48cb7ed9caccb58a4b621c94f5489c9b3c`
- `apps/ops-web/app/(protected)/revenue-command-center/campaigns/[id]/performance/page.tsx` — 366 bytes — SHA-256 `7ce33fc77a38b804f839c6fd8bd6f6c60d807ce592178db2417dd722408577dc`
- `apps/ops-web/app/(protected)/revenue-command-center/campaigns/board/page.tsx` — 262 bytes — SHA-256 `84092bac3a4aadb2a117ef1a4713bd29f2167df9af3ebe7880ce3161409fa122`
- `apps/ops-web/app/(protected)/revenue-command-center/campaigns/new/page.tsx` — 270 bytes — SHA-256 `ba3bc769c1ca8fa8b5f55ad403fd21e72eaae333bd7c9cd24b74181326302585`
- `apps/ops-web/app/(protected)/revenue-command-center/campaigns/page.tsx` — 264 bytes — SHA-256 `f9c4e3f75b22cdbcd6f742c0e18ee24adf0d0eeb75ff391ecf9de37c4ceeada5`
- `apps/ops-web/app/(protected)/revenue-command-center/sdr-execution/page.tsx` — 259 bytes — SHA-256 `a326b0f89cfe76600815b57ea0c3bb1850e4bf3b907222c59d26d058697b7663`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/_shared.ts` — 1306 bytes — SHA-256 `405015b1972dd989ff7a5da37e256ee12135bdb8c9d65ae47aa6c4bfc5aaa8d9`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/approvals/route.ts` — 157 bytes — SHA-256 `35cf4cb57618689dc7e1e300d2b16b9a68a562c831d17489937d79d22abb7ec2`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/attribution/route.ts` — 103 bytes — SHA-256 `18615dcd4df5c1e94d92427f6697123cc770b963eb6df6861d4ed1c91fa47a77`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/audience/route.ts` — 100 bytes — SHA-256 `508717cad573f2c2a9d13d23dc0fac4f6d85ff8f2a393be848801cda7e2db78e`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/calls/route.ts` — 104 bytes — SHA-256 `ed6113d71ccf710fc38f8619b3e8701dcfd42c9467028d4683b8ec7486e67235`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/campaigns/route.ts` — 238 bytes — SHA-256 `98a2cfa0429a8c7aa3362c58ef9e46c5fee24cd44d72da577fc1452a6019877a`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/conflicts/route.ts` — 180 bytes — SHA-256 `bdbed4b3ebfe134ae1e8c4591098c8722df6cf8bd3a017033d77c010df436801`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/conversions/route.ts` — 188 bytes — SHA-256 `18da99801ab51922e5b43f1aa4c81a430a727da165c22ac2171e4f18609faff5`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/costs/route.ts` — 96 bytes — SHA-256 `58c3caf6ef09c5730642ac2144e8d582c064b3d5a4537f769d67be0d24bf97a1`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/dispatch/route.ts` — 98 bytes — SHA-256 `7aad299efe53fb322c0c74e1be11a019514f4b8c8750d683692c64a3a0da83a8`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/eligibility/route.ts` — 105 bytes — SHA-256 `2b038dabebd0fb19949da99b7f6642f866e8bf43217b4207a3477834f3077218`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/enrollments/route.ts` — 158 bytes — SHA-256 `3990de2dcbe812449ec3b5d1294f65ccf2c317b13ed8fb63f689972b6dd7741d`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/evidence/route.ts` — 100 bytes — SHA-256 `38e74e4b98c34897c597e3aaa55a30013586ef429c1aeb0128923512dd04017e`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/experiments/route.ts` — 102 bytes — SHA-256 `45592dff3c4f4b84e4177ba27b440b825becfa9836409a038204d1df7a3d022c`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/launch/route.ts` — 100 bytes — SHA-256 `73fc8dd5672df138bf8eadc1d10f58375341c4759bd5cadb04e407149d9f6b41`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/lifecycle/route.ts` — 194 bytes — SHA-256 `94c0759abf469fc3c8a71c33cf0f0b69534fbc74a5724aa42e81f53832334a88`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/performance/route.ts` — 175 bytes — SHA-256 `39ce94f21d70d51a4609e5e51e94b29249ed6ef29461c7303faba20f50a588c9`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/portfolio/route.ts` — 879 bytes — SHA-256 `188a6298867daeedc28a307392a7344f28336950d6f83c968da1b435ad1005ac`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/provider-events/route.ts` — 106 bytes — SHA-256 `2055e704f179422f574e76ad8a9d9bce0141bde6e8dde8056dc77f5b4fd5f3a0`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/readiness/route.ts` — 197 bytes — SHA-256 `3948933a1a341cddd8200a73179dc1d9de81e4d6864f2cc7a3ec6094bfe7e959`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/recovery/route.ts` — 174 bytes — SHA-256 `9df254177f74f2c964d73684956734a1bb6e0dc6b02b78f17f671c07e02f555a`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/replies/route.ts` — 97 bytes — SHA-256 `4ac68694101d1db1db30137a0203051cd1854b5c3ed7dddba2e5f1678b4327c1`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/segments/route.ts` — 99 bytes — SHA-256 `b962c85c5277e713280e8df3093477bdcdfe8b43940b38fac5fe9a4e1b9e6260`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/sequences/route.ts` — 242 bytes — SHA-256 `5a76c8867d8b0f1ade2ed3e75a0532af7d41008a11b3626268ea62210c48ab81`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/suppressions/route.ts` — 162 bytes — SHA-256 `9827382b6c5ab0379e5ed5295ea58f48a318a287002fc896233538397ba4d497`
- `apps/ops-web/app/api/revenue-command-center/campaign-enterprise/templates/route.ts` — 221 bytes — SHA-256 `264c7aded8ef56e2c5bb2786b28871e12825c46861e39c5809ba92993ecfab30`
- `apps/ops-web/app/api/revenue-command-center/campaigns/route.ts` — 2145 bytes — SHA-256 `aa7029c8836742ea55fb1a324e9094605e1f0f2271528aa246cdee3dafee3409`
- `apps/ops-web/components/revenue-command-center/campaign-enterprise/RevenueCampaignWorkspace.module.css` — 17066 bytes — SHA-256 `01a38ac5be88121949d6ec2a372f729cefdc55ff5ff967522e826575e0f270a8`
- `apps/ops-web/components/revenue-command-center/campaign-enterprise/RevenueCampaignWorkspace.tsx` — 61974 bytes — SHA-256 `795c6a529205b0a8764274f17ec6f7ce884104b3a7972ab2251b041c34864c89`
- `apps/ops-web/components/revenue-command-center/campaign-enterprise/campaign-actions.ts` — 24735 bytes — SHA-256 `3c33b6533a487cd54f0c3f39eaa27be00df5a9ccd9a653662985dd48a2d76358`
- `apps/ops-web/components/revenue-command-center/campaign-enterprise/route-contracts.ts` — 4202 bytes — SHA-256 `f0e1606d0ac7457d27165c65efb14826399eae9e3e704f0f612e60475cd53515`
- `apps/ops-web/components/revenue-command-center/campaign-enterprise/types.ts` — 5410 bytes — SHA-256 `4b43ec8a705d10ba82c53546f3dd9c02b774584925ffa2202a8e736f2cb3321c`
- `apps/ops-web/components/revenue-command-center/campaign-enterprise/useCampaignPortfolio.ts` — 1696 bytes — SHA-256 `8296dfeb26edc2c5c753d897eb1e94461b5b992735eb285020b112543870e542`
- `apps/ops-web/lib/revenue-command-center/campaign-enterprise/server.ts` — 56299 bytes — SHA-256 `7b94d3ad823a00c516c483e472b40fcfd077b4443c778360f1b399c4d6fc8bce`
- `apps/ops-web/package.json` — 16639 bytes — SHA-256 `8c7d46015467dfbbe14469d5425724b692e59049ed9e14b7f8b6c940008db68b`
- `apps/ops-web/scripts/release-revenue-command-center-campaign-phase10.mjs` — 7345 bytes — SHA-256 `bcd15e3cb3d372c5fa614c1b890acb9ed147c566ded286c7d909ef63c358bc4f`
- `apps/ops-web/scripts/verify-revenue-command-center-campaign-enterprise-phase10.mjs` — 11657 bytes — SHA-256 `e1d3c3e5d4cd3e69f5582c0feb6ee8b833af6cbc56735f699ef2a90dfb9a4642`
- `apps/ops-web/scripts/verify-revenue-command-center-uiux-excellence.mjs` — 17192 bytes — SHA-256 `a76afe6fc628c9be688a6451632748608e93f40e9a1278ec932417f20722f564`
- `apps/ops-web/supabase/migrations/20260726_0800_revenue_campaign_sdr_attribution_completion.sql` — 103265 bytes — SHA-256 `149ddf13b63dbe90ae0a5451acd051e13ad3c8996ddd3fd49ced3284bebf7c04`
- `apps/ops-web/supabase/revenue-command-center/preflight/20260726_campaign_sdr_attribution_live_schema_preflight.sql` — 11583 bytes — SHA-256 `4e6b4823545746e95e7e08e668229b4701b16123ed5d5a5cb94a90343bb16242`
- `apps/ops-web/supabase/revenue-command-center/rollback/20260726_revenue_campaign_enterprise_phase10_rollback.sql` — 6260 bytes — SHA-256 `a86e1ee201cb0ab71aae3933d6a72947e18f1cae184113d7aca559c5bd96c0c4`
- `apps/ops-web/supabase/revenue-command-center/verification/20260726_campaign_attribution_verification.sql` — 2372 bytes — SHA-256 `77166987822fad9a1d29a7d7fb9774a2b1b542dc11dd825aecbb9d2bab9839f1`
- `apps/ops-web/supabase/revenue-command-center/verification/20260726_campaign_eligibility_sequence_integrity_verification.sql` — 2593 bytes — SHA-256 `60cd73ef6e563de65917c2d63fbcb7e7279124f053015fdeea9b97c478633c92`
- `apps/ops-web/supabase/revenue-command-center/verification/20260726_campaign_performance_cost_verification.sql` — 1719 bytes — SHA-256 `5ee31751c8c86ad71c4577a6d7359b9d5b5fff1a641ad88fc98cb22d79c9b747`
- `apps/ops-web/supabase/revenue-command-center/verification/20260726_campaign_sdr_attribution_rls_verification.sql` — 5952 bytes — SHA-256 `6fb8bf07a1be58fa869ffe4d1ecd69ecafff7af5865e298a25b3aa5203b9872e`
- `apps/ops-web/tsconfig.revenue-command-center-campaign-phase10.json` — 677 bytes — SHA-256 `ece97ada044bf36bdfbe630560f29823906e1040347ceb49a63e3db12117a97b`

## Verification evidence

- 497 Phase 10 static checks passed.
- 141 global Revenue UI/UX checks passed.
- 41 TS/TSX files transpiled with zero syntax errors.
- Clean post-v9 overlay simulation passed.
- SQL structural audit passed.
- Exact Next.js production build remains mandatory on the user machine and is not claimed as passed in the artifact environment.
