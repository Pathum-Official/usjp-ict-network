"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Check, X, Users, Activity, Briefcase, Cake } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

export function UserManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [comboFilter, setComboFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");

  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [combinations, setCombinations] = useState<{id: string, name: string}[]>([]);

  const fetchUsersAndCombos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList: User[] = [];
      querySnapshot.forEach((doc) => {
        const u = { uid: doc.id, ...doc.data() } as User;
        if (isSuperAdmin) {
          usersList.push(u);
        } else if (u.cohortId === user?.cohortId) {
          usersList.push(u);
        }
      });
      setUsers(usersList);
      
      const comboSnap = await getDocs(collection(db, "combinations"));
      const comboList: {id: string, name: string}[] = [];
      comboSnap.forEach(c => comboList.push({ id: c.id, name: c.data().name }));
      setCombinations(comboList.sort((a,b) => a.name.localeCompare(b.name)));
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCombos();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected' | 'banned') => {
    try {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
      setUsers(users.map(u => u.uid === userId ? { ...u, status: newStatus } : u));
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", editUser.uid), { ...editUser });
      setUsers(users.map(u => u.uid === editUser.uid ? editUser : u));
      toast.success("User updated successfully");
      setEditUser(null);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  // Derived Analytics
  const approvedUsers = users.filter(u => u.status === 'approved');
  const pendingOrRejectedUsers = users.filter(u => u.status === 'pending' || u.status === 'rejected' || u.status === 'banned');
  
  let profileFieldsCount = 0;
  const totalProfileFields = approvedUsers.length * 6; // checking 6 key fields
  let employedCount = 0;

  approvedUsers.forEach(u => {
    if (u.phone) profileFieldsCount++;
    if (u.address) profileFieldsCount++;
    if (u.dob) profileFieldsCount++;
    if (u.school) profileFieldsCount++;
    if (u.combination) profileFieldsCount++;
    if (u.photoURL) profileFieldsCount++;
    if (u.jobCompany || u.jobPosition) employedCount++;
  });

  const completionRate = totalProfileFields === 0 ? 0 : Math.round((profileFieldsCount / totalProfileFields) * 100);

  // Compute Combination Stats for Pie Chart
  const comboCounts: Record<string, number> = {};
  approvedUsers.forEach(u => {
    const combo = u.combination || "Not Specified";
    comboCounts[combo] = (comboCounts[combo] || 0) + 1;
  });
  
  const pieData = Object.keys(comboCounts).map(key => ({
    name: key,
    value: comboCounts[key]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Compute Upcoming Birthdays
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate day diff

  const upcomingBirthdays = approvedUsers
    .filter(u => u.dob)
    .map(u => {
      const dobParts = u.dob!.split('-'); // Expected format YYYY-MM-DD
      if (dobParts.length !== 3) return null;
      
      const month = parseInt(dobParts[1]) - 1;
      const day = parseInt(dobParts[2]);
      
      const nextBday = new Date(today.getFullYear(), month, day);
      if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }
      
      const daysUntil = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...u, daysUntil, nextBday, bdayStr: `${dobParts[1]}-${dobParts[2]}` };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
    .slice(0, 5); // Show top 5 upcoming

  // Filters for table
  const filteredUsers = approvedUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          (u.regNo || "").toLowerCase().includes(search.toLowerCase());
    const matchesCombo = comboFilter === "all" || (u.combination || "").toLowerCase().includes(comboFilter.toLowerCase());
    const matchesBatch = batchFilter === "all" || u.cohortId === batchFilter;
    return matchesSearch && matchesCombo && matchesBatch;
  });

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading users...</div>;

  return (
    <div className="space-y-8">
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Approved Students</p>
              <h3 className="text-2xl font-bold mt-2">{approvedUsers.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Profile Completion</p>
              <h3 className="text-2xl font-bold mt-2">{completionRate}%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employed Students</p>
              <h3 className="text-2xl font-bold mt-2">{employedCount}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts & Lists Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Analytics Pie Chart */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Combination Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Students`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-500" />
              Upcoming Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No birthdays found
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBirthdays.map((u: any, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.name} className="w-10 h-10 rounded-full object-cover bg-muted" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm leading-none">{u.name}</p>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                          <span>{u.bdayStr}</span>
                          <span>•</span>
                          <span>{u.combination || "No Combo"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={u.daysUntil === 0 ? "default" : "secondary"} className={u.daysUntil === 0 ? "bg-pink-500 hover:bg-pink-600" : ""}>
                        {u.daysUntil === 0 ? "Today! 🎉" : `${u.daysUntil} days`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending & Rejected Users */}
      {pendingOrRejectedUsers.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending & Rejected / Banned Users 
              <Badge variant="secondary" className="bg-warning text-warning-foreground">{pendingOrRejectedUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Reg No</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrRejectedUsers.map((u) => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.regNo || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{u.cohortId.toUpperCase()}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          u.status === 'banned' || u.status === 'rejected' 
                            ? "bg-destructive text-destructive-foreground" 
                            : "bg-muted text-muted-foreground"
                        }>
                          {u.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(!isSuperAdmin && u.role === 'super_admin') ? null : (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => handleStatusChange(u.uid, 'approved')} className="bg-emerald-600 hover:bg-emerald-700">
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            {u.status === 'pending' && (
                              <Button size="sm" variant="destructive" onClick={() => handleStatusChange(u.uid, 'rejected')}>
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Directory Table */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Approved Users</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={comboFilter} onValueChange={(v) => setComboFilter(v || "all")}>
              <SelectTrigger className="h-9 w-full md:w-[180px]">
                <SelectValue placeholder="All Combinations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Combinations</SelectItem>
                {combinations.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isSuperAdmin && (
              <Select value={batchFilter} onValueChange={(v) => setBatchFilter(v || "all")}>
                <SelectTrigger className="h-9 w-full md:w-[130px]">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="ict-2022">ICT 2022</SelectItem>
                  <SelectItem value="ict-2023">ICT 2023</SelectItem>
                  <SelectItem value="ict-2024">ICT 2024</SelectItem>
                  <SelectItem value="ict-2025">ICT 2025</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reg No</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No users found.</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.uid}>
                    <TableCell className="font-medium">
                      <span className="cursor-pointer hover:underline text-primary" onClick={() => setViewUser(u)}>
                        {u.name}
                      </span>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.regNo || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{u.cohortId.toUpperCase()}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {u.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(!isSuperAdmin && u.role === 'super_admin') ? null : (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditUser({...u})}>
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger>
                              <div className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                                <X className="h-4 w-4 text-destructive hover:text-red-700" />
                              </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ban User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to ban {u.name}? This will revoke their access to the platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive" onClick={() => handleStatusChange(u.uid, 'banned')}>Ban</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User: {editUser.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Reg No</Label>
                <Input value={editUser.regNo || ''} onChange={e => setEditUser({...editUser, regNo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                  <Select value={editUser.role} onValueChange={(val: any) => setEditUser({...editUser, role: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="rep">Batch Rep</SelectItem>
                      <SelectItem value="academic_rep">Academic Rep</SelectItem>
                      <SelectItem value="treasurer">Treasurer</SelectItem>
                      <SelectItem value="media_rep">Media Rep</SelectItem>
                      {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <Label>Cohort</Label>
                <Select value={editUser.cohortId} onValueChange={(val) => val && setEditUser({...editUser, cohortId: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ict-2022">ICT 2022</SelectItem>
                    <SelectItem value="ict-2023">ICT 2023</SelectItem>
                    <SelectItem value="ict-2024">ICT 2024</SelectItem>
                    <SelectItem value="ict-2025">ICT 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Combination</Label>
                <Select value={editUser.combination || ''} onValueChange={(val) => setEditUser({...editUser, combination: val || undefined})}>
                  <SelectTrigger><SelectValue placeholder="Select Combination" /></SelectTrigger>
                  <SelectContent>
                    {combinations.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>School</Label>
                <Input value={editUser.school || ''} onChange={e => setEditUser({...editUser, school: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editUser.phone || ''} onChange={e => setEditUser({...editUser, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Account Status</Label>
                <Select value={editUser.status || 'pending'} onValueChange={(val: any) => val && setEditUser({...editUser, status: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Profile View Modal */}
      {viewUser && (
        <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 border-b pb-4">
                {viewUser.photoURL ? (
                  <img src={viewUser.photoURL} alt={viewUser.name} className="w-16 h-16 rounded-full object-cover bg-muted" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
                    {viewUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{viewUser.name}</h3>
                  <p className="text-muted-foreground">{viewUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reg No</p>
                  <p className="font-medium">{viewUser.regNo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cohort</p>
                  <Badge variant="outline">{viewUser.cohortId.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="secondary" className="text-xs">{viewUser.role.replace('_', ' ').toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Combination</p>
                  <p className="font-medium">{viewUser.combination || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone / WhatsApp</p>
                  <p className="font-medium">{viewUser.phone || '-'} {viewUser.whatsapp ? ` / ${viewUser.whatsapp}` : ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">School</p>
                  <p className="font-medium">{viewUser.school || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{viewUser.dob || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Employment</p>
                  <p className="font-medium">
                    {viewUser.jobPosition && viewUser.jobCompany 
                      ? `${viewUser.jobPosition} at ${viewUser.jobCompany}` 
                      : (viewUser.jobPosition || viewUser.jobCompany || '-')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Home Address</p>
                  <p className="font-medium">{viewUser.address || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Current / Boarding Address</p>
                  <p className="font-medium">{viewUser.currentAddress || '-'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
