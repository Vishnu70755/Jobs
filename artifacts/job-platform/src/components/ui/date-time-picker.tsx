import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDown, Calendar as CalendarIcon, Clock } from "lucide-react";
import { formatISTDatetime, formatIndianDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const IST = "Asia/Kolkata";

interface DateTimePickerProps {
  value: string | null; // ISO string (UTC)
  onChange: (value: string | null) => void;
  label?: string;
  minDate?: Date; // Minimum selectable date
  className?: string;
}

/**
 * DateTimePicker component that combines a calendar popup with time selection
 * Stores values in UTC but displays/interacts in IST
 */
export const DateTimePicker = React.forwardRef(
  (
    { value, onChange, label = "Date & Time", minDate, className = "" }: DateTimePickerProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [open, setOpen] = React.useState(false);
    const [dateValue, setDateValue] = React.useState<Date | null>(
      value ? new Date(value) : null
    );
    const [timeValue, setTimeValue] = React.useState<string>("00:00"); // HH:MM format

    // Initialize time value from the date if available
    React.useEffect(() => {
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // Convert UTC time to IST for display
          const istTimeString = date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: IST,
          });
          setTimeValue(istTimeString);
          setDateValue(date);
        }
      }
    }, [value]);

    // Validate if selected date/time is in the past (IST)
    const isPastSelection = React.useCallback(() => {
      if (!dateValue) return false; // timeValue is not needed for this check

      // Compare the stored UTC date with current UTC time
      return dateValue < new Date();
    }, [dateValue]);

    // Handle date selection from calendar
    const handleDateChange = (date: Date) => {
      setDateValue(date);
      // Keep the same time when date changes
      onDateOrTimeChange(date);
    };

    // Handle time change
    const handleTimeChange = (time: string) => {
      setTimeValue(time);
      onDateOrTimeChange(dateValue);
    };

    // Combined handler for date/time changes
    const onDateOrTimeChange = (date: Date | null) => {
      if (!date || !timeValue) {
        onChange(null);
        return;
      }

      const [hours, minutes] = timeValue.split(":").map(Number);

      // The date from Calendar is in UTC (midnight UTC of selected day)
      // But we want to interpret it as a local date (IST)
      // So we create a Date using the UTC year/month/day values but as local time
      const dateInLocal = new Date(
        date.getUTCFullYear(),   // Year from UTC date
        date.getUTCMonth(),      // Month from UTC date
        date.getUTCDate(),       // Day from UTC date
        parseInt(hours),         // Hours from time selection (IST)
        parseInt(minutes)        // Minutes from time selection (IST)
      );

      // Convert this local time (IST) to UTC for storage
      const utcDate = new Date(dateInLocal.toISOString());

      onChange(utcDate.toISOString());
    };

    // Handle clearing the value
    const handleClear = () => {
      setDateValue(null);
      setTimeValue("00:00");
      onChange(null);
    };

    // Format the display value in IST
    const formattedValue = value ? formatISTDatetime(value) : "--";

    return (
      <div ref={ref} className={className}>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <div className="relative">
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex h-4 items-center text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <Clock className="ml-2 w-4 h-4" />
            </div>
            <input
              type="text"
              value={formattedValue}
              readOnly
              className="pl-10 pr-3 py-2 block w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="mt-2 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen(!open)}
              disabled={!dateValue}
            >
              {dateValue ? (
                <CalendarIcon className="w-4 h-4" />
              ) : (
                <CalendarIcon className="w-4 h-4 opacity-50" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
              disabled={!dateValue && !timeValue}
            >
              <span className="sr-only">Clear</span>
            </Button>
          </div>

          {/* Popover for date/time selection */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="pointer-events-none" />
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4 space-y-4" sideOffset={4}>
              {/* Date selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <div className="relative">
                  <Calendar
                    selected={dateValue ?? undefined}
                    onSelect={handleDateChange}
                    disabled={false}
                    numberOfMonths={1}
                    // Prevent past dates
                    from={minDate ?? new Date()}
                    // Show today highlight
                    todayButton={{
                      label: "Today",
                      onClick: () => {
                        const today = new Date();
                        setDateValue(today);
                        onDateOrTimeChange(today);
                      },
                    }}
                  />
                </div>
              </div>

              {/* Time selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time (IST)</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={timeValue.split(":")[0] || "00"}
                    onChange={(e) => {
                      const hour = e.target.value.padStart(2, "0");
                      const minute = timeValue.split(":")[1] || "00";
                      setTimeValue(`${hour}:${minute}`);
                      onDateOrTimeChange(dateValue);
                    }}
                    className="block w-full rounded-md border border-input bg-background px-3 py-1 text-base text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {[...Array(24).keys()].map((h) => (
                      <option key={h} value={String(h).padStart(2, "0")}>
                        {String(h).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <select
                    value={timeValue.split(":")[1] || "00"}
                    onChange={(e) => {
                      const hour = timeValue.split(":")[0] || "00";
                      const minute = e.target.value.padStart(2, "0");
                      setTimeValue(`${hour}:${minute}`);
                      onDateOrTimeChange(dateValue);
                    }}
                    className="block w-full rounded-md border border-input bg-background px-3 py-1 text-base text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={String(m).padStart(2, "0")}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select time in IST (15-minute intervals)
                </p>
              </div>

              {/* Validation message */}
              {isPastSelection() && (
                <div className="text-sm text-destructive">
                  Cannot select a date/time in the past
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                  }}
                  disabled={!dateValue || isPastSelection()}
                >
                  OK
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }
);
DateTimePicker.displayName = "DateTimePicker";