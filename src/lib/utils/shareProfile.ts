const APP_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://seasignal.app";

/**
 * Copy a seafarer profile link to the clipboard.
 * Returns true if the copy succeeded.
 */
export async function copyProfileLink(profileId: string): Promise<boolean> {
  const url = `${APP_BASE_URL}/seafarers/${profileId}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate an invite / referral link with UTM params for tracking.
 */
export function generateInviteLink(): string {
  return `${APP_BASE_URL}/register?utm_source=invite&utm_medium=referral&utm_campaign=crew_invite`;
}

/**
 * Copy the invite link to the clipboard.
 * Returns true if the copy succeeded.
 */
export async function copyInviteLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(generateInviteLink());
    return true;
  } catch {
    return false;
  }
}
