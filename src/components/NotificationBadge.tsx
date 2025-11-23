import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import { useNavigate } from "react-router-dom";

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
}

export function NotificationBadge({ onClick, className = "" }: NotificationBadgeProps) {
  const { unreadCount, clearAll, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleBellClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to notifications page
      navigate('/notifications');
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAll();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBellClick}
        className={`relative p-2 h-10 w-10 hover:bg-gray-100 ${className}`}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      
      {/* Clear All Button (appears when there are notifications) */}
      {unreadCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="absolute -top-2 -right-2 p-1 h-6 w-6 bg-gray-600 hover:bg-gray-700 rounded-full"
          title="Clear all notifications"
        >
          <X className="h-3 w-3 text-white" />
        </Button>
      )}
    </div>
  );
}