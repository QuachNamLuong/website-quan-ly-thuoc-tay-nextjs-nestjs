'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/spinner';
import { useToast } from '@/components/common/toast';
import { permissionsApi } from '@/lib/api/resources';
import { ApiError } from '@/lib/api/client';
import type { Permission } from '@/lib/types';

export default function PermissionsPage() {
  const toast = useToast();
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await permissionsApi.grouped();
        setGrouped(data);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Danh sách quyền"
        description="Tất cả quyền hệ thống đã định nghĩa, được nhóm theo tài nguyên"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([resource, permissions]) => (
          <Card key={resource}>
            <CardHeader>
              <CardTitle className="text-base capitalize">
                {resource.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {permissions.map((p) => (
                  <Badge key={p.id} variant="outline" className="text-xs font-mono">
                    {p.action}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
