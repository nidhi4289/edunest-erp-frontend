import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, GraduationCap, UserCheck, Calendar, 
  TrendingUp, DollarSign, AlertTriangle, BookOpen,
  BarChart3, PieChart, RefreshCw, Target, School
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

// TypeScript interfaces based on your API response structure
interface DashboardSummary {
  totalActiveStudents: number;
  totalStudents: number;
  studentActivePercentage: number;
  totalActiveStaff: number;
  totalStaff: number;
  staffActivePercentage: number;
  currentMonthAttendancePercentage: number;
  schoolDaysThisMonth: number;
  studentsWithAttendance: number;
  todayAttendancePercentage: number;
  todayTotalMarked: number;
  totalFeeCollected: number;
  overallFeeCollectionPercentage: number;
  studentsWithFeeRecords: number;
  currentMonthFeeCollected: number;
  currentMonthStudentsPaid: number;
  currentMonthFeeTransactions: number;
  totalOutstandingFees: number;
  studentsWithOutstandingFees: number;
}

interface AttendanceTrend {
  date: string;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
  totalStudents: number;
}

interface ClassAttendance {
  className: string;
  grade: string;
  section: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

interface FeeCollectionTrend {
  date: string;
  totalCollected: number;
  numberOfTransactions: number;
  averageAmount: number;
}

interface ClassFeeSummary {
  className: string;
  grade: string;
  section: string;
  totalStudents: number;
  totalFeesExpected: number;
  totalFeesCollected: number;
  totalOutstanding: number;
  collectionPercentage: number;
}

interface OutstandingFees {
  className: string;
  grade: string;
  section: string;
  totalStudents: number;
  studentsWithOutstanding: number;
  totalOutstandingAmount: number;
  averageOutstanding: number;
}

interface DashboardData {
  summary: DashboardSummary;
  recentTrends: AttendanceTrend[];
  classAttendance: ClassAttendance[];
  feeCollectionTrends: FeeCollectionTrend[];
  classFeesSummary: ClassFeeSummary[];
  outstandingFees: OutstandingFees[];
}

export default function Dashboard() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceDays, setAttendanceDays] = useState("7");
  const [feeCollectionDays, setFeeCollectionDays] = useState("7");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [token, attendanceDays, feeCollectionDays]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the main dashboard endpoint first
      const response = await api.get('/api/Dashboard');
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    
    try {
      // Handle different date formats
      let date: Date;
      
      // Check if it's already a valid ISO string
      if (dateString.includes('T') || dateString.includes('Z')) {
        date = new Date(dateString);
      } 
      // Handle DD-MM-YYYY format
      else if (dateString.includes('-') && dateString.split('-').length === 3) {
        const parts = dateString.split('-');
        if (parts[2].length === 4) {
          // DD-MM-YYYY format
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          // YYYY-MM-DD format
          date = new Date(dateString);
        }
      }
      // Handle DD/MM/YYYY format
      else if (dateString.includes('/') && dateString.split('/').length === 3) {
        const parts = dateString.split('/');
        if (parts[2].length === 4) {
          // DD/MM/YYYY format
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          // MM/DD/YYYY format (less common)
          date = new Date(dateString);
        }
      }
      // Try direct parsing as fallback
      else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button 
              onClick={fetchDashboardData}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { summary, recentTrends, classAttendance, feeCollectionTrends, classFeesSummary, outstandingFees } = dashboardData;

  // Colors for charts
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // Format attendance trends data for chart
  const attendanceChartData = recentTrends?.map((trend, index) => {
    // Debug log to see the actual date format
    if (index === 0) {
      console.log('Attendance trend date format sample:', trend.date);
    }
    
    return {
      date: formatDate(trend.date),
      attendance: trend.attendancePercentage || 0,
      present: trend.presentCount || 0,
      total: trend.totalStudents || 0,
      absent: trend.absentCount || 0
    };
  }).filter(item => item.date !== 'Invalid Date') || [];

  // Format fee collection trends for chart
  const feeChartData = feeCollectionTrends?.map((trend, index) => {
    // Debug log to see the actual date format
    if (index === 0) {
      console.log('Fee trend date format sample:', trend.date);
    }
    
    return {
      date: formatDate(trend.date),
      amount: trend.totalCollected || 0,
      transactions: trend.numberOfTransactions || 0,
      avgAmount: trend.averageAmount || 0
    };
  }).filter(item => item.date !== 'Invalid Date') || [];

  // Top 8 classes by attendance
  const topAttendanceClasses = classAttendance
    ?.sort((a, b) => b.attendancePercentage - a.attendancePercentage)
    .slice(0, 8)
    .map(cls => ({
      name: `${cls.grade}-${cls.section}`,
      attendance: cls.attendancePercentage,
      present: cls.presentCount,
      total: cls.totalStudents
    })) || [];

  // Fee collection by class (top 8)
  const classFeeData = classFeesSummary
    ?.sort((a, b) => b.totalFeesCollected - a.totalFeesCollected)
    .slice(0, 8)
    .map(cls => ({
      name: `${cls.grade}-${cls.section}`,
      collected: cls.totalFeesCollected,
      outstanding: cls.totalOutstanding,
      total: cls.totalFeesExpected,
      percentage: cls.collectionPercentage
    })) || [];

  // Outstanding fees pie chart data
  const outstandingFeesData = outstandingFees
    ?.sort((a, b) => b.totalOutstandingAmount - a.totalOutstandingAmount)
    .slice(0, 6)
    .map((cls, index) => ({
      name: `${cls.grade}-${cls.section}`,
      value: cls.totalOutstandingAmount,
      color: colors[index % colors.length],
      students: cls.studentsWithOutstanding
    })) || [];

  // Collection efficiency data
  const collectionEfficiency = summary?.totalFeeCollected && summary?.totalOutstandingFees 
    ? ((summary.totalFeeCollected / (summary.totalFeeCollected + summary.totalOutstandingFees)) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleString('en-IN')}</span>
          </div>
        </div>
        <Button 
          onClick={refreshDashboard} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GraduationCap className="h-4 w-4 mr-2" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalStudents?.toLocaleString() || 0}</div>
            <p className="text-xs opacity-80">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Staff Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalStaff || 0}</div>
            <p className="text-xs opacity-80">Teaching & non-teaching</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Avg. Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.currentMonthAttendancePercentage?.toFixed(1) || 0}%</div>
            <p className="text-xs opacity-80">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Fee Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalFeeCollected || 0)}</div>
            <p className="text-xs opacity-80">Total collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Attendance Trends
              </CardTitle>
              <Select value={attendanceDays} onValueChange={setAttendanceDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'attendance') return [`${value}%`, 'Attendance'];
                    return [value, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Fee Collection Trends
              </CardTitle>
              <Select value={feeCollectionDays} onValueChange={setFeeCollectionDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={feeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'amount') return [formatCurrency(value), 'Amount Collected'];
                    if (name === 'transactions') return [value, 'Transactions'];
                    return [value, name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Class Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Top Classes by Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topAttendanceClasses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Attendance']}
                />
                <Bar dataKey="attendance" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Outstanding Fees Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Outstanding Fees by Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={outstandingFeesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {outstandingFeesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Outstanding Amount']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Class Fee Collection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Class-wise Fee Collection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={classFeeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  const labels: { [key: string]: string } = {
                    collected: 'Collected',
                    outstanding: 'Outstanding',
                    total: 'Total Fees'
                  };
                  return [formatCurrency(value), labels[name] || name];
                }}
              />
              <Legend />
              <Bar dataKey="collected" stackId="a" fill="#10B981" name="Collected" />
              <Bar dataKey="outstanding" stackId="a" fill="#EF4444" name="Outstanding" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700">Outstanding Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {formatCurrency(summary?.totalOutstandingFees || 0)}
            </div>
            <p className="text-xs text-orange-600">Pending collections</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-indigo-700">Active Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-800">
              {classAttendance?.length || 0}
            </div>
            <p className="text-xs text-indigo-600">Running classes</p>
          </CardContent>
        </Card>

        <Card className="border-pink-200 bg-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-pink-700">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-800">
              {collectionEfficiency.toFixed(1)}%
            </div>
            <p className="text-xs text-pink-600">Fee collection efficiency</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-700">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">
              {summary?.todayTotalMarked || 0}/{summary?.totalStudents || 0}
            </div>
            <p className="text-xs text-emerald-600">Present/Total students</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
