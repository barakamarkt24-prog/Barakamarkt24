export const fcmService = {
  async initFCM(): Promise<string | null> {
    return null;
  },
  async requestPermission(): Promise<boolean> {
    return true;
  },
  async requestPermissionAndGetToken(vapidKey?: string, userId?: string): Promise<string | null> {
    return null;
  }
};
