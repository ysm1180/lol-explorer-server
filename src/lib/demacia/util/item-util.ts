export class ItemUtil {
  static isSupportItem(itemId: number) {
    const supportItemIds = [3096, 3097, 3098, 3301, 3302, 3303, 3092, 3401, 3069];
    return supportItemIds.includes(itemId);
  }
}
