import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Edit, Trash2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Communication {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'announcement';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  modifiedBy?: string;
}

interface PostResult {
  success: boolean;
  message: string;
}

const API_BASE = `${import.meta.env.VITE_API_URL}/api/Communication`;

export default function ManageComms() {
  const { userGuid, token } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<'notice' | 'announcement'>('notice');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<PostResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCommunications();
    // eslint-disable-next-line
  }, []);

  const loadCommunications = async () => {
    try {
      const res = await fetch(API_BASE, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to fetch communications");
      const data = await res.json();
      setCommunications(
        data.map((item: any) => ({
          ...item,
          isActive: item.status?.toLowerCase() === "active"
        }))
      );
    } catch (error) {
      setCommunications([]);
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
      const commDto = {
        title: title.trim(),
        content: content.trim(),
        type,
        isActive: true,
        createdBy: userGuid || "",
        modifiedBy: userGuid || ""
      };

      let response, result;
      if (editingId) {
        response = await fetch(`${API_BASE}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(commDto)
        });
        result = await response.json();
      } else {
        response = await fetch(API_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(commDto)
        });
        result = await response.json();
      }

      if (!response.ok) throw new Error(result.message || "Failed to save communication");

      setPostResult({
        success: true,
        message: editingId ? "Communication updated successfully" : "Communication posted successfully"
      });

      setTitle("");
      setContent("");
      setType('notice');
      setEditingId(null);
      loadCommunications();
    } catch (error: any) {
      setPostResult({
        success: false,
        message: error.message || "Failed to post communication. Please try again."
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
      const comm = communications.find(c => c.id === id);
      if (!comm) return;
      const updatedComm = { ...comm, isActive: !comm.isActive, modifiedBy: userGuid || "" };
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedComm)
      });
      if (!response.ok) throw new Error("Failed to update status");
      loadCommunications();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this communication?")) return;
    try {
      const response = await fetch(`${API_BASE}/${id}`, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error("Failed to delete communication");
      loadCommunications();
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