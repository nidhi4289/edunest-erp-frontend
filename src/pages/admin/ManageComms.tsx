import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Edit, Trash2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { api } from "@/services/api"; // Commented out since backend not present

interface Communication {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'announcement';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

interface PostResult {
  success: boolean;
  message: string;
}

export default function ManageComms() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<'notice' | 'announcement'>('notice');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<PostResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mock data for testing
  const mockComms: Communication[] = [
    {
      id: "1",
      title: "School Reopening Notice",
      content: "Dear Students and Parents, We are pleased to announce that school will reopen on January 20th, 2024. Please ensure all students arrive on time.",
      type: "notice",
      isActive: true,
      createdAt: "2024-01-15T10:30:00Z",
      createdBy: "Admin"
    },
    {
      id: "2",
      title: "Annual Sports Day",
      content: "We are excited to announce our Annual Sports Day scheduled for February 15th, 2024. All students are encouraged to participate.",
      type: "announcement",
      isActive: true,
      createdAt: "2024-01-14T14:20:00Z",
      createdBy: "Admin"
    },
    {
      id: "3",
      title: "Fee Payment Reminder",
      content: "This is a reminder that the monthly fees for January 2024 are due by January 25th. Please make payment to avoid late fees.",
      type: "notice",
      isActive: false,
      createdAt: "2024-01-10T09:15:00Z",
      createdBy: "Admin"
    }
  ];

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    try {
      /* 
      // Backend API call - Commented out until backend is ready
      const response = await api.get('/admin/communications');
      setCommunications(response.data.communications);
      */

      // Mock data for now
      setCommunications(mockComms);
    } catch (error) {
      console.error('Error loading communications:', error);
    }
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      setPostResult({
        success: false,
        message: "Please fill in both title and content"
      });
      return;
    }

    setPosting(true);
    setPostResult(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newComm: Communication = {
        id: editingId || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        type,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: "Admin"
      };

      /* 
      // Backend API call - Commented out until backend is ready
      if (editingId) {
        const response = await api.put(`/admin/communications/${editingId}`, newComm);
      } else {
        const response = await api.post('/admin/communications', newComm);
      }
      */

      // Mock success response
      if (editingId) {
        setCommunications(prev => 
          prev.map(comm => comm.id === editingId ? newComm : comm)
        );
        setPostResult({
          success: true,
          message: "Communication updated successfully"
        });
      } else {
        setCommunications(prev => [newComm, ...prev]);
        setPostResult({
          success: true,
          message: "Communication posted successfully"
        });
      }

      // Clear form
      setTitle("");
      setContent("");
      setType('notice');
      setEditingId(null);

    } catch (error: any) {
      setPostResult({
        success: false,
        message: "Failed to post communication. Please try again."
      });
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = (comm: Communication) => {
    setTitle(comm.title);
    setContent(comm.content);
    setType(comm.type);
    setEditingId(comm.id);
    setPostResult(null);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      /* 
      // Backend API call - Commented out until backend is ready
      await api.patch(`/admin/communications/${id}/toggle-status`);
      */

      setCommunications(prev =>
        prev.map(comm =>
          comm.id === id ? { ...comm, isActive: !comm.isActive } : comm
        )
      );
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this communication?")) return;

    try {
      /* 
      // Backend API call - Commented out until backend is ready
      await api.delete(`/admin/communications/${id}`);
      */

      setCommunications(prev => prev.filter(comm => comm.id !== id));
    } catch (error) {
      console.error('Error deleting communication:', error);
    }
  };

  const cancelEdit = () => {
    setTitle("");
    setContent("");
    setType('notice');
    setEditingId(null);
    setPostResult(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <MessageSquare className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manage Communications</h1>
            <p className="text-white/80">Post notices and announcements for students and staff</p>
          </div>
        </div>
      </div>

      {/* Post New Communication */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Edit Communication" : "Post New Communication"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Title</label>
              <Input
                placeholder="Enter communication title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'notice' | 'announcement')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="notice">Notice</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Content</label>
            <Textarea
              placeholder="Enter the communication content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handlePost}
              disabled={posting || !title.trim() || !content.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-600"
            >
              <Send className="h-4 w-4 mr-2" />
              {posting ? "Posting..." : editingId ? "Update Communication" : "Post Communication"}
            </Button>
            
            {editingId && (
              <Button 
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Post Result */}
      {postResult && (
        <Alert className={postResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-center gap-2">
            {postResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={postResult.success ? "text-green-800" : "text-red-800"}>
              {postResult.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Communications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Communications ({communications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communications.map((comm) => (
                <TableRow key={comm.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{comm.title}</p>
                      <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                        {comm.content}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={comm.type === 'notice' ? 'default' : 'secondary'}>
                      {comm.type === 'notice' ? 'Notice' : 'Announcement'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={comm.isActive ? 'default' : 'outline'}>
                      {comm.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(comm.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(comm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(comm.id)}
                      >
                        {comm.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comm.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {communications.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No communications posted yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}