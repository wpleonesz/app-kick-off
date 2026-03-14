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
export type { Booking, BookingInput } from "./booking";
export { BOOKING_STATUS, getBookingStatusColor } from "./booking";
