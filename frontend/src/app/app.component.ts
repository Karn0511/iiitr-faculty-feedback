import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { ThemeService } from './core/services/theme.service';
import { injectSpeedInsights } from '@vercel/speed-insights';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SpinnerComponent],
  template: `
    <app-navbar />
    <app-spinner />
    <main class="min-h-screen bg-surface">
      <router-outlet />
    </main>
  `
})
export class AppComponent implements OnInit {
  // Inject ThemeService to trigger dark-mode enforcement at app startup
  private _theme = inject(ThemeService);

  constructor() {
    // Initialize Vercel Speed Insights telemetry
    injectSpeedInsights();
  }

  async ngOnInit() {
    try {
      const { StatusBar, StatusBarStyle } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: StatusBarStyle.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
    } catch (err) {
      // Gracefully bypass on web browser
    }
  }
}
