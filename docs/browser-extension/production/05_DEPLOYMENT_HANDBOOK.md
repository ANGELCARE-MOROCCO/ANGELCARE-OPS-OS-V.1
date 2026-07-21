# Private Deployment Handbook

Channels: development → internal → pilot → stable, with rollback always available. Apply SQL, deploy Gateway, build extension 0.7.0, verify checksum, install on internal devices, observe health, then assign pilot devices. Stable promotion requires live acceptance, rollback rehearsal and executive approval. The private key is supplied locally through `ANGELCARE_EXTENSION_PUBLIC_KEY`; it is never included in the delivery.
