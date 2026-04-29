export type Status = 'green' | 'yellow' | 'red' | 'none';

export interface DayEntry {
  gym: Status;
  diet: Status;
  sleep: Status;
}

export type Category = 'gym' | 'diet' | 'sleep';
