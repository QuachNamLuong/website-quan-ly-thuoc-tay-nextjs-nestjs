'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title={`Xin chào, ${user.fullName}`}
        description="Tổng quan hệ thống quản lý nhà thuốc"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vai trò</CardTitle>
            <CardDescription>Vai trò được gán cho tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            {user.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có vai trò</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quyền hiệu lực</CardTitle>
            <CardDescription>
              Tổng cộng {user.permissions.length} quyền
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
              {user.permissions.slice(0, 30).map((p) => (
                <Badge key={p} variant="outline" className="text-xs">
                  {p}
                </Badge>
              ))}
              {user.permissions.length > 30 && (
                <span className="text-xs text-muted-foreground self-center ml-2">
                  + {user.permissions.length - 30} quyền khác
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
