# DCE media processor R4 — separate activation

This processor belongs to the existing Marketplace. It consumes its leased DCE jobs through the bearer-protected `/api/angelcare-marketplace/admin/digital-customer-experience/processor` endpoint. It reuses the existing signed Windows media gateway and S: storage; it creates no database, mailbox, public store or Coolify resource.

Source installation does not activate processing. Draft authoring, editorial management, analytics and service controls do not require these external media executables. Jobs remain queued until a capable processor is available.

1. Apply SQL 08 and read-only 09 separately. Release the Marketplace source through the existing remote image workflow.
2. Prepare environment files separately:
   `node bridge/dce-media-processor/prepare-config.cjs /absolute/private/output-folder https://my.angelcarehub.com`
   The first file adds two runtime values to the existing Marketplace resource. The second configures this processor. They share one token. Existing configuration files are never overwritten. Reuse existing DCE secrets through the process environment when preparing additional copies. Do not regenerate production analytics secrets without a planned continuity decision.
3. On the designated processing host, use Python 3.10+ and install only the tools required for selected recipes: FFmpeg/ffprobe; Poppler (`pdfinfo`, `pdftoppm`, `pdfseparate`, `pdfunite`, `pdftotext`); Tesseract + fra/eng/ara language packs; LibreOffice for static PPTX/ODP conversion. `python3 dce_processor.py --capabilities --model-dir ./models` reports actual tools, not assumed support.
4. For PPTX/ODP upload, apply the guarded gateway extension in the companion gateway folder to the existing Windows code directory, then restart only that gateway through its established service manager. No storage root, signing token, origin, SMTP setting, MP3, media file or service registration is changed by that updater.
5. First run manually on the processing host:
   `python3 dce_processor.py --env-file /absolute/private/ANGELCARE_DCE_PROCESSOR_ENV_READY.txt --once --work-dir /absolute/private/dce-work --model-dir /absolute/private/models`
6. Review the resulting job in Media → Production studio. Verify every output, rights, text and timing; register reviewed results in the existing native media library; optionally create an editable DCE draft. Registration does not publish it.
7. After the one-job acceptance, run `--run` instead of `--once` through the host's existing approved process supervision. This package does not silently create a Windows service, cron entry, systemd unit or Coolify resource. Stop with the supervisor or SIGTERM/Ctrl+C. Keep the private work directory on a volume with capacity monitoring.

## Recipe and resource boundaries

One job at a time per default processor, with two tool threads, leased heartbeat, three recorded attempts, bounded process time, 40 MiB source/output ceiling and a 200-page selection ceiling. Split larger source material into reviewed jobs. These are resource limits, not a claim of arbitrary unlimited throughput. Scale via separately identified processors; database claims enforce per-worker limits and fair scope rotation.

Originals are checked by size and SHA-256. Successful recorded runs remove their temporary work directory. Failed runs remain inspectable locally and need operational cleanup; that folder is separate from the native S: source vault. Cancellation terminates the current POSIX process group; Windows native deployment should use process-tree supervision. Prefer a dedicated existing Linux processing host/WSL environment for the tested executable toolchain, with a non-admin runtime identity.

PPTX/ODP conversion produces static slides and extracted text. It does not preserve animations, embedded applications or authoring-tool behavior. Password-protected, macro-enabled and unsafe archives are rejected. OCR and transcription require human review and do not invent missing content.

## Optional speech transcription

Whisper integration is present but real inference was not accepted in preparation: the speech model was absent. It is not advertised as available until the `whisper` module and the verified official `small.pt` model exist in the configured model directory. This package does not automatically download models or install Python dependencies. Activate the official `openai-whisper` distribution and its verified model separately; then test FR/EN/AR recordings and review cues before declaring this recipe ready. This is a local processing dependency, not a third-party transcription account requirement.

## Reversal

Stop the processor first. Restore source with the installer backup's guarded rollback. If returning to R3, use SQL 10 only for the R4 trigger disable step; it preserves all database records, releases and audit. Gateway rollback is a separate printed two-file command followed by a targeted gateway restart. Deleted files cannot be restored by source rollback; retention execution always requires a reviewed plan and grace period first.
