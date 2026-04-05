import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MeasurementService } from '../../services/measurement';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  userName = '';
  stats: StatCard[] = [];
  loading = false;

  operations = ['COMPARE', 'CONVERT', 'ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'];
  opCounts: Record<string, number> = {};

  constructor(
    private authService: AuthService,
    private measurementService: MeasurementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getCurrentUser()?.name?.split(' ')[0] || '';
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    let completed = 0;

    this.operations.forEach((op) => {
      this.measurementService.getOperationCount(op).subscribe({
        next: (res) => {
          this.opCounts[op] = typeof res === 'number' ? res : res?.count ?? 0;
          completed++;
          if (completed === this.operations.length) {
            this.buildStats();
            this.loading = false;
          }
        },
        error: () => {
          this.opCounts[op] = 0;
          completed++;
          if (completed === this.operations.length) {
            this.buildStats();
            this.loading = false;
          }
        },
      });
    });
  }

  buildStats(): void {
    const total = Object.values(this.opCounts).reduce((a, b) => a + b, 0);
    this.stats = [
      { label: 'Total Operations', value: total, icon: '🔢', color: '#4361ee' },
      { label: 'Comparisons', value: this.opCounts['COMPARE'] || 0, icon: '⚖️', color: '#2ecf9c' },
      { label: 'Conversions', value: this.opCounts['CONVERT'] || 0, icon: '🔄', color: '#f4a261' },
      { label: 'Arithmetic', value: (this.opCounts['ADD'] || 0) + (this.opCounts['SUBTRACT'] || 0) + (this.opCounts['MULTIPLY'] || 0) + (this.opCounts['DIVIDE'] || 0), icon: '➕', color: '#c0392b' },
    ];
  }

  goTo(path: string): void {
    this.router.navigate(['/' + path]);
  }

  logout(): void {
    this.authService.logout();
  }

  getBarPct(op: string): number {
    const max = Math.max(...Object.values(this.opCounts), 1);
    return Math.round(((this.opCounts[op] || 0) / max) * 100);
  }
}

// add to class body — patch via str_replace below
