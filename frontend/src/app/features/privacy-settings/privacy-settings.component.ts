import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PrivacyService, ActiveSession, SecurityEventLog } from '../../core/services/privacy.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen w-full relative p-4 sm:p-6 lg:p-8 overflow-y-auto text-slate-200">
      
      <!-- Immersive Background Aurora Blobs -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div class="bg-grid"></div>
        <div class="aurora-blob top-1/4 left-10"></div>
        <div class="aurora-blob-2 bottom-1/4 right-10"></div>
      </div>

      <!-- Main Layout Container -->
      <div class="max-w-6xl mx-auto relative z-10 space-y-8 animate-fade-in py-8">
        
        <!-- Header Page Title -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-6">
          <div class="space-y-1.5">
            <span class="text-xs font-black bg-brand-500/10 border border-brand-500/20 text-brand-300 px-3 py-1 rounded-full uppercase tracking-widest">
              DPDP Act & Security Controls
            </span>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Security & Privacy Control Center</h1>
            <p class="text-slate-400 text-xs sm:text-sm font-semibold">
              Manage your active sessions, responsible disclosure, personal security events, and data principal rights.
            </p>
          </div>
          
          <button (click)="goBack()" class="btn-ghost text-xs font-black uppercase tracking-wider self-start sm:self-center">
            ➔ Go to Dashboard
          </button>
        </div>

        <!-- Glassmorphism Tab Layout Container -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT COL: Tab navigation bar -->
          <div class="lg:col-span-3 space-y-2">
            <div class="flex flex-col p-1.5 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800/40">
              <button *ngFor="let tab of tabs" 
                      (click)="setActiveTab(tab.id)"
                      class="w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
                      [ngClass]="activeTab() === tab.id 
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/15' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'">
                <span class="mr-2">{{ tab.icon }}</span> {{ tab.label }}
              </button>
            </div>

            <!-- DPDP Notice badge -->
            <div class="p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl space-y-2">
              <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">DPDP Act Compliance</span>
              <p class="text-[10px] text-slate-500 leading-normal font-semibold">
                This system operates under Section 6 & 11 of the Digital Personal Data Protection Act, 2023. Evaluate and manage your personal data securely.
              </p>
            </div>
          </div>

          <!-- RIGHT COL: Tab active panel -->
          <div class="lg:col-span-9 bg-slate-950/20 backdrop-blur-sm border border-surface-border rounded-3xl p-6 sm:p-8 min-h-[480px]">
            
            <!-- LOADING STATE -->
            <div *ngIf="loading()" class="flex flex-col items-center justify-center min-h-[300px] gap-4">
              <div class="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <span class="font-mono text-xs text-slate-500 uppercase tracking-widest">Loading telemetry data...</span>
            </div>

            <!-- TABS INNER PANELS -->
            <div *ngIf="!loading()" class="tab-panel space-y-6">
              
              <!-- Tab 1: SESSIONS -->
              <div *ngIf="activeTab() === 'sessions'" class="space-y-6">
                <div class="space-y-1">
                  <h2 class="text-lg font-black text-white">Active Sessions</h2>
                  <p class="text-slate-400 text-xs font-semibold">Verify the device list logged into your feedback console. Revoke any unrecognized access logs.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div *ngFor="let s of sessions()" 
                       class="p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px]"
                       [ngClass]="s.isCurrent 
                         ? 'bg-slate-950/60 border-brand-500/30 shadow-[0_0_15px_rgba(99,102,241,0.08)]' 
                         : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/60'">
                    
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white flex items-center gap-1.5">
                          🖥️ {{ s.os }}
                        </span>
                        <span *ngIf="s.isCurrent" class="text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Current Session
                        </span>
                      </div>
                      
                      <div class="space-y-1 text-[11px] font-semibold text-slate-400">
                        <p><span class="text-slate-500 font-bold uppercase tracking-wider">Browser:</span> {{ s.browser }}</p>
                        <p><span class="text-slate-500 font-bold uppercase tracking-wider">IP Address:</span> {{ s.ipAddress }}</p>
                        <p><span class="text-slate-500 font-bold uppercase tracking-wider">Last Active:</span> {{ s.lastActive | date:'medium' }}</p>
                      </div>
                    </div>

                    <div *ngIf="!s.isCurrent" class="mt-4 pt-3 border-t border-slate-800/40 flex justify-end">
                      <button (click)="revokeSession(s.id)" class="px-3.5 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150">
                        Revoke Access
                      </button>
                    </div>
                  </div>
                </div>

                <div *ngIf="sessions().length === 0" class="p-8 text-center bg-slate-900/20 border border-slate-800/60 rounded-2xl text-slate-500 text-xs font-semibold">
                  No active session records found in history database logs.
                </div>
              </div>

              <!-- Tab 2: SECURITY LOGS -->
              <div *ngIf="activeTab() === 'logs'" class="space-y-6">
                <div class="space-y-1">
                  <h2 class="text-lg font-black text-white">Security History Feed</h2>
                  <p class="text-slate-400 text-xs font-semibold">A personal chronological log of security audits compiled for your account.</p>
                </div>

                <div class="relative pl-6 border-l border-slate-800 space-y-6 custom-scroll max-h-[500px] overflow-y-auto pr-2">
                  <div *ngFor="let log of logs()" class="relative">
                    
                    <!-- Bullet dot icon based on action type -->
                    <span class="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center text-[7px]"
                          [ngClass]="{
                            'bg-emerald-500': log.action.includes('SUCCESS') || log.action === 'CONSENT_GIVEN',
                            'bg-rose-500 animate-pulse': log.action.includes('FAILED') || log.action.includes('UNAUTHORIZED') || log.action === 'CONSENT_WITHDRAWN',
                            'bg-brand-500': log.action === 'DATA_EXPORTED' || log.action === 'PASSWORD_CHANGED',
                            'bg-slate-700': log.action === 'LOGOUT'
                          }">
                    </span>

                    <div class="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span class="text-[10px] font-mono font-black uppercase tracking-widest"
                              [ngClass]="{
                                'text-emerald-400': log.action.includes('SUCCESS') || log.action === 'CONSENT_GIVEN',
                                'text-rose-400': log.action.includes('FAILED') || log.action.includes('UNAUTHORIZED') || log.action === 'CONSENT_WITHDRAWN',
                                'text-indigo-400': log.action === 'DATA_EXPORTED' || log.action === 'PASSWORD_CHANGED',
                                'text-slate-400': log.action === 'LOGOUT'
                              }">
                          {{ log.action.replace('_', ' ') }}
                        </span>
                        <span class="text-[10px] font-semibold text-slate-500 font-mono">
                          {{ log.timestamp | date:'medium' }}
                        </span>
                      </div>

                      <div class="text-[11px] font-semibold text-slate-400 space-y-1">
                        <p><span class="text-slate-500 font-bold uppercase tracking-wider">Access Endpoint:</span> <span class="font-mono text-slate-300">{{ log.resource }}</span></p>
                        <p><span class="text-slate-500 font-bold uppercase tracking-wider">Hashed IP:</span> <span class="font-mono text-slate-300">{{ log.ipAddress }}</span></p>
                        <p *ngIf="log.metadata"><span class="text-slate-500 font-bold uppercase tracking-wider font-mono">Context:</span> <span class="text-slate-300">{{ getMetadataString(log.metadata) }}</span></p>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="logs().length === 0" class="p-8 text-center bg-slate-900/20 border border-slate-800/60 rounded-2xl text-slate-500 text-xs font-semibold">
                    No security events registered on your account profile.
                  </div>
                </div>
              </div>

              <!-- Tab 3: DATA RIGHTS -->
              <div *ngIf="activeTab() === 'dpdp'" class="space-y-8 animate-fade-in">
                
                <!-- Section 1: Profile Details Update (Right to Correction) -->
                <div class="space-y-4">
                  <div class="space-y-1">
                    <h2 class="text-lg font-black text-white">Right to Correction (Section 12)</h2>
                    <p class="text-slate-400 text-xs font-semibold">Update or correct inaccurate fields stored in your institutional profile.</p>
                  </div>

                  <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()" class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div class="space-y-1">
                      <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400">FullName</label>
                      <input formControlName="name" type="text" class="input-field h-11 text-xs" placeholder="Full Name" />
                      <p *ngIf="profileForm.get('name')?.touched && profileForm.get('name')?.invalid" class="text-[10px] text-rose-400 font-bold font-mono">
                        Name is required.
                      </p>
                    </div>
                    <div class="space-y-1">
                      <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Phone (Optional)</label>
                      <input formControlName="phone" type="tel" class="input-field h-11 text-xs" placeholder="10-digit Phone" />
                      <p *ngIf="profileForm.get('phone')?.touched && profileForm.get('phone')?.invalid" class="text-[10px] text-rose-400 font-bold font-mono">
                        Enter a valid 10-digit number.
                      </p>
                    </div>
                    <div class="sm:col-span-2 pt-2">
                      <button type="submit" class="btn-primary py-2.5 text-xs font-black uppercase tracking-wider" [disabled]="profileForm.invalid || profileLoading()">
                        {{ profileLoading() ? 'Updating...' : 'Save Corrections' }}
                      </button>
                    </div>
                  </form>
                </div>

                <div class="h-px bg-slate-800/40"></div>

                <!-- Section 2: Data Portability Export -->
                <div class="space-y-4">
                  <div class="space-y-1">
                    <h2 class="text-lg font-black text-white">Right to Data Portability (Section 11)</h2>
                    <p class="text-slate-400 text-xs font-semibold">Request and download a structured JSON backup of all personal profiles, consent statements, and analytical scores.</p>
                  </div>

                  <div class="p-4 bg-slate-900/10 border border-slate-850 rounded-2xl max-w-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div class="space-y-1 max-w-md">
                      <span class="text-[9px] font-black text-brand-400 uppercase tracking-widest block">Requires Sudo mode</span>
                      <p class="text-[10px] text-slate-500 leading-normal font-semibold">Downloads raw JSON directly to your machine. Contains profiles, device session ids, and registered evaluations.</p>
                    </div>
                    <button (click)="triggerExport()" class="btn-primary text-xs font-black uppercase tracking-wider flex-shrink-0 self-start sm:self-center">
                      Download JSON
                    </button>
                  </div>
                </div>

                <div class="h-px bg-slate-800/40"></div>

                <!-- Section 3: Data Erasure & Deactivation -->
                <div class="space-y-4">
                  <div class="space-y-1">
                    <h2 class="text-lg font-black text-white text-rose-400">Right to Erasure (Section 12)</h2>
                    <p class="text-slate-400 text-xs font-semibold">Withdraw your presence from the feedback platform. Instantly deletes credentials, logs out, anonymizes records, and cascades link evaluations.</p>
                  </div>

                  <div class="p-5 bg-rose-950/10 border border-rose-900/20 rounded-2xl max-w-xl space-y-4">
                    <div class="space-y-1">
                      <span class="text-[9px] font-black text-rose-400 uppercase tracking-widest block">⚠️ WARNING: Permanent Action</span>
                      <p class="text-[10px] text-slate-500 leading-normal font-semibold">
                        This action will immediately scrub your database details and invalidate active session tokens. Evaluating sheets are anonymized for administrative evaluation criteria. This is non-reversible.
                      </p>
                    </div>
                    <button (click)="triggerErasure()" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                      Erase My Account
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tab 4: CONSENTS -->
              <div *ngIf="activeTab() === 'consent'" class="space-y-6">
                <div class="space-y-1">
                  <h2 class="text-lg font-black text-white">Privacy Consent Manager (Section 6)</h2>
                  <p class="text-slate-400 text-xs font-semibold">Review and revoke permission consents granted to the institutional evaluation software.</p>
                </div>

                <div class="space-y-4 max-w-xl">
                  <div class="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl flex items-center justify-between gap-6">
                    <div class="space-y-1">
                      <h4 class="text-sm font-bold text-white">Basic Data Processing</h4>
                      <p class="text-[10px] text-slate-500 leading-normal font-semibold">
                        Required to verify rolls, match assignments, check authentication logs, and record consent metrics.
                      </p>
                    </div>
                    <!-- Hardlocked to enabled as it is required for portal presence -->
                    <span class="text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider">
                      Enforced
                    </span>
                  </div>

                  <!-- Optional consents toggles -->
                  <div *ngFor="let c of consents()" 
                       class="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl flex items-center justify-between gap-6 hover:border-slate-700 transition-colors">
                    <div class="space-y-1">
                      <h4 class="text-sm font-bold text-white">{{ c.label }}</h4>
                      <p class="text-[10px] text-slate-500 leading-normal font-semibold">{{ c.description }}</p>
                    </div>
                    
                    <button (click)="toggleConsent(c.type, c.value)" 
                            class="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                            [ngClass]="c.value 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'">
                      {{ c.value ? 'Granted ✓' : 'Withdraw ✗' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tab 5: GRIEVANCES -->
              <div *ngIf="activeTab() === 'grievance'" class="space-y-6 animate-fade-in">
                <div class="space-y-1">
                  <h2 class="text-lg font-black text-white">Grievance & DPO Redressal</h2>
                  <p class="text-slate-400 text-xs font-semibold">Access the grievance officer contact and resolve disputes under India's DPDP Act, 2023.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                  
                  <!-- DPO card -->
                  <div class="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4">
                    <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Grievance Redressal Officer</span>
                    
                    <div class="space-y-2 text-xs font-semibold text-slate-300 leading-relaxed">
                      <p class="text-white font-extrabold text-sm">Dr. A. K. Shukla</p>
                      <p class="text-slate-400">Data Protection Officer (DPO)</p>
                      <p class="text-slate-500 font-mono text-[11px] mt-2">🏢 IIIT Ranchi, Academic Blocks, Namkum, Jharkhand</p>
                      <p class="text-slate-500 font-mono text-[11px]">✉️ <a href="mailto:dpo&#64;iiitranchi.ac.in" class="text-brand-400 hover:underline">dpo&#64;iiitranchi.ac.in</a></p>
                      <p class="text-slate-500 font-mono text-[11px]">⏱️ Response Limit: 30 Days (DPDP Mandated)</p>
                    </div>
                  </div>

                  <!-- Rights summary -->
                  <div class="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3">
                    <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Your Rights as Data Principal</span>
                    
                    <ul class="space-y-2 text-[11px] font-semibold text-slate-400 list-disc list-inside leading-snug">
                      <li>Right to access personal records summary</li>
                      <li>Right to correct outdated user credentials</li>
                      <li>Right to erase stored accounts / anonymize feedback</li>
                      <li>Right to withdraw processing consent dynamically</li>
                      <li>Right to nominate representatives for account custody</li>
                    </ul>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- SUDO MODE RE-AUTHENTICATION MODAL OVERLAY (Google/GitHub standard) -->
      <div *ngIf="showSudoModal()" 
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        
        <div class="w-full max-w-md bg-slate-900 border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-2xl animate-scale-in text-center">
          
          <div class="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>

          <div class="space-y-2">
            <h3 class="text-base font-black text-white">Sudo Mode Verification</h3>
            <p class="text-xs text-slate-400 leading-normal font-semibold max-w-xs mx-auto">
              You are attempting a sensitive security operation. Please re-enter your password to unlock access for 5 minutes.
            </p>
          </div>

          <form [formGroup]="sudoForm" (ngSubmit)="onConfirmSudo()" class="space-y-4">
            <div class="input-group relative text-left">
              <input formControlName="password" [type]="showSudoPassword() ? 'text' : 'password'" placeholder="Enter password"
                     class="w-full h-11 px-4 rounded-xl text-xs outline-none bg-slate-950 border border-slate-800 text-white" />
              <button type="button" (click)="toggleSudoPassword()"
                      class="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors text-[9px] font-extrabold uppercase tracking-wider">
                {{ showSudoPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p *ngIf="sudoForm.get('password')?.touched && sudoForm.get('password')?.invalid" class="text-[10px] text-rose-400 font-bold text-left font-mono">
              Password is required.
            </p>

            <div *ngIf="sudoError()" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-semibold">
              {{ sudoError() }}
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" (click)="cancelSudo()" class="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider">
                Cancel
              </button>
              <button type="submit" class="flex-1 btn-primary py-2.5 text-xs font-black uppercase tracking-wider" [disabled]="sudoForm.invalid || sudoLoading()">
                {{ sudoLoading() ? 'Verifying...' : 'Verify Sudo' }}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #020617;
      padding-top: 4rem;
    }
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, #1e293b 1.5px, transparent 1.5px),
                        linear-gradient(to bottom, #1e293b 1.5px, transparent 1.5px);
      background-size: 4rem 4rem;
      mask-image: radial-gradient(circle at center, black 15%, transparent 85%);
      pointer-events: none;
      opacity: 0.15;
    }
    .aurora-blob {
      position: absolute;
      width: 40vw;
      height: 40vw;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
      filter: blur(80px);
      border-radius: 50%;
      pointer-events: none;
    }
    .aurora-blob-2 {
      position: absolute;
      width: 35vw;
      height: 35vw;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%);
      filter: blur(80px);
      border-radius: 50%;
      pointer-events: none;
    }
  `]
})
export class PrivacySettingsComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private privacyService = inject(PrivacyService);
  private authService    = inject(AuthService);
  private toastr         = inject(ToastrService);
  private router         = inject(Router);

  // States
  activeTab      = signal<string>('sessions');
  loading        = signal<boolean>(true);
  profileLoading = signal<boolean>(false);
  
  // Sudo Overlay controls
  showSudoModal  = signal<boolean>(false);
  sudoLoading    = signal<boolean>(false);
  sudoError      = signal<string>('');
  showSudoPassword = signal<boolean>(false);
  pendingAction  = signal<string | null>(null);

  // Models signals
  sessions       = signal<ActiveSession[]>([]);
  logs           = signal<SecurityEventLog[]>([]);
  consents       = signal<Array<{ type: string; label: string; description: string; value: boolean }>>([]);

  // Forms
  profileForm!: FormGroup;
  sudoForm!: FormGroup;

  tabs = [
    { id: 'sessions',  label: 'Active Devices',      icon: '🖥️' },
    { id: 'logs',      label: 'Security Logs',       icon: '📜' },
    { id: 'dpdp',      label: 'DPDP Data Rights',    icon: '🛡️' },
    { id: 'consent',   label: 'Consent Manager',     icon: '✅' },
    { id: 'grievance', label: 'Grievance Redressal', icon: '📬' }
  ];

  ngOnInit() {
    this.initForms();
    this.loadData();
  }

  private initForms() {
    const user = this.authService.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]]
    });

    this.sudoForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  private loadData() {
    this.loading.set(true);
    // Fetch Active Sessions, Security Logs, and Consents concurrently
    this.privacyService.getActiveSessions().subscribe({
      next: (res) => {
        this.sessions.set(res.data.sessions);
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load session monitors.');
        this.loading.set(false);
      }
    });

    this.privacyService.getSecurityEvents().subscribe({
      next: (res) => this.logs.set(res.data.logs),
      error: () => console.error('Failed to fetch security logs feed.')
    });

    this.privacyService.getConsentStatus().subscribe({
      next: (res) => {
        const consentData = res.data.consents || [];
        
        const list = [
          {
            type: 'feedback_anonymity',
            label: 'Double Anonymization Consent',
            description: 'Allows system to separate student details from ratings sheets for evaluation processing.',
            value: consentData.some((c: any) => c.consentType === 'feedback_anonymity' && c.consentGiven)
          },
          {
            type: 'analytics',
            label: 'AI Sentiment Analytics Consent',
            description: 'Enables analysis of feedback text comments using neural networks to draw sentiment charts.',
            value: consentData.some((c: any) => c.consentType === 'analytics' && c.consentGiven)
          }
        ];
        this.consents.set(list);
      },
      error: () => console.error('Failed to fetch consent registry.')
    });
  }

  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  goBack() {
    this.authService.redirectByRole();
  }

  // ============================================================
  // SESSION REVOCATION
  // ============================================================
  revokeSession(sessionId: string) {
    this.privacyService.revokeSession(sessionId).subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'Session terminated successfully.');
        this.sessions.update(arr => arr.filter(s => s.id !== sessionId));
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to revoke session.');
      }
    });
  }

  // ============================================================
  // RIGHT TO CORRECTION
  // ============================================================
  onUpdateProfile() {
    if (this.profileForm.invalid) return;
    this.profileLoading.set(true);

    const payload = this.profileForm.value;
    this.privacyService.updateMyData(payload).subscribe({
      next: (res) => {
        this.toastr.success('Profile corrected successfully under Section 12.');
        this.profileLoading.set(false);

        // Update AuthService active user state
        const updatedUser = { 
          ...this.authService.currentUser()!, 
          name: payload.name 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Force refresh user signal (by doing handleAuthSuccess update)
        this.authService.handleAuthSuccess({ data: { user: updatedUser } });
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to update profile.');
        this.profileLoading.set(false);
      }
    });
  }

  // ============================================================
  // CONSENT MANAGEMENT
  // ============================================================
  toggleConsent(type: string, currentValue: boolean) {
    if (!currentValue) {
      // Grant consent
      this.privacyService.giveConsent(type, true).subscribe({
        next: () => {
          this.toastr.success('Consent granted successfully under Section 6.');
          this.consents.update(arr => arr.map(c => c.type === type ? { ...c, value: true } : c));
        },
        error: (err) => this.toastr.error(err.error?.message || 'Failed to grant consent.')
      });
    } else {
      // Withdraw consent (Section 6 right of withdrawal)
      this.privacyService.withdrawConsent().subscribe({
        next: () => {
          this.toastr.warning('Consent withdrawn successfully.');
          this.consents.update(arr => arr.map(c => c.type === type ? { ...c, value: false } : c));
        },
        error: (err) => this.toastr.error(err.error?.message || 'Failed to withdraw consent.')
      });
    }
  }

  // ============================================================
  // SUDO MODE INTERCEPT ACTIONS
  // ============================================================
  triggerExport() {
    this.pendingAction.set('export');
    this.executeSecureAction();
  }

  triggerErasure() {
    this.pendingAction.set('erasure');
    this.executeSecureAction();
  }

  private executeSecureAction() {
    const action = this.pendingAction();
    if (!action) return;

    if (action === 'export') {
      this.privacyService.exportMyData().subscribe({
        next: (res) => this.downloadJSON(res),
        error: (err) => {
          if (err.status === 403 && err.error?.sudoRequired) {
            this.openSudoModal();
          } else {
            this.toastr.error(err.error?.message || 'Export failed.');
          }
        }
      });
    } else if (action === 'erasure') {
      this.privacyService.eraseMyData().subscribe({
        next: (res) => this.handleAccountErased(res),
        error: (err) => {
          if (err.status === 403 && err.error?.sudoRequired) {
            this.openSudoModal();
          } else {
            this.toastr.error(err.error?.message || 'Erasure failed.');
          }
        }
      });
    }
  }

  private openSudoModal() {
    this.sudoForm.reset();
    this.sudoError.set('');
    this.showSudoPassword.set(false);
    this.showSudoModal.set(true);
  }

  cancelSudo() {
    this.showSudoModal.set(false);
    this.pendingAction.set(null);
  }

  toggleSudoPassword() {
    this.showSudoPassword.update(v => !v);
  }

  onConfirmSudo() {
    if (this.sudoForm.invalid) return;
    this.sudoLoading.set(true);
    this.sudoError.set('');

    const password = this.sudoForm.value.password;
    this.privacyService.enterSudoMode(password).subscribe({
      next: () => {
        this.toastr.success('Sudo mode unlocked.');
        this.showSudoModal.set(false);
        this.sudoLoading.set(false);
        // Automatically retry the pending action
        this.executeSecureAction();
      },
      error: (err) => {
        this.sudoError.set(err.error?.message || 'Incorrect password.');
        this.sudoLoading.set(false);
      }
    });
  }

  private downloadJSON(data: any) {
    this.toastr.success('Data exported successfully.');
    this.pendingAction.set(null);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iiitr_personal_data_export_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private handleAccountErased(res: any) {
    this.toastr.success(res.message || 'Account successfully anonymized and deleted.');
    this.pendingAction.set(null);
    // Erase local state and route to login
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getMetadataString(meta: any): string {
    if (!meta) return '';
    if (typeof meta === 'string') return meta;
    return Object.entries(meta)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
}
