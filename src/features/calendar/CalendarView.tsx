import { useState, useMemo } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { useNoteStore } from "../../stores/noteStore";
import { useUiStore } from "../../stores/uiStore";
import { getDaysInMonth, getFirstDayOfMonth, formatDate } from "../../lib/date";

export function CalendarView() {
  const { notes } = useNoteStore();
  const { setEditingNoteId, setCurrentPage } = useUiStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build a map of date → notes
  const notesByDate = useMemo(() => {
    const map: Record<string, typeof notes> = {};
    for (const note of notes) {
      const date = formatDate(note.created_at);
      if (!map[date]) map[date] = [];
      map[date].push(note);
    }
    return map;
  }, [notes]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

  const today = formatDate(new Date().toISOString());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedNotes = selectedDate ? notesByDate[selectedDate] || [] : [];

  return (
    <AppShell title="日历" onBack={() => setCurrentPage("notes")}>
      <div className="p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-text-secondary hover:text-text p-1">&lt;</button>
          <h2 className="text-base font-semibold text-text dark:text-text-dark">
            {year} 年 {monthNames[month]}
          </h2>
          <button onClick={nextMonth} className="text-text-secondary hover:text-text p-1">&gt;</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
            <div key={d} className="text-center text-xs text-text-secondary py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasNotes = !!notesByDate[dateStr];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative p-2 text-center rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : isToday
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-card dark:hover:bg-card-dark text-text dark:text-text-dark"
                }`}
              >
                <span className="text-sm">{day}</span>
                {hasNotes && (
                  <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-primary"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected date notes */}
        {selectedDate && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-text-secondary mb-2">{selectedDate}</h3>
            {selectedNotes.length === 0 ? (
              <p className="text-sm text-text-secondary">当天没有笔记</p>
            ) : (
              <div className="space-y-2">
                {selectedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => { setEditingNoteId(note.id); }}
                    className="p-3 rounded-xl bg-card dark:bg-card-dark cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <h4 className="text-sm font-medium text-text dark:text-text-dark truncate">
                      {note.title || "无标题"}
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                      {note.content_preview || "暂无内容"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}