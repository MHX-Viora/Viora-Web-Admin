import type { AdminReport } from '../../types/admin-report';
import { ReportCardRow, ReportRow } from './ReportRow';

export function ReportTable({ reports }: { reports: AdminReport[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table report-table">
          <thead>
            <tr>
              <th>Người báo cáo</th>
              <th>Đối tượng bị báo cáo</th>
              <th>Lý do</th>
              <th className="optional-tablet">Mô tả</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>{reports.map((report) => <ReportRow key={report.id} report={report} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{reports.map((report) => <ReportCardRow key={report.id} report={report} />)}</div>
    </>
  );
}
