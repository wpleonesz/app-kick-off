/**
 * Exportaciones centralizadas de interfaces
 */
export type { User, Role, Access, AccessPermissions } from "./user";
export type { Court, CourtInput } from "./court";
export type {
  CourtSchedule,
  CourtScheduleInput,
  DAYS_OF_WEEK,
} from "./courtSchedule";
export { getDayName } from "./courtSchedule";
