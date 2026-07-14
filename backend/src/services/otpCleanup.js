import { User } from "../models/User.js";

const CLEANUP_INTERVAL_MS = 60 * 1000;

export async function removeExpiredLoginOtps() {
  const result = await User.updateMany(
    { loginOtpExpiresAt: { $lte: new Date() } },
    { $unset: { loginOtpHash: "", loginOtpExpiresAt: "" } }
  );

  if (result.modifiedCount > 0) {
    console.log(`Removed ${result.modifiedCount} expired login OTP record(s)`);
  }
}

export function scheduleOtpCleanup(userId, expiresAt) {
  const delay = Math.max(new Date(expiresAt).getTime() - Date.now(), 0);
  const timer = setTimeout(async () => {
    try {
      await User.updateOne(
        { _id: userId, loginOtpExpiresAt: { $lte: new Date() } },
        { $unset: { loginOtpHash: "", loginOtpExpiresAt: "" } }
      );
    } catch (error) {
      console.error("Scheduled OTP cleanup failed:", error.message);
    }
  }, delay);

  timer.unref();
}

export function startOtpCleanupJob() {
  removeExpiredLoginOtps().catch((error) => {
    console.error("Initial OTP cleanup failed:", error.message);
  });

  const interval = setInterval(() => {
    removeExpiredLoginOtps().catch((error) => {
      console.error("OTP cleanup job failed:", error.message);
    });
  }, CLEANUP_INTERVAL_MS);

  interval.unref();
}
