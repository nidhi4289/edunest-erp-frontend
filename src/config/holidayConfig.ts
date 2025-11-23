/**
 * Simple School Holiday Configuration
 * Like environment variables - will be moved to backend/master data eventually
 */

// Current year holidays - update as needed
export const SCHOOL_HOLIDAYS_2024 = [
  '2024-01-26', // Republic Day
  '2024-03-25', // Holi
  '2024-04-17', // Ram Navami
  '2024-05-01', // May Day
  '2024-08-15', // Independence Day
  '2024-08-26', // Janmashtami
  '2024-10-02', // Gandhi Jayanti
  '2024-11-01', // Diwali
  '2024-11-02', // Diwali Holiday
  '2024-12-25', // Christmas
];

export const SCHOOL_HOLIDAYS_2025 = [
  '2025-01-26', // Republic Day
  '2025-03-14', // Holi
  '2025-04-06', // Ram Navami
  '2025-04-14', // Baisakhi
  '2025-05-01', // May Day
  '2025-08-15', // Independence Day
  '2025-08-16', // Janmashtami
  '2025-10-02', // Gandhi Jayanti
  '2025-10-20', // Diwali
  '2025-10-21', // Diwali Holiday
  '2025-12-25', // Christmas
];

export const SCHOOL_HOLIDAYS_2026 = [
  '2026-01-26', // Republic Day
  '2026-03-03', // Holi
  '2026-03-26', // Ram Navami
  '2026-05-01', // May Day
  '2026-08-15', // Independence Day
  '2026-09-04', // Janmashtami
  '2026-10-02', // Gandhi Jayanti
  '2026-11-08', // Diwali
  '2026-11-09', // Diwali Holiday
  '2026-12-25', // Christmas
];

// Simple function to check if date is holiday
export const isHoliday = (date: string): boolean => {
  const year = new Date(date).getFullYear();
  
  switch (year) {
    case 2024:
      return SCHOOL_HOLIDAYS_2024.includes(date);
    case 2025:
      return SCHOOL_HOLIDAYS_2025.includes(date);
    case 2026:
      return SCHOOL_HOLIDAYS_2026.includes(date);
    default:
      return false;
  }
};

// Get holiday name (simple mapping)
export const getHolidayName = (date: string): string => {
  if (!isHoliday(date)) return '';
  
  // Simple name mapping based on date patterns
  if (date.endsWith('-01-26')) return 'Republic Day';
  if (date.endsWith('-08-15')) return 'Independence Day';
  if (date.endsWith('-10-02')) return 'Gandhi Jayanti';
  if (date.endsWith('-12-25')) return 'Christmas';
  if (date.endsWith('-05-01')) return 'May Day';
  
  // For other holidays, return generic name
  return 'School Holiday';
};