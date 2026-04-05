export interface QuantityDTO {
  value: number;
  unit: string;
  measurementType: MeasurementType;
}

export interface QuantityInputDTO {
  thisQuantityDTO: QuantityDTO;
  thatQuantityDTO: QuantityDTO;
  targetQuantityDTO?: QuantityDTO;
}

export interface QuantityMeasurementDTO {
  thisValue?: number;
  thisUnit?: string;
  thatValue?: number;
  thatUnit?: string;
  operation?: string;
  resultValue?: number | boolean;
  resultUnit?: string;
  resultString?: string;
  resultMeasurementType?: string;
  error?: boolean;
  errorMessage?: string;
}

export interface HistoryEntry {
  id?: number;
  type: string;
  action: string;
  value: string;
  note: string;
  ts: string;
}

export type MeasurementType = 'LengthUnit' | 'VolumeUnit' | 'WeightUnit' | 'TemperatureUnit';
export type ActionType = 'comparison' | 'conversion' | 'arithmetic';

export const MEASUREMENT_UNITS: Record<string, string[]> = {
  LengthUnit: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  VolumeUnit: ['LITER', 'MILLILITER', 'GALLON'],
  WeightUnit: ['MILLIGRAM', 'GRAM', 'KILOGRAM', 'POUND', 'TONNE'],
  TemperatureUnit: ['CELSIUS', 'FAHRENHEIT', 'KELVIN'],
};

export const MEASUREMENT_LABELS: Record<string, string> = {
  LengthUnit: 'Length',
  VolumeUnit: 'Volume',
  WeightUnit: 'Weight',
  TemperatureUnit: 'Temperature',
};
