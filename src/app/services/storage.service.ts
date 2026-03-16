import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  get<T>(key: string): T {
    const raw = localStorage.getItem(key);
    if (raw == null) return [] as unknown as T;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return [] as unknown as T;
    }
  }
}
