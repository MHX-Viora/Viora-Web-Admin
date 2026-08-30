import type { AdminReport } from '../../types/admin-report';
import { ReportCardRow, ReportRow } from './ReportRow';

export function ReportTable({ reports }: { reports: AdminReport[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table report-table">
          <thead>
            <tr>
              <th className="column-author">Người báo cáo</th>
              <th className="column-target">Đối tượng bị báo cáo</th>
              <th className="column-reason">Lý do</th>
              <th className="column-content table-column-secondary">Mô tả</th>
              <th className="column-status">Trạng thái</th>
              <th className="column-date">Ngày tạo</th>
              <th className="column-action"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>{reports.map((report) => <ReportRow key={report.id} report={report} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{reports.map((report) => <ReportCardRow key={report.id} report={report} />)}</div>
    </>
  );
}
