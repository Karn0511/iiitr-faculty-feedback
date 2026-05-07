import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';

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
  async ngOnInit() {
    try {
      const { StatusBar, StatusBarStyle } = await import('@capacitor/status-bar');
      // Default to Dark Status Bar for our cyber dark mode platform
      await StatusBar.setStyle({ style: StatusBarStyle.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' }); // Deep slate surface color matching body background
    } catch (err) {
      // Gracefully bypass on web browser
    }
  }
}
