export type Status = 'green' | 'yellow' | 'red' | 'none';

export type FieldId = string;

export type DayEntry = Record<FieldId, Status>;

export interface DisciplinerField {
  id: string;
  label: string;
}

export interface Discipliner {
  id: string;
  name: string;
  fields: DisciplinerField[];
  isPreset: boolean;
  nameEditable: boolean;
  fieldsEditable: boolean;
}

export interface DisciplinerConfig {
  learningOverride?: {
    name?: string;
    fields?: DisciplinerField[];
  };
  custom: Discipliner[];
}
