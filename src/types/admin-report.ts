export type AdminReport = {
  id: string;
  reporterUserId: string;
  reporterDisplayName: string;
  targetId: string;
  targetType: number;
  reason: number;
  status: number;
  description: string;
  createdAt: string;
};

export type ReportListParams = {
  page: number;
  pageSize: number;
  status?: string;
  targetType?: string;
  reason?: string;
  sortBy?: string;
  sortDirection?: string;
};
