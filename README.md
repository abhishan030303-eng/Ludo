# ABHI LUDO — Real Offline Android Ludo

This repository is an actual playable offline Ludo game, not a UI prototype.

## Included gameplay

- Classic Ludo with 4 tokens per player
- 2, 3 or 4 local players
- Computer mode with offline AI
- Quick Game with one token
- Team Up setup (4 players)
- Pass N Play / local friends
- Real random dice rolls
- Roll-6 token release rule
- Legal token movement
- Safe/star cells
- Capturing opponent tokens
- Extra turn after a 6 or capture
- Home/final lane
- Win detection
- Local coins and rewards
- Offline tournament screen
- Daily reward
- Shop and inventory
- Sound and vibration settings
- LocalStorage persistence
- No login
- No server
- No internet
- No online multiplayer

## Build APK on GitHub

1. Create a new **public** GitHub repository.
2. Upload every file/folder from this project to the repository root.
3. Open **Actions**.
4. Select **Build ABHI LUDO APK**.
5. Tap **Run workflow**.
6. Wait for the green check.
7. Open the workflow run and download the **ABHI-LUDO-OFFLINE-APK** artifact.
8. Extract the APK and install it on Android.

The workflow creates the native Android project during the build, so you do not need to manually create an Android Studio project.

## Important

This is intentionally an offline game. A backend is not required for the requested offline functionality. Player data, coins and inventory are stored on the device.

For real online multiplayer, a server/database/WebSocket layer would be required later.
