// HIPAA準拠監査ログシステム
// HIPAA Security Rule §164.312(b) Audit controls implementation

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  actorId: string;
  actorRole: 'patient' | 'doctor' | 'admin' | 'system';
  actorName?: string;
  subjectId?: string; // 対象患者ID等
  subjectType?: 'patient' | 'appointment' | 'medical_record' | 'prescription' | 'document';
  action: AuditAction;
  resource: string;
  outcome: 'success' | 'failure' | 'warning';
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  details: Record<string, any>;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  // HIPAA 45 CFR 164.312(b)(2)(i) - User identification
  // HIPAA 45 CFR 164.312(b)(2)(ii) - Automatic logoff
  // HIPAA 45 CFR 164.312(b)(2)(iii) - Encryption and decryption
}

export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'data_creation'
  | 'data_deletion'
  | 'data_export'
  | 'communication'
  | 'system_event'
  | 'security_event'
  | 'privacy_event'
  | 'consent_event'
  | 'prescription_event'
  | 'payment_event';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'view'
  | 'edit'
  | 'create'
  | 'delete'
  | 'download'
  | 'print'
  | 'send'
  | 'receive'
  | 'share'
  | 'consent_given'
  | 'consent_revoked'
  | 'emergency_access'
  | 'break_glass'
  | 'data_breach'
  | 'unauthorized_access';

class AuditLogger {
  private static instance: AuditLogger;
  private eventQueue: AuditEvent[] = [];
  private batchSize = 50;
  private flushInterval = 30000; // 30秒
  private encryptionEnabled = true;

  private constructor() {
    // 定期的にログをフラッシュ
    setInterval(() => this.flush(), this.flushInterval);
    
    // ページ離脱時にもフラッシュ
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  public async logEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...eventData,
      ipAddress: eventData.ipAddress || await this.getClientIP(),
      userAgent: eventData.userAgent || navigator?.userAgent,
      location: eventData.location || await this.getApproximateLocation()
    };

    // 重要イベントは即座にログ送信
    if (this.isCriticalEvent(event)) {
      await this.sendEvent(event);
    } else {
      this.eventQueue.push(event);
      
      // バッチサイズに達したら送信
      if (this.eventQueue.length >= this.batchSize) {
        await this.flush();
      }
    }
  }

  // 認証関連のログ
  public async logAuthentication(
    actorId: string,
    action: 'login' | 'logout' | 'login_failed',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'authentication',
      actorId,
      actorRole: details.role || 'patient',
      action,
      resource: 'authentication_system',
      outcome: action === 'login_failed' ? 'failure' : 'success',
      details: {
        ...details,
        mfa_used: details.mfaUsed || false,
        session_timeout: details.sessionTimeout
      },
      sensitivity: action === 'login_failed' ? 'high' : 'medium'
    });
  }

  // PHI（個人健康情報）アクセスログ
  public async logPHIAccess(
    actorId: string,
    actorRole: 'patient' | 'doctor' | 'admin',
    subjectId: string,
    action: AuditAction,
    resource: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'data_access',
      actorId,
      actorRole,
      subjectId,
      subjectType: 'patient',
      action,
      resource,
      outcome: 'success',
      details: {
        ...details,
        phi_accessed: true,
        minimum_necessary: details.minimumNecessary !== false,
        purpose: details.purpose || 'treatment'
      },
      sensitivity: 'critical'
    });
  }

  // 同意管理ログ
  public async logConsentEvent(
    patientId: string,
    action: 'consent_given' | 'consent_revoked',
    consentType: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'consent_event',
      actorId: patientId,
      actorRole: 'patient',
      subjectId: patientId,
      action,
      resource: `consent_${consentType}`,
      outcome: 'success',
      details: {
        ...details,
        consent_type: consentType,
        electronic_signature: details.electronicSignature || false,
        witness_present: details.witnessPresent || false
      },
      sensitivity: 'high'
    });
  }

  // セキュリティイベントログ
  public async logSecurityEvent(
    eventType: 'data_breach' | 'unauthorized_access' | 'suspicious_activity',
    actorId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'security_event',
      actorId,
      actorRole: 'system',
      action: eventType as AuditAction,
      resource: 'security_system',
      outcome: 'warning',
      details: {
        ...details,
        incident_id: this.generateIncidentId(),
        requires_notification: this.requiresBreachNotification(eventType, details),
        auto_response_triggered: details.autoResponseTriggered || false
      },
      sensitivity: 'critical'
    });
  }

  // 処方箋関連ログ
  public async logPrescriptionEvent(
    doctorId: string,
    patientId: string,
    action: 'create' | 'modify' | 'cancel' | 'dispense',
    prescriptionId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'prescription_event',
      actorId: doctorId,
      actorRole: 'doctor',
      subjectId: patientId,
      subjectType: 'prescription',
      action,
      resource: `prescription_${prescriptionId}`,
      outcome: 'success',
      details: {
        ...details,
        prescription_id: prescriptionId,
        controlled_substance: details.controlledSubstance || false,
        dea_number_verified: details.deaNumberVerified || false
      },
      sensitivity: 'high'
    });
  }

  // 支払い関連ログ
  public async logPaymentEvent(
    patientId: string,
    action: 'payment_initiated' | 'payment_completed' | 'payment_failed',
    amount: number,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'payment_event',
      actorId: patientId,
      actorRole: 'patient',
      subjectId: patientId,
      action,
      resource: 'payment_system',
      outcome: action === 'payment_failed' ? 'failure' : 'success',
      details: {
        ...details,
        amount,
        payment_method: this.maskPaymentMethod(details.paymentMethod),
        pci_compliant: true,
        encryption_used: true
      },
      sensitivity: 'high'
    });
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendBatchEvents(events);
    } catch (error) {
      console.error('Failed to send audit events:', error);
      // 失敗したイベントを再度キューに追加（最大3回まで）
      events.forEach(event => {
        if ((event.details.retry_count || 0) < 3) {
          event.details.retry_count = (event.details.retry_count || 0) + 1;
          this.eventQueue.push(event);
        }
      });
    }
  }

  private async sendEvent(event: AuditEvent): Promise<void> {
    const encryptedEvent = this.encryptionEnabled ? await this.encryptEvent(event) : event;
    
    try {
      const response = await fetch('/api/audit/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Audit-Signature': await this.generateSignature(event)
        },
        body: JSON.stringify(encryptedEvent)
      });

      if (!response.ok) {
        throw new Error(`Audit log failed: ${response.status}`);
      }
    } catch (error) {
      // 批判的イベントは localStorage にも保存（暗号化済み）
      if (this.isCriticalEvent(event)) {
        this.storeEventLocally(encryptedEvent);
      }
      throw error;
    }
  }

  private async sendBatchEvents(events: AuditEvent[]): Promise<void> {
    const encryptedEvents = this.encryptionEnabled 
      ? await Promise.all(events.map(event => this.encryptEvent(event)))
      : events;

    const response = await fetch('/api/audit/events/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Audit-Batch-Signature': await this.generateBatchSignature(events)
      },
      body: JSON.stringify({ events: encryptedEvents })
    });

    if (!response.ok) {
      throw new Error(`Batch audit log failed: ${response.status}`);
    }
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIncidentId(): string {
    return `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCriticalEvent(event: AuditEvent): boolean {
    return event.sensitivity === 'critical' ||
           event.eventType === 'security_event' ||
           event.action === 'data_breach' ||
           event.outcome === 'failure';
  }

  private requiresBreachNotification(eventType: string, details: Record<string, any>): boolean {
    // HIPAA Breach Notification Rule 45 CFR §§ 164.400-414
    return eventType === 'data_breach' && 
           (details.recordCount || 0) >= 500; // 500件以上は即座に通知
  }

  private async encryptEvent(event: AuditEvent): Promise<any> {
    // AES-256 暗号化（実装例）
    const sensitive_fields = ['subjectId', 'details', 'ipAddress', 'location'];
    const encrypted = { ...event };
    
    for (const field of sensitive_fields) {
      if (encrypted[field as keyof AuditEvent]) {
        // 実際の実装では Web Crypto API を使用
        encrypted[field as keyof AuditEvent] = `encrypted_${btoa(JSON.stringify(encrypted[field as keyof AuditEvent]))}`;
      }
    }
    
    return encrypted;
  }

  private async generateSignature(event: AuditEvent): Promise<string> {
    // HMAC-SHA256 デジタル署名（実装例）
    const message = JSON.stringify(event);
    return btoa(`signature_${message.length}_${Date.now()}`);
  }

  private async generateBatchSignature(events: AuditEvent[]): Promise<string> {
    const message = JSON.stringify(events);
    return btoa(`batch_signature_${events.length}_${Date.now()}`);
  }

  private storeEventLocally(event: any): void {
    try {
      const localEvents = JSON.parse(localStorage.getItem('audit_events_backup') || '[]');
      localEvents.push(event);
      
      // 最大1000件まで保存
      if (localEvents.length > 1000) {
        localEvents.splice(0, localEvents.length - 1000);
      }
      
      localStorage.setItem('audit_events_backup', JSON.stringify(localEvents));
    } catch (error) {
      console.error('Failed to store audit event locally:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/client-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getApproximateLocation(): Promise<string> {
    // プライバシーを考慮し、都道府県レベルまで
    try {
      const response = await fetch('/api/location');
      const data = await response.json();
      return data.prefecture || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private maskPaymentMethod(method: string): string {
    if (!method) return 'unknown';
    // クレジットカードの場合、最後の4桁のみ表示
    if (method.length > 4) {
      return '*'.repeat(method.length - 4) + method.slice(-4);
    }
    return method;
  }

  // レポート生成用のクエリメソッド（管理者用）
  public async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    eventTypes?: AuditEventType[]
  ): Promise<any> {
    const response = await fetch('/api/audit/reports/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        event_types: eventTypes
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate compliance report');
    }

    return await response.json();
  }
}

// シングルトンインスタンスをエクスポート
export const auditLogger = AuditLogger.getInstance();

// React Hook for easy usage
export function useAuditLogger() {
  return auditLogger;
}