import { Component } from '@angular/core';
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
export class AppComponent {}
