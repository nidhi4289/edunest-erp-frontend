import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, Bell } from "lucide-react";

interface Communication {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'announcement';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export default function Comms() {
  const { token } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunications();
    // eslint-disable-next-line
  }, []);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      const url = "http://localhost:5199/api/Communication?modifiedAfter=2025-07-01T00:00:00.000000Z&status=Active";
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to fetch communications");
      const data = await res.json();
      // Map status to isActive for UI compatibility
      setCommunications(
        data
          .filter((item: any) => item.status?.toLowerCase() === "active")
          .map((item: any) => ({
            ...item,
            isActive: true
          }))
      );
    } catch (error) {
      setCommunications([]);
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (type: string) => {
    return type === 'notice' ? Bell : MessageSquare;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <MessageSquare className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Communications</h1>
            <p className="text-white/80">Stay updated with latest notices and announcements</p>
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="space-y-4">
        {communications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Communications</h3>
              <p className="text-gray-500">There are no active communications at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          communications.map((comm) => {
            const IconComponent = getIcon(comm.type);
            return (
              <Card key={comm.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        comm.type === 'notice' 
                          ? 'bg-orange-100 text-orange-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{comm.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={comm.type === 'notice' ? 'default' : 'secondary'}>
                            {comm.type === 'notice' ? 'Notice' : 'Announcement'}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {formatDate(comm.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{comm.content}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardContent className="text-center py-6">
          <p className="text-sm text-gray-600">
            Communications are updated regularly. Check back for the latest notices and announcements.
          </p>
        </CardContent>
      </Card>
      </div>
  );
}