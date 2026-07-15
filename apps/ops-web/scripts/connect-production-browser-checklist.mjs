console.log(`AngelCare Connect V5 browser checklist

Run this manually while logged into the app:
1. Visit /connect
2. Open browser DevTools > Network
3. Confirm these return 200:
   - /api/connect/me
   - /api/connect/staff
   - /api/connect/conversations
4. Start a private chat from the staff panel
5. Send a message
6. Reload and confirm the message persisted
7. Start audio/video call and confirm the call overlay opens

Reminder: unauthenticated Node fetches should return 401 by design.`)
