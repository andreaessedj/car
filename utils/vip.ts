// FIX: Loosen type of profile to allow optional is_vip and vip_until properties, and handle undefined vip_until. This fixes compatibility with the Venue type.
export const isVipActive = (profile: { is_vip?: boolean; vip_until?: string | null } | null): boolean => {
    if (!profile || !profile.is_vip) {
        return false;
    }
    
    // If vip_until is null or undefined, it's a permanent VIP status.
    if (profile.vip_until == null) {
        return true;
    }

    // Otherwise, check if the expiration date is in the future.
    const expirationDate = new Date(profile.vip_until);
    const now = new Date();
    
    return expirationDate > now;
};


export function addVipDays(days: number): string {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return until.toISOString();
}
