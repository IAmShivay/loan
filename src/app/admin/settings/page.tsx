'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useGetSettingsQuery, useUpdateSettingsMutation, useResetSettingsMutation } from '@/store/api/apiSlice';
import {
  Settings,
  Mail,
  Bell,
  Shield,
  Database,
  Globe,
  CreditCard,
  Users,
  FileText,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    maintenanceMode: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    emailEnabled: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
  };
  loan: {
    minLoanAmount: number;
    maxLoanAmount: number;
    defaultInterestRate: number;
    processingFee: number;
    autoApprovalLimit: number;
  };
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const { data: settingsData, isLoading, refetch } = useGetSettingsQuery();
  const [updateSettingsMutation] = useUpdateSettingsMutation();
  const [resetSettings] = useResetSettingsMutation();

  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Initialize settings from API data
  useEffect(() => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings);
    }
  }, [settingsData]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await updateSettingsMutation(settings).unwrap();
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const result = await resetSettings().unwrap();
      setSettings(result.settings);
      toast.success('Settings reset to default values');
    } catch (error) {
      toast.error('Failed to reset settings');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'loan', label: 'Loan Settings', icon: CreditCard },
  ];

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;

    setSettings(prev => prev ? ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }) : null);
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="lg:col-span-3">
            <div className="border rounded-lg p-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">System Settings</h1>
              <p className="text-blue-100 text-lg">Configure system-wide settings and preferences</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-800 text-white hover:bg-blue-900"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={settings.general.maxFileSize}
                      onChange={(e) => updateSettings('general', 'maxFileSize', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allowed File Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {settings.general.allowedFileTypes.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-600">
                      Enable to temporarily disable the system for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => updateSettings('general', 'maintenanceMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>SMTP settings for email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-600">Enable email functionality</p>
                  </div>
                  <Switch
                    checked={settings.email.emailEnabled}
                    onCheckedChange={(checked) => updateSettings('email', 'emailEnabled', checked)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.email.smtpHost}
                      onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={settings.email.smtpUser}
                      onChange={(e) => updateSettings('email', 'smtpUser', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.email.smtpPassword}
                      onChange={(e) => updateSettings('email', 'smtpPassword', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={settings.email.fromName}
                      onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'loan' && (
            <Card>
              <CardHeader>
                <CardTitle>Loan Configuration</CardTitle>
                <CardDescription>Loan processing settings and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLoanAmount">Minimum Loan Amount (₹)</Label>
                    <Input
                      id="minLoanAmount"
                      type="number"
                      value={settings.loan.minLoanAmount}
                      onChange={(e) => updateSettings('loan', 'minLoanAmount', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoanAmount">Maximum Loan Amount (₹)</Label>
                    <Input
                      id="maxLoanAmount"
                      type="number"
                      value={settings.loan.maxLoanAmount}
                      onChange={(e) => updateSettings('loan', 'maxLoanAmount', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultInterestRate">Default Interest Rate (%)</Label>
                    <Input
                      id="defaultInterestRate"
                      type="number"
                      step="0.1"
                      value={settings.loan.defaultInterestRate}
                      onChange={(e) => updateSettings('loan', 'defaultInterestRate', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processingFee">Processing Fee (₹)</Label>
                    <Input
                      id="processingFee"
                      type="number"
                      value={settings.loan.processingFee}
                      onChange={(e) => updateSettings('loan', 'processingFee', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoApprovalLimit">Auto Approval Limit (₹)</Label>
                  <Input
                    id="autoApprovalLimit"
                    type="number"
                    value={settings.loan.autoApprovalLimit}
                    onChange={(e) => updateSettings('loan', 'autoApprovalLimit', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-slate-600">
                    Applications below this amount will be automatically approved if all criteria are met
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
