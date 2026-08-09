# API Register

All routes are thin adapters. Business logic remains in domain repositories and handlers. APIs use the canonical request ID, response envelope, server permission guard and audit writer. Collections support GET and governed POST; lifecycle mutations use dedicated transition endpoints.
