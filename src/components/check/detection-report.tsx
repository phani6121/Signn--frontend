'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DetectionResult } from '@/app/actions';

export function DetectionReport({ report }: { report?: DetectionResult | null }) {
  if (!report) {
    return (
      <div className="w-full max-w-lg">
        <Alert>
          <AlertDescription>No detection report available yet.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'red':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'orange':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'green':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'red':
        return 'CRITICAL - Action Required';
      case 'orange':
        return 'WARNING - Caution Advised';
      case 'green':
        return 'OK - All Clear';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'red':
        return 'bg-red-500/10 border-red-500/20';
      case 'orange':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'green':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const getDetectionStatusBadge = (detection: any) => {
    if (detection.status === 'critical') {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (detection.status === 'warning') {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Warning
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Normal
        </Badge>
      );
    }
  };

  const detections = report.detections ?? {};
  const recommendations = report.recommendations ?? [];

  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Main Status Alert */}
      <Card className={`border-2 ${getStatusBgColor(report.overall_status)}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(report.overall_status)}
            <div>
              <CardTitle className="text-xl">{getStatusLabel(report.overall_status)}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.action_message && (
            <p className="text-sm font-medium">{report.action_message}</p>
          )}
        </CardContent>
      </Card>

      {/* Detections Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health & Impairment Signals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(detections).map(([impairmentName, detection]) => (
            <div
              key={impairmentName}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium capitalize">{impairmentName.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">{detection.details}</p>
              </div>
              <div className="flex items-center gap-2">
                {detection.detected ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {getDetectionStatusBadge(detection)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm flex gap-2">
                  <span className="text-primary font-bold">*</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Check ID for reference */}
      <div className="text-center text-xs text-muted-foreground p-2 bg-muted rounded">
        Check ID: {report.check_id}
      </div>
    </div>
  );
}
