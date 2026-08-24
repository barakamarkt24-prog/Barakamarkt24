export const referralService = {
  generateReferralCode(name?: string): string {
    const cleanName = (name || 'BM').replace(/\s+/g, '').slice(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${random}`;
  },
  async getReferralByCode(code: string) {
    return null;
  },
  async findUserByReferralCode(code: string): Promise<any | null> {
    return null;
  },
  async recordReferral(referrerId: string, refereeId: string, referralCode: string) {
    return true;
  },
  async applyReferral(referrerId: string, refereeId: string) {
    return true;
  }
};
