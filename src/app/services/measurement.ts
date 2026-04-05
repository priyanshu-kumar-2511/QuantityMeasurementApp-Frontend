import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuantityInputDTO, QuantityMeasurementDTO } from '../models/measurement';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  private base = `${environment.apiUrl}/api/user/quantities`;

  constructor(private http: HttpClient) {}

  compare(body: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/compare`, body);
  }

  convert(body: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/convert`, body);
  }

  add(body: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/add`, body);
  }

  addWithTarget(body: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/add-with-target-unit`, body);
  }

  subtract(body: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/subtract`, body);
  }

  multiply(body: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/multiply`, body);
  }

  divide(body: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/divide`, body);
  }

  getHistoryByOperation(operation: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/history/operation/${operation}`);
  }

  getHistoryByType(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/history/type/${type}`);
  }

  getOperationCount(operation: string): Observable<any> {
    return this.http.get<any>(`${this.base}/count/${operation}`);
  }

  deleteAllHistory(): Observable<any> {
    return this.http.delete(`${this.base}/history/all`, {
      responseType: 'text',
    });
  }

  deleteHistoryById(id: number): Observable<any> {
    return this.http.delete(`${this.base}/history/${id}`, {
      responseType: 'text',
    });
  }

  getErrorHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/history/errored`);
  }
}
