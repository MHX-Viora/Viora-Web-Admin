export type AdminAdvertisement = {
  id: string;
  postId: string;
  advertiserId: string;
  placement: number;
  objective: number;
  ctaType: number;
  destinationUrl: string | null;
  totalBudget: number;
  spentAmount: number;
  reservedAmount: number;
  startAt: string;
  endAt: string;
  status: number;
  reviewReason: string | null;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  content: {
    content: string | null;
    article: { title: string } | null;
    user: { displayName: string; avatarUrl: string | null };
  };
};

export type AdminAdvertisementPage = {
  items: AdminAdvertisement[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
