export type AdminStickerPack = {
  id: string; name: string; description: string | null; thumbnailUrl: string; price: number;
  isFeatured: boolean; isActive: boolean; availableFrom: string | null;
  availableUntil: string | null; stickerCount: number; ownerCount: number; usageCount: number;
  createdAt: string; updatedAt: string;
};

export type Sticker = { id: string; stickerPackId: string; name: string; imageUrl: string; thumbnailUrl: string | null; format: number; sortOrder: number; isActive: boolean };
export type StickerPackDetail = { pack: AdminStickerPack; stickers: Sticker[]; isOwned: boolean; canUse: boolean };
export type SaveStickerPack = Pick<AdminStickerPack, 'name' | 'description' | 'thumbnailUrl' | 'price' | 'isFeatured' | 'isActive' | 'availableFrom' | 'availableUntil'>;
export type SaveSticker = Pick<Sticker, 'name' | 'imageUrl' | 'thumbnailUrl' | 'format' | 'sortOrder' | 'isActive'>;
