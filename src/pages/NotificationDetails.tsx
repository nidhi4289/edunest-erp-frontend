import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/context/NotificationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Calendar, FileText, ArrowLeft, Trash2, CheckCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PushNotificationSchema } from '@capacitor/push-notifications';

// Extend the notification type to include the received timestamp
interface StoredNotification extends PushNotificationSchema {
  received?: string;
}

export default function NotificationDetails() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, clearAll, deleteNotification } = useNotifications();

  const getNotificationIcon = (notification: any) => {
    const title = notification.title?.toLowerCase() || '';
    const type = notification.data?.type?.toLowerCase() || '';
    
    if (title.includes('communication') || type === 'communication') {
      return <MessageSquare className="h-5 w-5 text-blue-600" />;
    }
    if (title.includes('assignedwork') || title.includes('homework') || type === 'homework') {
      return <FileText className="h-5 w-5 text-green-600" />;
    }
    if (title.includes('event') || type === 'event') {
      return <Calendar className="h-5 w-5 text-purple-600" />;
    }
    return <Bell className="h-5 w-5 text-gray-600" />;
  };

  const getNotificationColor = (notification: any) => {
    const title = notification.title?.toLowerCase() || '';
    const type = notification.data?.type?.toLowerCase() || '';
    
    if (title.includes('communication') || type === 'communication') {
      return 'border-l-blue-500 bg-blue-50';
    }
    if (title.includes('assignedwork') || title.includes('homework') || type === 'homework') {
      return 'border-l-green-500 bg-green-50';
    }
    if (title.includes('event') || type === 'event') {
      return 'border-l-purple-500 bg-purple-50';
    }
    return 'border-l-gray-500 bg-gray-50';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification: any) => {
    // Navigate based on notification data
    if (notification.data?.screen) {
      navigate(notification.data.screen);
    } else if (notification.title?.toLowerCase().includes('communication')) {
      navigate('/comms');
    } else if (notification.title?.toLowerCase().includes('assignedwork')) {
      navigate('/student/assigned-work');
    }
    
    // Mark as read when clicked
    markAsRead(notification.id);
  };

  // Debug Native Fetch handler removed

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notifications`}
        right={
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAll}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {/* Debug Native Fetch button removed */}
          </div>
        }
      />

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Notifications</h3>
              <p className="text-gray-500">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const storedNotification = notification as StoredNotification;
            return (
              <Card 
              key={notification.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${getNotificationColor(notification)} hover:scale-[1.02]`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getNotificationIcon(notification)}
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {formatDate(storedNotification.received)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4">{notification.body}</p>
                
                {/* Additional notification data */}
                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(notification.data).map(([key, value]) => {
                        // Skip technical fields
                        if (key === 'screen' || key === 'manual' || key === 'simulated') return null;
                        
                        return (
                          <div key={key} className="flex flex-col">
                            <span className="font-medium text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </span>
                            <span className="text-gray-800">{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Action buttons based on notification type */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {notification.data?.screen && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(notification.data.screen);
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
}