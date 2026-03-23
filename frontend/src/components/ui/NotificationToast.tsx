import { useEffect } from "react";
import { useLabStore } from "../../stores/labStore";

export default function NotificationToast() {
  const notification = useLabStore((s) => s.notification);
  const clearNotification = useLabStore((s) => s.clearNotification);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(clearNotification, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  if (!notification) return null;

  return (
    <div className="fixed top-16 right-4 z-50 bg-gray-800 border border-gray-600 text-gray-200 text-xs px-4 py-2 rounded-lg shadow-xl max-w-sm animate-in fade-in slide-in-from-top-2">
      {notification}
    </div>
  );
}
