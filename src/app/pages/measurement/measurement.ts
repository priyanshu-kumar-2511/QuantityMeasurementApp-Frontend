import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MeasurementService } from '../../services/measurement';
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_LABELS,
  MeasurementType,
  ActionType,
  QuantityDTO,
  QuantityInputDTO,
} from '../../models/measurement';

interface HistoryItem {
  type: string;
  action: string;
  value: string;
  note: string;
  ts: string;
}

@Component({
  selector: 'app-measurement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './measurement.html',
  styleUrl: './measurement.css',
})
export class MeasurementComponent implements OnInit {
  selectedType: MeasurementType = 'LengthUnit';
  selectedAction: ActionType = 'comparison';

  valFrom = 1;
  valTo = 1;
  unitFrom = '';
  unitTo = '';

  arithA = 1;
  arithB = 1;
  arithUnitA = '';
  arithUnitB = '';
  arithUnitResult = '';
  arithOp: '+' | '-' | '*' | '/' = '+';

  resultValue = '';
  resultNote = '';
  showResult = false;

  loading = false;
  apiError = '';

  historyList: HistoryItem[] = [];

  types: MeasurementType[] = ['LengthUnit', 'VolumeUnit', 'WeightUnit', 'TemperatureUnit'];
  typeLabels = MEASUREMENT_LABELS;
  typeIcons: Record<string, string> = {
    LengthUnit: '📏', VolumeUnit: '🧴', WeightUnit: '⚖️', TemperatureUnit: '🌡️',
  };

  userName = '';

  constructor(
    private authService: AuthService,
    private measurementService: MeasurementService,
    public router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name?.split(' ')[0] || '';
    this.refreshUnits();
  }

  get currentUnits(): string[] {
    return MEASUREMENT_UNITS[this.selectedType] || [];
  }

  get isDualPanel(): boolean {
    return this.selectedAction !== 'arithmetic';
  }

  get actionButtonLabel(): string {
    return { comparison: 'Compare', conversion: 'Convert', arithmetic: 'Calculate' }[this.selectedAction];
  }

  selectType(type: MeasurementType): void {
    this.selectedType = type;
    this.refreshUnits();
    this.showResult = false;
  }

  selectAction(action: ActionType): void {
    this.selectedAction = action;
    this.showResult = false;
    if (action === 'conversion') this.valTo = 0;
  }

  refreshUnits(): void {
    const units = this.currentUnits;
    this.unitFrom = units[0] || '';
    this.unitTo = units[1] || units[0] || '';
    this.arithUnitA = units[0] || '';
    this.arithUnitB = units[1] || units[0] || '';
    this.arithUnitResult = units[0] || '';
    this.valFrom = 1;
    this.valTo = 1;
    this.arithA = 1;
    this.arithB = 1;
    this.showResult = false;
  }

  calculate(): void {
    this.showResult = false;
    this.apiError = '';
    this.loading = true;

    if (this.selectedAction === 'comparison') {
      this.doComparison();
    } else if (this.selectedAction === 'conversion') {
      this.doConversion();
    } else {
      this.doArithmetic();
    }
  }

  private doComparison(): void {
    const body: QuantityInputDTO = {
      thisQuantityDTO: { value: this.valFrom, unit: this.unitFrom, measurementType: this.selectedType },
      thatQuantityDTO: { value: this.valTo, unit: this.unitTo, measurementType: this.selectedType },
    };
    this.measurementService.compare(body).subscribe({
      next: (res: any) => {
        this.loading = false;
        // Backend now returns the EXACT relation '=', '<', or '>' in resultString
        const sym = res.resultString || '=';
        this.resultValue = `${this.valFrom} ${this.unitFrom} ${sym} ${this.valTo} ${this.unitTo}`;
        
        // Since we explicitly find the exact mathematical relation (=, <, >),
        // the generated statement (e.g. 1 FEET = 12 INCHES) is factually TRUE.
        this.resultNote = 'true';
        this.showResult = true;
        
        // Save 'sym' directly to history tracking
        this.addToHistory('comparison', this.resultValue, this.resultNote);
      },
      error: (err: any) => this.handleError(err),
    });
  }

  private doConversion(): void {
    const body: QuantityInputDTO = {
      thisQuantityDTO: { value: this.valFrom, unit: this.unitFrom, measurementType: this.selectedType },
      thatQuantityDTO: { value: 0, unit: this.unitTo, measurementType: this.selectedType },
    };
    this.measurementService.convert(body).subscribe({
      next: (res: any) => {
        this.loading = false;
        // Backend response fields: resultValue, resultUnit
        const converted = res.resultValue as number;
        const resultUnit = res.resultUnit || this.unitTo;
        this.valTo = converted;
        this.resultValue = `${this.fmt(converted)} ${resultUnit}`;
        this.resultNote = `${this.valFrom} ${this.unitFrom} = ${this.fmt(converted)} ${resultUnit}`;
        this.showResult = true;
        this.addToHistory('conversion', this.resultValue, this.resultNote);
      },
      error: (err: any) => this.handleError(err),
    });
  }

  private doArithmetic(): void {
    const thisQty: QuantityDTO = { value: this.arithA, unit: this.arithUnitA, measurementType: this.selectedType };
    const thatQty: QuantityDTO = { value: this.arithB, unit: this.arithUnitB, measurementType: this.selectedType };
    const targetQty: QuantityDTO = { value: 0, unit: this.arithUnitResult, measurementType: this.selectedType };
    const body: QuantityInputDTO = {
      thisQuantityDTO: thisQty,
      thatQuantityDTO: thatQty,
      targetQuantityDTO: targetQty,
    };

    const ops: Record<string, any> = {
      '+': () => this.measurementService.addWithTarget(body),
      '-': () => this.measurementService.subtract(body),
      '*': () => this.measurementService.multiply(body),
      '/': () => this.measurementService.divide(body),
    };

    ops[this.arithOp]().subscribe({
      next: (res: any) => {
        this.loading = false;
        // Backend response field: resultValue
        const result = res.resultValue as number;
        const resultUnit = res.resultUnit || this.arithUnitResult;
        const opDisplay = { '+': '+', '-': '-', '*': '×', '/': '÷' }[this.arithOp];
        this.resultValue = `${this.fmt(result)} ${resultUnit}`;
        this.resultNote = `(${this.arithA} ${this.arithUnitA}) ${opDisplay} (${this.arithB} ${this.arithUnitB}) = ${this.fmt(result)} ${resultUnit}`;
        this.showResult = true;
        this.addToHistory('arithmetic', this.resultValue, this.resultNote);
      },
      error: (err: any) => this.handleError(err),
    });
  }

  private handleError(err: any): void {
    this.loading = false;
    this.apiError = err?.error?.message || err?.error?.error || 'Something went wrong. Check backend connection.';
    this.showResult = false;
  }

  private addToHistory(action: string, value: string, note: string): void {
    this.historyList.unshift({
      type: MEASUREMENT_LABELS[this.selectedType],
      action,
      value,
      note,
      ts: new Date().toLocaleString(),
    });
    if (this.historyList.length > 50) this.historyList.pop();
  }

  clearHistory(): void {
    this.historyList = [];
  }

  logout(): void {
    this.authService.logout();
  }

  goToHistory(): void {
    this.router.navigate(['/history']);
  }

  fmt(n: number): string {
    if (!isFinite(n)) return String(n);
    if (Math.abs(n) > 0 && (Math.abs(n) < 0.0001 || Math.abs(n) > 1e9))
      return n.toExponential(4);
    return parseFloat(n.toPrecision(7)).toString();
  }
}